import * as THREE from 'three';
import gsap from 'gsap';
import { SpacecraftController } from '../spacecraft/SpacecraftController';
import { useJourneyStore, CHAPTERS } from '../store/useJourneyStore';
import { useEngineStore } from '../store/useEngineStore';
import { usePlanetStore } from '../store/usePlanetStore';
import blackholeVert from '../engine/shaders/blackhole.vert';
import blackholeFrag from '../engine/shaders/blackhole.frag';
import nebulaVert from '../engine/shaders/nebula.vert';
import nebulaFrag from '../engine/shaders/nebula.frag';

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
  private activeTimeline: gsap.core.Timeline | null = null;

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
    if (this.alphaCentauriGroup) this.alphaCentauriGroup.visible = chapterId === 4;
    if (this.blackHoleGroup) this.blackHoleGroup.visible = chapterId === 7;
    if (this.cmbHorizonMesh) this.cmbHorizonMesh.visible = chapterId === 8;
  }

  /**
    * Resumes the paused scripted timeline sequence.
    */
  public resumeSequence(): void {
    const store = useJourneyStore.getState();
    if (store.isPaused && this.activeTimeline) {
      store.setIsPaused(false);
      store.setPausedMessage('');
      
      const cameraController = useEngineStore.getState().cameraController;
      if (cameraController) {
        cameraController.setMode('FREE_ROAM');
      }
      
      this.activeTimeline.play();
    }
  }

  /**
    * Triggers the cinematic flight sequence to jump to the selected chapter coordinates.
    */
  public async selectChapter(chapterId: number): Promise<void> {
    const store = useJourneyStore.getState();
    if (store.isTransitioning) return;

    store.setIsTransitioning(true);
    store.setCurrentChapterId(chapterId);
    store.setIsPaused(false);
    store.setPausedMessage('');

    const chapter = CHAPTERS.find((c) => c.id === chapterId);
    if (!chapter) {
      store.setIsTransitioning(false);
      return;
    }

    // Kill active timeline
    if (this.activeTimeline) {
      this.activeTimeline.kill();
      this.activeTimeline = null;
    }

    // Toggle active interstellar structures
    this.toggleAssetVisibility(chapterId);

    const speak = (msg: string) => {
      window.dispatchEvent(new CustomEvent('novaMessage', { detail: { text: msg } }));
    };

    if (chapterId === 1) {
      // Earth atmospheric entry sequence
      const earthObj = this.scene.getObjectByName('planet_group_earth');
      if (earthObj) {
        this.spacecraft.detachFromPlanet();
        const startPos = new THREE.Vector3();
        earthObj.getWorldPosition(startPos);
        this.spacecraft.mesh.position.copy(startPos).add(new THREE.Vector3(0, 20, 80));
        this.spacecraft.mesh.lookAt(startPos);
      }

      this.spacecraft.state = 'THRUSTING';
      const tl = gsap.timeline({
        onComplete: () => {
          this.spacecraft.attachToPlanet('earth');
          this.spacecraft.state = 'ORBITING';
          
          const cameraController = useEngineStore.getState().cameraController;
          if (cameraController) {
            const planetObj = this.scene.getObjectByName('planet_group_earth');
            if (planetObj) {
              cameraController.setOrbitTarget(planetObj);
              cameraController.setMode('ORBIT');
            }
          }

          store.setIsTransitioning(false);
          store.setIsPaused(false);
          store.setPausedMessage('');
        }
      });
      this.activeTimeline = tl;

      speak("NOVA: Beginning Earth atmospheric entry. Current altitude: 600 km. Friction dynamics normal.");

      tl.to(this.spacecraft.mesh.position, {
        y: '+=5',
        z: '-=25',
        duration: 3,
        ease: 'power1.inOut',
        onComplete: () => {
          tl.pause();
          store.setIsPaused(true);
          store.setPausedMessage("Atmospheric density increasing. Align heat shield angle before entry.");
          speak("NOVA: Holding trajectory at 120 km. Standing by for shield pitch alignment confirmation.");

          const cameraController = useEngineStore.getState().cameraController;
          if (cameraController) {
            cameraController.setOrbitTarget(this.spacecraft.mesh);
            cameraController.setMode('ORBIT');
          }
        }
      });

      tl.to({}, {
        duration: 0.1,
        onStart: () => {
          speak("NOVA: Heat shield pitch confirmed. Engaging descent thrust. Blackout sequence in progress...");
          this.spacecraft.state = 'WARPING';
        }
      });

      tl.to(this.spacecraft.mesh.position, {
        y: '-=12',
        z: '-=35',
        duration: 4,
        ease: 'power2.in',
        onComplete: () => {
          tl.pause();
          store.setIsPaused(true);
          store.setPausedMessage("Deceleration G-forces peaking. Activate drag/magnetic stabilizers.");
          speak("NOVA: Blackout cleared. Trajectory locked at 65 km altitude. Standing by for stabilizer deployment.");

          const cameraController = useEngineStore.getState().cameraController;
          if (cameraController) {
            cameraController.setOrbitTarget(this.spacecraft.mesh);
            cameraController.setMode('ORBIT');
          }
        }
      });

      tl.to({}, {
        duration: 0.1,
        onStart: () => {
          speak("NOVA: Stabilizers deployed. Decelerating to terminal orbit velocity.");
          this.spacecraft.state = 'THRUSTING';
        }
      });

      const earthPos = new THREE.Vector3();
      earthObj?.getWorldPosition(earthPos);
      tl.to(this.spacecraft.mesh.position, {
        x: earthPos.x,
        y: earthPos.y + 6,
        z: earthPos.z + 14,
        duration: 3,
        ease: 'power2.out',
        onComplete: () => {
          speak("NOVA: Welcome back to the Cradle of Humanity. Orbit stabilized at 100 km.");
        }
      });

    } else if (chapterId === 2) {
      // Solar system flyover sequence
      const earthObj = this.scene.getObjectByName('planet_group_earth');
      const marsObj = this.scene.getObjectByName('planet_group_mars');
      if (earthObj && marsObj) {
        this.spacecraft.detachFromPlanet();
        const startPos = new THREE.Vector3();
        earthObj.getWorldPosition(startPos);
        this.spacecraft.mesh.position.copy(startPos).add(new THREE.Vector3(0, 10, 30));
        this.spacecraft.mesh.lookAt(marsObj.position);
      }

      this.spacecraft.state = 'WARPING';
      const tl = gsap.timeline({
        onComplete: () => {
          this.spacecraft.attachToPlanet('mars');
          this.spacecraft.state = 'ORBITING';
          
          const cameraController = useEngineStore.getState().cameraController;
          if (cameraController) {
            const planetObj = this.scene.getObjectByName('planet_group_mars');
            if (planetObj) {
              cameraController.setOrbitTarget(planetObj);
              cameraController.setMode('ORBIT');
            }
          }

          store.setIsTransitioning(false);
          store.setIsPaused(false);
          store.setPausedMessage('');
        }
      });
      this.activeTimeline = tl;

      speak("NOVA: Initiating interplanetary flyover cruise. Course set for Mars corridor.");

      tl.to(this.spacecraft.mesh.position, {
        x: () => marsObj ? marsObj.position.x * 0.4 : 0,
        y: () => marsObj ? marsObj.position.y * 0.4 + 10 : 0,
        z: () => marsObj ? marsObj.position.z * 0.4 + 100 : 0,
        duration: 3.5,
        ease: 'power2.inOut',
        onComplete: () => {
          tl.pause();
          store.setIsPaused(true);
          store.setPausedMessage("Entering asteroid field perimeter. Verify collision avoidance grid.");
          speak("NOVA: Warp cruise suspended. Proximity warnings active for high-velocity dust particles.");

          const cameraController = useEngineStore.getState().cameraController;
          if (cameraController) {
            cameraController.setOrbitTarget(this.spacecraft.mesh);
            cameraController.setMode('ORBIT');
          }
        }
      });

      tl.to({}, {
        duration: 0.1,
        onStart: () => {
          speak("NOVA: Deflection grid active. Navigating asteroid belt channels.");
          this.spacecraft.state = 'THRUSTING';
        }
      });

      tl.to(this.spacecraft.mesh.position, {
        x: () => marsObj ? marsObj.position.x * 0.85 : 0,
        y: () => marsObj ? marsObj.position.y * 0.85 + 15 : 0,
        z: () => marsObj ? marsObj.position.z * 0.85 + 50 : 0,
        duration: 3.5,
        onComplete: () => {
          tl.pause();
          store.setIsPaused(true);
          store.setPausedMessage("Mars orbit insertion point reached. Confirm deceleration burn.");
          speak("NOVA: Mars gravity well intercepted. Standing by for retro-fire orbital capture.");

          const cameraController = useEngineStore.getState().cameraController;
          if (cameraController) {
            cameraController.setOrbitTarget(this.spacecraft.mesh);
            cameraController.setMode('ORBIT');
          }
        }
      });

      tl.to({}, {
        duration: 0.1,
        onStart: () => {
          speak("NOVA: Retro-rockets firing. Speed reduced for orbit capture.");
          this.spacecraft.state = 'ORBITING';
        }
      });

      tl.to(this.spacecraft.mesh.position, {
        x: () => marsObj ? marsObj.position.x : 0,
        y: () => marsObj ? marsObj.position.y + 6 : 0,
        z: () => marsObj ? marsObj.position.z + 12 : 0,
        duration: 3,
        ease: 'power2.out',
        onComplete: () => {
          speak("NOVA: Interplanetary cruise completed. Welcome to Mars orbit.");
        }
      });

    } else if (chapterId === 3) {
      // Sun/Heliosphere sequence
      const marsObj = this.scene.getObjectByName('planet_group_mars');
      const sunObj = this.scene.getObjectByName('planet_group_sun');
      if (marsObj && sunObj) {
        this.spacecraft.detachFromPlanet();
        const startPos = new THREE.Vector3();
        marsObj.getWorldPosition(startPos);
        this.spacecraft.mesh.position.copy(startPos).add(new THREE.Vector3(0, 10, 30));
        this.spacecraft.mesh.lookAt(sunObj.position);
      }

      this.spacecraft.state = 'WARPING';
      const tl = gsap.timeline({
        onComplete: () => {
          this.spacecraft.attachToPlanet('sun');
          this.spacecraft.state = 'ORBITING';
          
          const cameraController = useEngineStore.getState().cameraController;
          if (cameraController) {
            const planetObj = this.scene.getObjectByName('planet_group_sun');
            if (planetObj) {
              cameraController.setOrbitTarget(planetObj);
              cameraController.setMode('ORBIT');
            }
          }

          store.setIsTransitioning(false);
          store.setIsPaused(false);
          store.setPausedMessage('');
        }
      });
      this.activeTimeline = tl;

      speak("NOVA: Trajectory course set inwards towards the Sun. Deploying radiation collectors.");

      tl.to(this.spacecraft.mesh.position, {
        x: 0,
        y: 10,
        z: 300,
        duration: 3,
        ease: 'power2.inOut',
        onComplete: () => {
          tl.pause();
          store.setIsPaused(true);
          store.setPausedMessage("Entering the solar coronal boundary. Align solar sails for energy capture.");
          speak("NOVA: Severe heat shields engaged. Solar wind density peaking. Stand by.");

          const cameraController = useEngineStore.getState().cameraController;
          if (cameraController) {
            cameraController.setOrbitTarget(this.spacecraft.mesh);
            cameraController.setMode('ORBIT');
          }
        }
      });

      tl.to({}, {
        duration: 0.1,
        onStart: () => {
          speak("NOVA: Coronal insertion successful. Accessing real-time magnetic loop data.");
          this.spacecraft.state = 'THRUSTING';
        }
      });

      tl.to(this.spacecraft.mesh.position, {
        x: 0,
        y: 8,
        z: 80,
        duration: 3.5,
        onComplete: () => {
          tl.pause();
          store.setIsPaused(true);
          store.setPausedMessage("Solar wind acceleration zone reached. Calibrate magnetic spectrometers.");
          speak("NOVA: Heliosphere boundary sensor array ready. Standing by for spectrometer diagnostics.");

          const cameraController = useEngineStore.getState().cameraController;
          if (cameraController) {
            cameraController.setOrbitTarget(this.spacecraft.mesh);
            cameraController.setMode('ORBIT');
          }
        }
      });

      tl.to({}, {
        duration: 0.1,
        onStart: () => {
          speak("NOVA: Diagnostics complete. Core telemetry stable.");
          this.spacecraft.state = 'ORBITING';
        }
      });

      tl.to(this.spacecraft.mesh.position, {
        x: 0,
        y: 0,
        z: 35,
        duration: 2.5,
        ease: 'power2.out',
        onComplete: () => {
          speak("NOVA: Standard sunward orbit achieved. Solar corona research active.");
        }
      });

    } else if (chapterId === 4) {
      // Alpha Centauri Approach sequence
      const sunObj = this.scene.getObjectByName('planet_group_sun');
      if (sunObj) {
        this.spacecraft.detachFromPlanet();
        const startPos = new THREE.Vector3();
        sunObj.getWorldPosition(startPos);
        this.spacecraft.mesh.position.copy(startPos).add(new THREE.Vector3(0, 10, 30));
      }

      const destPos = new THREE.Vector3(3000, 200, -5000);
      this.spacecraft.mesh.lookAt(destPos);

      this.spacecraft.state = 'WARPING';
      const tl = gsap.timeline({
        onComplete: () => {
          this.spacecraft.state = 'IDLE';
          
          const cameraController = useEngineStore.getState().cameraController;
          if (cameraController) {
            cameraController.setOrbitTarget(this.spacecraft.mesh);
            cameraController.setMode('ORBIT');
          }

          store.setIsTransitioning(false);
          store.setIsPaused(false);
          store.setPausedMessage('');
        }
      });
      this.activeTimeline = tl;

      speak("NOVA: Starting interstellar hyperdrive sequence. Range: 4.37 Light Years. Engaging warp fields.");

      tl.to(this.spacecraft.mesh.position, {
        x: destPos.x * 0.4,
        y: destPos.y * 0.4,
        z: destPos.z * 0.4,
        duration: 3.5,
        ease: 'power3.in',
        onComplete: () => {
          tl.pause();
          store.setIsPaused(true);
          store.setPausedMessage("Entering Oort Cloud cluster. Scan for icy debris objects.");
          speak("NOVA: Approaching outer Kuiper belt and Oort cloud debris. Commencing sensor sweeps.");

          const cameraController = useEngineStore.getState().cameraController;
          if (cameraController) {
            cameraController.setOrbitTarget(this.spacecraft.mesh);
            cameraController.setMode('ORBIT');
          }
        }
      });

      tl.to({}, {
        duration: 0.1,
        onStart: () => {
          speak("NOVA: Icy debris cleared. Re-engaging warp trajectory to trinary system.");
          this.spacecraft.state = 'WARPING';
        }
      });

      tl.to(this.spacecraft.mesh.position, {
        x: destPos.x * 0.85,
        y: destPos.y * 0.85,
        z: destPos.z * 0.85,
        duration: 3.5,
        onComplete: () => {
          tl.pause();
          store.setIsPaused(true);
          store.setPausedMessage("Binary gravity well detected. Calibrate stellar drift compensators.");
          speak("NOVA: Approaching Alpha Centauri binary barycenter. Standing by for drift calibration.");

          const cameraController = useEngineStore.getState().cameraController;
          if (cameraController) {
            cameraController.setOrbitTarget(this.spacecraft.mesh);
            cameraController.setMode('ORBIT');
          }
        }
      });

      tl.to({}, {
        duration: 0.1,
        onStart: () => {
          speak("NOVA: Compensators active. Decelerating to system flight paths.");
          this.spacecraft.state = 'THRUSTING';
        }
      });

      tl.to(this.spacecraft.mesh.position, {
        x: destPos.x,
        y: destPos.y + 50,
        z: destPos.z + 250,
        duration: 3,
        ease: 'power2.out',
        onComplete: () => {
          speak("NOVA: Interstellar arrival confirmed. Welcome to the Alpha Centauri System.");
        }
      });

    } else {
      // Standard transitions for chapters 5, 6, 7, 8
      const isPlanetTarget = ['earth', 'mars', 'sun', 'jupiter', 'saturn'].includes(chapter.focusId);

      if (isPlanetTarget) {
        usePlanetStore.getState().setSelectedPlanetId(chapter.focusId);
        
        this.spacecraft.warpTo(chapter.focusId, () => {
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
        usePlanetStore.getState().setSelectedPlanetId(null);
        this.spacecraft.detachFromPlanet();

        const destPos = new THREE.Vector3();
        if (chapterId === 7 && this.blackHoleGroup) destPos.copy(this.blackHoleGroup.position).add(new THREE.Vector3(0, 100, 350));
        if (chapterId === 8 && this.cmbHorizonMesh) destPos.copy(this.cmbHorizonMesh.position).add(new THREE.Vector3(0, 0, 600));

        const startPos = this.spacecraft.mesh.position.clone();
        this.spacecraft.mesh.lookAt(destPos);
        
        const direction = new THREE.Vector3().subVectors(destPos, startPos).normalize();
        
        // Execute manual deep space warp animation
        // @ts-ignore
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
            
            const cameraController = useEngineStore.getState().cameraController;
            if (cameraController) {
              cameraController.setOrbitTarget(this.spacecraft.mesh);
              cameraController.setMode('ORBIT');
            }

            store.setIsTransitioning(false);
          }
        });

        this.spacecraft.state = 'THRUSTING';

        tl.to(glowMesh.scale, { x: 1.5, y: 1.5, z: 3.5, duration: 1.0, ease: 'power2.in' }, 0);
        tl.to(light, { intensity: 7.0, duration: 1.0, ease: 'power2.in' }, 0);

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
  }

  /**
    * Updates deep space animations (like Oort cloud rotations or black hole disk spins).
    */
  public update(elapsedSeconds: number): void {
    const store = useJourneyStore.getState();
    
    // Dynamic camera follow during transitions
    if (store.isTransitioning && !store.isPaused) {
      const cameraController = useEngineStore.getState().cameraController;
      if (cameraController && cameraController.mode !== 'FREE_ROAM') {
        cameraController.setMode('FREE_ROAM');
      }

      const engine = useEngineStore.getState();
      if (engine.camera) {
        const offset = new THREE.Vector3(0, 5, 25);
        const targetCamPos = this.spacecraft.mesh.position.clone().add(offset);
        engine.camera.position.lerp(targetCamPos, 0.08);
        engine.camera.lookAt(this.spacecraft.mesh.position);
      }
    }

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

