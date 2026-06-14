// ── Contact / Social Information ─────────────────────────────────────────────
export const contact_gmail = "Manishkipathshalaofficial@gmail.com";
export const contact_number = "7023464080";
export const contact_address = "Sri Ganganagar , Rajsthan (India) - 335001";
export const telegram_link = "https://t.me/ManishKiPathshala";
export const youtube_link =
  "https://youtube.com/@manish_ki_pathshala?si=yNW1A78x2ZVkTo-p";
export const instagram_link = "https://www.instagram.com/manish_ki_pathshala";
export const x_link = "https://x.com/MK_Pathshala";
export const whatsapp_link =
  "https://www.whatsapp.com/channel/0029VadoH748kyyHC8jgpq1K";

// ── Static Form Data for Admin Panels ────────────────────────────────────────

/** Exam categories used in admin forms */
export const EXAM_CATEGORIES = [
  "UPSC",
  "SSC",
  "RAS",
  "RRB",
  "Banking",
  "State PCS",
  "Other",
] as const;

/** Exam types for PYP papers */
export const EXAM_TYPES = [
  "JEE Main",
  "JEE Advanced",
  "NEET",
  "CBSE Board",
  "ICSE Board",
  "State Board",
  "Other",
] as const;

/** Available class options */
export const CLASSES = [
  { value: 6, label: "Class 6" },
  { value: 7, label: "Class 7" },
  { value: 8, label: "Class 8" },
  { value: 9, label: "Class 9" },
  { value: 10, label: "Class 10" },
  { value: 11, label: "Class 11" },
  { value: 12, label: "Class 12" },
] as const;

/** Medium options for content */
export const MEDIUMS = ["English", "Hindi"] as const;

/** Difficulty levels */
export const DIFFICULTY_LEVELS = ["easy", "medium", "hard"] as const;

/** Question type options */
export const QUESTION_TYPES = ["single", "multiple", "true_false"] as const;

/** Exam set type discriminator */
export const EXAM_SET_TYPES = ["pyq", "ncert"] as const;

/** Status options for exams */
export const STATUS_OPTIONS = ["draft", "published", "archived"] as const;

/** Support ticket statuses */
export const SUPPORT_TICKET_STATUSES = [
  "open",
  "pending",
  "resolved",
  "closed",
] as const;

/** Support ticket categories */
export const SUPPORT_TICKET_CATEGORIES = [
  "technical",
  "billing",
  "syllabus",
  "general",
] as const;

/** Years for PYP forms (last 30 years) */
export const YEARS = Array.from(
  { length: 30 },
  (_, i) => new Date().getFullYear() - i,
);

/** Generate array of years from a start year to now */
export function getYearRange(from?: number): number[] {
  const start = from ?? 1995;
  const current = new Date().getFullYear();
  return Array.from({ length: current - start + 1 }, (_, i) => current - i);
}
