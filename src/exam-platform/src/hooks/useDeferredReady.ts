"use client";

import { useEffect, useState } from "react";

/**
 * Returns `true` once the browser's main thread is idle after mount.
 *
 * Non-critical queries (streaks, unread counts, notifications) can pass
 * this value as `enabled` so their API calls only fire *after* the
 * critical path (page paint + auth state resolution) is done.
 *
 * Typical latency: 0-150 ms after mount — invisible to the user but
 * enough to let the critical auth redirect + initial render complete.
 */
export function useDeferredReady(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const markReady = () => {
      if (!cancelled) setReady(true);
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      // Wait until the browser is truly idle (no pending tasks).
      const id = window.requestIdleCallback(markReady, { timeout: 1000 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
      };
    }

    // Fallback: two rAFs (wait for paint) + 100 ms (let microtasks drain)
    const frameId = requestAnimationFrame(() => {
      const timerId = setTimeout(markReady, 100);
      // Store for cleanup — timerId is stable inside this closure
      cleanupTimer = timerId;
    });
    let cleanupTimer: ReturnType<typeof setTimeout> | undefined;

    return () => {
      cancelled = true;
      cancelAnimationFrame(frameId);
      if (cleanupTimer !== undefined) clearTimeout(cleanupTimer);
    };
  }, []);

  return ready;
}
