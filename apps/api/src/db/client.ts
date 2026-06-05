import pg from 'pg';
import { getEnv } from '../config/env.js';
import exoplanetsData from '../../../../packages/content/exoplanets.json' with { type: 'json' };

const { Pool } = pg;

// Local In-Memory Mock Database Fallback structures
interface MockUser {
  id: string;
  username: string;
  avatar: string;
  xp: number;
  level: number;
  rank: string;
  created_at: Date;
}

interface MockAchievement {
  user_id: string;
  achievement_id: string;
  unlocked_at: Date;
}

interface MockExoplanet {
  id: string;
  name: string;
  category: string;
  type?: string;
  distance?: number;
  discovery_year?: number;
  method?: string;
  mass?: number;
  radius?: number;
  habitability_score?: number;
  temperature?: number;
  star?: string;
  description?: string;
}

const mockUsers = new Map<string, MockUser>();
const mockAchievements: MockAchievement[] = [];
const mockExoplanets: MockExoplanet[] = (exoplanetsData as unknown as Array<{
  id: string;
  name: string;
  category: string;
  type?: string;
  distance?: number;
  discoveryYear?: number;
  method?: string;
  mass?: number;
  radius?: number;
  habitabilityScore?: number;
  temperature?: number;
  star?: string;
  description?: string;
}>).map((p) => ({
  id: p.id,
  name: p.name,
  category: p.category,
  type: p.type,
  distance: p.distance,
  discovery_year: p.discoveryYear,
  method: p.method,
  mass: p.mass,
  radius: p.radius,
  habitability_score: p.habitabilityScore,
  temperature: p.temperature,
  star: p.star,
  description: p.description
}));

// Seed an initial mock user for testing/demo
mockUsers.set('dev-token-user123', {
  id: 'dev-token-user123',
  username: 'Explorer One',
  avatar: '🚀',
  xp: 150,
  level: 2,
  rank: 'Mission Specialist',
  created_at: new Date(),
});
mockAchievements.push({
  user_id: 'dev-token-user123',
  achievement_id: 'journey_start',
  unlocked_at: new Date(),
});

let pool: pg.Pool | null = null;
let isMock = true;

const env = getEnv();

if (env.DATABASE_URL && env.DATABASE_URL !== 'stub') {
  try {
    pool = new Pool({
      connectionString: env.DATABASE_URL,
      ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
    });
    isMock = false;
    console.log('[Database] PostgreSQL connection pool initialized.');
  } catch (err) {
    console.error('[Database] Failed to initialize PostgreSQL pool, falling back to Mock DB:', err);
    pool = null;
    isMock = true;
  }
} else {
  console.log('[Database] DATABASE_URL not configured. Running in Developer Mock Database Mode.');
}

/**
 * Initializes database tables if using real PostgreSQL.
 */
export async function initializeDatabase(): Promise<void> {
  if (isMock || !pool) {
    console.log('[Database] Running in in-memory Mock mode. No tables to initialize.');
    return;
  }

  const client = await pool.connect();
  try {
    console.log('[Database] Initializing PostgreSQL schemas...');
    
    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        avatar VARCHAR(50),
        xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        rank VARCHAR(255) DEFAULT 'Flight Cadet',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create achievements table
    await client.query(`
      CREATE TABLE IF NOT EXISTS achievements (
        user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
        achievement_id VARCHAR(255) NOT NULL,
        unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, achievement_id)
      );
    `);

    // Create exoplanets table
    await client.query(`
      CREATE TABLE IF NOT EXISTS exoplanets (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(50) NOT NULL,
        type VARCHAR(255),
        distance FLOAT,
        discovery_year INTEGER,
        method VARCHAR(100),
        mass FLOAT,
        radius FLOAT,
        habitability_score INTEGER,
        temperature FLOAT,
        star VARCHAR(255),
        description TEXT
      );
    `);

    console.log('[Database] PostgreSQL tables checked/created successfully.');
  } catch (err) {
    console.error('[Database] Schema initialization error:', err);
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Executes a query against PostgreSQL or emulates it in the mock database.
 */
export async function query(text: string, params: unknown[] = []): Promise<pg.QueryResult> {
  if (!isMock && pool) {
    return pool.query(text, params);
  }

  // Emulate SQL behaviors for simple queries
  const sql = text.trim().replace(/\s+/g, ' ').toLowerCase();

  // 1. Get user profile: select * from users where id = $1
  if (sql.includes('select * from users where id =')) {
    const userId = params[0] as string;
    const user = mockUsers.get(userId);
    return {
      rows: user ? [user] : [],
      rowCount: user ? 1 : 0,
    } as unknown as pg.QueryResult;
  }

  // 2. Select achievements: select * from achievements where user_id = $1
  if (sql.includes('select * from achievements where user_id =')) {
    const userId = params[0] as string;
    const list = mockAchievements.filter((a) => a.user_id === userId);
    return {
      rows: list,
      rowCount: list.length,
    } as unknown as pg.QueryResult;
  }

  // 3. Upsert user: insert into users (id, username, avatar, xp, level, rank) values ...
  if (sql.includes('insert into users')) {
    // Expected params: [id, username, avatar, xp, level, rank]
    const [id, username, avatar, xp, level, rank] = params as [string, string, string, number, number, string];
    const existing = mockUsers.get(id);
    const updatedUser: MockUser = {
      id,
      username,
      avatar,
      xp,
      level,
      rank,
      created_at: existing ? existing.created_at : new Date(),
    };
    mockUsers.set(id, updatedUser);
    return {
      rows: [updatedUser],
      rowCount: 1,
    } as unknown as pg.QueryResult;
  }

  // 4. Insert achievement: insert into achievements (user_id, achievement_id) ...
  if (sql.includes('insert into achievements')) {
    const [userId, achievementId] = params as [string, string];
    const exists = mockAchievements.some(
      (a) => a.user_id === userId && a.achievement_id === achievementId
    );
    if (!exists) {
      const ach = {
        user_id: userId,
        achievement_id: achievementId,
        unlocked_at: new Date(),
      };
      mockAchievements.push(ach);
    }
    return {
      rows: [],
      rowCount: exists ? 0 : 1,
    } as unknown as pg.QueryResult;
  }

  // 5. Get exoplanets count: select count(*) from exoplanets ...
  if (sql.includes('select count(*) from exoplanets')) {
    const search = String(params[0] || '').toLowerCase().replace(/%/g, '');
    const category = String(params[1] || 'ALL');

    let list = mockExoplanets;
    if (search) {
      list = list.filter(p => 
        p.name.toLowerCase().includes(search) || 
        (p.star && p.star.toLowerCase().includes(search))
      );
    }
    if (category && category !== 'ALL') {
      list = list.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }

    return {
      rows: [{ count: String(list.length) }],
      rowCount: 1,
    } as unknown as pg.QueryResult;
  }

  // 6. Get exoplanets by ID: select * from exoplanets where id = $1
  if (sql.includes('select * from exoplanets where id =')) {
    const id = params[0] as string;
    const exo = mockExoplanets.find(p => p.id === id);
    return {
      rows: exo ? [exo] : [],
      rowCount: exo ? 1 : 0,
    } as unknown as pg.QueryResult;
  }

  // 7. Get exoplanets paginated: select * from exoplanets ...
  if (sql.includes('select * from exoplanets')) {
    const search = String(params[0] || '').toLowerCase().replace(/%/g, '');
    const category = String(params[1] || 'ALL');
    const limit = typeof params[2] === 'number' ? params[2] : 50;
    const offset = typeof params[3] === 'number' ? params[3] : 0;

    let list = [...mockExoplanets];
    if (search) {
      list = list.filter(p => 
        p.name.toLowerCase().includes(search) || 
        (p.star && p.star.toLowerCase().includes(search))
      );
    }
    if (category && category !== 'ALL') {
      list = list.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }

    // Sort alphabetically by name
    list.sort((a, b) => a.name.localeCompare(b.name));

    const paginated = list.slice(offset, offset + limit);

    return {
      rows: paginated.map(p => ({
        id: p.id,
        name: p.name,
        category: p.category,
        type: p.type,
        distance: p.distance,
        discovery_year: p.discovery_year,
        method: p.method,
        mass: p.mass,
        radius: p.radius,
        habitability_score: p.habitability_score,
        temperature: p.temperature,
        star: p.star,
        description: p.description
      })),
      rowCount: paginated.length,
    } as unknown as pg.QueryResult;
  }

  // 8. Insert exoplanets upsert
  if (sql.includes('insert into exoplanets')) {
    const [
      id, name, category, type, distance, discovery_year, method, mass, radius, habitability_score, temperature, star, description
    ] = params as [string, string, string, string, number, number, string, number, number, number, number, string, string];

    const existingIndex = mockExoplanets.findIndex(p => p.id === id);
    const updatedExo: MockExoplanet = {
      id,
      name,
      category,
      type,
      distance,
      discovery_year,
      method,
      mass,
      radius,
      habitability_score,
      temperature,
      star,
      description
    };

    if (existingIndex !== -1) {
      mockExoplanets[existingIndex] = updatedExo;
    } else {
      mockExoplanets.push(updatedExo);
    }

    return {
      rows: [updatedExo],
      rowCount: 1,
    } as unknown as pg.QueryResult;
  }

  throw new Error(`Unsupported Mock SQL Query: ${text}`);
}

/**
 * Safely closes the database connection pool.
 */
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    console.log('[Database] PostgreSQL connection pool closed.');
  }
}
