precision highp float;

varying vec2 vUv;
varying float vRadialDistance;

// Ring texture (alpha channel controls transparency)
uniform sampler2D ringTexture;
uniform vec3 sunDirection;
uniform float innerRadius;
uniform float outerRadius;

void main() {
  // Sample the ring texture using radial distance mapped to 0-1
  // The ring texture is a 1D gradient mapped across the ring width
  float t = (vRadialDistance - innerRadius) / (outerRadius - innerRadius);
  t = clamp(t, 0.0, 1.0);

  // Sample at the mapped UV (use t as the U coordinate)
  vec4 ringColor = texture2D(ringTexture, vec2(t, 0.5));

  // Subtle light variation based on sun angle
  // Rings are mostly flat, so we approximate illumination
  float lightFactor = 0.6 + 0.4 * max(dot(vec3(0.0, 1.0, 0.0), normalize(sunDirection)), 0.0);

  // Backlit translucency — when sun is behind the ring, they glow
  float backlit = max(-dot(vec3(0.0, 1.0, 0.0), normalize(sunDirection)), 0.0) * 0.3;

  vec3 finalColor = ringColor.rgb * (lightFactor + backlit);
  float finalAlpha = ringColor.a * 0.85;

  gl_FragColor = vec4(finalColor, finalAlpha);
}
