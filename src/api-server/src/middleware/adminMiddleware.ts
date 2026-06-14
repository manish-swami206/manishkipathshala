import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { AppError } from "./errorHandler";
import { routeParam } from "../lib/routeParams";
import { logger } from "../lib/logger";
import { db } from "../lib/db";
import { activityLogsTable } from "@workspace/db";

export function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const auth = getAuth(req);
  if (!auth.userId) return next(new AppError(401, "You Are Not Logged In"));

  const role = (auth.sessionClaims?.metadata as { role?: string } | undefined)
    ?.role;

  if (role !== "admin") return next(new AppError(403, "Forbidden"));

  next();
}

export function logAdminActivity(action: string, entityType?: string) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    const auth = getAuth(req);

    try {
      await db.insert(activityLogsTable).values({
        userId: auth.userId ?? "unknown",
        action,
        entityType: entityType ?? null,
        entityId: req.params.id ? routeParam(req.params.id) : null,
        details: req.body ? { body: req.body } : null,
        ipAddress: req.ip ?? null,
      });
    } catch (err) {
      logger.error(err, "Failed to log admin activity");
    }

    next();
  };
}
