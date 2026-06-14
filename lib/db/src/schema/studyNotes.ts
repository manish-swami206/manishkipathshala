import { pgTable, uuid, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { subjects } from "./subjects";

export const studyNotesTable = pgTable("study_notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  /** Free-text subject name (kept for display/backward compat) */
  subject: text("subject").notNull(),
  subjectId: uuid("subject_id").references(() => subjects.id, { onDelete: "set null" }),
  medium: text("medium").notNull().default("English"),
  url: text("url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const studyNotesRelations = relations(studyNotesTable, ({ one }) => ({
  subject: one(subjects, {
    fields: [studyNotesTable.subjectId],
    references: [subjects.id],
  }),
}));

export const insertStudyNoteSchema = createInsertSchema(studyNotesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertStudyNote = typeof studyNotesTable.$inferInsert;
export type StudyNote = typeof studyNotesTable.$inferSelect;