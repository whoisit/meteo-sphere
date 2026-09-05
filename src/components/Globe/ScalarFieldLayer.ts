import * as THREE from 'three';
import { WeatherLayerType } from '../../types/weather';
import { 
  NasaGibsLayer, 
  getNasaTimeFrames, 
  nasaTextureManager,
  NasaTimeFrame
} from '../../services/nasaGibsService';
import { GlobalWeatherData, realWeatherGrid } from '../../services/realWeatherGridService';

export class WeatherScalarLayer {
  public mesh: THREE.Mesh;
  private material: THREE.MeshBasicMaterial;
  private currentLayer: WeatherLayerType = 'wind';
  private frames: NasaTimeFrame[];
  private activeFrameIndex = 4; // Latest by default
  private pressureCanvas: HTMLCanvasElement;
  private pressureCtx: CanvasRenderingContext2D;
  private pressureTexture: THREE.CanvasTexture;
  private gridData: GlobalWeatherData | null = null;
  private loading = false;

  constructor(radius = 100.3) {
    this.frames = getNasaTimeFrames();

    // Canvas for pressure isobars only (since pressure is a numerical scalar field)
    this.pressureCanvas = document.createElement('canvas');
    this.pressureCanvas.width = 1024;
    this.pressureCanvas.height = 512;
    this.pressureCtx = this.pressureCanvas.getContext('2d')!;
    this.pressureTexture = new THREE.CanvasTexture(this.pressureCanvas);
    this.pressureTexture.wrapS = THREE.RepeatWrapping;
    this.pressureTexture.wrapT = THREE.ClampToEdgeWrapping;

    this.material = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.88,
      blending: THREE.NormalBlending,
      depthWrite: false,
    });

    const geometry = new THREE.SphereGeometry(radius, 128, 64);
    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.visible = false;

    // Preload all NASA frames for precipitation and clouds
    nasaTextureManager.preloadFrames('precipitation', this.frames);
    nasaTextureManager.preloadFrames('clouds', this.frames);
    nasaTextureManager.preloadFrames('moisture', this.frames);
    nasaTextureManager.preloadFrames('temperature', this.frames);

    realWeatherGrid.getGlobalGrid().then((grid) => {
      this.gridData = grid;
      if (this.currentLayer === 'pressure') {
        this.renderPressure();
      }
    });
  }

  public setLayer(layer: WeatherLayerType) {
    this.currentLayer = layer;
    if (layer === 'wind') {
      this.mesh.visible = false;
    } else {
      this.mesh.visible = true;
      this.updateLayerTexture();
    }
  }

  public setFrameIndex(index: number) {
    const clamped = Math.max(0, Math.min(index, this.frames.length - 1));
    if (this.activeFrameIndex !== clamped) {
      this.activeFrameIndex = clamped;
      if (this.mesh.visible) {
        this.updateLayerTexture();
      }
    }
  }

  public setOpacity(opacity: number) {
    this.material.opacity = opacity;
  }

  private updateLayerTexture() {
    if (this.currentLayer === 'wind') return;

    if (this.currentLayer === 'pressure') {
      this.renderPressure();
      this.material.map = this.pressureTexture;
      this.material.needsUpdate = true;
      return;
    }

    const nasaLayer = this.toNasaLayer(this.currentLayer);
    if (!nasaLayer) return;

    const frame = this.frames[this.activeFrameIndex] || this.frames[this.frames.length - 1];
    const tex = nasaTextureManager.getTexture(nasaLayer, frame.dateStr, (loadedTex) => {
      if (this.currentLayer === this.toWeatherLayer(nasaLayer)) {
        this.material.map = loadedTex;
        this.material.needsUpdate = true;
      }
    });

    if (tex) {
      this.material.map = tex;
      this.material.needsUpdate = true;
    }
  }

  private toNasaLayer(layer: WeatherLayerType): NasaGibsLayer | null {
    switch (layer) {
      case 'precipitation': return 'precipitation';
      case 'clouds': return 'clouds';
      case 'humidity': return 'moisture';
      case 'temp': return 'temperature';
      default: return null;
    }
  }

  private toWeatherLayer(nasa: NasaGibsLayer): WeatherLayerType {
    switch (nasa) {
      case 'precipitation': return 'precipitation';
      case 'clouds': return 'clouds';
      case 'moisture': return 'humidity';
      case 'temperature': return 'temp';
      default: return 'clouds';
    }
  }

  // Clean, high-contrast Isobar contour lines for atmospheric pressure
  private renderPressure() {
    const ctx = this.pressureCtx;
    const w = this.pressureCanvas.width;
    const h = this.pressureCanvas.height;

    ctx.clearRect(0, 0, w, h);

    if (!this.gridData) return;

    const extremes = this.gridData.pressureExtremes;

    // Draw clean isobar rings and pressure indicators
    extremes.forEach((ext) => {
      const cx = ((ext.lon + 180) / 360) * w;
      const cy = ((90 - ext.lat) / 180) * h;

      for (let r = 1; r <= 3; r++) {
        ctx.beginPath();
        ctx.arc(cx, cy, r * 20, 0, Math.PI * 2);
        ctx.strokeStyle = ext.type === 'H' ? 'rgba(251, 191, 36, 0.75)' : 'rgba(244, 63, 94, 0.75)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      ctx.fillStyle = ext.type === 'H' ? '#38bdf8' : '#f43f5e';
      ctx.beginPath();
      ctx.arc(cx, cy, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ext.type, cx, cy);

      ctx.font = '11px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`${ext.pressure} hPa`, cx, cy + 18);
    });

    this.pressureTexture.needsUpdate = true;
  }

  public update(deltaTime: number) {
    // NASA satellite imagery is static per daily time frame, so zero unnecessary canvas redraw overhead!
  }

  public dispose() {
    this.material.dispose();
    this.mesh.geometry.dispose();
    this.pressureTexture.dispose();
  }
}
