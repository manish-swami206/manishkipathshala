import type { Request, Response, NextFunction } from "express";
import { db } from "../../lib/db";
import { ncertBooksTable } from "@workspace/db";
import { eq, ilike, and, sql, desc } from "drizzle-orm";
import { z } from "zod";
import { routeParam } from "../../lib/routeParams";
import { AppError } from "../../middleware/errorHandler";
import { uploadToCloudinary } from "../../config/cloudinary";

const ncertBookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  classNum: z.coerce.number().int().min(1).max(12),
  subject: z.string().min(1),
  medium: z.string().min(1),
  readUrl: z.string().optional().nullable(),
  downloadUrl: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

/**
 * If the request has an uploaded file, upload to Cloudinary and set downloadUrl.
 */
async function handleFileUpload(req: Request, data: Record<string, unknown>): Promise<Record<string, unknown>> {
  if (req.file) {
    const result = await uploadToCloudinary(req.file.buffer, "ncert", req.file.originalname);
    return { ...data, downloadUrl: result.secureUrl, readUrl: result.secureUrl };
  }
  return data;
}

export async function listAllNcertBooks(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      page = "1",
      limit = "20",
      search,
      classNum,
      subject,
      medium,
    } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, parseInt(limit, 10));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    if (search) conditions.push(ilike(ncertBooksTable.title, `%${search}%`));
    if (classNum) conditions.push(eq(ncertBooksTable.classNum, parseInt(classNum, 10)));
    if (subject) conditions.push(eq(ncertBooksTable.subject, subject));
    if (medium) conditions.push(eq(ncertBooksTable.medium, medium));

    const where = conditions.length ? and(...conditions) : undefined;

    const [countRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(ncertBooksTable)
      .where(where);

    const data = await db
      .select()
      .from(ncertBooksTable)
      .where(where)
      .orderBy(desc(ncertBooksTable.createdAt))
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

export async function getNcertBookById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = routeParam(req.params.id);
    const [book] = await db
      .select()
      .from(ncertBooksTable)
      .where(eq(ncertBooksTable.id, id));
    if (!book) {
      return next(new AppError(404, "NCERT book not found"));
    }
    res.json(book);
  } catch (err) {
    return next(err);
  }
}

export async function createNcertBook(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await handleFileUpload(req, { ...req.body });
    const parsed = ncertBookSchema.safeParse(data);
    if (!parsed.success) {
      return next(new AppError(400, `Validation error: ${parsed.error.issues.map(i => i.message).join("; ")}`));
    }
    const [book] = await db
      .insert(ncertBooksTable)
      .values(parsed.data)
      .returning();
    res.status(201).json(book);
  } catch (err) {
    return next(err);
  }
}

export async function updateNcertBook(req: Request, res: Response, next: NextFunction) {
  try {
    const id = routeParam(req.params.id);
    const data = await handleFileUpload(req, { ...req.body });
    const parsed = ncertBookSchema.partial().safeParse(data);
    if (!parsed.success) {
      return next(new AppError(400, `Validation error: ${parsed.error.issues.map(i => i.message).join("; ")}`));
    }
    const [updated] = await db
      .update(ncertBooksTable)
      .set(parsed.data)
      .where(eq(ncertBooksTable.id, id))
      .returning();
    if (!updated) {
      return next(new AppError(404, "NCERT book not found"));
    }
    res.json(updated);
  } catch (err) {
    return next(err);
  }
}

export async function deleteNcertBook(req: Request, res: Response, next: NextFunction) {
  try {
    const id = routeParam(req.params.id);
    await db.delete(ncertBooksTable).where(eq(ncertBooksTable.id, id));
    res.json({ success: true });
  } catch (err) {
    return next(err);
  }
}
