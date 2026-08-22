import type { ErrorRequestHandler } from "express";
import { logger } from "../lib/logger";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true,
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Map PostgreSQL error codes to appropriate HTTP responses
  const pgCode = (err as Record<string, unknown>).code as string | undefined;
  if (pgCode === "23505") {
    // unique_violation
    return res.status(409).json({ error: "Duplicate entry — this record already exists." });
  }
  if (pgCode === "23503") {
    // foreign_key_violation
    return res.status(409).json({ error: "Referenced record does not exist." });
  }
  if (pgCode === "23502") {
    // not_null_violation
    return res.status(400).json({ error: "A required field is missing." });
  }
  if (pgCode === "22P02") {
    // invalid_text_representation (e.g. bad UUID cast)
    return res.status(400).json({ error: "Invalid input format." });
  }

  logger.error(err);
  return res.status(500).json({ error: "Internal server error" });
};
