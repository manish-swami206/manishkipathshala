import type { Request, Response, NextFunction } from "express";
import { db } from "../../db";
import { questionsTable, examSetsTable, mockTestsTable, dailyQuizzes } from "@workspace/db";
import { eq, ilike, and, sql, desc, inArray } from "drizzle-orm";
import { z } from "zod";
import { cacheDel, cacheFlushPattern } from "../../lib/cache";
import { routeParam } from "../../lib/routeParams";
import { AppError } from "../../middleware/errorHandler";

const questionBodySchema = z.object({
  text: z.string().min(1),
  optionA: z.string().default(""),
  optionB: z.string().default(""),
  optionC: z.string().default(""),
  optionD: z.string().default(""),
  correctIndex: z.coerce.number().int().min(0).max(3).default(0),
  explanation: z.string().nullable().optional(),
  subject: z.string().nullable().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).nullable().optional(),
  negativeMarking: z.coerce.number().optional().default(0),
  classNum: z.coerce.number().nullable().optional(),
  medium: z.string().nullable().optional(),
});

export async function listAllQuestions(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      page = "1",
      limit = "20",
      search,
      subject,
      difficulty,
      type,
    } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    if (search) {
      conditions.push(ilike(questionsTable.text, `%${search}%`));
    }
    if (subject) conditions.push(eq(questionsTable.subject, subject));
    if (difficulty) conditions.push(eq(questionsTable.difficulty, difficulty));

    const where = conditions.length ? and(...conditions) : undefined;

    const [countRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(questionsTable)
      .where(where);
    const questions = await db
      .select()
      .from(questionsTable)
      .where(where)
      .orderBy(desc(questionsTable.id))
      .limit(limitNum)
      .offset(offset);

    res.json({
      data: questions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: Number(countRow.count),
        totalPages: Math.ceil(Number(countRow.count) / limitNum),
      },
    });
  } catch (err) {
    return next(err);
  }
}

export async function getQuestionById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = routeParam(req.params.id);
    const [question] = await db
      .select()
      .from(questionsTable)
      .where(eq(questionsTable.id, id));
    if (!question) {
      return next(new AppError(404, "Question not found"));
    }
    res.json(question);
  } catch (err) {
    return next(err);
  }
}

export async function createQuestion(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = questionBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new AppError(400, `Validation failed: ${parsed.error.issues.map(i => i.message).join("; ")}`));
    }
    const [created] = await db
      .insert(questionsTable)
      .values(parsed.data)
      .returning();
    cacheDel("admin:dashboard:stats");
    cacheDel("admin:analytics:overview");
    cacheFlushPattern("ncert-mcq:");
    res.status(201).json(created);
  } catch (err) {
    return next(err);
  }
}

export async function bulkUploadQuestions(req: Request, res: Response, next: NextFunction) {
  try {
    const { questions } = req.body;
    if (!Array.isArray(questions) || questions.length === 0) {
      return next(new AppError(400, "questions array is required and cannot be empty"));
    }

    const parsedList = [];
    for (const q of questions) {
      const parsed = questionBodySchema.safeParse(q);
      if (parsed.success) {
        parsedList.push(parsed.data);
      }
    }

    if (parsedList.length === 0) {
      return next(new AppError(400, "No valid questions were supplied"));
    }

    const inserted = await db.insert(questionsTable).values(parsedList).returning();
    cacheDel("admin:dashboard:stats");
    cacheDel("admin:analytics:overview");
    cacheFlushPattern("ncert-mcq:");
    return res.status(201).json({ success: true, count: inserted.length });
  } catch (err) {
    return next(err);
  }
}

export async function updateQuestion(req: Request, res: Response, next: NextFunction) {
  try {
    const id = routeParam(req.params.id);
    const parsed = questionBodySchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return next(new AppError(400, `Validation failed: ${parsed.error.issues.map(i => i.message).join("; ")}`));
    }
    const [updated] = await db
      .update(questionsTable)
      .set(parsed.data)
      .where(eq(questionsTable.id, id))
      .returning();
    if (!updated) {
      return next(new AppError(404, "Question not found"));
    }
    cacheFlushPattern("ncert-mcq:");
    res.json(updated);
  } catch (err) {
    return next(err);
  }
}

interface QuestionReferenceCounts {
  examSets: number;
  mockTests: number;
  dailyQuizzes: number;
  total: number;
}

async function getQuestionReferenceCounts(ids: string[]): Promise<QuestionReferenceCounts> {
  const tables: { label: keyof QuestionReferenceCounts; table: any; column: any }[] = [
    { label: "examSets", table: examSetsTable, column: (examSetsTable as any).questionIds },
    { label: "mockTests", table: mockTestsTable, column: (mockTestsTable as any).questionIds },
    { label: "dailyQuizzes", table: dailyQuizzes, column: (dailyQuizzes as any).questionIds },
  ];

  const idArray = sql`ARRAY[${sql.join(ids.map((id) => sql`${id}::uuid`), sql`, `)}]`;

  const results = await Promise.all(
    tables.map(async ({ label, table, column }) => {
      const [row] = await db
        .select({ count: sql<number>`count(*)` })
        .from(table)
        .where(sql`${column} && ${idArray}`);
      return { label, count: Number(row?.count ?? 0) };
    }),
  );

  const counts: Record<string, number> = {};
  let total = 0;
  for (const { label, count } of results) {
    counts[label] = count;
    total += count;
  }

  return {
    examSets: counts.examSets ?? 0,
    mockTests: counts.mockTests ?? 0,
    dailyQuizzes: counts.dailyQuizzes ?? 0,
    total,
  };
}

async function cleanupDeletedQuestionIds(ids: string[]) {
  if (ids.length === 0) return;

  const idExprs = ids.map((id) => sql`${id}::uuid`);
  const idArray = sql`ARRAY[${sql.join(idExprs, sql`, `)}]`;

  const tables = [examSetsTable, mockTestsTable, dailyQuizzes];

  for (const table of tables) {
    await db
      .update(table as any)
      .set({
        questionIds: sql`(
          SELECT COALESCE(array_agg(elem), ARRAY[]::uuid[])
          FROM unnest(${(table as any).questionIds}) AS elem
          WHERE elem != ALL(${idArray})
        )`,
      })
      .where(sql`${(table as any).questionIds} && ${idArray}`);
  }
}

export async function deleteQuestion(req: Request, res: Response, next: NextFunction) {
  try {
    const id = routeParam(req.params.id);

    // Pre-delete check: count references and warn if any exist
    const references = await getQuestionReferenceCounts([id]);
    const confirmed = req.query.confirm === "true" || req.body?.confirm === true;

    if (references.total > 0 && !confirmed) {
      return res.status(409).json({
        warning: true,
        message: `This question is used in ${references.total} set(s). Set ?confirm=true to delete anyway (the question IDs will be removed from those sets).`,
        references,
      });
    }

    await db.delete(questionsTable).where(eq(questionsTable.id, id));
    try { await cleanupDeletedQuestionIds([id]); } catch { /* non-critical cleanup */ }
    cacheDel("admin:dashboard:stats");
    cacheDel("admin:analytics:overview");
    cacheFlushPattern("ncert-mcq:");
    res.json({ success: true });
  } catch (err) {
    return next(err);
  }
}

export async function bulkDeleteQuestions(req: Request, res: Response, next: NextFunction) {
  try {
    const { ids } = req.body as { ids: string[] };
    if (!Array.isArray(ids) || ids.length === 0) {
      return next(new AppError(400, "ids must be a non-empty array"));
    }

    // Pre-delete check: count references and warn if any exist
    const references = await getQuestionReferenceCounts(ids);
    const confirmed = req.query.confirm === "true" || req.body?.confirm === true;

    if (references.total > 0 && !confirmed) {
      return res.status(409).json({
        warning: true,
        message: `${references.total} set(s) contain these questions. Set ?confirm=true to delete anyway (the question IDs will be removed from those sets).`,
        references,
      });
    }

    await db.delete(questionsTable).where(inArray(questionsTable.id, ids));
    try { await cleanupDeletedQuestionIds(ids); } catch { /* non-critical cleanup */ }
    cacheDel("admin:dashboard:stats");
    cacheDel("admin:analytics:overview");
    res.json({ success: true, deletedCount: ids.length });
  } catch (err) {
    return next(err);
  }
}
