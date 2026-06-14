import type { Request, Response, NextFunction } from "express";
import { db } from "../../lib/db";
import { supportTicketsTable, supportMessagesTable } from "@workspace/db";
import { eq, ilike, and, sql, desc } from "drizzle-orm";
import { z } from "zod";
import { routeParam } from "../../lib/routeParams";
import { sanitizeHtml } from "../../utils/sanitize";
import { formatZodIssues } from "../../utils/validation";
import { AppError } from "../../middleware/errorHandler";
import { clerkClient } from "@clerk/express";

const VALID_STATUSES = ["open", "pending", "resolved", "closed"] as const;
type TicketStatus = (typeof VALID_STATUSES)[number];

const ReplySchema = z.object({
  message: z.string().min(1, "Message is required").max(5000),
});

const StatusSchema = z.object({
  status: z.enum(VALID_STATUSES, {
    errorMap: () => ({
      message: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}`,
    }),
  }),
});

const AssignSchema = z.object({
  assignedTo: z.string().min(1).max(200).nullable(),
});

export async function listAllSupportTickets(req: Request, res: Response, next: NextFunction) {
  try {
    const _page = routeParam(req.query.page as string | string[]) || "1";
    const _limit = routeParam(req.query.limit as string | string[]) || "20";
    const _status = routeParam(req.query.status as string | string[]) || "all";
    const _search = routeParam(req.query.search as string | string[]) || "";

    const pageNum = Math.max(1, parseInt(_page, 10));
    const limitNum = Math.min(100, parseInt(_limit, 10));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    if (_status !== "all" && VALID_STATUSES.includes(_status as TicketStatus)) {
      conditions.push(eq(supportTicketsTable.status, _status));
    }
    if (_search)
      conditions.push(ilike(supportTicketsTable.title, `%${_search}%`));

    const where = conditions.length ? and(...conditions) : undefined;

    const [countRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(supportTicketsTable)
      .where(where);

    const tickets = await db
      .select({
        id: supportTicketsTable.id,
        userId: supportTicketsTable.userId,
        title: supportTicketsTable.title,
        status: supportTicketsTable.status,
        assignedTo: supportTicketsTable.assignedTo,
        isReadByUser: supportTicketsTable.isReadByUser,
        isReadByAdmin: supportTicketsTable.isReadByAdmin,
        userDeletedAt: supportTicketsTable.userDeletedAt,
        lastMessageAt: supportTicketsTable.lastMessageAt,
        createdAt: supportTicketsTable.createdAt,
        updatedAt: supportTicketsTable.updatedAt,
        messageCount: sql<number>`(
          SELECT count(*)::int FROM ${supportMessagesTable}
          WHERE ${supportMessagesTable.ticketId} = ${supportTicketsTable.id}
        )`,
      })
      .from(supportTicketsTable)
      .where(where)
      .orderBy(
        sql`CASE WHEN ${supportTicketsTable.isReadByAdmin} = false THEN 0 ELSE 1 END`,
        desc(
          sql`COALESCE(${supportTicketsTable.lastMessageAt}, ${supportTicketsTable.createdAt})`,
        ),
      )
      .limit(limitNum)
      .offset(offset);

    const enriched = await Promise.all(
      tickets.map(async (t) => {
        let userName = t.userId;
        try {
          const clerkUser = await clerkClient.users.getUser(t.userId);
          const name = `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim();
          if (name) userName = name;
        } catch {
          // Clerk user not found, fall back to userId
        }
        return {
          ...t,
          userName,
          createdAt: t.createdAt.toISOString(),
          updatedAt: t.updatedAt.toISOString(),
          lastMessageAt: t.lastMessageAt ? t.lastMessageAt.toISOString() : null,
          userDeletedAt: t.userDeletedAt ? t.userDeletedAt.toISOString() : null,
        };
      }),
    );

    res.json({
      data: enriched,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: Number(countRow?.count ?? 0),
        totalPages: Math.ceil(Number(countRow?.count ?? 0) / limitNum),
      },
    });
  } catch (err) {
    return next(err);
  }
}

export async function getSupportTicketsUnreadCount(_req: Request, res: Response, next: NextFunction) {
  try {
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(supportTicketsTable)
      .where(eq(supportTicketsTable.isReadByAdmin, false));

    res.json({ unreadCount: Number(result?.count ?? 0) });
  } catch (err) {
    return next(err);
  }
}

export async function getSupportTicketDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const id = routeParam(req.params.id);
    const [ticket] = await db
      .select()
      .from(supportTicketsTable)
      .where(eq(supportTicketsTable.id, id));

    if (!ticket) {
      return next(new AppError(404, "Ticket not found"));
    }

    const messages = await db
      .select()
      .from(supportMessagesTable)
      .where(eq(supportMessagesTable.ticketId, id))
      .orderBy(supportMessagesTable.createdAt);

    if (!ticket.isReadByAdmin) {
      await db
        .update(supportTicketsTable)
        .set({ isReadByAdmin: true })
        .where(eq(supportTicketsTable.id, id));
    }

    res.json({
      ticket: {
        ...ticket,
        isReadByAdmin: true,
        createdAt: ticket.createdAt.toISOString(),
        updatedAt: ticket.updatedAt.toISOString(),
        lastMessageAt: ticket.lastMessageAt
          ? ticket.lastMessageAt.toISOString()
          : null,
        userDeletedAt: ticket.userDeletedAt
          ? ticket.userDeletedAt.toISOString()
          : null,
      },
      messages: messages.map((m) => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
      })),
    });
  } catch (err) {
    return next(err);
  }
}

export async function replyToSupportTicket(req: Request, res: Response, next: NextFunction) {
  try {
    const id = routeParam(req.params.id);
    const parsed = ReplySchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new AppError(400, formatZodIssues(parsed.error.issues)));
    }

    const [ticket] = await db
      .select()
      .from(supportTicketsTable)
      .where(eq(supportTicketsTable.id, id));

    if (!ticket) {
      return next(new AppError(404, "Ticket not found"));
    }

    const now = new Date();
    const sanitizedReply = sanitizeHtml(parsed.data.message);
    const [reply] = await db
      .insert(supportMessagesTable)
      .values({
        ticketId: id,
        message: sanitizedReply,
        sender: "support",
      })
      .returning();

    await db
      .update(supportTicketsTable)
      .set({
        isReadByUser: false,
        isReadByAdmin: true,
        lastMessageAt: now,
        status: sql`CASE WHEN status IN ('closed', 'resolved') THEN 'pending' ELSE status END`,
        userDeletedAt: null,
        updatedAt: now,
      })
      .where(eq(supportTicketsTable.id, id));

    res.status(201).json({
      ...reply,
      createdAt: reply.createdAt.toISOString(),
    });
  } catch (err) {
    return next(err);
  }
}

export async function updateSupportTicketStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = routeParam(req.params.id);

    const parsed = StatusSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new AppError(400, formatZodIssues(parsed.error.issues)));
    }

    const [updated] = await db
      .update(supportTicketsTable)
      .set({ status: parsed.data.status, updatedAt: new Date() })
      .where(eq(supportTicketsTable.id, id))
      .returning();

    if (!updated) {
      return next(new AppError(404, "Ticket not found"));
    }

    res.json({
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      lastMessageAt: updated.lastMessageAt
        ? updated.lastMessageAt.toISOString()
        : null,
    });
  } catch (err) {
    return next(err);
  }
}

export async function assignSupportTicket(req: Request, res: Response, next: NextFunction) {
  try {
    const id = routeParam(req.params.id);

    const parsed = AssignSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new AppError(400, formatZodIssues(parsed.error.issues)));
    }

    const [updated] = await db
      .update(supportTicketsTable)
      .set({ assignedTo: parsed.data.assignedTo, updatedAt: new Date() })
      .where(eq(supportTicketsTable.id, id))
      .returning();

    if (!updated) {
      return next(new AppError(404, "Ticket not found"));
    }

    res.json({
      ...updated,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      lastMessageAt: updated.lastMessageAt
        ? updated.lastMessageAt.toISOString()
        : null,
    });
  } catch (err) {
    return next(err);
  }
}
