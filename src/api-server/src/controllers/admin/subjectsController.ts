import type { Request, Response, NextFunction } from "express";
import { db } from "../../lib/db";
import { subjects, questionsTable, examSetsTable, mockTestsTable, studyNotesTable, previousYearPapersTable, syllabusTable } from "@workspace/db";
import { eq, ilike, and, sql, desc } from "drizzle-orm";
import { z } from "zod";
import { routeParam } from "../../lib/routeParams";
import { cacheDel } from "../../lib/cache";
import { AppError } from "../../middleware/errorHandler";
import { slugify } from "../../utils/slugify";

const subjectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  examCategory: z.string().default("UPSC"),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export async function listAllSubjects(req: Request, res: Response, next: NextFunction) {
  try {
    const { search } = req.query as Record<string, string>;
    const conditions = [];
    if (search) conditions.push(ilike(subjects.name, `%${search}%`));
    const where = conditions.length ? and(...conditions) : undefined;

    const data = await db
      .select()
      .from(subjects)
      .where(where)
      .orderBy(desc(subjects.createdAt));
    return res.json(data);
  } catch (err) {
    return next(err);
  }
}

export async function createSubject(req: Request, res: Response, next: NextFunction) {
  try {
    const parsed = subjectSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(new AppError(400, `Validation error: ${parsed.error.issues.map(i => i.message).join("; ")}`));
    }
    const { name, examCategory, description, isActive } = parsed.data;

    // Check for duplicate slug
    const slug = slugify(name, "subject");
    const [existing] = await db
      .select({ id: subjects.id })
      .from(subjects)
      .where(eq(subjects.slug, slug));
    if (existing) {
      return next(new AppError(409, "A subject with this name already exists"));
    }

    const [subject] = await db
      .insert(subjects)
      .values({ name, slug, examCategory, description, isActive })
      .returning();
    return res.status(201).json(subject);
  } catch (err) {
    return next(err);
  }
}

export async function updateSubject(req: Request, res: Response, next: NextFunction) {
  try {
    const id = routeParam(req.params.id);
    const parsed = subjectSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      return next(new AppError(400, `Validation error: ${parsed.error.issues.map(i => i.message).join("; ")}`));
    }
    const updateData: Record<string, unknown> = { ...parsed.data };
    if (updateData.name) {
      updateData.slug = slugify(updateData.name as string, "subject");
    }
    const [updated] = await db
      .update(subjects)
      .set(updateData)
      .where(eq(subjects.id, id))
      .returning();
    if (!updated) {
      return next(new AppError(404, "Subject not found"));
    }
    return res.json(updated);
  } catch (err) {
    return next(err);
  }
}

interface SubjectReferenceCounts {
  questions: number;
  examSets: number;
  mockTests: number;
  studyNotes: number;
  previousYearPapers: number;
  syllabus: number;
  total: number;
}

async function getSubjectReferenceCounts(subjectId: string): Promise<SubjectReferenceCounts> {
  const tables: { label: keyof SubjectReferenceCounts; table: any; column: any }[] = [
    { label: "questions", table: questionsTable, column: (questionsTable as any).subjectId },
    { label: "examSets", table: examSetsTable, column: (examSetsTable as any).subjectId },
    { label: "mockTests", table: mockTestsTable, column: (mockTestsTable as any).subjectId },
    { label: "studyNotes", table: studyNotesTable, column: (studyNotesTable as any).subjectId },
    { label: "previousYearPapers", table: previousYearPapersTable, column: (previousYearPapersTable as any).subjectId },
    { label: "syllabus", table: syllabusTable, column: (syllabusTable as any).subjectId },
  ];

  const results = await Promise.all(
    tables.map(async ({ label, table, column }) => {
      const [row] = await db
        .select({ count: sql<number>`count(*)` })
        .from(table)
        .where(eq(column, subjectId));
      return { label, count: Number(row?.count ?? 0) };
    }),
  );

  const counts: Record<string, number> = {};
  let total = 0;
  for (const { label, count } of results) {
    counts[label] = count;
    total += count;
  }

  return {
    questions: counts.questions ?? 0,
    examSets: counts.examSets ?? 0,
    mockTests: counts.mockTests ?? 0,
    studyNotes: counts.studyNotes ?? 0,
    previousYearPapers: counts.previousYearPapers ?? 0,
    syllabus: counts.syllabus ?? 0,
    total,
  };
}

async function cleanupSubjectReferences(subjectId: string) {
  // syllabus.subjectId has no FK constraint, so clean it manually
  try {
    await db
      .update(syllabusTable)
      .set({ subjectId: null })
      .where(eq(syllabusTable.subjectId, subjectId));
  } catch { /* non-critical cleanup */ }
}

export async function deleteSubject(req: Request, res: Response, next: NextFunction) {
  try {
    const id = routeParam(req.params.id);

    // Pre-delete check: count references and warn if any exist
    const references = await getSubjectReferenceCounts(id);
    const confirmed = req.query.confirm === "true" || req.body?.confirm === true;

    if (references.total > 0 && !confirmed) {
      return res.status(409).json({
        warning: true,
        message: `This subject is referenced by ${references.total} record(s). Set ?confirm=true to delete anyway (FK references will be set to null).`,
        references,
      });
    }

    await db.delete(subjects).where(eq(subjects.id, id));
    await cleanupSubjectReferences(id);
    cacheDel("admin:dashboard:stats");
    cacheDel("admin:analytics:overview");
    return res.json({ success: true });
  } catch (err) {
    return next(err);
  }
}
