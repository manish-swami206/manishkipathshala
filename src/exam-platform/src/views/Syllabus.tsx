"use client";

import React, { useState } from "react";
import { PageTransition } from "@/components/shared/PageTransition";
import { DocumentActionButton } from "@/components/shared/DocumentActionButton";
import { useListSyllabus, useListSubjects } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, BookOpen } from "lucide-react";

export default function Syllabus() {
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const { data: subjects = [] } = useListSubjects();
  const { data: syllabi, isLoading } = useListSyllabus(
    selectedSubject !== "all" || selectedCategory !== "all"
      ? {
          ...(selectedSubject !== "all" ? { subject: selectedSubject } : {}),
          ...(selectedCategory !== "all" ? { examCategory: selectedCategory } : {}),
        }
      : undefined,
  );

  // Extract unique exam categories from subjects
  const examCategories = Array.from(
    new Set(subjects.map((s) => s.examCategory).filter(Boolean)),
  );

  return (
    <PageTransition className="max-w-5xl mx-auto px-4 py-6 md:px-6 md:py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Syllabus</h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Explore premium educational resources
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Select
          value={selectedSubject}
          onValueChange={(v) => {
            setSelectedSubject(v);
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px] rounded-xl h-10">
            <SelectValue placeholder="All Subjects" />
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

        <Select
          value={selectedCategory}
          onValueChange={(v) => {
            setSelectedCategory(v);
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px] rounded-xl h-10">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {examCategories.map((cat) => (
              <SelectItem key={cat} value={cat!}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-3xl" />
          ))
        ) : syllabi?.length === 0 ? (
          <Empty>
            <BookOpen className="w-10 h-10 text-muted-foreground/40" />
            <EmptyTitle>No syllabus records</EmptyTitle>
            <EmptyDescription>
              No syllabus records are currently available.
            </EmptyDescription>
          </Empty>
        ) : (
          syllabi?.map((item) => (
            <div
              key={item.id}
              className="
                flex flex-col sm:flex-row items-start sm:items-center gap-4
                rounded-3xl border bg-card
                px-4 py-4 md:px-6 md:py-5
                transition-all hover:shadow-sm
              "
            >
              {/* Icon + Content row on mobile */}
              <div className="flex items-start gap-4 w-full sm:w-auto sm:flex-1 min-w-0">
                {/* Icon */}
                <div
                  className="
                    flex h-12 w-12 md:h-14 md:w-14 shrink-0 items-center justify-center
                    rounded-2xl bg-emerald-500/10
                  "
                >
                  <FileText className="h-6 w-6 md:h-7 md:w-7 text-emerald-600" />
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-semibold">
                    {item.title}
                  </h3>

                  {item.examCategory && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.examCategory}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions — full width on mobile, side by side */}
              {(item.readUrl || item.downloadUrl) && (
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {item.readUrl && (
                    <DocumentActionButton
                      url={item.readUrl}
                      page="syllabus"
                      action="read"
                      label="Read"
                      className="
                        flex-1 sm:flex-none h-10 px-4 sm:px-6 rounded-xl
                        bg-primary text-primary-foreground
                      "
                    />
                  )}

                  {item.downloadUrl && (
                    <DocumentActionButton
                      url={item.downloadUrl}
                      page="syllabus"
                      action="download"
                      label="Download"
                      className="
                        flex-1 sm:flex-none h-10 px-4 sm:px-6 rounded-xl
                        text-primary bg-primary/10 hover:bg-primary/20
                        border bg-background
                      "
                    />
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </PageTransition>
  );
}
