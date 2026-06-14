"use client";

import { useEffect, useRef } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

/**
 * StreakInitializer — auto-calls POST /streaks/activity with type "login"
 * whenever a user signs in or the session is restored.
 *
 * This runs silently once per auth state change and does not affect points.
 */
export function StreakInitializer() {
  const { isSignedIn, userId, getToken } = useAuth();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const initialized = useRef(false);

  useEffect(() => {
    if (!isSignedIn || !userId) {
      initialized.current = false;
      return;
    }

    // Only call once per session
    if (initialized.current) return;
    initialized.current = true;

    const displayName = user?.fullName || `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "Learner";

    const recordLogin = async () => {
      try {
        const token = (await getToken()) ?? undefined;
        await apiFetch("/streaks/activity", {
          method: "POST",
          body: JSON.stringify({
            activityType: "login",
            displayName,
          }),
          token,
        });
        // Invalidate streak cache so UI updates
        queryClient.invalidateQueries({ queryKey: ["streaks", "current"] });
      } catch {
        // Silently fail — streaks are non-critical
      }
    };

    // Small delay to ensure session is fully restored
    const timer = setTimeout(recordLogin, 2000);
    return () => clearTimeout(timer);
  }, [isSignedIn, userId, user, queryClient]);

  return null;
}
