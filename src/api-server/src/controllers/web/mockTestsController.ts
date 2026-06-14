import type { Request, Response, NextFunction } from "express";
import { mockTestsTable } from "@workspace/db";
import { db } from "../../db";
import { eq, and, sql } from "drizzle-orm";
import { cacheGet, cacheSet, CacheTTL } from "../../lib/cache";
import { routeParam } from "../../lib/routeParams";
import { AppError } from "../../middleware/errorHandler";

export async function listMockTests(req: Request, res: Response, next: NextFunction) {
  try {
    const { page: pageStr = "1", limit: limitStr = "20" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(pageStr, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limitStr, 10)));
    const offset = (pageNum - 1) * limitNum;

    const cacheKey = `mock-tests:list:${pageNum}:${limitNum}`;
    const cached = cacheGet<unknown>(cacheKey);
    if (cached) { res.json(cached); return; }

    const where = eq(mockTestsTable.isActive, true);

    const [countRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(mockTestsTable)
      .where(where);

    const data = await db
      .select()
      .from(mockTestsTable)
      .where(where)
      .orderBy(mockTestsTable.createdAt)
      .limit(limitNum)
      .offset(offset);

    const total = Number(countRow?.count ?? 0);
    const result = {
      data,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
    };

    cacheSet(cacheKey, result, CacheTTL.QUESTIONS);
    res.json(result);
  } catch (err) {
    return next(err);
  }
}

export async function getMockTestDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const id = routeParam(req.params.id);

    const [test] = await db
      .select()
      .from(mockTestsTable)
      .where(and(eq(mockTestsTable.id, id), eq(mockTestsTable.isActive, true)));

    if (!test) {
      return next(new AppError(404, "Mock test not found"));
    }

    res.json(test);
  } catch (err) {
    return next(err);
  }
}
