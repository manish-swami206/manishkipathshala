"use client";

import React, { useState } from "react";
import { PageTransition } from "@/components/shared/PageTransition";
import { DocumentActionButton } from "@/components/shared/DocumentActionButton";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { BookOpen, ChevronLeft, ChevronRight, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useListSubjects } from "@/lib/api";

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

export default function NcertBooks() {
  const [page, setPage] = useState(1);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState("All");

  // Dynamic subjects
  const { data: pyqSubjects = [] } = useListSubjects();

  const { data, isLoading, error } = useQuery({
    queryKey: ["ncert-books", page, selectedClass, selectedSubject],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: "12",
      });
      if (selectedClass) params.set("classNum", String(selectedClass));
      if (selectedSubject && selectedSubject !== "All")
        params.set("subject", selectedSubject);

      return apiFetch<{
        data: NcertBook[];
        total: number;
        page: number;
        totalPages: number;
      }>(`/ncert-books?${params.toString()}`);
    },
  });

  const books = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <PageTransition className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">NCERT Books</h1>
        <p className="text-muted-foreground">
          Access NCERT textbooks for all classes and subjects
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 p-4 bg-card border rounded-2xl shadow-sm">
        <div className="flex-1">
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Select Class
          </label>
          <div className="flex flex-wrap gap-2">
            <ToggleGroup
              type="single"
              value={selectedClass ? String(selectedClass) : "all"}
              onValueChange={(v) => setSelectedClass(v && v !== "all" ? Number(v) : null)}
              className="flex flex-wrap gap-2 bg-secondary/10 p-1 rounded-lg"
           >
              <ToggleGroupItem value="all" className="text-sm px-3 py-1.5 rounded-lg">
                All
              </ToggleGroupItem>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((cls) => (
                <ToggleGroupItem key={cls} value={String(cls)} className="text-sm px-3 py-1.5 rounded-lg bg-secondary/50 data-[state=on]:bg-secondary text-secondary-foreground">
                  {cls}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>

        <div className="w-full md:w-64">
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Select Subject
          </label>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Subjects</SelectItem>
              {pyqSubjects.map((s) => (
                <SelectItem key={s.id} value={s.name}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Books Grid */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
            Failed to load NCERT books. Please try again later.
          </div>
        ) : books.length === 0 ? (
          <div className="p-12 text-center bg-card border rounded-2xl">
            <Empty>
              <Library className="w-10 h-10 text-gray-300 mx-auto" />
              <EmptyTitle>No books found</EmptyTitle>
              <EmptyDescription>No NCERT books match your current filters. Try different class or subject selections.</EmptyDescription>
            </Empty>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {books.map((book) => (
              <Card
                key={book.id}
                className="card-hover border-border/50 rounded-2xl bg-card overflow-hidden flex flex-col"
              >
                <CardContent className="p-5 flex flex-col flex-1">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {book.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 ">
                      Class {book.classNum}   • {book.subject}
                    </p>
                  </div>

                  {book.downloadUrl && (
                    <DocumentActionButton
                      url={book.downloadUrl}
                      page="ncert-books"
                      action="download"
                    />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
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

      {books.length > 0 && (
        <div className="text-center text-muted-foreground text-sm">
          Showing {books.length} NCERT book{books.length !== 1 ? "s" : ""}
        </div>
      )}
    </PageTransition>
  );
}
