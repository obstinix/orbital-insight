import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class SkyMapMode {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  
  public isActive = false;
  private horizonGroup: THREE.Group;
  
  // Save previous state for restoration
  private prevCamPos = new THREE.Vector3();
  private prevTarget = new THREE.Vector3();
  private prevMinDist = 2;
  private prevMaxDist = 5000;
  private prevZoom = true;
  private prevPan = true;

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, controls: OrbitControls) {
    this.scene = scene;
    this.camera = camera;
    this.controls = controls;
    
    this.horizonGroup = new THREE.Group();
    this.horizonGroup.name = 'skymap_horizon';
    this.createHorizon();
  }

  private createHorizon(): void {
    // 1. Create a semi-transparent ground disc representing the horizon
    const horizonGeo = new THREE.RingGeometry(0, 800, 64);
    horizonGeo.rotateX(-Math.PI / 2); // lie on XZ plane
    
    const horizonMat = new THREE.MeshBasicMaterial({
      color: 0x070c1f,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: true,
    });
    const horizonMesh = new THREE.Mesh(horizonGeo, horizonMat);
    this.horizonGroup.add(horizonMesh);

    // 2. Add concentric grid rings on the horizon for coordinate grid feel
    const gridColor = new THREE.Color(0x00f0ff);
    for (let r = 100; r <= 800; r += 150) {
      const ringGeo = new THREE.RingGeometry(r - 0.5, r + 0.5, 64);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: gridColor,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
      });
      this.horizonGroup.add(new THREE.Mesh(ringGeo, ringMat));
    }

    // 3. Add cardinal direction labels: N, S, E, W
    const labelDistance = 750;
    const directions = [
      { text: 'N', x: 0, z: -labelDistance }, // North is in -Z direction
      { text: 'S', x: 0, z: labelDistance },  // South is in +Z direction
      { text: 'E', x: labelDistance, z: 0 },  // East is in +X direction
      { text: 'W', x: -labelDistance, z: 0 }, // West is in -X direction
    ];

    directions.forEach((dir) => {
      const canvas = document.createElement('canvas');
      canvas.width = 128;
      canvas.height = 128;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.fillRect(0, 0, 128, 128);
        ctx.font = 'bold 80px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = dir.text === 'N' ? '#ff3b30' : '#00f0ff';
        ctx.shadowColor = dir.text === 'N' ? 'rgba(255, 59, 48, 0.6)' : 'rgba(0, 240, 255, 0.6)';
        ctx.shadowBlur = 10;
        ctx.fillText(dir.text, 64, 64);
      }
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(60, 60, 1);
      sprite.position.set(dir.x, 15, dir.z);
      this.horizonGroup.add(sprite);
    });

    // 4. Horizon line ring boundary
    const boundGeo = new THREE.RingGeometry(799, 801, 64);
    boundGeo.rotateX(-Math.PI / 2);
    const boundMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    });
    this.horizonGroup.add(new THREE.Mesh(boundGeo, boundMat));
  }

  public enable(): void {
    if (this.isActive) return;
    this.isActive = true;

    // Save state
    this.prevCamPos.copy(this.camera.position);
    this.prevTarget.copy(this.controls.target);
    this.prevMinDist = this.controls.minDistance;
    this.prevMaxDist = this.controls.maxDistance;
    this.prevZoom = this.controls.enableZoom;
    this.prevPan = this.controls.enablePan;

    // Apply skymap view state
    this.controls.enablePan = false;
    this.controls.enableZoom = false;
    this.controls.minDistance = 0.1;
    this.controls.maxDistance = 0.1;

    // Center camera and controls
    this.controls.target.set(0, 0, 0);
    this.camera.position.set(0, 0.05, 0.1);
    this.controls.update();

    this.scene.add(this.horizonGroup);
  }

  public disable(): void {
    if (!this.isActive) return;
    this.isActive = false;

    // Restore state
    this.controls.enablePan = this.prevPan;
    this.controls.enableZoom = this.prevZoom;
    this.controls.minDistance = this.prevMinDist;
    this.controls.maxDistance = this.prevMaxDist;
    
    this.controls.target.copy(this.prevTarget);
    this.camera.position.copy(this.prevCamPos);
    this.controls.update();

    this.scene.remove(this.horizonGroup);
  }

  public update(): void {
    if (!this.isActive) return;
  }
}
