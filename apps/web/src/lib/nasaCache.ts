// Cache NASA API responses in sessionStorage to avoid rate-limit hits

const TTL_MS = 1000 * 60 * 30; // 30 minutes

export async function fetchNASA(endpoint: string, params: Record<string, string> = {}) {
  const key = `nasa:${endpoint}:${JSON.stringify(params)}`;
  const cached = sessionStorage.getItem(key);

  if (cached) {
    const { data, ts } = JSON.parse(cached);
    if (Date.now() - ts < TTL_MS) return data;
  }

  const url = new URL(`https://api.nasa.gov/${endpoint}`);
  url.searchParams.set('api_key', import.meta.env.VITE_NASA_API_KEY ?? import.meta.env.NASA_API_KEY ?? 'DEMO_KEY');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`NASA API ${res.status}: ${endpoint}`);
  const data = await res.json();

  sessionStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  return data;
}
