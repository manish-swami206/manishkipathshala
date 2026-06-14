import type { Request, Response, NextFunction } from "express";
import { db } from "../../lib/db";
import { studyNotesTable } from "@workspace/db";
import { eq, ilike, and, sql, desc } from "drizzle-orm";
import { z } from "zod";
import { routeParam } from "../../lib/routeParams";
import { cacheFlushPattern } from "../../lib/cache";
import { AppError } from "../../middleware/errorHandler";
import { uploadToCloudinary } from "../../config/cloudinary";

const studyNoteSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subject: z.string().min(1),
  medium: z.string().optional(),
  description: z.string().optional().nullable(),
  url: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export async function listAllStudyNotes(req: Request, res: Response, next: NextFunction) {
  try {
    const {
      page = "1",
      limit = "20",
      search,
      subject,
      medium,
    } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, parseInt(limit, 10));
    const offset = (pageNum - 1) * limitNum;

    const conditions = [];
    if (search) conditions.push(ilike(studyNotesTable.title, `%${search}%`));
    if (subject) conditions.push(eq(studyNotesTable.subject, subject));
    if (medium) conditions.push(eq(studyNotesTable.medium, medium));

    const where = conditions.length ? and(...conditions) : undefined;

    const [countRow] = await db
      .select({ count: sql<number>`count(*)` })
      .from(studyNotesTable)
      .where(where);

    const data = await db
      .select()
      .from(studyNotesTable)
      .where(where)
      .orderBy(desc(studyNotesTable.createdAt))
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

export async function getStudyNoteById(req: Request, res: Response, next: NextFunction) {
  try {
    const id = routeParam(req.params.id);
    const [note] = await db
      .select()
      .from(studyNotesTable)
      .where(eq(studyNotesTable.id, id));
    if (!note) {
      return next(new AppError(404, "Study note not found"));
    }
    res.json(note);
  } catch (err) {
    return next(err);
  }
}

export async function createStudyNote(req: Request, res: Response, next: NextFunction) {
  try {
    let body = { ...req.body };

    // If a file was uploaded via multer, upload to Cloudinary and set url
    if (req.file) {
      const result = await uploadToCloudinary(
        req.file.buffer,
        "study-notes",
        req.file.originalname,
      );
      body = {
        ...body,
        url: result.secureUrl,
      };
    }

    const parsed = studyNoteSchema.safeParse(body);
    if (!parsed.success) {
      return next(new AppError(400, `Validation error: ${parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ")}`));
    }
    const [note] = await db
      .insert(studyNotesTable)
      .values(parsed.data)
      .returning();
    cacheFlushPattern("study-notes:");
    res.status(201).json(note);
  } catch (err) {
    return next(err);
  }
}

export async function updateStudyNote(req: Request, res: Response, next: NextFunction) {
  try {
    const id = routeParam(req.params.id);

    let body = { ...req.body };

    // If a file was uploaded, upload to Cloudinary and set url
    if (req.file) {
      const result = await uploadToCloudinary(
        req.file.buffer,
        "study-notes",
        req.file.originalname,
      );
      body = {
        ...body,
        url: result.secureUrl,
      };
    }

    const parsed = studyNoteSchema.partial().safeParse(body);
    if (!parsed.success) {
      return next(new AppError(400, `Validation error: ${parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ")}`));
    }
    const [updated] = await db
      .update(studyNotesTable)
      .set(parsed.data)
      .where(eq(studyNotesTable.id, id))
      .returning();
    if (!updated) {
      return next(new AppError(404, "Study note not found"));
    }
    cacheFlushPattern("study-notes:");
    res.json(updated);
  } catch (err) {
    return next(err);
  }
}

export async function deleteStudyNote(req: Request, res: Response, next: NextFunction) {
  try {
    const id = routeParam(req.params.id);
    await db.delete(studyNotesTable).where(eq(studyNotesTable.id, id));
    cacheFlushPattern("study-notes:");
    res.json({ success: true });
  } catch (err) {
    return next(err);
  }
}
