import { createClient } from 'redis';
import { getEnv } from '../config/env.js';

interface CacheEntry {
  value: string;
  expiresAt: number | null;
}

// In-Memory Cache Fallback implementation
class MemoryCache {
  private store = new Map<string, CacheEntry>();

  public get(key: string): string | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  public set(key: string, value: string, ttlSeconds?: number): void {
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.store.set(key, { value, expiresAt });
  }

  public del(key: string): void {
    this.store.delete(key);
  }
}

const memoryCache = new MemoryCache();
let redisClient: any = null;
let isMock = true;

const env = getEnv();

if (env.REDIS_URL) {
  try {
    redisClient = createClient({ url: env.REDIS_URL });
    
    redisClient.on('error', (err: any) => {
      console.error('[Redis] Client Connection Error:', err);
    });

    await redisClient.connect();
    isMock = false;
    console.log('[Redis] Connected successfully.');
  } catch (err) {
    console.error('[Redis] Failed to connect, falling back to local memory cache:', err);
    redisClient = null;
    isMock = true;
  }
} else {
  console.log('[Redis] REDIS_URL not configured. Running in Developer Mock Cache Mode (In-Memory).');
}

/**
 * Gets a value from Redis or local memory cache.
 */
export async function getCache(key: string): Promise<string | null> {
  if (isMock || !redisClient) {
    return memoryCache.get(key);
  }
  try {
    return await redisClient.get(key);
  } catch (err) {
    console.error(`[Redis] getCache failed for ${key}, checking fallback:`, err);
    return memoryCache.get(key);
  }
}

/**
 * Sets a value in Redis or local memory cache with an optional TTL in seconds.
 */
export async function setCache(key: string, value: string, ttlSeconds?: number): Promise<void> {
  if (isMock || !redisClient) {
    memoryCache.set(key, value, ttlSeconds);
    return;
  }
  try {
    if (ttlSeconds) {
      await redisClient.set(key, value, { EX: ttlSeconds });
    } else {
      await redisClient.set(key, value);
    }
  } catch (err) {
    console.error(`[Redis] setCache failed for ${key}, writing to fallback:`, err);
    memoryCache.set(key, value, ttlSeconds);
  }
}

/**
 * Deletes a key from Redis or local memory cache.
 */
export async function delCache(key: string): Promise<void> {
  if (isMock || !redisClient) {
    memoryCache.del(key);
    return;
  }
  try {
    await redisClient.del(key);
  } catch (err) {
    console.error(`[Redis] delCache failed for ${key}, deleting from fallback:`, err);
    memoryCache.del(key);
  }
}

/**
 * Closes the Redis connection safely if initialized.
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.disconnect();
    console.log('[Redis] Disconnected successfully.');
  }
}
