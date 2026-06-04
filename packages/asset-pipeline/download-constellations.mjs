// packages/asset-pipeline/download-constellations.mjs
// Downloads constellation data from d3-celestial (BSD license)
// Source: https://github.com/ofrohn/d3-celestial

import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, '../../apps/web/public/constellations');

const FILES = [
  {
    name: 'lines.json',
    url: 'https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/constellations.lines.json',
    desc: 'Constellation stick figure lines',
  },
  {
    name: 'bounds.json',
    url: 'https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/constellations.bounds.json',
    desc: 'IAU constellation boundaries',
  },
  {
    name: 'metadata.json',
    url: 'https://raw.githubusercontent.com/ofrohn/d3-celestial/master/data/constellations.json',
    desc: 'Constellation names and centroids',
  },
];

console.log('\n⭐ Orbital Insight — Constellation Data Download');
console.log(`   Output: ${OUTPUT_DIR}\n`);

await mkdir(OUTPUT_DIR, { recursive: true });

for (const file of FILES) {
  try {
    const res = await fetch(file.url, {
      headers: { 'User-Agent': 'orbital-insight-asset-pipeline/1.0' },
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const data = await res.text();
    const dest = path.join(OUTPUT_DIR, file.name);
    await writeFile(dest, data, 'utf-8');

    console.log(`✓ ${file.name} — ${file.desc} (${(data.length / 1024).toFixed(1)} KB)`);
  } catch (err) {
    console.error(`✗ ${file.name}: ${err.message}`);
  }
}

console.log('\n✅ Constellation data download complete\n');
