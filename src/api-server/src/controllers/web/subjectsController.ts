import type { Request, Response, NextFunction } from "express";
import { db } from "../../lib/db";
import { subjects } from "@workspace/db";

export async function listSubjects(_req: Request, res: Response, next: NextFunction) {
  try {
    const data = await db
      .select({
        id: subjects.id,
        name: subjects.name,
        slug: subjects.slug,
        examCategory: subjects.examCategory,
        description: subjects.description,
        isActive: subjects.isActive,
        createdAt: subjects.createdAt,
        updatedAt: subjects.updatedAt,
      })
      .from(subjects)
      .orderBy(subjects.name);

    return res.json(data);
  } catch (err) {
    return next(err);
  }
}
