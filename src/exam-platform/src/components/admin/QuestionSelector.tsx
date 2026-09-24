"use client";

import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Check,
  ListChecks,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useAdminFetch } from "@/hooks/useAdminFetch";
import { useListSubjects } from "@/lib/api";

interface Question {
  id: string;
  text: string;
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

interface IdsResponse {
  ids: string[];
  total: number;
}

interface BatchPreview {
  id: string;
  text: string;
}

interface QuestionSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

const STALE_15MIN = 15 * 60 * 1000;
const IDS_CAP = 2000;

export function QuestionSelector({ selectedIds, onChange }: QuestionSelectorProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [subject, setSubject] = useState("All");
  const [difficulty, setDifficulty] = useState("All");
  const [trayOpen, setTrayOpen] = useState(false);
  const [selectAllLoading, setSelectAllLoading] = useState(false);
  const [selectAllError, setSelectAllError] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { data: pyqSubjects = [] } = useListSubjects();

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const adminFetch = useAdminFetch();

  const queryKey = ["admin", "questions", "selector", page, debouncedSearch, subject, difficulty];

  const { data, isLoading } = useQuery<QuestionsResponse>({
    queryKey,
    queryFn: async () => {
      const sp = new URLSearchParams({
        page: String(page),
        limit: "50",
      });
      if (debouncedSearch.trim()) sp.set("search", debouncedSearch.trim());
      if (subject !== "All") sp.set("subject", subject);
      if (difficulty !== "All") sp.set("difficulty", difficulty);

      return adminFetch<QuestionsResponse>(`/api/admin/questions?${sp.toString()}`);
    },
    staleTime: STALE_15MIN,
  });

  const total = data?.pagination.total ?? 0;
  const pageIds = data?.data.map((q) => q.id) ?? [];
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

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

  const togglePageSelect = () => {
    if (allPageSelected) {
      onChange(selectedIds.filter((id) => !pageIds.includes(id)));
    } else {
      const set = new Set(selectedIds);
      pageIds.forEach((id) => set.add(id));
      onChange([...set]);
    }
  };

  const selectAllMatching = async () => {
    setSelectAllLoading(true);
    setSelectAllError(false);
    try {
      const sp = new URLSearchParams();
      if (debouncedSearch.trim()) sp.set("search", debouncedSearch.trim());
      if (subject !== "All") sp.set("subject", subject);
      if (difficulty !== "All") sp.set("difficulty", difficulty);

      const res = await adminFetch<IdsResponse>(`/api/admin/questions/ids?${sp.toString()}`);
      const set = new Set(selectedIds);
      res.ids.forEach((id) => set.add(id));
      onChange([...set]);
      setTrayOpen(true);
    } catch {
      setSelectAllError(true);
    } finally {
      setSelectAllLoading(false);
    }
  };

  // Tray previews: fetch texts for selected ids (chunked to keep URLs small)
  const { data: previewData, isLoading: previewLoading } = useQuery<{ data: BatchPreview[] }>({
    queryKey: ["admin", "questions", "selector", "tray", [...selectedIds].sort().join(",")],
    enabled: trayOpen && selectedIds.length > 0,
    staleTime: STALE_15MIN,
    queryFn: async () => {
      const chunks: string[][] = [];
      for (let i = 0; i < selectedIds.length; i += 100) {
        chunks.push(selectedIds.slice(i, i + 100));
      }
      const results = await Promise.all(
        chunks.map(async (chunk) => {
          const sp = new URLSearchParams();
          chunk.forEach((id) => sp.append("ids", id));
          return adminFetch<{ data: BatchPreview[] }>(`/api/questions/batch?${sp.toString()}`);
        })
      );
      return { data: results.flatMap((r) => r.data) };
    },
  });
  const previewMap = new Map((previewData?.data ?? []).map((q) => [q.id, q.text]));

  const isSelected = (id: string) => selectedIds.includes(id);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search questions, options, or subjects..."
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
        <select
          value={difficulty}
          onChange={(e) => {
            setDifficulty(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border border-gray-200 bg-white text-gray-900 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
        >
          <option value="All">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {/* Bulk select toolbar */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-gray-500">
          {isLoading ? "Loading…" : `${total} question${total !== 1 ? "s" : ""} match current filter`}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={togglePageSelect}
          disabled={pageIds.length === 0}
          className="h-8 rounded-lg font-semibold"
        >
          {allPageSelected ? "Deselect page" : `Select page (${pageIds.length})`}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={selectAllMatching}
          disabled={selectAllLoading || total === 0}
          className="h-8 rounded-lg font-semibold border-violet-300 text-violet-700 hover:bg-violet-50"
        >
          {selectAllLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
          ) : (
            <ListChecks className="h-3.5 w-3.5 mr-1" />
          )}
          {total > IDS_CAP
            ? `Select all matching (2000+)`
            : `Select all matching (${total})`}
        </Button>
        {selectAllError && <span className="text-red-500">Select failed — please retry</span>}
      </div>

      {/* Selected tray */}
      {selectedIds.length > 0 && (
        <div className="rounded-xl border border-violet-200 bg-violet-50 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-violet-700 font-medium">
            <Check className="h-3.5 w-3.5 shrink-0" />
            <span>
              {selectedIds.length} question{selectedIds.length !== 1 ? "s" : ""} selected
            </span>
            <button
              onClick={() => setTrayOpen((o) => !o)}
              className="text-violet-500 hover:text-violet-700 underline"
            >
              {trayOpen ? "Hide" : "Review"}
            </button>
            <button
              onClick={() => {
                onChange([]);
                setTrayOpen(false);
              }}
              className="ml-auto text-violet-500 hover:text-violet-700 underline"
            >
              Clear all
            </button>
          </div>
          {trayOpen && (
            <div className="max-h-40 overflow-y-auto border-t border-violet-100 bg-white px-2 py-1.5 space-y-0.5">
              {previewLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
                </div>
              ) : (
                selectedIds.map((id, idx) => (
                  <div
                    key={id}
                    className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-50 text-xs"
                  >
                    <span className="w-6 shrink-0 text-right text-gray-400 font-medium">
                      {idx + 1}.
                    </span>
                    <span className="flex-1 truncate text-gray-700">
                      {previewMap.get(id) ?? `Question ${id.slice(0, 8)}…`}
                    </span>
                    <button
                      onClick={() => onChange(selectedIds.filter((x) => x !== id))}
                      className="shrink-0 text-gray-400 hover:text-red-500"
                      aria-label="Remove question"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

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
