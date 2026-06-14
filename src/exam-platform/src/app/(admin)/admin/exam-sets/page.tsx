"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Edit,
  Eye,
  BookOpen,
  Library,
  Search,
  Layers,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
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
import { Empty, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useListSubjects, type Subject } from "@/lib/api";
import { useAdminFetch } from "@/hooks/useAdminFetch";
import { ConfirmDeleteDialog } from "@/components/admin/ConfirmDeleteDialog";
import { QuestionSelector } from "@/components/admin/QuestionSelector";
import { CLASSES, MEDIUMS, EXAM_SET_TYPES } from "@/lib/data";

import type { ExamSet } from "@workspace/db";

interface BatchQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string | null;
}

interface ExamSetsResponse {
  data: ExamSet[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function ExamSetsAdminPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const adminFetch = useAdminFetch();

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ExamSet | null>(null);
  const [deleteTargetId, setDeleteId] = useState<string | null>(null);
  const [viewingItem, setViewingItem] = useState<ExamSet | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState<"pyq" | "ncert">("pyq");
  const [formSubjectId, setFormSubjectId] = useState("");
  const [formClassNum, setFormClassNum] = useState("");
  const [formMedium, setFormMedium] = useState("");
  const [formQuestionIds, setFormQuestionIds] = useState<string[]>([]);

  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Subjects
  const { data: subjects = [] } = useListSubjects();

  const { data, isLoading } = useQuery<ExamSetsResponse>({
    queryKey: ["admin", "exam-sets", typeFilter, debouncedSearch, page],
    queryFn: () => {
      const sp = new URLSearchParams();
      sp.set("page", String(page));
      sp.set("limit", "20");
      if (typeFilter) sp.set("type", typeFilter);
      if (debouncedSearch.trim()) sp.set("search", debouncedSearch.trim());
      const query = sp.toString();
      return adminFetch<ExamSetsResponse>(
        `/api/admin/exam-sets${query ? `?${query}` : ""}`,
      );
    },
  });

  // Reset to page 1 if current page exceeds total pages
  useEffect(() => {
    if (data && data.pagination.total > 0 && page > data.pagination.totalPages) {
      setPage(1);
    }
  }, [data, page]);

  const createMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      return adminFetch<ExamSet>("/api/admin/exam-sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "exam-sets"] });
      setSheetOpen(false);
      resetForm();
      toast({ title: "Created", description: "Exam set created successfully" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Record<string, unknown> }) => {
      return adminFetch<ExamSet>(`/api/admin/exam-sets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "exam-sets"] });
      setSheetOpen(false);
      toast({ title: "Updated", description: "Exam set updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return adminFetch<{ success: boolean }>(`/api/admin/exam-sets/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "exam-sets"] });
      toast({ title: "Deleted", description: "Exam set removed" });
    },
    onError: () => toast({ title: "Delete failed", variant: "destructive" }),
  });

  const resetForm = () => {
    setFormTitle("");
    setFormDescription("");
    setFormType("pyq");
    setFormSubjectId("");
    setFormClassNum("");
    setFormMedium("");
    setFormQuestionIds([]);
  };

  const openCreate = () => {
    setEditingItem(null);
    resetForm();
    setSheetOpen(true);
  };

  const openView = (item: ExamSet) => {
    setViewingItem(item);
  };

  const openEdit = (item: ExamSet) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormDescription(item.description ?? "");
    setFormType(item.type as "pyq" | "ncert");
    setFormSubjectId(item.subjectId ? String(item.subjectId) : "");
    setFormClassNum(item.classNum ? String(item.classNum) : "");
    setFormMedium(item.medium ?? "");
    setFormQuestionIds(item.questionIds || []);
    setSheetOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      toast({ title: "Validation", description: "Title is required", variant: "destructive" });
      return;
    }

    const payload = {
      title: formTitle.trim(),
      description: formDescription.trim() || null,
      type: formType,
      subjectId: formSubjectId || null,
      classNum: formClassNum ? parseInt(formClassNum) : null,
      medium: formMedium || null,
      questionIds: formQuestionIds,
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, body: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const examSets = data?.data ?? [];
  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="max-w-6xl mx-auto space-y-6 p-2"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center">
            <Layers className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">
              Exam Sets
            </h1>
            <p className="text-sm text-muted-foreground">
              PYQ &amp; NCERT question sets
            </p>
          </div>
        </div>
        <Button
          onClick={openCreate}
          className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Create Set
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => {
              const val = e.target.value;
              setSearch(val);
              if (debounceRef.current) clearTimeout(debounceRef.current);
              debounceRef.current = setTimeout(() => {
                setDebouncedSearch(val);
                setPage(1);
              }, 400);
            }}
            placeholder="Search exam sets..."
            className="pl-9 rounded-xl h-10"
          />
        </div>
        <div className="flex gap-2">
          {["", "pyq", "ncert"].map((t) => (
            <Button
              key={t}
              variant={typeFilter === t ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter(t)}
              className={`rounded-xl h-9 text-xs font-bold ${
                typeFilter === t
                  ? "bg-indigo-600 hover:bg-indigo-700"
                  : ""
              }`}
            >
              {t ? (t === "pyq" ? "PYQ" : "NCERT") : "All"}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="border border-border/50 bg-white shadow-sm overflow-hidden rounded-2xl">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Loading exam sets...
          </div>
        ) : examSets.length === 0 ? (
          <div className="py-16 px-6">
            <Empty>
              <EmptyTitle>No exam sets yet</EmptyTitle>
              <EmptyDescription>
                Click "Create Set" above to group questions into PYQ or NCERT
                sets.
              </EmptyDescription>
            </Empty>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/70">
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-gray-500">Title</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-gray-500">Type</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-gray-500">Subject</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-gray-500">Questions</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-gray-500">Class</TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-gray-500">Medium</TableHead>
                  <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-gray-500">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {examSets.map((set) => (
                  <TableRow
                    key={set.id}
                    className="hover:bg-gray-50/60 transition-colors"
                  >
                    <TableCell className="font-semibold text-gray-900 max-w-[200px]">
                      <span className="line-clamp-1">{set.title}</span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          set.type === "pyq"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-blue-50 text-blue-700 border-blue-200"
                        }
                      >
                        {set.type.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-600 text-sm">
                      {                      subjects.find(
                        (s: Subject) => String(s.id) === String(set.subjectId),
                      )?.name ?? (
                        <span className="text-gray-400 italic">N/A</span>
                      )}
                    </TableCell>
                    <TableCell className="font-bold text-gray-700">
                      {set.totalQuestions}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {set.classNum ? `Class ${set.classNum}` : "-"}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {set.medium ?? "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openView(set)}
                          className="h-8 w-8 p-0 rounded-lg hover:bg-indigo-50 hover:text-indigo-600"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(set)}
                          className="h-8 w-8 p-0 rounded-lg hover:bg-amber-50 hover:text-amber-600"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(set.id)}
                          className="h-8 w-8 p-0 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {page} of {data.pagination.totalPages}
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
              disabled={page >= data.pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg h-9"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md overflow-y-auto scrollbar-thin"
        >
          <SheetHeader className="mb-6">
            <SheetTitle className="text-lg font-bold text-gray-900">
              {editingItem ? "Edit Exam Set" : "Create Exam Set"}
            </SheetTitle>
            <SheetDescription>
              Group questions into PYQ or NCERT sets
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Title *
              </Label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="e.g. UPSC Prelims 2024 PYQ"
                required
                className="rounded-xl h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Description
              </Label>
              <Input
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Optional description..."
                className="rounded-xl h-10"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Type *
                </Label>
                <Select value={formType} onValueChange={(v) => setFormType(v as "pyq" | "ncert")}>
                  <SelectTrigger className="w-full rounded-xl h-10">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXAM_SET_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Subject
                </Label>
                <Select value={formSubjectId} onValueChange={setFormSubjectId}>
                  <SelectTrigger className="w-full rounded-xl h-10">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {subjects.map((s: Subject) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Class
                </Label>
                <Select value={formClassNum} onValueChange={setFormClassNum}>
                  <SelectTrigger className="w-full rounded-xl h-10">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASSES.map((c) => (
                      <SelectItem key={c.value} value={String(c.value)}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Medium
                </Label>
                <Select value={formMedium} onValueChange={setFormMedium}>
                  <SelectTrigger className="w-full rounded-xl h-10">
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    {MEDIUMS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Question Selector */}
            <motion.div className="space-y-3 pt-2 border-t">
              <div>
                <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide">Select Questions</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">Choose questions for this set ({formQuestionIds.length} selected)</p>
              </div>
              <QuestionSelector selectedIds={formQuestionIds} onChange={setFormQuestionIds} />
            </motion.div>

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSheetOpen(false)}
                className="flex-1 rounded-xl font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isPending || !formTitle.trim()}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl"
              >
                {isPending
                  ? "Saving..."
                  : editingItem
                    ? "Save Changes"
                    : "Create Set"}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>

      {/* Detail Dialog with question previews */}
      <Dialog open={!!viewingItem} onOpenChange={(open) => !open && setViewingItem(null)}>
        <DialogContent className="sm:max-w-lg max-h-[85vh]">
          {viewingItem && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-500" />
                  {viewingItem.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Exam set details and questions preview
                </DialogDescription>
              </DialogHeader>

              {/* Set metadata */}
              <div className="space-y-3">
                {viewingItem.description && (
                  <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-3">
                    <p className="text-xs text-gray-600">{viewingItem.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-3">
                    <p className="text-gray-400 font-semibold uppercase tracking-wide">Type</p>
                    <p className="text-sm font-bold text-gray-900 mt-0.5 capitalize">{viewingItem.type}</p>
                  </div>
                  <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-3">
                    <p className="text-gray-400 font-semibold uppercase tracking-wide">Subject</p>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">
                      {subjects.find((s: Subject) => String(s.id) === String(viewingItem.subjectId))?.name ?? (
                        <span className="text-gray-400 italic">N/A</span>
                      )}
                    </p>
                  </div>
                  {viewingItem.classNum && (
                    <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-3">
                      <p className="text-gray-400 font-semibold uppercase tracking-wide">Class</p>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">Class {viewingItem.classNum}</p>
                    </div>
                  )}
                  {viewingItem.medium && (
                    <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-3">
                      <p className="text-gray-400 font-semibold uppercase tracking-wide">Medium</p>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">{viewingItem.medium}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Questions preview */}
              <div className="border-t pt-3 mt-1">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5" />
                  Questions ({viewingItem.questionIds?.length ?? 0})
                </h4>
                <QuestionPreview questionIds={(viewingItem.questionIds ?? []) as string[]} />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteTargetId !== null) deleteMutation.mutate(deleteTargetId);
        }}
      />
    </motion.div>
  );
}

// ── Question Preview Component ────────────────────────────────────────────
function QuestionPreview({ questionIds }: { questionIds: string[] }) {
  const adminFetch = useAdminFetch();
  if (!questionIds.length) {
    return (
      <p className="text-xs text-gray-400 italic py-3 text-center">No questions selected for this set.</p>
    );
  }

  const { data, isLoading, error } = useQuery<{ data: BatchQuestion[] }>({
    queryKey: ["admin", "exam-sets", "question-preview", questionIds.join(",")],
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

