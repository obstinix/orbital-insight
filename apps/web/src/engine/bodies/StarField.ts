import * as THREE from 'three';
import starVertexShader from '../shaders/stars.vert';
import starFragmentShader from '../shaders/stars.frag';

const STAR_COUNT = 100000;
const SPHERE_RADIUS = 10000;

// Harvard spectral classification color codes
const SPECTRAL_COLORS = {
  O: new THREE.Color('#9BB0FF'), // Blue (0.1%)
  B: new THREE.Color('#AABFFF'), // Blue-White (1.3%)
  A: new THREE.Color('#CAD7FF'), // White (4.0%)
  F: new THREE.Color('#F8F7FF'), // Yellow-White (7.6%)
  G: new THREE.Color('#FFF4EA'), // Yellow (12.1%)
  K: new THREE.Color('#FFD2A1'), // Orange (12.4%)
  M: new THREE.Color('#FFCC6F'), // Red (62.5%)
};

/**
 * Returns a spectral class color based on Harvard classification probability thresholds.
 */
function getRandomSpectralColor(): THREE.Color {
  const roll = Math.random() * 100;
  
  if (roll < 0.1) return SPECTRAL_COLORS.O;
  if (roll < 1.4) return SPECTRAL_COLORS.B;
  if (roll < 5.4) return SPECTRAL_COLORS.A;
  if (roll < 13.0) return SPECTRAL_COLORS.F;
  if (roll < 25.1) return SPECTRAL_COLORS.G;
  if (roll < 37.5) return SPECTRAL_COLORS.K;
  return SPECTRAL_COLORS.M;
}

export class StarField {
  public points: THREE.Points;
  private material: THREE.ShaderMaterial;

  constructor() {
    const geometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(STAR_COUNT * 3);
    const colors = new Float32Array(STAR_COUNT * 3);
    const sizes = new Float32Array(STAR_COUNT);
    const twinklePhases = new Float32Array(STAR_COUNT);

    for (let i = 0; i < STAR_COUNT; i++) {
      // 1. Uniform distribution on a sphere
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      
      const x = SPHERE_RADIUS * Math.sin(phi) * Math.cos(theta);
      const y = SPHERE_RADIUS * Math.sin(phi) * Math.sin(theta);
      const z = SPHERE_RADIUS * Math.cos(phi);

      const i3 = i * 3;
      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      // 2. Color assignment based on classification
      const color = getRandomSpectralColor();
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      // 3. Size configuration (from small 1.0 to bright 4.5 size)
      const sizeBase = Math.random();
      sizes[i] = sizeBase * sizeBase * 3.5 + 1.0; 

      // 4. Random phase offset for twinkling (0 to 2*PI)
      twinklePhases[i] = Math.random() * Math.PI * 2.0;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('twinklePhase', new THREE.BufferAttribute(twinklePhases, 1));

    // Custom shader material supporting twinkling and size attenuation
    this.material = new THREE.ShaderMaterial({
      vertexShader: starVertexShader,
      fragmentShader: starFragmentShader,
      uniforms: {
        uTime: { value: 0.0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    this.points = new THREE.Points(geometry, this.material);
  }

  /**
   * Updates the shader uniforms. Call this in the animation frame tick.
   * @param elapsedSeconds Time since simulation start in seconds.
   */
  public update(elapsedSeconds: number): void {
    this.material.uniforms.uTime.value = elapsedSeconds;
  }

  public dispose(): void {
    this.points.geometry.dispose();
    this.material.dispose();
  }
}
