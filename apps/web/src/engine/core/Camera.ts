import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import gsap from 'gsap';

export type CameraMode = 'FREE_ROAM' | 'ORBIT' | 'CINEMATIC';

export interface CameraController {
  mode: CameraMode;
  controls: OrbitControls;
  setMode(
    newMode: CameraMode,
    destinationPos?: THREE.Vector3,
    destinationLookAt?: THREE.Vector3
  ): Promise<void>;
  setOrbitTarget(target: THREE.Object3D | THREE.Vector3): void;
  update(): void;
  dispose(): void;
}

/**
 * Creates and manages the camera controller with cinematic transition systems.
 * 
 * Camera modes:
 * - FREE_ROAM: Orbit controls enabled with inertia (damping)
 * - ORBIT: Locked orbit around a moving/stationary target body
 * - CINEMATIC: Path animated (gsap-controlled) with disabled input
 */
export function createCameraController(
  camera: THREE.PerspectiveCamera,
  canvas: HTMLCanvasElement
): CameraController {
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxDistance = 5000;
  controls.minDistance = 2;

  let currentMode: CameraMode = 'FREE_ROAM';
  let orbitTargetObject: THREE.Object3D | null = null;
  let isTransitioning = false;

  // Listeners or intervals to track targets in ORBIT mode
  const targetPos = new THREE.Vector3();

  const controller: CameraController = {
    get mode() {
      return currentMode;
    },
    controls,

    setOrbitTarget(target: THREE.Object3D | THREE.Vector3) {
      if (target instanceof THREE.Object3D) {
        orbitTargetObject = target;
        controls.target.copy(target.position);
      } else {
        orbitTargetObject = null;
        controls.target.copy(target);
      }
    },

    update() {
      if (currentMode === 'CINEMATIC') {
        // Render loop updates during active timeline pathing, controls disabled
        return;
      }

      if (currentMode === 'ORBIT' && orbitTargetObject && !isTransitioning) {
        // Lock controls target to the dynamic object's position
        orbitTargetObject.getWorldPosition(targetPos);
        
        // Offset controls target without resetting user zoom/rotation
        const offset = new THREE.Vector3().copy(camera.position).sub(controls.target);
        controls.target.copy(targetPos);
        camera.position.copy(targetPos).add(offset);
      }

      controls.update();
    },

    async setMode(
      newMode: CameraMode,
      destinationPos?: THREE.Vector3,
      destinationLookAt?: THREE.Vector3
    ): Promise<void> {
      if (newMode === currentMode && !destinationPos) return;

      isTransitioning = true;
      
      // Dispatch start event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('cameraTransitionStart', { detail: { from: currentMode, to: newMode } })
        );
      }

      // If cinematic, disable orbit control actions
      if (newMode === 'CINEMATIC') {
        controls.enabled = false;
      } else {
        controls.enabled = true;
      }

      const tweenPromises: Promise<void>[] = [];

      if (destinationPos) {
        tweenPromises.push(
          new Promise<void>((resolve) => {
            gsap.to(camera.position, {
              x: destinationPos.x,
              y: destinationPos.y,
              z: destinationPos.z,
              duration: 1.2,
              ease: 'power2.out', // Maps smoothly to --ease-warp (cubic-bezier(0.25, 0.46, 0.45, 0.94))
              onComplete: resolve,
            });
          })
        );
      }

      if (destinationLookAt) {
        tweenPromises.push(
          new Promise<void>((resolve) => {
            gsap.to(controls.target, {
              x: destinationLookAt.x,
              y: destinationLookAt.y,
              z: destinationLookAt.z,
              duration: 1.2,
              ease: 'power2.out',
              onComplete: resolve,
            });
          })
        );
      }

      if (tweenPromises.length > 0) {
        await Promise.all(tweenPromises);
      } else if (newMode === 'ORBIT' && orbitTargetObject) {
        // Animate controls target to orbit target object if none provided
        orbitTargetObject.getWorldPosition(targetPos);
        await new Promise<void>((resolve) => {
          gsap.to(controls.target, {
            x: targetPos.x,
            y: targetPos.y,
            z: targetPos.z,
            duration: 1.2,
            ease: 'power2.out',
            onComplete: resolve,
          });
        });
      }

      currentMode = newMode;
      isTransitioning = false;

      if (currentMode === 'CINEMATIC') {
        controls.enabled = false;
      } else {
        controls.enabled = true;
      }

      // Dispatch end event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('cameraTransitionEnd', { detail: { mode: currentMode } })
        );
      }
    },

    dispose() {
      controls.dispose();
    },
  };

  return controller;
}
