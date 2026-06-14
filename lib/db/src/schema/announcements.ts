import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const announcementsTable = pgTable("announcements", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  body: text("body"),
  type: text("type").notNull().default("info"),
  isActive: boolean("is_active").notNull().default(true),
  linkText: text("link_text"),
  linkUrl: text("link_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAnnouncementSchema = createInsertSchema(
  announcementsTable,
).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAnnouncement = typeof announcementsTable.$inferInsert;
export type Announcement = typeof announcementsTable.$inferSelect;
