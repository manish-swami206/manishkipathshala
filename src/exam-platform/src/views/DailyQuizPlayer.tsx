"use client";

import React, { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useGetQuiz, getGetQuizQueryKey, useSaveAttempt } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import GlobalMcqPlayer from "@/components/quiz/GlobalMcqPlayer";
import type {
  GlobalMcqQuestion,
  ResultData,
} from "@/components/quiz/GlobalMcqPlayer";

// FIX: include the quiz id in the storage key so switching between quizzes
// never shows stale result data from a previous attempt.
// The old bare "mcq-result-data" key was shared across all quizzes.
function getResultStorageKey(id: string) {
  return `mcq-result-data:${id}`;
}

export default function QuizPlayer() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const router = useRouter();

  const { data: quiz, isLoading } = useGetQuiz(id, {
    query: { enabled: !!id, queryKey: getGetQuizQueryKey(id) },
  });
  const saveAttempt = useSaveAttempt();

  // Map quiz questions to global player format.
  // Must be before any early returns (Rules of Hooks).
  const questions: GlobalMcqQuestion[] = useMemo(
    () =>
      (quiz?.questions ?? []).map((q) => ({
        id: q.id,
        text: q.text,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
      })),
    [quiz],
  );

  // ── Early returns (after all hooks) ────────────────────────────────

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-[600px] w-full max-w-4xl mx-auto rounded-3xl" />
      </div>
    );
  }

  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-2">Quiz Not Available</h2>
          <p className="text-muted-foreground mb-6">
            {!quiz
              ? "This quiz doesn't exist or has been removed."
              : "This quiz doesn't have any questions yet."}
          </p>
          <Button
            onClick={() => router.push("/daily-quiz")}
            size="lg"
            className="rounded-xl"
          >
            Back to Quizzes
          </Button>
        </div>
      </div>
    );
  }

  const handleShowResult = (result: ResultData) => {
    // FIX: quiz-specific key prevents stale results when navigating between quizzes
    try {
      sessionStorage.setItem(getResultStorageKey(id), JSON.stringify(result));
    } catch (err) {
      console.error("Failed to cache result:", err);
    }
    router.push(
      `/result?id=${encodeURIComponent(id)}&returnTo=${encodeURIComponent("/daily-quiz")}`,
    );
  };

  return (
    <GlobalMcqPlayer
      mode="daily"
      title={quiz.title}
      sessionId={`daily-quiz-${id}`}
      durationMins={quiz.durationMins}
      questions={questions}
      onBackHref="/daily-quiz"
      maxMarks={questions.length}
      negativeMarking={quiz.negativeMarking}
      onShowResult={handleShowResult}
      saveAttempt={async (payload) => {
        return saveAttempt.mutateAsync({
          quizId: id,
          ...payload,
        });
      }}
    />
  );
}
