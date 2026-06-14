import { pgTable, uuid, text, integer, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { subjects } from "./subjects";

/**
 * Unified table for grouping questions into sets.
 * Used for both PYQ sets and NCERT MCQ sets.
 * type discriminator: 'pyq' | 'ncert'
 * For ncert type, classNum is required.
 *
 * Relations: References questions via {@link examSetsTable.questionIds} array.
 * Use {@link import("./question-relations").resolveQuestionIds} to resolve to Question records.
 */
export const examSetsTable = pgTable("exam_sets", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  type: text("type").notNull().default("pyq"),
  subjectId: uuid("subject_id").references(() => subjects.id, { onDelete: "set null" }),
  classNum: integer("class_num"),
  medium: text("medium"),
  /* Drizzle does not support relations on array columns; resolve via inArray queries at the service layer */
  questionIds: uuid("question_ids").array().notNull().default([]),
  totalQuestions: integer("total_questions").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("exam_sets_question_ids_idx").using("gin", t.questionIds),
]);

export const examSetsRelations = relations(examSetsTable, ({ one, many }) => ({
  subject: one(subjects, {
    fields: [examSetsTable.subjectId],
    references: [subjects.id],
  }),
  // Note: questions relation via questionIds array is not supported by Drizzle ORM natively.
  // Use inArray() queries at the service layer to resolve question IDs.
}));

export const insertExamSetSchema = createInsertSchema(examSetsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertExamSet = typeof examSetsTable.$inferInsert;
export type ExamSet = typeof examSetsTable.$inferSelect;
