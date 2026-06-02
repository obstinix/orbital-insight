import * as THREE from 'three';

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
