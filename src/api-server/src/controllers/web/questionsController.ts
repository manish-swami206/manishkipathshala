import type { Request, Response, NextFunction } from "express";
import { db } from "../../db";
import { questionsTable } from "@workspace/db";
import { eq, inArray, and } from "drizzle-orm";
import { cacheGet, cacheSet, CacheTTL } from "../../lib/cache";

function mapQuestion(q: {
  id: string;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctIndex: number;
  explanation: string | null;
}) {
  return {
    id: q.id,
    text: q.text,
    options: [q.optionA, q.optionB, q.optionC, q.optionD],
    correctIndex: q.correctIndex,
    explanation: q.explanation,
  };
}

export async function getQuestionsBatch(req: Request, res: Response, next: NextFunction) {
  try {
    const ids = req.query.ids;
    if (!ids) {
      return res.status(400).json({ error: "ids query parameter is required" });
    }

    const idList = Array.isArray(ids) ? ids.map(String) : [String(ids)];
    if (idList.length === 0 || idList.length > 200) {
      return res.status(400).json({ error: "Provide between 1 and 200 question IDs" });
    }

    const cacheKey = `questions:batch:${idList.sort().join(",")}`;
    const cached = cacheGet<unknown[]>(cacheKey);
    if (cached) { res.json({ data: cached }); return; }

    const questions = await db
      .select()
      .from(questionsTable)
      .where(and(inArray(questionsTable.id, idList), eq(questionsTable.isActive, true)));

    const result = questions.map(mapQuestion);
    cacheSet(cacheKey, result, CacheTTL.SHORT);
    res.json({ data: result });
  } catch (err) {
    return next(err);
  }
}
