"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const COLORS = ["#7c3aed", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

interface ActivityChartEntry {
  date?: string;
  quizAttempts?: number;
  newUsers?: number;
}

interface TopQuizEntry {
  title?: string;
  attempts?: number;
}

interface DashboardChartsProps {
  activityChart: ActivityChartEntry[];
  topQuizzes: TopQuizEntry[];
}

export function DashboardCharts({ activityChart, topQuizzes }: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="border border-border/50 bg-white shadow-sm rounded-2xl lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base font-bold text-gray-900">
            Platform Engagement
          </CardTitle>
          <CardDescription className="text-xs text-gray-500">
            Daily quiz attempts and new registered students over the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={activityChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#64748b" }}
                tickFormatter={(v) => v?.slice(5) ?? ""}
              />
              <YAxis tick={{ fontSize: 10, fill: "#64748b" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderColor: "#e2e8f0",
                  color: "#0f172a",
                  fontSize: "12px",
                  borderRadius: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
              <Line
                type="monotone"
                dataKey="quizAttempts"
                stroke="#7c3aed"
                strokeWidth={2.5}
                dot={false}
                name="Quiz Attempts"
              />
              <Line
                type="monotone"
                dataKey="newUsers"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                name="New Students"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border border-border/50 bg-white shadow-sm rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base font-bold text-gray-900">
            Popular Quizzes
          </CardTitle>
          <CardDescription className="text-xs text-gray-500">
            Top 5 quizzes ranked by total attempt volumes
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          {topQuizzes.length === 0 ? (
            <div className="h-[260px] flex items-center justify-center text-sm text-gray-400">
              No quiz submission stats logged yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topQuizzes} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#64748b" }} />
                <YAxis
                  dataKey="title"
                  type="category"
                  tick={{ fontSize: 9, fill: "#64748b" }}
                  width={85}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderColor: "#e2e8f0",
                    fontSize: "11px",
                    borderRadius: "12px",
                  }}
                />
                <Bar dataKey="attempts" radius={[0, 4, 4, 0]} name="Attempts">
                  {topQuizzes.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
