import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const currentAffairsTable = pgTable("current_affairs", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  summary: text("summary").notNull(),
  content: text("content").notNull(),
  category: text("category").notNull().default("General"),
  publishedAt: timestamp("published_at").notNull().defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertCurrentAffairSchema = createInsertSchema(currentAffairsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCurrentAffair = typeof currentAffairsTable.$inferInsert;
export type CurrentAffair = typeof currentAffairsTable.$inferSelect;