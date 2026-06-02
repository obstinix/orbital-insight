precision highp float;

uniform float uTime;
uniform float uWarpProgress; // 0.0 to 1.0

varying vec2 vUv;

// Simple hash for pseudo-random number generation
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

// 2D value noise
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

void main() {
  if (uWarpProgress <= 0.001) {
    discard;
  }

  vec2 uv = vUv - vec2(0.5);
  float dist = length(uv);
  float angle = atan(uv.y, uv.x);

  // Define streak parameters
  float numStreaks = 120.0;
  float radialGrid = angle * numStreaks / (2.0 * 3.14159265);
  float scrollSpeed = uTime * (25.0 + uWarpProgress * 40.0);

  // Fade components based on distance from center
  float centerFade = smoothstep(0.03, 0.25, dist);
  float edgeFade = smoothstep(0.5, 0.35, dist);

  // Chromatic Aberration: sample noise at slightly offset radial scales
  float rShift = dist * (5.0 - uWarpProgress * 1.5);
  float gShift = dist * (5.0 - uWarpProgress * 1.0);
  float bShift = dist * (5.0 - uWarpProgress * 0.5);

  float rStreak = noise(vec2(radialGrid, rShift - scrollSpeed));
  float gStreak = noise(vec2(radialGrid, gShift - scrollSpeed));
  float bStreak = noise(vec2(radialGrid, bShift - scrollSpeed));

  // Refine streak intensities
  float rVal = smoothstep(0.35, 0.75, rStreak) * centerFade * edgeFade * uWarpProgress;
  float gVal = smoothstep(0.35, 0.75, gStreak) * centerFade * edgeFade * uWarpProgress;
  float bVal = smoothstep(0.35, 0.75, bStreak) * centerFade * edgeFade * uWarpProgress;

  // Mix channels to create vibrant neon blue, purple and cyan lines
  vec3 col = vec3(0.0);
  col.r += rVal * 0.35;
  col.g += gVal * 0.75;
  col.b += bVal * 1.3;

  // Add bright central core glow
  float coreGlow = pow(max(0.0, 1.0 - dist * 2.5), 5.0) * uWarpProgress * 0.85;
  col += vec3(0.5, 0.85, 1.0) * coreGlow;

  // Set total alpha
  float alpha = clamp((rVal + gVal + bVal) * 1.2 + coreGlow, 0.0, 1.0);

  gl_FragColor = vec4(col, alpha);
}
