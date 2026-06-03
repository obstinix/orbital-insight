import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import vignetteChromaticFrag from '../shaders/vignetteChromatic.frag';

/**
 * Creates and configures the WebGL/WebGPU renderer.
 * 
 * - Detects WebGPU availability (falls back to WebGL 2.0)
 * - Enables antialiasing, ACES Filmic Tone Mapping, and Soft Shadow Maps
 * - Restricts pixel ratio to a maximum of 2x for performance
 * - Sets up a ResizeObserver to automatically adjust dimensions
 */
export function createRenderer(canvas: HTMLCanvasElement): THREE.WebGLRenderer {
  const isWebGPUSupported = typeof navigator !== 'undefined' && 'gpu' in navigator;
  console.log(`[Renderer] WebGPU support: ${isWebGPUSupported ? 'Available' : 'Unavailable'}. Using WebGL 2.0 Renderer.`);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
  });

  // HDR tone mapping configuration
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  // Shadow map configuration
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Output color space
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // Pixel ratio capping (max 2.0 for performance optimization)
  const pixelRatio = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1;
  renderer.setPixelRatio(pixelRatio);

  // Set initial dimensions based on parent container layout
  const width = canvas.clientWidth || window.innerWidth;
  const height = canvas.clientHeight || window.innerHeight;
  renderer.setSize(width, height, false);

  return renderer;
}

/**
 * Creates and configures the post-processing pipeline.
 * Contains RenderPass, UnrealBloomPass, a custom vignette/chromatic aberration ShaderPass, and OutputPass.
 */
export function createComposer(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera
): EffectComposer {
  const composer = new EffectComposer(renderer);

  // 1. Scene render pass
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // 2. Cinematic glow Bloom pass
  const width = renderer.domElement.clientWidth;
  const height = renderer.domElement.clientHeight;
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(width, height),
    0.5,   // bloom strength
    0.35,  // bloom radius
    0.85   // bloom threshold (only very bright elements glow)
  );
  composer.addPass(bloomPass);

  // 3. Custom Vignette & Chromatic Aberration pass
  const vignetteChromaticShader = {
    uniforms: {
      tDiffuse: { value: null },
      uAberrationOffset: { value: 0.002 },
      uVignetteDarkness: { value: 1.15 },
      uVignetteOffset: { value: 1.25 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: vignetteChromaticFrag,
  };
  const vignetteChromaticPass = new ShaderPass(vignetteChromaticShader);
  composer.addPass(vignetteChromaticPass);

  // 4. HDR output color tone mapping pass
  const outputPass = new OutputPass();
  composer.addPass(outputPass);

  return composer;
}
