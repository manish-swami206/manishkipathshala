"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { PageTransition } from "@/components/shared/PageTransition";
import { useRequireAuth } from "@/components/shared/RequireAuthModal";
import { useGetQuiz, getGetQuizQueryKey } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Share2, Timer } from "lucide-react";

/* ─────────────────────────────────────────
   Stat Box — TIME LIMIT / QUESTIONS / MARKING
───────────────────────────────────────── */
function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-4 px-3 border border-border/60 rounded-xl bg-background text-center">
      <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground mb-1">
        {label}
      </p>
      <p className="text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

/* ─────────────────────────────────────────
   Important Rules box — warm yellow
───────────────────────────────────────── */
function RulesBox({
  instructions,
  durationMins,
}: {
  instructions?: string | null;
  durationMins: number;
}) {
  const rules = [
    `Ensure you have ${durationMins} minutes of uninterrupted time.`,
    "Do not refresh the page during the quiz.",
    "Quiz will auto-submit when the timer hits zero.",
  ];

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-amber-500">
          {/* Shield icon */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </span>
        <span className="text-sm font-bold text-amber-800">
          Important Rules:
        </span>
      </div>

      {/* Numbered rules */}
      <ol className="space-y-2">
        {rules.map((rule, i) => (
          <li key={i} className="flex items-start gap-3">
            <span
              className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold text-white"
              style={{ background: "#F59E0B" }}
            >
              {i + 1}
            </span>
            <span className="text-sm font-semibold text-amber-900 leading-snug">
              {rule}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

/* ─────────────────────────────────────────
   Main Page
───────────────────────────────────────── */
export default function QuizInstructions() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const router = useRouter();
  const { requireAuth } = useRequireAuth();
  const {
    data: quiz,
    isLoading,
    isError,
  } = useGetQuiz(id, {
    query: { enabled: !!id, queryKey: getGetQuizQueryKey(id) },
  });

  /* ── Loading ── */
  if (isLoading) {
    return (
      <PageTransition className="p-4 md:p-8 max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-7 w-44" />
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-[460px] w-full rounded-2xl" />
      </PageTransition>
    );
  }

  /* ── Error ── */
  if (isError || !quiz) {
    return (
      <PageTransition className="p-4 md:p-8 max-w-2xl mx-auto text-center">
        <div className="py-12">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Quiz Not Found</h2>
          <p className="text-muted-foreground mt-2 mb-6">
            The quiz you&apos;re looking for doesn&apos;t exist or has been
            removed.
          </p>
          <Button onClick={() => router.push("/daily-quiz")}>
            Back to Quizzes
          </Button>
        </div>
      </PageTransition>
    );
  }

  const markingLabel = `Based On Answers `;

  const handleShare = () => {
    navigator.share?.({ title: quiz.title, url: window.location.href });
  };

  /* ── Render ── */
  return (
    <PageTransition className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen">
      {/* Page heading */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-foreground">
          Daily Free Quiz
        </h1>
        <p className="text-sm text-muted-foreground">
          Test your knowledge with daily quizzes
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-border/40 mb-8" />

      {/* Center content */}
      <div className="flex flex-col items-center gap-6">
        {/* Timer icon box */}
        <div
          className="size-18 rounded-2xl flex items-center justify-center"
          style={{ background: "#EDE9FE" }}
        >
          <Timer className="w-10 h-10 text-violet-600" strokeWidth={1.8} />
        </div>

        {/* Quiz title */}
        <h2 className="text-lg md:text-3xl font-extrabold tracking-wide text-foreground text-center uppercase">
          {quiz.title}
        </h2>

        {/* Stat row */}
        <div className="w-full flex gap-0 border border-border/60 rounded-xl overflow-hidden">
          <StatBox label="Time Limit" value={`${quiz.durationMins} Mins`} />
          <div className="w-px bg-border/60" />
          <StatBox label="Questions" value={quiz.questionCount.toString()} />
          <div className="w-px bg-border/60" />
          <StatBox label="Marking" value={markingLabel} />
        </div>

        {/* Rules */}
        <div className="w-full">
          <RulesBox
            instructions={quiz.instructions}
            durationMins={quiz.durationMins}
          />
        </div>

        {/* Actions */}
        <div className="w-full flex flex-wrap items-center gap-3 mt-2">
          {/* Cancel */}
          <Link href="/daily-quiz" className="flex-1">
            <Button
              variant="outline"
              size="lg"
              className="w-full h-9 md:h-12 rounded-xl text-sm font-semibold tracking-widest uppercase border-border"
            >
              Cancel
            </Button>
          </Link>

          {/* Share */}
          <Button
            variant="outline"
            size="icon"
            className="h-9 md:h-12 w-14 rounded-xl border-border flex-shrink-0"
            onClick={handleShare}
            aria-label="Share quiz"
          >
            <Share2 className="w-5 h-5" />
          </Button>

          {/* Start */}
          <Button
            size="lg"
            className="flex-2 h-9 md:h-12 rounded-xl text-sm font-bold tracking-widest uppercase"
            style={{ background: "#4F46E5", color: "#fff" }}
            onClick={async () => {
              await requireAuth(() => {
                router.push(`/daily-quiz/${id}/play`);
              });
            }}
          >
            Start Test Now
          </Button>
        </div>
      </div>
    </PageTransition>
  );
}
