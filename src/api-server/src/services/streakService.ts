import { eq, and, isNotNull, sql, type SQL } from "drizzle-orm";
import { db } from "../db";
import { userStreaksTable, studentAttemptsTable } from "@workspace/db";
import {
  addDaysStr,
  nextStreak,
  POINTS,
  sanitizeDisplayName,
  todayStr,
  type ActivityType,
} from "./streakMath";

// Re-export pure helpers so consumers (controllers) have a single import site.
export {
  POINTS,
  addDaysStr,
  attemptRewardRef,
  classifyAttemptActivity,
  effectiveCurrentStreak,
  isActivityType,
  monthStartUtcStr,
  nextStreak,
  sanitizeDisplayName,
  sanitizeLimit,
  todayStr,
  utcDateStr,
  weekStartUtcStr,
  yesterdayStr,
} from "./streakMath";
export type {
  ActivityType,
  AttemptRefs,
  RewardedActivityType,
} from "./streakMath";

// ── DB application (must run inside a transaction) ───────────────────────

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface ApplyActivityResult {
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  pointsEarned: number;
  streakIncremented: boolean;
}

/**
 * Record one unit of activity for a user inside an existing transaction.
 *
 * Row-level locking (`SELECT … FOR UPDATE`) plus `onConflictDoNothing` on the
 * unique insert makes concurrent first-activity posts safe: the loser of the
 * insert race re-selects the committed row under lock and applies normally.
 *
 * Streak increments are day-deduped. Points default to POINTS[activityType]
 * (login always earns 0); callers pass `points: 0` when the reward must be
 * withheld (e.g. repeat plays of already-rewarded content).
 */
export async function applyUserActivity(
  tx: Tx,
  opts: {
    userId: string;
    activityType: ActivityType;
    /** Only applied when provided; keeps attempt-created rows from clobbering real names with the fallback. */
    displayName?: string;
    points?: number;
    now?: Date;
  },
): Promise<ApplyActivityResult> {
  const now = opts.now ?? new Date();
  const today = todayStr(now);
  const pointsEarned =
    opts.activityType === "login"
      ? 0
      : Math.max(0, Math.trunc(opts.points ?? POINTS[opts.activityType]));
  const displayName =
    opts.displayName === undefined ? undefined : sanitizeDisplayName(opts.displayName);

  const [existing] = await tx
    .select()
    .from(userStreaksTable)
    .where(eq(userStreaksTable.userId, opts.userId))
    .for("update");

  if (!existing) {
    const [inserted] = await tx
      .insert(userStreaksTable)
      .values({
        userId: opts.userId,
        displayName: displayName ?? "Learner",
        currentStreak: 1,
        longestStreak: 1,
        totalPoints: pointsEarned,
        quizCount: opts.activityType === "quiz" ? 1 : 0,
        mockCount: opts.activityType === "mock" ? 1 : 0,
        pyqCount: opts.activityType === "pyq" ? 1 : 0,
        lastActivityDate: today,
      })
      .onConflictDoNothing()
      .returning();

    if (inserted) {
      return {
        currentStreak: inserted.currentStreak,
        longestStreak: inserted.longestStreak,
        totalPoints: inserted.totalPoints,
        pointsEarned,
        streakIncremented: true,
      };
    }

    // Lost the unique-insert race — re-read the winner's row under lock.
    const [raced] = await tx
      .select()
      .from(userStreaksTable)
      .where(eq(userStreaksTable.userId, opts.userId))
      .for("update");
    return applyToRow(tx, raced!, opts.activityType, pointsEarned, displayName, today);
  }

  return applyToRow(tx, existing, opts.activityType, pointsEarned, displayName, today);
}

async function applyToRow(
  tx: Tx,
  row: typeof userStreaksTable.$inferSelect,
  activityType: ActivityType,
  pointsEarned: number,
  displayName: string | undefined,
  today: string,
): Promise<ApplyActivityResult> {
  const transition = nextStreak(
    row.currentStreak,
    row.lastActivityDate,
    today,
    addDaysStr(today, -1),
  );
  const newLongest = Math.max(row.longestStreak, transition.value);

  const [updated] = await tx
    .update(userStreaksTable)
    .set({
      ...(displayName !== undefined ? { displayName } : {}),
      ...(pointsEarned > 0 ? { totalPoints: row.totalPoints + pointsEarned } : {}),
      currentStreak: transition.value,
      longestStreak: newLongest,
      lastActivityDate: today,
      ...(activityType === "quiz" ? { quizCount: row.quizCount + 1 } : {}),
      ...(activityType === "mock" ? { mockCount: row.mockCount + 1 } : {}),
      ...(activityType === "pyq" ? { pyqCount: row.pyqCount + 1 } : {}),
      updatedAt: new Date(),
    })
    .where(eq(userStreaksTable.userId, row.userId))
    .returning();

  return {
    currentStreak: updated.currentStreak,
    longestStreak: updated.longestStreak,
    totalPoints: updated.totalPoints,
    pointsEarned,
    streakIncremented: transition.incremented,
  };
}

/**
 * True when this user has already been REWARDED for the same content item
 * (same examId/quizId in a reward-era attempt, i.e. one that carries an
 * activity_type). Used to make repeat plays non-farmable. Legacy attempts
 * from before rewards existed must NOT block future earnings.
 */
export async function hasPriorRewardForRef(
  tx: Tx,
  userId: string,
  ref: { column: "examId" | "quizId"; id: string },
): Promise<boolean> {
  const col =
    ref.column === "examId"
      ? studentAttemptsTable.examId
      : studentAttemptsTable.quizId;
  const [row] = await tx
    .select({ id: studentAttemptsTable.id })
    .from(studentAttemptsTable)
    .where(
      and(
        eq(studentAttemptsTable.userId, userId),
        eq(col, ref.id),
        // Only rewarded (post-migration) attempts count as prior rewards
        isNotNull(studentAttemptsTable.activityType),
      ),
    )
    .limit(1);
  return Boolean(row);
}

/** SQL fragment summing point values over attempts rows (legacy-row aware). */
export function attemptPointsSql(): SQL<number> {
  return sql<number>`coalesce(sum(case
    when ${studentAttemptsTable.activityType} = 'mock' then ${POINTS.mock}
    when ${studentAttemptsTable.activityType} = 'pyq' then ${POINTS.pyq}
    when ${studentAttemptsTable.activityType} = 'quiz' then ${POINTS.quiz}
    when ${studentAttemptsTable.examId} is not null then ${POINTS.mock}
    when ${studentAttemptsTable.quizId} is not null then ${POINTS.quiz}
    else 0 end), 0)`;
}
