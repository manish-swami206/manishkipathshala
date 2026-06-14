import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { questionsTable } from "./questions";
import { examSetsTable } from "./exams";
import { mockTestsTable } from "./mockTests";
import { syllabusTable } from "./syllabus";
import { studyNotesTable } from "./studyNotes";
import { previousYearPapersTable } from "./pyp";

export const subjects = pgTable("subjects", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  examCategory: text("exam_category").default("General"),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const subjectsRelations = relations(subjects, ({ many }) => ({
  questions: many(questionsTable),
  examSets: many(examSetsTable),
  mockTests: many(mockTestsTable),
  syllabus: many(syllabusTable),
  studyNotes: many(studyNotesTable),
  previousYearPapers: many(previousYearPapersTable),
}));

export const insertSubjectSchema = createInsertSchema(subjects).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSubject = typeof subjects.$inferInsert;
export type Subject = typeof subjects.$inferSelect;
