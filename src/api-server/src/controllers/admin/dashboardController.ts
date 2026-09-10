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
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      [questionRow],
      [attemptRow],
      [passedRow],
      [studentsRow],
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(questionsTable),
      db.select({ count: sql<number>`count(*)` }).from(studentAttemptsTable),
      db.select({ count: sql<number>`count(*)` }).from(studentAttemptsTable).where(sql`is_passed = true`),
      db.select({ count: sql<number>`count(*)` }).from(userStreaksTable),
    ]);

    const [
      [newStudentsRow],
      [quizzesRow],
      [mockTestsRow],
      [currentAffairsRow],
      [openTicketsRow],
    ] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(activityLogsTable)
        .where(and(eq(activityLogsTable.action, "user.created"), gte(activityLogsTable.createdAt, weekAgo))),
      db.select({ count: sql<number>`count(*)` }).from(dailyQuizzes),
      db.select({ count: sql<number>`count(*)` }).from(mockTestsTable),
      db.select({ count: sql<number>`count(*)` }).from(currentAffairsTable),
      db.select({ count: sql<number>`count(*)` }).from(supportTicketsTable).where(ne(supportTicketsTable.status, "closed")),
    ]);

    const [
      recentActivity,
      recentStudents,
      activityChartRaw,
    ] = await Promise.all([
      db
        .select()
        .from(activityLogsTable)
        .orderBy(desc(activityLogsTable.createdAt))
        .limit(10),
      db
        .select({
          id: userStreaksTable.userId,
          name: userStreaksTable.displayName,
          email: sql<string>`''` ,
          joinedAt: userStreaksTable.createdAt,
        })
        .from(userStreaksTable)
        .orderBy(desc(userStreaksTable.createdAt))
        .limit(5),
      db
        .select({
          date: sql<string>`to_char(${studentAttemptsTable.createdAt}::timestamp, 'YYYY-MM-DD')`,
          attempts: sql<number>`count(*)`,
        })
        .from(studentAttemptsTable)
        .where(gte(studentAttemptsTable.createdAt, thirtyDaysAgo))
        .groupBy(sql<string>`to_char(${studentAttemptsTable.createdAt}::timestamp, 'YYYY-MM-DD')`)
        .orderBy(sql<string>`to_char(${studentAttemptsTable.createdAt}::timestamp, 'YYYY-MM-DD')`),
    ]);

    const topQuizzesRaw = await db
      .select({
        examId: studentAttemptsTable.examId,
        activityType: studentAttemptsTable.activityType,
        attempts: sql<number>`count(*)`,
      })
      .from(studentAttemptsTable)
      .where(sql`${studentAttemptsTable.examId} IS NOT NULL`)
      .groupBy(studentAttemptsTable.examId, studentAttemptsTable.activityType)
      .orderBy(sql<number>`count(*) desc`)
      .limit(5);

    const newUsersChartRaw = await db
      .select({
        date: sql<string>`to_char(${activityLogsTable.createdAt}::timestamp, 'YYYY-MM-DD')`,
        count: sql<number>`count(*)`,
      })
      .from(activityLogsTable)
      .where(and(eq(activityLogsTable.action, "user.created"), gte(activityLogsTable.createdAt, thirtyDaysAgo)))
      .groupBy(sql<string>`to_char(${activityLogsTable.createdAt}::timestamp, 'YYYY-MM-DD')`)
      .orderBy(sql<string>`to_char(${activityLogsTable.createdAt}::timestamp, 'YYYY-MM-DD')`);

    const newUsersMap = new Map<string, number>();
    for (const row of newUsersChartRaw) {
      newUsersMap.set(row.date, Number(row.count));
    }

    // Merge attempts + new users into a single chart
    const activityChartMap = new Map<string, { date: string; quizAttempts: number; newUsers: number }>();
    for (const row of activityChartRaw) {
      const date = row.date;
      if (!activityChartMap.has(date)) {
        activityChartMap.set(date, { date, quizAttempts: 0, newUsers: 0 });
      }
      activityChartMap.get(date)!.quizAttempts += Number(row.attempts);
    }
    for (const [date, count] of newUsersMap) {
      if (!activityChartMap.has(date)) {
        activityChartMap.set(date, { date, quizAttempts: 0, newUsers: 0 });
      }
      activityChartMap.get(date)!.newUsers = count;
    }
    const activityChart = Array.from(activityChartMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // Resolve quiz names from examId + activityType
    const topQuizzes = await resolveQuizNames(topQuizzesRaw);

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
      activityChart,
      topQuizzes,
      recentStudents: recentStudents.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        joinedAt: s.joinedAt.toISOString(),
      })),
    };

    await cacheSet(cacheKey, data, CacheTTL.DASHBOARD_LONG);
    res.json(data);
  } catch (err) {
    return next(err);
  }
}

/**
 * Resolve quiz/mock/pyq names from raw examId + activityType pairs.
 * Tries daily_quizzes → mock_tests → exam_sets in order.
 */
async function resolveQuizNames(
  raw: { examId: string | null; activityType: string | null; attempts: number }[],
): Promise<{ title: string; attempts: number }[]> {
  if (raw.length === 0) return [];

  const results: { title: string; attempts: number }[] = [];

  for (const row of raw) {
    let title: string | null = null;

    if (row.activityType === "quiz" && row.examId) {
      const [dq] = await db
        .select({ title: dailyQuizzes.title })
        .from(dailyQuizzes)
        .where(eq(dailyQuizzes.id, row.examId))
        .limit(1);
      title = dq?.title ?? null;
    } else if (row.activityType === "mock" && row.examId) {
      const [mt] = await db
        .select({ title: mockTestsTable.title })
        .from(mockTestsTable)
        .where(eq(mockTestsTable.id, row.examId))
        .limit(1);
      title = mt?.title ?? null;
    }

    results.push({
      title: title ?? `Unknown (${row.activityType ?? "unknown"})`,
      attempts: row.attempts,
    });
  }

  return results;
}
