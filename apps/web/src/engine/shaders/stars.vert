precision highp float;

// Uniforms injected by Three.js and our render loop
uniform float uTime;

// Custom attributes per star
attribute float size;
attribute float twinklePhase;
attribute vec3 color;

// Varyings passed to fragment shader
varying vec3 vColor;
varying float vTwinkle;

void main() {
  vColor = color;
  
  // Twinkle effect: oscillate between 0.3 and 1.0 using the star's unique phase offset
  vTwinkle = sin(uTime * 2.0 + twinklePhase) * 0.35 + 0.65;

  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;

  // Capped point size attenuation based on depth
  gl_PointSize = size * (200.0 / -mvPosition.z);
}
