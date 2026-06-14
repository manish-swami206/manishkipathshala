// ── API Response & Data Types ────────────────────────────────────────────

import type { Subject } from "@workspace/db";

/** PYQ subject enriched with question count */
export type PyqSubject = Subject & { questionCount?: number };

/** Paginated API response wrapper */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
  limit?: number;
}

/** Generic action response */
export interface ActionResponse {
  success: boolean;
  message?: string;
}

// ── Admin Dashboard ──────────────────────────────────────────────────────

export interface AdminDashboardStats {
  totalQuestions: number;
  totalAttempts: number;
  passedAttempts: number;
  passPercentage: number;
  recentActivity: AdminActivityLog[];
  stats?: {
    totalStudents: number;
    newStudentsThisWeek: number;
    totalQuestions: number;
    totalQuizzes: number;
    totalMockTests: number;
    totalCurrentAffairs: number;
    openSupportTickets: number;
    storageUsedMb: number;
  };
  activityChart?: Array<{
    date: string;
    quizAttempts: number;
    newUsers: number;
  }>;
  topQuizzes?: Array<{
    id: string;
    title: string;
    attempts: number;
  }>;
  recentStudents?: Array<{
    id: string;
    name: string;
    email: string;
    joinedAt: string;
  }>;
}

export interface AdminActivityLog {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  userId: string;
  createdAt: string;
  ipAddress?: string | null;
}

export interface AdminActivityLogsResponse {
  data: AdminActivityLog[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AdminAnalyticsResponse {
  totalAttempts: number;
  avgScore: number;
  avgTimeTaken: number;
  passCount: number;
  failCount: number;
}

export interface AdminCurrentAffairsResponse {
  items: CurrentAffairItem[];
  total: number;
  page: number;
  limit: number;
}

export interface CurrentAffairItem {
  id: string;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: string;
  publishedAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  prevId: string | null;
  nextId: string | null;
}

// ── Leaderboard ──────────────────────────────────────────────────────────

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  quizCount: number;
  mockCount: number;
  pyqCount: number;
}

// ── Daily Quiz ───────────────────────────────────────────────────────────

export interface DailyQuiz {
  id: string;
  title: string;
  description?: string | null;
  scheduledDate: string;
  scheduledTime: string;
  durationMinutes: number;
  totalQuestions: number;
  questionIds: string[];
  isPublished?: boolean | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ── PYQ Questions ────────────────────────────────────────────────────────

export interface PyqQuestion {
  id: string;
  text: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string | null;
}

export interface QuestionOption {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string | null;
}

export interface BatchQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
}

// ── Quiz Details ─────────────────────────────────────────────────────────

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
  questions: PyqQuestion[];
  createdAt: string;
}

// ── Streaks ──────────────────────────────────────────────────────────────

export interface MyStreak {
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  quizCount: number;
  mockCount: number;
  pyqCount: number;
  lastActivityDate: string | null;
}

export interface RecordActivityResponse {
  currentStreak: number;
  longestStreak: number;
  totalPoints: number;
  pointsEarned: number;
  streakIncremented: boolean;
}

// ── Exam / Exam Set ──────────────────────────────────────────────────────

export interface ExamListItem {
  id: string;
  title: string;
  description?: string | null;
  subject: string;
  durationMins: number;
  totalMarks: number;
  passingMarks: number;
  negativeMarking: number;
  instructions?: string | null;
  status: "draft" | "published" | "archived";
  category: string | null;
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExamDetailQuestion {
  id: string;
  examId: string;
  questionId: string;
  orderNum: number;
  marks: number;
  negativeMarks: number;
  question: {
    id: string;
    text: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    type: string;
    subject: string | null;
  } | null;
}

export interface ExamDetailResponse extends ExamListItem {
  questions: ExamDetailQuestion[];
}

export interface ExamSetItem {
  id: string;
  title: string;
  description: string | null;
  type: "pyq" | "ncert";
  subjectId: string | null;
  classNum: number | null;
  medium: string | null;
  questionIds: string[];
  totalQuestions: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  subject?: { id: string; name: string } | null;
}

// ── NCERT Books / PDFs ───────────────────────────────────────────────────

export interface NcertBookListItem {
  id: string;
  title: string;
  classNum: number;
  subject: string;
  medium: string;
  readUrl?: string | null;
  downloadUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NcertPdf {
  id: string;
  title: string;
  subject: string;
  classNumber: number;
  originalName: string;
  cloudinaryUrl: string;
  cloudinaryPublicId: string;
  fileSize: number;
  uploadedAt: string;
}

// ── PYQ Papers ───────────────────────────────────────────────────────────

export interface PreviousYearPaperListItem {
  id: string;
  examName: string;
  shiftName: string;
  year: number;
  subject: string | null;
  subjectId: string | null;
  questionPaperUrl: string | null;
  answerKeyUrl: string | null;
  answerKeyPdf: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Support ──────────────────────────────────────────────────────────────

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
  messages: SupportMessageItem[];
}

export interface SupportMessageItem {
  id: string;
  ticketId: string;
  message: string;
  sender: "user" | "support";
  createdAt: string;
}

// ── MCQ Questions ────────────────────────────────────────────────────────

export interface McqQuestion {
  id: string;
  text: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string | null;
}

export interface McqResponse {
  data: McqQuestion[];
  total: number;
  page: number;
  totalPages: number;
}

// ── NCERT Books Query Params ─────────────────────────────────────────────

export interface ListNcertBooksParams {
  classNum?: number;
  subject?: string;
  medium?: string;
}

// ── Daily Quiz (list item) ────────────────────────────────────────────────

export interface QuizListItem {
  id: string;
  title: string;
  subject: string;
  durationMins: number;
  questionCount: number;
  negativeMarking: number;
}

// ── Student Attempts ─────────────────────────────────────────────────────

export interface StudentAttempt {
  id: string;
  userId: string;
  examId: string | null;
  quizId: string | null;
  score: number;
  totalMarks: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  timeTakenSecs: number;
  isPassed: boolean;
  attemptedAt: string;
}

// ── Question Response (Admin) ────────────────────────────────────────────

export interface QuestionsResponse {
  data: import("@workspace/db").Question[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
