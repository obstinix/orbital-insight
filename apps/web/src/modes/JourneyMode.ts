import * as THREE from 'three';
import gsap from 'gsap';
import { SpacecraftController } from '../spacecraft/SpacecraftController';
import { useJourneyStore, CHAPTERS } from '../store/useJourneyStore';
import { useEngineStore } from '../store/useEngineStore';
import { usePlanetStore } from '../store/usePlanetStore';
import blackholeVert from '../shaders/blackhole.vert';
import blackholeFrag from '../shaders/blackhole.frag';
import nebulaVert from '../shaders/nebula.vert';
import nebulaFrag from '../shaders/nebula.frag';

export class JourneyMode {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private spacecraft: SpacecraftController;

  // Visual assets representing the deep space milestones
  private oortCloudPoints: THREE.Points | null = null;
  private nebulaMesh: THREE.Mesh | null = null;
  private nebulaMaterial: THREE.ShaderMaterial | null = null;
  private alphaCentauriGroup: THREE.Group | null = null;
  private blackHoleGroup: THREE.Group | null = null;
  private blackHoleMaterial: THREE.ShaderMaterial | null = null;
  private cmbHorizonMesh: THREE.Mesh | null = null;

  constructor(scene: THREE.Scene, camera: THREE.Camera, spacecraft: SpacecraftController) {
    this.scene = scene;
    this.camera = camera;
    this.spacecraft = spacecraft;

    this.createInterstellarAssets();
  }

  /**
    * Constructs procedural 3D models for interstellar/deep space chapters.
    */
  private createInterstellarAssets(): void {
    // 1. Chapter 5: Oort Cloud / Kuiper Belt (frozen icy debris cluster)
    const oortGeo = new THREE.BufferGeometry();
    const count = 4000;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const r = 250 + Math.random() * 80;
      pos[i * 3] = r * Math.cos(theta);
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20.0;
      pos[i * 3 + 2] = r * Math.sin(theta);
    }
    oortGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const oortMat = new THREE.PointsMaterial({
      color: 0xa6e3e9,
      size: 0.6,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
    });
    this.oortCloudPoints = new THREE.Points(oortGeo, oortMat);
    this.oortCloudPoints.position.set(0, 0, -3000);
    this.scene.add(this.oortCloudPoints);
    this.oortCloudPoints.visible = false;

    // 1b. Volumetric Nebula (glowing gas clouds surrounding the Oort sector)
    this.nebulaMaterial = new THREE.ShaderMaterial({
      vertexShader: nebulaVert,
      fragmentShader: nebulaFrag,
      uniforms: {
        uTime: { value: 0.0 },
      },
      transparent: true,
      depthWrite: false, // disable depth write to avoid clipping issues with stars
      side: THREE.DoubleSide,
      blending: THREE.NormalBlending,
    });

    const nebulaGeo = new THREE.SphereGeometry(150, 48, 48);
    this.nebulaMesh = new THREE.Mesh(nebulaGeo, this.nebulaMaterial);
    this.nebulaMesh.position.set(0, 0, -3000);
    this.scene.add(this.nebulaMesh);
    this.nebulaMesh.visible = false;

    // 2. Chapter 6: Alpha Centauri (glowing binary stars)
    this.alphaCentauriGroup = new THREE.Group();
    this.alphaCentauriGroup.position.set(3000, 200, -5000);

    const primaryStarGeo = new THREE.SphereGeometry(15, 24, 24);
    const primaryStarMat = new THREE.MeshBasicMaterial({ color: 0xffeb99 }); // yellow-white dwarf
    const primaryStar = new THREE.Mesh(primaryStarGeo, primaryStarMat);
    primaryStar.position.set(-25, 0, 0);
    this.alphaCentauriGroup.add(primaryStar);

    const companionStarGeo = new THREE.SphereGeometry(11, 24, 24);
    const companionStarMat = new THREE.MeshBasicMaterial({ color: 0xff8844 }); // orange dwarf
    const companionStar = new THREE.Mesh(companionStarGeo, companionStarMat);
    companionStar.position.set(25, 0, 0);
    this.alphaCentauriGroup.add(companionStar);
    
    // Add planetary detailer/glow elements
    this.scene.add(this.alphaCentauriGroup);
    this.alphaCentauriGroup.visible = false;

    // 3. Chapter 7: Sagittarius A* (Supermassive Black Hole)
    this.blackHoleGroup = new THREE.Group();
    this.blackHoleGroup.position.set(-5000, 600, -10000);

    this.blackHoleMaterial = new THREE.ShaderMaterial({
      vertexShader: blackholeVert,
      fragmentShader: blackholeFrag,
      uniforms: {
        uTime: { value: 0.0 },
        uCameraPositionLocal: { value: new THREE.Vector3() },
      },
      transparent: true,
      side: THREE.DoubleSide,
    });

    const lensingSphereGeo = new THREE.SphereGeometry(140, 48, 48);
    const lensingSphere = new THREE.Mesh(lensingSphereGeo, this.blackHoleMaterial);
    lensingSphere.name = 'sagittarius_a_lensing';
    this.blackHoleGroup.add(lensingSphere);

    this.scene.add(this.blackHoleGroup);
    this.blackHoleGroup.visible = false;

    // 4. Chapter 8: CMB Horizon (thermal radiation shell of the early universe)
    const cmbGeo = new THREE.SphereGeometry(900, 32, 32);
    const cmbMat = new THREE.MeshBasicMaterial({
      color: 0xff7e67,
      wireframe: true,
      transparent: true,
      opacity: 0.15,
    });
    this.cmbHorizonMesh = new THREE.Mesh(cmbGeo, cmbMat);
    this.cmbHorizonMesh.position.set(0, 0, -15000);
    this.scene.add(this.cmbHorizonMesh);
    this.cmbHorizonMesh.visible = false;
  }

  /**
    * Toggles visibility of deep space visual assets depending on active chapter context.
    */
  private toggleAssetVisibility(chapterId: number): void {
    if (this.oortCloudPoints) this.oortCloudPoints.visible = chapterId === 5;
    if (this.nebulaMesh) this.nebulaMesh.visible = chapterId === 5;
    if (this.alphaCentauriGroup) this.alphaCentauriGroup.visible = chapterId === 6;
    if (this.blackHoleGroup) this.blackHoleGroup.visible = chapterId === 7;
    if (this.cmbHorizonMesh) this.cmbHorizonMesh.visible = chapterId === 8;
  }

  /**
    * Triggers the cinematic flight sequence to jump to the selected chapter coordinates.
    */
  public async selectChapter(chapterId: number): Promise<void> {
    const store = useJourneyStore.getState();
    if (store.isTransitioning) return;

    store.setIsTransitioning(true);
    store.setCurrentChapterId(chapterId);

    const chapter = CHAPTERS.find((c) => c.id === chapterId);
    if (!chapter) {
      store.setIsTransitioning(false);
      return;
    }

    // Toggle active interstellar structures
    this.toggleAssetVisibility(chapterId);

    const isPlanetTarget = chapterId <= 4;

    if (isPlanetTarget) {
      // Orbit targets in Solar system (Earth, Mars, Jupiter, Saturn)
      usePlanetStore.getState().setSelectedPlanetId(chapter.focusId);
      
      this.spacecraft.warpTo(chapter.focusId, () => {
        // Warp complete
        const cameraController = useEngineStore.getState().cameraController;
        if (cameraController) {
          const planetObj = this.scene.getObjectByName(`planet_group_${chapter.focusId}`);
          if (planetObj) {
            cameraController.setOrbitTarget(planetObj);
            cameraController.setMode('ORBIT');
          }
        }
        store.setIsTransitioning(false);
      });
    } else {
      // Interstellar deep coordinates targets (Kuiper, Alpha Centauri, Sagittarius, CMB)
      usePlanetStore.getState().setSelectedPlanetId(null);
      this.spacecraft.detachFromPlanet();

      // Resolve targets based on chapter
      let destPos = new THREE.Vector3();
      if (chapterId === 5 && this.oortCloudPoints) destPos.copy(this.oortCloudPoints.position).add(new THREE.Vector3(0, 0, 300));
      if (chapterId === 6 && this.alphaCentauriGroup) destPos.copy(this.alphaCentauriGroup.position).add(new THREE.Vector3(0, 50, 250));
      if (chapterId === 7 && this.blackHoleGroup) destPos.copy(this.blackHoleGroup.position).add(new THREE.Vector3(0, 100, 350));
      if (chapterId === 8 && this.cmbHorizonMesh) destPos.copy(this.cmbHorizonMesh.position).add(new THREE.Vector3(0, 0, 600));

      const startPos = this.spacecraft.mesh.position.clone();
      this.spacecraft.mesh.lookAt(destPos);
      
      const direction = new THREE.Vector3().subVectors(destPos, startPos).normalize();
      
      // Execute manual deep space warp animation
      // @ts-ignore (Accessing private variables safely for custom timeline)
      const warpMat = this.spacecraft.warpMaterial;
      // @ts-ignore
      const glowMesh = this.spacecraft.engineGlow;
      // @ts-ignore
      const light = this.spacecraft.thrusterLight;

      const tl = gsap.timeline({
        onComplete: () => {
          this.spacecraft.state = 'IDLE';
          warpMat.uniforms.uWarpProgress.value = 0.0;
          glowMesh.scale.set(0.1, 0.1, 0.2);
          light.intensity = 0.5;
          
          // Re-align camera focus towards the spacecraft in its new location
          const cameraController = useEngineStore.getState().cameraController;
          if (cameraController) {
            cameraController.setOrbitTarget(this.spacecraft.mesh);
            cameraController.setMode('ORBIT');
          }

          store.setIsTransitioning(false);
        }
      });

      this.spacecraft.state = 'THRUSTING';

      // 1. Charge Thrusters
      tl.to(glowMesh.scale, { x: 1.5, y: 1.5, z: 3.5, duration: 1.0, ease: 'power2.in' }, 0);
      tl.to(light, { intensity: 7.0, duration: 1.0, ease: 'power2.in' }, 0);

      // 2. Engage Warp Streaks
      tl.to({}, {
        duration: 0.1,
        onStart: () => {
          this.spacecraft.state = 'WARPING';
        }
      }, 1.0);

      tl.to(warpMat.uniforms.uWarpProgress, { value: 1.0, duration: 1.2, ease: 'power4.in' }, 1.0);

      if ('fov' in this.camera) {
        const cam = this.camera as THREE.PerspectiveCamera;
        tl.to(cam, {
          fov: 90,
          duration: 1.2,
          ease: 'power4.in',
          onUpdate: () => cam.updateProjectionMatrix()
        }, 1.0);
      }

      // 3. Move Spacecraft & Camera
      tl.to(this.spacecraft.mesh.position, {
        x: destPos.x,
        y: destPos.y,
        z: destPos.z,
        duration: 1.6,
        ease: 'power3.inOut'
      }, 1.6);

      const engine = useEngineStore.getState();
      if (engine.camera) {
        const camTarget = destPos.clone().sub(direction.clone().multiplyScalar(150)).add(new THREE.Vector3(0, 30, 0));
        tl.to(engine.camera.position, {
          x: camTarget.x,
          y: camTarget.y,
          z: camTarget.z,
          duration: 1.6,
          ease: 'power3.inOut'
        }, 1.6);
      }

      // 4. Decelerate Warp
      tl.to(warpMat.uniforms.uWarpProgress, { value: 0.0, duration: 1.2, ease: 'power2.out' }, 3.2);

      if ('fov' in this.camera) {
        const cam = this.camera as THREE.PerspectiveCamera;
        tl.to(cam, {
          fov: 60,
          duration: 1.2,
          ease: 'power2.out',
          onUpdate: () => cam.updateProjectionMatrix()
        }, 3.2);
      }

      tl.to(glowMesh.scale, { x: 0.15, y: 0.15, z: 0.3, duration: 1.2, ease: 'power2.out' }, 3.2);
      tl.to(light, { intensity: 1.0, duration: 1.2, ease: 'power2.out' }, 3.2);
    }
  }

  /**
    * Updates deep space animations (like Oort cloud rotations or black hole disk spins).
    */
  public update(elapsedSeconds: number): void {
    if (this.oortCloudPoints && this.oortCloudPoints.visible) {
      this.oortCloudPoints.rotation.y = elapsedSeconds * 0.02;
    }
    if (this.nebulaMesh && this.nebulaMesh.visible && this.nebulaMaterial) {
      this.nebulaMaterial.uniforms.uTime.value = elapsedSeconds;
      this.nebulaMesh.rotation.y = elapsedSeconds * 0.012;
    }
    if (this.alphaCentauriGroup && this.alphaCentauriGroup.visible) {
      this.alphaCentauriGroup.rotation.y = elapsedSeconds * 0.1;
    }
    if (this.blackHoleGroup && this.blackHoleGroup.visible && this.blackHoleMaterial) {
      this.blackHoleMaterial.uniforms.uTime.value = elapsedSeconds;
      
      const localCam = this.camera.position.clone().sub(this.blackHoleGroup.position);
      this.blackHoleMaterial.uniforms.uCameraPositionLocal.value.copy(localCam);
    }
    if (this.cmbHorizonMesh && this.cmbHorizonMesh.visible) {
      this.cmbHorizonMesh.rotation.y = elapsedSeconds * 0.005;
      this.cmbHorizonMesh.rotation.x = elapsedSeconds * 0.002;
    }
  }
}
