precision highp float;

uniform float uTime;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vLocalPosition;

// Simple hash for noise
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
  vec3 viewDir = normalize(vViewPosition);

  // Scale local coordinates to fit gas patterns
  vec2 p = vLocalPosition.xy * 0.007;

  // Layered dual-frequency FBM noise to create scrolling gas flows
  float n1 = fbm(p + vec2(uTime * 0.008, uTime * 0.004));
  float n2 = fbm(p * 1.6 - vec2(uTime * 0.012, -uTime * 0.008));
  
  float gas = smoothstep(0.25, 0.75, (n1 + n2) * 0.5);

  // Cinematic colors matching design tokens: purple and cyan
  vec3 purple = vec3(0.482, 0.184, 0.745); // --color-nebula-purple
  vec3 cyan = vec3(0.0, 0.737, 0.831);    // --color-teal-cyan
  
  // Mix base gas color
  vec3 baseColor = mix(purple, cyan, n2);
  
  // Highlight peaks in density
  baseColor += vec3(0.15, 0.08, 0.22) * gas;

  // Fresnel edge-glow (glow intensifies at glancing angles to simulate light scattering)
  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 3.0);
  
  // Smoothly blend edge opacity to make it look gaseous and fluffy
  float alpha = gas * (fresnel * 0.85 + 0.1);

  // Sphere edge falloff to ensure gas blends cleanly with dark space borders
  float maxRadius = 150.0;
  float currentDist = length(vLocalPosition);
  float borderFade = 1.0 - smoothstep(maxRadius * 0.7, maxRadius, currentDist);
  alpha *= borderFade;

  // Add emissive brightness contribution
  vec3 glowColor = baseColor * (1.3 + fresnel * 0.6);

  gl_FragColor = vec4(glowColor, alpha * 0.8);
}
