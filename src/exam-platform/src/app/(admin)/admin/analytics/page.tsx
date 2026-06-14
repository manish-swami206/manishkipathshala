"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { queryKeys } from "@/lib/api/query-keys";


import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, Award, TrendingUp, Users, BarChart3 } from "lucide-react";

type AnalyticsResponse = {
  totalAttempts: number;
  avgScore: number;
  avgTimeTaken: number;
  passCount: number;
  failCount: number;
};

const COLORS = [
  "#7c3aed",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#84cc16",
];

export default function AnalyticsPage() {
  const { getToken } = useAuth();

  const { data, isLoading } = useQuery<AnalyticsResponse>({
    queryKey: queryKeys.admin.analytics.overview(),
    enabled: true,
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error("Not authenticated");
      return apiFetch<AnalyticsResponse>("/admin/analytics", { token });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto p-2">
        <div className="h-8 w-40 bg-gray-200 animate-pulse rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 bg-white border border-gray-100 animate-pulse rounded-xl"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-64 bg-white border border-gray-100 animate-pulse rounded-xl"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const totalAttempts = data.totalAttempts;
  const passRate = totalAttempts > 0 ? Math.round((data.passCount / totalAttempts) * 100) : 0;
  const failRate = totalAttempts > 0 ? Math.round((data.failCount / totalAttempts) * 100) : 0;

  const statCards = [
    {
      label: "Total Attempts",
      value: totalAttempts,
      icon: BookOpen,
      color: "text-violet-600",
      bg: "bg-violet-100/60",
    },
    {
      label: "Passed",
      value: data.passCount,
      icon: Award,
      color: "text-emerald-600",
      bg: "bg-emerald-100/60",
    },
    {
      label: "Avg Score",
      value: Math.round(data.avgScore * 10) / 10,
      icon: TrendingUp,
      color: "text-amber-600",
      bg: "bg-amber-100/60",
    },
    {
      label: "Pass Rate",
      value: `${passRate}%`,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-100/60",
    },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-2">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-indigo-600" />
          Analytics
        </h1>
        <p className="text-gray-500 mt-2">
          Platform performance insights and user metric trend logs
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label} className="border-border/50 bg-white shadow-sm rounded-2xl">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                    {label}
                  </p>
                  <p className="text-2xl font-black text-gray-900 mt-1">
                    {value}
                  </p>
                </div>
                <div className={`${bg} p-3 rounded-2xl`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <Card className="border-border/50 bg-white shadow-sm rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base text-gray-900 font-bold">
              Performance Summary
            </CardTitle>
            <CardDescription className="text-xs text-gray-500">
              Key metrics aggregated from all student attempts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-violet-50 border border-violet-100 rounded-xl">
                  <p className="text-[10px] font-bold text-violet-500 uppercase tracking-wider">Total Attempts</p>
                  <p className="text-2xl font-black text-violet-900 mt-1">{totalAttempts}</p>
                </div>
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Pass Rate</p>
                  <p className="text-2xl font-black text-emerald-900 mt-1">{passRate}%</p>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                  <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Avg Score</p>
                  <p className="text-2xl font-black text-amber-900 mt-1">{Math.round(data.avgScore * 10) / 10}</p>
                </div>
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl">
                  <p className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Fail Rate</p>
                  <p className="text-2xl font-black text-rose-900 mt-1">{failRate}%</p>
                </div>
              </div>
              <div className="p-4 bg-sky-50 border border-sky-100 rounded-xl">
                <p className="text-[10px] font-bold text-sky-500 uppercase tracking-wider">Avg Time Taken</p>
                <p className="text-2xl font-black text-sky-900 mt-1">{Math.round(data.avgTimeTaken / 60)} min {Math.round(data.avgTimeTaken % 60)} sec</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}