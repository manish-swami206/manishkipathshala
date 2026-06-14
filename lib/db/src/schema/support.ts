import { pgTable, uuid, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";

/**
 * Support tickets — each ticket is a conversation thread.
 * Users can have multiple tickets (conversations).
 * userDeletedAt allows users to soft-delete (admin still sees all).
 * isReadByUser / isReadByAdmin track unread replies.
 */
export const supportTicketsTable = pgTable("support_tickets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  status: text("status").notNull().default("open"),
  assignedTo: text("assigned_to"),
  /** Soft-delete for users — admin still sees chats */
  userDeletedAt: timestamp("user_deleted_at"),
  /** Track read status for reply notifications */
  isReadByUser: boolean("is_read_by_user").notNull().default(true),
  isReadByAdmin: boolean("is_read_by_admin").notNull().default(true),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const supportMessagesTable = pgTable("support_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  ticketId: uuid("ticket_id").references(() => supportTicketsTable.id, {
    onDelete: "cascade",
  }),
  message: text("message").notNull(),
  sender: text("sender").notNull().default("user"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const supportTicketsRelations = relations(
  supportTicketsTable,
  ({ many }) => ({
    messages: many(supportMessagesTable),
  }),
);

export const supportMessagesRelations = relations(
  supportMessagesTable,
  ({ one }) => ({
    ticket: one(supportTicketsTable, {
      fields: [supportMessagesTable.ticketId],
      references: [supportTicketsTable.id],
    }),
  }),
);

export const insertSupportTicketSchema = createInsertSchema(
  supportTicketsTable,
).omit({ id: true, createdAt: true, updatedAt: true, lastMessageAt: true });
export const insertSupportMessageSchema = createInsertSchema(
  supportMessagesTable,
).omit({ id: true, createdAt: true });

export type SupportTicket = typeof supportTicketsTable.$inferSelect;
export type SupportMessage = typeof supportMessagesTable.$inferSelect;
export type InsertSupportTicket = typeof supportTicketsTable.$inferInsert;
export type InsertSupportMessage = typeof supportMessagesTable.$inferInsert;
