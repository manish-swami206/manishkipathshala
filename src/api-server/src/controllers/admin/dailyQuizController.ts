import type { Request, Response, NextFunction } from "express";
import { Router } from "express";
import { db } from "../../lib/db";
import { dailyQuizzes } from "@workspace/db";
import { routeParam } from "../../lib/routeParams";
import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { AppError } from "../../middleware/errorHandler";

const dailyQuizPayloadSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  scheduledDate: z.string().min(1),
  scheduledTime: z.string().min(1),
  durationMinutes: z.coerce.number().int().min(1).default(30),
  totalQuestions: z.coerce.number().int().min(0).default(0),
  questionIds: z.array(z.string()).default([]),
  isPublished: z.boolean().default(false),
});

export async function listAllDailyQuizzes(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const offset = (page - 1) * limit;

    const [countRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(dailyQuizzes);
    const total = Number(countRow?.count ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const quizzes = await db
      .select()
      .from(dailyQuizzes)
      .orderBy(desc(dailyQuizzes.scheduledDate))
      .limit(limit)
      .offset(offset);

    return res.json({
      quizzes,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (err) {
    return next(err);
  }
}

export async function getDailyQuizById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = routeParam(req.params.id);
    if (!id) return next(new AppError(400, "Invalid ID"));

    const [quiz] = await db
      .select()
      .from(dailyQuizzes)
      .where(eq(dailyQuizzes.id, id));

    if (!quiz) {
      return next(new AppError(404, "Quiz not found"));
    }

    return res.json(quiz);
  } catch (err) {
    return next(err);
  }
}

export async function createDailyQuiz(req: Request, res: Response, next: NextFunction) {
  try {
    const parseResult = dailyQuizPayloadSchema.safeParse(req.body);
    if (!parseResult.success) {
      return next(new AppError(400, `Invalid payload: ${parseResult.error.issues.map(i => i.message).join("; ")}`));
    }

    const data = parseResult.data;
    const [result] = await db
      .insert(dailyQuizzes)
      .values({
        title: data.title,
        description: data.description || null,
        scheduledDate: data.scheduledDate,
        scheduledTime: data.scheduledTime,
        durationMinutes: data.durationMinutes,
        totalQuestions: data.totalQuestions,
        questionIds: data.questionIds,
        isPublished: data.isPublished,
      })
      .returning();

    return res.status(201).json(result);
  } catch (err) {
    return next(err);
  }
}

export async function updateDailyQuiz(req: Request, res: Response, next: NextFunction) {
  try {
    const id = routeParam(req.params.id);
    if (!id) return next(new AppError(400, "Invalid ID"));

    const parseResult = dailyQuizPayloadSchema.partial().safeParse(req.body);
    if (!parseResult.success) {
      return next(new AppError(400, `Invalid payload: ${parseResult.error.issues.map(i => i.message).join("; ")}`));
    }

    const data = parseResult.data;
    const [result] = await db
      .update(dailyQuizzes)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(dailyQuizzes.id, id))
      .returning();

    if (!result) {
      return next(new AppError(404, "Quiz not found"));
    }

    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

export async function deleteDailyQuiz(req: Request, res: Response, next: NextFunction) {
  try {
    const id = routeParam(req.params.id);
    if (!id) return next(new AppError(400, "Invalid ID"));

    await db.delete(dailyQuizzes).where(eq(dailyQuizzes.id, id));

    return res.json({ message: "Quiz deleted successfully" });
  } catch (err) {
    return next(err);
  }
}
