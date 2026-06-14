"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Trophy,
  Target,
  AlertCircle,
  Share2,
  BarChart3,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ReviewQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string | null;
}

interface ReportCardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  score: number;
  maxScore: number;
  negativeMarking: number;
  timeTaken?: string;
  questions?: ReviewQuestion[];
  userAnswers?: Record<number, number>;
  onViewExplanations?: () => void;
  onRetry?: () => void;
  onShare?: () => void;
}

export default function ReportCardModal({
  open,
  onOpenChange,
  title,
  totalQuestions,
  correctCount,
  wrongCount,
  unansweredCount,
  score,
  maxScore,
  timeTaken,
  questions,
  userAnswers,
  onViewExplanations,
  onRetry,
  onShare,
}: ReportCardProps) {
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const accuracy =
    correctCount + wrongCount > 0
      ? Math.round((correctCount / (correctCount + wrongCount)) * 100)
      : 0;
  const [showReview, setShowReview] = useState(false);

  const getPerformanceTier = () => {
    if (percentage >= 90)
      return {
        label: "Outstanding!",
        color: "text-emerald-600",
        bg: "bg-emerald-50 border-emerald-200",
        icon: Sparkles,
      };
    if (percentage >= 70)
      return {
        label: "Great Job!",
        color: "text-blue-600",
        bg: "bg-blue-50 border-blue-200",
        icon: Trophy,
      };
    if (percentage >= 50)
      return {
        label: "Good Effort",
        color: "text-amber-600",
        bg: "bg-amber-50 border-amber-200",
        icon: Target,
      };
    return {
      label: "Keep Practicing",
      color: "text-red-600",
      bg: "bg-red-50 border-red-200",
      icon: AlertCircle,
    };
  };

  const tier = getPerformanceTier();
  const TierIcon = tier.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-center">
            Quiz Report Card
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Performance Banner */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className={cn("rounded-2xl border-2 p-5 text-center", tier.bg)}
          >
            <TierIcon className={cn("w-10 h-10 mx-auto mb-2", tier.color)} />
            <h3 className={cn("text-xl font-extrabold", tier.color)}>
              {tier.label}
            </h3>
            <p className="text-3xl font-black text-gray-900 mt-1">
              {percentage}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Score: {score}/{maxScore}
            </p>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <StatBox
              icon={CheckCircle2}
              label="Correct"
              value={correctCount}
              color="text-emerald-600"
              bg="bg-emerald-50"
            />
            <StatBox
              icon={XCircle}
              label="Wrong"
              value={wrongCount}
              color="text-red-600"
              bg="bg-red-50"
            />
            <StatBox
              icon={AlertCircle}
              label="Unanswered"
              value={unansweredCount}
              color="text-gray-500"
              bg="bg-gray-50"
            />
          </div>

          {/* Detail Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <BarChart3 className="w-3.5 h-3.5" />
                Accuracy
              </div>
              <p className="text-lg font-bold text-gray-900">{accuracy}%</p>
            </div>
            {timeTaken && (
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  Time Taken
                </div>
                <p className="text-lg font-bold text-gray-900">{timeTaken}</p>
              </div>
            )}
          </div>

          {/* Question Summary Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{correctCount} correct</span>
              <span>{wrongCount} wrong</span>
              <span>{unansweredCount} skip</span>
            </div>
            <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden flex">
              {correctCount > 0 && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(correctCount / totalQuestions) * 100}%`,
                  }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full bg-emerald-500"
                />
              )}
              {wrongCount > 0 && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(wrongCount / totalQuestions) * 100}%`,
                  }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                  className="h-full bg-red-500"
                />
              )}
              {unansweredCount > 0 && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(unansweredCount / totalQuestions) * 100}%`,
                  }}
                  transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                  className="h-full bg-gray-300"
                />
              )}
            </div>
          </div>

          {/* Question Review Toggle */}
          {questions && questions.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => setShowReview((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
              >
                <span className="font-semibold text-sm text-gray-700">
                  Question Review
                </span>
                {showReview ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </button>

              {showReview && (
                <div className="space-y-4 max-h-[320px] overflow-y-auto">
                  {questions.map((q, i) => {
                    const userAns = userAnswers?.[i];
                    const isUnanswered = userAns === undefined;
                    const isCorrect =
                      !isUnanswered && userAns === q.correctIndex;
                    const isWrong =
                      !isUnanswered && userAns !== q.correctIndex;

                    return (
                      <div
                        key={q.id}
                        className={cn(
                          "p-4 rounded-xl border",
                          isCorrect
                            ? "border-emerald-200 bg-emerald-50/40"
                            : isWrong
                              ? "border-red-200 bg-red-50/40"
                              : "border-gray-200 bg-gray-50/60",
                        )}
                      >
                        <div className="flex items-start gap-2.5 mb-2">
                          <span
                            className={cn(
                              "shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                              isCorrect
                                ? "bg-emerald-500 text-white"
                                : isWrong
                                  ? "bg-red-500 text-white"
                                  : "bg-gray-300 text-white",
                            )}
                          >
                            {i + 1}
                          </span>
                          <p className="text-sm font-medium text-gray-900 leading-snug">
                            {q.text}
                          </p>
                        </div>

                        {/* Options */}
                        <div className="ml-8 space-y-1.5">
                          {q.options.map((opt, oi) => {
                            const isUserChoice =
                              !isUnanswered && userAns === oi;
                            const isRightAnswer = q.correctIndex === oi;

                            let optClass =
                              "text-xs text-gray-600 px-2.5 py-1.5 rounded-lg border border-transparent";

                            if (isRightAnswer)
                              optClass =
                                "text-xs font-semibold text-emerald-800 px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-emerald-100/60";
                            else if (isUserChoice && isWrong)
                              optClass =
                                "text-xs font-semibold text-red-700 px-2.5 py-1.5 rounded-lg border border-red-300 bg-red-100/60 line-through";

                            return (
                              <div key={oi} className={optClass}>
                                <span className="font-bold mr-1.5">
                                  {String.fromCharCode(65 + oi)}.
                                </span>
                                {opt}
                                {isRightAnswer && (
                                  <CheckCircle2 className="inline w-3 h-3 ml-1.5 text-emerald-600" />
                                )}
                                {isUserChoice && isWrong && (
                                  <XCircle className="inline w-3 h-3 ml-1.5 text-red-500" />
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Explanation */}
                        {q.explanation && (isWrong || isUnanswered) && (
                          <div className="ml-8 mt-2 p-2.5 rounded-lg bg-blue-50 border border-blue-100">
                            <p className="text-xs font-semibold text-blue-700 mb-0.5">
                              Explanation:
                            </p>
                            <p className="text-xs text-blue-900 leading-relaxed">
                              {q.explanation}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {onViewExplanations && (
              <Button
                variant="outline"
                size="sm"
                onClick={onViewExplanations}
                className="flex-1 rounded-xl"
              >
                Review Answers
              </Button>
            )}
            {onShare && (
              <Button
                variant="outline"
                size="sm"
                onClick={onShare}
                className="rounded-xl"
              >
                <Share2 className="w-3.5 h-3.5" />
              </Button>
            )}
            {onRetry && (
              <Button
                size="sm"
                onClick={onRetry}
                className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Try Again
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatBox({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className={cn("rounded-xl p-3 border text-center", bg, "border-gray-100")}
    >
      <Icon className={cn("w-5 h-5 mx-auto mb-1", color)} />
      <p className="text-xl font-black text-gray-900">{value}</p>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
        {label}
      </p>
    </motion.div>
  );
}
