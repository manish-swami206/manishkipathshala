"use client";

import React, { useState, useEffect } from "react";
import { PageTransition } from "@/components/shared/PageTransition";
import { DocumentActionButton } from "@/components/shared/DocumentActionButton";
import { useListStudyNotes, useListSubjects } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Empty, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import {
  Search,
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import PageHeading from "@/components/shared/PageHeading";

export default function StudyNotes() {
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState<string>("all");
  const [medium, setMedium] = useState<string>("all");
  const [page, setPage] = useState(1);

  // Reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, subject, medium]);

  const { data: pyqSubjects = [] } = useListSubjects();
  const { data, isLoading } = useListStudyNotes({
    search: search || undefined,
    subject: subject !== "all" ? subject : undefined,
    medium: medium !== "all" ? medium : undefined,
    page,
  });

  const totalPages = data?.totalPages ?? 1;

  return (
    <PageTransition className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="space-y-2">
        <PageHeading heading="Study Notes" />
        <p className="text-muted-foreground">
          Premium study material for comprehensive preparation.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-card border rounded-2xl shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search notes by title..."
            className="pl-9 w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger className="flex-1 sm:w-40">
              <SelectValue placeholder="Subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {pyqSubjects.map((s) => (
                <SelectItem key={s.id} value={s.name}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={medium} onValueChange={setMedium}>
            <SelectTrigger className="flex-1 sm:w-32">
              <SelectValue placeholder="Medium" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="English">English</SelectItem>
              <SelectItem value="Hindi">Hindi</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array(6)
            .fill(0)
            .map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)
        ) : data?.data.length === 0 ? (
          <div className="col-span-full">
            <Empty>
              <FileText className="w-10 h-10 text-gray-300" />
              <EmptyTitle>No study notes found</EmptyTitle>
              <EmptyDescription>
                No study notes match your current search or filter criteria. Try
                adjusting your filters.
              </EmptyDescription>
            </Empty>
          </div>
        ) : (
          data?.data.map((note) => (
            <Card
              key={note.id}
              className="card-hover border-border/50 rounded-2xl bg-card overflow-hidden"
            >
              <CardContent className="p-5 flex flex-col h-full gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-md">
                      {note.subject}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded-md">
                      {note.medium}
                    </span>
                  </div>
                  <h3 className="font-bold leading-tight line-clamp-2">
                    {note.title}
                  </h3>
                </div>

                <div className="flex gap-2 pt-2 border-t border-border/50 mt-auto">
                  <DocumentActionButton
                    url={note.url || ""}
                    page="study-notes"
                    action="read"
                  />
                  <DocumentActionButton
                    url={note.url || ""}
                    page="study-notes"
                    action="download"
                    icon={
                      <Download className="w-4 h-4 text-muted-foreground" />
                    }
                    variant="outline"
                    label=""
                    className="shrink-0 rounded-xl"
                  />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {data && data.total > 12 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <span className="text-sm text-muted-foreground px-3">
            Page {page} of {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-lg"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {data?.data && data.data.length > 0 && (
        <div className="text-center text-muted-foreground text-sm">
          Showing {data.data.length} study note
          {data.data.length !== 1 ? "s" : ""}
        </div>
      )}
    </PageTransition>
  );
}
