"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Eye,
  Edit,
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Timer,
  HelpCircle,
} from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Empty, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAdminFetch } from "@/hooks/useAdminFetch";
import { ConfirmDeleteDialog } from "@/components/admin/ConfirmDeleteDialog";
import { QuestionSelector } from "@/components/admin/QuestionSelector";

interface BatchQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string | null;
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface DailyQuiz {
  id: string;
  title: string;
  description?: string | null;
  scheduledDate: string;
  scheduledTime: string;
  durationMinutes: number;
  totalQuestions: number;
  questionIds: string[];
  isPublished?: boolean | null;
  createdAt?: string;
  updatedAt?: string;
}

interface DailyQuizzesResponse {
  quizzes: DailyQuiz[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ── Countdown hook ────────────────────────────────────────────────────────────
function useCountdown(targetDate: string, targetTime: string) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const target = new Date(`${targetDate}T${targetTime}`);

    function tick() {
      const now = new Date();
      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        setRemaining("Now live!");
        return;
      }

      const days = Math.floor(diff / 86400000);
      const hours = Math.floor((diff % 86400000) / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      const secs = Math.floor((diff % 60000) / 1000);

      if (days > 0) setRemaining(`${days}d ${hours}h ${mins}m`);
      else if (hours > 0) setRemaining(`${hours}h ${mins}m ${secs}s`);
      else setRemaining(`${mins}m ${secs}s`);
    }

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetDate, targetTime]);

  return remaining;
}

function CountdownBadge({ date, time }: { date: string; time: string }) {
  const countdown = useCountdown(date, time);
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 whitespace-nowrap">
      <Timer className="w-3 h-3" />
      {countdown}
    </span>
  );
}

// ── Animation variants ────────────────────────────────────────────────────────
const pageVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const tableRowVariants: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.05, duration: 0.28, ease: "easeOut" },
  }),
  exit: { opacity: 0, x: 12, transition: { duration: 0.2 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.99 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: "easeOut" },
  },
};

const fieldVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.28, ease: "easeOut" },
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────
export default function DailyQuizzesAdminPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const adminFetch = useAdminFetch();
  const [page, setPage] = useState(1);

  // Sheet (create/edit)
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<DailyQuiz | null>(null);

  // Dialog (detail)
  const [viewingItem, setViewingItem] = useState<DailyQuiz | null>(null);

  // Delete
  const [deleteTargetId, setDeleteId] = useState<string | null>(null);

  // ── Form state ────────────────────────────────────────────────────────────
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formDuration, setFormDuration] = useState(30);
  const [formPublished, setFormPublished] = useState(false);
  const [formError, setFormError] = useState("");
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  // Countdown timer for form
  const formCountdown = useMemo(() => {
    if (!formDate || !formTime) return "";
    const target = new Date(`${formDate}T${formTime}`);
    const now = new Date();
    const diff = target.getTime() - now.getTime();
    if (diff <= 0) return "Immediately (overdue)";
    const hrs = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    return `Publishes in ${hrs}h ${mins}m`;
  }, [formDate, formTime]);

  // Sync form when sheet opens
  useEffect(() => {
    if (sheetOpen) {
      if (editingItem) {
        setFormTitle(editingItem.title);
        setFormDescription(editingItem.description ?? "");
        setFormDate(editingItem.scheduledDate);
        setFormTime(editingItem.scheduledTime);
        setFormDuration(editingItem.durationMinutes);
        setSelectedQuestionIds(editingItem.questionIds ?? []);
        setFormPublished(editingItem.isPublished ?? false);
      } else {
        setFormTitle("");
        setFormDescription("");
        setFormDate("");
        setFormTime("");
        setFormDuration(30);
        setSelectedQuestionIds([]);
        setFormPublished(false);
      }
      setFormError("");
    }
  }, [sheetOpen, editingItem]);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data, isLoading, error } = useQuery<DailyQuizzesResponse>({
    queryKey: ["admin", "daily-quizzes", page],
    queryFn: () =>
      adminFetch<DailyQuizzesResponse>(
        `/api/admin/daily-quizzes?page=${page}&limit=20`,
      ),
    staleTime: 0,
  });

  const quizzes = data?.quizzes ?? [];
  const totalPages = data?.pagination?.totalPages ?? 1;

  // Reset to page 1 if current page exceeds total pages (e.g. after deleting items on the last page)
  useEffect(() => {
    if (data && data.pagination.total > 0 && page > data.pagination.totalPages) {
      setPage(1);
    }
  }, [data, page]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "daily-quizzes"] });

  const createMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) =>
      adminFetch<DailyQuiz>("/api/admin/daily-quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: (_, variables) => {
      invalidate();
      // Calculate time until the quiz becomes visible
      const scheduledAt = new Date(`${variables.scheduledDate}T${variables.scheduledTime}`);
      const now = new Date();
      const diffMs = scheduledAt.getTime() - now.getTime();
      let timeUntil = "";
      if (diffMs <= 0) {
        timeUntil = "already due — will show immediately";
      } else {
        const diffMins = Math.floor(diffMs / 60000);
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        if (hours > 0) timeUntil = `in ${hours}h ${mins}m (${scheduledAt.toLocaleString()})`;
        else timeUntil = `in ${mins}m (${scheduledAt.toLocaleString()})`;
      }
      toast({ title: "Quiz Created!", description: `Will be shown to users ${timeUntil}` });
      setSheetOpen(false);
    },
    onError: (err: Error) => {
      setFormError(err.message || "Failed to create");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      adminFetch<DailyQuiz>(`/api/admin/daily-quizzes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      invalidate();
      toast({ title: "Saved!", description: "Changes applied." });
      setSheetOpen(false);
    },
    onError: (err: Error) => {
      setFormError(err.message || "Failed to update");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) =>
      adminFetch<Record<string, unknown>>(`/api/admin/daily-quizzes/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidate();
      setDeleteId(null);
      toast({ title: "Deleted", description: "Quiz removed." });
    },
    onError: (err: Error) =>
      toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingItem(null);
    setSheetOpen(true);
  };

  const openEdit = (item: DailyQuiz) => {
    setEditingItem(item);
    setSheetOpen(true);
  };

  const openView = (item: DailyQuiz) => {
    setViewingItem(item);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formTitle.trim() || !formDate || !formTime) {
      setFormError("Title, Date, and Time are required.");
      return;
    }

    const payload = {
      title: formTitle.trim(),
      description: formDescription.trim() || null,
      scheduledDate: formDate,
      scheduledTime: formTime,
      durationMinutes: Number(formDuration),
      totalQuestions: selectedQuestionIds.length,
      questionIds: selectedQuestionIds,
      isPublished: formPublished,
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <TooltipProvider>
      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        className="max-w-6xl mx-auto space-y-6 p-2 sm:p-4"
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <motion.div
              whileHover={{ rotate: [0, -8, 8, 0], scale: 1.05 }}
              transition={{ duration: 0.45 }}
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0"
            >
              <CalendarDays className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                Daily Quizzes
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {data?.pagination?.total ?? 0} total quizzes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <AnimatePresence>
              {quizzes.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="hidden sm:flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5"
                >
                  <motion.span
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ repeat: Infinity, duration: 2.2 }}
                    className="w-2 h-2 rounded-full bg-emerald-500 inline-block"
                  />
                  <span className="text-xs font-semibold text-indigo-700">
                    {quizzes.length} shown
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 380, damping: 20 }}
            >
              <Button
                onClick={openCreate}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 h-10 font-bold gap-1.5 shadow-md shadow-indigo-200"
              >
                <Plus className="w-4 h-4" /> New Quiz
              </Button>
            </motion.div>
          </div>
        </div>

        {/* ── Table Card ──────────────────────────────────────────────────── */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="rounded-2xl border border-border/50 bg-white shadow-sm overflow-hidden"
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
              >
                <Loader2 className="w-7 h-7 text-indigo-500" />
              </motion.div>
              <p className="text-sm text-muted-foreground">Loading quizzes…</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-500">
              Failed to load quizzes
            </div>
          ) : quizzes.length === 0 ? (
            <div className="py-16 px-6">
              <Empty>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
                    <CalendarDays className="w-7 h-7 text-indigo-400" />
                  </div>
                  <EmptyTitle>No quizzes yet</EmptyTitle>
                  <EmptyDescription>
                    Click &quot;New Quiz&quot; above to schedule your first daily quiz.
                  </EmptyDescription>
                  <Button
                    onClick={openCreate}
                    variant="outline"
                    className="mt-4 rounded-xl gap-1.5 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                  >
                    <Plus className="w-4 h-4" /> Create one
                  </Button>
                </motion.div>
              </Empty>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/70 hover:bg-gray-50/70">
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-gray-500 pl-5">
                      Title
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-gray-500">
                      Schedule
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-gray-500">
                      Duration
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-gray-500">
                      Qs
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-gray-500">
                      Status
                    </TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-gray-500">
                      Countdown
                    </TableHead>
                    <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-gray-500 pr-5">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {quizzes.map((q, i) => (
                      <motion.tr
                        key={q.id}
                        custom={i}
                        variants={tableRowVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout
                        className="group border-b border-border/40 hover:bg-gray-50/60 transition-colors"
                      >
                        <TableCell className="pl-5 py-3.5 max-w-[200px]">
                          <div className="flex items-start gap-2.5">
                            <div className="mt-0.5 w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
                              <CalendarDays className="w-3.5 h-3.5 text-indigo-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-1">
                                {q.title}
                              </p>
                              {q.description && (
                                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                  {q.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-semibold text-gray-600 flex flex-col gap-0.5">
                            <span className="flex items-center gap-1">
                              <CalendarDays className="w-3 h-3 text-gray-400" />
                              {q.scheduledDate}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-gray-400" />
                              {q.scheduledTime}
                            </span>
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-semibold text-gray-600">
                            {q.durationMinutes}m
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-bold text-gray-700">
                            {q.totalQuestions}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${
                              q.isPublished
                                ? "bg-emerald-50 border-emerald-200 text-indigo-700"
                                : "bg-gray-50 border-gray-200 text-gray-400"
                            }`}
                          >
                            {q.isPublished ? (
                              <CheckCircle2 className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            {q.isPublished ? "Published" : "Draft"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <CountdownBadge date={q.scheduledDate} time={q.scheduledTime} />
                        </TableCell>
                        <TableCell className="text-right pr-5">
                          <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-lg hover:bg-indigo-50 hover:text-indigo-600"
                                    onClick={() => openView(q)}
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                </motion.div>
                              </TooltipTrigger>
                              <TooltipContent>View</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-lg hover:bg-amber-50 hover:text-amber-600"
                                    onClick={() => openEdit(q)}
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                </motion.div>
                              </TooltipTrigger>
                              <TooltipContent>Edit</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600"
                                    onClick={() => setDeleteId(q.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </motion.div>
                              </TooltipTrigger>
                              <TooltipContent>Delete</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          )}
        </motion.div>

        {/* ── Pagination ──────────────────────────────────────────────────── */}
        {data && data.pagination.total > 0 && totalPages > 1 && (
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="flex items-center justify-between"
          >
            <span className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg h-9"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg h-9"
              >
                Next
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Create/Edit Sheet ───────────────────────────────────────────── */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent
            side="right"
            className="w-full sm:max-w-md flex flex-col gap-0 p-0 overflow-hidden"
          >
            <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                  className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center"
                >
                  <CalendarDays className="w-5 h-5 text-indigo-600" />
                </motion.div>
                <div>
                  <SheetTitle className="text-base font-bold text-gray-900">
                    {editingItem ? "Edit Quiz" : "New Daily Quiz"}
                  </SheetTitle>
                  <SheetDescription className="text-xs text-muted-foreground">
                    {editingItem
                      ? "Update the quiz details below."
                      : "Configure and schedule a new daily quiz."}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <form
              onSubmit={handleSubmit}
              className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-4"
            >
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">
                  {formError}
                </div>
              )}

              <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Title *</Label>
                <Input
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Daily GK Quiz 22"
                  required
                  className="rounded-xl h-10 border-border/70 focus-visible:ring-indigo-500/30"
                />
              </motion.div>

              <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Description</Label>
                <Textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Optional description..."
                  rows={2}
                  className="rounded-xl border-border/70 resize-none focus-visible:ring-indigo-500/30"
                />
              </motion.div>

              <div className="grid grid-cols-2 gap-3">
                <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Date *</Label>
                  <Input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    required
                    className="rounded-xl h-10 border-border/70 focus-visible:ring-indigo-500/30"
                  />
                </motion.div>
                <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Time *</Label>
                  <Input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    required
                    className="rounded-xl h-10 border-border/70 focus-visible:ring-indigo-500/30"
                  />
                </motion.div>
              </div>

              {/* Countdown Timer Display */}
              {formDate && formTime && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl"
                >
                  <Timer className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-semibold text-amber-700">
                    {formCountdown}
                  </span>
                </motion.div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <motion.div custom={4} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Duration (mins)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="rounded-xl h-10 border-border/70 focus-visible:ring-indigo-500/30"
                  />
                </motion.div>
              </div>

              {/* Question Selector */}
              <motion.div custom={6} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-3 pt-2 border-t">
                <div>
                  <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide">Select Questions</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Choose questions for this quiz ({selectedQuestionIds.length} selected)</p>
                </div>
                <QuestionSelector selectedIds={selectedQuestionIds} onChange={setSelectedQuestionIds} />
              </motion.div>

              <motion.div custom={7} variants={fieldVariants} initial="hidden" animate="visible" className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formPublished}
                    onChange={(e) => setFormPublished(e.target.checked)}
                    className="accent-indigo-600 w-4 h-4"
                  />
                  <span className="text-xs font-semibold text-gray-700">Publish immediately</span>
                </label>
              </motion.div>
            </form>

            <div className="px-6 py-4 border-t bg-gray-50/60 flex gap-2.5 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSheetOpen(false)}
                className="flex-1 rounded-xl font-semibold"
              >
                Cancel
              </Button>
              <motion.div
                className="flex-1"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 380, damping: 20 }}
              >
                <Button
                  type="submit"
                  disabled={isPending || !formTitle.trim() || !formDate || !formTime}
                  onClick={handleSubmit}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-200 gap-2"
                >
                  {isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                  ) : editingItem ? (
                    "Save Changes"
                  ) : (
                    "Create Quiz"
                  )}
                </Button>
              </motion.div>
            </div>
          </SheetContent>
        </Sheet>

        {/* ── Detail Dialog with question previews ──────────────────────── */}
        <Dialog open={!!viewingItem} onOpenChange={(open) => !open && setViewingItem(null)}>
          <DialogContent className="sm:max-w-lg max-h-[85vh]">
            {viewingItem && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-indigo-500" />
                    {viewingItem.title}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Quiz details and questions preview
                  </DialogDescription>
                </DialogHeader>

                {/* Quiz metadata */}
                <div className="space-y-3">
                  {viewingItem.description && (
                    <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-3">
                      <p className="text-xs text-gray-600">{viewingItem.description}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-3">
                      <p className="text-gray-400 font-semibold uppercase tracking-wide">Date</p>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">{viewingItem.scheduledDate}</p>
                    </div>
                    <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-3">
                      <p className="text-gray-400 font-semibold uppercase tracking-wide">Time</p>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">{viewingItem.scheduledTime}</p>
                    </div>
                    <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-3">
                      <p className="text-gray-400 font-semibold uppercase tracking-wide">Duration</p>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">{viewingItem.durationMinutes} min</p>
                    </div>
                    <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-3">
                      <p className="text-gray-400 font-semibold uppercase tracking-wide">Questions</p>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">{viewingItem.totalQuestions}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${
                      viewingItem.isPublished
                        ? "bg-emerald-50 border-emerald-200 text-indigo-700"
                        : "bg-gray-50 border-gray-200 text-gray-400"
                    }`}>
                      {viewingItem.isPublished ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <XCircle className="w-3 h-3" />
                      )}
                      {viewingItem.isPublished ? "Published" : "Draft"}
                    </span>
                    <CountdownBadge date={viewingItem.scheduledDate} time={viewingItem.scheduledTime} />
                  </div>
                </div>

                {/* Questions preview */}
                <div className="border-t pt-3 mt-1">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5" />
                    Questions ({viewingItem.questionIds?.length ?? 0})
                  </h4>
                  <QuestionPreview questionIds={viewingItem.questionIds ?? []} />
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* ── Delete Confirm ──────────────────────────────────────────────── */}
        <ConfirmDeleteDialog
          isOpen={deleteTargetId !== null}
          onClose={() => setDeleteId(null)}
          onConfirm={() => {
            if (deleteTargetId !== null) deleteMutation.mutate(deleteTargetId);
          }}
        />
      </motion.div>
    </TooltipProvider>
  );
}

// ── Question Preview Component ────────────────────────────────────────────
function QuestionPreview({ questionIds }: { questionIds: string[] }) {
  const adminFetch = useAdminFetch();
  if (!questionIds.length) {
    return (
      <p className="text-xs text-gray-400 italic py-3 text-center">No questions selected for this quiz.</p>
    );
  }

  const { data, isLoading, error } = useQuery<{ data: BatchQuestion[] }>({
    queryKey: ["admin", "daily-quizzes", "question-preview", questionIds.join(",")],
    queryFn: () => {
      const params = new URLSearchParams();
      questionIds.forEach((id) => params.append("ids", id));
      return adminFetch<{ data: BatchQuestion[] }>(`/api/questions/batch?${params.toString()}`);
    },
    staleTime: 60000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <p className="text-xs text-red-500 italic py-3 text-center">Failed to load question previews.</p>
    );
  }

  const questions = data.data;

  return (
    <ScrollArea className="max-h-[280px] pr-2">
      <div className="space-y-2">
        {questions.map((q, i) => (
          <div key={q.id} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div className="flex items-start gap-2">
              <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold mt-0.5">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-gray-900 leading-snug line-clamp-2">
                  {q.text}
                </p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[10px] font-medium text-gray-400">
                    4 options | Correct: {String.fromCharCode(65 + q.correctIndex)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
