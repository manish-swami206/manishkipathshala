"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageTransition } from "@/components/shared/PageTransition";
import { useRequireAuth } from "@/components/shared/RequireAuthModal";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { useSaveAttempt } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import GlobalMcqPlayer from "@/components/quiz/GlobalMcqPlayer";
import type {
  GlobalMcqQuestion,
  ResultData,
} from "@/components/quiz/GlobalMcqPlayer";

interface ExamSetDetail {
  id: string;
  title: string;
  description: string | null;
  type: string;
  questionIds: string[];
  totalQuestions: number;
  classNum: number | null;
  medium: string | null;
}

interface BatchQuestionsResponse {
  data: Array<{
    id: string;
    text: string;
    options: string[];
    correctIndex: number;
    explanation: string | null;
  }>;
}

// FIX: quiz-specific key so navigating between sets never shows stale results
function getResultStorageKey(id: string) {
  return `mcq-result-data:${id}`;
}

export default function NcertMcqPlayer() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { requireAuth } = useRequireAuth();
  const setId = params?.slug ?? "";
  const [authChecked, setAuthChecked] = useState(false);
  const saveAttempt = useSaveAttempt();

  // Auth guard on mount
  useEffect(() => {
    (async () => {
      const authed = await requireAuth(() => true);
      if (!authed) {
        router.replace("/ncert-mcq");
        return;
      }
      setAuthChecked(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch exam set details
  const { data: setData, isLoading: loadingSet } = useQuery<ExamSetDetail>({
    queryKey: ["exam-set", setId],
    queryFn: () => apiFetch<ExamSetDetail>(`/exam-sets/${setId}`),
    enabled: !!setId && authChecked,
  });

  // Batch fetch questions once we have questionIds
  const { data: batchData, isLoading: loadingQuestions } =
    useQuery<BatchQuestionsResponse>({
      queryKey: ["questions", "batch", setData?.questionIds],
      queryFn: () => {
        const ids = setData!.questionIds;
        if (!ids.length) return { data: [] };
        const qs = new URLSearchParams();
        ids.forEach((id) => qs.append("ids", id));
        return apiFetch<BatchQuestionsResponse>(
          `/questions/batch?${qs.toString()}`,
        );
      },
      enabled:
        !!setData && (setData.questionIds?.length ?? 0) > 0 && authChecked,
    });

  // Map to global player format — MUST be before any early returns (Rules of Hooks)
  const questions: GlobalMcqQuestion[] = useMemo(
    () =>
      (batchData?.data ?? []).map((q) => ({
        id: q.id,
        text: q.text,
        options: q.options as string[],
        correctIndex: q.correctIndex,
        explanation: q.explanation,
      })),
    [batchData],
  );

  const durationMins = Math.max(30, Math.ceil(questions.length * 1.5));

  // ── Early returns (after all hooks) ────────────────────────────────

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (loadingSet || loadingQuestions) {
    return (
      <PageTransition className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-[500px] w-full rounded-2xl" />
      </PageTransition>
    );
  }

  if (!setData || !batchData || !batchData.data.length) {
    return (
      <PageTransition className="p-4 md:p-8 max-w-4xl mx-auto">
        <div className="text-center py-16 text-muted-foreground">
          <p>No questions available for this set.</p>
        </div>
      </PageTransition>
    );
  }

  const handleShowResult = (result: ResultData) => {
    // FIX: use the set-specific storage key and pass setId in the URL
    try {
      sessionStorage.setItem(getResultStorageKey(setId), JSON.stringify(result));
    } catch (err) {
      console.error("Failed to cache result:", err);
    }
    router.push(
      `/result?id=${encodeURIComponent(setId)}&returnTo=${encodeURIComponent("/ncert-mcq")}`,
    );
  };

  return (
    <GlobalMcqPlayer
      mode="ncert"
      title={setData.title}
      sessionId={`ncert-${setId}`}
      durationMins={durationMins}
      questions={questions}
      onBackHref="/ncert-mcq"
      negativeMarking={0}
      onShowResult={handleShowResult}
      saveAttempt={async (payload) => {
        return saveAttempt.mutateAsync({
          quizId: setId,
          ...payload,
        });
      }}
    />
  );
}
