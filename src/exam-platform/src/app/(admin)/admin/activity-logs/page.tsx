"use client";

import { useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";
import { Activity, ChevronLeft, ChevronRight, Search } from "lucide-react";

type ActivityLogsResponse = {
  data: {
    id: string;
    userId: string;
    action: string;
    entityType: string | null;
    entityId: string | null;
    ipAddress: string | null;
    createdAt: string;
  }[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyTitle, EmptyDescription } from "@/components/ui/empty";

const actionColor: Record<string, string> = {
  create: "bg-green-100 text-green-700 border-green-200",
  update: "bg-blue-100 text-blue-700 border-blue-200",
  delete: "bg-red-100 text-red-700 border-red-200",
  reply: "bg-indigo-100 text-indigo-700 border-indigo-200",
  assign: "bg-pink-100 text-pink-700 border-pink-200",
};

function getActionColor(action: string): string {
  const prefix = Object.keys(actionColor).find((k) => action.startsWith(k));
  return prefix
    ? actionColor[prefix]
    : "bg-gray-100 text-gray-600 border-gray-200";
}

export default function ActivityLogsPage() {
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [debouncedAction, setDebouncedAction] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { getToken } = useAuth();

  const { data, isLoading } = useQuery<ActivityLogsResponse>({
    queryKey: queryKeys.admin.activityLogs.list({
      page,
      limit: 50,
      action: debouncedAction || undefined,
    }),
    enabled: true,
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      const sp = new URLSearchParams({ page: String(page), limit: "50" });
      if (debouncedAction) sp.set("action", debouncedAction);
      return apiFetch<ActivityLogsResponse>(
        `/admin/activity-logs?${sp.toString()}`,
        { token },
      );
    },
  });

  const handleSearch = (v: string) => {
    setAction(v);
    if (searchTimer.current) {
      clearTimeout(searchTimer.current);
    }
    searchTimer.current = setTimeout(() => {
      setDebouncedAction(v);
      setPage(1);
    }, 400);
  };

  const totalItems = data?.pagination?.total ?? 0;
  const totalPages = data?.pagination?.totalPages ?? 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Activity className="w-8 h-8 text-indigo-500" />
          Activity Logs
        </h1>
        <p className="text-gray-500 mt-2">
          {totalItems} total
          tracked actions and operations
        </p>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={action}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Filter by action name..."
          className="pl-9 rounded-lg text-sm h-10"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-12 bg-gray-100 border border-gray-200 animate-pulse rounded-lg"
            />
          ))}
        </div>
      ) : !data?.data.length ? (
        <Card className="p-6 lg:p-12">
          <Empty>
            <Activity className="h-10 w-10 text-gray-300" />
            <EmptyTitle>No activity logs found</EmptyTitle>
            <EmptyDescription>
              {debouncedAction
                ? `No actions matching "${debouncedAction}" have been recorded yet.`
                : "Actions performed by admins will appear here."}
            </EmptyDescription>
          </Empty>
        </Card>
      ) : (
        <>
          <Card className="border border-border/50 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-100">
              {data?.data.map((log) => (
                <div
                  key={log.id}
                  className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 px-3 sm:px-4 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2 sm:gap-0">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase shrink-0 border ${getActionColor(log.action)}`}
                    >
                      {log.action.replace(/_/g, " ")}
                    </span>
                    <time className="text-[10px] text-gray-400 font-mono sm:hidden ml-auto">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </time>
                  </div>
                  <div className="flex-1 min-w-0">
                    {log.entityType && (
                      <Badge
                        variant="outline"
                        className="text-[10px] uppercase font-semibold mr-1.5 border-gray-200 text-gray-500"
                      >
                        {log.entityType}
                      </Badge>
                    )}
                    <span className="font-mono text-xs text-gray-400 break-all">
                      by {log.userId.slice(0, 20)}...
                    </span>
                    {log.ipAddress && (
                      <span className="text-[10px] text-gray-400 ml-2 font-mono hidden sm:inline">
                        ({log.ipAddress})
                      </span>
                    )}
                  </div>
                  <time className="text-xs text-gray-400 shrink-0 font-mono hidden sm:block">
                    {new Date(log.createdAt).toLocaleString()}
                  </time>
                </div>
              ))}
            </div>
          </Card>
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
