import type { Request, Response, NextFunction } from "express";
import { studyNotesTable } from "@workspace/db";
import { db } from "../../db";
import { ilike, and, eq, sql } from "drizzle-orm";
import { cacheGet, cacheSet, CacheTTL } from "../../lib/cache";

export async function listStudyNotes(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      subject,
      medium,
      search,
      page: pageStr,
    } = req.query as Record<string, string>;
    const page = parseInt(pageStr, 10) || 1;
    const limit = 12;
    const offset = (page - 1) * limit;

    const cacheKey = `study-notes:${page}:${subject || "all"}:${medium || "all"}:${search || ""}`;
    const cached = cacheGet<unknown>(cacheKey);
    if (cached) { res.json(cached); return; }

    const conditions = [eq(studyNotesTable.isActive, true)];
    if (subject) conditions.push(eq(studyNotesTable.subject, subject));
    if (medium) conditions.push(eq(studyNotesTable.medium, medium));
    if (search) conditions.push(ilike(studyNotesTable.title, `%${search}%`));
    const where = conditions.length ? and(...conditions) : undefined;

    const [countRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(studyNotesTable)
      .where(where);

    const data = await db
      .select()
      .from(studyNotesTable)
      .where(where)
      .limit(limit)
      .offset(offset);

    const total = Number(countRow?.count ?? 0);
    const result = { data, total, page, totalPages: Math.ceil(total / limit) };

    cacheSet(cacheKey, result, CacheTTL.QUESTIONS);
    res.json(result);
  } catch (err) {
    return next(err);
  }
}
