import * as THREE from 'three';
import { GlobalWeatherData, realWeatherGrid } from '../../services/realWeatherGridService';

interface WindParticle {
  lon: number; // degrees -180..180
  lat: number; // degrees -90..90
  speed: number; // km/h
  life: number; // 0..maxLife
  maxLife: number;
}

export class WindParticleSystem {
  public mesh: THREE.LineSegments;
  private particleCount: number;
  private radius: number;
  private particles: WindParticle[];
  private positions: Float32Array;
  private colors: Float32Array;
  private geometry: THREE.BufferGeometry;
  private material: THREE.LineBasicMaterial;
  private gridData: GlobalWeatherData | null = null;

  constructor(radius = 100.6, count = 8000) {
    this.radius = radius;
    this.particleCount = count;
    this.particles = [];

    this.positions = new Float32Array(count * 2 * 3);
    this.colors = new Float32Array(count * 2 * 3);

    this.initParticles();

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3));

    this.material = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      linewidth: 1.5,
      depthWrite: false,
    });

    this.mesh = new THREE.LineSegments(this.geometry, this.material);

    realWeatherGrid.getGlobalGrid().then((grid) => {
      this.gridData = grid;
    });
  }

  public setGridData(grid: GlobalWeatherData) {
    this.gridData = grid;
  }

  private initParticles() {
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        lon: (Math.random() - 0.5) * 360,
        lat: (Math.random() - 0.5) * 160,
        speed: 25,
        life: Math.random() * 80,
        maxLife: 60 + Math.random() * 80,
      });
    }
  }

  private lonLatToVector3(lon: number, lat: number, r: number): THREE.Vector3 {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    const x = -(r * Math.sin(phi) * Math.cos(theta));
    const z = r * Math.sin(phi) * Math.sin(theta);
    const y = r * Math.cos(phi);

    return new THREE.Vector3(x, y, z);
  }

  private getSpeedColor(speed: number): [number, number, number] {
    if (speed < 20) {
      const t = speed / 20;
      return [0.1 + t * 0.1, 0.5 + t * 0.3, 0.95];
    } else if (speed < 45) {
      const t = (speed - 20) / 25;
      return [0.2 + t * 0.6, 0.8 + t * 0.15, 0.8 - t * 0.6];
    } else if (speed < 80) {
      const t = (speed - 45) / 35;
      return [0.95 + t * 0.05, 0.7 - t * 0.4, 0.2];
    } else {
      const t = Math.min(1.0, (speed - 80) / 40);
      return [1.0, 0.2 + t * 0.3, 0.8 + t * 0.2];
    }
  }

  // Camera-Aware Update with Horizon / Back-Face Culling (Halves CPU & GPU processing costs)
  public update(deltaTime: number, speedMultiplier = 1.0, cameraPosition?: THREE.Vector3) {
    const posAttr = this.geometry.attributes.position as THREE.BufferAttribute;
    const colAttr = this.geometry.attributes.color as THREE.BufferAttribute;

    const dt = deltaTime * speedMultiplier * 0.3;

    // Precompute normalized camera direction vector
    let hasCam = false;
    let camNormX = 0, camNormY = 0, camNormZ = 0;
    if (cameraPosition) {
      const camLen = cameraPosition.length();
      if (camLen > 0.001) {
        camNormX = cameraPosition.x / camLen;
        camNormY = cameraPosition.y / camLen;
        camNormZ = cameraPosition.z / camLen;
        hasCam = true;
      }
    }

    for (let i = 0; i < this.particleCount; i++) {
      const p = this.particles[i];
      const idx = i * 6;

      // 1. FAST HORIZON / BACK-FACE CULLING CHECK
      // If particle normal points away from the camera, it is hidden behind the Earth sphere
      if (hasCam) {
        const phi = (90 - p.lat) * (Math.PI / 180);
        const theta = (p.lon + 180) * (Math.PI / 180);
        const sinPhi = Math.sin(phi);
        const nx = -sinPhi * Math.cos(theta);
        const ny = Math.cos(phi);
        const nz = sinPhi * Math.sin(theta);

        const dot = nx * camNormX + ny * camNormY + nz * camNormZ;

        // Particle is on the back-face / occluded hemisphere
        if (dot < -0.06) {
          // If particle was visible, zero out alpha so it doesn't render
          if (this.colors[idx] > 0 || this.colors[idx + 3] > 0) {
            this.colors[idx] = 0;
            this.colors[idx + 1] = 0;
            this.colors[idx + 2] = 0;
            this.colors[idx + 3] = 0;
            this.colors[idx + 4] = 0;
            this.colors[idx + 5] = 0;
          }

          // Advance lifetime cheaply and skip expensive grid interpolation and matrix math!
          p.life += deltaTime * 20 * speedMultiplier;
          if (p.life > p.maxLife) {
            p.lon = (Math.random() - 0.5) * 360;
            p.lat = (Math.random() - 0.5) * 160;
            p.life = 0;
          }
          continue; // SKIP rest of heavy processing for back hemisphere
        }
      }

      // 2. ACTIVE VISIBLE PARTICLES (Front Hemisphere)
      p.life += deltaTime * 28 * speedMultiplier;

      if (p.life > p.maxLife || Math.abs(p.lat) > 85) {
        p.lon = (Math.random() - 0.5) * 360;
        p.lat = (Math.random() - 0.5) * 160;
        p.life = 0;
        p.maxLife = 60 + Math.random() * 80;
      }

      const oldPos = this.lonLatToVector3(p.lon, p.lat, this.radius);

      let u = 0;
      let v = 0;
      if (this.gridData) {
        const sample = realWeatherGrid.interpolateAt(this.gridData, p.lon, p.lat);
        u = sample.u;
        v = sample.v;
        p.speed = sample.speed;
      } else {
        const absLat = Math.abs(p.lat);
        u = absLat > 25 && absLat < 65 ? 45 : -20;
        v = Math.sin((p.lon * Math.PI) / 90) * 8;
        p.speed = 30;
      }

      const cosLat = Math.max(0.15, Math.cos((p.lat * Math.PI) / 180));
      p.lon += (u / cosLat) * dt * 0.15;
      p.lat += v * dt * 0.15;

      if (p.lon > 180) p.lon -= 360;
      if (p.lon < -180) p.lon += 360;

      const newPos = this.lonLatToVector3(p.lon, p.lat, this.radius);

      // Head vertex
      this.positions[idx] = newPos.x;
      this.positions[idx + 1] = newPos.y;
      this.positions[idx + 2] = newPos.z;

      // Tail vertex
      this.positions[idx + 3] = oldPos.x;
      this.positions[idx + 4] = oldPos.y;
      this.positions[idx + 5] = oldPos.z;

      const lifeFraction = p.life / p.maxLife;
      const alpha = Math.sin(lifeFraction * Math.PI);
      const [r, g, b] = this.getSpeedColor(p.speed);

      // Head color
      this.colors[idx] = r * alpha * 1.4;
      this.colors[idx + 1] = g * alpha * 1.4;
      this.colors[idx + 2] = b * alpha * 1.4;

      // Tail color
      this.colors[idx + 3] = r * alpha * 0.35;
      this.colors[idx + 4] = g * alpha * 0.35;
      this.colors[idx + 5] = b * alpha * 0.35;
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  }

  public setOpacity(opacity: number) {
    this.material.opacity = opacity;
  }

  public dispose() {
    this.geometry.dispose();
    this.material.dispose();
  }
}
