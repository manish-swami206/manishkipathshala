import type { Request, Response, NextFunction } from "express";
import { db } from "../../lib/db";
import { previousYearPapersTable } from "@workspace/db";
import { eq, and, ilike, sql, desc } from "drizzle-orm";
import { z } from "zod";
import { routeParam } from "../../lib/routeParams";
import { AppError } from "../../middleware/errorHandler";
import { uploadToCloudinary } from "../../config/cloudinary";

const pypSchema = z.object({
  examName: z.string().min(1, "Exam name is required"),
  shiftName: z.string().min(1, "Shift name is required"),
  year: z.coerce.number().int().min(1900).max(2100),
  subject: z.string().optional().nullable(),
  subjectId: z.string().optional().nullable(),
  questionPaperUrl: z.string().optional().nullable(),
  answerKeyUrl: z.string().optional().nullable(),
  answerKeyPdf: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

/**
 * If the request has uploaded files, upload them to Cloudinary and return
 * the resulting URLs to merge into the data payload.
 */
async function handleFileUploads(req: Request, data: Record<string, unknown>): Promise<Record<string, unknown>> {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
  if (!files) return data;

  const updated = { ...data };

  if (files.paperFile?.[0]) {
    const result = await uploadToCloudinary(files.paperFile[0].buffer, "pyp", files.paperFile[0].originalname);
    updated.questionPaperUrl = result.secureUrl;
  }
  if (files.answerKeyFile?.[0]) {
    const result = await uploadToCloudinary(files.answerKeyFile[0].buffer, "pyp", files.answerKeyFile[0].originalname);
    updated.answerKeyPdf = result.secureUrl;
  }

  return updated;
}

export async function listAllPyp(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = "1", limit = "20", search } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, parseInt(limit, 10));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    if (search) conditions.push(ilike(previousYearPapersTable.examName, `%${search}%`));

    const where = conditions.length ? and(...conditions) : undefined;

    const [countRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(previousYearPapersTable)
      .where(where);

    const data = await db
      .select()
      .from(previousYearPapersTable)
      .where(where)
      .orderBy(desc(previousYearPapersTable.year))
      .limit(limitNum)
      .offset(offset);

    res.json({
      data,
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

export async function getPypById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = routeParam(req.params.id);
    const [paper] = await db
      .select()
      .from(previousYearPapersTable)
      .where(eq(previousYearPapersTable.id, id));
    if (!paper) {
      return next(new AppError(404, "Paper not found"));
    }
    res.json(paper);
  } catch (err) {
    return next(err);
  }
}

export async function createPyp(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await handleFileUploads(req, { ...req.body });
    const parsed = pypSchema.safeParse(data);
    if (!parsed.success) {
      return next(new AppError(400, `Validation error: ${parsed.error.issues.map(i => i.message).join("; ")}`));
    }
    const [paper] = await db
      .insert(previousYearPapersTable)
      .values(parsed.data)
      .returning();
    res.status(201).json(paper);
  } catch (err) {
    return next(err);
  }
}

export async function updatePyp(req: Request, res: Response, next: NextFunction) {
  try {
    const id = routeParam(req.params.id);
    const data = await handleFileUploads(req, { ...req.body });
    const parsed = pypSchema.partial().safeParse(data);
    if (!parsed.success) {
      return next(new AppError(400, `Validation error: ${parsed.error.issues.map(i => i.message).join("; ")}`));
    }
    const [updated] = await db
      .update(previousYearPapersTable)
      .set(parsed.data)
      .where(eq(previousYearPapersTable.id, id))
      .returning();
    if (!updated) {
      return next(new AppError(404, "Paper not found"));
    }
    res.json(updated);
  } catch (err) {
    return next(err);
  }
}

export async function deletePyp(req: Request, res: Response, next: NextFunction) {
  try {
    const id = routeParam(req.params.id);
    await db.delete(previousYearPapersTable).where(eq(previousYearPapersTable.id, id));
    res.json({ success: true });
  } catch (err) {
    return next(err);
  }
}
