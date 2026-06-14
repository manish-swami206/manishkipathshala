import { apiFetch } from "./client";
import type { CurrentAffair } from "@workspace/db";
import type {
  AdminAnalyticsResponse,
  AdminActivityLogsResponse,
  AdminCurrentAffairsResponse,
  DailyQuiz,
  QuizListItem,
} from "../types/api";

/** Re-export types for consumers that import from endpoints */
export type {
  AdminAnalyticsResponse,
  AdminActivityLogsResponse,
  AdminCurrentAffairsResponse,
  DailyQuiz,
  QuizListItem,
};

// ── Paginated response wrapper ───────────────────────────────────────────────
type Paginated<T> = {
  data: T[];
  totalPages: number;
};

// ── Daily Quizzes (public) ───────────────────────────────────────────────────
export const quizzesApi = {
  list: (params?: { status?: string }) =>
    apiFetch<QuizListItem[]>(
      `/daily-quizzes?${new URLSearchParams(params as Record<string, string>)}`,
    ),
};

// ── Current Affairs ──────────────────────────────────────────────────────────

export const currentAffairsApi = {
  list: (params?: { page?: number; limit?: number }) =>
    apiFetch<Paginated<CurrentAffair>>(
      `/current-affairs?${new URLSearchParams(
        Object.fromEntries(
          Object.entries(params ?? {}).map(([k, v]) => [k, String(v)]),
        ),
      )}`,
    ),

  getById: (id: string) =>
    apiFetch<CurrentAffair>(`/current-affairs/${encodeURIComponent(id)}`),
};

// ── Admin (auth required) ────────────────────────────────────────────────────
export const adminApi = {
  activityLogs: (
    token: string,
    params: { page: number; limit: number; action?: string },
  ): Promise<AdminActivityLogsResponse> => {
    const sp = new URLSearchParams();
    sp.set("page", String(params.page));
    sp.set("limit", String(params.limit));
    if (params.action) sp.set("action", params.action);
    return apiFetch<AdminActivityLogsResponse>(
      `/admin/activity-logs?${sp.toString()}`,
      { token },
    );
  },

  analytics: (token: string) =>
    apiFetch<AdminAnalyticsResponse>(`/admin/analytics`, { token }),

  listCurrentAffairs: (
    token: string,
    params: { page: number; limit: number; search?: string; category?: string },
  ): Promise<AdminCurrentAffairsResponse> => {
    const sp = new URLSearchParams();
    sp.set("page", String(params.page));
    sp.set("limit", String(params.limit));
    if (params.search) sp.set("search", params.search);
    if (params.category && params.category !== "All")
      sp.set("category", params.category);
    return apiFetch<AdminCurrentAffairsResponse>(
      `/admin/current-affairs?${sp.toString()}`,
      { token },
    );
  },

  getCurrentAffairsDetail: (token: string, id: string) =>
    apiFetch<CurrentAffair>(`/admin/current-affairs/${id}`, { token }),

  createCurrentAffair: (token: string, body: Record<string, unknown>) =>
    apiFetch<CurrentAffair>(`/admin/current-affairs`, {
      method: "POST",
      body: JSON.stringify(body),
      token,
    }),

  updateCurrentAffair: (
    token: string,
    id: string | number,
    body: Record<string, unknown>,
  ) =>
    apiFetch<CurrentAffair>(`/admin/current-affairs/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
      token,
    }),

  deleteCurrentAffair: (token: string, id: string | number) =>
    apiFetch<Record<string, unknown>>(`/admin/current-affairs/${id}`, {
      method: "DELETE",
      token,
    }),
};

// ── Daily quizzes (auth required) ─────────────────────────────────────────
export const dailyQuizzesApi = {
  get: (token: string, id: string) =>
    apiFetch<DailyQuiz>(`/admin/daily-quizzes/${id}`, { token }),
  delete: (token: string, id: string) =>
    apiFetch<Record<string, unknown>>(`/admin/daily-quizzes/${id}`, {
      method: "DELETE",
      token,
    }),
};
