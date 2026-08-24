/**
 * Pure streak/points math — no DB imports so it stays unit-testable
 * without a DATABASE_URL.
 */

export type ActivityType = "quiz" | "mock" | "pyq" | "login";
export type RewardedActivityType = Exclude<ActivityType, "login">;

export const POINTS: Record<ActivityType, number> = {
  quiz: 5,
  mock: 50,
  pyq: 3,
  login: 0,
};

const ACTIVITY_TYPES: readonly string[] = ["quiz", "mock", "pyq", "login"];
const REWARDED_TYPES: readonly string[] = ["quiz", "mock", "pyq"];

export function isActivityType(value: unknown): value is ActivityType {
  return typeof value === "string" && ACTIVITY_TYPES.includes(value);
}

// ── Date helpers (pure UTC — activity days flip at UTC midnight) ─────────

export function utcDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDaysStr(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return utcDateStr(d);
}

export function todayStr(now: Date = new Date()): string {
  return utcDateStr(now);
}

export function yesterdayStr(now: Date = new Date()): string {
  return addDaysStr(utcDateStr(now), -1);
}

/** Monday of the current UTC week (pure UTC math — no server-local drift). */
export function weekStartUtcStr(now: Date = new Date()): string {
  const utcMidnight = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const daysSinceMonday = (now.getUTCDay() + 6) % 7;
  return utcDateStr(new Date(utcMidnight - daysSinceMonday * 86_400_000));
}

/** First day of the current UTC month. */
export function monthStartUtcStr(now: Date = new Date()): string {
  return `${now.toISOString().slice(0, 7)}-01`;
}

// ── Streak transitions ───────────────────────────────────────────────────

/**
 * Streak transition for an activity happening `today` given the stored state.
 * Same day -> keep streak; consecutive UTC day -> +1; anything else -> reset to 1.
 */
export function nextStreak(
  currentStreak: number,
  lastActivityDate: string | null,
  today: string,
  yesterday: string,
): { value: number; incremented: boolean } {
  if (lastActivityDate === today) {
    return { value: Math.max(currentStreak, 1), incremented: false };
  }
  if (lastActivityDate === yesterday) {
    return { value: currentStreak + 1, incremented: true };
  }
  return { value: 1, incremented: true };
}

/**
 * Display-safe streak: a stored streak is only "alive" if the last activity
 * was today or yesterday. Older streaks read as broken (0) until the user is
 * active again — prevents ghost flames on profiles/leaderboard.
 */
export function effectiveCurrentStreak(
  currentStreak: number,
  lastActivityDate: string | null,
  today: string,
  yesterday: string,
): number {
  if (currentStreak < 1) return 0;
  if (lastActivityDate === today || lastActivityDate === yesterday) {
    return currentStreak;
  }
  return 0;
}

// ── Input sanitizers ─────────────────────────────────────────────────────

/** Clamp ?limit= into [1, max]; NaN/negative/garbage falls back. */
export function sanitizeLimit(raw: unknown, fallback = 20, max = 50): number {
  if (raw === "" || raw === null || raw === undefined) return fallback;
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.trunc(n), 1), max);
}

/** Trim, collapse whitespace, strip control chars, cap length, safe fallback. */
export function sanitizeDisplayName(raw: unknown): string {
  if (typeof raw !== "string") return "Learner";
  // eslint-disable-next-line no-control-regex
  const cleaned = raw
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40);
  return cleaned || "Learner";
}

// ── Attempt classification ───────────────────────────────────────────────

export interface AttemptRefs {
  examId?: string;
  quizId?: string;
}

/**
 * Classify which reward bucket an attempt belongs to. The explicit type wins
 * when provided by a player wrapper; otherwise examId implies mock and
 * quizId implies quiz/daily.
 */
export function classifyAttemptActivity(
  refs: AttemptRefs,
  explicit?: unknown,
): RewardedActivityType | null {
  if (typeof explicit === "string" && REWARDED_TYPES.includes(explicit)) {
    return explicit as RewardedActivityType;
  }
  if (refs.examId) return "mock";
  if (refs.quizId) return "quiz";
  return null;
}

/** Content identity used for first-completion-only point dedupe. */
export function attemptRewardRef(
  activity: RewardedActivityType,
  refs: AttemptRefs,
): { column: "examId" | "quizId"; id: string } | null {
  if (activity === "mock") {
    return refs.examId ? { column: "examId", id: refs.examId } : null;
  }
  return refs.quizId ? { column: "quizId", id: refs.quizId } : null;
}
