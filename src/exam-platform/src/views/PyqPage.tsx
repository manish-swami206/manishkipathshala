"use client";

import React, { useState } from "react";
import { PageTransition } from "@/components/shared/PageTransition";
import { useRequireAuth } from "@/components/shared/RequireAuthModal";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Empty, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { useRouter } from "next/navigation";
import { useListSubjects } from "@/lib/api";
import { FileText, Play, ChevronRight, BookOpen } from "lucide-react";
import PageHeading from "@/components/shared/PageHeading";

interface ExamSet {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  type: string;
  subjectId?: string | null;
  classNum?: number | null;
  medium?: string | null;
  questionIds: string[];
  totalQuestions: number;
  isActive: boolean;
  createdAt: string;
}

interface ExamSetsResponse {
  data: ExamSet[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function PyqPage() {
  const router = useRouter();
  const { requireAuth } = useRequireAuth();
  const [subjectId, setSubjectId] = useState("all");
  const [mediumFilter, setMediumFilter] = useState("all");
  const { data: subjects = [] } = useListSubjects();

  const { data, isLoading } = useQuery<ExamSetsResponse>({
    queryKey: ["pyq-sets", subjectId, mediumFilter],
    queryFn: () => {
      const params = new URLSearchParams({ type: "pyq", limit: "50" });
      if (subjectId !== "all") params.set("subjectId", subjectId);
      if (mediumFilter !== "all") params.set("medium", mediumFilter);
      return apiFetch<ExamSetsResponse>(`/exam-sets?${params.toString()}`);
    },
  });

  const sets = data?.data ?? [];

  return (
    <PageTransition className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="space-y-2">
        <PageHeading heading="Previous Year Questions" />
        <p className="text-muted-foreground">
          Master the exam pattern with subject-wise PYQ sets.
        </p>
      </div>

      {/* Filters */}
      <div className="grid md:grid-cols-2 items-center gap-3 p-4 bg-card border rounded-2xl shadow-sm">
        <Select value={subjectId} onValueChange={setSubjectId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Subjects</SelectItem>
            {subjects.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={mediumFilter} onValueChange={setMediumFilter}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Medium" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Mediums</SelectItem>
            <SelectItem value="English">English</SelectItem>
            <SelectItem value="Hindi">Hindi</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sets Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array(6)
            .fill(0)
            .map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)
        ) : sets.length === 0 ? (
          <div className="col-span-full">
            <Empty>
              <FileText className="w-10 h-10 text-gray-300" />
              <EmptyTitle>No PYQ sets available</EmptyTitle>
              <EmptyDescription>
                No PYQ practice sets are available right now. Check back later
                or adjust your filters.
              </EmptyDescription>
            </Empty>
          </div>
        ) : (
          sets.map((set) => (
            <Card
              key={set.id}
              className="card-hover border-border/50 rounded-2xl bg-card overflow-hidden group"
            >
              <CardContent className="p-5 flex flex-col h-full gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  {set.medium && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-1 rounded-md">
                      {set.medium}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold leading-tight">{set.title}</h3>
                  {set.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {set.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/50 mt-auto">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {set.totalQuestions ?? set.questionIds?.length ?? 0}{" "}
                    Questions
                  </span>
                  <Button
                    size="sm"
                    className="rounded-xl gap-1 bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={async () => {
                      await requireAuth(() => {
                        router.push(`/pyq/${set.slug ?? set.id}`);
                      });
                    }}
                  >
                    Start <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {sets.length > 0 && (
        <div className="text-center text-sm text-muted-foreground">
          Showing {sets.length} PYQ set{sets.length !== 1 ? "s" : ""}
        </div>
      )}
    </PageTransition>
  );
}
