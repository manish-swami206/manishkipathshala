import { pgTable, uuid, text, integer, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const quizzesTable = pgTable("quizzes", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  subject: text("subject").notNull(),
  durationMins: integer("duration_mins").notNull().default(10),
  questionCount: integer("question_count").notNull().default(0),
  negativeMarking: real("negative_marking").notNull().default(0.25),
  status: text("status").notNull().default("ongoing"),
  instructions: text("instructions").notNull().default(""),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertQuizSchema = createInsertSchema(quizzesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertQuiz = typeof quizzesTable.$inferInsert;
export type Quiz = typeof quizzesTable.$inferSelect;

