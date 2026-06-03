precision highp float;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
uniform float uTime;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewPosition;
varying vec3 vLocalPosition;

void main() {
  vUv = uv;
  vLocalPosition = position;
  vNormal = normalize(normalMatrix * normal);
  
  // Soft, organic vertex displacement to simulate flowing nebula gas currents
  vec3 displaced = position;
  displaced.x += sin(position.y * 0.02 + uTime * 0.4) * 8.0;
  displaced.y += cos(position.z * 0.03 + uTime * 0.3) * 6.0;
  displaced.z += sin(position.x * 0.025 + uTime * 0.5) * 8.0;
  
  vec4 mvPosition = modelViewMatrix * vec4(displaced, 1.0);
  vViewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}
