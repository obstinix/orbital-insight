import * as THREE from 'three';
import exoplanetVert from '../shaders/exoplanet.vert';
import exoplanetFrag from '../shaders/exoplanet.frag';

export class ExoplanetRenderer {
  public mesh: THREE.Mesh;
  private material: THREE.ShaderMaterial;

  constructor() {
    const geometry = new THREE.SphereGeometry(100, 64, 64);

    this.material = new THREE.ShaderMaterial({
      vertexShader: exoplanetVert,
      fragmentShader: exoplanetFrag,
      uniforms: {
        uTime: { value: 0.0 },
        uCategory: { value: 0 }, // default habitable
        uLightDirection: { value: new THREE.Vector3(1.0, 0.4, 0.8).normalize() },
      },
    });

    this.mesh = new THREE.Mesh(geometry, this.material);
    this.mesh.name = 'exoplanet_mesh';
  }

  /**
   * Sets the visual class category for the planet.
   * @param category category tag ('habitable' | 'ocean' | 'lava' | 'ice')
   */
  public setCategory(category: string): void {
    let catIndex = 0;
    switch (category.toLowerCase()) {
      case 'habitable':
        catIndex = 0;
        break;
      case 'ocean':
        catIndex = 1;
        break;
      case 'lava':
        catIndex = 2;
        break;
      case 'ice':
        catIndex = 3;
        break;
      default:
        catIndex = 0;
    }
    
    this.material.uniforms.uCategory.value = catIndex;
  }

  public update(elapsedSeconds: number): void {
    // 1. Update shader time uniforms
    this.material.uniforms.uTime.value = elapsedSeconds;

    // 2. Slow orbital spin
    this.mesh.rotation.y = elapsedSeconds * 0.06;
  }

  public dispose(): void {
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}
