"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Eye,
  BookOpen,
  Loader2,
  Upload,
  Edit,
} from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { useAuth } from "@clerk/nextjs";
import { ConfirmDeleteDialog } from "@/components/admin/ConfirmDeleteDialog";

// ── Types ─────────────────────────────────────────────────────────────────────
interface NcertBook {
  id: string;
  title: string;
  classNum: number;
  subject: string;
  medium: string;
  readUrl: string | null;
  downloadUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const CLASSES = Array.from({ length: 12 }, (_, i) => i + 1);

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
export default function NcertAdminPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const adminFetch = useAdminFetch();
  const { getToken } = useAuth();
  const { data: pyqSubjects = [] } = useListSubjects();

  // Detail Dialog
  const [viewingItem, setViewingItem] = useState<NcertBook | null>(null);

  // Sheet (create/edit)
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NcertBook | null>(null);

  // Delete
  const [deleteTargetId, setDeleteId] = useState<string | null>(null);

  // ── Form state ────────────────────────────────────────────────────────────
  const [uploadMode, setUploadMode] = useState<"file" | "url">("file");
  const [formTitle, setFormTitle] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formClassNum, setFormClassNum] = useState("1");
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState("");

  // Reset form when sheet opens
  useEffect(() => {
    if (sheetOpen) {
      if (editingItem) {
        setFormTitle(editingItem.title);
        setFormSubject(editingItem.subject);
        setFormClassNum(String(editingItem.classNum));
        setExternalUrl(editingItem.downloadUrl || "");
        setUploadMode("url");
        setFile(null);
        setFileName("");
        setFormError("");
      } else {
        setFormTitle("");
        setFormSubject("");
        setFormClassNum("1");
        setFile(null);
        setFileName("");
        setExternalUrl("");
        setUploadMode("file");
        setFormError("");
      }
    }
  }, [sheetOpen, editingItem]);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: response, isLoading } = useQuery({
    queryKey: ["admin", "ncert-books"],
    queryFn: () =>
      adminFetch<{ data: NcertBook[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>("/api/admin/ncert-books"),
  });
  const books = response?.data ?? [];

  // ── Create/update mutations ──────────────────────────────────────────────
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "ncert-books"] });

  const createMutation = useMutation({
    mutationFn: async (data: FormData | Record<string, unknown>) => {
      if (data instanceof FormData) {
        const token = await getToken();
        const res = await fetch("/api/admin/ncert-books", {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: data,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Upload failed");
        }
        return res.json();
      }
      return adminFetch<NcertBook>("/api/admin/ncert-books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      invalidate();
      setSheetOpen(false);
      setEditingItem(null);
      toast({ title: "Success!", description: "NCERT Book created successfully." });
    },
    onError: (err: Error) => {
      setFormError(err.message);
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormData | Record<string, unknown> }) => {
      if (data instanceof FormData) {
        const token = await getToken();
        const res = await fetch(`/api/admin/ncert-books/${id}`, {
          method: "PATCH",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: data,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Update failed");
        }
        return res.json();
      }
      return adminFetch<NcertBook>(`/api/admin/ncert-books/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      invalidate();
      setSheetOpen(false);
      setEditingItem(null);
      toast({ title: "Updated", description: "NCERT Book updated successfully." });
    },
    onError: (err: Error) => {
      setFormError(err.message);
      toast({ title: "Failed", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return adminFetch<Record<string, unknown>>(`/api/admin/ncert-books/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      invalidate();
      setDeleteId(null);
      toast({ title: "Deleted", description: "NCERT Book removed." });
    },
    onError: () => toast({ title: "Delete failed", variant: "destructive" }),
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingItem(null);
    setSheetOpen(true);
  };

  const openEdit = (book: NcertBook) => {
    setEditingItem(book);
    setSheetOpen(true);
  };

  const openView = (book: NcertBook) => {
    setViewingItem(book);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setFileName(selected.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formTitle.trim() || !formSubject) {
      setFormError("Title and Subject are required.");
      return;
    }

    if (uploadMode === "file" && !file) {
      setFormError("Please select a file to upload.");
      return;
    }
    if (uploadMode === "url" && !externalUrl.trim() && !editingItem) {
      setFormError("Please supply a valid URL.");
      return;
    }

    setUploading(true);
    try {
      if (uploadMode === "file" && file) {
        // File mode -> FormData through multer
        const formData = new FormData();
        formData.append("title", formTitle.trim());
        formData.append("subject", formSubject);
        formData.append("classNum", formClassNum);
        formData.append("medium", "English");
        formData.append("file", file);

        if (editingItem) {
          updateMutation.mutate({ id: editingItem.id, data: formData });
        } else {
          createMutation.mutate(formData);
        }
      } else {
        // URL mode -> JSON
        const url = externalUrl.trim();
        const payload: Record<string, unknown> = {
          title: formTitle.trim(),
          subject: formSubject,
          classNum: parseInt(formClassNum),
          medium: "English",
          downloadUrl: url || null,
          readUrl: url || null,
        };

        if (editingItem) {
          updateMutation.mutate({ id: editingItem.id, data: payload });
        } else {
          createMutation.mutate(payload);
        }
      }
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

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
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center shadow-lg shadow-green-200 shrink-0"
            >
              <BookOpen className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">NCERT Books</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {books.length} total books
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <AnimatePresence>
              {books.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="hidden sm:flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3 py-1.5"
                >
                  <motion.span
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ repeat: Infinity, duration: 2.2 }}
                    className="w-2 h-2 rounded-full bg-green-500 inline-block"
                  />
                  <span className="text-xs font-semibold text-green-700">{books.length} shown</span>
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
                <Plus className="w-4 h-4" /> Add Book
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
                <Loader2 className="w-7 h-7 text-green-500" />
              </motion.div>
              <p className="text-sm text-muted-foreground">Loading NCERT books…</p>
            </div>
          ) : books.length === 0 ? (
            <div className="py-16 px-6">
              <Empty>
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-green-50 flex items-center justify-center mb-4">
                    <BookOpen className="w-7 h-7 text-green-400" />
                  </div>
                  <EmptyTitle>No NCERT books yet</EmptyTitle>
                  <EmptyDescription>Click &quot;Add Book&quot; above to upload a PDF or link a resource.</EmptyDescription>
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
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-gray-500">Subject</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-gray-500">Class</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-gray-500">Size</TableHead>
                    <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-gray-500 pr-5">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {books.map((book, i) => (
                      <motion.tr
                        key={book.id}
                        custom={i}
                        variants={tableRowVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout
                        className="group border-b border-border/40 hover:bg-gray-50/60 transition-colors cursor-pointer"
                        onClick={() => openView(book)}
                      >
                        <TableCell className="pl-5 py-3.5 max-w-[260px]">
                          <div className="flex items-start gap-2.5">
                            <div className="mt-0.5 w-7 h-7 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center shrink-0">
                              <BookOpen className="w-3.5 h-3.5 text-green-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-1">{book.title}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-bold">{book.subject}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-bold text-gray-700">Class {book.classNum}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-gray-500">{book.downloadUrl ? "PDF" : "External Link"}</span>
                        </TableCell>
                        <TableCell className="text-right pr-5" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            {book.downloadUrl && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-indigo-50 hover:text-indigo-600" onClick={() => window.open(book.downloadUrl!, "_blank")}>
                                      <Eye className="h-3.5 w-3.5" />
                                    </Button>
                                  </motion.div>
                                </TooltipTrigger>
                                <TooltipContent>View PDF</TooltipContent>
                              </Tooltip>
                            )}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:text-amber-600 hover:bg-amber-50" onClick={() => openEdit(book)}>
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                </motion.div>
                              </TooltipTrigger>
                              <TooltipContent>Edit</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600" onClick={() => setDeleteId(book.id)}>
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
                  <DialogDescription className="text-xs text-muted-foreground">NCERT book details</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-3">
                      <p className="text-gray-400 font-semibold uppercase tracking-wide">Subject</p>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">{viewingItem.subject}</p>
                    </div>
                    <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-3">
                      <p className="text-gray-400 font-semibold uppercase tracking-wide">Class</p>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">Class {viewingItem.classNum}</p>
                    </div>
                    <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-3">
                      <p className="text-gray-400 font-semibold uppercase tracking-wide">Medium</p>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">{viewingItem.medium}</p>
                    </div>
                    <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-3">
                      <p className="text-gray-400 font-semibold uppercase tracking-wide">Created</p>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">{viewingItem.createdAt ? new Date(viewingItem.createdAt).toLocaleDateString() : "—"}</p>
                    </div>
                  </div>
                  {viewingItem.downloadUrl && (
                    <Button
                      variant="outline"
                      className="w-full rounded-xl gap-2"
                      onClick={() => window.open(viewingItem.downloadUrl!, "_blank")}
                    >
                      Open PDF
                    </Button>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* ── Create/Edit Sheet ────────────────────────────────────────── */}
        <Sheet open={sheetOpen} onOpenChange={(open) => { if (!open) { setEditingItem(null); setSheetOpen(false); } }}>
          <SheetContent side="right" className="w-full sm:max-w-md flex flex-col gap-0 p-0 overflow-hidden">
            <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                  className="w-10 h-10 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center"
                >
                  <BookOpen className="w-5 h-5 text-green-600" />
                </motion.div>
                <div>
                  <SheetTitle className="text-base font-bold text-gray-900">{editingItem ? "Edit NCERT Book" : "Add NCERT Book"}</SheetTitle>
                  <SheetDescription className="text-xs text-muted-foreground">Upload a PDF or link to an external resource.</SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto scrollbar-thin px-6 py-5 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">{formError}</div>
              )}

              <motion.div custom={0} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Title *</Label>
                <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Book title..." required className="rounded-xl h-10" />
              </motion.div>

              <div className="grid grid-cols-2 gap-3">
                <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Subject *</Label>
                  <Select value={formSubject} onValueChange={setFormSubject}>
                    <SelectTrigger className="w-full rounded-xl h-10">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      {pyqSubjects.map((s: { id: string | number; name: string }) => (
                        <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </motion.div>
                <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Class *</Label>
                  <Select value={formClassNum} onValueChange={setFormClassNum}>
                    <SelectTrigger className="w-full rounded-xl h-10">
                      <SelectValue placeholder="Class" />
                    </SelectTrigger>
                    <SelectContent>
                      {CLASSES.map((c) => (
                        <SelectItem key={c} value={String(c)}>Class {c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </motion.div>
              </div>

              {/* Upload Mode Toggle */}
              <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="visible" className="grid grid-cols-2 gap-2 bg-gray-50 p-1 rounded-xl">
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
              </motion.div>

              {uploadMode === "file" ? (
                <motion.div custom={4} variants={fieldVariants} initial="hidden" animate="visible"
                  className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-500 transition-all hover:bg-indigo-50/20"
                >
                  <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" id="ncert-file-input" />
                  <label htmlFor="ncert-file-input" className="cursor-pointer block">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-700">{fileName || "Select PDF document"}</p>
                    <p className="text-xs text-gray-400 mt-1">PDF max 50MB</p>
                  </label>
                </motion.div>
              ) : (
                <motion.div custom={4} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    {editingItem ? "PDF / External URL" : "External Link URL *"}
                  </Label>
                  <Input type="url" value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} placeholder="https://..." required={!editingItem} className="rounded-xl h-10" />
                  {editingItem && editingItem.downloadUrl && (
                    <p className="text-[11px] text-muted-foreground">Current URL: {editingItem.downloadUrl}</p>
                  )}
                </motion.div>
              )}
            </form>

            <div className="px-6 py-4 border-t bg-gray-50/60 flex gap-2.5 shrink-0">
              <Button type="button" variant="outline" onClick={() => { setEditingItem(null); setSheetOpen(false); }} className="flex-1 rounded-xl font-semibold">Cancel</Button>
              <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 380, damping: 20 }}>
                <Button type="submit" disabled={uploading || createMutation.isPending || updateMutation.isPending || !formTitle.trim() || !formSubject} onClick={handleSubmit}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-200 gap-2"
                >
                  {uploading || createMutation.isPending || updateMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> {editingItem ? "Saving…" : "Uploading…"}</>
                  ) : editingItem ? "Save Changes" : "Add Book"}
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
