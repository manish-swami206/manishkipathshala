import { pgTable, uuid, text, integer, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const userStreaksTable = pgTable("user_streaks", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().unique(),
  displayName: text("display_name").notNull().default("Learner"),
  currentStreak: integer("current_streak").notNull().default(0),
  longestStreak: integer("longest_streak").notNull().default(0),
  totalPoints: integer("total_points").notNull().default(0),
  quizCount: integer("quiz_count").notNull().default(0),
  mockCount: integer("mock_count").notNull().default(0),
  pyqCount: integer("pyq_count").notNull().default(0),
  lastActivityDate: text("last_activity_date"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => [
  index("user_streaks_total_points_idx").on(t.totalPoints),
  index("user_streaks_created_at_idx").on(t.createdAt),
]);

export const insertUserStreakSchema = createInsertSchema(userStreaksTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertUserStreak = typeof userStreaksTable.$inferInsert;
export type UserStreak = typeof userStreaksTable.$inferSelect;