import type { Request, Response, NextFunction } from "express";
import { db } from "../../db";
import {
  questionsTable,
  studentAttemptsTable,
  activityLogsTable,
  userStreaksTable,
  dailyQuizzes,
  mockTestsTable,
  currentAffairsTable,
  supportTicketsTable,
} from "@workspace/db";
import { sql, desc, and, eq, gte, ne } from "drizzle-orm";
import { cacheGet, cacheSet, CacheTTL } from "../../lib/cache";

export async function getDashboardStats(_req: Request, res: Response, next: NextFunction) {
  const cacheKey = "admin:dashboard:stats";
  const cached = await cacheGet<unknown>(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      [questionRow],
      [attemptRow],
      [passedRow],
      [studentsRow],
      [newStudentsRow],
      [quizzesRow],
      [mockTestsRow],
      [currentAffairsRow],
      [openTicketsRow],
      recentActivity,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(questionsTable),
      db.select({ count: sql<number>`count(*)` }).from(studentAttemptsTable),
      db.select({ count: sql<number>`count(*)` }).from(studentAttemptsTable).where(sql`is_passed = true`),
      db.select({ count: sql<number>`count(*)` }).from(userStreaksTable),
      db
        .select({ count: sql<number>`count(*)` })
        .from(activityLogsTable)
        .where(and(eq(activityLogsTable.action, "user.created"), gte(activityLogsTable.createdAt, weekAgo))),
      db.select({ count: sql<number>`count(*)` }).from(dailyQuizzes),
      db.select({ count: sql<number>`count(*)` }).from(mockTestsTable),
      db.select({ count: sql<number>`count(*)` }).from(currentAffairsTable),
      db.select({ count: sql<number>`count(*)` }).from(supportTicketsTable).where(ne(supportTicketsTable.status, "closed")),
      db
        .select()
        .from(activityLogsTable)
        .orderBy(desc(activityLogsTable.createdAt))
        .limit(10),
    ]);

    const data = {
      totalQuestions: Number(questionRow.count),
      totalAttempts: Number(attemptRow.count),
      passedAttempts: Number(passedRow.count),
      passPercentage:
        Number(attemptRow.count) > 0
          ? Math.round(
              (Number(passedRow.count) / Number(attemptRow.count)) * 100,
            )
          : 0,
      recentActivity: recentActivity.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
      })),
      stats: {
        totalStudents: Number(studentsRow.count),
        newStudentsThisWeek: Number(newStudentsRow.count),
        totalQuestions: Number(questionRow.count),
        totalQuizzes: Number(quizzesRow.count),
        totalMockTests: Number(mockTestsRow.count),
        totalCurrentAffairs: Number(currentAffairsRow.count),
        openSupportTickets: Number(openTicketsRow.count),
        storageUsedMb: 0,
      },
    };

    await cacheSet(cacheKey, data, CacheTTL.ANALYTICS);
    res.json(data);
  } catch (err) {
    return next(err);
  }
}
