"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageTransition } from "@/components/shared/PageTransition";
import { cn } from "@/lib/utils";
import { Trophy, Star, Zap, BookOpen, RotateCcw, TrendingUp, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@clerk/nextjs";
import { useGetLeaderboard } from "@/lib/api";

import type { LeaderboardEntry } from "@/lib/api";

function ClientSignedOut({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || !isLoaded || user) return null;
  return <>{children}</>;
}

type Tab = "allTime" | "monthly" | "weekly";

const TABS: { key: Tab; label: string }[] = [
  { key: "allTime", label: "All Time" },
  { key: "monthly", label: "This Month" },
  { key: "weekly",  label: "This Week" },
];

const AVATAR_COLORS = [
  "bg-yellow-500", "bg-gray-400", "bg-amber-700", "bg-violet-500",
  "bg-blue-500", "bg-green-500", "bg-pink-500", "bg-teal-500",
  "bg-orange-500", "bg-indigo-500", "bg-red-500", "bg-cyan-500",
];

function getInitials(name: string): string {
  return name.split(" ").map((w) => w[0] ?? "").join("").toUpperCase().slice(0, 2) || "??";
}

function getAvatarColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function StreakBadge({ streak }: { streak: number }) {
  if (streak < 1) return null;
  const flameColor = streak >= 30 ? "text-red-500" : streak >= 7 ? "text-orange-500" : "text-amber-400";
  return (
    <span className={cn("flex items-center gap-0.5 text-[10px] font-bold", flameColor)}>
      <Flame className={cn("w-3 h-3 fill-current", flameColor)} />
      {streak}
    </span>
  );
}

function PodiumCard({ entry, pos }: { entry: LeaderboardEntry; pos: "first" | "second" | "third" }) {
  const medals = { first: "🥇", second: "🥈", third: "🥉" };
  const sizes = { first: "w-16 h-16 text-lg", second: "w-[52px] h-[52px] text-base", third: "w-11 h-11 text-sm" };
  const orders = { first: "order-2", second: "order-1", third: "order-3" };
  const labelSize = { first: "text-sm", second: "text-xs", third: "text-xs" };
  const scoreSize = { first: "text-base", second: "text-sm", third: "text-sm" };
  const rankSizes = {
    first: "w-10 h-10 text-lg bg-yellow-400",
    second: "w-9 h-9 bg-gray-400",
    third: "w-8 h-8 text-sm bg-amber-700",
  };
  const avatarColor = getAvatarColor(entry.userId);
  const displayFirst = entry.displayName.split(" ")[0] ?? entry.displayName;

  return (
    <div className={cn("flex flex-col items-center gap-1.5 px-3", orders[pos])}>
      <span className="text-2xl">{medals[pos]}</span>
      <div className={cn("rounded-full border-4 border-white shadow-lg flex items-center justify-center font-extrabold text-white", avatarColor, sizes[pos])}>
        {getInitials(entry.displayName)}
      </div>
      <p className={cn("font-bold text-foreground text-center leading-tight", labelSize[pos])}>{displayFirst}</p>
      {entry.currentStreak > 0 && <StreakBadge streak={entry.currentStreak} />}
      <div className={cn("flex items-center gap-1 font-extrabold text-primary", scoreSize[pos])}>
        <Trophy className={cn("shrink-0", pos === "first" ? "w-4 h-4" : "w-3 h-3")} />
        {entry.totalPoints.toLocaleString()}
      </div>
      <div className={cn("rounded-full flex items-center justify-center text-white font-bold shadow-md", rankSizes[pos])}>
        {entry.rank}
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState<Tab>("allTime");
  const { data: entries = [], isLoading } = useGetLeaderboard({ limit: 20, period: activeTab === "allTime" ? undefined : activeTab });

  const top3 = entries.slice(0, 3);
  const rest  = entries.slice(3);

  return (
    <PageTransition className="min-h-screen bg-gray-50 pb-6">

      <div className="bg-gradient-to-br from-violet-700 to-purple-600 px-4 pt-5 pb-8 text-white">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-yellow-300" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold leading-tight">Leaderboard</h1>
            <p className="text-xs text-violet-200">Top aspirants across India</p>
          </div>
        </div>
      </div>

      <div className="px-4 -mt-4 space-y-4">          <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-1 flex gap-1">
            {TABS.map((tab) => (
              <Button
                key={tab.key}
                variant={activeTab === tab.key ? "default" : "ghost"}
                size="sm"
                onClick={() => setActiveTab(tab.key)}
                className="flex-1 rounded-xl text-xs font-bold"
              >
                {tab.label}
              </Button>
            ))}
          </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl border border-border/50 shadow-sm flex items-center justify-center py-12">
            <div className="w-7 h-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="bg-white rounded-2xl border border-border/50 shadow-sm py-10 px-6 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Trophy className="w-7 h-7 text-primary/60" />
            </div>
            <p className="font-bold text-foreground">No entries yet!</p>
            <p className="text-sm text-muted-foreground">Be the first to appear on the leaderboard. Start solving quizzes to earn points and build your streak.</p>
          </div>
        ) : (
          <>
            {top3.length >= 3 && (
              <div className="bg-white rounded-2xl border border-border/50 shadow-sm py-5 px-2">
                <div className="flex items-end justify-center gap-2">
                  <PodiumCard entry={top3[1]} pos="second" />
                  <PodiumCard entry={top3[0]} pos="first" />
                  <PodiumCard entry={top3[2]} pos="third" />
                </div>
              </div>
            )}

            {(top3.length < 3 ? entries : rest).length > 0 && (
              <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-border/40 flex items-center justify-between">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    {top3.length < 3 ? "Rankings" : "More Rankings"}
                  </p>
                  <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground">
                    <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-teal-500" />Quiz</span>
                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3 text-violet-500" />Mock</span>
                    <span className="flex items-center gap-1"><RotateCcw className="w-3 h-3 text-pink-500" />PYQ</span>
                  </div>
                </div>

                {(top3.length < 3 ? entries : rest).map((entry, idx, arr) => (
                  <div key={entry.userId} className={cn("flex items-center gap-3 px-4 py-3", idx !== arr.length - 1 && "border-b border-border/30")}>
                    <span className="w-6 text-center text-sm font-extrabold text-muted-foreground shrink-0">{entry.rank}</span>
                    <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-extrabold shrink-0", getAvatarColor(entry.userId))}>
                      {getInitials(entry.displayName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold text-foreground truncate">{entry.displayName}</p>
                        {entry.currentStreak > 0 && <StreakBadge streak={entry.currentStreak} />}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold shrink-0">
                      <span className="text-teal-600">{entry.quizCount}</span>
                      <span className="text-violet-600">{entry.mockCount}</span>
                      <span className="text-pink-600">{entry.pyqCount}</span>
                    </div>
                    <div className="text-right shrink-0 ml-1">
                      <p className="text-sm font-extrabold text-primary">{entry.totalPoints.toLocaleString()}</p>
                      <p className="text-[9px] text-muted-foreground">pts</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <ClientSignedOut>
          <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 rounded-2xl p-4 text-center space-y-2">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <p className="font-bold text-sm text-foreground">Want to appear on the leaderboard?</p>
            <p className="text-xs text-muted-foreground">Sign in and start solving quizzes, mock tests and PYQs to earn points!</p>
            <Link href="/sign-in">
              <Button size="sm" className="rounded-xl">
                Sign In to Compete
              </Button>
            </Link>
          </div>
        </ClientSignedOut>

        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-4">
          <p className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-400" /> How Points Are Earned
          </p>
          <div className="space-y-2">
            {[
              { icon: Zap,      color: "text-teal-600 bg-teal-100",    label: "Quiz question correct",  pts: "+5 pts" },
              { icon: BookOpen, color: "text-violet-600 bg-violet-100", label: "Mock test completed",    pts: "+50 pts" },
              { icon: RotateCcw, color: "text-pink-600 bg-pink-100",   label: "PYQ solved correctly",   pts: "+3 pts" },
              { icon: Flame,    color: "text-orange-600 bg-orange-100", label: "Daily streak bonus",     pts: "+20 pts" },
            ].map(({ icon: Icon, color, label, pts }) => (
              <div key={label} className="flex items-center gap-3">
                <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", color.split(" ")[1])}>
                  <Icon className={cn("w-3.5 h-3.5", color.split(" ")[0])} />
                </div>
                <span className="flex-1 text-xs text-muted-foreground">{label}</span>
                <span className="text-xs font-extrabold text-primary">{pts}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </PageTransition>
  );
}
