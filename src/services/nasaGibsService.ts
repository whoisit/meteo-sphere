import * as THREE from 'three';

export type NasaGibsLayer = 
  | 'clouds'
  | 'precipitation'
  | 'temperature'
  | 'moisture';

export interface NasaTimeFrame {
  index: number;
  label: string;
  dateStr: string;
}

// Generate the 5 most recent complete observation dates from NASA
export function getNasaTimeFrames(): NasaTimeFrame[] {
  const frames: NasaTimeFrame[] = [];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 4; i >= 0; i--) {
    const d = new Date();
    // Offset by 2 days minimum to ensure complete global composites are assembled by NASA
    d.setDate(d.getDate() - (2 + i));

    const dateStr = d.toISOString().split('T')[0];
    const month = monthNames[d.getMonth()];
    const day = d.getDate();
    const label = i === 0 ? 'Latest' : `${month} ${day}`;

    frames.push({
      index: 4 - i, // 0..4
      label,
      dateStr,
    });
  }

  return frames;
}

const NASA_LAYER_MAP: Record<NasaGibsLayer, { id: string; format: string }> = {
  clouds: {
    id: 'MODIS_Terra_CorrectedReflectance_TrueColor',
    format: 'image/jpeg',
  },
  precipitation: {
    id: 'IMERG_Precipitation_Rate',
    format: 'image/png',
  },
  temperature: {
    id: 'GHRSST_L4_MUR_Sea_Surface_Temperature',
    format: 'image/png',
  },
  moisture: {
    id: 'MODIS_Terra_Water_Vapor_5km_Day',
    format: 'image/png',
  },
};

export function getNasaGibsUrl(layer: NasaGibsLayer, dateStr: string): string {
  const config = NASA_LAYER_MAP[layer] || NASA_LAYER_MAP.clouds;
  const width = layer === 'moisture' ? 1024 : 2048;
  const height = layer === 'moisture' ? 512 : 1024;
  return `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS=${config.id}&SRS=EPSG:4326&BBOX=-180,-90,180,90&WIDTH=${width}&HEIGHT=${height}&FORMAT=${config.format}&TIME=${dateStr}`;
}

const CACHE_NAME = 'nasa-gibs-24h-v1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 Hours

async function getCachedImageUrl(url: string): Promise<string> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return url;
  }

  try {
    const cache = await caches.open(CACHE_NAME);
    const matched = await cache.match(url);

    if (matched) {
      const dateHeader = matched.headers.get('x-cached-at');
      const cachedTime = dateHeader ? new Date(dateHeader).getTime() : 0;
      const age = Date.now() - cachedTime;

      // If cached less than 24h ago, serve directly from disk cache
      if (age < CACHE_TTL_MS) {
        const blob = await matched.blob();
        return URL.createObjectURL(blob);
      }
      // If older than 24h, delete stale entry
      await cache.delete(url);
    }

    // Fetch once from NASA and persist into Cache API for 24h
    const res = await fetch(url);
    if (!res.ok) throw new Error(`NASA server returned status ${res.status}`);

    const blob = await res.blob();
    const headers = new Headers(res.headers);
    headers.set('x-cached-at', new Date().toISOString());

    const responseToCache = new Response(blob, {
      status: res.status,
      statusText: res.statusText,
      headers,
    });

    await cache.put(url, responseToCache);
    return URL.createObjectURL(blob);
  } catch (err) {
    console.warn('Persistent cache bypass, loading directly:', err);
    return url;
  }
}

export class NasaTextureManager {
  private cache: Map<string, THREE.Texture> = new Map();
  private inFlight: Map<string, Promise<THREE.Texture | null>> = new Map();
  private loader = new THREE.TextureLoader();

  public getTexture(
    layer: NasaGibsLayer,
    dateStr: string,
    onLoaded?: (tex: THREE.Texture) => void
  ): THREE.Texture | null {
    const key = `${layer}_${dateStr}`;
    if (this.cache.has(key)) {
      const existing = this.cache.get(key)!;
      if (onLoaded) onLoaded(existing);
      return existing;
    }

    if (this.inFlight.has(key)) {
      if (onLoaded) {
        this.inFlight.get(key)!.then((tex) => {
          if (tex) onLoaded(tex);
        });
      }
      return null;
    }

    const rawUrl = getNasaGibsUrl(layer, dateStr);

    const loadPromise = getCachedImageUrl(rawUrl).then((resolvedUrl) => {
      return new Promise<THREE.Texture | null>((resolve) => {
        this.loader.load(
          resolvedUrl,
          (tex) => {
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.ClampToEdgeWrapping;
            tex.minFilter = THREE.LinearMipmapLinearFilter;
            tex.magFilter = THREE.LinearFilter;
            tex.generateMipmaps = true;
            tex.anisotropy = 16;

            this.cache.set(key, tex);
            this.inFlight.delete(key);

            if (onLoaded) onLoaded(tex);
            resolve(tex);
          },
          undefined,
          (err) => {
            console.warn(`Failed loading NASA GIBS texture for ${key}:`, err);
            this.inFlight.delete(key);
            resolve(null);
          }
        );
      });
    });

    this.inFlight.set(key, loadPromise);
    return null;
  }

  public preloadFrames(layer: NasaGibsLayer, frames: NasaTimeFrame[]) {
    frames.forEach((f) => {
      this.getTexture(layer, f.dateStr);
    });
  }
}

export const nasaTextureManager = new NasaTextureManager();
