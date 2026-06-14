"use client";

import React, { useState } from "react";
import { PageTransition } from "@/components/shared/PageTransition";
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
import { useRequireAuth } from "@/components/shared/RequireAuthModal";
import { Cpu, BookOpen, Play, ChevronRight } from "lucide-react";
import type { ExamSet } from "@workspace/db";

interface ExamSetsResponse {
  data: ExamSet[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const CLASSES = ["all", ...Array.from({ length: 12 }, (_, i) => String(i + 1))];
const MEDIUMS = ["all", "English", "Hindi"];

export default function NcertMcqSets() {
  const router = useRouter();
  const { requireAuth } = useRequireAuth();
  const [classNum, setClassNum] = useState("all");
  const [medium, setMedium] = useState("all");

  const { data, isLoading } = useQuery<ExamSetsResponse>({
    queryKey: ["ncert-mcq-sets", classNum, medium],
    queryFn: () => {
      const params = new URLSearchParams({ type: "ncert", limit: "50" });
      if (classNum !== "all") params.set("classNum", classNum);
      if (medium !== "all") params.set("medium", medium);
      return apiFetch<ExamSetsResponse>(`/exam-sets?${params.toString()}`);
    },
  });

  const sets = data?.data ?? [];

  return (
    <PageTransition className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">NCERT MCQ Practice</h1>
        <p className="text-muted-foreground">
          Choose a subject set to start practicing NCERT-based MCQs
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-card border rounded-2xl shadow-sm">
        <Select value={classNum} onValueChange={setClassNum}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {CLASSES.slice(1).map((c) => (
              <SelectItem key={c} value={c}>Class {c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={medium} onValueChange={setMedium}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Medium" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Mediums</SelectItem>
            {MEDIUMS.slice(1).map((m) => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Sets Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)
        ) : sets.length === 0 ? (
          <div className="col-span-full">
            <Empty>
              <Cpu className="w-10 h-10 text-gray-300" />
              <EmptyTitle>No NCERT MCQ sets available</EmptyTitle>
              <EmptyDescription>
                No NCERT MCQ practice sets are available right now. Check back later or adjust your filters.
              </EmptyDescription>
            </Empty>
          </div>
        ) : (
          sets.map((set) => (
            <Card key={set.id} className="card-hover border-border/50 rounded-2xl bg-card overflow-hidden group">
              <CardContent className="p-5 flex flex-col h-full gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  {set.classNum && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted px-2 py-1 rounded-md">
                      Class {set.classNum}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold leading-tight">{set.title}</h3>
                  {set.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{set.description}</p>
                  )}
                  {set.medium && (
                    <span className="inline-block text-[10px] font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md mt-2">
                      {set.medium}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border/50 mt-auto">
                  <span className="text-xs font-semibold text-muted-foreground">
                    {set.totalQuestions ?? set.questionIds?.length ?? 0} Questions
                  </span>
                  <Button
                    size="sm"
                    className="rounded-xl gap-1 bg-violet-600 hover:bg-violet-700 text-white"
                    onClick={async () => {
                      await requireAuth(() => {
                        router.push(`/ncert-mcq/${set.slug ?? set.id}`);
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
          Showing {sets.length} NCERT MCQ set{sets.length !== 1 ? "s" : ""}
        </div>
      )}
    </PageTransition>
  );
}
