"use client";

import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAdminFetch } from "@/hooks/useAdminFetch";
import { useListSubjects } from "@/lib/api";

interface Question {
  id: string;
  text: string;
  type: string;
  subject: string | null;
  difficulty?: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctIndex?: number;
}

interface QuestionsResponse {
  data: Question[];
  pagination: {
    page: number;
    total: number;
    totalPages: number;
  };
}

interface QuestionSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function QuestionSelector({ selectedIds, onChange }: QuestionSelectorProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [subject, setSubject] = useState("All");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { data: pyqSubjects = [] } = useListSubjects();

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const queryKey = ["admin", "questions", "selector", page, debouncedSearch, subject];

  const adminFetch = useAdminFetch();

  const { data, isLoading } = useQuery<QuestionsResponse>({
    queryKey,
    queryFn: async () => {
      const sp = new URLSearchParams({
        page: String(page),
        limit: "10",
      });
      if (debouncedSearch.trim()) sp.set("search", debouncedSearch.trim());
      if (subject !== "All") sp.set("subject", subject);

      return adminFetch<QuestionsResponse>(`/api/admin/questions?${sp.toString()}`);
    },
    staleTime: 10_000,
  });

  const handleSearch = (value: string) => {
    setSearch(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(value);
      setPage(1);
    }, 400);
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  const isSelected = (id: string) => selectedIds.includes(id);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search questions..."
            className="pl-9 h-10 rounded-xl"
          />
        </div>
        <select
          value={subject}
          onChange={(e) => {
            setSubject(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border border-gray-200 bg-white text-gray-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
        >
          <option value="All">All Subjects</option>
          {pyqSubjects.map((s: { id: string | number; name: string }) => (
            <option key={s.id} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-gray-50 animate-pulse rounded-xl" />
          ))
        ) : data?.data.length === 0 ? (
          <div className="py-12 text-center text-sm text-gray-400">
            No questions found. Try a different search/filter.
          </div>
        ) : (
          data?.data.map((q) => {
            const active = isSelected(q.id);
            return (
              <Card
                key={q.id}
                onClick={() => toggleSelect(q.id)}
                className={`border transition-all cursor-pointer rounded-xl hover:bg-gray-50/50 ${
                  active ? "border-violet-500 bg-violet-50/20" : "border-border/60"
                }`}
              >
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">
                      {q.text}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <Badge variant="outline" className="text-[10px] uppercase font-bold">
                        {q.type}
                      </Badge>
                      {q.subject && (
                        <span className="text-[11px] font-semibold text-gray-400">
                          {q.subject}
                        </span>
                      )}
                      {q.difficulty && (
                        <span className="text-[11px] font-medium text-gray-400 capitalize">
                          {q.difficulty}
                        </span>
                      )}
                      {q.correctIndex !== undefined && q.optionA && (
                        <span className="text-[11px] font-semibold text-green-600">
                          Correct: {String.fromCharCode(65 + q.correctIndex)} — {[q.optionA, q.optionB, q.optionC, q.optionD][q.correctIndex]?.substring(0, 40)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    className={`h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      active ? "border-violet-600 bg-violet-600 text-white" : "border-gray-200"
                    }`}
                  >
                    {active && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {data && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-gray-500">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="h-8 rounded-lg"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="h-8 rounded-lg"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
