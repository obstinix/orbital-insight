const IS_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
const CDN_BASE = import.meta.env.VITE_CDN_BASE_URL ?? '';

export function assetUrl(path: string, type: 'texture' | 'model' | 'raw' = 'raw'): string {
  if (path.startsWith('http')) return path;

  if (IS_MOCK || !CDN_BASE) {
    if (type === 'texture') return `/textures/${path}`;
    if (type === 'model') return `/models/${path}`;
    return `/${path}`;
  }

  if (type === 'texture') return `${CDN_BASE}/textures/${path}`;
  if (type === 'model') return `${CDN_BASE}/models/${path}`;
  return `${CDN_BASE}/${path}`;
}
