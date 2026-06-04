// packages/asset-pipeline/download-textures.mjs
// Downloads PBR planet textures from Solar System Scope (CC BY 4.0)
// and NASA Visible Earth (public domain)
//
// Attribution required: "Textures from Solar System Scope (CC BY 4.0) www.solarsystemscope.com"
// NASA Visible Earth images are public domain.

import { createWriteStream } from 'fs';
import { mkdir, stat } from 'fs/promises';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(__dirname, '../../apps/web/public/textures');

const TEXTURES = [
  // SUN
  { name: 'sun/sun_8k.jpg', url: 'https://www.solarsystemscope.com/textures/download/8k_sun.jpg' },

  // MERCURY
  { name: 'mercury/mercury_8k.jpg', url: 'https://www.solarsystemscope.com/textures/download/8k_mercury.jpg' },

  // VENUS
  { name: 'venus/venus_atmo_4k.jpg', url: 'https://www.solarsystemscope.com/textures/download/4k_venus_atmosphere.jpg' },
  { name: 'venus/venus_surface_2k.jpg', url: 'https://www.solarsystemscope.com/textures/download/2k_venus_surface.jpg' },

  // EARTH — NASA Visible Earth (public domain) for maximum realism
  { name: 'earth/earth_day_8k.jpg', url: 'https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73909/world.topo.bathy.200412.3x5400x2700.jpg' },
  { name: 'earth/earth_night_8k.jpg', url: 'https://eoimages.gsfc.nasa.gov/images/imagerecords/79000/79765/dnb_land_ocean_ice.2012.3600x1800.jpg' },
  { name: 'earth/earth_clouds_2k.jpg', url: 'https://www.solarsystemscope.com/textures/download/2k_earth_clouds.jpg' },
  { name: 'earth/earth_normal_2k.jpg', url: 'https://www.solarsystemscope.com/textures/download/2k_earth_normal_map.tif' },
  { name: 'earth/earth_specular_2k.jpg', url: 'https://www.solarsystemscope.com/textures/download/2k_earth_specular_map.tif' },

  // MOON
  { name: 'moon/moon_8k.jpg', url: 'https://www.solarsystemscope.com/textures/download/8k_moon.jpg' },

  // MARS
  { name: 'mars/mars_8k.jpg', url: 'https://www.solarsystemscope.com/textures/download/8k_mars.jpg' },

  // JUPITER
  { name: 'jupiter/jupiter_8k.jpg', url: 'https://www.solarsystemscope.com/textures/download/8k_jupiter.jpg' },

  // SATURN + RINGS
  { name: 'saturn/saturn_8k.jpg', url: 'https://www.solarsystemscope.com/textures/download/8k_saturn.jpg' },
  { name: 'saturn/saturn_ring_alpha.png', url: 'https://www.solarsystemscope.com/textures/download/8k_saturn_ring_alpha.png' },

  // URANUS
  { name: 'uranus/uranus_2k.jpg', url: 'https://www.solarsystemscope.com/textures/download/2k_uranus.jpg' },

  // NEPTUNE
  { name: 'neptune/neptune_2k.jpg', url: 'https://www.solarsystemscope.com/textures/download/2k_neptune.jpg' },

  // MILKY WAY background
  { name: 'skybox/milkyway_8k.jpg', url: 'https://www.solarsystemscope.com/textures/download/8k_stars_milky_way.jpg' },
];

async function fileExists(filepath) {
  try {
    await stat(filepath);
    return true;
  } catch {
    return false;
  }
}

async function download(item, retries = 3) {
  const dest = path.join(OUTPUT_DIR, item.name);
  
  if (await fileExists(dest)) {
    console.log(`⏭  ${item.name} (already exists, skipping)`);
    return;
  }

  await mkdir(path.dirname(dest), { recursive: true });

  const isTif = item.url.endsWith('.tif');
  const tempDest = isTif ? `${dest}.tif` : dest;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(item.url, {
        headers: { 'User-Agent': 'orbital-insight-asset-pipeline/1.0' },
        signal: AbortSignal.timeout(120_000),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }

      const contentLength = res.headers.get('content-length');
      const sizeMB = contentLength ? `${(parseInt(contentLength) / 1024 / 1024).toFixed(1)} MB` : 'unknown size';

      await pipeline(
        Readable.fromWeb(res.body),
        createWriteStream(tempDest)
      );

      if (isTif) {
        const { execSync } = await import('child_process');
        const { unlink } = await import('fs/promises');
        execSync(`sips -s format jpeg "${tempDest}" --out "${dest}"`, { stdio: 'ignore' });
        await unlink(tempDest);
      }

      console.log(`✓ ${item.name} (${sizeMB})`);
      return;
    } catch (err) {
      if (attempt === retries) {
        console.error(`✗ ${item.name}: ${err.message} (failed after ${retries} attempts)`);
      } else {
        console.warn(`⟳ ${item.name}: retry ${attempt}/${retries} — ${err.message}`);
        await new Promise(r => setTimeout(r, 2000 * attempt));
      }
    }
  }
}

console.log('\n🪐 Orbital Insight — Texture Download Pipeline');
console.log(`   Output: ${OUTPUT_DIR}`);
console.log(`   Textures: ${TEXTURES.length} files\n`);

const start = Date.now();

// Download sequentially to avoid overwhelming servers
for (const item of TEXTURES) {
  await download(item);
}

const elapsed = ((Date.now() - start) / 1000).toFixed(1);
console.log(`\n✅ Texture download complete in ${elapsed}s\n`);
