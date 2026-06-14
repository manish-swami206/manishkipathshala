"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface McqSessionState {
  answers: Record<number, number>;
  currentQIndex: number;
  isSubmitted: boolean;
  startedAt: number;
}

function getSessionKey(sessionId: string | undefined): string | null {
  if (!sessionId) return null;
  return `mcq-session:${sessionId}`;
}

function loadSession(
  sessionKey: string | null,
): Partial<McqSessionState> | null {
  if (!sessionKey || typeof window === "undefined") return null;
  try {
    const saved = sessionStorage.getItem(sessionKey);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

function saveSession(sessionKey: string | null, state: McqSessionState) {
  if (!sessionKey || typeof window === "undefined") return;
  try {
    sessionStorage.setItem(sessionKey, JSON.stringify(state));
  } catch {
    // Quota exceeded — silently fail
  }
}

function clearSession(sessionKey: string | null) {
  if (!sessionKey || typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(sessionKey);
  } catch {
    // Ignore
  }
}

/**
 * Custom hook that manages MCQ session state with optional sessionStorage
 * persistence. When `sessionId` is provided, answers, current question index,
 * submission state, and timer position survive page refreshes.
 *
 * The timer uses a `startedAt` timestamp so that it accurately reconstructs
 * remaining time even after a page refresh.
 *
 * FIXES:
 * - loadSession is now captured once via ref (not called on every render, not
 *   called at module level — safe for SSR and reacts to sessionId changes).
 * - startedAt is now a proper state value with a setter so reset() can clear it.
 * - reset() resets ALL state including the timer start timestamp.
 */
export function useMcqSession(
  sessionId: string | undefined,
  durationMins: number,
  totalQuestions?: number,
) {
  const sessionKey = getSessionKey(sessionId);

  // FIX: capture session data exactly once on mount using a ref.
  // Avoids calling sessionStorage on every render while keeping SSR-safe
  // (typeof window check is inside loadSession).
  const savedRef = useRef<Partial<McqSessionState> | undefined>(undefined);
  if (savedRef.current === undefined) {
    savedRef.current = loadSession(sessionKey) ?? {};
  }
  const saved = savedRef.current;

  // Core state — restored from sessionStorage if available
  const [answers, setAnswers] = useState<Record<number, number>>(
    saved.answers ?? {},
  );
  const [currentQIndex, setCurrentQIndex] = useState<number>(() => {
    if (saved.currentQIndex !== undefined) {
      return totalQuestions
        ? Math.min(saved.currentQIndex, totalQuestions - 1)
        : saved.currentQIndex;
    }
    return 0;
  });
  const [isSubmitted, setIsSubmitted] = useState<boolean>(
    saved.isSubmitted ?? false,
  );

  // FIX: startedAt must be settable so reset() can restart the timer from zero.
  // Previously declared as `const [startedAt] = useState(...)` with no setter,
  // so after reset() the timer kept running from the original start time.
  const [startedAt, setStartedAt] = useState<number>(
    saved.startedAt ?? Date.now(),
  );
  const [now, setNow] = useState(Date.now());

  // Tick every second only while the session is active
  useEffect(() => {
    if (isSubmitted) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isSubmitted]);

  const elapsedSecs = Math.floor((now - startedAt) / 1000);
  const timeLeft = Math.max(0, durationMins * 60 - elapsedSecs);

  // Persist composite state whenever any key value changes
  useEffect(() => {
    if (!sessionKey || isSubmitted) return;
    saveSession(sessionKey, {
      answers,
      currentQIndex,
      isSubmitted,
      startedAt,
    });
  }, [sessionKey, answers, currentQIndex, isSubmitted, startedAt]);

  // Clear session data on final submit
  useEffect(() => {
    if (isSubmitted && sessionKey) {
      clearSession(sessionKey);
    }
  }, [isSubmitted, sessionKey]);

  // FIX: reset now clears startedAt so the timer restarts from zero.
  // Also clears savedRef so a remount after reset doesn't reload the old session.
  const reset = useCallback(() => {
    clearSession(sessionKey);
    savedRef.current = {};
    const fresh = Date.now();
    setAnswers({});
    setCurrentQIndex(0);
    setIsSubmitted(false);
    setStartedAt(fresh);
    setNow(fresh);
  }, [sessionKey]);

  return {
    answers,
    setAnswers,
    currentQIndex,
    setCurrentQIndex,
    isSubmitted,
    setIsSubmitted,
    timeLeft,
    reset,
  };
}
