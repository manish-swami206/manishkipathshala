"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Award,
  Check,
  ChevronLeft,
  ChevronRight,
  Layers,
  Loader2,
  Plus,
  Search,
} from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAdminFetch } from "@/hooks/useAdminFetch";
import { useListSubjects, type Subject } from "@/lib/api";
import { CLASSES, MEDIUMS } from "@/lib/data";

// ── Types ─────────────────────────────────────────────────────────────────────
export type AssignTargetType = "mock" | "pyq" | "ncert";

interface MockTestRow {
  id: string;
  title: string;
  questionCount: number;
  durationMins: number;
}

interface ExamSetRow {
  id: string;
  title: string;
  type: "pyq" | "ncert";
  totalQuestions: number;
  classNum: number | null;
}

interface ListResponse<T> {
  data: T[];
  pagination: { page: number; total: number; totalPages: number };
}

interface AssignResponse {
  success: boolean;
  added: number;
  alreadyPresent: number;
  total: number;
}

interface AssignmentPickerProps {
  /** Question IDs to assign (from table selection or CSV import) */
  questionIds: string[];
  /** Called after a successful assign/create — parent should close/finish */
  onSuccess?: (message: string) => void;
  /** Optional extra class for layout inside dialogs/steps */
  className?: string;
}

const TARGET_TABS: { value: AssignTargetType; label: string; icon: typeof Award }[] = [
  { value: "mock", label: "Mock Test", icon: Award },
  { value: "pyq", label: "PYQ", icon: Layers },
  { value: "ncert", label: "NCERT MCQ", icon: Layers },
];

// ─────────────────────────────────────────────────────────────────────────────
// Shared picker panel (embedded in dialog or CSV wizard step)
// ─────────────────────────────────────────────────────────────────────────────
export function AssignmentPicker({ questionIds, onSuccess, className }: AssignmentPickerProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const adminFetch = useAdminFetch();
  const { data: subjects = [] } = useListSubjects();

  const [targetType, setTargetType] = useState<AssignTargetType>("mock");
  const [mode, setMode] = useState<"existing" | "create">("existing");
  const [selectedTarget, setSelectedTarget] = useState<{ id: string; title: string } | null>(null);

  // Existing-list state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Create-new form state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formSubjectId, setFormSubjectId] = useState("");
  const [formClassNum, setFormClassNum] = useState("");
  const [formMedium, setFormMedium] = useState("");

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  // Reset dependent state when tabs/mode change
  useEffect(() => {
    setSelectedTarget(null);
    setPage(1);
    setSearch("");
    setDebouncedSearch("");
  }, [targetType, mode]);

  const handleSearch = (v: string) => {
    setSearch(v);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(v);
      setPage(1);
    }, 400);
  };

  // ── Existing target list query ──────────────────────────────────────────
  const listKey =
    targetType === "mock"
      ? ["admin", "mock-tests", "picker", page, debouncedSearch]
      : ["admin", "exam-sets", "picker", targetType, page, debouncedSearch];

  const { data, isLoading } = useQuery<ListResponse<MockTestRow | ExamSetRow>>({
    queryKey: listKey,
    queryFn: () => {
      const sp = new URLSearchParams({ page: String(page), limit: "20" });
      if (debouncedSearch.trim()) sp.set("search", debouncedSearch.trim());
      if (targetType !== "mock") sp.set("type", targetType);
      const path = targetType === "mock" ? "/api/admin/mock-tests" : "/api/admin/exam-sets";
      return adminFetch<ListResponse<MockTestRow | ExamSetRow>>(`${path}?${sp.toString()}`);
    },
    enabled: mode === "existing",
    staleTime: 15 * 60 * 1000,
  });

  const rows = data?.data ?? [];
  const totalPages = data?.pagination?.totalPages ?? 1;

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ["admin", "questions"] });
    qc.invalidateQueries({ queryKey: ["admin", "mock-tests"] });
    qc.invalidateQueries({ queryKey: ["admin", "exam-sets"] });
  };

  // ── Assign to existing ──────────────────────────────────────────────────
  const assignMutation = useMutation({
    mutationFn: () =>
      adminFetch<AssignResponse>("/api/admin/questions/assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionIds,
          targetType,
          targetId: selectedTarget!.id,
        }),
      }),
    onSuccess: (res) => {
      invalidateAll();
      const message =
        res.alreadyPresent > 0
          ? `${res.added} added to “${selectedTarget!.title}” (${res.alreadyPresent} already present) — ${res.total} total`
          : `${res.added} question${res.added !== 1 ? "s" : ""} added to “${selectedTarget!.title}” — ${res.total} total`;
      toast({ title: "Assigned!", description: message });
      onSuccess?.(message);
    },
    onError: (err: Error) => {
      toast({ title: "Assign failed", description: err.message, variant: "destructive" });
    },
  });

  // ── Create new container with questions ─────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async () => {
      if (targetType === "mock") {
        return adminFetch<MockTestRow>("/api/admin/mock-tests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formTitle.trim(),
            description: formDescription.trim(),
            durationMins: 60,
            questionCount: questionIds.length,
            maxMarks: 100,
            negativeMarking: 0.25,
            isFeatured: false,
            questionIds,
          }),
        });
      }
      return adminFetch<ExamSetRow>("/api/admin/exam-sets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formTitle.trim(),
          description: formDescription.trim() || null,
          type: targetType,
          subjectId: formSubjectId || null,
          classNum: formClassNum ? parseInt(formClassNum, 10) : null,
          medium: formMedium || null,
          questionIds,
        }),
      });
    },
    onSuccess: (created) => {
      invalidateAll();
      const message = `“${created.title}” created with ${questionIds.length} question${questionIds.length !== 1 ? "s" : ""}`;
      toast({ title: "Created!", description: message });
      resetCreateForm();
      onSuccess?.(message);
    },
    onError: (err: Error) => {
      toast({ title: "Create failed", description: err.message, variant: "destructive" });
    },
  });

  const resetCreateForm = () => {
    setFormTitle("");
    setFormDescription("");
    setFormSubjectId("");
    setFormClassNum("");
    setFormMedium("");
  };

  const isPending = assignMutation.isPending || createMutation.isPending;

  const canSubmitExisting = questionIds.length > 0 && !!selectedTarget && !isPending;
  const canSubmitCreate =
    questionIds.length > 0 &&
    formTitle.trim().length > 0 &&
    (targetType !== "mock" || formDescription.trim().length > 0) &&
    !isPending &&
    (targetType === "pyq" ? formSubjectId !== "" : true) &&
    (targetType === "ncert" ? formClassNum !== "" : true);

  const handleSubmit = () => {
    if (mode === "existing") {
      if (!canSubmitExisting) return;
      assignMutation.mutate();
    } else {
      if (!canSubmitCreate) return;
      createMutation.mutate();
    }
  };

  const countLabel = `${questionIds.length} question${questionIds.length !== 1 ? "s" : ""}`;

  return (
    <div className={className}>
      {/* ── Destination tabs ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0">Add to</span>
        <div className="flex gap-1.5 flex-wrap">
          {TARGET_TABS.map((t) => {
            const active = targetType === t.value;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setTargetType(t.value)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                  active
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-sm shadow-indigo-200"
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <t.icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Mode toggle ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-xl mb-3 w-fit">
        {(["existing", "create"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              mode === m ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {m === "existing" ? "Existing" : "Create new"}
          </button>
        ))}
      </div>

      {/* ── Existing: searchable single-select list ───────────────────────── */}
      {mode === "existing" && (
        <div className="space-y-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={`Search ${targetType === "mock" ? "mock tests" : targetType === "pyq" ? "PYQ sets" : "NCERT sets"}...`}
              className="pl-9 rounded-xl h-10"
            />
          </div>

          <div className="max-h-[260px] overflow-y-auto space-y-1.5 pr-1" style={{ scrollbarWidth: "thin" }}>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 bg-gray-50 animate-pulse rounded-xl" />
              ))
            ) : rows.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">
                No {targetType === "mock" ? "mock tests" : "sets"} found. Switch to{" "}
                <strong>Create new</strong>.
              </div>
            ) : (
              rows.map((row) => {
                const active = selectedTarget?.id === row.id;
                const count =
                  targetType === "mock"
                    ? (row as MockTestRow).questionCount
                    : (row as ExamSetRow).totalQuestions;
                return (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => setSelectedTarget({ id: row.id, title: row.title })}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                      active
                        ? "border-indigo-500 bg-indigo-50/60"
                        : "border-gray-100 bg-gray-50/40 hover:border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 line-clamp-1">{row.title}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {count} question{count !== 1 ? "s" : ""} currently · +{questionIds.length} new
                      </p>
                    </div>
                    <div
                      className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        active ? "border-indigo-600 bg-indigo-600 text-white" : "border-gray-200"
                      }`}
                    >
                      {active && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {data && totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Page {data.pagination.page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="h-8 rounded-lg"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="h-8 rounded-lg"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Create new: mini form ─────────────────────────────────────────── */}
      {mode === "create" && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Title *</Label>
            <Input
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder={
                targetType === "mock"
                  ? "e.g. UPSC Prelims Full-length #3"
                  : targetType === "pyq"
                    ? "e.g. UPSC Prelims 2024 PYQ"
                    : "e.g. Class 10 Science — Ch 1-3"
              }
              className="rounded-xl h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              Description{targetType === "mock" ? " *" : ""}
            </Label>
            <Textarea
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Short description..."
              rows={2}
              className="rounded-xl resize-none"
            />
          </div>

          {targetType !== "mock" && (
            <div className="grid grid-cols-2 gap-3">
              {targetType === "pyq" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Subject *
                  </Label>
                  <Select value={formSubjectId} onValueChange={setFormSubjectId}>
                    <SelectTrigger className="w-full rounded-xl h-10">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((s: Subject) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {targetType === "ncert" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Class *
                  </Label>
                  <Select value={formClassNum} onValueChange={setFormClassNum}>
                    <SelectTrigger className="w-full rounded-xl h-10">
                      <SelectValue placeholder="Select class" />
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
              )}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Medium</Label>
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
          )}

          <div className="flex items-center gap-1.5 p-2.5 bg-indigo-50/60 border border-indigo-100 rounded-xl">
            <Plus className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span className="text-[11px] font-semibold text-indigo-700">
              {countLabel} will be added on creation
            </span>
          </div>
        </div>
      )}

      {/* ── Footer: summary + submit ──────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t">
        <div className="min-w-0">
          <p className="text-xs font-bold text-gray-700">
            {countLabel} selected
          </p>
          <p className="text-[11px] text-gray-400 line-clamp-1">
            {mode === "existing"
              ? selectedTarget
                ? `→ ${selectedTarget.title}`
                : "Pick a destination below"
              : `→ New ${targetType === "mock" ? "mock test" : targetType === "pyq" ? "PYQ set" : "NCERT set"}`}
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={mode === "existing" ? !canSubmitExisting : !canSubmitCreate}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-9 px-4 font-bold gap-1.5 shrink-0"
        >
          {isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Working…
            </>
          ) : mode === "existing" ? (
            <>Add {questionIds.length}</>
          ) : (
            <>Create & add</>
          )}
        </Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Dialog wrapper (questions table bulk action)
// ─────────────────────────────────────────────────────────────────────────────
interface AddToSetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionIds: string[];
  /** Called after a successful assign/create (before close) — e.g. clear table selection */
  onSuccess?: () => void;
}

export function AddToSetDialog({ open, onOpenChange, questionIds, onSuccess }: AddToSetDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onOpenChange(false)}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-500" />
            Add questions to set / test
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {questionIds.length} question{questionIds.length !== 1 ? "s" : ""} selected — choose an
            existing mock test / PYQ / NCERT set, or create a new one.
          </DialogDescription>
        </DialogHeader>
        <AssignmentPicker
          questionIds={questionIds}
          onSuccess={() => {
            onSuccess?.();
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
