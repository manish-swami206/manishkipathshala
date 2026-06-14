import type { Request, Response, NextFunction } from "express";
import { db } from "../../db";
import {
  previousYearPapersTable,
  syllabusTable,
  mockTestsTable,
} from "@workspace/db";
import { eq, ilike, and, desc, sql } from "drizzle-orm";
import { cacheGet, cacheSet, CacheTTL } from "../../lib/cache";

export async function listPyp(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      examName,
      year: yearStr,
      subject,
      page: pageStr,
      limit: limitStr,
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(pageStr, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limitStr, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [eq(previousYearPapersTable.isActive, true)];
    if (examName) conditions.push(ilike(previousYearPapersTable.examName, `%${examName}%`));
    if (yearStr) conditions.push(eq(previousYearPapersTable.year, parseInt(yearStr, 10)));
    if (subject) conditions.push(eq(previousYearPapersTable.subject, subject));

    const where = and(...conditions);

    const [countRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(previousYearPapersTable)
      .where(where);

    const data = await db
      .select()
      .from(previousYearPapersTable)
      .where(where)
      .orderBy(desc(previousYearPapersTable.year))
      .limit(limitNum)
      .offset(offset);

    return res.json({
      data,
      total: Number(countRow?.count ?? 0),
      page: pageNum,
      totalPages: Math.ceil(Number(countRow?.count ?? 0) / limitNum),
    });
  } catch (err) {
    return next(err);
  }
}

export async function listSyllabus(req: Request, res: Response, next: NextFunction) {
  try {
    const cacheKey = "syllabus:list";
    const cached = cacheGet<unknown[]>(cacheKey);
    if (cached) { res.json(cached); return; }

    const all = await db
      .select()
      .from(syllabusTable)
      .where(eq(syllabusTable.isActive, true));
    cacheSet(cacheKey, all, CacheTTL.QUESTIONS);
    return res.json(all);
  } catch (err) {
    return next(err);
  }
}
