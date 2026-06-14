"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Trophy,
  Target,
  AlertCircle,
  BarChart3,
  Sparkles,
  ArrowLeft,
  MinusCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { PageTransition } from "@/components/shared/PageTransition";
import type { ResultData } from "@/components/quiz/GlobalMcqPlayer";

// FIX: must match the key used in QuizPlayer / MockTestPlayer / NcertMcqPlayer
function getResultStorageKey(id: string) {
  return `mcq-result-data:${id}`;
}

function getReturnLabel(returnTo: string) {
  if (returnTo.startsWith("/daily-quiz")) return "Daily Quizzes";
  if (returnTo.startsWith("/mock-tests")) return "Mock Tests";
  if (returnTo.startsWith("/ncert-mcq")) return "NCERT MCQs";
  if (returnTo.startsWith("/pyq")) return "PYQ Practice";
  return "Home";
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

type TierConfig = {
  label: string;
  color: string;
  iconBg: string;
  accentClass: string;
  badgeClass: string;
  icon: React.ElementType;
};

function getTier(percentage: number): TierConfig {
  if (percentage >= 90)
    return {
      label: "Outstanding!",
      color: "text-emerald-600 dark:text-emerald-400",
      iconBg: "bg-emerald-500/10",
      accentClass: "bg-emerald-500",
      badgeClass:
        "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
      icon: Sparkles,
    };
  if (percentage >= 70)
    return {
      label: "Great Job!",
      color: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-500/10",
      accentClass: "bg-blue-500",
      badgeClass:
        "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
      icon: Trophy,
    };
  if (percentage >= 50)
    return {
      label: "Good Effort",
      color: "text-amber-600 dark:text-amber-400",
      iconBg: "bg-amber-500/10",
      accentClass: "bg-amber-500",
      badgeClass:
        "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
      icon: Target,
    };
  return {
    label: "Keep Practicing",
    color: "text-red-600 dark:text-red-400",
    iconBg: "bg-red-500/10",
    accentClass: "bg-red-500",
    badgeClass:
      "bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/20",
    icon: AlertCircle,
  };
}

// ── Sub-components ────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  colorClass,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  colorClass: string;
}) {
  return (
    <motion.div
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
    >
      <Card>
        <CardContent className="pt-5 pb-4 text-center">
          <Icon className={cn("w-5 h-5 mx-auto mb-1.5", colorClass)} />
          <p className="text-2xl font-black text-foreground">{value}</p>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mt-0.5">
            {label}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function ResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") ?? "/";
  // FIX: read the quiz id from the URL so we use the correct storage key.
  // Previously this page used a bare "mcq-result-data" key shared across all
  // quizzes, so switching between quizzes could show stale results.
  const id = searchParams.get("id") ?? "";

  const [result, setResult] = useState<ResultData | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      return;
    }
    try {
      const raw = sessionStorage.getItem(getResultStorageKey(id));
      if (!raw) {
        setNotFound(true);
        return;
      }
      const data = JSON.parse(raw) as ResultData;
      setResult(data);
    } catch {
      setNotFound(true);
    }
    // FIX: never remove from sessionStorage here.
    // Doing so causes "Result Not Found" errors because React Strict Mode
    // double-mounts in dev, and Next.js can re-render components.
    //
    // sessionStorage is per-tab and auto-clears when the tab closes.
    // The parent components already overwrite the key with fresh data on
    // each new submission (sessionStorage.setItem), so there's no stale
    // data accumulation concern. The user can safely refresh the page
    // without losing their result.
  }, [id]);

  if (notFound) {
    return (
      <PageTransition className="p-4 md:p-8 max-w-2xl mx-auto">
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold mb-2">No Result Found</h2>
          <p className="text-muted-foreground mb-6 text-sm">
            This result has expired or no data was provided.
          </p>
          <Button onClick={() => router.push(returnTo)} className="rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to {getReturnLabel(returnTo)}
          </Button>
        </div>
      </PageTransition>
    );
  }

  if (!result) {
    return (
      <PageTransition className="p-4 md:p-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </PageTransition>
    );
  }

  const {
    title,
    totalQuestions,
    correctCount,
    wrongCount,
    skippedCount,
    score,
    maxScore,
    negativeMarking,
    timeTakenSecs,
    questions,
    userAnswers,
  } = result;

  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const accuracy =
    correctCount + wrongCount > 0
      ? Math.round((correctCount / (correctCount + wrongCount)) * 100)
      : 0;

  const tier = getTier(percentage);
  const TierIcon = tier.icon;

  return (
    <PageTransition className="p-4 md:p-8 max-w-2xl mx-auto space-y-4 pb-12">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(returnTo)}
          className="-ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          {getReturnLabel(returnTo)}
        </Button>
      </div>

      <h1 className="text-xl font-bold leading-snug truncate">{title}</h1>

      {/* ── Performance banner ────────────────────────────────────────── */}
      <motion.div
        initial={{ y: 8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
      >
        <Card className="overflow-hidden">
          {/* Coloured accent stripe */}
          <div className={cn("h-1.5 w-full", tier.accentClass)} />
          <CardContent className="pt-6 pb-7 text-center space-y-3">
            <div
              className={cn(
                "w-16 h-16 rounded-2xl mx-auto flex items-center justify-center",
                tier.iconBg,
              )}
            >
              <TierIcon className={cn("w-8 h-8", tier.color)} />
            </div>
            <div>
              <p className="text-5xl font-black text-foreground">
                {percentage}%
              </p>
              <Badge
                variant="outline"
                className={cn("mt-2 text-sm font-semibold", tier.badgeClass)}
              >
                {tier.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Score:{" "}
              <span className="font-semibold text-foreground">
                {+score.toFixed(2)}
              </span>{" "}
              / {maxScore}
              {negativeMarking > 0 && (
                <span className="ml-2 text-destructive/80">
                  (−{negativeMarking} per wrong)
                </span>
              )}
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Stats grid ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={CheckCircle2}
          label="Correct"
          value={correctCount}
          colorClass="text-emerald-500"
        />
        <StatCard
          icon={XCircle}
          label="Wrong"
          value={wrongCount}
          colorClass="text-destructive"
        />
        <StatCard
          icon={MinusCircle}
          label="Skipped"
          value={skippedCount}
          colorClass="text-muted-foreground"
        />
      </div>

      {/* ── Detail stats ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
              <BarChart3 className="w-3.5 h-3.5" />
              Accuracy
            </div>
            <p className="text-2xl font-bold text-foreground">{accuracy}%</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              of attempted questions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1.5">
              <Clock className="w-3.5 h-3.5" />
              Time Taken
            </div>
            <p className="text-2xl font-bold text-foreground">
              {formatTime(timeTakenSecs)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              avg {Math.round(timeTakenSecs / totalQuestions)}s / question
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ── Multi-segment progress bar ────────────────────────────────── */}
      <Card>
        <CardContent className="pt-4 pb-4 space-y-3">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              {correctCount} correct
            </span>
            <span className="text-destructive font-medium">
              {wrongCount} wrong
            </span>
            <span className="font-medium">{skippedCount} skipped</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden flex gap-0.5">
            {correctCount > 0 && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(correctCount / totalQuestions) * 100}%` }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="h-full bg-emerald-500 rounded-full"
              />
            )}
            {wrongCount > 0 && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(wrongCount / totalQuestions) * 100}%` }}
                transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
                className="h-full bg-destructive rounded-full"
              />
            )}
            {skippedCount > 0 && (
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${(skippedCount / totalQuestions) * 100}%`,
                }}
                transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
                className="h-full bg-muted-foreground/30 rounded-full"
              />
            )}
          </div>
          <p className="text-xs text-center text-muted-foreground">
            {totalQuestions} questions total
          </p>
        </CardContent>
      </Card>

      {/* ── Question review accordion ──────────────────────────────────── */}
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="review" className="border rounded-xl px-1">
          <AccordionTrigger className="px-3 hover:no-underline font-semibold text-sm">
            Question Review
            <Badge variant="secondary" className="ml-2 font-normal">
              {totalQuestions}
            </Badge>
          </AccordionTrigger>
          <AccordionContent className="px-3 pb-4">
            <div className="space-y-3 pt-1">
              {questions.map((q, i) => {
                const userAns = userAnswers?.[i];
                const isUnanswered = userAns === undefined;
                const isCorrect = !isUnanswered && userAns === q.correctIndex;
                const isWrong = !isUnanswered && userAns !== q.correctIndex;

                return (
                  <div
                    key={q.id}
                    className={cn(
                      "rounded-xl border p-4",
                      isCorrect
                        ? "border-emerald-500/25 bg-emerald-500/5"
                        : isWrong
                          ? "border-destructive/25 bg-destructive/5"
                          : "border-border bg-muted/30",
                    )}
                  >
                    {/* Question header */}
                    <div className="flex items-start gap-2.5 mb-3">
                      <span
                        className={cn(
                          "shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white",
                          isCorrect
                            ? "bg-emerald-500"
                            : isWrong
                              ? "bg-destructive"
                              : "bg-muted-foreground/60",
                        )}
                      >
                        {i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground leading-snug">
                          {q.text}
                        </p>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 mt-1 text-xs font-semibold",
                            isCorrect
                              ? "text-emerald-600 dark:text-emerald-400"
                              : isWrong
                                ? "text-destructive"
                                : "text-muted-foreground",
                          )}
                        >
                          {isCorrect ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" /> Correct
                            </>
                          ) : isWrong ? (
                            <>
                              <XCircle className="w-3 h-3" /> Wrong
                            </>
                          ) : (
                            <>
                              <MinusCircle className="w-3 h-3" /> Unanswered
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Options */}
                    <div className="ml-8 space-y-1.5">
                      {q.options.map((opt, oi) => {
                        const isUserChoice = !isUnanswered && userAns === oi;
                        const isRightAnswer = q.correctIndex === oi;

                        return (
                          <div
                            key={oi}
                            className={cn(
                              "flex items-center gap-2 text-sm px-3 py-2 rounded-lg border",
                              isRightAnswer
                                ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-medium"
                                : isUserChoice && isWrong
                                  ? "border-destructive/30 bg-destructive/10 text-destructive line-through"
                                  : "border-transparent text-muted-foreground",
                            )}
                          >
                            <span className="shrink-0 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold">
                              {String.fromCharCode(65 + oi)}
                            </span>
                            <span className="flex-1">{opt}</span>
                            {isRightAnswer && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            )}
                            {isUserChoice && isWrong && (
                              <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation — shown for wrong/unanswered only */}
                    {(isWrong || isUnanswered) && q.explanation && (
                      <>
                        <Separator className="ml-8 my-3 w-[calc(100%-2rem)]" />
                        <div className="ml-8 p-3 rounded-lg bg-blue-500/8 border border-blue-500/15">
                          <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
                            Explanation
                          </p>
                          <p className="text-xs text-foreground/80 leading-relaxed">
                            {q.explanation}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* ── Actions ───────────────────────────────────────────────────── */}
      <Button
        variant="outline"
        onClick={() => router.push(returnTo)}
        className="w-full rounded-xl h-12"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to {getReturnLabel(returnTo)}
      </Button>
    </PageTransition>
  );
}
