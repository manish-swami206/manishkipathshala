import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { userStreaksTable } from "@workspace/db";
import { db } from "../../db";
import { eq, desc, gte, and } from "drizzle-orm";
import { AppError } from "../../middleware/errorHandler";

const POINTS: Record<string, number> = {
  quiz: 5,
  mock: 50,
  pyq: 3,
  login: 0,
};

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function yesterdayStr(): string {
  return new Date(Date.now() - 86_400_000).toISOString().split("T")[0];
}

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
      .where(eq(userStreaksTable.userId, userId!));

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

    return res.json({
      currentStreak: row.currentStreak,
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
export async function recordActivity(req: Request, res: Response, next: NextFunction) {
  const { userId } = getAuth(req);
  if (!userId) {
    return next(new AppError(401, "Unauthorized"));
  }

  const { activityType, displayName } = req.body as {
    activityType?: string;
    displayName?: string;
  };

  if (!activityType || !["quiz", "mock", "pyq", "login"].includes(activityType)) {
    return next(new AppError(400, "activityType must be quiz | mock | pyq | login"));
  }

  const today = todayStr();
  const yesterday = yesterdayStr();
  const pointsEarned = POINTS[activityType] ?? 5;
  const safeDisplayName = (displayName ?? "Learner").trim() || "Learner";

  const safeUserId: string = userId;

  try {
    // Transaction + row lock prevents the read-modify-write race where two
    // concurrent activity posts double-increment streaks or collide on insert.
    const result = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(userStreaksTable)
        .where(eq(userStreaksTable.userId, safeUserId))
        .for("update");

      if (!existing) {
        const [inserted] = await tx
          .insert(userStreaksTable)
          .values({
            userId,
            displayName: safeDisplayName,
            currentStreak: 1,
            longestStreak: 1,
            totalPoints: pointsEarned,
            quizCount: activityType === "quiz" ? 1 : 0,
            mockCount: activityType === "mock" ? 1 : 0,
            pyqCount: activityType === "pyq" ? 1 : 0,
            lastActivityDate: today,
          })
          .onConflictDoNothing()
          .returning();

        if (inserted) {
          return {
            currentStreak: 1,
            longestStreak: 1,
            totalPoints: pointsEarned,
            pointsEarned,
            streakIncremented: true,
          };
        }
        // Lost the unique-insert race — fall through by re-selecting locked row
        const [raced] = await tx
          .select()
          .from(userStreaksTable)
          .where(eq(userStreaksTable.userId, safeUserId))
          .for("update");
        return applyActivity(tx, raced!);
      }

      return applyActivity(tx, existing);
    });

    return res.json(result);
  } catch (err) {
    return next(err);
  }

  async function applyActivity(
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
    row: typeof userStreaksTable.$inferSelect,
  ) {
    const alreadyToday = row.lastActivityDate === today;
    let newStreak = row.currentStreak;
    let streakIncremented = false;

    if (!alreadyToday) {
      if (row.lastActivityDate === yesterday) {
        newStreak = row.currentStreak + 1;
      } else {
        newStreak = 1;
      }
      streakIncremented = true;
    }

    const newLongest = Math.max(row.longestStreak, newStreak);
    const newPoints = row.totalPoints + pointsEarned;

    const [updated] = await tx
      .update(userStreaksTable)
      .set({
        displayName: safeDisplayName,
        ...(activityType === "login" ? {} : { totalPoints: newPoints }),
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastActivityDate: today,
        ...(activityType === "quiz" ? { quizCount: row.quizCount + 1 } : {}),
        ...(activityType === "mock" ? { mockCount: row.mockCount + 1 } : {}),
        ...(activityType === "pyq" ? { pyqCount: row.pyqCount + 1 } : {}),
        updatedAt: new Date(),
      })
      .where(eq(userStreaksTable.userId, safeUserId))
      .returning();

    return {
      currentStreak: updated.currentStreak,
      longestStreak: updated.longestStreak,
      totalPoints: activityType === "login" ? row.totalPoints : updated.totalPoints,
      pointsEarned,
      streakIncremented,
    };
  }
}

// GET /leaderboard — public
export async function getLeaderboard(req: Request, res: Response, next: NextFunction) {
  const limit = Math.min(Number(req.query.limit ?? 20), 50);
  const period = req.query.period as string | undefined;

  try {
    const conditions = [];
    if (period === "monthly") {
      const firstOfMonth = new Date();
      firstOfMonth.setDate(1);
      conditions.push(gte(userStreaksTable.lastActivityDate, firstOfMonth.toISOString().split("T")[0]));
    } else if (period === "weekly") {
      const now = new Date();
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(now.getFullYear(), now.getMonth(), diff);
      conditions.push(gte(userStreaksTable.lastActivityDate, monday.toISOString().split("T")[0]));
    }

    const where = conditions.length ? and(...conditions) : undefined;

    const rows = await db
      .select()
      .from(userStreaksTable)
      .where(where)
      .orderBy(desc(userStreaksTable.totalPoints))
      .limit(limit);

    const entries = rows.map((row, idx) => ({
      rank: idx + 1,
      displayName: row.displayName,
      totalPoints: row.totalPoints,
      currentStreak: row.currentStreak,
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
