import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { UseQueryOptions, UseMutationOptions } from "@tanstack/react-query";
import type {
  Announcement,
  CurrentAffair,
  MockTest,
  NcertBook,
  PreviousYearPaper,
  Syllabus,
  StudyNote,
  SupportMessage,
  SupportTicket,
  Subject as DbSubject,
} from "@workspace/db";
import { apiFetch, ApiError } from "./client";
import { adminApi, currentAffairsApi, quizzesApi } from "./endpoints";
import { queryKeys } from "./query-keys";

import type {
  PyqSubject,
  DailyQuiz,
  PyqQuestion,
  QuizDetails,
  MyStreak,
  RecordActivityResponse,
  AdminDashboardStats,
  LeaderboardEntry,
  StudentAttempt,
} from "@/lib/types/api";

export type { LeaderboardEntry } from "@/lib/types/api";
export type { PyqSubject } from "@/lib/types/api";
export type Subject = DbSubject;

export type ListNcertBooksParams = {
  classNum?: number;
  subject?: string;
  medium?: string;
};

// ── Support API Types ────────────────────────────────────────────────────

export interface SupportTicketListItem {
  id: string;
  title: string;
  status: string;
  isReadByUser: boolean;
  lastMessageAt: string | null;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SupportTicketDetail {
  ticket: SupportTicketListItem;
  messages: {
    id: string;
    ticketId: string;
    message: string;
    sender: "user" | "support";
    createdAt: string;
  }[];
}

// ── Helper to build search params ────────────────────────────────────────

function toSearchParams(
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    searchParams.set(key, String(value));
  }
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function normalizeId(id: string | number): string {
  return String(id).trim();
}

function adminPath(path: string): string {
  return path.startsWith("/api/")
    ? path
    : `/api${path.startsWith("/") ? path : `/${path}`}`;
}

export const customFetch = apiFetch;

// ── Tokenized query/mutation helpers ─────────────────────────────────────

type QueryHookOptions = {
  query?: Record<string, unknown>;
};

type MutationHookOptions = Record<string, unknown>;

function useTokenizedQuery<TData>(
  queryKey: readonly unknown[],
  fetcher: (token?: string) => Promise<TData>,
  options?: QueryHookOptions,
) {
  const { getToken } = useAuth();
  const overrideOptions = options?.query ?? {};

  // Extract known options explicitly, spread the rest (e.g. staleTime, gcTime)
  const { queryKey: overrideQueryKey, enabled: overrideEnabled, ...restOptions } = overrideOptions;

  return useQuery({
    queryKey: (overrideQueryKey as readonly unknown[]) ?? queryKey,
    queryFn: async () => fetcher((await getToken()) ?? undefined),
    enabled: (overrideEnabled as boolean | undefined) ?? true,
    ...restOptions,
  } as UseQueryOptions<TData, Error>);
}

function useTokenizedMutation<TVariables, TData>(
  mutationFn: (variables: TVariables, token?: string) => Promise<TData>,
  _options?: MutationHookOptions,
) {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (variables: TVariables) =>
      mutationFn(variables, (await getToken()) ?? undefined),
  } as UseMutationOptions<TData, Error, TVariables>);
}

// ── Public (no-auth) query/mutation helpers ──────────────────────────────
// These skip Clerk getToken() entirely — only for public API endpoints.

function usePublicQuery<TData>(
  queryKey: readonly unknown[],
  fetcher: () => Promise<TData>,
  options?: QueryHookOptions,
) {
  const overrideOptions = options?.query ?? {};

  // Extract known options explicitly, spread the rest (e.g. staleTime, gcTime)
  const { queryKey: overrideQueryKey, enabled: overrideEnabled, ...restOptions } = overrideOptions;

  return useQuery({
    queryKey: (overrideQueryKey as readonly unknown[] | undefined) ?? queryKey,
    queryFn: fetcher,
    enabled: (overrideEnabled as boolean | undefined) ?? true,
    ...restOptions,
  } as UseQueryOptions<TData, Error>);
}

function usePublicMutation<TVariables, TData>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  _options?: MutationHookOptions,
) {
  return useMutation({
    mutationFn,
  } as UseMutationOptions<TData, Error, TVariables>);
}

// ── Query Key Helper Functions ───────────────────────────────────────────

export function getListAnnouncementsQueryKey() {
  return ["announcements", "list"] as const;
}

export function getGetQuizQueryKey(id: string) {
  return queryKeys.quizzes.detail(id);
}

export function getGetMockTestQueryKey(id: string) {
  return queryKeys.mockTests.detail(id);
}

export function getGetCurrentAffairQueryKey(id: string) {
  return queryKeys.currentAffairs.detail(id);
}

export function getListPyqQuestionsQueryKey(params: {
  subjectId: string;
  page?: number;
}) {
  return queryKeys.pyq.questions(String(params.subjectId), {
    page: params.page ?? 1,
  });
}

// ── Announcements ────────────────────────────────────────────────────────

export function useListAnnouncements(options?: QueryHookOptions) {
  return usePublicQuery<Announcement[]>(
    getListAnnouncementsQueryKey(),
    () => apiFetch<Announcement[]>("/announcements"),
    options,
  );
}

// ── Support API ──────────────────────────────────────────────────────────

export function useListSupportTickets(options?: QueryHookOptions) {
  return useTokenizedQuery<SupportTicketListItem[]>(
    ["support", "tickets", "list"] as const,
    (token) => apiFetch<SupportTicketListItem[]>("/support/tickets", { token }),
    options,
  );
}

export function useSupportTicket(id: string | number, options?: QueryHookOptions) {
  return useTokenizedQuery<SupportTicketDetail>(
    ["support", "tickets", "detail", id] as const,
    (token) => apiFetch<SupportTicketDetail>(`/support/tickets/${id}`, { token }),
    options,
  );
}

export function useCreateSupportTicket(options?: MutationHookOptions) {
  return useTokenizedMutation<
    { title: string; message: string },
    SupportTicketListItem
  >(
    async (body, token) =>
      apiFetch<SupportTicketListItem>("/support/tickets", {
        method: "POST",
        body: JSON.stringify(body),
        token,
      }),
    options,
  );
}

export function useSendSupportTicketMessage(
  id: string | number,
  options?: MutationHookOptions,
) {
  return useTokenizedMutation<
    { message: string },
    {
      id: string;
      ticketId: string;
      message: string;
      sender: string;
      createdAt: string;
    }
  >(async (body, token) => {
    const result = await apiFetch<{
      id: string;
      ticketId: string;
      message: string;
      sender: string;
      createdAt: string;
    }>(`/support/tickets/${id}/messages`, {
      method: "POST",
      body: JSON.stringify(body),
      token,
    });
    return result;
  }, options);
}

export function useDeleteSupportTicket(options?: MutationHookOptions) {
  return useTokenizedMutation<string, { success: boolean }>(
    async (id, token) =>
      apiFetch<{ success: boolean }>(`/support/tickets/${id}`, {
        method: "DELETE",
        token,
      }),
    options,
  );
}

export function useSupportUnreadCount(options?: QueryHookOptions) {
  return useTokenizedQuery<{ unreadCount: number }>(
    ["support", "unread-count"] as const,
    (token) => apiFetch<{ unreadCount: number }>("/support/unread-count", { token }),
    options,
  );
}

// ── Admin Support ────────────────────────────────────────────────────────

export function useAdminSupportUnreadCount(options?: QueryHookOptions) {
  return useTokenizedQuery<{ unreadCount: number }>(
    ["admin", "supportTickets", "unread-count"] as const,
    (token) => apiFetch<{ unreadCount: number }>("/admin/support-tickets/unread-count", { token }),
    options,
  );
}

// ── Study Notes ──────────────────────────────────────────────────────────

export function useListStudyNotes(
  params?: {
    subject?: string;
    medium?: string;
    search?: string;
    page?: number;
  },
  options?: QueryHookOptions,
) {
  return usePublicQuery<{
    data: StudyNote[];
    total: number;
    page: number;
    totalPages: number;
  }>(
    ["studyNotes", "list", params ?? {}] as const,
    () =>
      apiFetch<{
        data: StudyNote[];
        total: number;
        page: number;
        totalPages: number;
      }>("/study-notes" + toSearchParams(params ?? {})),
    options,
  );
}

// ── Syllabus ─────────────────────────────────────────────────────────────

export function useListSyllabus(options?: QueryHookOptions) {
  return usePublicQuery<Syllabus[]>(
    ["syllabus", "list"] as const,
    () => apiFetch<Syllabus[]>("/syllabus"),
    options,
  );
}

// ── NCERT Books ──────────────────────────────────────────────────────────

export function useListNcertBooks(
  params?: ListNcertBooksParams,
  options?: QueryHookOptions,
) {
  return usePublicQuery<{
    data: NcertBook[];
    total: number;
    page: number;
    totalPages: number;
  }>(
    ["ncertBooks", "list", params ?? {}] as const,
    () =>
      apiFetch<{
        data: NcertBook[];
        total: number;
        page: number;
        totalPages: number;
      }>("/ncert-books" + toSearchParams(params ?? {})),
    options,
  );
}

// ── PYPs ─────────────────────────────────────────────────────────────────

export function useListPyp(
  params?: { examName?: string; year?: string; subject?: string; page?: number; limit?: number },
  options?: QueryHookOptions,
) {
  return usePublicQuery<{
    data: PreviousYearPaper[];
    total: number;
    page: number;
    totalPages: number;
  }>(
    ["pyp", "list", params ?? {}] as const,
    () =>
      apiFetch<{
        data: PreviousYearPaper[];
        total: number;
        page: number;
        totalPages: number;
      }>("/pyp" + toSearchParams(params ?? {})),
    options,
  );
}

// ── Mock Tests ───────────────────────────────────────────────────────────

interface ListMockTestsResponse {
  data: MockTest[];
  total: number;
  page: number;
  totalPages: number;
}

export function useListMockTests(options?: QueryHookOptions) {
  return usePublicQuery<ListMockTestsResponse>(
    queryKeys.mockTests.list(),
    () => apiFetch<ListMockTestsResponse>("/mock-tests"),
    options,
  );
}

export function useGetMockTest(id: string, options?: QueryHookOptions) {
  return usePublicQuery<MockTest>(
    getGetMockTestQueryKey(id),
    () => apiFetch<MockTest>(`/mock-tests/${normalizeId(id)}`),
    options,
  );
}

// ── Daily Quizzes ────────────────────────────────────────────────────────

export function useGetQuiz(id: string, options?: QueryHookOptions) {
  return usePublicQuery<QuizDetails>(
    getGetQuizQueryKey(id),
    () => apiFetch<QuizDetails>(`/daily-quizzes/${normalizeId(id)}`),
    options,
  );
}

// ── Subjects ─────────────────────────────────────────────────────────────

export function useListSubjects(options?: QueryHookOptions) {
  return usePublicQuery<PyqSubject[]>(
    queryKeys.subjects.all(),
    () => apiFetch<PyqSubject[]>("/subjects"),
    options,
  );
}

// ── PYQ Questions ────────────────────────────────────────────────────────

export function useListPyqQuestions(
  params: { subjectId: string; page?: number },
  options?: QueryHookOptions,
) {
  return usePublicQuery<{
    data: PyqQuestion[];
    total: number;
    page: number;
    totalPages: number;
  }>(
    getListPyqQuestionsQueryKey(params),
    () =>
      apiFetch<{
        data: PyqQuestion[];
        total: number;
        page: number;
        totalPages: number;
      }>(
        `/pyq/questions${toSearchParams({
          subjectId: params.subjectId,
          page: params.page ?? 1,
        })}`,
      ),
    options,
  );
}

// ── Current Affairs ──────────────────────────────────────────────────────

export function useGetCurrentAffair(id: string, options?: QueryHookOptions) {
  return usePublicQuery<CurrentAffair>(
    getGetCurrentAffairQueryKey(id),
    () => apiFetch<CurrentAffair>(`/current-affairs/${id}`),
    options,
  );
}

export function useCurrentAffair(id: string, options?: QueryHookOptions) {
  return useTokenizedQuery<CurrentAffair>(
    ["admin", "currentAffairs", "detail", normalizeId(id)] as const,
    (token) => apiFetch<CurrentAffair>(`/admin/current-affairs/${normalizeId(id)}`, { token }),
    options,
  );
}

export function useUpdateCurrentAffair(
  id: string,
  options?: MutationHookOptions,
) {
  return useTokenizedMutation<Record<string, unknown>, CurrentAffair>(
    async (body, token) =>
      apiFetch<CurrentAffair>(`/admin/current-affairs/${normalizeId(id)}`, {
        method: "PATCH",
        body: JSON.stringify(body),
        token,
      }),
    options,
  );
}

// ── Streaks ──────────────────────────────────────────────────────────────

export function useGetMyStreak(options?: QueryHookOptions) {
  return useTokenizedQuery<MyStreak>(
    queryKeys.streaks.current(),
    (token) => apiFetch<MyStreak>("/streaks/me", { token }),
    options,
  );
}

export function useGetLeaderboard(
  params?: { limit?: number; period?: string },
  options?: QueryHookOptions,
) {
  return usePublicQuery<LeaderboardEntry[]>(
    ["stats", "leaderboard", params ?? {}] as const,
    () =>
      apiFetch<LeaderboardEntry[]>(
        `/leaderboard${toSearchParams(params ?? {})}`,
      ),
    options,
  );
}

export function useRecordActivity(options?: MutationHookOptions) {
  return useTokenizedMutation<
    { data: { activityType: string; displayName: string } },
    RecordActivityResponse
  >(
    async (variables, token) =>
      apiFetch<RecordActivityResponse>("/streaks/activity", {
        method: "POST",
        body: JSON.stringify(variables.data),
        token,
      }),
    options,
  );
}

// ── Attempts History ────────────────────────────────────────────────────

export function useSaveAttempt(options?: MutationHookOptions) {
  return useTokenizedMutation<
    {
      examId?: string;
      quizId?: string;
      score: number;
      totalMarks: number;
      correctCount: number;
      wrongCount: number;
      skippedCount: number;
      timeTakenSecs: number;
      isPassed: boolean;
    },
    StudentAttempt
  >(
    async (body, token) =>
      apiFetch<StudentAttempt>("/attempts", {
        method: "POST",
        body: JSON.stringify(body),
        token,
      }),
    options,
  );
}

export function useMyAttempts(options?: QueryHookOptions) {
  return useTokenizedQuery<StudentAttempt[]>(
    ["attempts", "mine"] as const,
    (token) => apiFetch<StudentAttempt[]>("/attempts/mine", { token }),
    options,
  );
}

// ── Admin Dashboard ──────────────────────────────────────────────────────

export function useAdminDashboard(options?: QueryHookOptions) {
  return useTokenizedQuery<AdminDashboardStats>(
    ["admin", "dashboard", "overview"] as const,
    (token) => apiFetch<AdminDashboardStats>("/admin/dashboard", { token }),
    options,
  );
}

// ── Admin Daily Quizzes ──────────────────────────────────────────────────

export function useAdminListDailyQuizzes(
  params?: { page?: number; limit?: number },
  options?: QueryHookOptions,
) {
  return useTokenizedQuery<{
    quizzes: DailyQuiz[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>(
    ["admin", "dailyQuizzes", "list", params ?? {}] as const,
    (token) =>
      apiFetch<{
        quizzes: DailyQuiz[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>(`/admin/daily-quizzes${toSearchParams(params ?? {})}`, { token }),
    options,
  );
}

export function useAdminDailyQuiz(
  id: string | number,
  options?: QueryHookOptions,
) {
  return useTokenizedQuery<DailyQuiz>(
    ["admin", "dailyQuizzes", "detail", normalizeId(id)] as const,
    (token) => apiFetch<DailyQuiz>(`/admin/daily-quizzes/${normalizeId(id)}`, { token }),
    options,
  );
}

export function useDeleteDailyQuiz(options?: MutationHookOptions) {
  return useTokenizedMutation<string | number, Record<string, unknown>>(
    async (id, token) =>
      apiFetch<Record<string, unknown>>(
        `/admin/daily-quizzes/${normalizeId(id)}`,
        { method: "DELETE", token },
      ),
    options,
  );
}

export function useCreateDailyQuiz(options?: MutationHookOptions) {
  return useTokenizedMutation<Record<string, unknown>, DailyQuiz>(
    async (body, token) =>
      apiFetch<DailyQuiz>("/admin/daily-quizzes", {
        method: "POST",
        body: JSON.stringify(body),
        token,
      }),
    options,
  );
}

export function useUpdateDailyQuiz(
  id: string | number,
  options?: MutationHookOptions,
) {
  return useTokenizedMutation<Record<string, unknown>, DailyQuiz>(
    async (body, token) =>
      apiFetch<DailyQuiz>(`/admin/daily-quizzes/${normalizeId(id)}`, {
        method: "PATCH",
        body: JSON.stringify(body),
        token,
      }),
    options,
  );
}

// ── Admin Support Tickets ────────────────────────────────────────────────

export function useAdminListSupportTickets(
  params?: { page?: number; limit?: number; status?: string; search?: string },
  options?: QueryHookOptions,
) {
  return useTokenizedQuery<{
    data: SupportTicket[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>(
    ["admin", "supportTickets", "list", params ?? {}] as const,
    (token) =>
      apiFetch<{
        data: SupportTicket[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>(`/admin/support-tickets${toSearchParams(params ?? {})}`, { token }),
    options,
  );
}

export function useAdminSupportTicket(
  id: string | number,
  options?: QueryHookOptions,
) {
  return useTokenizedQuery<{
    ticket: SupportTicket;
    messages: SupportMessage[];
  }>(
    ["admin", "supportTickets", "detail", normalizeId(id)] as const,
    (token) =>
      apiFetch<{
        ticket: SupportTicket;
        messages: SupportMessage[];
      }>(`/admin/support-tickets/${normalizeId(id)}`, { token }),
    options,
  );
}

export function useCreateSupportTicketReply(
  id: string | number,
  options?: MutationHookOptions,
) {
  return useTokenizedMutation<{ message: string }, SupportMessage>(
    async (body, token) =>
      apiFetch<SupportMessage>(
        `/admin/support-tickets/${normalizeId(id)}/replies`,
        { method: "POST", body: JSON.stringify(body), token },
      ),
    options,
  );
}

export function useUpdateSupportTicketStatus(
  id: string | number,
  options?: MutationHookOptions,
) {
  return useTokenizedMutation<string, SupportTicket>(
    async (status, token) =>
      apiFetch<SupportTicket>(
        `/admin/support-tickets/${normalizeId(id)}/status`,
        { method: "PATCH", body: JSON.stringify({ status }), token },
      ),
    options,
  );
}

export function useAssignSupportTicket(
  id: string | number,
  options?: MutationHookOptions,
) {
  return useTokenizedMutation<string, SupportTicket>(
    async (assignedTo, token) =>
      apiFetch<SupportTicket>(
        `/admin/support-tickets/${normalizeId(id)}/assign`,
        { method: "PATCH", body: JSON.stringify({ assignedTo }), token },
      ),
    options,
  );
}

// ── Re-exports ───────────────────────────────────────────────────────────

export { ApiError, adminApi, currentAffairsApi, quizzesApi };

export type { DailyQuiz } from "@/lib/types/api";
export type {
  Announcement,
  CurrentAffair,
  MockTest,
  NcertBook,
  PreviousYearPaper,
  StudyNote,
  SupportMessage,
  SupportTicket,
};
