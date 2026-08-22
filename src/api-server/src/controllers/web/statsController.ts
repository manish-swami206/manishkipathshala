import type { Request, Response, NextFunction } from "express";
import { db } from "../../db";
import {
  questionsTable,
  currentAffairsTable,
  studyNotesTable,
  mockTestsTable,
  subjects,
  userStreaksTable,
} from "@workspace/db";
import { sql } from "drizzle-orm";
import { cacheGet, cacheSet, CacheTTL } from "../../lib/cache";

export async function getStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const cacheKey = "public:stats";
    const cached = await cacheGet<unknown>(cacheKey);
    if (cached) { res.json(cached); return; }

    const [
      [usersRow],
      [activeRow],
      [subjectsRow],
      [questionsRow],
      [caRow],
      [notesRow],
      [mockRow],
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(userStreaksTable),
      db.select({ count: sql<number>`count(*)` }).from(userStreaksTable).where(sql`${userStreaksTable.totalPoints} > 0`),
      db.select({ count: sql<number>`count(*)` }).from(subjects),
      db.select({ count: sql<number>`count(*)` }).from(questionsTable),
      db.select({ count: sql<number>`count(*)` }).from(currentAffairsTable),
      db.select({ count: sql<number>`count(*)` }).from(studyNotesTable),
      db.select({ count: sql<number>`count(*)` }).from(mockTestsTable),
    ]);

    const result = {
      users: Number(usersRow.count),
      activeStudents: Number(activeRow.count),
      subjects: Number(subjectsRow.count),
      questions: Number(questionsRow.count),
      currentAffairsCount: Number(caRow.count),
      studyNotesCount: Number(notesRow.count),
      mockTestsCount: Number(mockRow.count),
    };

    await cacheSet(cacheKey, result, CacheTTL.ANALYTICS);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
