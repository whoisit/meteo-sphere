import * as THREE from 'three';

// Atmospheric Rim Glow Shader (Outer Atmosphere)
export const AtmosphereOuterShader = {
  uniforms: {
    color: { value: new THREE.Color(0x38bdf8) }, // Light sky blue
    sunDirection: { value: new THREE.Vector3(1, 0.2, 0.8).normalize() },
    viewVector: { value: new THREE.Vector3() },
    glowIntensity: { value: 1.2 },
    glowPower: { value: 3.5 },
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vPosition = mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 color;
    uniform float glowIntensity;
    uniform float glowPower;
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vec3 viewDir = normalize(-vPosition);
      float intensity = pow(1.0 - dot(vNormal, viewDir), glowPower);
      intensity = smoothstep(0.0, 1.0, intensity) * glowIntensity;
      gl_FragColor = vec4(color, intensity);
    }
  `,
};

// Earth Surface Custom Shader (Atmospheric scattering, Night lights blend, Specular ocean)
export const EarthSurfaceShader = {
  uniforms: {
    dayTexture: { value: null as THREE.Texture | null },
    nightTexture: { value: null as THREE.Texture | null },
    bumpMap: { value: null as THREE.Texture | null },
    specularMap: { value: null as THREE.Texture | null },
    sunDirection: { value: new THREE.Vector3(1.0, 0.2, 0.8).normalize() },
    bumpScale: { value: 0.05 },
    nightLightIntensity: { value: 1.8 },
    atmosphereGlowColor: { value: new THREE.Color(0x60a5fa) },
    themeMode: { value: 0 }, // 0: realistic, 1: dark-holo, 2: tactical
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec3 vViewPosition;

    void main() {
      vUv = uv;
      vNormal = normalize(normalMatrix * normal);
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewPosition = -mvPosition.xyz;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform sampler2D dayTexture;
    uniform sampler2D nightTexture;
    uniform sampler2D bumpMap;
    uniform sampler2D specularMap;
    uniform vec3 sunDirection;
    uniform float nightLightIntensity;
    uniform vec3 atmosphereGlowColor;
    uniform int themeMode;

    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vWorldPosition;
    varying vec3 vViewPosition;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 sunDir = normalize(sunDirection);
      vec3 viewDir = normalize(vViewPosition);

      // Sun illumination dot product
      float sunDot = dot(normal, sunDir);
      
      // Soft day/night terminator transition
      float dayFactor = smoothstep(-0.15, 0.25, sunDot);
      float nightFactor = 1.0 - dayFactor;

      vec4 dayCol = texture2D(dayTexture, vUv);
      vec4 nightCol = texture2D(nightTexture, vUv);
      vec4 specMask = texture2D(specularMap, vUv);

      // Specular ocean reflection on the day side
      vec3 halfDir = normalize(sunDir + viewDir);
      float specStrength = pow(max(dot(normal, halfDir), 0.0), 32.0);
      vec3 specularColor = vec3(1.0, 0.95, 0.8) * specStrength * specMask.r * 1.5 * dayFactor;

      // Inner atmospheric Fresnel rim glow on Earth surface
      float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
      vec3 rimGlow = atmosphereGlowColor * fresnel * 0.8 * max(sunDot + 0.3, 0.1);

      vec3 finalColor;

      if (themeMode == 1) {
        // Dark Cyberpunk Hologram Earth
        vec3 baseHolo = vec3(0.02, 0.04, 0.09);
        vec3 landGlow = dayCol.rgb * vec3(0.2, 0.8, 1.0) * 1.6;
        vec3 nightGlow = nightCol.rgb * vec3(0.3, 1.0, 0.8) * 2.0;
        finalColor = mix(baseHolo, landGlow, dayCol.r * 0.9) + (nightGlow * 1.2) + (rimGlow * 0.7);
      } else if (themeMode == 2) {
        // Tactical Blue Command Earth
        vec3 baseDark = vec3(0.01, 0.03, 0.07);
        vec3 gridAccent = dayCol.rgb * vec3(0.1, 0.5, 0.8);
        finalColor = baseDark + gridAccent + (rimGlow * 0.9);
      } else {
        // Realistic Mode: blend daylight + night city lights + specular + atmosphere
        vec3 litDay = dayCol.rgb * max(sunDot, 0.08);
        vec3 litNight = nightCol.rgb * nightFactor * nightLightIntensity;
        finalColor = (litDay + litNight) + specularColor + rimGlow;
      }

      gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
};
