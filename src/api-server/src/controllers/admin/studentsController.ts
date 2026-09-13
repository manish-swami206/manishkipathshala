import type { Request, Response, NextFunction } from "express";
import { db } from "../../db";
import { studentAttemptsTable, userStreaksTable, activityLogsTable, supportTicketsTable } from "@workspace/db";
import { eq, desc, sql, and, inArray } from "drizzle-orm";
import { routeParam } from "../../lib/routeParams";
import { batchGetClerkUsers } from "../../lib/clerkBatch";
import { clerkClient } from "@clerk/express";

export async function listAllStudents(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = "1", limit = "20", search = "" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, parseInt(limit, 10));
    const offset = (pageNum - 1) * limitNum;

    // Search by displayName in DB
    const nameCondition = search
      ? sql`lower(${userStreaksTable.displayName}) like ${`%${search.toLowerCase()}%`}`
      : undefined;

    // Also search by email via Clerk — get matching user IDs
    let emailMatchedIds: string[] = [];
    if (search) {
      try {
        const clerkResult = await clerkClient.users.getUserList({
          emailAddress: [search],
        });
        emailMatchedIds = clerkResult.data.map((u) => u.id);
      } catch {
        // Ignore Clerk search errors — fall back to name-only search
      }
    }

    // Combine name search with email search (OR)
    const whereClause = nameCondition
      ? emailMatchedIds.length > 0
        ? sql`lower(${userStreaksTable.displayName}) like ${`%${search.toLowerCase()}%`} OR ${userStreaksTable.userId} IN ${emailMatchedIds}`
        : and(nameCondition)
      : emailMatchedIds.length > 0
        ? sql`${userStreaksTable.userId} IN ${emailMatchedIds}`
        : undefined;

    const [countRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(userStreaksTable)
      .where(whereClause);

    // When searching by email, also include any Clerk-matched IDs not in userStreaks
    // (edge case: user exists in Clerk but webhook hasn't created streaks row yet)

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

/**
 * DELETE /admin/students/:userId
 * Removes a user from both Clerk and all related database tables.
 * Order: DB first ( FK constraints ), then Clerk last.
 */
export async function deleteStudent(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = routeParam(req.params.userId);

    if (!userId) {
      return res.status(400).json({ error: "Missing userId parameter" });
    }

    // 1. Delete from all user-related DB tables
    //    Order matters: supportTickets cascade deletes messages, so delete tickets first
    await db.delete(supportTicketsTable).where(eq(supportTicketsTable.userId, userId));
    await db.delete(activityLogsTable).where(eq(activityLogsTable.userId, userId));
    await db.delete(studentAttemptsTable).where(eq(studentAttemptsTable.userId, userId));
    await db.delete(userStreaksTable).where(eq(userStreaksTable.userId, userId));

    // 2. Delete from Clerk
    try {
      await clerkClient.users.deleteUser(userId);
    } catch (clerkErr: any) {
      // If user doesn't exist in Clerk (already deleted), continue
      if (clerkErr?.status === 404) {
        console.warn(`User ${userId} not found in Clerk — may have been deleted already`);
      } else {
        throw clerkErr;
      }
    }

    console.log(`Admin: Deleted user ${userId} from DB and Clerk`);

    res.json({ success: true, message: `User ${userId} deleted successfully` });
  } catch (err) {
    return next(err);
  }
}
