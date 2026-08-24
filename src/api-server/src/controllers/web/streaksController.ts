import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { userStreaksTable, studentAttemptsTable } from "@workspace/db";
import { db } from "../../db";
import { eq, desc, gte, and, asc, sql } from "drizzle-orm";
import { AppError } from "../../middleware/errorHandler";
import {
  applyUserActivity,
  attemptPointsSql,
  effectiveCurrentStreak,
  monthStartUtcStr,
  sanitizeLimit,
  todayStr,
  weekStartUtcStr,
  yesterdayStr,
} from "../../services/streakService";

// GET /streaks/me — requires auth
export async function getMyStreak(req: Request, res: Response, next: NextFunction) {
  const { userId } = getAuth(req);
  if (!userId) {
    return next(new AppError(401, "Unauthorized"));
  }

  try {
    const [row] = await db
      .select()
      .from(userStreaksTable)
      .where(eq(userStreaksTable.userId, userId));

    if (!row) {
      return res.json({
        currentStreak: 0,
        longestStreak: 0,
        totalPoints: 0,
        quizCount: 0,
        mockCount: 0,
        pyqCount: 0,
        lastActivityDate: null,
      });
    }

    // Stale streaks read as broken: only today/yesterday activity keeps one alive.
    return res.json({
      currentStreak: effectiveCurrentStreak(
        row.currentStreak,
        row.lastActivityDate,
        todayStr(),
        yesterdayStr(),
      ),
      longestStreak: row.longestStreak,
      totalPoints: row.totalPoints,
      quizCount: row.quizCount,
      mockCount: row.mockCount,
      pyqCount: row.pyqCount,
      lastActivityDate: row.lastActivityDate ?? null,
    });
  } catch (err) {
    return next(err);
  }
}

// POST /streaks/activity — requires auth
// Login-only by design: quiz/mock/pyq rewards flow exclusively through verified
// attempt saves (POST /attempts), so this endpoint cannot farm points.
export async function recordActivity(req: Request, res: Response, next: NextFunction) {
  const { userId } = getAuth(req);
  if (!userId) {
    return next(new AppError(401, "Unauthorized"));
  }

  const { activityType, displayName } = req.body as {
    activityType?: string;
    displayName?: string;
  };

  if (activityType !== "login") {
    return next(new AppError(400, "activityType must be login; quiz/mock/pyq rewards are recorded server-side on attempt save"));
  }

  try {
    const result = await db.transaction(async (tx) =>
      applyUserActivity(tx, {
        userId,
        activityType: "login",
        // Sanitized inside applyUserActivity before storage.
        displayName,
      }),
    );

    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

// GET /leaderboard — public
export async function getLeaderboard(req: Request, res: Response, next: NextFunction) {
  const limit = sanitizeLimit(req.query.limit);
  const period = req.query.period;

  let periodFilter: "weekly" | "monthly" | null = null;
  if (period === "weekly") periodFilter = "weekly";
  else if (period === "monthly") periodFilter = "monthly";
  else if (period !== undefined && period !== "" && period !== "allTime") {
    return next(new AppError(400, "period must be allTime | weekly | monthly"));
  }

  try {
    if (periodFilter) {
      const startDate =
        periodFilter === "weekly" ? weekStartUtcStr() : monthStartUtcStr();
      const startTs = new Date(`${startDate}T00:00:00.000Z`);

      // Period boards rank by points actually earned in the period, computed
      // from verified attempts (legacy rows classified by their id columns).
      const periodExpr = attemptPointsSql();
      const rows = await db
        .select({
          userId: studentAttemptsTable.userId,
          periodPoints: periodExpr,
          displayName: sql<string>`coalesce(max(${userStreaksTable.displayName}), 'Learner')`,
          currentStreak: sql<number>`coalesce(max(${userStreaksTable.currentStreak}), 0)`,
          lastActivityDate: sql<string | null>`max(${userStreaksTable.lastActivityDate})`,
          longestStreak: sql<number>`coalesce(max(${userStreaksTable.longestStreak}), 0)`,
          quizCount: sql<number>`coalesce(max(${userStreaksTable.quizCount}), 0)`,
          mockCount: sql<number>`coalesce(max(${userStreaksTable.mockCount}), 0)`,
          pyqCount: sql<number>`coalesce(max(${userStreaksTable.pyqCount}), 0)`,
        })
        .from(studentAttemptsTable)
        .leftJoin(
          userStreaksTable,
          eq(userStreaksTable.userId, studentAttemptsTable.userId),
        )
        .where(gte(studentAttemptsTable.attemptedAt, startTs))
        .groupBy(studentAttemptsTable.userId)
        .orderBy(
          desc(periodExpr),
          desc(sql`coalesce(max(${userStreaksTable.currentStreak}), 0)`),
          desc(sql`coalesce(max(${userStreaksTable.longestStreak}), 0)`),
          asc(sql`coalesce(max(${userStreaksTable.createdAt}), min(${studentAttemptsTable.attemptedAt}))`),
        )
        .limit(limit);

      const today = todayStr();
      const yesterday = yesterdayStr();

      const entries = rows.map((row, idx) => ({
        rank: idx + 1,
        displayName: row.displayName,
        totalPoints: Number(row.periodPoints),
        periodPoints: Number(row.periodPoints),
        currentStreak: effectiveCurrentStreak(
          Number(row.currentStreak),
          row.lastActivityDate ?? null,
          today,
          yesterday,
        ),
        longestStreak: Number(row.longestStreak),
        quizCount: Number(row.quizCount),
        mockCount: Number(row.mockCount),
        pyqCount: Number(row.pyqCount),
      }));

      return res.json(entries);
    }

    const rows = await db
      .select()
      .from(userStreaksTable)
      .orderBy(
        desc(userStreaksTable.totalPoints),
        desc(userStreaksTable.currentStreak),
        desc(userStreaksTable.longestStreak),
        asc(userStreaksTable.createdAt),
      )
      .limit(limit);

    const today = todayStr();
    const yesterday = yesterdayStr();

    const entries = rows.map((row, idx) => ({
      rank: idx + 1,
      displayName: row.displayName,
      totalPoints: row.totalPoints,
      currentStreak: effectiveCurrentStreak(
        row.currentStreak,
        row.lastActivityDate,
        today,
        yesterday,
      ),
      longestStreak: row.longestStreak,
      quizCount: row.quizCount,
      mockCount: row.mockCount,
      pyqCount: row.pyqCount,
    }));

    return res.json(entries);
  } catch (err) {
    return next(err);
  }
}
