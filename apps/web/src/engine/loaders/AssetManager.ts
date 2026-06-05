import * as THREE from 'three';
import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';

let ktx2Loader: KTX2Loader | null = null;
const textureCache = new Map<string, THREE.Texture>();

/**
 * Initializes the Asset Manager with the active WebGL renderer.
 * Required for KTX2Loader to query GPU support and initialize workers.
 */
export function initAssetManager(renderer: THREE.WebGLRenderer): void {
  if (ktx2Loader) return;

  try {
    ktx2Loader = new KTX2Loader();
    // Using unpkg CDN as the transcoder path for standard three.js transcoder binaries
    ktx2Loader.setTranscoderPath('https://unpkg.com/three@0.165.0/examples/jsm/libs/basis/');
    ktx2Loader.detectSupport(renderer);
    console.log('[AssetManager] KTX2Loader successfully initialized.');
  } catch (err) {
    console.warn('[AssetManager] Failed to initialize KTX2Loader:', err);
    ktx2Loader = null;
  }
}

/**
 * Generates a high-quality fallback canvas texture based on body type
 * to ensure rendering does not fail if external CDN textures are missing.
 */
export function createFallbackTexture(name: string): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture();

  const id = name.toLowerCase();

  // Create a realistic radial/linear gradient base color
  const gradient = ctx.createLinearGradient(0, 0, 0, 512);
  if (id.includes('sun')) {
    gradient.addColorStop(0, '#ffe082');
    gradient.addColorStop(0.5, '#ff8f00');
    gradient.addColorStop(1, '#d84315');
  } else if (id.includes('earth')) {
    gradient.addColorStop(0, '#1565c0');
    gradient.addColorStop(0.6, '#0d47a1');
    gradient.addColorStop(1, '#1b5e20'); // Earth landmass green
  } else if (id.includes('mars')) {
    gradient.addColorStop(0, '#ff8a65');
    gradient.addColorStop(0.5, '#d84315');
    gradient.addColorStop(1, '#3e2723');
  } else if (id.includes('jupiter')) {
    gradient.addColorStop(0, '#d7ccc8');
    gradient.addColorStop(0.3, '#a1887f');
    gradient.addColorStop(0.7, '#ffe0b2');
    gradient.addColorStop(1, '#8d6e63');
  } else if (id.includes('saturn')) {
    gradient.addColorStop(0, '#ffe0b2');
    gradient.addColorStop(0.5, '#bcaaa4');
    gradient.addColorStop(1, '#8d6e63');
  } else if (id.includes('uranus')) {
    gradient.addColorStop(0, '#e0f7fa');
    gradient.addColorStop(1, '#4dd0e1');
  } else if (id.includes('neptune')) {
    gradient.addColorStop(0, '#bbdefb');
    gradient.addColorStop(1, '#1565c0');
  } else if (id.includes('mercury')) {
    gradient.addColorStop(0, '#cfd8dc');
    gradient.addColorStop(1, '#546e7a');
  } else if (id.includes('moon')) {
    gradient.addColorStop(0, '#eceff1');
    gradient.addColorStop(1, '#78909c');
  } else if (id.includes('venus')) {
    gradient.addColorStop(0, '#ffe0b2');
    gradient.addColorStop(1, '#ffb74d');
  } else {
    gradient.addColorStop(0, '#37474f');
    gradient.addColorStop(1, '#212121');
  }

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 512);

  // Draw procedural atmospheric banding / noise layers
  ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  for (let i = 0; i < 15; i++) {
    const y = Math.random() * 512;
    const h = 20 + Math.random() * 60;
    ctx.fillRect(0, y, 512, h);
  }

  // Draw procedural craters / scanlines for depth
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
  ctx.lineWidth = 1;
  for (let y = 0; y < 512; y += 8) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(512, y);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/**
 * Asynchronously loads a texture file (either .basis/KTX2 or standard images).
 * Automatically falls back to a high-quality procedural texture if loading fails.
 */
export function loadTexture(path: string): Promise<THREE.Texture> {
  if (textureCache.has(path)) {
    return Promise.resolve(textureCache.get(path)!);
  }

  // Resolve URL: use CDN if configured, otherwise load from local /textures/ dir
  // In dev mode, Vite serves public/ at root, so /textures/earth/earth_day_8k.jpg works
  const cdnBase = import.meta.env.VITE_CDN_BASE_URL || '';
  let fullUrl: string;
  if (path.startsWith('http')) {
    fullUrl = path;
  } else if (cdnBase) {
    fullUrl = `${cdnBase}/textures/${path}`;
  } else {
    fullUrl = `/textures/${path}`;
  }

  return new Promise((resolve) => {
    const handleSuccess = (texture: THREE.Texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      textureCache.set(path, texture);
      resolve(texture);
    };

    const handleFailure = (error: unknown) => {
      console.warn(`[AssetManager] Failed to load texture: ${path}. Using procedural fallback. Error:`, error);
      const fallback = createFallbackTexture(path);
      textureCache.set(path, fallback);
      resolve(fallback);
    };

    if (path.endsWith('.basis') || path.endsWith('.ktx2')) {
      if (!ktx2Loader) {
        console.warn('[AssetManager] KTX2Loader not initialized. Loading fallback.');
        resolve(createFallbackTexture(path));
        return;
      }

      try {
        ktx2Loader.load(
          fullUrl,
          handleSuccess,
          undefined,
          handleFailure
        );
      } catch (err) {
        console.error('[AssetManager] Error loading KTX2/Basis texture:', err);
        resolve(createFallbackTexture(path));
      }
    } else {
      const loader = new THREE.TextureLoader();
      loader.load(
        fullUrl,
        handleSuccess,
        undefined,
        handleFailure
      );
    }
  });
}

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

let gltfLoader: GLTFLoader | null = null;

export function getGLTFLoader(): GLTFLoader {
  if (gltfLoader) return gltfLoader;

  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

  gltfLoader = new GLTFLoader();
  gltfLoader.setDRACOLoader(dracoLoader);

  return gltfLoader;
}

/**
 * Loads a glTF/glb 3D model.
 */
export function loadModel(path: string): Promise<THREE.Group> {
  const loader = getGLTFLoader();
  const fullUrl = path.startsWith('http') ? path : `/models/${path}`;

  return new Promise((resolve, reject) => {
    loader.load(
      fullUrl,
      (gltf) => {
        resolve(gltf.scene);
      },
      undefined,
      (error) => {
        console.error(`[AssetManager] Failed to load 3D model: ${path}`, error);
        reject(error);
      }
    );
  });
}
