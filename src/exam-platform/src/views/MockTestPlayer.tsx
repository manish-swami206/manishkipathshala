"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useRequireAuth } from "@/components/shared/RequireAuthModal";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import {
  useGetMockTest,
  getGetMockTestQueryKey,
  useSaveAttempt,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import GlobalMcqPlayer from "@/components/quiz/GlobalMcqPlayer";
import type {
  GlobalMcqQuestion,
  ResultData,
} from "@/components/quiz/GlobalMcqPlayer";

interface BatchQuestionsResponse {
  data: Array<{
    id: string;
    text: string;
    options: string[];
    correctIndex: number;
    explanation: string | null;
  }>;
}

// FIX: quiz-specific key so navigating between tests never shows stale results
function getResultStorageKey(id: string) {
  return `mcq-result-data:${id}`;
}

export default function MockTestPlayer() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const router = useRouter();
  const { requireAuth } = useRequireAuth();
  const [authChecked, setAuthChecked] = useState(false);
  const saveAttempt = useSaveAttempt();

  // Auth guard on mount
  useEffect(() => {
    (async () => {
      const authed = await requireAuth(() => true);
      if (!authed) {
        router.replace("/mock-tests");
        return;
      }
      setAuthChecked(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: mockTest, isLoading: loadingTest } = useGetMockTest(id, {
    query: {
      enabled: !!id && authChecked,
      queryKey: getGetMockTestQueryKey(id),
      staleTime: 0,
    },
  });

  // Batch fetch questions once we have questionIds
  const { data: batchData, isLoading: loadingQuestions } =
    useQuery<BatchQuestionsResponse>({
      queryKey: ["questions", "batch", mockTest?.questionIds],
      queryFn: () => {
        const ids = mockTest!.questionIds;
        if (!ids.length) return { data: [] };
        const qs = new URLSearchParams();
        ids.forEach((qId: string | number) => qs.append("ids", String(qId)));
        return apiFetch<BatchQuestionsResponse>(
          `/questions/batch?${qs.toString()}`,
        );
      },
      enabled:
        !!mockTest && (mockTest.questionIds?.length ?? 0) > 0 && authChecked,
      staleTime: 0,
    });

  // Map to global player format — MUST be before any early returns (Rules of Hooks)
  const questions: GlobalMcqQuestion[] = useMemo(
    () =>
      (batchData?.data ?? []).map((q) => ({
        id: q.id,
        text: q.text,
        options: q.options,
        correctIndex: q.correctIndex,
        explanation: q.explanation,
      })),
    [batchData],
  );

  // ── Early returns (after all hooks) ────────────────────────────────

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (loadingTest || loadingQuestions) {
    return (
      <div className="p-8">
        <Skeleton className="h-[600px] w-full max-w-4xl mx-auto rounded-3xl" />
      </div>
    );
  }

  if (!mockTest || !batchData || !batchData.data.length) {
    return (
      <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold mb-2">
            {!mockTest ? "Mock Test Not Found" : "No Questions Available"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {!mockTest
              ? "This mock test doesn't exist or has been removed."
              : "This mock test doesn't have any questions yet."}
          </p>
          <Button
            onClick={() => router.push("/mock-tests")}
            size="lg"
            className="rounded-xl"
          >
            Back to Mock Tests
          </Button>
        </div>
      </div>
    );
  }

  const handleShowResult = (result: ResultData) => {
    // FIX: use the exam-specific storage key and pass id in the URL
    try {
      sessionStorage.setItem(getResultStorageKey(id), JSON.stringify(result));
    } catch (err) {
      console.error("Failed to cache result:", err);
    }
    router.push(
      `/result?id=${encodeURIComponent(id)}&returnTo=${encodeURIComponent("/mock-tests")}`,
    );
  };

  return (
    <GlobalMcqPlayer
      mode="mock"
      title={mockTest.title}
      sessionId={`mock-test-${id}`}
      durationMins={mockTest.durationMins}
      questions={questions}
      onBackHref="/mock-tests"
      maxMarks={mockTest.maxMarks}
      negativeMarking={mockTest.negativeMarking}
      onShowResult={handleShowResult}
      saveAttempt={async (payload) => {
        return saveAttempt.mutateAsync({
          examId: id,
          ...payload,
        });
      }}
    />
  );
}
