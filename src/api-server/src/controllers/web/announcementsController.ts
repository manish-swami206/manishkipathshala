import type { Request, Response, NextFunction } from "express";
import { db } from "../../db";
import { announcementsTable } from "@workspace/db";
import { eq, desc, or, isNull, gt } from "drizzle-orm";
import { cacheGet, cacheSet, cacheDel, CacheTTL } from "../../lib/cache";

export async function listAnnouncements(_req: Request, res: Response, next: NextFunction) {
  const cacheKey = "announcements:active";
  try {
    const cached = await cacheGet<unknown[]>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const now = new Date();
    const announcements = await db
      .select()
      .from(announcementsTable)
      .where(
        eq(announcementsTable.isActive, true) &&
          or(
            isNull(announcementsTable.expiresAt),
            gt(announcementsTable.expiresAt, now)
          )
      )
      .orderBy(desc(announcementsTable.createdAt));

    const serialized = announcements.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
      expiresAt: a.expiresAt?.toISOString() ?? null,
    }));

    await cacheSet(cacheKey, serialized, CacheTTL.SHORT);
    res.json(serialized);
  } catch (err) {
    return next(err);
  }
}

export function clearAnnouncementsCache() {
  cacheDel("announcements:active");
}
