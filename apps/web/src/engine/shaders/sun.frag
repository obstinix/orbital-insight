precision highp float;

uniform float uTime;
uniform sampler2D sunTexture;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;

// Simplex noise hash
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

// 3D simplex noise
float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

// Fractal Brownian Motion — layered noise for solar granulation
float fbm(vec3 p) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;
  for (int i = 0; i < 4; i++) {
    value += amplitude * snoise(p * frequency);
    amplitude *= 0.5;
    frequency *= 2.1;
  }
  return value;
}

void main() {
  // Sample the base sun texture for color reference
  vec4 texColor = texture2D(sunTexture, vUv);

  // Convert UV to 3D coordinates for volumetric noise
  float theta = vUv.x * 6.28318;
  float phi = vUv.y * 3.14159;
  vec3 noisePos = vec3(
    sin(phi) * cos(theta),
    cos(phi),
    sin(phi) * sin(theta)
  );

  // Animate noise slowly for convection cell movement
  float time = uTime * 0.03;

  // Multi-scale solar surface turbulence
  float turbulence = fbm(noisePos * 3.0 + time * 0.5) * 0.4;
  float granulation = fbm(noisePos * 8.0 + time * 1.2) * 0.15;
  float detail = snoise(noisePos * 15.0 + time * 2.0) * 0.08;

  float noiseValue = 0.5 + turbulence + granulation + detail;

  // Solar color palette — from deep orange to bright yellow-white
  vec3 coolColor = vec3(0.9, 0.35, 0.05);    // Dark sunspot orange
  vec3 warmColor = vec3(1.0, 0.75, 0.2);     // Surface orange-yellow
  vec3 hotColor = vec3(1.3, 1.1, 0.7);       // HDR bright granule (>1.0 for bloom)

  vec3 solarColor = mix(coolColor, warmColor, smoothstep(0.3, 0.6, noiseValue));
  solarColor = mix(solarColor, hotColor, smoothstep(0.65, 0.9, noiseValue));

  // Blend with base texture for detail
  vec3 finalColor = mix(solarColor, texColor.rgb * 1.3, 0.3);

  // Limb darkening — edges of the sun appear darker (realistic)
  vec3 viewDir = normalize(vViewPosition);
  vec3 normal = normalize(vNormal);
  float limbFactor = pow(max(dot(normal, viewDir), 0.0), 0.5);
  finalColor *= (0.4 + 0.6 * limbFactor);

  // HDR output: values > 1.0 will trigger bloom in post-processing
  // The bright granulation regions emit light that creates the corona glow
  gl_FragColor = vec4(finalColor * 1.5, 1.0);
}
