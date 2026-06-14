"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Edit,
  Eye,
  BookOpen,
  Loader2,
  ExternalLink,
  Upload,
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
import { useAuth } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import { useListSubjects } from "@/lib/api";
import { useAdminFetch } from "@/hooks/useAdminFetch";
import { ConfirmDeleteDialog } from "@/components/admin/ConfirmDeleteDialog";

// ── Types ─────────────────────────────────────────────────────────────────────
interface StudyNote {
  id: number;
  title: string;
  description: string | null;
  subject: string;
  medium: string;
  url: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
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
export default function StudyNotesAdminPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { getToken } = useAuth();
  const adminFetch = useAdminFetch();
  const { data: pyqSubjects = [] } = useListSubjects();

  // Detail Dialog
  const [viewingItem, setViewingItem] = useState<StudyNote | null>(null);

  // Sheet (create/edit)
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StudyNote | null>(null);

  // Delete
  const [deleteTargetId, setDeleteId] = useState<number | null>(null);

  // ── Form state ────────────────────────────────────────────────────────────
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formMedium, setFormMedium] = useState("English");
  const [formUrl, setFormUrl] = useState("");
  const [formError, setFormError] = useState("");
  const [noteFile, setNoteFile] = useState<File | null>(null);
  const [noteFileName, setNoteFileName] = useState("");
  const [uploadMode, setUploadMode] = useState<"url" | "file">("url");
  const [uploading, setUploading] = useState(false);

  // Set default subject once subjects load
  useEffect(() => {
    if (pyqSubjects.length > 0 && !formSubject) {
      setFormSubject(pyqSubjects[0].name);
    }
  }, [pyqSubjects, formSubject]);

  // Sync form when sheet opens
  useEffect(() => {
    if (sheetOpen) {
      if (editingItem) {
        setFormTitle(editingItem.title);
        setFormDescription(editingItem.description ?? "");
        setFormSubject(editingItem.subject);
        setFormMedium(editingItem.medium);
        setFormUrl(editingItem.url ?? "");
        setNoteFile(null);
        setNoteFileName("");
        setUploadMode("url");
      } else {
        setFormTitle("");
        setFormDescription("");
        setFormSubject(pyqSubjects[0]?.name || "");
        setFormMedium("English");
        setFormUrl("");
        setNoteFile(null);
        setNoteFileName("");
        setUploadMode("url");
      }
      setFormError("");
    }
  }, [sheetOpen, editingItem, pyqSubjects]);

  // ── Queries ────────────────────────────────────────────────────────────────
  const { data: notesResponse, isLoading } = useQuery<{ data: StudyNote[]; pagination: Record<string, unknown> }>({
    queryKey: ["admin", "study-notes"],
    queryFn: () => adminFetch<{ data: StudyNote[]; pagination: Record<string, unknown> }>("/api/admin/study-notes"),
  });
  const notes = notesResponse?.data ?? [];

  // ── Mutations ──────────────────────────────────────────────────────────────
  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "study-notes"] });

  const createMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) =>
      adminFetch<StudyNote>("/api/admin/study-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      invalidate();
      toast({ title: "Created!", description: "Study note created successfully." });
      setSheetOpen(false);
    },
    onError: (err: Error) => {
      setFormError(err.message || "Failed to create");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, body }: { id: number; body: Record<string, unknown> }) =>
      adminFetch<StudyNote>(`/api/admin/study-notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      invalidate();
      toast({ title: "Saved!", description: "Study note updated." });
      setSheetOpen(false);
    },
    onError: (err: Error) => {
      setFormError(err.message || "Failed to update");
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) =>
      adminFetch<Record<string, unknown>>(`/api/admin/study-notes/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      invalidate();
      setDeleteId(null);
      toast({ title: "Deleted", description: "Study note removed." });
    },
    onError: () => toast({ title: "Delete failed", variant: "destructive" }),
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingItem(null);
    setSheetOpen(true);
  };

  const openEdit = (note: StudyNote) => {
    setEditingItem(note);
    setSheetOpen(true);
  };

  const openView = (note: StudyNote) => {
    setViewingItem(note);
  };

  const handleNoteFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setNoteFile(selected);
      setNoteFileName(selected.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!formTitle.trim() || !formSubject) {
      setFormError("Title and Subject are required.");
      return;
    }

    if (editingItem) {
      if (uploadMode === "file" && noteFile) {
        setUploading(true);
        try {
          const formData = new FormData();
          formData.append("title", formTitle.trim());
          formData.append("description", formDescription.trim() || "");
          formData.append("subject", formSubject);
          formData.append("medium", formMedium);
          formData.append("file", noteFile);

          const token = await getToken();
          const res = await fetch("/api/admin/study-notes/" + editingItem.id, {
            method: "PATCH",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || "Upload failed");
          }

          invalidate();
          toast({ title: "Updated!", description: "Study note with PDF uploaded." });
          setSheetOpen(false);
        } catch (err) {
          setFormError(err instanceof Error ? err.message : "Upload failed");
          toast({ title: "Error", description: err instanceof Error ? err.message : "Upload failed", variant: "destructive" });
        } finally {
          setUploading(false);
        }
      } else {
        const payload = {
          title: formTitle.trim(),
          description: formDescription.trim() || null,
          subject: formSubject,
          medium: formMedium,
          url: formUrl.trim() || null,
        };
        updateMutation.mutate({ id: editingItem.id, body: payload });
      }
    } else {
      if (uploadMode === "file" && noteFile) {
        setUploading(true);
        try {
          const formData = new FormData();
          formData.append("title", formTitle.trim());
          formData.append("description", formDescription.trim() || "");
          formData.append("subject", formSubject);
          formData.append("medium", formMedium);
          formData.append("file", noteFile);

          const token = await getToken();
          const res = await fetch("/api/admin/study-notes", {
            method: "POST",
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || "Upload failed");
          }

          invalidate();
          toast({ title: "Created!", description: "Study note with PDF uploaded." });
          setSheetOpen(false);
        } catch (err) {
          setFormError(err instanceof Error ? err.message : "Upload failed");
          toast({ title: "Error", description: err instanceof Error ? err.message : "Upload failed", variant: "destructive" });
        } finally {
          setUploading(false);
        }
      } else {
        createMutation.mutate({
          title: formTitle.trim(),
          description: formDescription.trim() || null,
          subject: formSubject,
          medium: formMedium,
          url: formUrl.trim() || null,
        });
      }
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending || uploading;

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
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Study Notes</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {notes.length} total notes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <AnimatePresence>
              {notes.length > 0 && (
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
                  <span className="text-xs font-semibold text-indigo-700">{notes.length} shown</span>
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
                <Plus className="w-4 h-4" /> Add Note
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
              <p className="text-sm text-muted-foreground">Loading study notes…</p>
            </div>
          ) : notes.length === 0 ? (
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
                  <EmptyTitle>No study notes yet</EmptyTitle>
                  <EmptyDescription>Click &quot;Add Note&quot; above to create your first study note.</EmptyDescription>
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
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-gray-500">Medium</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-gray-500">URL</TableHead>
                    <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-gray-500 pr-5">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {notes.map((note, i) => (
                      <motion.tr
                        key={note.id}
                        custom={i}
                        variants={tableRowVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout
                        className="group border-b border-border/40 hover:bg-gray-50/60 transition-colors cursor-pointer"
                        onClick={() => openView(note)}
                      >
                        <TableCell className="pl-5 py-3.5 max-w-[260px]">
                          <div className="flex items-start gap-2.5">
                            <div className="mt-0.5 w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
                              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 text-sm leading-snug line-clamp-1">{note.title}</p>
                              {note.description && (
                                <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{note.description}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-bold">{note.subject}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-semibold text-gray-600">{note.medium}</span>
                        </TableCell>
                        <TableCell>
                          {note.url ? (
                            <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200 cursor-pointer hover:bg-indigo-100" onClick={(e) => { e.stopPropagation(); window.open(note.url!, "_blank"); }}>
                              <ExternalLink className="w-2.5 h-2.5 mr-1" /> Link
                            </Badge>
                          ) : (
                            <span className="text-xs text-gray-300">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right pr-5" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-indigo-50 hover:text-indigo-600" onClick={() => openView(note)}>
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                </motion.div>
                              </TooltipTrigger>
                              <TooltipContent>View Details</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-amber-50 hover:text-amber-600" onClick={() => openEdit(note)}>
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                </motion.div>
                              </TooltipTrigger>
                              <TooltipContent>Edit</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600" onClick={() => setDeleteId(note.id)}>
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
                  <DialogDescription className="text-xs text-muted-foreground">Study note details</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  {viewingItem.description && (
                    <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-3">
                      <p className="text-xs text-gray-600">{viewingItem.description}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-3">
                      <p className="text-gray-400 font-semibold uppercase tracking-wide">Subject</p>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">{viewingItem.subject}</p>
                    </div>
                    <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-3">
                      <p className="text-gray-400 font-semibold uppercase tracking-wide">Medium</p>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">{viewingItem.medium}</p>
                    </div>
                  </div>
                  {viewingItem.url && (
                    <Button
                      variant="outline"
                      className="w-full rounded-xl gap-2"
                      onClick={() => window.open(viewingItem.url!, "_blank")}
                    >
                      <ExternalLink className="w-4 h-4" /> Open Note
                    </Button>
                  )}
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
                  <BookOpen className="w-5 h-5 text-indigo-600" />
                </motion.div>
                <div>
                  <SheetTitle className="text-base font-bold text-gray-900">
                    {editingItem ? "Edit Study Note" : "Add Study Note"}
                  </SheetTitle>
                  <SheetDescription className="text-xs text-muted-foreground">
                    {editingItem ? "Update the study note details below." : "Create a new study note for students."}
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
                <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Note title..." required className="rounded-xl h-10" />
              </motion.div>

              <motion.div custom={1} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Description</Label>
                <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Optional description..." rows={2} className="rounded-xl resize-none" />
              </motion.div>

              <div className="grid grid-cols-2 gap-3">
                <motion.div custom={2} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Subject *</Label>
                  <Select value={formSubject} onValueChange={setFormSubject}>
                    <SelectTrigger className="w-full rounded-xl h-10">
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {pyqSubjects.map((s: { id: string | number; name: string }) => (
                        <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </motion.div>
                <motion.div custom={3} variants={fieldVariants} initial="hidden" animate="visible" className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Medium</Label>
                  <Select value={formMedium} onValueChange={setFormMedium}>
                    <SelectTrigger className="w-full rounded-xl h-10">
                      <SelectValue placeholder="Medium" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Hindi">Hindi</SelectItem>
                    </SelectContent>
                  </Select>
                </motion.div>
              </div>

              {/* Upload mode toggle - available for both create and edit */}
              <motion.div custom={4} variants={fieldVariants} initial="hidden" animate="visible">
                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1 rounded-xl mb-3">
                  <button type="button" onClick={() => setUploadMode("url")}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${uploadMode === "url" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500"}`}
                  >
                    URL Link
                  </button>
                  <button type="button" onClick={() => setUploadMode("file")}
                    className={`py-1.5 text-xs font-bold rounded-lg transition-all ${uploadMode === "file" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500"}`}
                  >
                    Upload PDF
                  </button>
                </div>
                {uploadMode === "file" ? (
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-sky-500 transition-all hover:bg-sky-50/20">
                    <input type="file" accept=".pdf" onChange={handleNoteFileChange} className="hidden" id="study-note-file-input" />
                    <label htmlFor="study-note-file-input" className="cursor-pointer block">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-gray-700">{noteFileName || "Select PDF document"}</p>
                      <p className="text-xs text-gray-400 mt-1">PDF max 50MB</p>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">URL (Optional)</Label>
                    <Input value={formUrl} onChange={(e) => setFormUrl(e.target.value)} placeholder="https://example.com/notes/..." className="rounded-xl h-10" />
                  </div>
                )}
              </motion.div>
            </form>

            <div className="px-6 py-4 border-t bg-gray-50/60 flex gap-2.5 shrink-0">
              <Button type="button" variant="outline" onClick={() => setSheetOpen(false)} className="flex-1 rounded-xl font-semibold">Cancel</Button>
              <motion.div className="flex-1" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} transition={{ type: "spring", stiffness: 380, damping: 20 }}>
                <Button type="submit" disabled={isPending || !formTitle.trim() || !formSubject} onClick={handleSubmit}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md shadow-indigo-200 gap-2"
                >
                  {isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : editingItem ? "Save Changes" : "Create Note"}
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
