"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Trash2,
  Eye,
  Plus,
  ExternalLink,
  Search,
  FileText,
  CheckCircle2,
  XCircle,
  Edit,
} from "lucide-react";
import { useListSubjects } from "@/lib/api";
import { useAdminFetch } from "@/hooks/useAdminFetch";
import { useAuth } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDeleteDialog } from "@/components/admin/ConfirmDeleteDialog";
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
import { YEARS } from "@/lib/data";
import { Empty, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Loader2, Upload } from "lucide-react";

interface PypPaper {
  id: string;
  examName: string;
  shiftName: string;
  year: number;
  subject: string | null;
  subjectId: string | null;
  questionPaperUrl: string | null;
  answerKeyUrl: string | null;
  answerKeyPdf: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}



export default function PypAdminPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Sheet state
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PypPaper | null>(null);
  const [deleteTargetId, setDeleteId] = useState<string | null>(null);
  const { getToken } = useAuth();
  const adminFetch = useAdminFetch();

  // Form state
  const [examName, setExamName] = useState("");
  const [shiftName, setShiftName] = useState("");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [subjectId, setSubjectId] = useState("");
  const [questionPaperUrl, setQuestionPaperUrl] = useState("");
  const [answerKeyUrl, setAnswerKeyUrl] = useState("");
  const [answerKeyPdf, setAnswerKeyPdf] = useState("");
  const [paperFile, setPaperFile] = useState<File | null>(null);
  const [paperFileName, setPaperFileName] = useState("");
  const [answerKeyFile, setAnswerKeyFile] = useState<File | null>(null);
  const [answerKeyFileName, setAnswerKeyFileName] = useState("");
  const [uploadMode, setUploadMode] = useState<"url" | "file">("url");
  const [uploadingPdf, setUploadingPdf] = useState(false);

  // Sync form when sheet opens for editing
  useEffect(() => {
    if (sheetOpen) {
      if (editingItem) {
        setExamName(editingItem.examName);
        setShiftName(editingItem.shiftName);
        setYear(String(editingItem.year));
        setSubjectId(editingItem.subjectId ? String(editingItem.subjectId) : "");
        setQuestionPaperUrl(editingItem.questionPaperUrl || "");
        // Use answerKeyUrl if set, otherwise fall back to answerKeyPdf
        setAnswerKeyUrl(editingItem.answerKeyUrl || editingItem.answerKeyPdf || "");
        setUploadMode("url");
      } else {
        resetForm();
      }
    }
  }, [sheetOpen, editingItem]);

  // Search
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dynamic Subjects
  const { data: subjects = [] } = useListSubjects();

  const { data: pypResponse, isLoading } = useQuery({
    queryKey: ["admin", "pyp", debouncedSearch],
    queryFn: () => {
      const sp = new URLSearchParams();
      if (debouncedSearch.trim()) sp.set("search", debouncedSearch.trim());
      const query = sp.toString();
      return adminFetch<{ data: PypPaper[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
        `/api/admin/pyp${query ? `?${query}` : ""}`,
      );
    },
  });
  const papers = pypResponse?.data ?? [];

  const createMutation = useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      return adminFetch<PypPaper>("/api/admin/pyp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "pyp"] });
      setSheetOpen(false);
      resetForm();
      toast({ title: "Created", description: "PYP paper added successfully" });
    },
    onError: (err: Error) => {
      toast({
        title: "Failed to create",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, body }: { id: string; body: Record<string, unknown> }) => {
      return adminFetch<PypPaper>(`/api/admin/pyp/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "pyp"] });
      setSheetOpen(false);
      setEditingItem(null);
      toast({ title: "Updated", description: "PYP paper updated successfully" });
    },
    onError: (err: Error) => {
      toast({
        title: "Failed to update",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return adminFetch<{ success: boolean }>(`/api/admin/pyp/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "pyp"] });
      toast({
        title: "Deleted",
        description: "PYP Paper deleted successfully",
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Failed to delete",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handlePaperFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setPaperFile(selected);
      setPaperFileName(selected.name);
    }
  };

  const handleAnswerKeyFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setAnswerKeyFile(selected);
      setAnswerKeyFileName(selected.name);
    }
  };

  const resetForm = () => {
    setExamName("");
    setShiftName("");
    setYear(String(new Date().getFullYear()));
    setSubjectId("");
    setQuestionPaperUrl("");
    setAnswerKeyUrl("");
    setAnswerKeyPdf("");
    setPaperFile(null);
    setPaperFileName("");
    setAnswerKeyFile(null);
    setAnswerKeyFileName("");
    setUploadMode("url");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examName.trim()) {
      toast({
        title: "Validation",
        description: "Exam name is required",
        variant: "destructive",
      });
      return;
    }

    // ── File mode: send FormData directly to /api/admin/pyp ──────────────
    if (uploadMode === "file" && (paperFile || answerKeyFile)) {
      setUploadingPdf(true);
      try {
        const formData = new FormData();
        formData.append("examName", examName.trim());
        formData.append("shiftName", shiftName);
        formData.append("year", year);
        if (subjectId) formData.append("subjectId", subjectId);
        // Preserve any existing URL values (for editing)
        if (questionPaperUrl.trim()) formData.append("questionPaperUrl", questionPaperUrl.trim());
        if (answerKeyUrl.trim()) formData.append("answerKeyUrl", answerKeyUrl.trim());
        if (answerKeyPdf.trim()) formData.append("answerKeyPdf", answerKeyPdf.trim());
        // Add files — the backend uploads them to Cloudinary
        if (paperFile) formData.append("paperFile", paperFile);
        if (answerKeyFile) formData.append("answerKeyFile", answerKeyFile);

        const token = await getToken();
        const endpoint = editingItem
          ? `/api/admin/pyp/${editingItem.id}`
          : "/api/admin/pyp";
        const method = editingItem ? "PATCH" : "POST";

        const res = await fetch(endpoint, {
          method,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || "Upload failed");
        }

        queryClient.invalidateQueries({ queryKey: ["admin", "pyp"] });
        setSheetOpen(false);
        resetForm();
        toast({ title: "Success!", description: `PYP paper ${editingItem ? "updated" : "added"} successfully` });
      } catch (err) {
        toast({ title: "Upload failed", description: err instanceof Error ? err.message : "Upload failed", variant: "destructive" });
      } finally {
        setUploadingPdf(false);
      }
      return;
    }

    // ── URL mode: send JSON ─────────────────────────────────────────────
    const payload = {
      examName: examName.trim(),
      shiftName,
      year: parseInt(year),
      subjectId: subjectId || null,
      questionPaperUrl: questionPaperUrl.trim() || null,
      answerKeyUrl: answerKeyUrl.trim() || null,
      answerKeyPdf: editingItem?.answerKeyPdf || answerKeyPdf.trim() || null,
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, body: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-6 p-2"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center">
            <FileText className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">
              PYP Papers
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage previous year papers and answer keys
            </p>
          </div>
        </div>
        <Button
          onClick={() => {
            setEditingItem(null);
            setSheetOpen(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl gap-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Paper
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={search}
          onChange={(e) => {
            const val = e.target.value;
            setSearch(val);
            if (searchTimer.current) clearTimeout(searchTimer.current);
            searchTimer.current = setTimeout(() => {
              setDebouncedSearch(val);
            }, 400);
          }}
          placeholder="Search papers..."
          className="pl-9 rounded-xl h-10"
        />
      </div>

      {/* Table Card */}
      <Card className="border border-border/50 bg-white shadow-sm overflow-hidden rounded-2xl">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Loading papers...
          </div>
        ) : papers.length === 0 ? (
          <div className="py-16 px-6">
            <Empty>
              <EmptyTitle>No PYP papers yet</EmptyTitle>
              <EmptyDescription>
                Click "Add Paper" above to add your first previous year paper.
              </EmptyDescription>
            </Empty>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/70">
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-gray-500">
                    Exam Name
                  </TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-gray-500">
                    Shift
                  </TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-gray-500">
                    Year
                  </TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-gray-500">
                    Subject
                  </TableHead>
                  <TableHead className="font-bold text-xs uppercase tracking-wider text-gray-500">
                    Answer Key
                  </TableHead>
                  <TableHead className="text-right font-bold text-xs uppercase tracking-wider text-gray-500">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {papers.map((paper) => (
                  <TableRow
                    key={paper.id}
                    className="hover:bg-gray-50/60 transition-colors"
                  >
                    <TableCell className="font-semibold text-gray-900">
                      {paper.examName}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {paper.shiftName}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-bold text-gray-700">
                      {paper.year}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {paper.subject ?? (
                        <span className="text-gray-400 italic">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {paper.answerKeyPdf || paper.answerKeyUrl ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Available
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-gray-400 text-xs"
                        >
                          <XCircle className="w-3 h-3 mr-1" /> N/A
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {paper.questionPaperUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              window.open(paper.questionPaperUrl!, "_blank")
                            }
                            className="h-8 gap-1.5 text-indigo-600 hover:text-indigo-800"
                          >
                            <Eye className="w-3.5 h-3.5" /> Paper
                          </Button>
                        )}
                        {paper.answerKeyPdf && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              window.open(paper.answerKeyPdf!, "_blank")
                            }
                            className="h-8 gap-1.5 text-emerald-600 hover:text-emerald-800"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Key
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingItem(paper);
                            setSheetOpen(true);
                          }}
                          className="h-8 gap-1.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteId(paper.id)}
                          className="h-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Create/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={(open) => { if (!open) setEditingItem(null); setSheetOpen(open); }}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md overflow-y-auto scrollbar-thin"
        >
          <SheetHeader className="mb-6">
            <SheetTitle className="text-lg font-bold text-gray-900">
              {editingItem ? "Edit PYP Paper" : "Add PYP Paper"}
            </SheetTitle>
            <SheetDescription>
              {editingItem ? "Update the paper details below." : "Add a previous year paper with URLs to the question paper and answer key"}
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Exam Name *
              </Label>
              <Input
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="e.g. UPSC Prelims 2025"
                required
                className="rounded-xl h-10"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Shift
                </Label>
                <Input
                  value={shiftName}
                  onChange={(e) => setShiftName(e.target.value)}
                  placeholder="e.g. Shift 1, Morning, Evening"
                  className="rounded-xl h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                  Year *
                </Label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger className="w-full rounded-xl h-10">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    {YEARS.map((y) => (
                      <SelectItem key={y} value={String(y)}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Subject
              </Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger className="w-full rounded-xl h-10">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {subjects.map((s: { id: string; name: string }) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Upload mode toggle */}
            <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1 rounded-xl">
              <button type="button" onClick={() => setUploadMode("url")}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${uploadMode === "url" ? "bg-white text-amber-700 shadow-sm" : "text-gray-500"}`}
              >
                URL Link
              </button>
              <button type="button" onClick={() => setUploadMode("file")}
                className={`py-1.5 text-xs font-bold rounded-lg transition-all ${uploadMode === "file" ? "bg-white text-amber-700 shadow-sm" : "text-gray-500"}`}
              >
                Upload PDF
              </button>
            </div>

            {uploadMode === "file" ? (
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-amber-500 transition-all hover:bg-amber-50/20">
                  <input type="file" accept=".pdf" onChange={handlePaperFileChange} className="hidden" id="pyp-file-input" />
                  <label htmlFor="pyp-file-input" className="cursor-pointer block">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-700">{paperFileName || "Select Question Paper PDF"}</p>
                    <p className="text-xs text-gray-400 mt-1">PDF max 50MB</p>
                  </label>
                </div>
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-emerald-500 transition-all hover:bg-emerald-50/20">
                  <input type="file" accept=".pdf" onChange={handleAnswerKeyFileChange} className="hidden" id="pyp-answerkey-input" />
                  <label htmlFor="pyp-answerkey-input" className="cursor-pointer block">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-gray-700">{answerKeyFileName || "Select Answer Key PDF (optional)"}</p>
                    <p className="text-xs text-gray-400 mt-1">Optional — upload answer key separately</p>
                  </label>
                </div>
              </div>
            ) : (
              <div className="border-t pt-4 space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Question Paper URL
                  </Label>
                  <Input
                    value={questionPaperUrl}
                    onChange={(e) => setQuestionPaperUrl(e.target.value)}
                    placeholder="https://..."
                    className="rounded-xl h-10"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    Answer Key URL
                  </Label>
                  <Input
                    value={answerKeyUrl}
                    onChange={(e) => setAnswerKeyUrl(e.target.value)}
                    placeholder="https://..."
                    className="rounded-xl h-10"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Link to answer key PDF or external answer key page
                  </p>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending || uploadingPdf || !examName.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl h-11"
            >
              {uploadingPdf ? <><Loader2 className="w-4 h-4 animate-spin mr-1" /> Uploading…</> : editingItem ? (updateMutation.isPending ? "Saving..." : "Save Changes") : createMutation.isPending ? "Creating..." : "Add PYP Paper"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

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
