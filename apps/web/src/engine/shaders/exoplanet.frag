precision highp float;

uniform float uTime;
uniform int uCategory; // 0 = habitable, 1 = ocean, 2 = lava, 3 = ice
uniform vec3 uLightDirection;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

// Simple hash function for pseudo-random noise
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

// 2D Value Noise
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

// 4-Octave Fractional Brownian Motion (FBM)
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  vec2 shift = vec2(100.0);
  mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
  for (int i = 0; i < 4; ++i) {
    v += a * noise(p);
    p = rot * p * 2.0 + shift;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 lightDir = normalize(uLightDirection);
  vec3 viewDir = normalize(vViewPosition);

  // Lighting vectors
  float diffuse = max(dot(normal, lightDir), 0.0);
  vec3 halfDir = normalize(lightDir + viewDir);
  float spec = pow(max(dot(normal, halfDir), 0.0), 32.0);

  // Surface texture calculation variables
  vec2 uv = vUv * 6.0;
  vec3 baseColor = vec3(0.0);
  float roughness = 0.8;
  float specularStrength = 0.2;
  vec3 emissive = vec3(0.0);

  if (uCategory == 0) {
    // ── HABITABLE WORLD ──────────────────────────────────────────
    // Generates continents, oceans, and weather clouds
    float n = fbm(uv + vec2(uTime * 0.02, 0.0));
    
    // Landmass vs Ocean mapping
    if (n < 0.46) {
      // Ocean: Deep blue to turquoise shelf
      float depth = n / 0.46;
      baseColor = mix(vec3(0.02, 0.08, 0.25), vec3(0.0, 0.35, 0.5), depth);
      roughness = 0.15;
      specularStrength = 0.8;
    } else {
      // Land: Forest green to desert brown
      float height = (n - 0.46) / 0.54;
      baseColor = mix(vec3(0.12, 0.32, 0.15), vec3(0.48, 0.42, 0.28), height);
      
      // Add snowy peaks
      if (height > 0.75) {
        baseColor = mix(baseColor, vec3(0.9, 0.92, 0.95), (height - 0.75) / 0.25);
      }
      roughness = 0.9;
      specularStrength = 0.05;
    }

    // Dynamic swirling cloud cover overlay
    float cloudNoise = fbm(uv * 1.5 + vec2(uTime * 0.08, uTime * 0.04));
    float cloudIntensity = smoothstep(0.45, 0.78, cloudNoise);
    baseColor = mix(baseColor, vec3(0.95, 0.95, 0.98), cloudIntensity * 0.8);
    roughness = mix(roughness, 1.0, cloudIntensity);

  } else if (uCategory == 1) {
    // ── OCEAN WORLD ──────────────────────────────────────────────
    // Global water world with thick atmospheric mists
    float wave = fbm(uv * 2.0 + vec2(uTime * 0.05, -uTime * 0.03));
    baseColor = mix(vec3(0.01, 0.12, 0.32), vec3(0.03, 0.25, 0.45), wave);
    
    // High ocean specular glare
    roughness = 0.08;
    specularStrength = 1.3;

    // Atmospheric mist layers
    float mist = fbm(uv * 0.8 + vec2(-uTime * 0.02, uTime * 0.02));
    float mistIntensity = smoothstep(0.4, 0.7, mist);
    baseColor = mix(baseColor, vec3(0.7, 0.85, 0.9), mistIntensity * 0.3);

  } else if (uCategory == 2) {
    // ── LAVA / CARBON WORLD ──────────────────────────────────────
    // Hardened basalt crust with flowing molten lava cracks
    float n = fbm(uv * 1.5);
    
    // Basalt crust base color (charcoal grey with variation)
    baseColor = mix(vec3(0.08, 0.08, 0.09), vec3(0.15, 0.14, 0.16), n);
    roughness = 0.95;
    specularStrength = 0.02;

    // Molten lava veins
    float veinNoise = fbm(uv * 2.5 + vec2(uTime * 0.12, 0.0));
    float lavaVeins = smoothstep(0.55, 0.78, veinNoise);
    
    if (lavaVeins > 0.01) {
      // Dynamic glowing lava colors
      float pulse = sin(uTime * 4.0 + n * 12.0) * 0.18 + 0.82;
      vec3 lavaColor = mix(vec3(0.85, 0.15, 0.0), vec3(1.0, 0.65, 0.0), lavaVeins);
      baseColor = mix(baseColor, lavaColor * pulse, lavaVeins);
      emissive = lavaColor * lavaVeins * pulse * 2.2;
    }

  } else if (uCategory == 3) {
    // ── ICE WORLD ────────────────────────────────────────────────
    // Freezing glacials with deep blue ice fractures
    float n = fbm(uv * 1.8);
    
    // Core white snow cover
    baseColor = mix(vec3(0.85, 0.92, 0.96), vec3(0.96, 0.98, 1.0), n);
    roughness = 0.75;
    specularStrength = 0.4;

    // Deep structural fractures (cracks) showing blue/teal depths
    float crackNoise = fbm(uv * 3.5 + vec2(0.0, uTime * 0.01));
    float cracks = smoothstep(0.65, 0.8, crackNoise);
    
    if (cracks > 0.01) {
      vec3 crackColor = vec3(0.0, 0.62, 0.85); // glacial blue
      baseColor = mix(baseColor, crackColor, cracks);
      roughness = mix(roughness, 0.1, cracks);
      specularStrength = mix(specularStrength, 1.2, cracks);
    }
  }

  // Combine components into final lighting equations
  vec3 ambientColor = vec3(0.02, 0.02, 0.04) * baseColor;
  vec3 diffuseColor = diffuse * baseColor;
  vec3 specularColor = spec * vec3(1.0) * specularStrength;

  vec3 finalColor = ambientColor + diffuseColor + specularColor + emissive;

  // Add subtle atmospheric limb scatter glow based on dot product
  float scatter = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.5);
  vec3 scatterColor = uCategory == 2 ? vec3(0.85, 0.25, 0.0) : vec3(0.0, 0.75, 1.0);
  finalColor += scatterColor * scatter * 0.45;

  gl_FragColor = vec4(finalColor, 1.0);
}
