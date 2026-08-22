import { Redis } from "@upstash/redis";
import NodeCache from "node-cache";

/**
 * Two-tier cache: Upstash Redis (shared across replicas) with an in-process
 * node-cache fallback for local dev / when Redis is not configured.
 *
 * Configure via env:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 */

const KEY_PREFIX = "exam-platform:";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

export const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;
const memory = new NodeCache({ stdTTL: 300, checkperiod: 120 });

export const CacheTTL = {
  DASHBOARD: 300,
  QUESTIONS: 600,
  ANALYTICS: 900,
  LEADERBOARD: 300,
  SHORT: 60,
};

export async function cacheGet<T>(key: string): Promise<T | undefined> {
  if (redis) {
    try {
      const value = await redis.get<T>(KEY_PREFIX + key);
      if (value !== null && value !== undefined) return value;
    } catch (err) {
      console.warn(`[cache] redis get failed for "${key}":`, err instanceof Error ? err.message : err);
    }
  }
  return memory.get<T>(key);
}

export async function cacheSet<T>(key: string, value: T, ttl?: number): Promise<void> {
  memory.set(key, value, ttl ?? CacheTTL.DASHBOARD);
  if (redis) {
    try {
      await redis.set(KEY_PREFIX + key, value, { ex: ttl ?? CacheTTL.DASHBOARD });
    } catch (err) {
      console.warn(`[cache] redis set failed for "${key}":`, err instanceof Error ? err.message : err);
    }
  }
}

/** Fire-and-forget deletion — safe to call without awaiting. */
export function cacheDel(key: string | string[]): void {
  const keys = Array.isArray(key) ? key : [key];
  for (const k of keys) memory.del(k);
  if (redis) {
    const prefixed = keys.map((k) => KEY_PREFIX + k);
    redis.del(...prefixed).catch((err: unknown) => {
      console.warn("[cache] redis del failed:", err instanceof Error ? err.message : err);
    });
  }
}

/** Fire-and-forget prefix flush — safe to call without awaiting. */
export function cacheFlushPattern(pattern: string): void {
  const keys = memory.keys().filter((k) => k.startsWith(pattern));
  if (keys.length) memory.del(keys);

  if (redis) {
    void (async () => {
      try {
        const matched = await redis.keys(KEY_PREFIX + pattern + "*");
        if (matched.length) await redis.del(...matched);
      } catch (err) {
        console.warn(`[cache] redis flush failed for "${pattern}":`, err instanceof Error ? err.message : err);
      }
    })();
  }
}

export default redis;
