import {
  pgTable, uuid, text, integer, real, boolean, timestamp, jsonb, index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";


export const studentAttemptsTable = pgTable("student_attempts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  examId: uuid("exam_id"),
  quizId: uuid("quiz_id"),
  score: real("score").notNull().default(0),
  totalMarks: real("total_marks").notNull().default(0),
  correctCount: integer("correct_count").notNull().default(0),
  wrongCount: integer("wrong_count").notNull().default(0),
  skippedCount: integer("skipped_count").notNull().default(0),
  timeTakenSecs: integer("time_taken_secs").notNull().default(0),
  isPassed: boolean("is_passed").notNull().default(false),
  attemptedAt: timestamp("attempted_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [index("attempts_user_idx").on(t.userId), index("attempts_exam_idx").on(t.examId)]);

export const activityLogsTable = pgTable("activity_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityId: text("entity_id"),
  details: jsonb("details"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => [index("activity_user_idx").on(t.userId), index("activity_action_idx").on(t.action)]);

export const insertActivityLogSchema = createInsertSchema(activityLogsTable).omit({ id: true, createdAt: true });

export type StudentAttempt = typeof studentAttemptsTable.$inferSelect;
export type ActivityLog = typeof activityLogsTable.$inferSelect;