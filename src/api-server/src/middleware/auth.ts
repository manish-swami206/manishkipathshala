import type { RequestHandler } from "express";
import { getAuth } from "@clerk/express";
import { AppError } from "./errorHandler";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      sessionId?: string;
    }
  }
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const auth = getAuth(req);
  if (!auth.userId) return next(new AppError(401, "Unauthorized"));

  req.userId = auth.userId;
  req.sessionId = auth.sessionId;
  return next();
};
