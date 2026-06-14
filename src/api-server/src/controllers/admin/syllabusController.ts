import type { Request, Response, NextFunction } from "express";
import { db } from "../../lib/db";
import { syllabusTable } from "@workspace/db";
import { eq, and, sql, desc } from "drizzle-orm";
import { z } from "zod";
import { routeParam } from "../../lib/routeParams";
import { AppError } from "../../middleware/errorHandler";
import { uploadToCloudinary } from "../../config/cloudinary";

const syllabusSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional().nullable(),
  examCategory: z.string().default("UPSC").nullable(),
  readUrl: z.string().optional().nullable(),
  downloadUrl: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export async function listAllSyllabus(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, parseInt(limit, 10));
    const offset = (pageNum - 1) * limitNum;

    const [countRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(syllabusTable)
      .where(eq(syllabusTable.isActive, true));

    const data = await db
      .select()
      .from(syllabusTable)
      .where(eq(syllabusTable.isActive, true))
      .orderBy(desc(syllabusTable.createdAt))
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

export async function createSyllabus(req: Request, res: Response, next: NextFunction) {
  try {
    let body = req.body;

    // Handle file upload via multer
    if (req.file) {
      const result = await uploadToCloudinary(
        req.file.buffer,
        "syllabus",
        req.file.originalname,
      );
      body = {
        ...body,
        readUrl: result.secureUrl,
        downloadUrl: result.secureUrl,
      };
    }

    const parsed = syllabusSchema.safeParse(body);
    if (!parsed.success) {
      return next(new AppError(400, `Validation error: ${parsed.error.issues.map(i => i.message).join("; ")}`));
    }
    const [item] = await db
      .insert(syllabusTable)
      .values(parsed.data)
      .returning();
    res.status(201).json(item);
  } catch (err) {
    return next(err);
  }
}

export async function updateSyllabus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = routeParam(req.params.id);
    let body = req.body;

    // Handle file upload via multer
    if (req.file) {
      const result = await uploadToCloudinary(
        req.file.buffer,
        "syllabus",
        req.file.originalname,
      );
      body = {
        ...body,
        readUrl: result.secureUrl,
        downloadUrl: result.secureUrl,
      };
    }

    const parsed = syllabusSchema.partial().safeParse(body);
    if (!parsed.success) {
      return next(new AppError(400, `Validation error: ${parsed.error.issues.map(i => i.message).join("; ")}`));
    }
    const [updated] = await db
      .update(syllabusTable)
      .set(parsed.data)
      .where(eq(syllabusTable.id, id))
      .returning();
    if (!updated) {
      return next(new AppError(404, "Syllabus entry not found"));
    }
    res.json(updated);
  } catch (err) {
    return next(err);
  }
}

export async function deleteSyllabus(req: Request, res: Response, next: NextFunction) {
  try {
    const id = routeParam(req.params.id);
    await db.delete(syllabusTable).where(eq(syllabusTable.id, id));
    res.json({ success: true });
  } catch (err) {
    return next(err);
  }
}
