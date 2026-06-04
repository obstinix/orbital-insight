precision highp float;

// Texture maps
uniform sampler2D dayTexture;
uniform sampler2D nightTexture;
uniform sampler2D normalMap;
uniform sampler2D specularMap;

// Lighting
uniform vec3 sunDirection;   // Normalized direction toward sun in world space
uniform vec3 cameraPosition;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec3 vViewPosition;

void main() {
  vec3 normal = normalize(vWorldNormal);

  // --- Normal map perturbation ---
  vec3 normalTex = texture2D(normalMap, vUv).rgb * 2.0 - 1.0;
  // Simple tangent-space approximation (works well for spheres)
  vec3 perturbedNormal = normalize(normal + normalTex * 0.15);

  // --- Sun illumination ---
  float sunDot = dot(perturbedNormal, normalize(sunDirection));

  // Smooth twilight transition band (avoids hard day/night cutoff)
  // -0.15 to 0.25 creates a realistic terminator region
  float dayFactor = smoothstep(-0.15, 0.25, sunDot);

  // --- Texture sampling ---
  vec4 dayColor = texture2D(dayTexture, vUv);
  vec4 nightColor = texture2D(nightTexture, vUv);

  // Boost city lights on the night side for visibility
  // City lights in NASA's DNB image are dim — amplify them
  nightColor.rgb *= 2.8;

  // --- Ocean specular highlight ---
  float specMask = texture2D(specularMap, vUv).r;

  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  vec3 halfDir = normalize(viewDir + normalize(sunDirection));
  float specular = pow(max(dot(perturbedNormal, halfDir), 0.0), 64.0);

  // Apply specular only to ocean regions (where specular map is bright)
  // and only on the day side
  vec3 specContrib = vec3(1.0, 0.95, 0.9) * specular * specMask * 0.5 * dayFactor;

  // --- Ambient light ---
  // Very subtle ambient so the night side isn't pitch black beyond city lights
  vec3 ambient = dayColor.rgb * 0.012;

  // --- Final composite ---
  vec3 finalColor = mix(nightColor.rgb, dayColor.rgb + specContrib, dayFactor) + ambient;

  gl_FragColor = vec4(finalColor, 1.0);
}
