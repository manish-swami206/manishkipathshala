"use client";

import React, { useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageTransition } from "@/components/shared/PageTransition";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { useSaveAttempt } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import GlobalMcqPlayer from "@/components/quiz/GlobalMcqPlayer";
import type {
  GlobalMcqQuestion,
  ResultData,
} from "@/components/quiz/GlobalMcqPlayer";

interface PyqQuestionsResponse {
  data: Array<{
    id: string;
    text: string;
    options: [string, string, string, string];
    correctIndex: number;
    explanation: string | null;
  }>;
  total: number;
  page: number;
  totalPages: number;
}

// FIX: subject-specific key so switching between PYQ subjects never shows stale results
function getResultStorageKey(id: string) {
  return `mcq-result-data:${id}`;
}

export default function PyqQuestions() {
  const params = useParams<{ slug: string }>();
  const subjectSlug = params?.slug ?? "";
  const router = useRouter();
  const saveAttempt = useSaveAttempt();

  const { data, isLoading } = useQuery<PyqQuestionsResponse>({
    queryKey: ["pyq-questions", subjectSlug],
    queryFn: () => {
      const qp = new URLSearchParams({ limit: "50" });
      if (subjectSlug) qp.set("setId", subjectSlug);
      return apiFetch<PyqQuestionsResponse>(`/pyq/questions?${qp.toString()}`);
    },
    enabled: !!subjectSlug,
  });

  // Map to global player format — MUST be before any early returns (Rules of Hooks)
  const questionsRaw = data?.data ?? [];
  const questions: GlobalMcqQuestion[] = useMemo(
    () =>
      questionsRaw.map((q) => ({
        id: q.id,
        text: q.text,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
      })),
    [questionsRaw],
  );

  const durationMins = Math.max(30, Math.ceil(questions.length * 1.5));

  // ── Early returns (after all hooks) ────────────────────────────────

  if (isLoading) {
    return (
      <PageTransition className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-[500px] w-full rounded-2xl" />
      </PageTransition>
    );
  }

  if (!questionsRaw.length) {
    return (
      <PageTransition className="p-4 md:p-8 max-w-4xl mx-auto">
        <div className="text-center py-16 text-muted-foreground">
          <p>No PYQ questions found for this subject.</p>
        </div>
      </PageTransition>
    );
  }

  const handleShowResult = (result: ResultData) => {
    // FIX: use subject-specific storage key and pass slug in the URL
    try {
      sessionStorage.setItem(
        getResultStorageKey(subjectSlug),
        JSON.stringify(result),
      );
    } catch (err) {
      console.error("Failed to cache result:", err);
    }
    router.push(
      `/result?id=${encodeURIComponent(subjectSlug)}&returnTo=${encodeURIComponent("/pyq")}`,
    );
  };

  return (
    <GlobalMcqPlayer
      mode="pyq"
      title="PYQ Practice"
      sessionId={`pyq-${subjectSlug}`}
      durationMins={durationMins}
      questions={questions}
      onBackHref="/pyq"
      negativeMarking={0}
      onShowResult={handleShowResult}
      saveAttempt={async (payload) => {
        return saveAttempt.mutateAsync({
          quizId: subjectSlug,
          ...payload,
        });
      }}
    />
  );
}
