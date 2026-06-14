import type { Request, Response, NextFunction } from "express";
import { db } from "../../lib/db";
import { examSetsTable, subjects } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";
import { routeParam } from "../../lib/routeParams";
import { AppError } from "../../middleware/errorHandler";

export async function listExamSets(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      page = "1",
      limit = "20",
      type,
      subjectId,
      classNum,
      medium,
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, parseInt(limit, 10));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [eq(examSetsTable.isActive, true)];
    if (type && (type === "pyq" || type === "ncert")) {
      conditions.push(eq(examSetsTable.type, type));
    }
    if (subjectId) {
      // subjectId could be a UUID or a slug — resolve to UUID before filtering
      const subjIdIsUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(subjectId);
      if (subjIdIsUuid) {
        conditions.push(eq(examSetsTable.subjectId, subjectId));
      } else {
        const [subjBySlug] = await db
          .select({ id: subjects.id })
          .from(subjects)
          .where(eq(subjects.slug, subjectId));
        if (subjBySlug) {
          conditions.push(eq(examSetsTable.subjectId, subjBySlug.id));
        }
      }
    }
    if (classNum) {
      conditions.push(eq(examSetsTable.classNum, parseInt(classNum, 10)));
    }
    if (medium) {
      conditions.push(eq(examSetsTable.medium, medium));
    }

    const where = and(...conditions);

    const [countRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(examSetsTable)
      .where(where);

    const data = await db
      .select()
      .from(examSetsTable)
      .where(where)
      .orderBy(desc(examSetsTable.createdAt))
      .limit(limitNum)
      .offset(offset);

    const serialized = data.map((set) => ({
      ...set,
      createdAt: set.createdAt.toISOString(),
      updatedAt: set.updatedAt.toISOString(),
    }));

    res.json({
      data: serialized,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: Number(countRow?.count ?? 0),
        totalPages: Math.ceil(Number(countRow?.count ?? 0) / limitNum),
      },
    });
  } catch (err) {
    return next(err);
  }
}

export async function getExamSetBySlug(req: Request, res: Response, next: NextFunction) {
  try {
    const slug = routeParam(req.params.slug);
    const condition = eq(examSetsTable.slug, slug);

    const [set] = await db
      .select()
      .from(examSetsTable)
      .where(and(condition, eq(examSetsTable.isActive, true)));

    if (!set) {
      return next(new AppError(404, "Exam set not found"));
    }

    res.json({
      ...set,
      createdAt: set.createdAt.toISOString(),
      updatedAt: set.updatedAt.toISOString(),
    });
  } catch (err) {
    return next(err);
  }
}
