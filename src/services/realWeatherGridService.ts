export interface GridPoint {
  lat: number;
  lon: number;
  temp: number; // Celsius
  pressure: number; // hPa
  windSpeed: number; // km/h
  windDirection: number; // degrees
  u: number; // eastward km/h
  v: number; // northward km/h
  humidity: number; // %
  precipitation: number; // mm
  hourly?: {
    temperature: number[];
    precipitation: number[];
    pressure: number[];
    windSpeed: number[];
    u: number[];
    v: number[];
  };
}

export interface PressureExtreme {
  type: 'H' | 'L';
  lat: number;
  lon: number;
  pressure: number;
}

export interface GlobalWeatherData {
  timestamp: string;
  points: GridPoint[];
  pressureExtremes: PressureExtreme[];
}

const LATITUDES = [-75, -50, -25, 0, 25, 50, 75];
const LONGITUDES = [-180, -150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150];

class RealWeatherGridService {
  private cache: GlobalWeatherData | null = null;
  private fetchPromise: Promise<GlobalWeatherData> | null = null;

  public async getGlobalGrid(): Promise<GlobalWeatherData> {
    if (this.cache) return this.cache;
    if (this.fetchPromise) return this.fetchPromise;

    this.fetchPromise = this.fetchFromOpenMeteo();
    return this.fetchPromise;
  }

  private async fetchFromOpenMeteo(): Promise<GlobalWeatherData> {
    const lats: number[] = [];
    const lons: number[] = [];

    for (const lat of LATITUDES) {
      for (const lon of LONGITUDES) {
        lats.push(lat);
        lons.push(lon);
      }
    }

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats.join(',')}&longitude=${lons.join(',')}&current=temperature_2m,surface_pressure,wind_speed_10m,wind_direction_10m,relative_humidity_2m&hourly=temperature_2m,precipitation,surface_pressure,wind_speed_10m,wind_direction_10m&forecast_days=2`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Open-Meteo grid returned ${res.status}`);
      const data = await res.json();

      const points: GridPoint[] = [];
      const rawList = Array.isArray(data) ? data : [data];

      for (let i = 0; i < rawList.length; i++) {
        const item = rawList[i];
        const cur = item.current || {};
        const hourly = item.hourly || {};
        const lat = lats[i];
        const lon = lons[i];

        const speed = cur.wind_speed_10m ?? 20;
        const dir = cur.wind_direction_10m ?? 0;
        const rad = (dir * Math.PI) / 180;
        const u = -speed * Math.sin(rad);
        const v = -speed * Math.cos(rad);

        // Precompute u and v arrays for hourly forecast
        let hourlyObj: GridPoint['hourly'] | undefined = undefined;
        if (hourly.wind_speed_10m && hourly.wind_direction_10m) {
          const count = hourly.wind_speed_10m.length;
          const uArr: number[] = new Array(count);
          const vArr: number[] = new Array(count);

          for (let h = 0; h < count; h++) {
            const hSpeed = hourly.wind_speed_10m[h] ?? speed;
            const hDir = hourly.wind_direction_10m[h] ?? dir;
            const hRad = (hDir * Math.PI) / 180;
            uArr[h] = -hSpeed * Math.sin(hRad);
            vArr[h] = -hSpeed * Math.cos(hRad);
          }

          hourlyObj = {
            temperature: hourly.temperature_2m || [],
            precipitation: hourly.precipitation || [],
            pressure: hourly.surface_pressure || [],
            windSpeed: hourly.wind_speed_10m || [],
            u: uArr,
            v: vArr,
          };
        }

        points.push({
          lat,
          lon,
          temp: cur.temperature_2m ?? 15,
          pressure: cur.surface_pressure ?? 1013.2,
          windSpeed: speed,
          windDirection: dir,
          u,
          v,
          humidity: cur.relative_humidity_2m ?? 60,
          precipitation: hourly.precipitation?.[0] ?? 0,
          hourly: hourlyObj,
        });
      }

      const pressureExtremes = this.findPressureExtremes(points, 0);

      this.cache = {
        timestamp: new Date().toISOString(),
        points,
        pressureExtremes,
      };

      return this.cache;
    } catch (err) {
      console.warn('Fallback to synthetic physics grid due to network:', err);
      return this.generateFallbackGrid();
    } finally {
      this.fetchPromise = null;
    }
  }

  // Find local minima (L) and maxima (H) in pressure for hourOffset
  public findPressureExtremes(points: GridPoint[], hourOffset = 0): PressureExtreme[] {
    const h = Math.min(Math.max(0, Math.round(hourOffset)), 47);
    const extremes: PressureExtreme[] = [];

    const sorted = [...points].sort((a, b) => {
      const pA = a.hourly?.pressure?.[h] ?? a.pressure;
      const pB = b.hourly?.pressure?.[h] ?? b.pressure;
      return pA - pB;
    });

    for (let i = 0; i < Math.min(3, sorted.length); i++) {
      const p = sorted[i].hourly?.pressure?.[h] ?? sorted[i].pressure;
      if (p < 1008) {
        extremes.push({
          type: 'L',
          lat: sorted[i].lat,
          lon: sorted[i].lon,
          pressure: Math.round(p),
        });
      }
    }

    for (let i = sorted.length - 1; i >= Math.max(0, sorted.length - 3); i--) {
      const p = sorted[i].hourly?.pressure?.[h] ?? sorted[i].pressure;
      if (p > 1018) {
        extremes.push({
          type: 'H',
          lat: sorted[i].lat,
          lon: sorted[i].lon,
          pressure: Math.round(p),
        });
      }
    }

    return extremes;
  }

  // Interpolate for any coordinate and any hour offset
  public interpolateAt(
    grid: GlobalWeatherData,
    lon: number,
    lat: number,
    hourOffset = 0
  ): { u: number; v: number; speed: number; temp: number; pressure: number; humidity: number; precipitation: number } {
    const h = Math.min(Math.max(0, Math.round(hourOffset)), 47);

    let totalWeight = 0;
    let uSum = 0;
    let vSum = 0;
    let tempSum = 0;
    let pSum = 0;
    let hSum = 0;
    let precipSum = 0;

    for (const pt of grid.points) {
      let dLon = Math.abs(lon - pt.lon);
      if (dLon > 180) dLon = 360 - dLon;
      const dLat = Math.abs(lat - pt.lat);
      const dist = Math.sqrt(dLon * dLon + dLat * dLat);

      const ptTemp = pt.hourly?.temperature?.[h] ?? pt.temp;
      const ptP = pt.hourly?.pressure?.[h] ?? pt.pressure;
      const ptU = pt.hourly?.u?.[h] ?? pt.u;
      const ptV = pt.hourly?.v?.[h] ?? pt.v;
      const ptSpeed = pt.hourly?.windSpeed?.[h] ?? pt.windSpeed;
      const ptPrecip = pt.hourly?.precipitation?.[h] ?? pt.precipitation;

      if (dist < 0.1) {
        return {
          u: ptU,
          v: ptV,
          speed: ptSpeed,
          temp: ptTemp,
          pressure: ptP,
          humidity: pt.humidity,
          precipitation: ptPrecip,
        };
      }

      const weight = 1.0 / Math.pow(dist, 2.5);
      totalWeight += weight;

      uSum += ptU * weight;
      vSum += ptV * weight;
      tempSum += ptTemp * weight;
      pSum += ptP * weight;
      hSum += pt.humidity * weight;
      precipSum += ptPrecip * weight;
    }

    const u = uSum / totalWeight;
    const v = vSum / totalWeight;
    const speed = Math.sqrt(u * u + v * v);

    return {
      u,
      v,
      speed,
      temp: tempSum / totalWeight,
      pressure: pSum / totalWeight,
      humidity: hSum / totalWeight,
      precipitation: precipSum / totalWeight,
    };
  }

  private generateFallbackGrid(): GlobalWeatherData {
    const points: GridPoint[] = [];
    for (const lat of LATITUDES) {
      for (const lon of LONGITUDES) {
        const absLat = Math.abs(lat);
        const u = absLat > 25 && absLat < 65 ? 45 : -20;
        const v = Math.sin((lon * Math.PI) / 90) * 8;
        const speed = Math.sqrt(u * u + v * v);
        points.push({
          lat,
          lon,
          temp: 30 - (absLat / 90) * 55,
          pressure: 1013 + Math.sin(lon * 0.05) * 12,
          windSpeed: speed,
          windDirection: 270,
          u,
          v,
          humidity: 60,
          precipitation: 0,
        });
      }
    }
    return {
      timestamp: new Date().toISOString(),
      points,
      pressureExtremes: [
        { type: 'H', lat: 35, lon: -30, pressure: 1028 },
        { type: 'L', lat: 60, lon: -20, pressure: 992 },
      ],
    };
  }
}

export const realWeatherGrid = new RealWeatherGridService();
