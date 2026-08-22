import type { Request, Response, NextFunction } from "express";
import { db } from "../../db";
import { studentAttemptsTable, userStreaksTable } from "@workspace/db";
import { eq, desc, sql, and, inArray } from "drizzle-orm";
import { routeParam } from "../../lib/routeParams";
import { batchGetClerkUsers } from "../../lib/clerkBatch";

export async function listAllStudents(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = "1", limit = "20", search = "" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, parseInt(limit, 10));
    const offset = (pageNum - 1) * limitNum;

    const searchCondition = search
      ? sql`lower(${userStreaksTable.displayName}) like ${`%${search.toLowerCase()}%`}`
      : undefined;

    const whereClause = searchCondition ? and(searchCondition) : undefined;

    const [countRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(userStreaksTable)
      .where(whereClause);

    // Step 1: Fetch paginated users from userStreaksTable (simple query — no join issues)
    const users = await db
      .select({
        userId: userStreaksTable.userId,
        displayName: userStreaksTable.displayName,
        createdAt: userStreaksTable.createdAt,
      })
      .from(userStreaksTable)
      .where(whereClause)
      .orderBy(desc(userStreaksTable.createdAt))
      .limit(limitNum)
      .offset(offset);

    // Step 2: Fetch aggregate stats for JUST these userIds (simple GROUP BY — no join/correlation)
    const userIds = users.map(u => u.userId);
    const stats = userIds.length > 0
      ? await db
          .select({
            userId: studentAttemptsTable.userId,
            totalAttempts: sql<number>`count(*)::int`,
            avgScore: sql<number>`coalesce(avg(${studentAttemptsTable.score}), 0)`,
            totalScore: sql<number>`coalesce(sum(${studentAttemptsTable.score}), 0)`,
            passedCount: sql<number>`coalesce(sum(case when ${studentAttemptsTable.isPassed} then 1 else 0 end), 0)`,
            lastAttemptAt: sql<string | null>`max(${studentAttemptsTable.attemptedAt})`,
          })
          .from(studentAttemptsTable)
          .where(inArray(studentAttemptsTable.userId, userIds))
          .groupBy(studentAttemptsTable.userId)
      : [];

    // Step 3: Merge stats into a Map for O(1) lookup
    const statsMap = new Map(stats.map(s => [s.userId, s]));

    // Batch-fetch all Clerk users in one API call (up to 100 per chunk)
    const clerkUsers = await batchGetClerkUsers(userIds);

    const enriched = users.map((u) => {
      const s = statsMap.get(u.userId);
      const clerk = clerkUsers.get(u.userId);
      const name =
        clerk
          ? `${clerk.firstName} ${clerk.lastName}`.trim() || u.displayName || "Learner"
          : u.displayName || "Learner";
      const email = clerk?.email ?? "";
      return {
        userId: u.userId,
        displayName: name,
        email,
        totalAttempts: s ? Number(s.totalAttempts) : 0,
        avgScore: s ? Math.round(Number(s.avgScore) * 100) / 100 : 0,
        totalScore: s ? Number(s.totalScore) : 0,
        passedCount: s ? Number(s.passedCount) : 0,
        lastAttemptAt: s?.lastAttemptAt ?? null,
        joinedAt: u.createdAt.toISOString(),
      };
    });

    res.json({
      data: enriched,
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

export async function getStudentAttempts(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = routeParam(req.params.userId);
    const attempts = await db
      .select()
      .from(studentAttemptsTable)
      .where(eq(studentAttemptsTable.userId, userId))
      .orderBy(desc(studentAttemptsTable.attemptedAt))
      .limit(50);
    res.json(
      attempts.map((a) => ({ ...a, attemptedAt: a.attemptedAt.toISOString() })),
    );
  } catch (err) {
    return next(err);
  }
}
