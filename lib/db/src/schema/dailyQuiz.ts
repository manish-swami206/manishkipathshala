// lib/db/src/schema/dailyQuiz.ts
import { pgTable, uuid, text, date, time, integer, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { createInsertSchema } from 'drizzle-zod';

export const dailyQuizzes = pgTable('daily_quizzes', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  scheduledDate: date('scheduled_date').notNull(),
  scheduledTime: time('scheduled_time').notNull(),
  durationMinutes: integer('duration_minutes').notNull().default(30),
  totalQuestions: integer('total_questions').notNull(),
  /* Drizzle does not support relations on array columns; resolve via inArray queries at the service layer */
  questionIds: uuid('question_ids').array().notNull(),
  isPublished: boolean('is_published').default(false),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => [
  index('daily_quizzes_question_ids_idx').using('gin', t.questionIds),
]);

export const insertDailyQuizSchema = createInsertSchema(dailyQuizzes).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertDailyQuiz = typeof dailyQuizzes.$inferInsert;
export type DailyQuizType = typeof dailyQuizzes.$inferSelect;