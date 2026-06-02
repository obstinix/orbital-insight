precision highp float;

uniform vec3 uRayleighColor; // Atmosphere base color (Rayleigh scattering coefficients)
uniform float uDensity;       // Density coefficient

varying vec3 vNormal;
varying vec3 vViewPosition;

void main() {
  vec3 normal = normalize(vNormal);
  vec3 viewDir = normalize(vViewPosition);

  // Fresnel calculation: glow peaks as normal becomes perpendicular to view direction
  float dotProduct = dot(normal, viewDir);
  
  // Exponent 4.5 gives a sleek, thin atmospheric limb glow
  float intensity = pow(1.0 - max(dotProduct, 0.0), 4.5);
  
  // Apply density scalar to glow opacity
  float alpha = intensity * uDensity;

  gl_FragColor = vec4(uRayleighColor, alpha);
}
