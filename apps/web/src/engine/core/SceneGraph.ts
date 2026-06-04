import * as THREE from 'three';

export enum SceneLayer {
  UNIVERSE = 0,
  PLANETS = 1,
  SPACECRAFT = 2,
  EFFECTS = 3,
  HUD = 4,
}

export interface SceneGraph {
  scene: THREE.Scene;
  sunLight: THREE.PointLight;
  ambientLight: THREE.AmbientLight;
  addObject(obj: THREE.Object3D, layer: SceneLayer): void;
  removeObject(obj: THREE.Object3D | string): void;
  getObject(nameOrId: string): THREE.Object3D | undefined;
}

/**
 * Recursively applies a layer mask to an object and all of its descendants.
 */
function setLayerRecursive(object: THREE.Object3D, layer: number): void {
  object.layers.set(layer);
  object.traverse((child) => {
    child.layers.set(layer);
  });
}

/**
 * Initializes and manages the root THREE.Scene and lighting rig.
 * 
 * Configures:
 * - Exponential Fog (color: 0x0A0E2A space navy, density: 0.00008)
 * - Space ambient lighting (intensity: 0.02, near-darkness)
 * - Single point light source at origin (Sun) casting soft shadows (intensity: 3.5, range: 2000)
 * - Strict layering system (UNIVERSE, PLANETS, SPACECRAFT, EFFECTS, HUD)
 */
export function createSceneGraph(): SceneGraph {
  const scene = new THREE.Scene();

  // Space-navy background and exponential fog
  scene.background = new THREE.Color(0x0A0E2A);
  scene.fog = new THREE.FogExp2(0x0A0E2A, 0.00008);

  // Near-zero ambient light representing the cold dark void of space
  const ambientLight = new THREE.AmbientLight(0xE8F0FF, 0.02);
  ambientLight.layers.enableAll();
  scene.add(ambientLight);

  // Primary light source - The Sun
  const sunLight = new THREE.PointLight(0xFFF4EA, 3.5, 0);
  sunLight.decay = 0;
  sunLight.position.set(0, 0, 0);
  sunLight.castShadow = true;
  sunLight.layers.enableAll();
  
  // Shadow resolution settings for high quality rendering
  sunLight.shadow.mapSize.width = 2048;
  sunLight.shadow.mapSize.height = 2048;
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 2000;
  sunLight.shadow.bias = -0.0005;

  scene.add(sunLight);

  const graph: SceneGraph = {
    scene,
    sunLight,
    ambientLight,

    addObject(obj: THREE.Object3D, layer: SceneLayer) {
      setLayerRecursive(obj, layer);
      scene.add(obj);
    },

    removeObject(obj: THREE.Object3D | string) {
      const target = typeof obj === 'string' ? scene.getObjectByName(obj) : obj;
      if (target) {
        scene.remove(target);
      }
    },

    getObject(nameOrId: string): THREE.Object3D | undefined {
      return scene.getObjectByName(nameOrId) || scene.getObjectById(parseInt(nameOrId)) || undefined;
    },
  };

  return graph;
}
