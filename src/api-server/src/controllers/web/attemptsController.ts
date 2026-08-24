import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { db } from "../../db";
import { studentAttemptsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { AppError } from "../../middleware/errorHandler";
import { z } from "zod";
import {
  POINTS,
  applyUserActivity,
  attemptRewardRef,
  classifyAttemptActivity,
  hasPriorRewardForRef,
} from "../../services/streakService";

const saveAttemptSchema = z.object({
  examId: z.string().optional(),
  quizId: z.string().optional(),
  // Hint from the player wrapper; rewards are still derived server-side.
  activityType: z.enum(["quiz", "mock", "pyq"]).optional(),
  score: z.number(),
  totalMarks: z.number(),
  correctCount: z.number(),
  wrongCount: z.number(),
  skippedCount: z.number(),
  timeTakenSecs: z.number(),
  isPassed: z.boolean(),
});

export async function saveAttempt(req: Request, res: Response, next: NextFunction) {
  const { userId } = getAuth(req);
  if (!userId) {
    return next(new AppError(401, "Unauthorized"));
  }

  try {
    const parsed = saveAttemptSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new AppError(400, "Invalid attempt data"));
    }
    const data = parsed.data;

    const { attempt, pointsEarned } = await db.transaction(async (tx) => {
      const activityType = classifyAttemptActivity(data, data.activityType);

      // Dedupe check MUST run before the insert below — otherwise the row we
      // are about to write matches its own "prior attempt" query and every
      // play would read as a retake (0 points forever).
      const ref = activityType ? attemptRewardRef(activityType, data) : null;
      const alreadyRewarded =
        ref === null ? false : await hasPriorRewardForRef(tx, userId, ref);

      const [attempt] = await tx
        .insert(studentAttemptsTable)
        .values({
          userId,
          examId: data.examId || null,
          quizId: data.quizId || null,
          activityType: activityType ?? null,
          score: data.score,
          totalMarks: data.totalMarks,
          correctCount: data.correctCount,
          wrongCount: data.wrongCount,
          skippedCount: data.skippedCount,
          timeTakenSecs: data.timeTakenSecs,
          isPassed: data.isPassed,
        })
        .returning();

      let pointsEarned = 0;

      if (activityType) {
        // First completion of a content item earns its points; retakes keep
        // streak/count credit but earn nothing — no repeat-play farming.
        const activityResult = await applyUserActivity(tx, {
          userId,
          activityType,
          points: alreadyRewarded ? 0 : POINTS[activityType],
        });
        pointsEarned = activityResult.pointsEarned;
      }

      return { attempt, pointsEarned };
    });

    return res.status(201).json({
      ...attempt,
      attemptedAt: attempt.attemptedAt.toISOString(),
      createdAt: attempt.createdAt.toISOString(),
      updatedAt: attempt.updatedAt.toISOString(),
      pointsEarned,
    });
  } catch (err) {
    return next(err);
  }
}

export async function getMyAttempts(req: Request, res: Response, next: NextFunction) {
  const { userId } = getAuth(req);
  if (!userId) {
    return next(new AppError(401, "Unauthorized"));
  }

  try {
    const attempts = await db
      .select()
      .from(studentAttemptsTable)
      .where(eq(studentAttemptsTable.userId, userId))
      .orderBy(desc(studentAttemptsTable.attemptedAt))
      .limit(50);

    return res.json(
      attempts.map((a) => ({
        ...a,
        attemptedAt: a.attemptedAt.toISOString(),
      }))
    );
  } catch (err) {
    return next(err);
  }
}
