precision highp float;

varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  // Compute normal and view vectors in camera space
  vNormal = normalize(normalMatrix * normal);
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = -mvPosition.xyz;

  gl_Position = projectionMatrix * mvPosition;
}
