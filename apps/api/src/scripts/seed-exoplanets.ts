import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, initializeDatabase, closeDatabase } from '../db/client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contentJsonPath = path.resolve(__dirname, '../../../../packages/content/exoplanets.json');

interface NASAExoplanetRow {
  pl_name: string;
  hostname: string;
  discoverymethod: string;
  disc_year: number | null;
  pl_rade: number | null;
  pl_masse: number | null;
  sy_dist: number | null;
  pl_eqt: number | null;
}

async function runSeed() {
  console.log('[Seeder] Starting exoplanets seeding sequence...');
  
  try {
    // 1. Initialize schemas
    await initializeDatabase();

    // 2. Fetch data from NASA Exoplanet Archive
    const tapUrl = 'https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=select+pl_name,hostname,discoverymethod,disc_year,pl_rade,pl_masse,sy_dist,pl_eqt+from+ps+where+default_flag=1&format=json';
    console.log(`[Seeder] Fetching catalog from NASA Exoplanet Archive TAP API...`);
    
    const res = await fetch(tapUrl);
    if (!res.ok) {
      throw new Error(`TAP HTTP Error: ${res.status}`);
    }
    
    const rawPlanets = (await res.json()) as NASAExoplanetRow[];
    console.log(`[Seeder] Successfully retrieved ${rawPlanets.length} planetary entries.`);

    // 3. Process and map values
    const processedList = [];
    let count = 0;

    for (const p of rawPlanets) {
      if (!p.pl_name) continue;

      // Clean ID format
      const id = p.pl_name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/[\s-]+/g, '_');

      const name = p.pl_name;
      const star = p.hostname || 'Unknown Star';
      const method = p.discoverymethod || 'Transit';
      const discoveryYear = p.disc_year || 2020;
      
      // Conversions
      const distanceLY = p.sy_dist ? Math.round(p.sy_dist * 3.26156 * 10) / 10 : 100.0;
      const radiusEarth = p.pl_rade ? Math.round(p.pl_rade * 100) / 100 : 1.0;
      
      // Fallback mass based on radius if null
      let massEarth = p.pl_masse ? Math.round(p.pl_masse * 100) / 100 : null;
      if (massEarth === null) {
        // M ~ R^3 approximation for terrestrial/rocky, lower for gas
        massEarth = Math.round(Math.pow(radiusEarth, radiusEarth > 3 ? 2.2 : 3.0) * 100) / 100;
      }

      // Temperature conversion
      const tempK = p.pl_eqt;
      let tempC = tempK !== null ? Math.round((tempK - 273.15) * 10) / 10 : null;

      // Classification algorithm
      let category = 'habitable';
      if (tempC !== null) {
        if (tempC > 180) {
          category = 'lava';
        } else if (tempC < -70) {
          category = 'ice';
        } else if (tempC >= -60 && tempC <= 60 && radiusEarth <= 2.0) {
          category = 'habitable';
        } else {
          category = 'ocean';
        }
      } else {
        // Fallback categorization based on radius sizes
        if (radiusEarth > 4.0) {
          category = 'ice';
        } else {
          // Semi-random hash fallback for missing data
          const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const choices = ['habitable', 'ocean', 'ice', 'lava'];
          category = choices[hash % choices.length];
        }
      }

      // Assign fallback temperatures based on categories if null
      if (tempC === null) {
        if (category === 'lava') tempC = 450;
        else if (category === 'ice') tempC = -150;
        else if (category === 'habitable') tempC = 15;
        else tempC = 25;
      }

      // Planet classification type
      let type = 'Terrestrial / Rocky Planet';
      if (radiusEarth < 1.25) {
        type = 'Terrestrial / Rocky Planet';
      } else if (radiusEarth >= 1.25 && radiusEarth < 2.0) {
        type = 'Super-Earth / Terrestrial';
      } else if (radiusEarth >= 2.0 && radiusEarth < 4.0) {
        type = 'Sub-Neptune / Ocean Planet';
      } else if (radiusEarth >= 4.0 && radiusEarth < 8.0) {
        type = 'Neptunian / Gas Giant';
      } else {
        type = 'Jovian / Gas Giant';
      }

      // Habitability Index Score (0 to 100)
      let habitabilityScore = 0;
      if (category === 'habitable') {
        // Best fit is 15C and 1.0 Earth Radius
        const tempFactor = Math.max(0, 1 - Math.abs(tempC - 15) / 75);
        const radFactor = Math.max(0, 1 - Math.abs(radiusEarth - 1.0) / 1.0);
        habitabilityScore = Math.round((70 + 25 * tempFactor * radFactor));
      } else if (category === 'ocean') {
        const tempFactor = Math.max(0, 1 - Math.abs(tempC - 20) / 100);
        habitabilityScore = Math.round((35 + 30 * tempFactor));
      } else if (category === 'ice') {
        habitabilityScore = Math.round(5 + Math.random() * 15);
      } else {
        habitabilityScore = 0;
      }
      habitabilityScore = Math.min(100, Math.max(0, habitabilityScore));

      // Procedural Description
      const description = `${name} is a ${type} located approximately ${distanceLY} light years away, orbiting the host star ${star}. Discovered in ${discoveryYear} via the ${method} method, this world is estimated at ${massEarth} Earth masses and ${radiusEarth} Earth radii. Its equilibrium temperature is logged around ${tempC}°C, categorizing it as an exotic ${category} domain.`;

      const exo = {
        id,
        name,
        category,
        type,
        distance: distanceLY,
        discoveryYear,
        method,
        mass: massEarth,
        radius: radiusEarth,
        habitabilityScore,
        temperature: tempC,
        star,
        description
      };

      processedList.push(exo);

      // Write to SQL
      await query(
        `INSERT INTO exoplanets (id, name, category, type, distance, discovery_year, method, mass, radius, habitability_score, temperature, star, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         ON CONFLICT (id) DO UPDATE SET 
           name = $2, category = $3, type = $4, distance = $5, discovery_year = $6, method = $7, mass = $8, radius = $9, habitability_score = $10, temperature = $11, star = $12, description = $13`,
        [id, name, category, type, distanceLY, discoveryYear, method, massEarth, radiusEarth, habitabilityScore, tempC, star, description]
      );

      count++;
      if (count % 1000 === 0) {
        console.log(`[Seeder] Seeded ${count}/${rawPlanets.length} exoplanets...`);
      }
    }

    // 4. Save JSON backup for mock environment loaders
    console.log(`[Seeder] Writing fallback content file to ${contentJsonPath}...`);
    fs.writeFileSync(contentJsonPath, JSON.stringify(processedList, null, 2), 'utf-8');
    
    console.log(`[Seeder] Seeding sequence successfully completed. Total seeded: ${count} worlds.`);
  } catch (err) {
    console.error('[Seeder] Seeding failed with critical error:', err);
  } finally {
    await closeDatabase();
  }
}

runSeed();
