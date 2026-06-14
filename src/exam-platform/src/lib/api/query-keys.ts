// Centralized query key factory — prevents cache key collisions
export const queryKeys = {
  quizzes: {
    list: (params?: { status?: string } | undefined) =>
      ["dailyQuizzes", "list", params ?? {}] as const,
    detail: (id: string) => ["dailyQuizzes", "detail", id] as const,
  },
  currentAffairs: {
    list: (params?: { page?: number; limit?: number } | undefined) =>
      ["currentAffairs", "list", params ?? {}] as const,
    detail: (id: string) => ["currentAffairs", "detail", id] as const,
  },
  studyNotes: {
    list: () => ["studyNotes", "list"] as const,
  },
  ncert: {
    books: () => ["ncert", "books"] as const,
    mcq: (params?: { page?: number; limit?: number } | undefined) =>
      ["ncert", "mcq", params ?? {}] as const,
  },
  subjects: {
    all: () => ["subjects", "all"] as const,
  },
  pyq: {
    subjects: () => ["pyq", "subjects"] as const,
    questions: (
      subjectId: string,
      params?: Record<string, string | number> | undefined,
    ) => ["pyq", "questions", subjectId, params ?? {}] as const,
  },
  mockTests: {
    list: () => ["mockTests", "list"] as const,
    detail: (id: string) => ["mockTests", "detail", id] as const,
  },
  stats: {
    platform: () => ["stats", "platform"] as const,
    leaderboard: (params?: { examId?: string } | undefined) =>
      ["stats", "leaderboard", params ?? {}] as const,
  },
  streaks: {
    current: () => ["streaks", "current"] as const,
  },
  admin: {
    activityLogs: {
      list: (params: {
        page: number;
        limit: number;
        action?: string | undefined;
      }) => ["admin", "activityLogs", "list", params] as const,
    },
    analytics: {
      overview: () => ["admin", "analytics", "overview"] as const,
    },
    currentAffairs: {
      all: () => ["admin", "currentAffairs"] as const,
      list: (params: {
        page: number;
        limit: number;
        search?: string;
        category?: string;
      }) => ["admin", "currentAffairs", "list", params] as const,
      detail: (id: number) =>
        ["admin", "currentAffairs", "detail", id] as const,
      create: () => ["admin", "currentAffairs", "create"] as const,
      update: (id: number) =>
        ["admin", "currentAffairs", "update", id] as const,
    },
    dailyQuizzes: {
      detail: (id: string) => ["admin", "dailyQuizzes", "detail", id] as const,
    },
    drafts: {
      all: () => ["admin", "drafts", "all"] as const,
    },
  },
} as const;
