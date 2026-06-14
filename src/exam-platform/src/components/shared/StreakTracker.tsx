"use client";

import { useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRecordActivity } from "@/lib/api";
import { Flame, X } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "mk_last_streak_date";
const TOAST_DURATION = 5000;

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function StreakToast({
  streak,
  pointsEarned,
  onClose,
}: {
  streak: number;
  pointsEarned: number;
  onClose: () => void;
}) {
  const flameColor = streak >= 30 ? "text-red-500" : streak >= 7 ? "text-orange-500" : "text-amber-400";

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[9999] animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 bg-gray-900 text-white rounded-2xl shadow-2xl px-4 py-3 min-w-[240px] max-w-[320px]">
        <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
          <Flame className={cn("w-5 h-5 fill-current", flameColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-sm leading-tight">
            {streak === 1 ? "Streak started! 🔥" : `${streak} day streak! 🔥`}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">+{pointsEarned} points earned today</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors shrink-0 ml-1">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function StreakTracker() {
  const { user, isLoaded } = useUser();
  const { mutateAsync: recordActivity } = useRecordActivity();
  const [toast, setToast] = useState<{ streak: number; pointsEarned: number } | null>(null);
  const fired = useRef(false);

  useEffect(() => {
    if (!isLoaded || !user || fired.current) return;

    const today = todayStr();
    const lastDate = localStorage.getItem(STORAGE_KEY);
    if (lastDate === today) return;

    fired.current = true;
    const displayName = user.fullName || `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Learner";

    recordActivity({ data: { activityType: "login", displayName } })
      .then((result) => {
        localStorage.setItem(STORAGE_KEY, today);
        if (result.streakIncremented) {
          setToast({ streak: result.currentStreak, pointsEarned: result.pointsEarned });
        }
      })
      .catch(() => {
        fired.current = false;
      });
  }, [isLoaded, user]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  return (
    <StreakToast
      streak={toast.streak}
      pointsEarned={toast.pointsEarned}
      onClose={() => setToast(null)}
    />
  );
}
