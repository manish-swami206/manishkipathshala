"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Edit,
  Eye,
  FileText,
  Loader2,
  Upload,
} from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useAuth } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import { useAdminFetch } from "@/hooks/useAdminFetch";
import { ConfirmDeleteDialog } from "@/components/admin/ConfirmDeleteDialog";

// ── Types ─────────────────────────────────────────────────────────────────────
interface SyllabusItem {
  id: string;
  title: string;
  examCategory: string | null;
  readUrl: string | null;
  downloadUrl: string | null;
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
export default function SyllabusAdminPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const adminFetch = useAdminFetch();
  const { getToken } = useAuth();

  // Detail Dialog
  const [viewingItem, setViewingItem] = useState<SyllabusItem | null>(null);

  // Sheet (create/edit)
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SyllabusItem | null>(null);

  // Delete
  const [deleteTargetId, setDeleteId] = useState<string | null>(null);

  // ── Form state ────────────────────────────────────────────────────────────
  const [uploadMode, setUploadMode] = useState<"file" | "url">("file");
  const [formTitle, setFormTitle] = useState("");
  const [formExamCategory, setFormExamCategory] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [formError, setFormError] = useState("");

  // Sync form when sheet opens
  useEffect(() => {
    if (sheetOpen) {
      if (editingItem) {
        setFormTitle(editingItem.title);
        setFormExamCategory(editingItem.examCategory ?? "");
        setFormUrl(editingItem.readUrl ?? "");
        setFile(null);
        setFileName("");
        setUploadMode("url");
      } else {
        setFormTitle("");
        setFormExamCategory("");
        setFormUrl("");
        setFile(null);
        setFileName("");
        setUploadMode("file");
      }
      setFormError("");
    }
  }, [sheetOpen, editingItem]);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: syllabusResponse, isLoading } = useQuery({
    queryKey: ["admin", "syllabus"],
    queryFn: () => adminFetch<{
      data: SyllabusItem[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>("/api/admin/syllabus"),
  });
  const list = syllabusResponse?.data ?? [];

  // ── Mutations ──────────────────────────────────────────────────────────────
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "syllabus"] });

  const createMutation = useMutation({
    mutationFn: async (data: FormData | Record<string, unknown>) => {
      const token = await getToken();
      if (data instanceof FormData) {
        const res = await fetch("/api/admin/syllabus", {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: data,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to create syllabus");
        }
        return res.json();
      }
      return adminFetch<SyllabusItem>("/api/admin/syllabus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      invalidate();
      setSheetOpen(false);
      toast({ title: "Created!", description: "Syllabus record created successfully." });
    },
    onError: (err: Error) => {
      setFormError(err.message || "Failed to create");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData | Record<string, unknown> }) => {
      const token = await getToken();
      if (data instanceof FormData) {
        const res = await fetch(`/api/admin/syllabus/${id}`, {
          method: "PATCH",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: data,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Failed to update syllabus");
        }
        return res.json();
      }
      return adminFetch<SyllabusItem>(`/api/admin/syllabus/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      invalidate();
      setSheetOpen(false);
      toast({ title: "Saved!", description: "Syllabus updated." });
    },
    onError: (err: Error) => {
      setFormError(err.message || "Failed to update");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) =>
      adminFetch<Record<string, unknown>>(`/api/admin/syllabus/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidate();
      setDeleteId(null);
      toast({ title: "Deleted", description: "Syllabus record removed." });
    },
    onError: () => toast({ title: "Delete failed", variant: "destructive" }),
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingItem(null);
    setSheetOpen(true);
  };

  const openEdit = (item: SyllabusItem) => {
    setEditingItem(item);
    setUploadMode("url");
    setSheetOpen(true);
  };

  const openView = (item: SyllabusItem) => {
    setViewingItem(item);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setFileName(selected.name);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formTitle.trim()) {
      setFormError("Title is required.");
      return;
    }

    const url = formUrl.trim() || null;

    if (editingItem) {
      if (uploadMode === "file" && file) {
        const formData = new FormData();
        formData.append("title", formTitle.trim());
        formData.append("examCategory", formExamCategory.trim() || "");
        formData.append("file", file);
        updateMutation.mutate({ id: editingItem.id, data: formData });
      } else {
        updateMutation.mutate({
          id: editingItem.id,
          data: {
            title: formTitle.trim(),
            examCategory: formExamCategory.trim() || null,
            readUrl: url,
            downloadUrl: url,
          },
        });
      }
      return;
    }

    // Create
    if (uploadMode === "file") {
      if (!file) {
        setFormError("Please select a syllabus PDF file.");
        return;
      }
      const formData = new FormData();
      formData.append("title", formTitle.trim());
      formData.append("examCategory", formExamCategory.trim() || "");
      formData.append("file", file);
      createMutation.mutate(formData);
    } else {
      createMutation.mutate({
        title: formTitle.trim(),
        examCategory: formExamCategory.trim() || null,
        readUrl: url,
        downloadUrl: url,
      });
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
              <FileText className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Syllabus</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {list.length} total syllabi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <AnimatePresence>
              {list.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="hidden sm:flex items-center gap-1.5 bg-sky-50 border border-sky-200 rounded-full px-3 py-1.5"
                >
                  <motion.span
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ repeat: Infinity, duration: 2.2 }}
                    className="w-2 h-2 rounded-full bg-sky-500 inline-block"
                  />
                  <span className="text-xs font-semibold text-indigo-700">{list.length} shown</span>
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
                <Plus className="w-4 h-4" /> Add Syllabus
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
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}>
                <Loader2 className="w-7 h-7 text-indigo-500" />
              </motion.div>
              <p className="text-sm text-muted-foreground">Loading syllabus list…</p>
            </div>
          ) : list.length === 0 ? (
            <div className="py-16 px-6">
              <Empty>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
                    <FileText className="w-7 h-7 text-indigo-400" />
                  </div>
                  <EmptyTitle>No syllabus yet</EmptyTitle>
                  <EmptyDescription>Click &quot;Add Syllabus&quot; above to upload or link a curriculum.</EmptyDescription>
                  <Button
                    onClick={openCreate}
                    variant="outline"
                    className="mt-4 rounded-xl gap-1.5 border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                  >
                    <Plus className="w-4 h-4" /> Add one
                  </Button>
                </motion.div>
              </Empty>
            </div>
          ) : (
            <div className="overflow-x-auto scrollbar-thin">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/70 hover:bg-gray-50/70">
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-gray-500 pl-5">Title</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-gray-500">Reference Links</TableHead>
                    <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-gray-500 pr-5">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {list.map((item, i) => (
                      <motion.tr
                        key={item.id}
                        custom={i}
                        variants={tableRowVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout
                        className="group border-b border-border/40 hover:bg-gray-50/60 transition-colors cursor-pointer"
                        onClick={() => openView(item)}
                      >
                        <TableCell className="pl-5 py-3.5 max-w-[260px]">
                          <div className="flex items-start gap-2.5">
                            <div className="mt-0.5 w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
                              <FileText className="w-3.5 h-3.5 text-indigo-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-1">{item.title}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {item.readUrl && (
                              <Badge variant="outline" className="text-[10px] bg-indigo-50/50 text-indigo-700 border-indigo-100 cursor-pointer hover:bg-indigo-50" onClick={(e) => { e.stopPropagation(); window.open(item.readUrl!, "_blank"); }}>
                                Read online
                              </Badge>
                            )}
                            {item.downloadUrl && (
                              <Badge variant="outline" className="text-[10px] bg-emerald-50/50 text-emerald-700 border-emerald-100 cursor-pointer hover:bg-emerald-50" onClick={(e) => { e.stopPropagation(); window.open(item.downloadUrl!, "_blank"); }}>
                                Download PDF
                              </Badge>
                            )}
                            {!item.readUrl && !item.downloadUrl && (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-5" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-indigo-50 hover:text-indigo-600" onClick={() => openView(item)}>
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                </motion.div>
                              </TooltipTrigger>
                              <TooltipContent>View Details</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-amber-50 hover:text-amber-600" onClick={() => openEdit(item)}>
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                </motion.div>
                              </TooltipTrigger>
                              <TooltipContent>Edit</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600" onClick={() => setDeleteId(item.id)}>
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

        {/* ── Detail Dialog ───────────────────────────────────────────────── */}
        <Dialog open={!!viewingItem} onOpenChange={(open) => !open && setViewingItem(null)}>
          <DialogContent className="sm:max-w-md">
            {viewingItem && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold text-gray-900">{viewingItem.title}</DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">Syllabus details and references</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">Exam</p>
                    <p className="text-sm font-semibold text-gray-900">{viewingItem.title}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Read URL</p>
                      {viewingItem.readUrl ? (
                        <button onClick={() => window.open(viewingItem.readUrl!, "_blank")} className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 mt-0.5 block truncate max-w-full text-left cursor-pointer">
                          {viewingItem.readUrl}
                        </button>
                      ) : (
                        <p className="text-sm text-gray-400 mt-0.5">—</p>
                      )}
                    </div>
                    <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Download URL</p>
                      {viewingItem.downloadUrl ? (
                        <button onClick={() => window.open(viewingItem.downloadUrl!, "_blank")} className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 mt-0.5 block truncate max-w-full text-left cursor-pointer">
                          {viewingItem.downloadUrl}
                        </button>
                      ) : (
                        <p className="text-sm text-gray-400 mt-0.5">—</p>
                      )}
                    </div>
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
                  <FileText className="w-5 h-5 text-indigo-600" />
                </motion.div>
                <div>
                  <SheetTitle className="text-base font-bold text-gray-900">
                    {editingItem ? "Edit Syllabus" : "Add Syllabus"}
                  </SheetTitle>
                  <SheetDescription className="text-xs text-muted-foreground">
                    {editingItem ? "Update the syllabus name and file." : "Upload a PDF or link to a syllabus."}
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
                <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="e.g. UPSC CSE Syllabus" required className="rounded-xl h-10" />
              </motion.div>

              <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Exam Category</Label>
                <Input value={formExamCategory} onChange={(e) => setFormExamCategory(e.target.value)} placeholder="e.g. UPSC CSE" className="rounded-xl h-10" />
              </motion.div>

                    {/* Upload Mode Toggle */}
                    <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-3">
                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1 rounded-xl">
                  <button type="button" onClick={() => setUploadMode("file")}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${uploadMode === "file" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500"}`}
                  >
                    Upload PDF
                  </button>
                  <button type="button" onClick={() => setUploadMode("url")}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${uploadMode === "url" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500"}`}
                  >
                    URL Link
                  </button>
                </div>

                {uploadMode === "file" ? (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-500 transition-all hover:bg-indigo-50/20">
                    <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" id="syllabus-file-input" />
                    <label htmlFor="syllabus-file-input" className="cursor-pointer block">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-gray-700">{fileName || "Select PDF document"}</p>
                      <p className="text-xs text-gray-400 mt-1">PDF max 50MB</p>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">URL</Label>
                    <Input value={formUrl} onChange={(e) => setFormUrl(e.target.value)} placeholder="https://..." className="rounded-xl h-10" />
                  </div>
                )}
              </motion.div>
            </form>

            <div className="px-6 py-4 border-t bg-gray-50/60 flex gap-2.5 shrink-0">
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)} className="flex-1 rounded-xl font-semibold">Cancel</Button>
              <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 380, damping: 20 }}>
                <Button type="submit" disabled={isPending || !formTitle.trim()} onClick={handleSubmit}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-200 gap-2"
                >
                  {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : editingItem ? "Save Changes" : "Create Syllabus"}
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
