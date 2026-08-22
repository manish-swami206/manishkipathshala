/**
 * Frontend Cache Invalidation Utility
 *
 * Calls the backend API to invalidate cache after admin mutations.
 * This ensures both the backend node-cache and Upstash Redis are cleared.
 */

import { apiFetch } from "./client";

type EntityType =
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

interface InvalidateCacheResponse {
  success: boolean;
  message: string;
  timestamp: string;
}

/**
 * Invalidate cache for a specific entity type.
 * Call this after any successful mutation in admin pages.
 *
 * @example
 * await invalidateCache("questions");
 * await invalidateCache("current-affairs");
 */
export async function invalidateCache(
  entity: EntityType,
): Promise<InvalidateCacheResponse> {
  try {
    return await apiFetch<InvalidateCacheResponse>(
      "/admin/cache/invalidate",
      {
        method: "POST",
        body: JSON.stringify({ entity }),
      },
    );
  } catch (err) {
    // Cache invalidation is non-critical — log but don't throw
    console.warn("[cache] Failed to invalidate cache:", err);
    return {
      success: false,
      message: "Cache invalidation failed (non-critical)",
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Invalidate cache for multiple entity types at once.
 *
 * @example
 * await invalidateMultipleCache(["questions", "dashboard"]);
 */
export async function invalidateMultipleCache(
  entities: EntityType[],
): Promise<InvalidateCacheResponse> {
  try {
    return await apiFetch<InvalidateCacheResponse>(
      "/admin/cache/invalidate",
      {
        method: "POST",
        body: JSON.stringify({ entities }),
      },
    );
  } catch (err) {
    console.warn("[cache] Failed to invalidate cache:", err);
    return {
      success: false,
      message: "Cache invalidation failed (non-critical)",
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Flush all caches (nuclear option).
 * Use sparingly — only for major data imports or migrations.
 */
export async function flushAllCache(): Promise<InvalidateCacheResponse> {
  try {
    return await apiFetch<InvalidateCacheResponse>(
      "/admin/cache/invalidate",
      {
        method: "POST",
        body: JSON.stringify({ action: "flush-all" }),
      },
    );
  } catch (err) {
    console.warn("[cache] Failed to flush cache:", err);
    return {
      success: false,
      message: "Cache flush failed (non-critical)",
      timestamp: new Date().toISOString(),
    };
  }
}

export type { EntityType };
