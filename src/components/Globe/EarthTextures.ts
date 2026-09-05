import * as THREE from 'three';

// Procedural Equirectangular Earth Textures
export interface EarthTextureSet {
  dayTexture: THREE.CanvasTexture;
  nightTexture: THREE.CanvasTexture;
  specularMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
}

// Major continental landmass polygons in equirectangular coordinates [-180..180, -90..90]
// mapped to canvas coordinates [0..width, 0..height]
interface LandShape {
  name: string;
  type: 'continent' | 'desert' | 'ice';
  points: [number, number][]; // [lon, lat]
}

const CONTINENTS: LandShape[] = [
  // North America
  {
    name: 'North America',
    type: 'continent',
    points: [
      [-168, 65], [-160, 71], [-130, 70], [-120, 76], [-90, 73], [-80, 62],
      [-64, 60], [-55, 48], [-66, 44], [-70, 42], [-76, 35], [-81, 25],
      [-88, 30], [-97, 26], [-97, 20], [-89, 18], [-83, 9], [-77, 8],
      [-80, 15], [-92, 16], [-105, 23], [-110, 31], [-117, 33], [-124, 40],
      [-125, 49], [-136, 58], [-150, 60], [-165, 60], [-168, 65]
    ],
  },
  // Greenland
  {
    name: 'Greenland',
    type: 'ice',
    points: [
      [-52, 60], [-40, 60], [-25, 70], [-18, 77], [-25, 82], [-45, 83],
      [-58, 82], [-73, 78], [-55, 70], [-52, 60]
    ],
  },
  // South America
  {
    name: 'South America',
    type: 'continent',
    points: [
      [-77, 8], [-72, 11], [-62, 10], [-50, 0], [-35, -5], [-35, -12],
      [-40, -22], [-48, -28], [-53, -33], [-58, -38], [-65, -45], [-68, -54],
      [-75, -50], [-73, -42], [-71, -30], [-76, -15], [-81, -5], [-77, 8]
    ],
  },
  // Europe
  {
    name: 'Europe',
    type: 'continent',
    points: [
      [-9, 36], [-9, 43], [0, 43], [-1, 47], [3, 51], [8, 55], [10, 58],
      [14, 55], [20, 55], [29, 60], [25, 70], [15, 68], [5, 62], [5, 53],
      [-4, 48], [-4, 43], [-9, 36]
    ],
  },
  // Scandinavia
  {
    name: 'Scandinavia',
    type: 'continent',
    points: [
      [5, 58], [12, 56], [18, 59], [28, 60], [31, 70], [24, 71],
      [15, 68], [6, 62], [5, 58]
    ],
  },
  // Africa
  {
    name: 'Africa',
    type: 'continent',
    points: [
      [-5, 36], [11, 37], [25, 32], [32, 31], [33, 28], [36, 22],
      [43, 13], [51, 12], [45, 2], [41, -4], [40, -11], [35, -20],
      [33, -28], [26, -34], [18, -34], [12, -22], [9, -10], [9, 4],
      [3, 6], [-10, 5], [-17, 15], [-17, 21], [-13, 28], [-5, 36]
    ],
  },
  // Sahara Desert Overlay
  {
    name: 'Sahara',
    type: 'desert',
    points: [
      [-13, 28], [10, 30], [30, 29], [33, 24], [35, 18], [25, 15],
      [10, 16], [-10, 18], [-15, 22], [-13, 28]
    ],
  },
  // Eurasia / Asia
  {
    name: 'Asia',
    type: 'continent',
    points: [
      [29, 60], [40, 67], [60, 70], [80, 73], [100, 76], [140, 72],
      [170, 68], [180, 65], [170, 60], [160, 54], [142, 50], [131, 43],
      [122, 38], [120, 30], [109, 20], [105, 10], [100, 1], [98, 10],
      [90, 22], [80, 13], [77, 8], [72, 20], [68, 24], [60, 25],
      [50, 30], [42, 37], [36, 36], [29, 41], [30, 47], [35, 52], [29, 60]
    ],
  },
  // Australia
  {
    name: 'Australia',
    type: 'continent',
    points: [
      [114, -22], [122, -18], [130, -13], [136, -12], [142, -11], [146, -15],
      [153, -28], [150, -37], [140, -38], [130, -32], [116, -35], [113, -26],
      [114, -22]
    ],
  },
  // Antarctica
  {
    name: 'Antarctica',
    type: 'ice',
    points: [
      [-180, -70], [-120, -72], [-60, -64], [-30, -75], [0, -70],
      [60, -67], [120, -66], [160, -72], [180, -70],
      [180, -90], [-180, -90]
    ],
  },
];

// Major city lights coordinates [lon, lat, size, intensity]
const CITY_LIGHTS: [number, number, number, number][] = [
  // US & Canada
  [-74, 40.7, 16, 1.0], // NYC
  [-87.6, 41.8, 12, 0.9], // Chicago
  [-118.2, 34, 15, 0.95], // LA
  [-122.4, 37.7, 10, 0.85], // SF
  [-95.3, 29.7, 11, 0.8], // Houston
  [-80.2, 25.7, 9, 0.8], // Miami
  [-79.3, 43.6, 10, 0.8], // Toronto
  [-75.1, 39.9, 8, 0.75], // Philly
  [-122.3, 47.6, 9, 0.8], // Seattle
  [-104.9, 39.7, 8, 0.7], // Denver
  [-77, 38.9, 10, 0.85], // DC

  // Europe
  [-0.1, 51.5, 16, 1.0], // London
  [2.3, 48.8, 14, 0.95], // Paris
  [13.4, 52.5, 10, 0.85], // Berlin
  [4.9, 52.3, 11, 0.9], // Amsterdam
  [-3.7, 40.4, 10, 0.8], // Madrid
  [12.5, 41.9, 9, 0.8], // Rome
  [37.6, 55.7, 14, 0.9], // Moscow
  [19.0, 47.5, 7, 0.7], // Budapest
  [21.0, 52.2, 8, 0.7], // Warsaw

  // Asia
  [139.7, 35.6, 20, 1.0], // Tokyo
  [135.5, 34.6, 14, 0.9], // Osaka
  [126.9, 37.5, 15, 0.95], // Seoul
  [121.4, 31.2, 18, 1.0], // Shanghai
  [116.4, 39.9, 17, 0.95], // Beijing
  [113.2, 23.1, 16, 0.95], // Guangzhou/Shenzhen
  [114.1, 22.3, 12, 0.9], // Hong Kong
  [100.5, 13.7, 12, 0.85], // Bangkok
  [103.8, 1.3, 11, 0.9], // Singapore
  [106.8, -6.2, 13, 0.85], // Jakarta
  [77.2, 28.6, 18, 0.95], // Delhi
  [72.8, 18.9, 17, 0.95], // Mumbai
  [80.2, 13.0, 12, 0.8], // Chennai
  [88.3, 22.5, 13, 0.8], // Kolkata

  // Middle East & Africa
  [55.3, 25.2, 14, 0.95], // Dubai
  [46.7, 24.7, 11, 0.85], // Riyadh
  [31.2, 30.0, 15, 0.9], // Cairo
  [3.3, 6.5, 12, 0.75], // Lagos
  [28.0, -26.2, 11, 0.8], // Johannesburg
  [18.4, -33.9, 9, 0.75], // Cape Town

  // South America & Oceania
  [-46.6, -23.5, 16, 0.95], // Sao Paulo
  [-43.1, -22.9, 13, 0.85], // Rio
  [-58.3, -34.6, 14, 0.85], // Buenos Aires
  [-70.6, -33.4, 10, 0.8], // Santiago
  [-77.0, -12.0, 11, 0.8], // Lima
  [-74.0, 4.7, 10, 0.8], // Bogota
  [151.2, -33.8, 13, 0.9], // Sydney
  [144.9, -37.8, 12, 0.85], // Melbourne
  [153.0, -27.4, 9, 0.75], // Brisbane
  [174.7, -36.8, 8, 0.7], // Auckland
];

function lonLatToXY(lon: number, lat: number, width: number, height: number): [number, number] {
  const x = ((lon + 180) / 360) * width;
  const y = ((90 - lat) / 180) * height;
  return [x, y];
}

export function generateProceduralEarthTextures(width = 2048, height = 1024): EarthTextureSet {
  // 1. DAY TEXTURE
  const dayCanvas = document.createElement('canvas');
  dayCanvas.width = width;
  dayCanvas.height = height;
  const dayCtx = dayCanvas.getContext('2d')!;

  // Oceanic Base: Deep Blue Gradient with Continental Shelf Shallows
  const oceanGradient = dayCtx.createLinearGradient(0, 0, 0, height);
  oceanGradient.addColorStop(0.0, '#102a45'); // Arctic blue
  oceanGradient.addColorStop(0.2, '#0c233c');
  oceanGradient.addColorStop(0.5, '#07182e'); // Deep Atlantic/Pacific
  oceanGradient.addColorStop(0.8, '#0c233c');
  oceanGradient.addColorStop(1.0, '#112d4a'); // Antarctic blue
  dayCtx.fillStyle = oceanGradient;
  dayCtx.fillRect(0, 0, width, height);

  // Subtle graticule grid lines (Latitude / Longitude)
  dayCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  dayCtx.lineWidth = 1;
  for (let lon = -180; lon <= 180; lon += 30) {
    const [x] = lonLatToXY(lon, 0, width, height);
    dayCtx.beginPath();
    dayCtx.moveTo(x, 0);
    dayCtx.lineTo(x, height);
    dayCtx.stroke();
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const [, y] = lonLatToXY(0, lat, width, height);
    dayCtx.beginPath();
    dayCtx.moveTo(0, y);
    dayCtx.lineTo(width, y);
    dayCtx.stroke();
  }

  // Draw Continents on Day Texture
  CONTINENTS.forEach(poly => {
    dayCtx.beginPath();
    poly.points.forEach(([lon, lat], i) => {
      const [x, y] = lonLatToXY(lon, lat, width, height);
      if (i === 0) dayCtx.moveTo(x, y);
      else dayCtx.lineTo(x, y);
    });
    dayCtx.closePath();

    if (poly.type === 'ice') {
      dayCtx.fillStyle = '#e2e8f0'; // Glacial Ice White
      dayCtx.fill();
      dayCtx.strokeStyle = 'rgba(203, 213, 225, 0.6)';
    } else if (poly.type === 'desert') {
      dayCtx.fillStyle = '#b48348'; // Desert Ochre
      dayCtx.fill();
    } else {
      // Natural Land Foliage / Continental Interior
      dayCtx.fillStyle = '#1e3a29'; // Deep evergreen/temperate green
      dayCtx.fill();
      dayCtx.lineWidth = 2.5;
      dayCtx.strokeStyle = '#2d5a3f'; // Coastal green highlight
      dayCtx.stroke();
    }
  });

  // Mountain ridge accents (Rockies, Andes, Himalayas)
  dayCtx.strokeStyle = 'rgba(163, 140, 115, 0.6)';
  dayCtx.lineWidth = 4;
  dayCtx.lineCap = 'round';
  // Himalayas
  dayCtx.beginPath();
  const [h1x, h1y] = lonLatToXY(75, 32, width, height);
  const [h2x, h2y] = lonLatToXY(95, 28, width, height);
  dayCtx.moveTo(h1x, h1y);
  dayCtx.lineTo(h2x, h2y);
  dayCtx.stroke();
  // Andes
  dayCtx.beginPath();
  const [a1x, a1y] = lonLatToXY(-72, 5, width, height);
  const [a2x, a2y] = lonLatToXY(-68, -50, width, height);
  dayCtx.moveTo(a1x, a1y);
  dayCtx.lineTo(a2x, a2y);
  dayCtx.stroke();

  // 2. NIGHT LIGHTS TEXTURE
  const nightCanvas = document.createElement('canvas');
  nightCanvas.width = width;
  nightCanvas.height = height;
  const nightCtx = nightCanvas.getContext('2d')!;

  // Pitch black base for dark side
  nightCtx.fillStyle = '#020408';
  nightCtx.fillRect(0, 0, width, height);

  // Faint continental outline on night side
  CONTINENTS.forEach(poly => {
    nightCtx.beginPath();
    poly.points.forEach(([lon, lat], i) => {
      const [x, y] = lonLatToXY(lon, lat, width, height);
      if (i === 0) nightCtx.moveTo(x, y);
      else nightCtx.lineTo(x, y);
    });
    nightCtx.closePath();
    nightCtx.fillStyle = '#030812';
    nightCtx.fill();
  });

  // Glowing city metropolitan clusters
  CITY_LIGHTS.forEach(([lon, lat, radius, intensity]) => {
    const [cx, cy] = lonLatToXY(lon, lat, width, height);
    const rad = (radius * width) / 2048;

    const radGrad = nightCtx.createRadialGradient(cx, cy, 0, cx, cy, rad * 2.2);
    radGrad.addColorStop(0, `rgba(255, 235, 170, ${intensity})`); // Core warm yellow
    radGrad.addColorStop(0.3, `rgba(245, 175, 65, ${intensity * 0.7})`); // Amber halo
    radGrad.addColorStop(0.7, `rgba(56, 189, 248, ${intensity * 0.25})`); // Sci-fi cyan periphery
    radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    nightCtx.fillStyle = radGrad;
    nightCtx.beginPath();
    nightCtx.arc(cx, cy, rad * 2.2, 0, Math.PI * 2);
    nightCtx.fill();

    // Hot center pin
    nightCtx.fillStyle = `rgba(255, 255, 255, ${intensity * 0.9})`;
    nightCtx.beginPath();
    nightCtx.arc(cx, cy, Math.max(1, rad * 0.3), 0, Math.PI * 2);
    nightCtx.fill();
  });

  // 3. SPECULAR TEXTURE (Ocean reflects, Land does not)
  const specCanvas = document.createElement('canvas');
  specCanvas.width = width;
  specCanvas.height = height;
  const specCtx = specCanvas.getContext('2d')!;

  // Oceans reflective white
  specCtx.fillStyle = '#ffffff';
  specCtx.fillRect(0, 0, width, height);

  // Land bodies matte black
  CONTINENTS.forEach(poly => {
    specCtx.beginPath();
    poly.points.forEach(([lon, lat], i) => {
      const [x, y] = lonLatToXY(lon, lat, width, height);
      if (i === 0) specCtx.moveTo(x, y);
      else specCtx.lineTo(x, y);
    });
    specCtx.closePath();
    specCtx.fillStyle = poly.type === 'ice' ? '#999999' : '#000000';
    specCtx.fill();
  });

  // 4. BUMP MAP (Elevation relief)
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = width;
  bumpCanvas.height = height;
  const bumpCtx = bumpCanvas.getContext('2d')!;

  bumpCtx.fillStyle = '#808080'; // Neutral elevation
  bumpCtx.fillRect(0, 0, width, height);

  CONTINENTS.forEach(poly => {
    bumpCtx.beginPath();
    poly.points.forEach(([lon, lat], i) => {
      const [x, y] = lonLatToXY(lon, lat, width, height);
      if (i === 0) bumpCtx.moveTo(x, y);
      else bumpCtx.lineTo(x, y);
    });
    bumpCtx.closePath();
    bumpCtx.fillStyle = poly.type === 'ice' ? '#a0a0a0' : '#888888';
    bumpCtx.fill();
  });

  // Convert to Three.js CanvasTextures
  const dayTex = new THREE.CanvasTexture(dayCanvas);
  dayTex.wrapS = THREE.RepeatWrapping;
  dayTex.wrapT = THREE.ClampToEdgeWrapping;

  const nightTex = new THREE.CanvasTexture(nightCanvas);
  nightTex.wrapS = THREE.RepeatWrapping;
  nightTex.wrapT = THREE.ClampToEdgeWrapping;

  const specTex = new THREE.CanvasTexture(specCanvas);
  specTex.wrapS = THREE.RepeatWrapping;
  specTex.wrapT = THREE.ClampToEdgeWrapping;

  const bumpTex = new THREE.CanvasTexture(bumpCanvas);
  bumpTex.wrapS = THREE.RepeatWrapping;
  bumpTex.wrapT = THREE.ClampToEdgeWrapping;

  return {
    dayTexture: dayTex,
    nightTexture: nightTex,
    specularMap: specTex,
    bumpMap: bumpTex,
  };
}
