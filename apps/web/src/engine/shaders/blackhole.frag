precision highp float;

uniform float uTime;
uniform vec3 uCameraPositionLocal;

varying vec2 vUv;
varying vec3 vLocalPosition;
varying vec3 vViewPosition;

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

// 3-Octave FBM
float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; ++i) {
    v += a * noise(p);
    p = p * 2.0;
    a *= 0.5;
  }
  return v;
}

// Samples the accretion disk colors, structures, and Doppler beaming
vec4 sampleDisk(vec3 pos) {
  float r = length(pos.xz);
  if (r < 28.0 || r > 120.0) return vec4(0.0);

  // Polar coordinate angle for differential swirl rotation
  float phi = atan(pos.z, pos.x);
  float spin = uTime * (1.2 * 35.0 / r);
  float theta = phi + spin;

  // Swirling gas lanes
  float density = fbm(vec2(r * 0.07, theta * 1.6));
  
  // Radial boundaries soft fade
  float alpha = smoothstep(28.0, 36.0, r) * (1.0 - smoothstep(95.0, 120.0, r));

  // Relativistic Doppler beaming (left side of disk moving towards viewer is brighter)
  float beaming = 1.0 - 0.6 * sin(phi);

  // Cinematic gold-orange-purple spectrum
  vec3 hotGas = mix(vec3(0.4, 0.08, 0.6), vec3(1.0, 0.45, 0.08), density);
  vec3 discColor = hotGas * beaming * 2.2;
  
  return vec4(discColor, alpha * density * 0.95);
}

void main() {
  vec3 ro = uCameraPositionLocal;
  vec3 rd = normalize(vLocalPosition - uCameraPositionLocal);

  // Raymarching step variables
  float stepSize = 3.5;
  vec3 p = vLocalPosition; // Start tracing from the bounding sphere surface
  
  vec4 accum = vec4(0.0);
  bool hitHorizon = false;

  for (int i = 0; i < 45; i++) {
    float r2 = dot(p, p);
    float r = sqrt(r2);

    // Hit the event horizon (singularity core)
    if (r < 20.0) {
      hitHorizon = true;
      break;
    }

    // Gravitational lensing: bend the ray direction toward the singularity (0,0,0)
    // Force is proportional to GM/r^2
    vec3 gravityDirection = -normalize(p);
    float gravityPull = 620.0 / r2;
    rd = normalize(rd + gravityDirection * gravityPull * stepSize * 0.01);

    // Accretion disk equatorial plane intersection (y = 0)
    float nextY = p.y + rd.y * stepSize;
    if (p.y * nextY < 0.0) {
      // Linear interpolation to find the exact intersection point
      float t = -p.y / rd.y;
      vec3 intersectPos = p + rd * t;
      vec4 diskSample = sampleDisk(intersectPos);

      // Accumulate color using front-to-back alpha blending
      if (diskSample.a > 0.0) {
        accum.rgb += (1.0 - accum.a) * diskSample.rgb * diskSample.a;
        accum.a += (1.0 - accum.a) * diskSample.a;
      }
    }

    // Move ray forward
    p += rd * stepSize;

    // Terminate ray if fully opaque or exited the active lensing bounding area
    if (accum.a >= 0.98) break;
    if (r > 145.0 && dot(p, rd) > 0.0) break;
  }

  if (hitHorizon) {
    // Fill in the black silhouette of the event horizon
    accum.rgb = mix(accum.rgb, vec3(0.0), (1.0 - accum.a));
    accum.a = 1.0;
  }

  gl_FragColor = accum;
}
