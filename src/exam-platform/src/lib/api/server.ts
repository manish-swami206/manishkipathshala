import { auth } from "@clerk/nextjs/server";
import { apiFetch } from "./client";
import type { DailyQuiz } from "./index";

export async function getDailyQuizById(id: string | number) {
  const { getToken } = await auth();
  const token = (await getToken()) ?? undefined;
  return apiFetch<DailyQuiz>(`/admin/daily-quizzes/${String(id).trim()}`, {
    token,
  });
}
