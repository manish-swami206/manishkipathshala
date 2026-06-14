"use client";

import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, ChevronLeft, ChevronRight, TrendingUp, HelpCircle, Calendar, CheckCircle2, Clock, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Empty, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useAdminFetch } from "@/hooks/useAdminFetch";

interface StudentStat {
  userId: string;
  displayName: string;
  email: string;
  totalAttempts: number;
  avgScore: number;
  totalScore: number;
  passedCount: number;
  lastAttemptAt: string | null;
  joinedAt: string;
}

interface StudentAttempt {
  id: number;
  userId: string;
  examId: number | null;
  quizId: number | null;
  score: number;
  totalMarks: number;
  isPassed: boolean;
  attemptedAt: string;
}

export default function StudentsPage() {
  const adminFetch = useAdminFetch();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "students", page, debouncedSearch],
    queryFn: () =>
      adminFetch<{
        data: StudentStat[];
        pagination: {
          page: number;
          total: number;
          totalPages: number;
          limit: number;
        };
      }>(`/api/admin/students?page=${page}&limit=20&search=${encodeURIComponent(debouncedSearch)}`),
    staleTime: 60 * 1000,
  });

  const { data: attempts = [], isLoading: loadingAttempts } = useQuery({
    queryKey: ["admin", "students", "attempts", selectedUserId],
    queryFn: () => adminFetch<StudentAttempt[]>(`/api/admin/students/${selectedUserId}/attempts`),
    enabled: !!selectedUserId,
    staleTime: 30 * 1000,
  });
  console.log(data?.data, attempts);
  return (
    <div className="p-6 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {data?.pagination.total ?? "–"} registered students
          </p>
        </div>
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              const val = e.target.value;
              setSearchQuery(val);
              if (searchTimer.current) clearTimeout(searchTimer.current);
              searchTimer.current = setTimeout(() => {
                setDebouncedSearch(val);
                setPage(1);
              }, 400);
            }}
            placeholder="Search by name..."
            className="pl-9 h-9 rounded-xl text-sm"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-16 bg-gray-100 animate-pulse rounded-lg"
            />
          ))}
        </div>
      ) : (
        <>
          {data?.data.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-16 text-center">
                <Empty>
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <EmptyTitle>No registered students yet</EmptyTitle>
                  <EmptyDescription>
                    There are no registered students yet.
                  </EmptyDescription>
                </Empty>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-0 shadow-sm overflow-hidden rounded-2xl">
              <div className="overflow-x-auto scrollbar-thin">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      <th className="px-4 lg:px-6 py-3 font-semibold text-gray-600 text-xs">
                        Student
                      </th>
                      <th className="px-4 lg:px-6 py-3 font-semibold text-gray-600 text-xs">
                        Attempts
                      </th>
                      <th className="hidden sm:table-cell px-4 lg:px-6 py-3 font-semibold text-gray-600 text-xs">
                        Avg Score
                      </th>
                      <th className="hidden sm:table-cell px-4 lg:px-6 py-3 font-semibold text-gray-600 text-xs">
                        Total
                      </th>
                      <th className="hidden md:table-cell px-4 lg:px-6 py-3 font-semibold text-gray-600 text-xs">
                        Passed
                      </th>
                      <th className="hidden md:table-cell px-4 lg:px-6 py-3 font-semibold text-gray-600 text-xs">
                        Joined
                      </th>
                      <th className="hidden lg:table-cell px-4 lg:px-6 py-3 font-semibold text-gray-600 text-xs">
                        Last Active
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data?.data.map((s, i) => (
                      <tr
                        key={s.userId}
                        onClick={() => setSelectedUserId(s.userId)}
                        className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                      >
                        <td className="px-4 lg:px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-xs flex-shrink-0">
                              {(s.displayName || s.userId).slice(0, 1).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate max-w-[120px] lg:max-w-[150px]">
                                {s.displayName || "Learner"}
                              </p>
                              <p className="text-[10px] font-mono text-gray-400 truncate max-w-[120px] lg:max-w-[150px]">
                                {s.email || s.userId}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-3.5 font-medium text-gray-900 text-sm">
                          {s.totalAttempts}
                        </td>
                        <td className="hidden sm:table-cell px-4 lg:px-6 py-3.5">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                            <span className="text-sm">{s.avgScore}</span>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell px-4 lg:px-6 py-3.5 font-bold text-violet-600 text-sm">
                          {s.totalScore}
                        </td>
                        <td className="hidden md:table-cell px-4 lg:px-6 py-3.5">
                          <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200 text-xs"
                          >
                            {s.passedCount}
                          </Badge>
                        </td>
                        <td className="hidden md:table-cell px-4 lg:px-6 py-3.5 text-gray-400 text-xs">
                          {new Date(s.joinedAt).toLocaleDateString()}
                        </td>
                        <td className="hidden lg:table-cell px-4 lg:px-6 py-3.5 text-gray-400 text-xs">
                          {s.lastAttemptAt
                            ? new Date(s.lastAttemptAt).toLocaleDateString()
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Page {data.pagination.page} of {data.pagination.totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="rounded-lg h-9"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-lg h-9"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Student Attempt History Sheet Drawer */}
      <Sheet open={!!selectedUserId} onOpenChange={(open) => !open && setSelectedUserId(null)}>
        <SheetContent side="right" className="w-full sm:w-[450px] p-0 flex flex-col">
          <SheetHeader className="px-5 py-4 border-b border-gray-100">
            <SheetTitle className="text-lg font-bold text-gray-900">Student Profile Summary</SheetTitle>
            <SheetDescription className="text-xs text-gray-400 font-mono">
              Clerk User: {selectedUserId}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Attempt Timeline</h3>
              {loadingAttempts ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-16 bg-gray-50 animate-pulse rounded-xl" />
                  ))}
                </div>
              ) : attempts.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-12">
                  No evaluation attempts found for this learner yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {attempts.map((attempt) => (
                    <div
                      key={attempt.id}
                      className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 space-y-2.5"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            {attempt.quizId ? `Quiz #${attempt.quizId}` : `Exam #${attempt.examId}`}
                          </p>
                          <p className="text-[10px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                            <Clock className="w-3.5 h-3.5 text-gray-300" />
                            {new Date(attempt.attemptedAt).toLocaleDateString()} at{" "}
                            {new Date(attempt.attemptedAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <Badge
                          variant={attempt.isPassed ? "secondary" : "outline"}
                          className={attempt.isPassed ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-600 border-red-100"}
                        >
                          {attempt.isPassed ? "PASSED" : "FAILED"}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 text-xs">
                        <span className="font-semibold text-gray-500">Earned Score</span>
                        <span className="font-extrabold text-violet-600">
                          {attempt.score} / {attempt.totalMarks} pts
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}