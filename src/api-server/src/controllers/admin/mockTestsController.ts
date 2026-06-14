import type { Request, Response, NextFunction } from "express";
import { db } from "../../lib/db";
import { mockTestsTable } from "@workspace/db";
import { eq, desc, ilike, and, sql, type SQL } from "drizzle-orm";
import { z } from "zod";
import { routeParam } from "../../lib/routeParams";
import { formatZodIssues } from "../../utils/validation";
import { cacheFlushPattern } from "../../lib/cache";
import { AppError } from "../../middleware/errorHandler";

const mockTestSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  durationMins: z.coerce.number().int().min(1).default(60),
  questionCount: z.coerce.number().int().min(0).default(100),
  maxMarks: z.coerce.number().int().min(1).default(100),
  negativeMarking: z.coerce.number().min(0).default(0.25),
  questionIds: z.array(z.string()).optional(),
  subjectId: z.string().optional().nullable(),
  difficulty: z.string().optional().nullable(),
  class: z.coerce.number().optional().nullable(),
  medium: z.string().optional().nullable(),
  isFeatured: z.coerce.boolean().default(false),
});

export async function listAllMockTests(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = "1", limit = "20", search, difficulty, subjectId } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, parseInt(limit, 10));
    const offset = (pageNum - 1) * limitNum;

    const conditions: SQL[] = [];
    if (search) conditions.push(ilike(mockTestsTable.title, `%${search}%`));
    if (difficulty) conditions.push(eq(mockTestsTable.difficulty, difficulty));
    if (subjectId) conditions.push(eq(mockTestsTable.subjectId, subjectId));

    const where = conditions.length ? and(...conditions) : undefined;

    const [countRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(mockTestsTable)
      .where(where);

    const mockTests = await db
      .select()
      .from(mockTestsTable)
      .where(where)
      .orderBy(desc(mockTestsTable.createdAt))
      .limit(limitNum)
      .offset(offset);

    return res.json({
      data: mockTests,
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

export async function getMockTestById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = routeParam(req.params.id);
    const [test] = await db
      .select()
      .from(mockTestsTable)
      .where(eq(mockTestsTable.id, id));
    if (!test) return next(new AppError(404, "Mock test not found"));
    return res.json(test);
  } catch (err) {
    return next(err);
  }
}

export async function createMockTest(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = mockTestSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new AppError(400, `Validation failed — ${formatZodIssues(parsed.error.issues)}`));
    }

    const [test] = await db
      .insert(mockTestsTable)
      .values(parsed.data)
      .returning();

    cacheFlushPattern("mock-tests:");
    return res.status(201).json(test);
  } catch (err) {
    return next(err);
  }
}

export async function updateMockTest(req: Request, res: Response, next: NextFunction) {
  try {
    const id = routeParam(req.params.id);
    const parsed = mockTestSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return next(new AppError(400, `Validation failed — ${formatZodIssues(parsed.error.issues)}`));
    }
    const [updated] = await db
      .update(mockTestsTable)
      .set(parsed.data)
      .where(eq(mockTestsTable.id, id))
      .returning();

    if (!updated)
      return next(new AppError(404, "Mock test not found"));

    cacheFlushPattern("mock-tests:");
    return res.json(updated);
  } catch (err) {
    return next(err);
  }
}

export async function deleteMockTest(req: Request, res: Response, next: NextFunction) {
  try {
    const id = routeParam(req.params.id);
    await db.delete(mockTestsTable).where(eq(mockTestsTable.id, id));
    cacheFlushPattern("mock-tests:");
    return res.json({ success: true });
  } catch (err) {
    return next(err);
  }
}
