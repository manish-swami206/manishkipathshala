"use client";

import { useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { PageTransition } from "@/components/shared/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  User, Lock, BookOpen, FlaskConical, RotateCcw,
  LogOut, ChevronRight, CheckCircle2, Star,
  Pencil, Save, X, Eye, EyeOff, Flame, Trophy, Zap,
  Clock, FileText, TrendingUp
} from "lucide-react";
import { useGetMyStreak, useRecordActivity, customFetch, useMyAttempts } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color }: {
  icon: React.ElementType; label: string; value: string | number; color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-4 flex flex-col items-center text-center gap-1.5">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", color)}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-xl font-extrabold text-foreground">{value}</p>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide leading-tight">{label}</p>
    </div>
  );
}

// ─── Profile Page ─────────────────────────────────────────────────────────────
export default function Profile() {
  return <ProfileContent />;
}

function ProfileContent() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { data: streakData } = useGetMyStreak();

  const [editingName, setEditingName] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);
  const { mutateAsync: recordActivity } = useRecordActivity();

  const [changingPw, setChangingPw] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const { data: myAttempts = [], isLoading: loadingAttempts } = useMyAttempts();

  if (!isLoaded || !user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const fullName = user.fullName || `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Learner";
  const email = user.primaryEmailAddress?.emailAddress ?? "";
  const initials = fullName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
  const memberSince = user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : "—";

  const currentStreak = streakData?.currentStreak ?? 0;
  const longestStreak = streakData?.longestStreak ?? 0;
  const totalPoints   = streakData?.totalPoints ?? 0;
  const quizCount     = streakData?.quizCount ?? 0;
  const mockCount     = streakData?.mockCount ?? 0;
  const pyqCount      = streakData?.pyqCount ?? 0;

  const streakColor = currentStreak >= 30 ? "text-orange-500" : currentStreak >= 7 ? "text-amber-500" : "text-rose-500";

  const handleStartEditName = () => {
    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
    setEditingName(true);
    setNameSuccess(false);
  };

  const handleSaveName = async () => {
    setSavingName(true);
    try {
      await user.update({ firstName: firstName.trim(), lastName: lastName.trim() });
      // Sync display name with streaks table
      const displayName = `${firstName.trim()} ${lastName.trim()}`.trim() || "Learner";
      await recordActivity({ data: { activityType: "login", displayName } }).catch(() => {});
      setEditingName(false);
      setNameSuccess(true);
      setTimeout(() => setNameSuccess(false), 3000);
    } catch {
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePw = async () => {
    setPwError("");
    if (newPw !== confirmPw) { setPwError("Passwords do not match."); return; }
    if (newPw.length < 8) { setPwError("New password must be at least 8 characters."); return; }
    setSavingPw(true);
    try {
      await user.updatePassword({ currentPassword: currentPw, newPassword: newPw });
      setPwSuccess(true);
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      setChangingPw(false);
      setTimeout(() => setPwSuccess(false), 4000);
    } catch (e: unknown) {
      const err = e as { errors?: Array<{ message?: string }> } | null;
      setPwError(err?.errors?.[0]?.message ?? "Failed to change password. Check your current password.");
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <PageTransition className="min-h-screen bg-gray-50 pb-8">
      
      {/* ── Hero ── */}
      <div className="relative bg-gradient-to-br from-violet-700 to-purple-600 pt-10 pb-16 px-4 text-white text-center">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/5" />
          <div className="absolute -bottom-6 -left-6 w-32 h-32 rounded-full bg-white/5" />
        </div>
        <div className="relative z-10 space-y-3">
          <div className="relative inline-block">
            <Avatar className="w-20 h-20 border-4 border-white/30 shadow-xl">
              <AvatarImage src={user.imageUrl} />
              <AvatarFallback className="bg-violet-800 text-white font-bold text-2xl">{initials}</AvatarFallback>
            </Avatar>
            {/* Streak flame badge on avatar */}
            {currentStreak > 0 && (
              <div className="absolute -bottom-1 -right-1 bg-orange-500 border-2 border-white rounded-full w-7 h-7 flex items-center justify-center shadow-md">
                <Flame className="w-3.5 h-3.5 text-white fill-white" />
              </div>
            )}
          </div>
          <div>
            <h1 className="text-xl font-extrabold leading-tight">{fullName}</h1>
            <p className="text-sm text-violet-200 mt-0.5">{email}</p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold">
                <Star className="w-3 h-3 fill-yellow-300 text-yellow-300" />
                Active Learner · Since {memberSince}
              </div>
              {currentStreak > 0 && (
                <div className="inline-flex items-center gap-1 bg-orange-500/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold">
                  <Flame className="w-3 h-3 fill-white" />
                  {currentStreak} day streak
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">

        {/* ── Streak + Points Banner ── */}
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Flame className={cn("w-5 h-5 fill-current", currentStreak > 0 ? "text-orange-500" : "text-gray-300")} />
                <span className="text-2xl font-extrabold text-foreground">{currentStreak}</span>
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Day Streak</p>
            </div>
            <div className="text-center border-x border-border/50">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Trophy className="w-4 h-4 text-yellow-500 fill-yellow-400" />
                <span className="text-2xl font-extrabold text-foreground">{totalPoints.toLocaleString()}</span>
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Points</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Zap className="w-4 h-4 text-violet-500" />
                <span className="text-2xl font-extrabold text-foreground">{longestStreak}</span>
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Best Streak</p>
            </div>
          </div>
          {currentStreak === 0 && (
            <p className="text-center text-xs text-muted-foreground mt-3 bg-gray-50 rounded-xl py-2 px-3">
              🎯 Start solving quizzes to build your streak and earn points!
            </p>
          )}
        </div>

        {/* ── Activity Stats ── */}
        <div className="grid grid-cols-3 gap-2.5">
          <StatCard icon={FlaskConical} label="Quizzes"   value={quizCount} color="bg-teal-100 text-teal-600" />
          <StatCard icon={BookOpen}    label="Mock Tests" value={mockCount} color="bg-violet-100 text-violet-600" />
          <StatCard icon={RotateCcw}   label="PYQs"       value={pyqCount}  color="bg-pink-100 text-pink-600" />
        </div>

        {/* ── Success banners ── */}
        {nameSuccess && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-2.5 text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4" /> Profile updated successfully!
          </div>
        )}
        {pwSuccess && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-2.5 text-sm font-semibold">
            <CheckCircle2 className="w-4 h-4" /> Password changed successfully!
          </div>
        )}

        {/* ── Profile details ── */}
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <span className="font-bold text-sm">Profile Details</span>
            </div>
            {!editingName && (
              <Button variant="ghost" size="sm" onClick={handleStartEditName} className="flex items-center gap-1 text-xs text-primary">
                <Pencil className="w-3 h-3" /> Edit
              </Button>
            )}
          </div>

          <div className="p-5 space-y-4">
            {editingName ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">First Name</Label>
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="h-10 rounded-xl text-sm" placeholder="First name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Last Name</Label>
                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-10 rounded-xl text-sm" placeholder="Last name" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveName} disabled={savingName} className="flex-1 rounded-xl h-9 gap-1.5 bg-violet-600 hover:bg-violet-700">
                    <Save className="w-3.5 h-3.5" />
                    {savingName ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingName(false)} className="rounded-xl h-9 px-3">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Full Name</p>
                  <p className="text-sm font-semibold text-foreground">{fullName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Email Address</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{email}</p>
                    {user.primaryEmailAddress?.verification?.status === "verified" && (
                      <span className="text-[9px] font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full uppercase tracking-wide">Verified</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Member Since</p>
                  <p className="text-sm font-semibold text-foreground">{memberSince}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Change Password ── */}
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between px-5 py-4 border-b border-border/50 rounded-none"
            onClick={() => { setChangingPw(!changingPw); setPwError(""); }}
          >
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" />
              <span className="font-bold text-sm">Change Password</span>
            </div>
            <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform", changingPw && "rotate-90")} />
          </Button>

          {changingPw && (
            <div className="p-5 space-y-3">
              {user.passwordEnabled ? (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Current Password</Label>
                    <div className="relative">
                      <Input
                        type={showCurrentPw ? "text" : "password"}
                        value={currentPw}
                        onChange={(e) => setCurrentPw(e.target.value)}
                        className="h-10 rounded-xl text-sm pr-10"
                        placeholder="Enter current password"
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground h-8 w-8">
                        {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">New Password</Label>
                    <div className="relative">
                      <Input
                        type={showNewPw ? "text" : "password"}
                        value={newPw}
                        onChange={(e) => setNewPw(e.target.value)}
                        className="h-10 rounded-xl text-sm pr-10"
                        placeholder="Min. 8 characters"
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => setShowNewPw(!showNewPw)} className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground h-8 w-8">
                        {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Confirm New Password</Label>
                    <Input
                      type="password"
                      value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)}
                      className="h-10 rounded-xl text-sm"
                      placeholder="Repeat new password"
                    />
                  </div>
                  {pwError && (
                    <p className="text-xs text-red-600 font-medium bg-red-50 px-3 py-2 rounded-xl border border-red-100">{pwError}</p>
                  )}
                  <Button
                    onClick={handleChangePw}
                    disabled={savingPw || !currentPw || !newPw || !confirmPw}
                    className="w-full rounded-xl h-10 bg-violet-600 hover:bg-violet-700"
                  >
                    {savingPw ? "Updating..." : "Update Password"}
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Your account uses Google / social login. Password change is not available.
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Attempt History ── */}
        <div className="bg-white rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between px-5 py-4 rounded-none"
            onClick={() => setShowHistory(!showHistory)}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="font-bold text-sm">Attempt History</span>
            </div>
            <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform", showHistory && "rotate-90")} />
          </Button>

          {showHistory && (
            <div className="p-5 space-y-3 max-h-[400px] overflow-y-auto">
              {loadingAttempts ? (
                <div className="text-center py-6 text-sm text-muted-foreground">Loading...</div>
              ) : myAttempts.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground">No attempts yet. Start a quiz or mock test!</div>
              ) : (
                myAttempts.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <p className="text-sm font-bold text-gray-900">
                          {attempt.examId ? `Mock Test` : `Daily Quiz`}
                        </p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        attempt.isPassed
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-red-50 text-red-600 border border-red-100"
                      }`}>
                        {attempt.isPassed ? "PASSED" : "FAILED"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-gray-100 text-xs">
                      <span className="font-semibold text-gray-500">
                        {new Date(attempt.attemptedAt).toLocaleDateString()} - {new Date(attempt.attemptedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="font-extrabold text-violet-600">
                        {attempt.score} / {attempt.totalMarks}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ── Sign Out ── */}
        <Button
          variant="outline"
          onClick={() => signOut({ redirectUrl: "/" })}
          className="w-full flex items-center justify-between rounded-2xl px-5 py-4 text-red-600 hover:bg-red-50 border-border/50"
        >
          <div className="flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            <span className="font-bold text-sm">Sign Out</span>
          </div>
          <ChevronRight className="w-4 h-4" />
        </Button>

      </div>
    </PageTransition>
  );
}
