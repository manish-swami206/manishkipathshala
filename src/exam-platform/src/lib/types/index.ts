// ── Centralized Type Definitions ─────────────────────────────────────────────
// All shared types used across the frontend application.
// Import from lib/db schema where possible to maintain single source of truth.

export type {
  Announcement,
  CurrentAffair,
  MockTest,
  NcertBook,
  PreviousYearPaper,
  StudyNote,
  Syllabus,
  Subject,
  Question,
  DailyQuizType,
  SupportMessage,
  SupportTicket,
  ExamSet,
  UserStreak,
} from "@workspace/db";

export type { PyqSubject } from "./api";
export type { PaginatedResponse, ActionResponse } from "./api";
export type {
  AdminDashboardStats,
  LeaderboardEntry,
  DailyQuiz,
  PyqQuestion,
  QuizDetails,
  MyStreak,
  RecordActivityResponse,
  AdminActivityLog,
  ExamListItem,
  ExamDetailResponse,
  ExamDetailQuestion,
  NcertBookListItem,
  PreviousYearPaperListItem,
  ExamSetItem,
  SupportTicketListItem,
  SupportTicketDetail,
  AdminActivityLogsResponse,
  AdminAnalyticsResponse,
  AdminCurrentAffairsResponse,
  McqQuestion,
  McqResponse,
  ListNcertBooksParams,
  QuestionOption,
  BatchQuestion,
} from "./api";
