export interface GpuInfo {
  tier: 'HIGH' | 'MEDIUM' | 'LOW';
  renderer: string;
  vendor: string;
  isMobile: boolean;
}

export function detectGpuTier(): GpuInfo {
  if (typeof document === 'undefined') {
    return {
      tier: 'HIGH',
      renderer: 'Server-side',
      vendor: 'Server-side',
      isMobile: false,
    };
  }

  let renderer = 'Unknown';
  let vendor = 'Unknown';
  let gl: WebGLRenderingContext | null = null;

  try {
    const canvas = document.createElement('canvas');
    gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
    
    if (gl) {
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
        vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '';
      }
    }
  } catch (e) {
    console.warn('[gpuTier] WebGL initialization or profiling failed:', e);
  }

  const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );

  const rendererLower = renderer.toLowerCase();

  let tier: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH';

  if (isMobile) {
    tier = 'LOW';
  } else if (
    rendererLower.includes('intel') || 
    rendererLower.includes('swiftshader') || 
    rendererLower.includes('llvmpipe') || 
    rendererLower.includes('software') || 
    rendererLower.includes('integrated')
  ) {
    tier = 'MEDIUM';
  }

  return {
    tier,
    renderer,
    vendor,
    isMobile
  };
}
