import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

export const CacheTTL = {
  DASHBOARD: 300,
  QUESTIONS: 600,
  ANALYTICS: 900,
  LEADERBOARD: 300,
  SHORT: 60,
};

export function cacheGet<T>(key: string): T | undefined {
  return cache.get<T>(key);
}

export function cacheSet<T>(key: string, value: T, ttl?: number): boolean {
  return cache.set(key, value, ttl ?? CacheTTL.DASHBOARD);
}

export function cacheDel(key: string | string[]): void {
  cache.del(key);
}

export function cacheFlushPattern(pattern: string): void {
  const keys = cache.keys().filter((k) => k.startsWith(pattern));
  if (keys.length) cache.del(keys);
}

export function cacheMiddleware(key: string, ttl: number) {
  return (_req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => {
    const cached = cache.get(key);
    if (cached !== undefined) {
      res.setHeader("X-Cache", "HIT");
      res.json(cached);
      return;
    }
    res.setHeader("X-Cache", "MISS");
    const originalJson = res.json.bind(res);
    res.json = (data: unknown) => {
      if (res.statusCode === 200) cache.set(key, data, ttl);
      return originalJson(data);
    };
    next();
  };
}

export default cache;
