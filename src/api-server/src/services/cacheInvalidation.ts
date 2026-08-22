/**
 * Centralized Cache Invalidation Service
 *
 * Provides a single source of truth for cache key patterns and invalidation
 * logic. All admin mutation operations should call these functions after
 * successful database writes to ensure cache consistency.
 */

import { cacheDel, cacheFlushPattern } from "../lib/cache";

// ── Cache Key Patterns ──────────────────────────────────────────────────

export const CacheKeys = {
  // Dashboard & Analytics
  DASHBOARD_STATS: "admin:dashboard:stats",
  ANALYTICS_OVERVIEW: "admin:analytics:overview",

  // Content entities (pattern-based)
  QUESTIONS: "questions:",
  SUBJECTS: "subjects:",
  ANNOUNCEMENTS: "announcements:",
  MOCK_TESTS: "mock-tests:",
  CURRENT_AFFAIRS: "current-affairs:",
  STUDY_NOTES: "study-notes:",
  SYLLABUS: "syllabus:",
  NCERT_BOOKS: "ncert-books:",
  NCERT_MCQ: "ncert-mcq:",
  DAILY_QUIZZES: "daily-quizzes:",
  EXAM_SETS: "exam-sets:",
  PYP: "pyp:",
  LEADERBOARD: "leaderboard:",
} as const;

// ── Entity Types ────────────────────────────────────────────────────────

export type EntityType =
  | "questions"
  | "subjects"
  | "announcements"
  | "mock-tests"
  | "current-affairs"
  | "study-notes"
  | "syllabus"
  | "ncert-books"
  | "ncert-mcq"
  | "daily-quizzes"
  | "exam-sets"
  | "pyp"
  | "dashboard"
  | "all";

// ── Invalidation Functions ──────────────────────────────────────────────

/**
 * Invalidate cache for a specific entity type.
 * This is the primary function to call after any mutation.
 */
export function invalidateEntity(type: EntityType, id?: string): void {
  const keysToDelete: string[] = [];
  const patternsToFlush: string[] = [];

  switch (type) {
    case "questions":
      patternsToFlush.push(CacheKeys.QUESTIONS);
      keysToDelete.push(CacheKeys.DASHBOARD_STATS, CacheKeys.ANALYTICS_OVERVIEW);
      break;

    case "subjects":
      patternsToFlush.push(CacheKeys.SUBJECTS);
      keysToDelete.push(CacheKeys.DASHBOARD_STATS, CacheKeys.ANALYTICS_OVERVIEW);
      break;

    case "announcements":
      keysToDelete.push(CacheKeys.ANNOUNCEMENTS + "active");
      break;

    case "mock-tests":
      patternsToFlush.push(CacheKeys.MOCK_TESTS);
      break;

    case "current-affairs":
      patternsToFlush.push(CacheKeys.CURRENT_AFFAIRS);
      break;

    case "study-notes":
      patternsToFlush.push(CacheKeys.STUDY_NOTES);
      break;

    case "syllabus":
      patternsToFlush.push(CacheKeys.SYLLABUS);
      break;

    case "ncert-books":
      patternsToFlush.push(CacheKeys.NCERT_BOOKS);
      break;

    case "ncert-mcq":
      patternsToFlush.push(CacheKeys.NCERT_MCQ);
      keysToDelete.push(CacheKeys.DASHBOARD_STATS);
      break;

    case "daily-quizzes":
      patternsToFlush.push(CacheKeys.DAILY_QUIZZES);
      keysToDelete.push(CacheKeys.DASHBOARD_STATS);
      break;

    case "exam-sets":
      patternsToFlush.push(CacheKeys.EXAM_SETS);
      keysToDelete.push(CacheKeys.DASHBOARD_STATS);
      break;

    case "pyp":
      patternsToFlush.push(CacheKeys.PYP);
      break;

    case "dashboard":
      keysToDelete.push(CacheKeys.DASHBOARD_STATS, CacheKeys.ANALYTICS_OVERVIEW);
      break;

    case "all":
      // Nuclear option — flush everything
      patternsToFlush.push(
        CacheKeys.QUESTIONS,
        CacheKeys.SUBJECTS,
        CacheKeys.MOCK_TESTS,
        CacheKeys.CURRENT_AFFAIRS,
        CacheKeys.STUDY_NOTES,
        CacheKeys.SYLLABUS,
        CacheKeys.NCERT_BOOKS,
        CacheKeys.NCERT_MCQ,
        CacheKeys.DAILY_QUIZZES,
        CacheKeys.EXAM_SETS,
        CacheKeys.PYP,
      );
      keysToDelete.push(
        CacheKeys.DASHBOARD_STATS,
        CacheKeys.ANALYTICS_OVERVIEW,
        CacheKeys.ANNOUNCEMENTS + "active",
        CacheKeys.LEADERBOARD,
      );
      break;
  }

  // Delete specific keys
  if (keysToDelete.length > 0) {
    cacheDel(keysToDelete);
  }

  // Flush pattern-based keys
  for (const pattern of patternsToFlush) {
    cacheFlushPattern(pattern);
  }
}

/**
 * Invalidate multiple entity types at once.
 * Useful for bulk operations that affect multiple entities.
 */
export function invalidateEntities(types: EntityType[]): void {
  for (const type of types) {
    invalidateEntity(type);
  }
}

/**
 * Get all cache key patterns (for debugging/monitoring).
 */
export function getAllCachePatterns(): Record<string, string> {
  return { ...CacheKeys };
}
