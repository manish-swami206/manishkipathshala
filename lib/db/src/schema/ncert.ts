import { pgTable, uuid, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

export const ncertBooksTable = pgTable("ncert_books", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  classNum: integer("class_num").notNull(),
  subject: text("subject").notNull(),
  medium: text("medium").notNull().default("English"),
  readUrl: text("read_url"),
  downloadUrl: text("download_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertNcertBookSchema = createInsertSchema(ncertBooksTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertNcertBook = typeof ncertBooksTable.$inferInsert;
export type NcertBook = typeof ncertBooksTable.$inferSelect;