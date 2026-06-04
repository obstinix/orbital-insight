precision highp float;

varying vec2 vUv;
varying float vRadialDistance;

void main() {
  vUv = uv;

  // Compute radial distance from center of the ring geometry
  // RingGeometry positions are in the XZ plane after rotateX(PI/2)
  vRadialDistance = length(position.xy);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
