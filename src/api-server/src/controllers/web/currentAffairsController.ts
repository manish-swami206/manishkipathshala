import type { Request, Response, NextFunction } from "express";
import { db } from "../../lib/db";
import { currentAffairsTable } from "@workspace/db";
import { desc, sql } from "drizzle-orm";
import {
  getCurrentAffairById,
} from "../../services/currentAffairsService";
import { cacheGet, cacheSet, CacheTTL } from "../../lib/cache";
import { AppError } from "../../middleware/errorHandler";

// GET all current affairs with DB-level pagination
export async function listCurrentAffairs(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 12;
    const offset = (page - 1) * limit;

    const cacheKey = `current-affairs:list:${page}:${limit}`;
    const cached = cacheGet<unknown>(cacheKey);
    if (cached) { res.json(cached); return; }

    const [items, countRows] = await Promise.all([
      db
        .select()
        .from(currentAffairsTable)
        .orderBy(desc(currentAffairsTable.publishedAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)` })
        .from(currentAffairsTable),
    ]);

    const total = Number(countRows?.[0]?.count ?? 0);
    const totalPages = Math.ceil(total / limit);

    const result = {
      data: items.map((a) => ({
        ...a,
        publishedAt: a.publishedAt ? a.publishedAt.toISOString() : null,
        prevId: null,
        nextId: null,
      })),
      total,
      page,
      totalPages,
    };
    cacheSet(cacheKey, result, CacheTTL.QUESTIONS);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

// GET single current affair by ID
export async function getCurrentAffair(req: Request, res: Response, next: NextFunction) {
  try {
    const idRaw = req.params.id;
    const id = Array.isArray(idRaw) ? idRaw[0] : idRaw;

    const currentAffair = await getCurrentAffairById(id);
    if (!currentAffair) {
      return next(new AppError(404, "Current affair not found"));
    }

    const result = {
      ...currentAffair,
      publishedAt: currentAffair.publishedAt.toISOString(),
      prevId: null,
      nextId: null,
    };
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}


