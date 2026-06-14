import type { Request, Response, NextFunction } from "express";
import { db } from "../../db";
import { ncertBooksTable, questionsTable, examSetsTable } from "@workspace/db";
import { eq, inArray, and, sql } from "drizzle-orm";
import { cacheGet, cacheSet, CacheTTL } from "../../lib/cache";

function mapQuestion(q: {
  id: string;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctIndex: number;
  explanation: string | null;
}) {
  return {
    id: q.id,
    text: q.text,
    options: [q.optionA, q.optionB, q.optionC, q.optionD],
    correctIndex: q.correctIndex,
    explanation: q.explanation,
  };
}

// GET /ncert-mcq/questions
export async function getNcertMcqQuestions(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      classNum,
      subject,
      medium,
      page: pageStr,
      setId,
    } = req.query as Record<string, string>;
    const page = parseInt(pageStr, 10) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const cacheKey = `ncert-mcq:${classNum || "all"}:${subject || "all"}:${medium || "all"}:${page}`;
    const cached = cacheGet<unknown>(cacheKey);
    if (cached) { res.json(cached); return; }

    const setConditions = [eq(examSetsTable.type, "ncert"), eq(examSetsTable.isActive, true)];
    if (classNum) setConditions.push(eq(examSetsTable.classNum, parseInt(classNum, 10)));
    if (subject) setConditions.push(eq(examSetsTable.title, subject));
    if (medium) setConditions.push(eq(examSetsTable.medium, medium));
    if (setId) {
      setConditions.push(eq(examSetsTable.slug, setId));
    }

    const examSets = await db
      .select()
      .from(examSetsTable)
      .where(and(...setConditions));

    const questionIds = examSets.reduce<string[]>((acc, set) => {
      if (set.questionIds && set.questionIds.length > 0) {
        acc.push(...set.questionIds);
      }
      return acc;
    }, []);

    if (questionIds.length === 0) {
      const result = { data: [], total: 0, page, totalPages: 0 };
      cacheSet(cacheKey, result, CacheTTL.QUESTIONS);
      res.json(result);
      return;
    }

    const uniqueIds = [...new Set(questionIds)];

    let all = await db
      .select()
      .from(questionsTable)
      .where(and(inArray(questionsTable.id, uniqueIds), eq(questionsTable.isActive, true)));

    if (classNum) all = all.filter((q) => q.classNum === parseInt(classNum, 10));
    if (subject) all = all.filter((q) => q.subject?.toLowerCase() === subject.toLowerCase());
    if (medium) all = all.filter((q) => q.medium?.toLowerCase() === medium.toLowerCase());

    const total = all.length;
    const data = all.slice(offset, offset + limit).map(mapQuestion);
    const result = { data, total, page, totalPages: Math.ceil(total / limit) };
    cacheSet(cacheKey, result, CacheTTL.QUESTIONS);
    res.json(result);
  } catch (err) {
    return next(err);
  }
}

// GET /ncert-mcq/sets
export async function getNcertMcqSets(req: Request, res: Response, next: NextFunction) {
  try {
    const { classNum, medium } = req.query as Record<string, string>;
    const conditions = [eq(examSetsTable.type, "ncert"), eq(examSetsTable.isActive, true)];
    if (classNum) conditions.push(eq(examSetsTable.classNum, parseInt(classNum, 10)));
    if (medium) conditions.push(eq(examSetsTable.medium, medium));

    const sets = await db
      .select()
      .from(examSetsTable)
      .where(and(...conditions))
      .orderBy(examSetsTable.createdAt);

    res.json(sets.map((s) => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })));
  } catch (err) {
    return next(err);
  }
}

// GET /ncert-books
export async function getNcertBooks(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      classNum,
      subject,
      medium,
      page: pageStr = "1",
      limit: limitStr = "50",
    } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(pageStr, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limitStr, 10)));
    const offset = (pageNum - 1) * limitNum;

    const cacheKey = `ncert-books:${classNum || "all"}:${subject || "all"}:${medium || "all"}:${pageNum}:${limitNum}`;
    const cached = cacheGet<unknown[]>(cacheKey);
    if (cached) { res.json(cached); return; }

    const conditions = [eq(ncertBooksTable.isActive, true)];
    if (classNum) conditions.push(eq(ncertBooksTable.classNum, parseInt(classNum, 10)));
    if (subject) conditions.push(eq(ncertBooksTable.subject, subject));
    if (medium) conditions.push(eq(ncertBooksTable.medium, medium));
    const where = and(...conditions);

    const [countRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(ncertBooksTable)
      .where(where);

    const data = await db
      .select()
      .from(ncertBooksTable)
      .where(where)
      .orderBy(ncertBooksTable.classNum, ncertBooksTable.subject)
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
