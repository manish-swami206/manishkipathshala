"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Clock,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Loader2,
  LogOut,
  List,
} from "lucide-react";
import { PageTransition } from "@/components/shared/PageTransition";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import ReportCardModal from "@/components/quiz/ReportCardModal";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useMcqSession } from "./useMcqSession";

// ── Types ────────────────────────────────────────────────────────────────

export type GlobalMcqMode = "mock" | "daily" | "ncert" | "pyq";

export type GlobalMcqQuestion = {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string | null;
};

export type ResultData = {
  title: string;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  score: number;
  maxScore: number;
  negativeMarking: number;
  questions: GlobalMcqQuestion[];
  userAnswers: Record<number, number>;
  timeTakenSecs: number;
};

type Props = {
  mode: GlobalMcqMode;
  title: string;
  durationMins: number;
  questions: GlobalMcqQuestion[];
  sessionId?: string;
  isLoading?: boolean;
  error?: string | null;
  onBackHref: string;
  /** For mock/daily — marks-based scoring */
  maxMarks?: number;
  /** Negative marking per wrong answer (default 0) */
  negativeMarking?: number;
  /** For ncert/pyq — max score (default = questions.length) */
  maxScore?: number;
  saveAttempt: (payload: {
    examId?: string;
    quizId?: string;
    score: number;
    totalMarks: number;
    correctCount: number;
    wrongCount: number;
    skippedCount: number;
    timeTakenSecs: number;
    isPassed: boolean;
  }) => Promise<unknown>;
  /** If provided, navigates to a separate results page instead of showing inline report modal */
  onShowResult?: (data: ResultData) => void;
};

// ── Scoring helpers ──────────────────────────────────────────────────────

function computeScore(
  mode: GlobalMcqMode,
  answers: Record<number, number>,
  questions: GlobalMcqQuestion[],
  maxMarks: number,
  negativeMarking: number,
) {
  let score = 0;
  let correctCount = 0;
  let wrongCount = 0;

  for (let i = 0; i < questions.length; i++) {
    const chosen = answers[i];
    if (chosen === undefined) continue;

    const q = questions[i];
    if (chosen === q.correctIndex) {
      correctCount++;
      if (mode === "ncert" || mode === "pyq") {
        score += 1;
      } else {
        score += maxMarks / questions.length;
      }
    } else {
      wrongCount++;
      score -= negativeMarking;
    }
  }

  return { score, correctCount, wrongCount };
}

// ── Component ────────────────────────────────────────────────────────────

export default function GlobalMcqPlayer({
  mode,
  title,
  durationMins,
  questions,
  sessionId,
  isLoading,
  error,
  onBackHref,
  maxMarks: maxMarksProp,
  negativeMarking = 0,
  maxScore: maxScoreProp,
  saveAttempt,
  onShowResult,
}: Props) {
  const resolvedMaxMarks = maxMarksProp ?? questions.length;
  const resolvedMaxScore = maxScoreProp ?? questions.length;

  const {
    answers,
    setAnswers,
    currentQIndex,
    setCurrentQIndex,
    isSubmitted,
    setIsSubmitted,
    timeLeft,
    reset,
  } = useMcqSession(sessionId, durationMins, questions.length);

  // Track per-question locking (for ncert/pyq — lock immediately on selection)
  const [lockedQuestions, setLockedQuestions] = useState<Record<number, boolean>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [showReportCard, setShowReportCard] = useState(false);
  const [showMobilePalette, setShowMobilePalette] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [isNavigatingToResult, setIsNavigatingToResult] = useState(false);

  const submittedRef = useRef(false);
  const initializedRef = useRef(false);

  // FIX: keep a ref to the latest handleSubmit so the auto-submit effect never
  // closes over a stale version of the function (avoids the eslint-disable
  // hack that was masking the stale-closure bug).
  const handleSubmitRef = useRef<() => void>(() => {});

  // Reset local UI state when questions change (new session)
  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      return;
    }
    reset();
    setLockedQuestions({});
    setShowExplanation(false);
    setShowReportCard(false);
    setShowMobilePalette(false);
    submittedRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [durationMins, questions]);

  // FIX: use the ref so this effect always calls the current handleSubmit,
  // even though timeLeft (and therefore the effect) updates every second.
  // NCERT and PYQ modes have no timer — never auto-submit.
  useEffect(() => {
    if (mode !== "ncert" && mode !== "pyq" && timeLeft <= 0 && !isSubmitted) {
      handleSubmitRef.current();
    }
  }, [mode, timeLeft, isSubmitted]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const currentQ = questions[currentQIndex];
  const isLastQ = currentQIndex === questions.length - 1;
  const isFirstQ = currentQIndex === 0;

  // Score computation — stable reference via useMemo
  const computed = useMemo(
    () =>
      computeScore(
        mode,
        answers,
        questions,
        resolvedMaxMarks,
        negativeMarking,
      ),
    [
      mode,
      answers,
      questions,
      resolvedMaxMarks,
      negativeMarking,
      resolvedMaxScore,
    ],
  );

  // In ncert/pyq mode, a question shows feedback once the user selects an option
  // In mock/daily mode, feedback shows only after global submission
  const isQuestionLocked = (qIndex: number) =>
    isSubmitted || (mode !== "mock" && mode !== "daily" && lockedQuestions[qIndex]);

  const handleSelectOption = (optIndex: number) => {
    if (isSubmitted) return;
    if (!currentQ) return;
    if (isQuestionLocked(currentQIndex)) return;

    setAnswers((prev) => ({ ...prev, [currentQIndex]: optIndex }));

    // NCERT/PYQ — lock the question immediately on selection
    if (mode === "ncert" || mode === "pyq") {
      setLockedQuestions((prev) => ({ ...prev, [currentQIndex]: true }));
    }
  };

  const handleSubmit = () => {
    if (isSubmitted || submittedRef.current) return;
    submittedRef.current = true;

    // Compute from current answers (avoids stale closure issues)
    const { score, correctCount, wrongCount } = computeScore(
      mode,
      answers,
      questions,
      resolvedMaxMarks,
      negativeMarking,
    );

    const answeredCount = Object.keys(answers).length;
    const skippedCount = questions.length - answeredCount;
    const timeTakenSecs = durationMins * 60 - timeLeft;
    const isPassed =
      score >= (mode === "mock" ? resolvedMaxMarks : resolvedMaxScore) / 2;

    setIsSubmitted(true);
    setShowExplanation(true);

    // Build result data immediately (synchronous — no race condition risk)
    const resultData = {
      title,
      totalQuestions: questions.length,
      correctCount,
      wrongCount,
      skippedCount,
      score,
      maxScore:
        mode === "mock" || mode === "daily"
          ? resolvedMaxMarks
          : resolvedMaxScore,
      negativeMarking,
      questions,
      userAnswers: { ...answers },
      timeTakenSecs,
    };

    if (onShowResult) {
      // Show the full-screen loading overlay IMMEDIATELY — blocks all clicks
      setIsNavigatingToResult(true);

      // Only save attempt history for mock tests and daily quizzes
      // NCERT and PYQ are practice modes — no need to track scores
      const shouldSave = mode === "mock" || mode === "daily";
      const savePromise = shouldSave
        ? saveAttempt({
            score,
            totalMarks:
              mode === "mock" || mode === "daily"
                ? resolvedMaxMarks
                : resolvedMaxScore,
            correctCount,
            wrongCount,
            skippedCount,
            timeTakenSecs,
            isPassed,
          })
        : Promise.resolve();

      // Safety timeout: if save attempt takes > 8 seconds, navigate anyway
      const timeoutPromise = new Promise<unknown>((_, reject) =>
        setTimeout(() => reject(new Error("Save attempt timed out")), 8000),
      );

      // Navigate after save completes (even if save fails/times out, still show results)
      Promise.race([Promise.resolve(savePromise), timeoutPromise])
        .catch((err) => {
          if (err instanceof Error && err.message !== "Save attempt timed out") {
            console.error("Failed to save attempt:", err);
          }
        })
        .finally(() => {
          try {
            onShowResult(resultData);
          } catch (err) {
            // If onShowResult throws (e.g. sessionStorage full), still navigate
            console.error("Failed to navigate to results:", err);
            // Hide the loading overlay so buttons become clickable again
            setIsNavigatingToResult(false);
          }
          // Note: onShowResult calls router.push() which unmounts this component,
          // so the overlay naturally disappears with the component.
        });
    } else {
      // Fallback: show inline report modal
      setShowReportCard(true);
    }
  };

  // FIX: keep the ref pointing at the latest handleSubmit after every render
  handleSubmitRef.current = handleSubmit;

  // ── Loading / Error / Empty states ──────────────────────────────────────

  if (isLoading) {
    return (
      <PageTransition className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-[600px] w-full rounded-3xl" />
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
          {error}
        </div>
      </PageTransition>
    );
  }

  if (!questions.length) {
    return (
      <PageTransition className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
        <div className="py-16">
          <Empty>
            <EmptyTitle>No questions available</EmptyTitle>
            <EmptyDescription>
              This{" "}
              {mode === "mock"
                ? "mock test"
                : mode === "daily"
                  ? "quiz"
                  : mode.toUpperCase()}{" "}
              has no questions yet.
            </EmptyDescription>
          </Empty>
        </div>
      </PageTransition>
    );
  }

  // ── Question palette sidebar rendering ──────────────────────────────
  // Shared rendering function used by both the desktop sidebar and mobile sheet.
  // Each context provides its own header — this only renders the grid + legend.
  const answeredCount = Object.keys(answers).length;

  const renderQuestionGrid = (onQuestionClick?: () => void) => (
    <div className="grid grid-cols-4 gap-1.5">
      {questions.map((_, i) => {
        const isAnswered = answers[i] !== undefined;
        const isCurrent = currentQIndex === i;

        let bgClass =
          "bg-muted/60 text-muted-foreground hover:bg-muted border-transparent";
        let ringClass = "";
        let label = String(i + 1);

        const locked = isQuestionLocked(i);
        if (isSubmitted || locked) {
          const isCorrect = answers[i] === questions[i].correctIndex;
          if (!isAnswered) {
            bgClass = "bg-muted/40 text-muted-foreground/50";
          } else if (isCorrect) {
            bgClass = "bg-emerald-500/15 text-emerald-600 font-semibold";
            label = "✓";
          } else {
            bgClass = "bg-destructive/15 text-destructive font-semibold";
            label = "✗";
          }
        } else if (isAnswered) {
          bgClass =
            "bg-primary/20 text-primary font-semibold border-primary/30";
          label = "✓";
        }

        if (isCurrent && !isSubmitted) {
          ringClass = "ring-2 ring-primary ring-offset-1 ring-offset-background";
        }

        return (
          <button
            key={i}
            type="button"
            onClick={() => {
              setCurrentQIndex(i);
              onQuestionClick?.();
            }}
            className={cn(
              "h-9 rounded-lg text-xs font-medium transition-all border",
              bgClass,
              ringClass,
              !onQuestionClick && "hover:scale-105",
            )}
            title={`Question ${i + 1}${isAnswered ? " (Answered)" : ""}`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );

  // ── Main render ────────────────────────────────────────────────────────

  // z-40 so portaled modals (AlertDialog at z-50, Sheet at z-50) render on top
  return (
    <div className="fixed inset-0 z-40 bg-background flex flex-col md:flex-row overflow-hidden">
      {/* ── Sidebar ──────────────────────────────────────────────────── */}
      {/* Desktop: always visible when showSidebar is true */}
      {/* Mobile: overlay panel that slides in from the left */}
      <>
        {/* Desktop sidebar */}
        <aside
          className={cn(
            "hidden md:flex md:flex-col w-56 lg:w-64 shrink-0 border-r bg-card overflow-hidden transition-all duration-200",
            !showSidebar && "md:hidden",
          )}
        >
          <div className="flex items-center justify-between px-3 py-2.5 border-b shrink-0">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Questions
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {answeredCount}/{questions.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {renderQuestionGrid()}
          </div>
          {!isSubmitted && (mode === "mock" || mode === "daily") && (
            <div className="px-3 py-2.5 border-t shrink-0 space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-primary/30" />
                <span>Answered</span>
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-muted-foreground/20 ml-2" />
                <span>Unanswered</span>
              </div>
            </div>
          )}
          {!isSubmitted && (mode === "ncert" || mode === "pyq") && (
            <div className="px-3 py-2.5 border-t shrink-0 space-y-1">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-500/40" />
                <span>Correct</span>
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-destructive/40 ml-2" />
                <span>Wrong</span>
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-muted-foreground/20 ml-2" />
                <span>Pending</span>
              </div>
            </div>
          )}
        </aside>

        {/* Mobile sidebar overlay */}
        {showSidebar && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-[150] bg-black/40 md:hidden"
              onClick={() => setShowSidebar(false)}
            />
            {/* Panel */}
            <aside className="fixed left-0 top-0 bottom-0 z-[160] w-64 bg-card border-r shadow-2xl md:hidden flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2.5 border-b shrink-0">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Questions
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {answeredCount}/{questions.length}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                {renderQuestionGrid(() => setShowSidebar(false))}
              </div>
          {!isSubmitted && (mode === "mock" || mode === "daily") && (
            <div className="px-3 py-2.5 border-t shrink-0">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-primary/30" />
                <span>Answered</span>
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-muted-foreground/20 ml-2" />
                <span>Unanswered</span>
              </div>
            </div>
          )}
          {!isSubmitted && (mode === "ncert" || mode === "pyq") && (
            <div className="px-3 py-2.5 border-t shrink-0">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-emerald-500/40" />
                <span>Correct</span>
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-destructive/40 ml-2" />
                <span>Wrong</span>
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-muted-foreground/20 ml-2" />
                <span>Pending</span>
              </div>
            </div>
          )}
        </aside>
          </>
        )}
      </>

      {/* ── Question area ─────────────────────────────────────────────── */}

      <div className="flex-1 flex flex-col h-full bg-muted/20 min-h-0">
        {/* Header */}
        <header className="h-14 md:h-16 px-2 md:px-4 border-b bg-background flex items-center justify-between shrink-0 gap-1">
          <div className="flex items-center gap-1 md:gap-2 min-w-0">
            {/* Sidebar toggle (mobile) */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSidebar((v) => !v)}
              className="md:hidden shrink-0 gap-1.5 px-2"
              aria-label="Toggle question navigator"
            >
              <List className="w-4 h-4" />
              <span className="text-xs font-medium text-muted-foreground">
                All Questions
              </span>
            </Button>

            {/* Exit button (mobile only — hidden when right-side Exit is already visible) */}
            {!isSubmitted && mode !== "ncert" && mode !== "pyq" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  window.location.href = onBackHref;
                }}
                className="md:hidden shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                aria-label="Exit test"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            )}

            <span
              className="font-bold text-sm md:text-lg truncate max-w-[120px] sm:max-w-sm cursor-pointer"
              onClick={() => {
                window.location.href = onBackHref;
              }}
            >
              {title}
            </span>
          </div>

          <div className="flex items-center gap-1 md:gap-3 shrink-0">
            {/* Timer — hidden for NCERT/PYQ (no time limit) */}
            {!isSubmitted && mode !== "ncert" && mode !== "pyq" && (
              <div
                className={cn(
                  "flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-lg font-mono font-bold border text-xs md:text-sm",
                  timeLeft < 60
                    ? "text-destructive border-destructive bg-destructive/10 animate-pulse"
                    : "border-border bg-card text-foreground",
                )}
              >
                <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" />
                {formatTime(timeLeft)}
              </div>
            )}

            {/* Question palette button (mobile) */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMobilePalette(true)}
              className="md:hidden text-xs"
            >
              {answeredCount}/{questions.length}
            </Button>

            {/* Submit or Exit button */}
            {isSubmitted ? (
              <Button
                onClick={() => {
                  window.location.href = onBackHref;
                }}
                variant="outline"
                className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Exit</span>
              </Button>
            ) : mode === "ncert" || mode === "pyq" ? (
              <Button
                onClick={() => {
                  window.location.href = onBackHref;
                }}
                variant="ghost"
                className="gap-1.5 text-muted-foreground"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Exit</span>
              </Button>
            ) : (
              <Button
                variant="default"
                className="bg-primary text-white text-xs md:text-sm h-9 md:h-10 px-3 md:px-5"
                onClick={() => setShowSubmitConfirm(true)}
              >
                Submit Test
              </Button>
            )}
          </div>
        </header>

        {/* Main content */}
        <div className="flex-1 overflow-y-auto p-3 md:p-8 min-h-0">
          <div className="max-w-3xl mx-auto pb-safe">
            {/* Completed banner — only for mock/daily (submission-based modes) */}
            {isSubmitted && (
              <div className="mb-6 p-4 rounded-xl bg-card border shadow-sm flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-lg">Completed</h3>
                  <p className="text-sm text-muted-foreground">
                    Score:{" "}
                    {computed.score.toFixed(
                      mode === "ncert" || mode === "pyq" ? 0 : 2,
                    )}{" "}
                    | Correct: {computed.correctCount} | Wrong:{" "}
                    {computed.wrongCount} | Skipped:{" "}
                    {questions.length - Object.keys(answers).length}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowExplanation((v) => !v)}
                  className="shrink-0"
                >
                  {showExplanation ? "Hide Explanations" : "Show Explanations"}
                </Button>
              </div>
            )}

            {/* Practice mode stats bar — for ncert/pyq: shows progress */}
            {!isSubmitted && (mode === "ncert" || mode === "pyq") &&
              Object.keys(lockedQuestions).length > 0 && (
              <div className="mb-6 p-4 rounded-xl bg-card border shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5 text-sm">
                      <span className="inline-block w-3 h-3 rounded-sm bg-emerald-500/30" />
                      <span className="text-muted-foreground">
                        Correct:{" "}
                        <span className="font-semibold text-foreground">
                          {computed.correctCount}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <span className="inline-block w-3 h-3 rounded-sm bg-destructive/30" />
                      <span className="text-muted-foreground">
                        Wrong:{" "}
                        <span className="font-semibold text-foreground">
                          {computed.wrongCount}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <span className="inline-block w-3 h-3 rounded-sm bg-muted-foreground/20" />
                      <span className="text-muted-foreground">
                        Remaining:{" "}
                        <span className="font-semibold text-foreground">
                          {questions.length - Object.keys(lockedQuestions).length}
                        </span>
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowExplanation((v) => !v)}
                    className="text-xs shrink-0"
                  >
                    {showExplanation ? "Hide Explanations" : "Show Explanations"}
                  </Button>
                </div>
              </div>
            )}

            {/* Question card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="bg-card border rounded-2xl p-6 md:p-8 shadow-sm"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                    {currentQIndex + 1}
                  </div>
                  <h2 className="text-base md:text-lg font-medium leading-relaxed">
                    {currentQ.text}
                  </h2>
                </div>

                <div className="space-y-3">
                  {currentQ.options.map((opt, i) => {
                    const locked = isQuestionLocked(currentQIndex);
                    const isSelected = answers[currentQIndex] === i;
                    const isCorrect = locked && currentQ.correctIndex === i;
                    const isWrongSelected = locked && isSelected && !isCorrect;

                    let bgClass = "bg-card hover:bg-muted border-border";
                    if (isSelected && !locked)
                      bgClass =
                        "bg-primary/5 border-primary text-primary shadow-sm";
                    if (isCorrect)
                      bgClass =
                        "bg-emerald-500/10 border-emerald-500 text-emerald-700 font-medium";
                    if (isWrongSelected)
                      bgClass =
                        "bg-destructive/10 border-destructive text-destructive";

                    return (
                      <div
                        key={i}
                        onClick={() => handleSelectOption(i)}
                        className={cn(
                          "p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center gap-3",
                          bgClass,
                          locked && "cursor-default",
                          !locked &&
                            "hover:border-primary/40 hover:bg-primary/5",
                        )}
                      >
                        <div
                          className={cn(
                            "shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-colors",
                            isSelected && !isSubmitted
                              ? "border-primary bg-primary text-white"
                              : "border-muted-foreground/30",
                            isCorrect &&
                              "border-emerald-500 bg-emerald-500 text-white",
                            isWrongSelected &&
                              "border-destructive bg-destructive text-white",
                          )}
                        >
                          {String.fromCharCode(65 + i)}
                        </div>
                        <span className="flex-1">{opt}</span>
                        {isCorrect && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        )}
                        {isWrongSelected && (
                          <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {(isSubmitted || isQuestionLocked(currentQIndex)) &&
                  showExplanation &&
                  currentQ.explanation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mt-6 p-4 rounded-xl bg-blue-50 border border-blue-100"
                    >
                      <div className="flex items-center gap-2 text-blue-700 font-semibold mb-2">
                        <Lightbulb className="w-5 h-5" /> Explanation
                      </div>
                      <p className="text-sm text-blue-900 leading-relaxed">
                        {currentQ.explanation}
                      </p>
                    </motion.div>
                  )}

                {/* Navigation — inside the card so it's always visible after explanation */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentQIndex((p) => Math.max(0, p - 1))}
                    disabled={isFirstQ}
                    className="rounded-xl h-12 px-6"
                  >
                    <ChevronLeft className="w-5 h-5 mr-1" /> Previous
                  </Button>

                  {mode === "ncert" || mode === "pyq" ? (
                    <Button
                      onClick={() => {
                        if (isLastQ) {
                          window.location.href = onBackHref;
                        } else {
                          setCurrentQIndex((p) =>
                            Math.min(questions.length - 1, p + 1),
                          );
                        }
                      }}
                      className="rounded-xl h-12 px-6 bg-foreground text-background hover:bg-foreground/90"
                    >
                      {isLastQ ? (
                        "Back to List"
                      ) : (
                        <>
                          Next <ChevronRight className="w-5 h-5 ml-1" />
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        if (isLastQ && !isSubmitted) {
                          setShowSubmitConfirm(true);
                        } else if (!isLastQ) {
                          setCurrentQIndex((p) =>
                            Math.min(questions.length - 1, p + 1),
                          );
                        }
                      }}
                      disabled={isLastQ && isSubmitted}
                      className="rounded-xl h-12 px-6 bg-foreground text-background hover:bg-foreground/90"
                    >
                      {isLastQ && !isSubmitted ? (
                        "Finish & Submit"
                      ) : (
                        <>
                          Next <ChevronRight className="w-5 h-5 ml-1" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Report card modal (fallback if no onShowResult) ───────────── */}
      <ReportCardModal
        open={showReportCard}
        onOpenChange={setShowReportCard}
        title={title}
        totalQuestions={questions.length}
        correctCount={computed.correctCount}
        wrongCount={computed.wrongCount}
        unansweredCount={questions.length - Object.keys(answers).length}
        score={computed.score}
        maxScore={
          mode === "mock" || mode === "daily"
            ? resolvedMaxMarks
            : resolvedMaxScore
        }
        negativeMarking={negativeMarking}
        questions={questions}
        userAnswers={answers}
        onViewExplanations={() => setShowExplanation(true)}
      />

      {/* ── Mobile question palette ──────────────────────────────────── */}
      <Sheet open={showMobilePalette} onOpenChange={setShowMobilePalette}>
        <SheetContent side="right" className="w-72 p-0 flex flex-col">
          <SheetHeader className="px-3 py-2.5 border-b shrink-0">
            <SheetTitle className="flex items-center justify-between text-sm font-semibold">
              Question Palette
              <span className="text-xs font-normal text-muted-foreground">
                {answeredCount}/{questions.length} Answered
              </span>
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-3">
            {renderQuestionGrid(() => setShowMobilePalette(false))}
          </div>
          {!isSubmitted && (
            <div className="px-3 py-2.5 border-t shrink-0">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-primary/30" />
                <span>Answered</span>
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-muted-foreground/20 ml-2" />
                <span>Unanswered</span>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Submit confirmation dialog ──────────────────────────────── */}
      <AlertDialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Test</AlertDialogTitle>
            <AlertDialogDescription>
              You have answered {answeredCount} of {questions.length} questions.
              {answeredCount < questions.length && (
                <>
                  {" "}
                  <span className="text-amber-600 font-medium">
                    {questions.length - answeredCount} question
                    {questions.length - answeredCount !== 1 ? "s" : ""}{" "}
                    are still unanswered.
                  </span>
                </>
              )}
              {" "}Once submitted, you cannot change your answers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Solving</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowSubmitConfirm(false);
                handleSubmit();
              }}
              className="bg-primary text-white hover:bg-primary/90"
            >
              Submit Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Full-screen loading overlay during submit → result navigation ── */}
      {isNavigatingToResult && (
        <div className="fixed inset-0 z-[300] bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <div className="rounded-2xl bg-card border shadow-2xl p-8 flex flex-col items-center gap-5 max-w-sm w-full mx-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <div className="text-center space-y-1">
              <p className="font-bold text-lg text-foreground">
                Calculating Results
              </p>
              <p className="text-sm text-muted-foreground">
                Please wait while we save your attempt and prepare your score
                report…
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
