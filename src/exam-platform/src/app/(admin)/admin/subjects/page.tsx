"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Subject } from "@/lib/api";
import { useAdminFetch } from "@/hooks/useAdminFetch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Empty, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Trash2, Edit3, Check, X, BookOpen, BadgeCheck, AlertTriangle, FileText, ClipboardList, GraduationCap, ScrollText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDeleteDialog } from "@/components/admin/ConfirmDeleteDialog";
import { ApiError } from "@/lib/api/client";
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
import { motion } from "framer-motion";

export default function SubjectsAdminPage() {
  const adminFetch = useAdminFetch();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: subjects = [], isLoading } = useQuery<Subject[]>({
    queryKey: ["admin", "subjects"],
    queryFn: () => adminFetch<Subject[]>("/api/admin/subjects"),
  });

  const [name, setName] = useState("");
  const [examCategory, setExamCategory] = useState("General");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const [deleteTargetId, setDeleteId] = useState<string | null>(null);
  const [deleteWarning, setDeleteWarning] = useState<{
    message: string;
    references: {
      questions: number;
      examSets: number;
      mockTests: number;
      studyNotes: number;
      previousYearPapers: number;
      syllabus: number;
      total: number;
    };
  } | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const invalidateSubjects = () => {
    queryClient.invalidateQueries({ queryKey: ["admin", "subjects"] });
  };

  const createSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    try {
      await adminFetch(`/api/admin/subjects`, {
        method: "POST",
        body: JSON.stringify({ name: trimmedName, examCategory }),
        headers: { "Content-Type": "application/json" },
      });
      toast({ title: "Created", description: "Subject created successfully" });
      setName("");
      setExamCategory("General");
      invalidateSubjects();
    } catch (err: unknown) {
      toast({
        title: "Create failed",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    }
  };

  const startEdit = (subject: Subject) => {
    setEditingId(subject.id);
    setEditingName(subject.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const saveEdit = async (id: string) => {
    const trimmedName = editingName.trim();
    if (!trimmedName) return;

    try {
      await adminFetch(`/api/admin/subjects/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: trimmedName }),
        headers: { "Content-Type": "application/json" },
      });
      toast({ title: "Updated", description: "Subject updated successfully" });
      cancelEdit();
      invalidateSubjects();
    } catch (err: unknown) {
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await adminFetch(`/api/admin/subjects/${id}`, {
        method: "DELETE",
      });
      setDeleteId(null);
      toast({ title: "Deleted", description: "Subject deleted successfully" });
      invalidateSubjects();
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 409 && (err.body as Record<string, unknown>)?.warning) {
        const body = err.body as { message: string; references: Record<string, number> };
        setDeleteWarning({
          message: body.message,
          references: body.references as any,
        });
        setPendingDeleteId(id);
        setDeleteId(null);
      } else {
        toast({
          title: "Delete failed",
          description: err instanceof Error ? err.message : String(err),
          variant: "destructive",
        });
      }
    }
  };

  const handleForceDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      await adminFetch(`/api/admin/subjects/${pendingDeleteId}`, {
        method: "DELETE",
        body: JSON.stringify({ confirm: true }),
        headers: { "Content-Type": "application/json" },
      });
      setDeleteWarning(null);
      setPendingDeleteId(null);
      toast({ title: "Deleted", description: "Subject deleted successfully" });
      invalidateSubjects();
    } catch (err: unknown) {
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : String(err),
        variant: "destructive",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="max-w-6xl mx-auto space-y-6 p-2"
    >
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-indigo-600" />
          Subjects
        </h1>
        <p className="text-gray-500 mt-2">
          Manage dynamic subjects used for question grouping and curriculum configurations.
        </p>
      </div>

      <form onSubmit={createSubject} className="flex flex-col sm:flex-row gap-2 mb-4 max-w-lg">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New subject name..."
          className="rounded-xl h-11 w-full"
        />
        <Select value={examCategory} onValueChange={setExamCategory}>
          <SelectTrigger className="h-11 w-full sm:w-40 rounded-xl">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="General">General</SelectItem>
            <SelectItem value="UPSC">UPSC</SelectItem>
            <SelectItem value="SSC">SSC</SelectItem>
            <SelectItem value="Banking">Banking</SelectItem>
            <SelectItem value="Railway">Railway</SelectItem>
            <SelectItem value="State PSC">State PSC</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" disabled={!name.trim()} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 h-11 font-bold shrink-0 w-full sm:w-auto">
          Create
        </Button>
      </form>

      {isLoading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : subjects.length === 0 ? (
        <Empty>
          <EmptyTitle>No subjects found</EmptyTitle>
          <EmptyDescription>Create a subject to get started.</EmptyDescription>
        </Empty>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subjects.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-semibold text-gray-900">
                  {editingId === s.id ? (
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="w-full rounded-xl"
                      autoFocus
                    />
                  ) : (
                    <span className="flex items-center gap-2">
                      {s.name}
                      <span className="text-[10px] text-gray-400 font-mono">/{s.slug}</span>
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {s.examCategory ?? "General"}
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    s.isActive
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-gray-50 text-gray-400 border border-gray-200"
                  }`}>
                    {s.isActive ? <BadgeCheck className="w-3 h-3" /> : null}
                    {s.isActive ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  {editingId === s.id ? (
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => saveEdit(s.id)}
                        disabled={!editingName.trim()}
                      >
                        <Check className="w-4 h-4 text-green-600" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={cancelEdit}>
                        <X className="w-4 h-4 text-gray-400" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(s)}
                      >
                        <Edit3 className="w-4 h-4 text-gray-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(s.id)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <ConfirmDeleteDialog
        isOpen={deleteTargetId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteTargetId !== null) handleDelete(deleteTargetId);
        }}
      />

      {/* ── Reference Warning Dialog ──────────────────────────────────── */}
      <AlertDialog open={deleteWarning !== null} onOpenChange={(open) => !open && setDeleteWarning(null)}>
        <AlertDialogContent className="rounded-2xl border-border bg-white shadow-xl max-w-md">
          <AlertDialogHeader>
            <div className="mx-auto w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-2">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <AlertDialogTitle className="text-gray-900 font-bold text-lg text-center">
              Subject in use
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500 text-sm text-center">
              {deleteWarning?.message}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {deleteWarning && (
            <div className="space-y-2 px-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Referenced by:</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "Questions", key: "questions" as const, icon: BookOpen },
                  { label: "Exam Sets", key: "examSets" as const, icon: ClipboardList },
                  { label: "Mock Tests", key: "mockTests" as const, icon: FileText },
                  { label: "Study Notes", key: "studyNotes" as const, icon: ScrollText },
                  { label: "PY Papers", key: "previousYearPapers" as const, icon: GraduationCap },
                  { label: "Syllabus", key: "syllabus" as const, icon: FileText },
                ].map(({ label, key, icon: Icon }) => (
                  <div
                    key={key}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${
                      deleteWarning.references[key] > 0
                        ? "bg-amber-50 border-amber-200"
                        : "bg-gray-50 border-gray-100 opacity-50"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${
                      deleteWarning.references[key] > 0 ? "text-amber-600" : "text-gray-400"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-gray-600 truncate">{label}</p>
                      <p className={`text-xs font-bold ${
                        deleteWarning.references[key] > 0 ? "text-amber-700" : "text-gray-400"
                      }`}>
                        {deleteWarning.references[key]} record{deleteWarning.references[key] !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-center text-xs text-gray-400 pt-1">
                All references will be set to null (the referenced data will be preserved).
              </p>
            </div>
          )}

          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel asChild>
              <Button variant="outline" onClick={() => { setDeleteWarning(null); setPendingDeleteId(null); }} className="rounded-xl flex-1">
                Cancel
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                variant="destructive"
                onClick={() => {
                  handleForceDelete();
                  setDeleteWarning(null);
                }}
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
  );
}