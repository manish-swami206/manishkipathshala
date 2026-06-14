import type { Request, Response, NextFunction } from "express";
import { db } from "../../db";
import { studentAttemptsTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { cacheGet, cacheSet, CacheTTL } from "../../lib/cache";

export async function getAnalytics(_req: Request, res: Response, next: NextFunction) {
  try {
    const cacheKey = "admin:analytics:overview";
    const cached = cacheGet<unknown>(cacheKey);
    if (cached) { res.json(cached); return; }

    const [result] = await db
      .select({
        totalAttempts: sql<number>`count(*)`,
        avgScore: sql<number>`coalesce(avg(score), 0)`,
        avgTimeTaken: sql<number>`coalesce(avg(time_taken_secs), 0)`,
        passCount: sql<number>`coalesce(sum(case when is_passed then 1 else 0 end), 0)`,
        failCount: sql<number>`coalesce(sum(case when is_passed then 0 else 1 end), 0)`,
      })
      .from(studentAttemptsTable);

    cacheSet(cacheKey, result, CacheTTL.ANALYTICS);
    res.json(result);
  } catch (err) {
    return next(err);
  }
}
