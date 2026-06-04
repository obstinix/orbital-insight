// packages/asset-pipeline/process-stars.mjs
// Downloads HYG Database v41 (CC BY-SA 2.5) and processes into compact binary
// Source: https://github.com/astronexus/HYG-Database
//
// Output format: Float32Array with 7 floats per star:
// [ra_rad, dec_rad, magnitude, r, g, b, hipparcos_id]
//
// Stars filtered to magnitude < 8.0 (~31K stars)
// This keeps the dataset manageable while covering all naked-eye + binocular stars

import { writeFile, readFile, mkdir, stat } from 'fs/promises';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.resolve(__dirname, 'hygdata_v41.csv');
const OUTPUT_DIR = path.resolve(__dirname, '../../apps/web/public/stars');
const OUTPUT_PATH = path.resolve(OUTPUT_DIR, 'hyg_stars.bin');
const HYG_URL = 'https://raw.githubusercontent.com/astronexus/HYG-Database/master/hyg/v41/hygdata_v41.csv';

const MAG_LIMIT = 8.0; // Include all stars visible with binoculars
const FLOATS_PER_STAR = 7;

// B-V color index → approximate RGB for stellar rendering
function bvToRGB(bv) {
  // Clamp to valid range
  const t = Math.max(-0.4, Math.min(2.0, isNaN(bv) ? 0.65 : bv));
  let r, g, b;

  if (t < 0.0) {
    // Hot blue-white stars (O/B type)
    r = 0.61 + 0.11 * t + 0.1 * t * t;
    g = 0.70 + 0.07 * t + 0.1 * t * t;
    b = 1.0;
  } else if (t < 0.4) {
    // White/blue-white stars (A/F type)
    r = 0.83 + 0.17 * (t / 0.4);
    g = 0.87 + 0.13 * (t / 0.4);
    b = 1.0 - 1.5 * t;
  } else if (t < 1.0) {
    // Yellow/white stars (G type - like our Sun)
    r = 1.0;
    g = 1.0 - 0.4 * ((t - 0.4) / 0.6);
    b = 0.4 - 0.4 * ((t - 0.4) / 0.6);
  } else if (t < 1.6) {
    // Orange stars (K type)
    r = 1.0;
    g = 0.6 - 0.3 * ((t - 1.0) / 0.6);
    b = 0.0;
  } else {
    // Red stars (M type)
    r = 1.0 - 0.4 * ((t - 1.6) / 0.4);
    g = 0.3 - 0.2 * ((t - 1.6) / 0.4);
    b = 0.0;
  }

  return [
    Math.max(0, Math.min(1, r)),
    Math.max(0, Math.min(1, g)),
    Math.max(0, Math.min(1, b)),
  ];
}

async function downloadCSV() {
  try {
    await stat(CSV_PATH);
    console.log('⏭  HYG CSV already downloaded, using cached copy');
    return;
  } catch { /* not found, download */ }

  console.log('⬇  Downloading HYG Database v41...');
  const res = await fetch(HYG_URL, {
    headers: { 'User-Agent': 'orbital-insight-asset-pipeline/1.0' },
    signal: AbortSignal.timeout(120_000),
  });

  if (!res.ok) throw new Error(`Failed to download HYG: HTTP ${res.status}`);

  await pipeline(
    Readable.fromWeb(res.body),
    createWriteStream(CSV_PATH)
  );

  const stats = await stat(CSV_PATH);
  console.log(`✓ Downloaded HYG CSV (${(stats.size / 1024 / 1024).toFixed(1)} MB)`);
}

async function processCSV() {
  console.log('\n🔄 Processing star catalog...');

  const csvText = await readFile(CSV_PATH, 'utf-8');
  const lines = csvText.split('\n');
  const headers = lines[0].split(',');

  // Find column indices
  const colIdx = {};
  ['ra', 'dec', 'mag', 'ci', 'hip', 'dist'].forEach(col => {
    colIdx[col] = headers.indexOf(col);
  });

  // Verify all columns found
  for (const [col, idx] of Object.entries(colIdx)) {
    if (idx === -1) {
      console.error(`✗ Column '${col}' not found in CSV headers`);
      console.log('  Available columns:', headers.join(', '));
      process.exit(1);
    }
  }

  // Parse and filter stars
  const stars = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(',');
    const ra = parseFloat(cols[colIdx.ra]);     // hours (0-24)
    const dec = parseFloat(cols[colIdx.dec]);    // degrees (-90 to 90)
    const mag = parseFloat(cols[colIdx.mag]);    // apparent magnitude
    const ci = parseFloat(cols[colIdx.ci]);      // B-V color index
    const hip = parseInt(cols[colIdx.hip]) || 0; // Hipparcos ID
    const dist = parseFloat(cols[colIdx.dist]);  // distance in parsecs

    if (isNaN(ra) || isNaN(dec) || isNaN(mag)) continue;
    if (mag > MAG_LIMIT) continue;

    // Convert RA from hours to radians (0-24h → 0-2π)
    const raRad = (ra / 24.0) * Math.PI * 2.0;
    // Convert Dec from degrees to radians
    const decRad = (dec / 180.0) * Math.PI;

    const [r, g, b] = bvToRGB(ci);

    stars.push([raRad, decRad, mag, r, g, b, hip]);
  }

  console.log(`   Parsed ${lines.length - 1} rows, kept ${stars.length} stars (mag < ${MAG_LIMIT})`);

  // Sort by magnitude (brightest first) for draw-order optimization
  stars.sort((a, b) => a[2] - b[2]);

  // Write binary
  await mkdir(OUTPUT_DIR, { recursive: true });

  const buffer = new Float32Array(stars.length * FLOATS_PER_STAR);
  for (let i = 0; i < stars.length; i++) {
    const offset = i * FLOATS_PER_STAR;
    buffer[offset + 0] = stars[i][0]; // ra_rad
    buffer[offset + 1] = stars[i][1]; // dec_rad
    buffer[offset + 2] = stars[i][2]; // magnitude
    buffer[offset + 3] = stars[i][3]; // r
    buffer[offset + 4] = stars[i][4]; // g
    buffer[offset + 5] = stars[i][5]; // b
    buffer[offset + 6] = stars[i][6]; // hipparcos_id
  }

  await writeFile(OUTPUT_PATH, Buffer.from(buffer.buffer));

  const fileSizeMB = (buffer.byteLength / 1024 / 1024).toFixed(2);
  console.log(`\n✅ Wrote ${stars.length} stars to ${OUTPUT_PATH}`);
  console.log(`   Binary size: ${fileSizeMB} MB (${FLOATS_PER_STAR} × float32 per star)`);
  console.log(`   Brightest: mag ${stars[0][2].toFixed(2)}`);
  console.log(`   Faintest:  mag ${stars[stars.length - 1][2].toFixed(2)}`);

  // Also write a named stars index for click interaction
  await writeNamedStarsIndex(csvText, headers, colIdx);
}

async function writeNamedStarsIndex(csvText, headers, colIdx) {
  const properIdx = headers.indexOf('proper');
  const bayerIdx = headers.indexOf('bayer');
  const conIdx = headers.indexOf('con');
  const spIdx = headers.indexOf('spect');

  if (properIdx === -1) {
    console.warn('⚠  No "proper" column found — skipping named stars index');
    return;
  }

  const lines = csvText.split('\n');
  const namedStars = {};

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(',');
    const proper = cols[properIdx]?.trim();
    if (!proper) continue;

    const hip = parseInt(cols[colIdx.hip]) || 0;
    const mag = parseFloat(cols[colIdx.mag]);
    const ra = parseFloat(cols[colIdx.ra]);
    const dec = parseFloat(cols[colIdx.dec]);
    const bayer = cols[bayerIdx]?.trim() || null;
    const constellation = cols[conIdx]?.trim() || null;
    const spectralType = cols[spIdx]?.trim() || null;
    const dist = parseFloat(cols[colIdx.dist]);

    if (isNaN(mag) || isNaN(ra) || isNaN(dec)) continue;

    namedStars[hip] = {
      name: proper,
      hip,
      bayer,
      constellation,
      spectralType,
      magnitude: mag,
      ra,
      dec,
      distanceLy: isNaN(dist) ? null : +(dist * 3.26156).toFixed(1),
    };
  }

  const namedPath = path.resolve(OUTPUT_DIR, 'named_stars.json');
  await writeFile(namedPath, JSON.stringify(namedStars, null, 2), 'utf-8');
  console.log(`   Named stars index: ${Object.keys(namedStars).length} stars → ${namedPath}`);
}

console.log('\n⭐ Orbital Insight — HYG Star Catalog Processor');
console.log(`   Source: HYG Database v41 (CC BY-SA 2.5)`);
console.log(`   Output: ${OUTPUT_PATH}\n`);

await downloadCSV();
await processCSV();
