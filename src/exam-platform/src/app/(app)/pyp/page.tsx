"use client";
import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageTransition } from "@/components/shared/PageTransition";

import { DocumentActionButton } from "@/components/shared/DocumentActionButton";
import { apiFetch } from "@/lib/api/client";
import { FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Empty, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import PageHeading from "@/components/shared/PageHeading";
import { useListSubjects } from "@/lib/api";

interface PreviousYearPaper {
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

const YEARS = Array.from(
  { length: 30 },
  (_, i) => new Date().getFullYear() - i,
);

export default function PypPage() {
  const [page, setPage] = useState(1);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [selectedSubject, setSelectedSubject] = useState<string>("all");

  const { data: subjectsData } = useListSubjects();
  const subjects = subjectsData ?? [];

  // Reset to first page when filters change
  const prevFilterKey = useRef(`${selectedYear}:${selectedSubject}`);
  useEffect(() => {
    const key = `${selectedYear}:${selectedSubject}`;
    if (key !== prevFilterKey.current) {
      setPage(1);
      prevFilterKey.current = key;
    }
  }, [selectedYear, selectedSubject]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["pyp", page, selectedYear, selectedSubject],
    queryFn: () => {
      const params = new URLSearchParams();
      if (selectedYear !== "all") params.set("year", selectedYear);
      if (selectedSubject !== "all") params.set("subject", selectedSubject);
      params.set("page", String(page));
      params.set("limit", "12");
      const query = params.toString();
      return apiFetch<{
        data: PreviousYearPaper[];
        total: number;
        page: number;
        totalPages: number;
      }>(`/pyp${query ? `?${query}` : ""}`);
    },
  });

  const papers = data?.data ?? [];
  const totalPages = data?.totalPages ?? 1;
  return (
    <PageTransition
      className="
    min-h-screen
    max-w-5xl
    mx-auto
    p-4 md:p-8
    space-y-6
    bg-[radial-gradient(#e5e7eb_1px,transparent_1px)]
    [background-size:18px_18px]
  "
    >
      <div className="space-y-2">
        <PageHeading heading="Previous Year Papers" />
        <p className="text-gray-500">
          Download official question papers and answer keys for competitive
          exams.
        </p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 items-center gap-4 p-4 bg-white border border-gray-200 rounded-2xl shadow-sm">
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className=" bg-white border-gray-300">
            <SelectValue placeholder="Select Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {YEARS.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
          <SelectTrigger className=" bg-white border-gray-300">
            <SelectValue placeholder="Subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={s.name}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Papers Grid */}
      {/* Papers List */}
      <div className="space-y-5">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-3xl" />
          ))
        ) : error ? (
          <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700">
            Failed to load papers. Please try again later.
          </div>
        ) : papers.length === 0 ? (
          <Empty>
            <FileText className="w-10 h-10 text-gray-300" />
            <EmptyTitle>No papers found</EmptyTitle>
            <EmptyDescription>
              No previous year papers match your current filters.
            </EmptyDescription>
          </Empty>
        ) : (
          papers.map((paper) => (
            <Card
              key={paper.id}
              className="
          border-2
          border-gray-200
          rounded-[28px]
          bg-white
          shadow-sm
          hover:shadow-md
          transition-all
        "
            >
              <CardContent className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="size-14 rounded-xl bg-cyan-500 flex items-center justify-center shrink-0">
                      <FileText className="size-8 text-white" />
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-bold text-lg text-gray-900 truncate">
                        {paper.examName}
                      </h3>

                      <div className="flex flex-wrap gap-2 mt-2 text-sm">
                        {paper.subject && (
                          <>
                            <span className="font-medium text-gray-700">
                              {paper.subject}
                            </span>
                            <span className="text-gray-400">•</span>
                          </>
                        )}
                        <span className="font-medium text-gray-700">
                          {paper.shiftName}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className="font-medium text-gray-700">
                          {paper.year}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {paper.questionPaperUrl && (
                      <>
                        {/* <DocumentActionButton
                          url={paper.questionPaperUrl}
                          page="pyp"
                          action="read"
                        /> */}
                        <DocumentActionButton
                          url={paper.questionPaperUrl}
                          page="pyp"
                          action="download"
                          label="Question Paper"
                        />
                      </>
                    )}

                    {(paper.answerKeyPdf || paper.answerKeyUrl) && (
                      <>
                        <div className="w-px bg-gray-200" />
                        {/* <DocumentActionButton
                          url={paper.answerKeyPdf || paper.answerKeyUrl!}
                          page="pyp"
                          action="read"
                          label="Answer Key"
                        /> */}
                        <DocumentActionButton
                          url={paper.answerKeyPdf || paper.answerKeyUrl!}
                          page="pyp"
                          action="download"
                          label="Answer Key"
                        />
                      </>
                    )}
                  </div>
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

      {papers.length > 0 && (
        <div className="text-center text-gray-400 text-sm">
          Showing {papers.length} paper{papers.length !== 1 ? "s" : ""}
        </div>
      )}
    </PageTransition>
  );
}
