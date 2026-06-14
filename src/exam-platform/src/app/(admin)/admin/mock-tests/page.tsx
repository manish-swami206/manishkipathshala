"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Edit,
  Eye,
  Award,
  Loader2,
  Star,
  Search,
  ChevronLeft,
  ChevronRight,
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
import { ConfirmDeleteDialog } from "@/components/admin/ConfirmDeleteDialog";
import { QuestionSelector } from "@/components/admin/QuestionSelector";

// ── Types ─────────────────────────────────────────────────────────────────────
interface MockTest {
  id: string;
  title: string;
  description: string;
  durationMins: number;
  questionCount: number;
  maxMarks: number;
  negativeMarking: number;
  isFeatured: boolean;
  questionIds?: string[];
  subjectId?: string | null;
  difficulty?: string | null;
  class?: number | null;
  medium?: string | null;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface MockTestsResponse {
  data: MockTest[];
  pagination: PaginationInfo;
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
export default function MockTestsAdminPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const adminFetch = useAdminFetch();

  // Search & filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [filterSubject, setFilterSubject] = useState("All");

  // Detail Dialog
  const [viewingItem, setViewingItem] = useState<MockTest | null>(null);

  // Sheet (create/edit)
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MockTest | null>(null);

  // Delete
  const [deleteTargetId, setDeleteId] = useState<string | null>(null);

  // Subjects
  const { data: pyqSubjects = [] } = useListSubjects();

  // ── Form state ────────────────────────────────────────────────────────────
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDuration, setFormDuration] = useState(60);
  const [formMaxMarks, setFormMaxMarks] = useState(100);
  const [formNegMarking, setFormNegMarking] = useState(0.25);
  const [formFeatured, setFormFeatured] = useState(false);
  const [formError, setFormError] = useState("");

  // Sync form when sheet opens
  useEffect(() => {
    if (sheetOpen) {
      if (editingItem) {
        setFormTitle(editingItem.title);
        setFormDescription(editingItem.description);
        setFormDuration(editingItem.durationMins);
        // questionCount auto-calculated from selectedQuestionIds
        setFormMaxMarks(editingItem.maxMarks);
        setFormNegMarking(editingItem.negativeMarking);
        setFormFeatured(editingItem.isFeatured);
      } else {
        setFormTitle("");
        setFormDescription("");
        setFormDuration(60);
        // questionCount auto-calculated from selectedQuestionIds
        setFormMaxMarks(100);
        setFormNegMarking(0.25);
        setFormFeatured(false);
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
  const { data: testsResponse, isLoading } = useQuery<MockTestsResponse>({
    queryKey: ["admin", "mock-tests", page, debouncedSearch, filterSubject],
    queryFn: () => {
      const sp = new URLSearchParams({ page: String(page), limit: "20" });
      if (debouncedSearch.trim()) sp.set("search", debouncedSearch.trim());
      if (filterSubject !== "All") sp.set("subjectId", filterSubject);
      return adminFetch<MockTestsResponse>(`/api/admin/mock-tests?${sp.toString()}`);
    },
    staleTime: 0,
  });
  const tests = testsResponse?.data ?? [];
  const totalPages = testsResponse?.pagination?.totalPages ?? 1;
  const totalItems = testsResponse?.pagination?.total ?? 0;

  // Reset to page 1 if current page exceeds total pages (e.g. after deleting items on the last page)
  useEffect(() => {
    if (testsResponse && testsResponse.pagination.total > 0 && page > testsResponse.pagination.totalPages) {
      setPage(1);
    }
  }, [testsResponse, page]);

  // ── Mutations ──────────────────────────────────────────────────────────────
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "mock-tests"] });

  const createMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) =>
      adminFetch<MockTest>("/api/admin/mock-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      invalidate();
      toast({ title: "Created!", description: "Mock test created successfully." });
      setSheetOpen(false);
    },
    onError: (err: Error) => {
      setFormError(err.message || "Failed to create");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      adminFetch<MockTest>(`/api/admin/mock-tests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      invalidate();
      toast({ title: "Saved!", description: "Mock test updated." });
      setSheetOpen(false);
    },
    onError: (err: Error) => {
      setFormError(err.message || "Failed to update");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const toggleFeatureMutation = useMutation({
    mutationFn: async ({ id, isFeatured }: { id: string; isFeatured: boolean }) =>
      adminFetch<MockTest>(`/api/admin/mock-tests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured }),
      }),
    onSuccess: () => {
      invalidate();
      toast({ title: "Updated", description: "Featured tag toggled." });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) =>
      adminFetch<Record<string, unknown>>(`/api/admin/mock-tests/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidate();
      setDeleteId(null);
      toast({ title: "Deleted", description: "Mock test removed." });
    },
    onError: () => toast({ title: "Delete failed", variant: "destructive" }),
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingItem(null);
    setSheetOpen(true);
  };

  const openEdit = (test: MockTest) => {
    setEditingItem(test);
    setSheetOpen(true);
  };

  const openView = (test: MockTest) => {
    setViewingItem(test);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formTitle.trim() || !formDescription.trim()) {
      setFormError("Title and Description are required.");
      return;
    }

    const payload = {
      title: formTitle.trim(),
      description: formDescription.trim(),
      durationMins: Number(formDuration),
      questionCount: selectedQuestionIds.length,
      maxMarks: Number(formMaxMarks),
      negativeMarking: Number(formNegMarking),
      isFeatured: formFeatured,
      questionIds: selectedQuestionIds,
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
              <Award className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Mock Tests</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {totalItems} total tests
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 380, damping: 20 }}
            >
              <Button
                onClick={openCreate}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 h-10 font-bold gap-1.5 shadow-md shadow-indigo-200"
              >
                <Plus className="w-4 h-4" /> Create Test
              </Button>
            </motion.div>
          </div>
        </div>

        {/* ── Filters ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search mock tests..."
              className="pl-9 rounded-xl h-10"
            />
          </div>
          <Select value={filterSubject} onValueChange={(v) => { setFilterSubject(v); setPage(1); }}>
            <SelectTrigger className="w-full rounded-xl h-10">
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Subjects</SelectItem>
              {pyqSubjects.map((s: { id: string; name: string }) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
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
              <p className="text-sm text-muted-foreground">Loading mock tests…</p>
            </div>
          ) : tests.length === 0 ? (
            <div className="py-16 px-6">
              <Empty>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
                    <Award className="w-7 h-7 text-indigo-400" />
                  </div>
                  <EmptyTitle>No mock tests yet</EmptyTitle>
                  <EmptyDescription>Click &quot;Create Test&quot; above to add your first mock test.</EmptyDescription>
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
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-gray-500 pl-5">Test</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-gray-500">Duration</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-gray-500">Questions</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-gray-500">Marks</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-gray-500">Featured</TableHead>
                    <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-gray-500 pr-5">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {tests.map((test, i) => (
                      <motion.tr
                        key={test.id}
                        custom={i}
                        variants={tableRowVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout
                        className="group border-b border-border/40 hover:bg-gray-50/60 transition-colors cursor-pointer"
                        onClick={() => openView(test)}
                      >
                        <TableCell className="pl-5 py-3.5 max-w-[280px]">
                          <div className="flex items-start gap-2.5">
                            <div className="mt-0.5 w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
                              <Award className="w-3.5 h-3.5 text-indigo-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-1">{test.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{test.description}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-semibold text-gray-600">{test.durationMins} min</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-bold">{test.questionCount} Q</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-bold text-gray-700">{test.maxMarks}</span>
                        </TableCell>
                        <TableCell>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); toggleFeatureMutation.mutate({ id: test.id, isFeatured: !test.isFeatured }); }}
                            className={`text-xs font-bold px-2 py-0.5 rounded-full border cursor-pointer transition-colors ${
                              test.isFeatured
                                ? "bg-amber-50 border-amber-200 text-indigo-700"
                                : "bg-gray-50 border-gray-200 text-gray-400 hover:border-gray-300"
                            }`}
                          >
                            {test.isFeatured ? "FEATURED" : "STANDARD"}
                          </button>
                        </TableCell>
                        <TableCell className="text-right pr-5" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-indigo-50 hover:text-indigo-600" onClick={() => openView(test)}>
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                </motion.div>
                              </TooltipTrigger>
                              <TooltipContent>View Details</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-amber-50 hover:text-indigo-600" onClick={() => openEdit(test)}>
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                </motion.div>
                              </TooltipTrigger>
                              <TooltipContent>Edit</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600" onClick={() => setDeleteId(test.id)}>
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
        {totalItems > 0 && totalPages > 1 && (
          <motion.div variants={cardVariants} initial="hidden" animate="visible" className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Page {page} of {totalPages} ({totalItems} total)</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-lg h-9">
                <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-lg h-9">
                Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* ── Detail Dialog ───────────────────────────────────────────────── */}
        <Dialog open={!!viewingItem} onOpenChange={(open) => !open && setViewingItem(null)}>
          <DialogContent className="sm:max-w-md">
            {viewingItem && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold text-gray-900">{viewingItem.title}</DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">Mock test details and configuration</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  {viewingItem.description && (
                    <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-3">
                      <p className="text-xs text-gray-600">{viewingItem.description}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-3">
                      <p className="text-gray-400 font-semibold uppercase tracking-wide">Duration</p>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">{viewingItem.durationMins} min</p>
                    </div>
                    <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-3">
                      <p className="text-gray-400 font-semibold uppercase tracking-wide">Questions</p>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">{viewingItem.questionCount}</p>
                    </div>
                    <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-3">
                      <p className="text-gray-400 font-semibold uppercase tracking-wide">Max Marks</p>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">{viewingItem.maxMarks}</p>
                    </div>
                    <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-3">
                      <p className="text-gray-400 font-semibold uppercase tracking-wide">Neg. Marking</p>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">-{viewingItem.negativeMarking}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${
                      viewingItem.isFeatured
                        ? "bg-amber-50 border-amber-200 text-indigo-700"
                        : "bg-gray-50 border-gray-200 text-gray-400"
                    }`}>
                      {viewingItem.isFeatured ? <Star className="w-3 h-3" /> : null}
                      {viewingItem.isFeatured ? "Featured" : "Standard"}
                    </span>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* ── Create/Edit Sheet ───────────────────────────────────────────── */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-0 p-0 overflow-hidden">
            <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                  className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center"
                >
                  <Award className="w-5 h-5 text-indigo-600" />
                </motion.div>
                <div>
                  <SheetTitle className="text-base font-bold text-gray-900">
                    {editingItem ? "Edit Mock Test" : "Create Mock Test"}
                  </SheetTitle>
                  <SheetDescription className="text-xs text-muted-foreground">
                    {editingItem ? "Update mock test details below." : "Configure a new evaluation exam."}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">{formError}</div>
              )}

              <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Title *</Label>
                <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="e.g. UPSC Prelims Full-length" required className="rounded-xl h-10" />
              </motion.div>

              <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Description *</Label>
                <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Describe key topics..." rows={2} required className="rounded-xl resize-none" />
              </motion.div>

              <div className="grid grid-cols-2 gap-3">
                <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Duration (min)</Label>
                  <Input type="number" min={1} value={formDuration} onChange={(e) => setFormDuration(Number(e.target.value))} className="rounded-xl h-10" />
                </motion.div>
                <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Question Count</Label>
                  <div className="rounded-xl h-10 px-3 border bg-gray-50 flex items-center text-sm font-semibold text-gray-700">
                    {selectedQuestionIds.length} selected
                  </div>
                </motion.div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <motion.div custom={4} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Max Marks</Label>
                  <Input type="number" min={1} value={formMaxMarks} onChange={(e) => setFormMaxMarks(Number(e.target.value))} className="rounded-xl h-10" />
                </motion.div>
                <motion.div custom={5} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Neg. Marking</Label>
                  <Input type="number" step={0.05} min={0} value={formNegMarking} onChange={(e) => setFormNegMarking(Number(e.target.value))} className="rounded-xl h-10" />
                </motion.div>
              </div>

              {/* Question Selector */}
              <motion.div custom={6} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-3 border-t pt-4">
                <div>
                  <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wide">Select Questions</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Choose questions for this test ({selectedQuestionIds.length} selected)</p>
                </div>
                <QuestionSelector selectedIds={selectedQuestionIds} onChange={setSelectedQuestionIds} />
              </motion.div>

              <motion.div custom={7} variants={fieldVariants} initial="hidden" animate="visible" className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" checked={formFeatured} onChange={(e) => setFormFeatured(e.target.checked)} className="accent-indigo-600 w-4 h-4" />
                  <span className="text-xs font-semibold text-gray-700">Feature on top grid</span>
                </label>
              </motion.div>
            </form>

            <div className="px-6 py-4 border-t bg-gray-50/60 flex gap-2.5 shrink-0">
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)} className="flex-1 rounded-xl font-semibold">Cancel</Button>
              <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 380, damping: 20 }}>
                <Button type="submit" disabled={isPending || !formTitle.trim() || !formDescription.trim()} onClick={handleSubmit}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-200 gap-2"
                >
                  {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : editingItem ? "Save Changes" : "Create Test"}
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
      </motion.div>
    </TooltipProvider>
  );
}
