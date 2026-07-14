import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import vignetteChromaticFrag from '../shaders/vignetteChromatic.frag';


export function createRenderer(canvas: HTMLCanvasElement): THREE.WebGLRenderer {
  const isWebGPUSupported = typeof navigator !== 'undefined' && 'gpu' in navigator;
  console.log(`[Renderer] WebGPU support: ${isWebGPUSupported ? 'Available' : 'Unavailable'}. Using WebGL 2.0 Renderer.`);

  // WebGL availability check
  const testCanvas = document.createElement('canvas');
  const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
  if (!gl) {
    throw new Error(
      'WebGL is not available in your browser.\n' +
      'Please enable hardware acceleration:\n' +
      'Chrome: Settings → System → Use hardware acceleration\n' +
      'Firefox: about:config → webgl.disabled = false'
    );
  }

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
  // Create a multisampled render target for hardware-accelerated antialiasing (MSAA 4x)
  const size = renderer.getSize(new THREE.Vector2());
  const renderTarget = new THREE.WebGLRenderTarget(size.x, size.y, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    colorSpace: THREE.SRGBColorSpace,
    samples: 4
  });

  const composer = new EffectComposer(renderer, renderTarget);

  // 1. Scene render pass
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // 2. Cinematic glow Bloom pass
  const width = renderer.domElement.clientWidth;
  const height = renderer.domElement.clientHeight;
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(width, height),
    0.85,  // bloom strength
    0.65,  // bloom radius
    0.55   // bloom threshold (lower threshold makes stars/corona bloom naturally)
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
