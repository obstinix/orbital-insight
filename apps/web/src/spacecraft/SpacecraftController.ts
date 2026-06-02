import * as THREE from 'three';
import gsap from 'gsap';
import warpVert from '../engine/shaders/warp.vert';
import warpFrag from '../engine/shaders/warp.frag';
import { useEngineStore } from '../store/useEngineStore';

export type SpacecraftState = 'IDLE' | 'THRUSTING' | 'WARPING' | 'ORBITING';

export class SpacecraftController {
  public state: SpacecraftState = 'IDLE';
  public mesh: THREE.Group;
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private warpQuad: THREE.Mesh;
  private warpMaterial: THREE.ShaderMaterial;
  private engineGlow!: THREE.Mesh;
  private thrusterLight!: THREE.PointLight;
  private currentTargetPlanetId: string | null = null;

  constructor(scene: THREE.Scene, camera: THREE.Camera) {
    this.scene = scene;
    this.camera = camera;

    // 1. Create spacecraft mesh
    this.mesh = this.createSpacecraftMesh();
    this.scene.add(this.mesh);

    // Initial position: relative to Earth
    const earthObj = this.scene.getObjectByName('planet_group_earth');
    if (earthObj) {
      this.attachToPlanet('earth');
    } else {
      this.mesh.position.set(0, 0, 100);
    }

    // 2. Create screen-space warp overlay quad
    this.warpMaterial = new THREE.ShaderMaterial({
      vertexShader: warpVert,
      fragmentShader: warpFrag,
      uniforms: {
        uTime: { value: 0.0 },
        uWarpProgress: { value: 0.0 },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });

    const warpGeo = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      -1, -1, 0,  1, -1, 0, -1,  1, 0,
      -1,  1, 0,  1, -1, 0,  1,  1, 0
    ]);
    const uvs = new Float32Array([
      0, 0,  1, 0,  0, 1,
      0, 1,  1, 0,  1, 1
    ]);
    warpGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    warpGeo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

    this.warpQuad = new THREE.Mesh(warpGeo, this.warpMaterial);
    this.warpQuad.frustumCulled = false;

    // Add warp overlay to camera so it stays aligned with viewport
    this.camera.add(this.warpQuad);
  }

  private createSpacecraftMesh(): THREE.Group {
    const group = new THREE.Group();
    group.name = 'spacecraft';

    // Sleek metallic hull material
    const hullMat = new THREE.MeshStandardMaterial({
      color: 0x222831,
      metalness: 0.9,
      roughness: 0.15,
      flatShading: true,
    });

    // Emissive details material
    const accentMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00bcd4,
      emissiveIntensity: 0.5,
      metalness: 0.9,
      roughness: 0.1,
    });

    // Glass cockpit canopy
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x00e5ff,
      emissive: 0x00bcd4,
      emissiveIntensity: 1.0,
      transparent: true,
      opacity: 0.7,
    });

    // Emissive thruster exhaust material
    const engineGlowMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });

    // Fuselage
    const hullGeom = new THREE.ConeGeometry(0.5, 3, 6);
    hullGeom.rotateX(Math.PI / 2);
    const hull = new THREE.Mesh(hullGeom, hullMat);
    group.add(hull);

    // Rear engine exhaust ring
    const engineGeom = new THREE.CylinderGeometry(0.35, 0.45, 0.8, 6);
    engineGeom.rotateX(Math.PI / 2);
    const engine = new THREE.Mesh(engineGeom, hullMat);
    engine.position.set(0, 0, -1.3);
    group.add(engine);

    // Canopy
    const canopyGeom = new THREE.SphereGeometry(0.25, 8, 8);
    canopyGeom.scale(1, 0.5, 1.8);
    const canopy = new THREE.Mesh(canopyGeom, glassMat);
    canopy.position.set(0, 0.22, 0.3);
    group.add(canopy);

    // Left and Right Wings (Extruded sleek shapes)
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.lineTo(1.6, -1.2);
    wingShape.lineTo(1.4, -1.5);
    wingShape.lineTo(0.3, -0.9);
    wingShape.lineTo(0, -0.4);

    const wingExtrudeSettings = {
      depth: 0.05,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.015,
      bevelThickness: 0.015,
    };

    const wingGeom = new THREE.ExtrudeGeometry(wingShape, wingExtrudeSettings);
    wingGeom.rotateX(Math.PI / 2);
    wingGeom.center();

    const leftWing = new THREE.Mesh(wingGeom, hullMat);
    leftWing.position.set(-0.8, -0.05, -0.45);
    leftWing.scale.x = -1;
    group.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeom, hullMat);
    rightWing.position.set(0.8, -0.05, -0.45);
    group.add(rightWing);

    // Wingtip glowing engines/detailers
    const wingtipGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 5);
    wingtipGeom.rotateX(Math.PI / 2);
    
    const leftTip = new THREE.Mesh(wingtipGeom, accentMat);
    leftTip.position.set(-1.6, -0.05, -1.05);
    group.add(leftTip);

    const rightTip = new THREE.Mesh(wingtipGeom, accentMat);
    rightTip.position.set(1.6, -0.05, -1.05);
    group.add(rightTip);

    // Emissive thruster glow cone
    const glowGeom = new THREE.ConeGeometry(0.25, 1.5, 6);
    glowGeom.rotateX(-Math.PI / 2);
    glowGeom.translate(0, 0, -0.75);
    this.engineGlow = new THREE.Mesh(glowGeom, engineGlowMat);
    this.engineGlow.position.set(0, 0, -1.7);
    this.engineGlow.scale.set(0.001, 0.001, 0.001); // invisible at start
    group.add(this.engineGlow);

    // Dynamic thruster light source
    this.thrusterLight = new THREE.PointLight(0x00f0ff, 0.0, 10.0);
    this.thrusterLight.position.set(0, 0, -2.2);
    group.add(this.thrusterLight);

    // Fine scale adjustments
    group.scale.set(0.8, 0.8, 0.8);

    return group;
  }

  public attachToPlanet(planetId: string): void {
    const planetObj = this.scene.getObjectByName(`planet_group_${planetId}`);
    if (!planetObj) {
      console.warn(`Could not find planet_group_${planetId} to attach spacecraft`);
      return;
    }

    this.currentTargetPlanetId = planetId;
    planetObj.add(this.mesh);

    // Orbit coordinates depending on the planet size
    const bounds = new THREE.Box3().setFromObject(planetObj);
    const size = new THREE.Vector3();
    bounds.getSize(size);
    const radius = Math.max(size.x, size.y, size.z) * 0.5;

    const orbitOffset = radius * 1.5 + 1.2;
    this.mesh.position.set(0, orbitOffset * 0.7, orbitOffset * 0.7);
    this.mesh.lookAt(0, 0, 0);
    this.mesh.rotateY(Math.PI / 2); // face flight direction

    this.state = 'ORBITING';
  }

  public detachFromPlanet(): void {
    if (this.mesh.parent && this.mesh.parent !== this.scene) {
      const worldPos = new THREE.Vector3();
      this.mesh.getWorldPosition(worldPos);
      
      this.scene.add(this.mesh);
      this.mesh.position.copy(worldPos);
    }
    this.currentTargetPlanetId = null;
    this.state = 'IDLE';
  }

  public warpTo(targetPlanetId: string, onComplete?: () => void): void {
    if (this.state === 'WARPING') return;

    const targetPlanetObj = this.scene.getObjectByName(`planet_group_${targetPlanetId}`);
    if (!targetPlanetObj) {
      console.error(`Warp target planet_group_${targetPlanetId} not found in scene.`);
      return;
    }

    // 1. Detach from current parent
    this.detachFromPlanet();
    this.state = 'THRUSTING';

    const startPos = this.mesh.position.clone();
    
    // Find target's global coordinates
    const targetWorldPos = new THREE.Vector3();
    targetPlanetObj.getWorldPosition(targetWorldPos);

    // Direct look-at rotation towards the target
    this.mesh.lookAt(targetWorldPos);

    const direction = new THREE.Vector3().subVectors(targetWorldPos, startPos).normalize();

    // GSAP Timeline setup
    const tl = gsap.timeline({
      onComplete: () => {
        this.attachToPlanet(targetPlanetId);
        this.warpMaterial.uniforms.uWarpProgress.value = 0.0;
        this.engineGlow.scale.set(0.2, 0.2, 0.4);
        this.thrusterLight.intensity = 1.0;
        
        // Dispatch custom warp completed event
        window.dispatchEvent(
          new CustomEvent('spacecraftWarpComplete', {
            detail: { planetId: targetPlanetId },
          })
        );

        if (onComplete) onComplete();
      }
    });

    // Stage 1: Engage thruster charges (THRUSTING) - 1.2s
    tl.to(this.engineGlow.scale, {
      x: 1.8,
      y: 1.8,
      z: 3.5,
      duration: 1.2,
      ease: 'power2.in',
    }, 0);

    tl.to(this.thrusterLight, {
      intensity: 8.0,
      duration: 1.2,
      ease: 'power2.in',
    }, 0);

    // Slide back slightly before launching (anticipation)
    const pullBackPos = startPos.clone().sub(direction.clone().multiplyScalar(4.0));
    tl.to(this.mesh.position, {
      x: pullBackPos.x,
      y: pullBackPos.y,
      z: pullBackPos.z,
      duration: 1.2,
      ease: 'power2.inOut',
    }, 0);

    // Stage 2: Hyperspace jump (WARPING) - 1.8s
    tl.to({}, {
      duration: 0.1,
      onStart: () => {
        this.state = 'WARPING';
        // Expand Camera FOV (Zoom-out streak styling)
        const cameraController = useEngineStore.getState().cameraController;
        if (cameraController) {
          cameraController.setMode('FREE_ROAM');
        }
      }
    }, 1.2);

    tl.to(this.warpMaterial.uniforms.uWarpProgress, {
      value: 1.0,
      duration: 1.4,
      ease: 'power4.in',
    }, 1.2);

    if ('fov' in this.camera) {
      const cam = this.camera as THREE.PerspectiveCamera;
      tl.to(cam, {
        fov: 90,
        duration: 1.4,
        ease: 'power4.in',
        onUpdate: () => cam.updateProjectionMatrix(),
      }, 1.2);
    }

    // Teleport spaceship closer to target during screen warp peaks
    // Position spacecraft just outside the target planet's orbit bounds
    const bounds = new THREE.Box3().setFromObject(targetPlanetObj);
    const size = new THREE.Vector3();
    bounds.getSize(size);
    const radius = Math.max(size.x, size.y, size.z) * 0.5;
    const finalSpawnOffset = radius * 1.5 + 4.0;
    const preOrbitPos = targetWorldPos.clone().sub(direction.clone().multiplyScalar(finalSpawnOffset));

    tl.to(this.mesh.position, {
      x: preOrbitPos.x,
      y: preOrbitPos.y,
      z: preOrbitPos.z,
      duration: 1.5,
      ease: 'power3.inOut',
    }, 1.8);

    // Camera following interpolation
    const engine = useEngineStore.getState();
    if (engine.camera) {
      tl.to(engine.camera.position, {
        x: () => {
          const shipPos = this.mesh.position;
          return shipPos.x - direction.x * 20 + 0;
        },
        y: () => {
          const shipPos = this.mesh.position;
          return shipPos.y - direction.y * 20 + 8;
        },
        z: () => {
          const shipPos = this.mesh.position;
          return shipPos.z - direction.z * 20 + 0;
        },
        duration: 1.5,
        ease: 'power3.inOut',
      }, 1.8);
    }

    // Stage 3: Decelerate (Exit Warp) - 1.5s
    tl.to(this.warpMaterial.uniforms.uWarpProgress, {
      value: 0.0,
      duration: 1.5,
      ease: 'power2.out',
    }, 3.3);

    if ('fov' in this.camera) {
      const cam = this.camera as THREE.PerspectiveCamera;
      tl.to(cam, {
        fov: 60,
        duration: 1.5,
        ease: 'power2.out',
        onUpdate: () => cam.updateProjectionMatrix(),
      }, 3.3);
    }

    tl.to(this.engineGlow.scale, {
      x: 0.25,
      y: 0.25,
      z: 0.5,
      duration: 1.5,
      ease: 'power2.out',
    }, 3.3);

    tl.to(this.thrusterLight, {
      intensity: 1.5,
      duration: 1.5,
      ease: 'power2.out',
    }, 3.3);
  }

  public update(elapsedSeconds: number): void {
    // 1. Tick the warp shader timeline progress
    if (this.warpMaterial) {
      this.warpMaterial.uniforms.uTime.value = elapsedSeconds;
    }

    // 2. Add subtle hover oscillations (thruster visual vibrations)
    if (this.state === 'THRUSTING' || this.state === 'WARPING') {
      const wobble = 1.0 + Math.sin(elapsedSeconds * 40.0) * 0.1;
      this.engineGlow.scale.x = (this.state === 'WARPING' ? 1.8 : 1.5) * wobble;
      this.engineGlow.scale.y = (this.state === 'WARPING' ? 1.8 : 1.5) * wobble;
    } else {
      // Bob the spacecraft gently when idling or orbiting
      const bob = Math.sin(elapsedSeconds * 2.0) * 0.05;
      this.mesh.position.y += bob * 0.05;
    }

    // 3. Orbit tracking
    if (this.state === 'ORBITING' && this.currentTargetPlanetId) {
      // Just keep rotation around the planet
      this.mesh.rotateY(0.002);
    }
  }

  public dispose(): void {
    this.scene.remove(this.mesh);
    this.camera.remove(this.warpQuad);
    this.warpQuad.geometry.dispose();
    this.warpMaterial.dispose();
  }
}
