import { create } from 'zustand';
import * as THREE from 'three';
import { CameraController } from '../engine/core/Camera';
import { SceneGraph } from '../engine/core/SceneGraph';
import { SpacecraftController } from '../spacecraft/SpacecraftController';
import { JourneyMode } from '../modes/JourneyMode';
import { ConstellationLines } from '../engine/bodies/ConstellationLines';

interface EngineState {
  isInitialized: boolean;
  renderer: THREE.WebGLRenderer | null;
  scene: THREE.Scene | null;
  camera: THREE.PerspectiveCamera | null;
  cameraController: CameraController | null;
  sceneGraph: SceneGraph | null;
  spacecraftController: SpacecraftController | null;
  journeyMode: JourneyMode | null;
  constellationLines: ConstellationLines | null;
  initEngine: (
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    cameraController: CameraController,
    sceneGraph: SceneGraph,
    spacecraftController: SpacecraftController,
    journeyMode: JourneyMode,
    constellationLines: ConstellationLines
  ) => void;
}

export const useEngineStore = create<EngineState>((set) => ({
  isInitialized: false,
  renderer: null,
  scene: null,
  camera: null,
  cameraController: null,
  sceneGraph: null,
  spacecraftController: null,
  journeyMode: null,
  constellationLines: null,
  initEngine: (renderer, scene, camera, cameraController, sceneGraph, spacecraftController, journeyMode, constellationLines) =>
    set({
      isInitialized: true,
      renderer,
      scene,
      camera,
      cameraController,
      sceneGraph,
      spacecraftController,
      journeyMode,
      constellationLines,
    }),
}));
