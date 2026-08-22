/**
 * Server-side API fetch helpers for generateMetadata and server components.
 * These work in Node.js (no browser APIs) and skip Clerk auth for public endpoints.
 */

import { cache } from "react";

const BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000",
);

function normalizeBaseUrl(baseUrl: string) {
  const trimmed = baseUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
}

function normalizePath(path: string) {
  if (path.startsWith("/api/")) return path.slice(4);
  if (path === "/api") return "/";
  return path.startsWith("/") ? path : `/${path}`;
}

/**
 * Server-side fetch for public API endpoints (no auth required).
 * Uses React `cache()` to deduplicate within a single render.
 */
export async function serverFetch<T>(path: string): Promise<T | null> {
  try {
    const url = `${BASE_URL}${normalizePath(path)}`;
    const res = await fetch(url, {
      next: { revalidate: 300 }, // 5 min cache for metadata
    });

    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// ── Typed response interfaces ──────────────────────────────────────────

export interface QuizDetails {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  durationMins: number;
  questionCount: number;
  negativeMarking: number;
  status: string;
  instructions: string;
}

export interface CurrentAffair {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string | null;
  category: string;
  publishedAt: string | null;
}

export interface MockTest {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  durationMins: number;
  questionCount: number;
  totalMarks: number;
}

export interface ExamSetItem {
  id: string;
  title: string;
  description: string | null;
  type: "pyq" | "ncert";
  subjectId: string | null;
  subject?: { id: string; name: string } | null;
  questionIds: string[];
  totalQuestions: number;
}

// ── Cached server fetchers ─────────────────────────────────────────────

export const fetchQuiz = cache(async (id: string) =>
  serverFetch<QuizDetails>(`/daily-quizzes/${encodeURIComponent(id)}`),
);

export const fetchCurrentAffair = cache(async (id: string) =>
  serverFetch<CurrentAffair>(`/current-affairs/${encodeURIComponent(id)}`),
);

export const fetchMockTest = cache(async (id: string) =>
  serverFetch<MockTest>(`/mock-tests/${encodeURIComponent(id)}`),
);

export const fetchExamSet = cache(async (slug: string) =>
  serverFetch<ExamSetItem>(`/pyq/sets/${encodeURIComponent(slug)}`),
);

export const fetchNcertSet = cache(async (slug: string) =>
  serverFetch<ExamSetItem>(`/ncert-mcq/sets/${encodeURIComponent(slug)}`),
);
