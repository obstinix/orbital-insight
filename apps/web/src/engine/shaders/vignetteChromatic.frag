precision highp float;

uniform sampler2D tDiffuse;
uniform float uAberrationOffset;
uniform float uVignetteDarkness;
uniform float uVignetteOffset;

varying vec2 vUv;

void main() {
  vec2 uv = vUv;
  vec2 distVec = uv - 0.5;
  
  // Chromatic aberration increases radially from the center of the screen
  float dist = length(distVec);
  vec2 offset = distVec * uAberrationOffset * dist;

  vec4 rCol = texture2D(tDiffuse, uv - offset);
  vec4 gCol = texture2D(tDiffuse, uv);
  vec4 bCol = texture2D(tDiffuse, uv + offset);

  vec4 color = vec4(rCol.r, gCol.g, bCol.b, gCol.a);

  // Smooth vignette darkening toward screen edges
  float vignette = dist * uVignetteDarkness;
  vignette = clamp(1.0 - vignette * vignette, 0.0, 1.0);
  vignette = pow(vignette, uVignetteOffset);

  gl_FragColor = vec4(color.rgb * vignette, color.a);
}
