"use client";

import { useRef, useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Eye,
  Edit,
  Search,
  BookOpen,
  Loader2,
  Upload,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
} from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useToast } from "@/hooks/use-toast";
import { useListSubjects } from "@/lib/api";
import { useAdminFetch } from "@/hooks/useAdminFetch";
import { ApiError } from "@/lib/api/client";
import { ConfirmDeleteDialog } from "@/components/admin/ConfirmDeleteDialog";
import { CsvImportReview } from "@/components/admin/CsvImportReview";
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
import { AlertTriangle, ClipboardList, FileText } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Question {
  id: string;
  text: string;
  subject: string | null;
  difficulty?: string | null;
  correctIndex: number;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  explanation?: string | null;
  negativeMarking?: number;
  createdAt?: string;
}

interface QuestionsResponse {
  data: Question[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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
export default function QuestionsAdminPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const adminFetch = useAdminFetch();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [filterSubject, setFilterSubject] = useState("All");
  const [filterDifficulty, setFilterDifficulty] = useState("All");

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Detail Dialog
  const [viewingItem, setViewingItem] = useState<Question | null>(null);

  // Sheet (create/edit)
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Question | null>(null);

  // Delete
  const [deleteTargetId, setDeleteId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [deleteWarning, setDeleteWarning] = useState<{
    message: string;
    references: { examSets: number; mockTests: number; dailyQuizzes: number; total: number };
    pendingIds?: string[];
  } | null>(null);

  // CSV import
  const csvImportRef = useRef<HTMLInputElement>(null);

  // Subjects
  const { data: pyqSubjects = [] } = useListSubjects();

  // ── Form state ────────────────────────────────────────────────────────────
  const [formText, setFormText] = useState("");
  const [formOptionA, setFormOptionA] = useState("");
  const [formOptionB, setFormOptionB] = useState("");
  const [formOptionC, setFormOptionC] = useState("");
  const [formOptionD, setFormOptionD] = useState("");
  const [formCorrectIndex, setFormCorrectIndex] = useState(0);
  const [formExplanation, setFormExplanation] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formDifficulty, setFormDifficulty] = useState("medium");
  const [formNegMarking, setFormNegMarking] = useState(0);
  const [formError, setFormError] = useState("");

  // Sync form when sheet opens
  useEffect(() => {
    if (sheetOpen) {
      if (editingItem) {
        setFormText(editingItem.text);
        setFormOptionA(editingItem.optionA ?? "");
        setFormOptionB(editingItem.optionB ?? "");
        setFormOptionC(editingItem.optionC ?? "");
        setFormOptionD(editingItem.optionD ?? "");
        setFormCorrectIndex(editingItem.correctIndex ?? 0);
        setFormExplanation(editingItem.explanation ?? "");
        setFormSubject(editingItem.subject ?? "");
        setFormDifficulty(editingItem.difficulty ?? "medium");
        setFormNegMarking(editingItem.negativeMarking ?? 0);
      } else {
        setFormText("");
        setFormOptionA("");
        setFormOptionB("");
        setFormOptionC("");
        setFormOptionD("");
        setFormCorrectIndex(0);
        setFormExplanation("");
        setFormSubject("");
        setFormDifficulty("medium");
        setFormNegMarking(0);
      }
      setFormError("");
    }
  }, [sheetOpen, editingItem]);

  // ── Debounced search ──────────────────────────────────────────────────────
  const handleSearch = (v: string) => {
    setSearch(v);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(v);
      setPage(1);
    }, 400);
  };

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data, isLoading } = useQuery<QuestionsResponse>({
    queryKey: ["admin", "questions", page, debouncedSearch, filterSubject, filterDifficulty],
    queryFn: () => {
      const sp = new URLSearchParams({ page: String(page), limit: "20" });
      if (debouncedSearch.trim()) sp.set("search", debouncedSearch.trim());
      if (filterSubject !== "All") sp.set("subject", filterSubject);
      if (filterDifficulty !== "All") sp.set("difficulty", filterDifficulty);
      return adminFetch<QuestionsResponse>(`/api/admin/questions?${sp.toString()}`);
    },
    staleTime: 30000,
  });

  const questions = data?.data ?? [];
  const totalPages = data?.pagination?.totalPages ?? 1;
  const allSelected = questions.length > 0 && selectedIds.length === questions.length;

  // Reset to page 1 if current page exceeds total pages (e.g. after deleting items on the last page)
  useEffect(() => {
    if (data && data.pagination.total > 0 && page > data.pagination.totalPages) {
      setPage(1);
    }
  }, [data, page]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "questions"] });

  const createMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) =>
      adminFetch<Question>("/api/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      invalidate();
      toast({ title: "Created!", description: "Question added successfully." });
      setSheetOpen(false);
    },
    onError: (err: Error) => {
      setFormError(err.message || "Failed to create question");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      adminFetch<Question>(`/api/admin/questions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      invalidate();
      toast({ title: "Saved!", description: "Question updated." });
      setSheetOpen(false);
    },
    onError: (err: Error) => {
      setFormError(err.message || "Failed to update question");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) =>
      adminFetch<{ success?: boolean }>(`/api/admin/questions/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidate();
      setDeleteId(null);
      toast({ title: "Deleted", description: "Question removed." });
    },
    onError: (err: Error) => {
      if (err instanceof ApiError && err.status === 409 && (err.body as any)?.warning) {
        toast({ title: "Cannot delete", description: (err.body as any).message, variant: "destructive" });
        setDeleteId(null);
      } else {
        toast({ title: "Delete failed", variant: "destructive" });
      }
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) =>
      adminFetch<{ success?: boolean }>("/api/admin/questions/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      }),
    onSuccess: () => {
      invalidate();
      setSelectedIds([]);
      setBulkDeleteOpen(false);
      toast({ title: "Deleted", description: `${selectedIds.length} questions removed.` });
    },
    onError: (err: Error) => {
      if (err instanceof ApiError && err.status === 409 && (err.body as any)?.warning) {
        const body = err.body as any;
        setDeleteWarning({ message: body.message, references: body.references, pendingIds: [...selectedIds] });
        setBulkDeleteOpen(false);
      } else {
        toast({ title: "Bulk delete failed", variant: "destructive" });
      }
    },
  });

  const handleForceDelete = async () => {
    if (!deleteWarning) return;
    const { pendingIds } = deleteWarning;
    try {
      if (pendingIds) {
        // Bulk force delete
        await adminFetch("/api/admin/questions/bulk-delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: pendingIds, confirm: true }),
        });
        setSelectedIds([]);
      }
      setDeleteWarning(null);
      invalidate();
      toast({ title: "Deleted", description: "Questions removed." });
    } catch (err: unknown) {
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    }
  };

  const bulkUploadMutation = useMutation({
    mutationFn: async (questions: Record<string, unknown>[]) =>
      adminFetch<{ success: boolean; count: number }>("/api/admin/questions/bulk-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions }),
      }),
    onSuccess: (res) => {
      invalidate();
      toast({ title: "Imported!", description: `Successfully uploaded ${res.count} questions.` });
    },
    onError: (err: Error) => {
      toast({ title: "Upload failed", description: err.message || "Invalid CSV layout", variant: "destructive" });
    },
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingItem(null);
    setSheetOpen(true);
  };

  const openEdit = async (q: Question) => {
    setEditingItem(q);
    setSheetOpen(true);
  };

  const openView = (q: Question) => {
    setViewingItem(q);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formText.trim()) {
      setFormError("Question text is required.");
      return;
    }
    if (!formOptionA.trim() || !formOptionB.trim()) {
      setFormError("At least options A and B are required.");
      return;
    }

    const basePayload = {
      text: formText.trim(),
      optionA: formOptionA.trim(),
      optionB: formOptionB.trim(),
      optionC: formOptionC.trim(),
      optionD: formOptionD.trim(),
      correctIndex: formCorrectIndex,
      explanation: formExplanation.trim() || null,
      subject: formSubject || null,
      difficulty: formDifficulty,
      negativeMarking: Number(formNegMarking),
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, payload: basePayload });
    } else {
      createMutation.mutate(basePayload);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(questions.map((q) => q.id));
    }
  };

  // CSV import is now handled by CsvImportReview component

  const isPending = createMutation.isPending || updateMutation.isPending;
  const diffColor: Record<string, string> = {
    easy: "bg-green-100 text-green-700 border-green-200",
    medium: "bg-amber-100 text-amber-700 border-amber-200",
    hard: "bg-red-100 text-red-700 border-red-200",
  };

  const correctLetter = (idx: number) => String.fromCharCode(65 + idx);

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
              <BookOpen className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Questions</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {data?.pagination?.total ?? 0} total questions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <AnimatePresence>
              {selectedIds.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setBulkDeleteOpen(true)}
                    disabled={bulkDeleteMutation.isPending}
                    className="rounded-xl h-9 gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete {selectedIds.length}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            <CsvImportReview
              invalidateKeys={[["admin", "questions"]]}
              triggerRef={csvImportRef}
            />

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 380, damping: 20 }}
            >
              <Button
                onClick={openCreate}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 h-10 font-bold gap-1.5 shadow-md shadow-indigo-200"
              >
                <Plus className="w-4 h-4" /> Add Question
              </Button>
            </motion.div>
          </div>
        </div>

        {/* ── Filters ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search questions..."
              className="pl-9 rounded-xl h-10"
            />
          </div>
          <Select value={filterSubject} onValueChange={(v) => { setFilterSubject(v); setPage(1); setSelectedIds([]); }}>
            <SelectTrigger className="w-full rounded-xl h-10">
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Subjects</SelectItem>
              {pyqSubjects.map((s: { id: string; name: string }) => (
                <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterDifficulty} onValueChange={(v) => { setFilterDifficulty(v); setPage(1); setSelectedIds([]); }}>
            <SelectTrigger className="w-full rounded-xl h-10">
              <SelectValue placeholder="All Difficulties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Difficulties</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
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
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}>
                <Loader2 className="w-7 h-7 text-indigo-500" />
              </motion.div>
              <p className="text-sm text-muted-foreground">Loading questions…</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="py-16 px-6">
              <Empty>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
                    <BookOpen className="w-7 h-7 text-indigo-400" />
                  </div>
                  <EmptyTitle>No questions yet</EmptyTitle>
                  <EmptyDescription>
                    Click &quot;Add Question&quot; above or import via CSV to get started.
                  </EmptyDescription>
                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={openCreate}
                      variant="outline"
                      className="rounded-xl gap-1.5 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                    >
                      <Plus className="w-4 h-4" /> Add one
                    </Button>
                    <CsvImportReview
                      invalidateKeys={[["admin", "questions"]]}
                    />
                  </div>
                </motion.div>
              </Empty>
            </div>
          ) : (
            <div>
              {/* Bulk select header */}
              {questions.length > 0 && (
                <div className="flex items-center gap-2 px-5 pt-4 pb-2 text-sm text-gray-500">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="accent-indigo-600 w-4 h-4 rounded"
                  />
                  <span>{allSelected ? "Deselect all" : `Select all ${questions.length} on page`}</span>
                </div>
              )}
              <div className="overflow-x-auto scrollbar-thin">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/70 hover:bg-gray-50/70">
                      <TableHead className="w-10 pl-5"></TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-gray-500">Question</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-gray-500">Subject</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-gray-500">Difficulty</TableHead>
                      <TableHead className="font-bold text-xs uppercase tracking-wider text-gray-500">Correct</TableHead>
                      <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-gray-500 pr-5">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <AnimatePresence>
                      {questions.map((q, i) => (
                        <motion.tr
                          key={q.id}
                          custom={i}
                          variants={tableRowVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          layout
                          className="group border-b border-border/40 hover:bg-gray-50/60 transition-colors cursor-pointer"
                          onClick={() => openView(q)}
                        >
                          <TableCell className="pl-5" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(q.id)}
                              onChange={() => toggleSelect(q.id)}
                              className="accent-indigo-600 w-4 h-4 rounded"
                            />
                          </TableCell>
                          <TableCell className="py-3 max-w-[320px]">
                            <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">{q.text}</p>
                          </TableCell>
                          <TableCell>
                            <span className="text-xs font-semibold text-gray-500">{q.subject ?? "—"}</span>
                          </TableCell>
                          <TableCell>
                            {q.difficulty ? (
                              <span className={`inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full border ${diffColor[q.difficulty] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                                {q.difficulty}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {q.correctIndex !== undefined ? (
                              <span className="text-xs font-bold text-green-600">
                                {correctLetter(q.correctIndex)}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right pr-5" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-indigo-50 hover:text-indigo-600" onClick={() => openView(q)}>
                                      <Eye className="h-3.5 w-3.5" />
                                    </Button>
                                  </motion.div>
                                </TooltipTrigger>
                                <TooltipContent>View Details</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-amber-50 hover:text-amber-600" onClick={() => openEdit(q)}>
                                      <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                  </motion.div>
                                </TooltipTrigger>
                                <TooltipContent>Edit</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600" onClick={() => setDeleteId(q.id)}>
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
            </div>
          )}
        </motion.div>

        {/* ── Pagination ──────────────────────────────────────────────────── */}
        {data && data.pagination.total > 0 && totalPages > 1 && (
          <motion.div variants={cardVariants} initial="hidden" animate="visible" className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-lg h-9">Previous</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg h-9">Next</Button>
            </div>
          </motion.div>
        )}

        {/* ── Detail Dialog ───────────────────────────────────────────────── */}
        <Dialog open={!!viewingItem} onOpenChange={(open) => !open && setViewingItem(null)}>
          <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto scrollbar-thin">
            {viewingItem && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold text-gray-900">Question Details</DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">Full question preview</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-4">
                    <p className="text-sm font-semibold text-gray-900 leading-relaxed">{viewingItem.text}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Subject</p>
                      <p className="text-sm font-semibold text-gray-900 mt-0.5">{viewingItem.subject ?? "—"}</p>
                    </div>
                    <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Difficulty</p>
                      {viewingItem.difficulty ? (
                        <span className={`inline-flex text-xs font-bold px-2 py-0.5 rounded-full border mt-1 ${diffColor[viewingItem.difficulty] ?? ""}`}>
                          {viewingItem.difficulty}
                        </span>
                      ) : <span className="text-sm text-gray-400">—</span>}
                    </div>
                  </div>

                  {/* Options */}
                  {viewingItem.optionA && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Options</h3>
                      {["A", "B", "C", "D"].map((letter, i) => {
                        const opt = [viewingItem.optionA, viewingItem.optionB, viewingItem.optionC, viewingItem.optionD][i];
                        if (!opt) return null;
                        const isCorrect = viewingItem.correctIndex === i;
                        return (
                          <div key={letter} className={`flex items-center gap-3 p-3 rounded-xl border ${isCorrect ? "bg-green-50 border-green-200" : "bg-gray-50/50 border-gray-100"}`}>
                            <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${isCorrect ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"}`}>
                              {letter}
                            </div>
                            <span className={`text-sm ${isCorrect ? "font-bold text-green-800" : "text-gray-700"}`}>{opt}</span>
                            {isCorrect && <CheckCircle2 className="w-4 h-4 text-green-600 ml-auto" />}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {viewingItem.explanation && (
                    <div>
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Explanation</h3>
                      <p className="text-sm text-gray-600 bg-gray-50/50 border border-gray-100 rounded-xl p-3 leading-relaxed">{viewingItem.explanation}</p>
                    </div>
                  )}

                  {viewingItem.negativeMarking && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-3">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Neg. Marking</p>
                        <p className="text-sm font-bold text-gray-900 mt-0.5">-{viewingItem.negativeMarking}</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* ── Create/Edit Sheet ───────────────────────────────────────────── */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col gap-0 p-0 overflow-hidden">
            <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                  className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center"
                >
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                </motion.div>
                <div>
                  <SheetTitle className="text-base font-bold text-gray-900">
                    {editingItem ? "Edit Question" : "Add Question"}
                  </SheetTitle>
                  <SheetDescription className="text-xs text-muted-foreground">
                    {editingItem ? "Update the question details below." : "Enter the question details below."}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">
                  {formError}
                </div>
              )}

              {/* Question Text */}
              <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Question Text *</Label>
                <Textarea value={formText} onChange={(e) => setFormText(e.target.value)} placeholder="Enter the question..." rows={3} required className="rounded-xl resize-none" />
              </motion.div>

              {/* Subject & Difficulty */}
              <div className="grid grid-cols-2 gap-3">
                <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Subject</Label>
                  <Select value={formSubject} onValueChange={setFormSubject}>
                    <SelectTrigger className="w-full rounded-xl h-10">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {pyqSubjects.map((s: { id: string; name: string }) => (
                        <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </motion.div>
                <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Difficulty</Label>
                  <Select value={formDifficulty} onValueChange={setFormDifficulty}>
                    <SelectTrigger className="w-full rounded-xl h-10">
                      <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>
              </div>

              {/* Options */}
              <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-2">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Options</Label>
                {["A", "B", "C", "D"].map((letter, i) => (
                  <div key={letter} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="correctIndex"
                      value={i}
                      checked={formCorrectIndex === i}
                      onChange={() => setFormCorrectIndex(i)}
                      className="accent-indigo-600"
                    />
                    <span className="text-xs font-bold text-gray-500 w-5 shrink-0">{letter}</span>
                    <Input
                      value={[formOptionA, formOptionB, formOptionC, formOptionD][i]}
                      onChange={(e) => {
                        const vals = [formOptionA, formOptionB, formOptionC, formOptionD];
                        vals[i] = e.target.value;
                        setFormOptionA(vals[0]);
                        setFormOptionB(vals[1]);
                        setFormOptionC(vals[2]);
                        setFormOptionD(vals[3]);
                      }}
                      placeholder={`Option ${letter}`}
                      className="rounded-xl h-9"
                    />
                  </div>
                ))}
                <p className="text-[10px] text-gray-400 mt-1">Select the radio button next to the correct answer</p>
              </motion.div>

              {/* Explanation */}
              <motion.div custom={6} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Explanation</Label>
                <Textarea value={formExplanation} onChange={(e) => setFormExplanation(e.target.value)} placeholder="Explain the correct answer..." rows={2} className="rounded-xl resize-none" />
              </motion.div>

              {/* Neg Marking */}
              <motion.div custom={7} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Negative Marks</Label>
                <Input type="number" step={0.25} value={formNegMarking} onChange={(e) => setFormNegMarking(Number(e.target.value))} className="rounded-xl h-10" />
              </motion.div>
            </form>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-gray-50/60 flex gap-2.5 shrink-0">
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)} className="flex-1 rounded-xl font-semibold">Cancel</Button>
              <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 380, damping: 20 }}>
                <Button type="submit" disabled={isPending || !formText.trim()} onClick={handleSubmit}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-200 gap-2"
                >
                  {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : editingItem ? "Save Changes" : "Add Question"}
                </Button>
              </motion.div>
            </div>
          </SheetContent>
        </Sheet>

        {/* ── Delete Confirm ──────────────────────────────────────────────── */}
        <ConfirmDeleteDialog
          isOpen={deleteTargetId !== null}
          onClose={() => setDeleteId(null)}
          onConfirm={() => {
            if (deleteTargetId !== null) deleteMutation.mutate(deleteTargetId);
          }}
        />

        {/* ── Bulk Delete Confirm ─────────────────────────────────────────── */}
        <ConfirmDeleteDialog
          isOpen={bulkDeleteOpen}
          onClose={() => setBulkDeleteOpen(false)}
          onConfirm={() => {
            if (selectedIds.length > 0) bulkDeleteMutation.mutate(selectedIds);
          }}
        />

        {/* ── Reference Warning Dialog ──────────────────────────────────────── */}
        <AlertDialog open={deleteWarning !== null} onOpenChange={(open) => !open && setDeleteWarning(null)}>
          <AlertDialogContent className="rounded-2xl border-border bg-white shadow-xl max-w-md">
            <AlertDialogHeader>
              <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-2">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <AlertDialogTitle className="text-gray-900 font-bold text-lg text-center">
                Questions in use
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-500 text-sm text-center">
                {deleteWarning?.message}
              </AlertDialogDescription>
            </AlertDialogHeader>

            {deleteWarning && (
              <div className="space-y-2 px-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Referenced in:</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Exam Sets", key: "examSets" as const, icon: ClipboardList, count: deleteWarning.references.examSets },
                    { label: "Mock Tests", key: "mockTests" as const, icon: FileText, count: deleteWarning.references.mockTests },
                    { label: "Daily Quizzes", key: "dailyQuizzes" as const, icon: FileText, count: deleteWarning.references.dailyQuizzes },
                  ].map(({ label, key, icon: Icon, count }) => (
                    <div
                      key={key}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
                        count > 0
                          ? "bg-amber-50 border-amber-200"
                          : "bg-gray-50 border-gray-100 opacity-50"
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${
                        count > 0 ? "text-amber-600" : "text-gray-400"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-gray-600 truncate">{label}</p>
                        <p className={`text-xs font-bold ${
                          count > 0 ? "text-amber-700" : "text-gray-400"
                        }`}>
                          {count} set{count !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-center text-xs text-gray-400 pt-1">
                  The question IDs will be removed from those sets (the sets themselves will be preserved).
                </p>
              </div>
            )}

            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel asChild>
                <Button variant="outline" onClick={() => setDeleteWarning(null)} className="rounded-xl flex-1">
                  Cancel
                </Button>
              </AlertDialogCancel>
              <AlertDialogAction asChild>
                <Button
                  variant="destructive"
                  onClick={handleForceDelete}
                  disabled={!deleteWarning?.pendingIds}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl flex-1 gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Delete anyway
                </Button>
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>
    </TooltipProvider>
  );
}
