import * as THREE from 'three';
import starVertexShader from '../shaders/stars.vert';
import starFragmentShader from '../shaders/stars.frag';

const SPHERE_RADIUS = 10000;
const FLOATS_PER_STAR = 7;

export class StarField {
  public points: THREE.Points;
  private material: THREE.ShaderMaterial;

  constructor() {
    const geometry = new THREE.BufferGeometry();
    
    // Start with a small temporary buffer of 1000 procedural stars to show something immediately
    const tempStarCount = 1000;
    const positions = new Float32Array(tempStarCount * 3);
    const colors = new Float32Array(tempStarCount * 3);
    const sizes = new Float32Array(tempStarCount);
    const twinklePhases = new Float32Array(tempStarCount);

    for (let i = 0; i < tempStarCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      
      positions[i * 3] = SPHERE_RADIUS * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = SPHERE_RADIUS * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = SPHERE_RADIUS * Math.cos(phi);

      colors[i * 3] = 1.0;
      colors[i * 3 + 1] = 1.0;
      colors[i * 3 + 2] = 1.0;

      sizes[i] = 1.0;
      twinklePhases[i] = Math.random() * Math.PI * 2.0;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('twinklePhase', new THREE.BufferAttribute(twinklePhases, 1));

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

    // Asynchronously load the real HYG catalog binary buffer
    this.loadCatalog();
  }

  private async loadCatalog(): Promise<void> {
    try {
      const response = await fetch('/stars/hyg_stars.bin');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const arrayBuffer = await response.arrayBuffer();
      const starData = new Float32Array(arrayBuffer);
      const starCount = starData.length / FLOATS_PER_STAR;

      console.log(`[StarField] Loaded ${starCount} stars from HYG catalog binary`);

      const positions = new Float32Array(starCount * 3);
      const colors = new Float32Array(starCount * 3);
      const sizes = new Float32Array(starCount);
      const twinklePhases = new Float32Array(starCount);

      for (let i = 0; i < starCount; i++) {
        const offset = i * FLOATS_PER_STAR;
        const raRad = starData[offset + 0]; // ra in radians
        const decRad = starData[offset + 1]; // dec in radians
        const mag = starData[offset + 2]; // magnitude
        const r = starData[offset + 3];
        const g = starData[offset + 4];
        const b = starData[offset + 5];

        // Convert RA/Dec to 3D Cartesian coordinates to align with constellations
        // x = R * cos(decRad) * cos(raRad)
        // y = R * sin(decRad)
        // z = R * cos(decRad) * sin(raRad)
        const cosDec = Math.cos(decRad);
        positions[i * 3] = SPHERE_RADIUS * cosDec * Math.cos(raRad);
        positions[i * 3 + 1] = SPHERE_RADIUS * Math.sin(decRad);
        positions[i * 3 + 2] = SPHERE_RADIUS * cosDec * Math.sin(raRad);

        colors[i * 3] = r;
        colors[i * 3 + 1] = g;
        colors[i * 3 + 2] = b;

        // Size logic: map magnitude to visual size
        sizes[i] = Math.max(0.6, (8.0 - mag) * 0.75);

        twinklePhases[i] = Math.random() * Math.PI * 2.0;
      }

      const geom = this.points.geometry;
      geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      geom.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
      geom.setAttribute('twinklePhase', new THREE.BufferAttribute(twinklePhases, 1));

      // Signal Three.js that attributes changed
      geom.attributes.position.needsUpdate = true;
      geom.attributes.color.needsUpdate = true;
      geom.attributes.size.needsUpdate = true;
      geom.attributes.twinklePhase.needsUpdate = true;

      // Update bounding sphere/box
      geom.computeBoundingBox();
      geom.computeBoundingSphere();
    } catch (error) {
      console.error('[StarField] Failed to load star catalog:', error);
    }
  }

  public update(elapsedSeconds: number): void {
    this.material.uniforms.uTime.value = elapsedSeconds;
  }

  public dispose(): void {
    this.points.geometry.dispose();
    this.material.dispose();
  }
}
