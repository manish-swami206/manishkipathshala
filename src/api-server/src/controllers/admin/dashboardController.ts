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
      [newStudentsRow],
      [quizzesRow],
      [mockTestsRow],
      [currentAffairsRow],
      [openTicketsRow],
      recentActivity,
      recentStudents,
      activityChartRaw,
      topQuizzes,
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
      // Recent registered students
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
      // Daily activity for engagement chart (last 30 days)
      db
        .select({
          date: sql<string>`to_char(${activityLogsTable.createdAt}::timestamp, 'YYYY-MM-DD')`,
          action: activityLogsTable.action,
        })
        .from(activityLogsTable)
        .where(gte(activityLogsTable.createdAt, thirtyDaysAgo))
        .orderBy(desc(activityLogsTable.createdAt)),
      // Top quizzes by attempt count
      db
        .select({
          title: sql<string>`coalesce(${studentAttemptsTable.examId}::text, 'Unknown')`,
          attempts: sql<number>`count(*)`,
        })
        .from(studentAttemptsTable)
        .where(sql`${studentAttemptsTable.examId} IS NOT NULL`)
        .groupBy(studentAttemptsTable.examId)
        .orderBy(sql<number>`count(*) desc`)
        .limit(5),
    ]);

    // Transform raw activity logs into daily aggregates for the chart
    const activityChartMap = new Map<string, { date: string; quizAttempts: number; newUsers: number }>();
    for (const row of activityChartRaw) {
      const date = row.date;
      if (!activityChartMap.has(date)) {
        activityChartMap.set(date, { date, quizAttempts: 0, newUsers: 0 });
      }
      const entry = activityChartMap.get(date)!;
      if (row.action.startsWith("quiz") || row.action.startsWith("mock") || row.action.startsWith("pyq")) {
        entry.quizAttempts++;
      }
      if (row.action === "user.created") {
        entry.newUsers++;
      }
    }
    const activityChart = Array.from(activityChartMap.values()).reverse();

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

    await cacheSet(cacheKey, data, CacheTTL.ANALYTICS);
    res.json(data);
  } catch (err) {
    return next(err);
  }
}
