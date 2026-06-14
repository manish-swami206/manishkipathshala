import { pgTable, uuid, text, integer, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { subjects } from "./subjects";

/**
 * Unified questions table used across all question types (quiz, pyq, ncert, mock).
 * Each question has a `type` discriminator field.
 */
export const questionsTable = pgTable("questions", {
  id: uuid("id").defaultRandom().primaryKey(),
  subjectId: uuid("subject_id").references(() => subjects.id, { onDelete: "set null" }),
  classNum: integer("class_num"),
  subject: text("subject"),
  medium: text("medium"),
  text: text("text").notNull(),
  optionA: text("option_a").notNull(),
  optionB: text("option_b").notNull(),
  optionC: text("option_c").notNull(),
  optionD: text("option_d").notNull(),
  correctIndex: integer("correct_index").notNull(),
  explanation: text("explanation"),
  difficulty: text("difficulty").default("medium"),
  negativeMarking: real("negative_marks").default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const questionsRelations = relations(questionsTable, ({ one }) => ({
  subject: one(subjects, {
    fields: [questionsTable.subjectId],
    references: [subjects.id],
  }),
}));

export const insertQuestionSchema = createInsertSchema(questionsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertQuestion = typeof questionsTable.$inferInsert;
export type Question = typeof questionsTable.$inferSelect;
