'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { AtmosphereOuterShader, EarthSurfaceShader } from './AtmosphereShader';
import { generateProceduralEarthTextures } from './EarthTextures';
import { WindParticleSystem } from './WindParticleSystem';
import { WeatherScalarLayer } from './ScalarFieldLayer';
import { GlobeSettings, Coordinate } from '../../types/weather';

interface WeatherGlobeProps {
  settings: GlobeSettings;
  selectedCoordinate: Coordinate | null;
  onSelectCoordinate: (coord: Coordinate) => void;
  onHoverCoordinate?: (coord: Coordinate | null) => void;
}

export const WeatherGlobe: React.FC<WeatherGlobeProps> = ({
  settings,
  onSelectCoordinate,
  onHoverCoordinate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  const earthMeshRef = useRef<THREE.Mesh | null>(null);
  const cloudsMeshRef = useRef<THREE.Mesh | null>(null);
  const atmosphereRef = useRef<THREE.Mesh | null>(null);
  const windSystemRef = useRef<WindParticleSystem | null>(null);
  const scalarLayerRef = useRef<WeatherScalarLayer | null>(null);
  const sunLightRef = useRef<THREE.DirectionalLight | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      1,
      2000
    );
    camera.position.set(0, 35, 255);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 100% Free OrbitControls - Stays exactly where user moves it
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.8;
    controls.zoomSpeed = 1.1;
    controls.minDistance = 115;
    controls.maxDistance = 550;
    controls.autoRotate = settings.autoRotate;
    controls.autoRotateSpeed = settings.autoRotateSpeed;
    controlsRef.current = controls;

    // Deep Space Starfield (3,500 stars)
    const starGeo = new THREE.BufferGeometry();
    const starCount = 3500;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 900 + Math.random() * 500;

      const sinPhi = Math.sin(phi);
      starPositions[i * 3] = r * sinPhi * Math.cos(theta);
      starPositions[i * 3 + 1] = r * sinPhi * Math.sin(theta);
      starPositions[i * 3 + 2] = r * Math.cos(phi);

      const tint = 0.8 + Math.random() * 0.2;
      starColors[i * 3] = tint;
      starColors[i * 3 + 1] = tint * 0.95;
      starColors[i * 3 + 2] = 1.0;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 1.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
    });
    const starfield = new THREE.Points(starGeo, starMat);
    scene.add(starfield);

    // Earth Hierarchy Group
    const earthGroup = new THREE.Group();
    scene.add(earthGroup);

    // HIGH-SUBDIVISION SPHERE (128 x 128)
    const earthGeo = new THREE.SphereGeometry(100, 128, 128);

    // Load Real NASA Blue Marble Photographic Textures
    const textureLoader = new THREE.TextureLoader();
    const fallbackTextures = generateProceduralEarthTextures(2048, 1024);

    const earthMat = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(EarthSurfaceShader.uniforms),
      vertexShader: EarthSurfaceShader.vertexShader,
      fragmentShader: EarthSurfaceShader.fragmentShader,
    });

    earthMat.uniforms.dayTexture.value = fallbackTextures.dayTexture;
    earthMat.uniforms.nightTexture.value = fallbackTextures.nightTexture;
    earthMat.uniforms.specularMap.value = fallbackTextures.specularMap;
    earthMat.uniforms.bumpMap.value = fallbackTextures.bumpMap;

    const maxAniso = renderer.capabilities.getMaxAnisotropy();

    textureLoader.load('/textures/earth-blue-marble.jpg', (tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.anisotropy = maxAniso;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.generateMipmaps = true;
      earthMat.uniforms.dayTexture.value = tex;
      earthMat.needsUpdate = true;
    });

    textureLoader.load('/textures/earth-night.jpg', (tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.anisotropy = maxAniso;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.generateMipmaps = true;
      earthMat.uniforms.nightTexture.value = tex;
      earthMat.needsUpdate = true;
    });

    textureLoader.load('/textures/earth-water.png', (tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.anisotropy = maxAniso;
      earthMat.uniforms.specularMap.value = tex;
      earthMat.needsUpdate = true;
    });

    textureLoader.load('/textures/earth-topology.png', (tex) => {
      tex.wrapS = THREE.RepeatWrapping;
      tex.anisotropy = maxAniso;
      earthMat.uniforms.bumpMap.value = tex;
      earthMat.needsUpdate = true;
    });

    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthGroup.add(earthMesh);
    earthMeshRef.current = earthMesh;

    // Atmospheric Outer Rim Glow
    const atmosGeo = new THREE.SphereGeometry(102.5, 128, 128);
    const atmosMat = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.clone(AtmosphereOuterShader.uniforms),
      vertexShader: AtmosphereOuterShader.vertexShader,
      fragmentShader: AtmosphereOuterShader.fragmentShader,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    scene.add(atmosMesh);
    atmosphereRef.current = atmosMesh;

    // Atmospheric Clouds
    const cloudGeo = new THREE.SphereGeometry(101.0, 128, 128);
    const cloudCanvas = document.createElement('canvas');
    cloudCanvas.width = 1024;
    cloudCanvas.height = 512;
    const cctx = cloudCanvas.getContext('2d')!;
    cctx.fillStyle = 'rgba(0, 0, 0, 0)';
    cctx.fillRect(0, 0, 1024, 512);

    for (let i = 0; i < 65; i++) {
      const cx = Math.random() * 1024;
      const cy = 80 + Math.random() * 350;
      const rad = 30 + Math.random() * 65;
      const grad = cctx.createRadialGradient(cx, cy, 0, cx, cy, rad);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
      grad.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      cctx.fillStyle = grad;
      cctx.beginPath();
      cctx.arc(cx, cy, rad, 0, Math.PI * 2);
      cctx.fill();
    }
    const cloudTexture = new THREE.CanvasTexture(cloudCanvas);
    cloudTexture.wrapS = THREE.RepeatWrapping;

    const cloudMat = new THREE.MeshBasicMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const cloudsMesh = new THREE.Mesh(cloudGeo, cloudMat);
    earthGroup.add(cloudsMesh);
    cloudsMeshRef.current = cloudsMesh;

    // Weather Scalar Field Layer (NASA GIBS Satellite & Radar)
    const scalarLayer = new WeatherScalarLayer(100.3);
    earthGroup.add(scalarLayer.mesh);
    scalarLayerRef.current = scalarLayer;

    // Real Wind Streamline Particle System
    const windSystem = new WindParticleSystem(100.6, 8000);
    earthGroup.add(windSystem.mesh);
    windSystemRef.current = windSystem;

    // Directional Sun Lighting
    const sunLight = new THREE.DirectionalLight(0xffffff, 1.4);
    sunLight.position.set(250, 60, 200);
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    const ambientLight = new THREE.AmbientLight(0x223344, 0.3);
    scene.add(ambientLight);

    // Free Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Free user orbit controls - never overridden by forced camera lerping
      controls.update();

      if (cloudsMesh) {
        cloudsMesh.rotation.y += delta * 0.006;
      }

      if (windSystemRef.current && settings.showWindParticles) {
        windSystemRef.current.update(delta, settings.windParticleSpeed, camera.position);
      }

      if (scalarLayerRef.current) {
        scalarLayerRef.current.update(delta);
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Raycast Interaction (Free user sampling without moving camera)
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const getRaycastIntersection = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObject(earthMesh, false);
      if (intersects.length > 0) {
        const point = intersects[0].point;
        const localPoint = point.clone();
        earthGroup.worldToLocal(localPoint);

        const r = localPoint.length();
        const lat = 90 - Math.acos(localPoint.y / r) * (180 / Math.PI);
        const lon = ((Math.atan2(localPoint.z, -localPoint.x) * 180) / Math.PI) - 180;
        const normalizedLon = lon < -180 ? lon + 360 : lon > 180 ? lon - 360 : lon;

        return { lat, lon: normalizedLon };
      }
      return null;
    };

    let isDragging = false;
    let downX = 0;
    let downY = 0;

    const handlePointerDown = (e: MouseEvent) => {
      downX = e.clientX;
      downY = e.clientY;
      isDragging = false;
    };

    const handlePointerMove = (e: MouseEvent) => {
      if (Math.abs(e.clientX - downX) > 4 || Math.abs(e.clientY - downY) > 4) {
        isDragging = true;
      }
      if (onHoverCoordinate) {
        const coord = getRaycastIntersection(e);
        onHoverCoordinate(coord);
      }
    };

    const handlePointerUp = (e: MouseEvent) => {
      if (!isDragging) {
        const coord = getRaycastIntersection(e);
        if (coord) {
          onSelectCoordinate(coord);
        }
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', handlePointerDown);
    dom.addEventListener('mousemove', handlePointerMove);
    dom.addEventListener('mouseup', handlePointerUp);

    return () => {
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('mousedown', handlePointerDown);
      dom.removeEventListener('mousemove', handlePointerMove);
      dom.removeEventListener('mouseup', handlePointerUp);
      cancelAnimationFrame(animationFrameId);
      controls.dispose();
      renderer.dispose();
      starGeo.dispose();
      starMat.dispose();
      earthGeo.dispose();
      earthMat.dispose();
      atmosGeo.dispose();
      atmosMat.dispose();
      cloudGeo.dispose();
      cloudMat.dispose();
      windSystem.dispose();
      scalarLayer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Synchronize Settings
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = settings.autoRotate;
      controlsRef.current.autoRotateSpeed = settings.autoRotateSpeed;
    }

    if (earthMeshRef.current) {
      const mat = earthMeshRef.current.material as THREE.ShaderMaterial;
      if (mat.uniforms) {
        let themeVal = 0;
        if (settings.theme === 'dark-holo') themeVal = 1;
        else if (settings.theme === 'tactical-blue') themeVal = 2;
        mat.uniforms.themeMode.value = themeVal;
      }
    }

    if (atmosphereRef.current) {
      atmosphereRef.current.visible = settings.atmosphereGlow;
      const mat = atmosphereRef.current.material as THREE.ShaderMaterial;
      if (mat.uniforms) {
        mat.uniforms.glowIntensity.value = settings.atmosphereGlowIntensity;
      }
    }

    if (scalarLayerRef.current) {
      scalarLayerRef.current.setLayer(settings.activeLayer);
      scalarLayerRef.current.setOpacity(settings.layerOpacity);
      scalarLayerRef.current.setFrameIndex(settings.activeFrameIndex ?? 4);
    }

    if (windSystemRef.current) {
      windSystemRef.current.mesh.visible = settings.showWindParticles;
      windSystemRef.current.setOpacity(settings.layerOpacity);
    }
  }, [settings]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing select-none overflow-hidden"
    />
  );
};
