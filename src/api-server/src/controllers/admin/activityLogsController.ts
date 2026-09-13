import type { Request, Response, NextFunction } from "express";
import { db } from "../../db";
import { activityLogsTable, userStreaksTable } from "@workspace/db";
import { eq, ilike, and, sql, desc } from "drizzle-orm";

export async function listActivityLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
    const action = (req.query.action as string) || "";
    const offset = (page - 1) * limit;

    const conditions = [];
    if (action) conditions.push(ilike(activityLogsTable.action, `%${action}%`));
    const where = conditions.length ? and(...conditions) : undefined;

    const [countRowArr, logs] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(activityLogsTable)
        .where(where),
      db
        .select({
          id: activityLogsTable.id,
          userId: activityLogsTable.userId,
          action: activityLogsTable.action,
          entityType: activityLogsTable.entityType,
          entityId: activityLogsTable.entityId,
          ipAddress: activityLogsTable.ipAddress,
          createdAt: activityLogsTable.createdAt,
          displayName: userStreaksTable.displayName,
        })
        .from(activityLogsTable)
        .leftJoin(userStreaksTable, eq(activityLogsTable.userId, userStreaksTable.userId))
        .where(where)
        .orderBy(desc(activityLogsTable.createdAt))
        .limit(limit)
        .offset(offset),
    ]);

    const total = Number(countRowArr[0]?.count ?? 0);
    const totalPages = Math.ceil(total / limit);

    res.json({
      data: logs.map((l) => ({
        ...l,
        displayName: l.displayName ?? "Unknown User",
        createdAt: l.createdAt.toISOString(),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (err) {
    return next(err);
  }
}

export async function clearActivityLogs(_req: Request, res: Response, next: NextFunction) {
  try {
    await db.delete(activityLogsTable);
    res.json({ success: true });
  } catch (err) {
    return next(err);
  }
}
