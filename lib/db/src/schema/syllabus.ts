// lib/db/src/schema/syllabus.ts
import { pgTable, uuid, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { subjects } from "./subjects";

export const syllabusTable = pgTable("syllabus", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  subjectId: uuid("subject_id"),
  description: text("description"),
  examCategory: text("exam_category"),
  readUrl: text("read_url"),
  downloadUrl: text("download_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const syllabusRelations = relations(syllabusTable, ({ one }) => ({
  subject: one(subjects, {
    fields: [syllabusTable.subjectId],
    references: [subjects.id],
  }),
}));

export const insertSyllabusSchema = createInsertSchema(syllabusTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSyllabus = typeof syllabusTable.$inferInsert;
export type Syllabus = typeof syllabusTable.$inferSelect;
