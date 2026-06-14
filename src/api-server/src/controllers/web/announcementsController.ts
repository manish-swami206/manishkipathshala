import type { Request, Response, NextFunction } from "express";
import { db } from "../../db";
import { announcementsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { cacheGet, cacheSet, cacheDel, CacheTTL } from "../../lib/cache";

export async function listAnnouncements(_req: Request, res: Response, next: NextFunction) {
  const cacheKey = "announcements:active";
  const cached = cacheGet<unknown[]>(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  try {
    const announcements = await db
      .select()
      .from(announcementsTable)
      .where(eq(announcementsTable.isActive, true))
      .orderBy(announcementsTable.createdAt);

    const serialized = announcements.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
    }));

    cacheSet(cacheKey, serialized, CacheTTL.SHORT);
    res.json(serialized);
  } catch (err) {
    return next(err);
  }
}

export function clearAnnouncementsCache() {
  cacheDel("announcements:active");
}
