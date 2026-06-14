import {
  pgTable,
  uuid,
  text,
  integer,
  real,
  boolean,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { subjects } from "./subjects";

export const mockTestsTable = pgTable("mock_tests", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  durationMins: integer("duration_mins").notNull().default(60),
  questionCount: integer("question_count").notNull().default(100),
  maxMarks: integer("max_marks").notNull().default(100),
  negativeMarking: real("negative_marking").notNull().default(0.25),
  /* Drizzle does not support relations on array columns; resolve via inArray queries at the service layer */
  questionIds: uuid("question_ids").array().notNull().default([]),
  subjectId: uuid("subject_id").references(() => subjects.id, { onDelete: "set null" }),
  difficulty: text("difficulty").default("medium"),
  class: integer("class"),
  medium: text("medium"),
  isFeatured: boolean("is_featured").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("mock_tests_question_ids_idx").using("gin", t.questionIds),
]);

export const mockTestsRelations = relations(mockTestsTable, ({ one }) => ({
  subject: one(subjects, {
    fields: [mockTestsTable.subjectId],
    references: [subjects.id],
  }),
  // Note: questions relation via questionIds array is not supported by Drizzle ORM natively.
  // Use inArray() queries at the service layer to resolve question IDs.
}));

export const insertMockTestSchema = createInsertSchema(mockTestsTable).omit({
  id: true, createdAt: true, updatedAt: true,
});
export type InsertMockTest = typeof mockTestsTable.$inferInsert;
export type MockTest = typeof mockTestsTable.$inferSelect;
