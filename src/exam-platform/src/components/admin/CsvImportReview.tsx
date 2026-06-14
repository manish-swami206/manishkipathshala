"use client";

import { useState, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useListSubjects } from "@/lib/api";
import { useAdminFetch } from "@/hooks/useAdminFetch";
import {
  Upload,
  Loader2,
  ChevronLeft,
  ChevronRight,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  X,
} from "lucide-react";
import Papa from "papaparse";

// ── Types ─────────────────────────────────────────────────────────────────────
interface ParsedQuestion {
  rowIndex: number;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctIndex: number;
  explanation: string;
  subject: string;
  difficulty: string;
  negativeMarking: number;
}

interface CsvImportReviewProps {
  /** Optional queryKey prefix to invalidate after successful import (e.g. ["admin", "questions"]) */
  invalidateKeys?: string[][];
  /** Called after successful import */
  onSuccess?: (count: number) => void;
  /** Called when dialog closes */
  onClose?: () => void;
  /** External trigger ref */
  triggerRef?: React.RefObject<HTMLInputElement | null>;
}

// ── Columns CSV should have (multi-format support) ────────────────────────────
const KNOWN_COLUMNS = [
  { names: ["text", "Question", "question_text", "question"], field: "text" },

  { names: ["optionA", "option_a", "OptionA", "a"], field: "optionA" },
  { names: ["optionB", "option_b", "OptionB", "b"], field: "optionB" },
  { names: ["optionC", "option_c", "OptionC", "c"], field: "optionC" },
  { names: ["optionD", "option_d", "OptionD", "d"], field: "optionD" },
  { names: ["correctIndex", "correct_index", "CorrectIndex", "answer"], field: "correctIndex" },
  { names: ["explanation", "Explanation", "exp"], field: "explanation" },
  { names: ["subject", "Subject"], field: "subject" },
  { names: ["difficulty", "Difficulty", "level"], field: "difficulty" },

  { names: ["negativeMarking", "negative_marking", "negMarks"], field: "negativeMarking" },
];

function detectField(row: Record<string, string>, field: string): string {
  const col = KNOWN_COLUMNS.find((c) => c.field === field);
  if (!col) return "";
  for (const name of col.names) {
    if (row[name] !== undefined && row[name] !== null && row[name] !== "") {
      return row[name].trim();
    }
  }
  return "";
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export function CsvImportReview({ invalidateKeys, onSuccess, onClose, triggerRef }: CsvImportReviewProps) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const adminFetch = useAdminFetch();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: pyqSubjects = [] } = useListSubjects();

  // Dialog state
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"upload" | "review">("upload");
  const [parsed, setParsed] = useState<ParsedQuestion[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState("");

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.max(1, Math.ceil(parsed.length / ITEMS_PER_PAGE));
  const pageItems = parsed.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE);

  // ── Bulk subject assign ──────────────────────────────────────────────────
  const applySubjectToAll = (subject: string) => {
    setParsed((prev) =>
      prev.map((q) => ({ ...q, subject: q.subject || subject }))
    );
  };

  // ── Edit a single row ────────────────────────────────────────────────────
  const updateRow = (rowIndex: number, updates: Partial<ParsedQuestion>) => {
    setParsed((prev) =>
      prev.map((q) => (q.rowIndex === rowIndex ? { ...q, ...updates } : q))
    );
  };

  // ── Remove a row ─────────────────────────────────────────────────────────
  const removeRow = (rowIndex: number) => {
    setParsed((prev) => prev.filter((q) => q.rowIndex !== rowIndex));
  };

type UploadQuestion = Omit<ParsedQuestion, "rowIndex">;

  // ── Upload mutation ────────────────────────────────────────────────────
  const bulkUploadMutation = useMutation({
    mutationFn: async (questions: UploadQuestion[]) =>
      adminFetch<{ success: boolean; count: number }>("/api/admin/questions/bulk-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions }),
      }),
    onSuccess: (res) => {
      setImporting(false);
      toast({ title: "Imported!", description: `Successfully uploaded ${res.count} questions.` });
      if (invalidateKeys) {
        invalidateKeys.forEach((key) => qc.invalidateQueries({ queryKey: key }));
      }
      onSuccess?.(res.count);
      handleClose();
    },
    onError: (err: Error) => {
      setImporting(false);
      toast({ title: "Upload failed", description: err.message || "Invalid CSV layout", variant: "destructive" });
    },
  });

  // ── Handle file selection ────────────────────────────────────────────────
  const handleFile = useCallback((file: File) => {
    if (!file) return;
    setFileName(file.name);
    setImporting(true);
    setStep("upload");

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setImporting(false);
        const mapped: ParsedQuestion[] = results.data
          .map((row: Record<string, string>, idx: number) => {
            const text = detectField(row, "text");
            if (!text) return null;
            return {
              rowIndex: idx,
              text,
              optionA: detectField(row, "optionA") || "",
              optionB: detectField(row, "optionB") || "",
              optionC: detectField(row, "optionC") || "",
              optionD: detectField(row, "optionD") || "",
              correctIndex: parseInt(detectField(row, "correctIndex") || "0", 10) || 0,
              explanation: detectField(row, "explanation") || "",
              subject: detectField(row, "subject") || "",
              difficulty: detectField(row, "difficulty") || "medium",
              negativeMarking: parseFloat(detectField(row, "negativeMarking") || "0") || 0,
            };
          })
          .filter(Boolean) as ParsedQuestion[];

        if (mapped.length === 0) {
          toast({ title: "Empty file", description: "No valid rows found in CSV", variant: "destructive" });
          setOpen(false);
          return;
        }

        setParsed(mapped);
        setCurrentPage(0);
        setStep("review");
      },
      error: () => {
        setImporting(false);
        toast({ title: "Parsing failed", description: "Could not parse CSV file", variant: "destructive" });
        setOpen(false);
      },
    });
  }, [toast]);

  // Handle native file input change
  const handleNativeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (e.target) e.target.value = "";
  };

  // ── Open / close ─────────────────────────────────────────────────────────
  const handleOpen = () => {
    setOpen(true);
    setStep("upload");
    setParsed([]);
    setCurrentPage(0);
    setFileName("");
  };

  const handleClose = () => {
    setOpen(false);
    setStep("upload");
    setParsed([]);
    setCurrentPage(0);
    setFileName("");
    onClose?.();
  };

  // ── Submit ──────────────────────────────────────────────────────────────
  const handleSubmitImport = () => {
    const questions = parsed.map(({ rowIndex: _, ...q }) => ({
      ...q,
      negativeMarking: Number(q.negativeMarking),
    }));
    setImporting(true);
    bulkUploadMutation.mutate(questions);
  };

  // ── Status indicators per row ────────────────────────────────────────────
  const hasIssues = (q: ParsedQuestion) => {
    const issues: string[] = [];
    if (!q.text) issues.push("Missing text");
    if (!q.subject) issues.push("No subject");
    if (q.subject && !allSubjects.includes(q.subject)) issues.push(`Unknown subject: "${q.subject}"`);
    return issues;
  };

  // ── Auto-assign subjects from existing data ──────────────────────────────
  const existingSubjects = [...new Set(parsed.map((q) => q.subject).filter(Boolean))] as string[];
  const allSubjects = pyqSubjects.map((s: { id: string; name: string }) => s.name);

  return (
    <>
      {/* Hidden native file input */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".csv"
        onChange={handleNativeFile}
        className="hidden"
      />

      {/* Public method to open from outside */}
      {triggerRef && (
        <input
          type="file"
          ref={triggerRef}
          accept=".csv"
          onChange={handleNativeFile}
          className="hidden"
          style={{ display: "none" }}
        />
      )}

      {/* Trigger button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpen}
        className="rounded-xl h-9 gap-1.5"
      >
        <UploadCloud className="w-3.5 h-3.5" />
        Import CSV
      </Button>

      {/* ── Dialog ──────────────────────────────────────────────────────────── */}
      <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
          {step === "upload" && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                  Import Questions from CSV
                </DialogTitle>
                <DialogDescription>
                  Upload a CSV file with columns: text, optionA-D, correctIndex, subject, difficulty, etc.
                </DialogDescription>
              </DialogHeader>

              <div className="py-8">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center hover:border-indigo-300 hover:bg-indigo-50/20 transition-colors cursor-pointer"
                >
                  <Upload className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-gray-600">
                    {importing ? "Parsing..." : "Click to select CSV file"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Supports .csv files with standard question format</p>
                </div>
              </div>
            </>
          )}

          {step === "review" && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                  Review Import — {parsed.length} questions
                </DialogTitle>
                <DialogDescription>
                  Review parsed data, assign subjects, and correct any issues before importing.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Bulk actions */}
                <div className="flex items-center gap-3 flex-wrap p-3 bg-gray-50 rounded-xl border">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Bulk Actions:</span>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        applySubjectToAll(e.target.value);
                        e.target.value = "";
                      }
                    }}
                    className="px-2 py-1.5 border border-gray-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">Assign subject to all...</option>
                    {allSubjects.map((s: string) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>

                  {existingSubjects.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-400">Found:</span>
                      {existingSubjects.map((s) => (
                        <Badge key={s} variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 border-indigo-200">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <span className="text-xs text-gray-400 ml-auto">
                    {parsed.filter((q) => !q.subject).length} missing subjects
                  </span>
                </div>

                {/* Page navigation */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Page {currentPage + 1} of {totalPages}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage <= 0}
                        onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                        className="h-8 rounded-lg"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage >= totalPages - 1}
                        onClick={() => setCurrentPage((p) => p + 1)}
                        className="h-8 rounded-lg"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Question rows */}
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar" style={{scrollbarWidth:'thin',scrollbarColor:'hsl(var(--border)) transparent'}}>
                  {pageItems.map((q) => {
                    const issues = hasIssues(q);
                    return (
                      <div
                        key={q.rowIndex}
                        className={`p-4 rounded-xl border ${
                          issues.length > 0
                            ? "border-amber-200 bg-amber-50/30"
                            : "border-gray-100 bg-gray-50/30"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
                              #{q.rowIndex + 1}
                            </span>
                            <p className="text-sm font-semibold text-gray-900 line-clamp-2 flex-1">
                              {q.text}
                            </p>
                          </div>
                          <button
                            onClick={() => removeRow(q.rowIndex)}
                            className="shrink-0 ml-2 p-1 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Inline edits */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-semibold text-gray-400 uppercase">Subject</label>
                            <select
                              value={q.subject}
                              onChange={(e) => updateRow(q.rowIndex, { subject: e.target.value })}
                              className={`w-full mt-0.5 px-2 py-1 text-xs border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                                q.subject ? "border-gray-200" : "border-amber-300"
                              }`}
                            >
                              <option value="">Select...</option>
                              {allSubjects.map((s: string) => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="text-[10px] font-semibold text-gray-400 uppercase">Difficulty</label>
                            <select
                              value={q.difficulty}
                              onChange={(e) => updateRow(q.rowIndex, { difficulty: e.target.value })}
                              className="w-full mt-0.5 px-2 py-1 text-xs border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            >
                              <option value="easy">Easy</option>
                              <option value="medium">Medium</option>
                              <option value="hard">Hard</option>
                            </select>
                          </div>
                        </div>

                        {/* Issues */}
                        {issues.length > 0 && (
                          <div className="mt-2 flex items-center gap-1.5">
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                            <span className="text-[10px] font-semibold text-amber-600">
                              {issues.join(", ")}
                            </span>
                          </div>
                        )}

                        {q.subject && issues.length === 0 && (
                          <div className="mt-1.5 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                            <span className="text-[10px] text-green-600">Ready</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Summary */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border text-xs">
                  <span className="text-gray-500">
                    <strong className="text-gray-700">{parsed.length}</strong> questions parsed
                    <span className="text-gray-400 ml-2">
                      ({parsed.filter((q) => !q.subject).length} need subject,{" "}
                      {parsed.filter((q) => !q.text).length} missing text)
                    </span>
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClose}
                      className="rounded-lg h-8 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      disabled={importing || parsed.length === 0}
                      onClick={handleSubmitImport}
                      className="rounded-lg h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
                    >
                      {importing ? (
                        <><Loader2 className="w-3 h-3 animate-spin" /> Uploading...</>
                      ) : (
                        <><UploadCloud className="w-3 h-3" /> Import {parsed.length}</>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
