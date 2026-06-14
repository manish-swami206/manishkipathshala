import type { Request, Response, NextFunction } from "express";
import { db } from "../../lib/db";
import { examSetsTable } from "@workspace/db";
import { eq, desc, ilike, and, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { routeParam } from "../../lib/routeParams";
import { AppError } from "../../middleware/errorHandler";
import { slugify } from "../../utils/slugify";

function formatZodIssues(issues: z.ZodIssue[]): string {
  return issues
    .map((i) => `${i.path.join(".")} — ${i.message}`)
    .join("; ");
}

const examSetSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  type: z.enum(["pyq", "ncert"]).default("pyq"),
  subjectId: z.string().optional().nullable(),
  classNum: z.coerce.number().optional().nullable(),
  medium: z.string().optional().nullable(),
  questionIds: z.array(z.string()).default([]).transform((ids) => ids.filter((id): id is string => id !== null && id !== undefined && id !== "")),
});

export async function listAllExamSets(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      page = "1",
      limit = "20",
      type,
      search,
    } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, parseInt(limit, 10));
    const offset = (pageNum - 1) * limitNum;

    const conditions: SQL[] = [];
    if (type && (type === "pyq" || type === "ncert")) conditions.push(eq(examSetsTable.type, type));
    if (search) conditions.push(ilike(examSetsTable.title, `%${search}%`));

    const where = conditions.length ? and(...conditions) : undefined;

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

    res.json({
      data,
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

export async function getExamSetById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = routeParam(req.params.id);
    const [set] = await db
      .select()
      .from(examSetsTable)
      .where(eq(examSetsTable.id, id));
    if (!set) {
      return next(new AppError(404, "Exam set not found"));
    }
    res.json(set);
  } catch (err) {
    return next(err);
  }
}

export async function createExamSet(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = examSetSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new AppError(400, `Validation failed — ${formatZodIssues(parsed.error.issues)}`));
    }

    const { questionIds, ...rest } = parsed.data;
    const slug = slugify(parsed.data.title, "set");

    const [set] = await db
      .insert(examSetsTable)
      .values({
        ...rest,
        slug,
        questionIds,
        totalQuestions: questionIds.length,
      })
      .returning();

    res.status(201).json(set);
  } catch (err) {
    return next(err);
  }
}

export async function updateExamSet(req: Request, res: Response, next: NextFunction) {
  try {
    const id = routeParam(req.params.id);
    const parsed = examSetSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return next(new AppError(400, `Validation failed — ${formatZodIssues(parsed.error.issues)}`));
    }

    const { questionIds, ...rest } = parsed.data;
    const updateData: Record<string, unknown> = {
      ...rest,
      ...(rest.title ? { slug: slugify(rest.title, "set") } : {}),
      ...(questionIds !== undefined ? { questionIds, totalQuestions: questionIds.length } : {}),
    };

    const [updated] = await db
      .update(examSetsTable)
      .set(updateData)
      .where(eq(examSetsTable.id, id))
      .returning();

    if (!updated) {
      return next(new AppError(404, "Exam set not found"));
    }
    res.json(updated);
  } catch (err) {
    return next(err);
  }
}

export async function deleteExamSet(req: Request, res: Response, next: NextFunction) {
  try {
    const id = routeParam(req.params.id);
    const [existing] = await db
      .select({ id: examSetsTable.id })
      .from(examSetsTable)
      .where(eq(examSetsTable.id, id));
    if (!existing) {
      return next(new AppError(404, "Exam set not found"));
    }
    await db.delete(examSetsTable).where(eq(examSetsTable.id, id));
    res.json({ success: true });
  } catch (err) {
    return next(err);
  }
}
