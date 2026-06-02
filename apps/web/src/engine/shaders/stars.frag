precision highp float;

varying vec3 vColor;
varying float vTwinkle;

void main() {
  // Calculate distance from center of the point sprite
  vec2 coord = gl_PointCoord - vec2(0.5);
  float dist = length(coord);

  // Discard pixels outside the circle boundary (0.5 radius)
  if (dist > 0.5) {
    discard;
  }

  // Smooth circular disc edge mapping for premium soft glow appearance
  float alpha = 1.0 - smoothstep(0.2, 0.5, dist);

  // Apply visual twinkle intensity directly to RGB and Alpha
  gl_FragColor = vec4(vColor * vTwinkle, alpha * vTwinkle);
}
