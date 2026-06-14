"use client";

import { useAdminDashboard } from "@/lib/api";
import {
  HelpCircle,
  GraduationCap,
  TrendingUp,
  Activity,
  CheckCircle,
  Shield,
  Clock,
  UserCheck,
  Users,
  MessageSquare,
  HardDrive,
  FileText,
  Flame,
  ArrowRight,
  UserPlus
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion } from "framer-motion";
import Link from "next/link";
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
  Cell
} from "recharts";

const COLORS = ["#7c3aed", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export default function AdminDashboardPage() {
  const { data, isLoading, error } = useAdminDashboard();

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto p-2">
        <div className="h-8 w-48 bg-gray-200 animate-pulse rounded mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-28 bg-white border border-gray-100 rounded-2xl shadow-sm animate-pulse"
            />
          ))}
        </div>
        <div className="h-64 bg-white border border-gray-100 rounded-2xl shadow-sm animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-6xl mx-auto p-2">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
          <p className="font-bold text-sm">Failed to load admin dashboard</p>
          <p className="text-xs mt-1 text-red-600">
            Please make sure you have the required admin role permissions or try reloading.
          </p>
        </div>
      </div>
    );
  }

  // Support extended dashboard response format gracefully with fallbacks
  const stats = data.stats ?? {
    totalStudents: 0,
    newStudentsThisWeek: 0,
    totalQuestions: data.totalQuestions ?? 0,
    totalQuizzes: 0,
    totalMockTests: 0,
    totalCurrentAffairs: 0,
    openSupportTickets: 0,
    storageUsedMb: 0.0,
  };

  const activityChartData = data.activityChart ?? [];
  const topQuizzesData = data.topQuizzes ?? [];
  const recentStudentsData = data.recentStudents ?? [];

  const mainStats = [
    {
      label: "Total Students",
      value: stats.totalStudents,
      subtext: `+${stats.newStudentsThisWeek} new this week`,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-100/60",
      href: "/admin/students"
    },
    {
      label: "Open Tickets",
      value: stats.openSupportTickets,
      subtext: "Require admin response",
      icon: MessageSquare,
      color: "text-red-600",
      bg: "bg-red-100/60",
      href: "/admin/support-tickets"
    },
    {
      label: "Total Questions",
      value: stats.totalQuestions,
      subtext: "Across all subjects",
      icon: HelpCircle,
      color: "text-violet-600",
      bg: "bg-violet-100/60",
      href: "/admin/questions"
    },
    {
      label: "Cloud Storage",
      value: `${stats.storageUsedMb} MB`,
      subtext: "Cloudinary CDN raw PDFs",
      icon: HardDrive,
      color: "text-emerald-600",
      bg: "bg-emerald-100/60",
      href: "/admin/ncert"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8 max-w-6xl mx-auto p-2"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
            <Shield className="w-8 h-8 text-violet-600" />
            Platform Overview
          </h1>
          <p className="text-gray-500 text-sm mt-1.5">
            Real-time insights on active students, storage consumption, and quiz submissions
          </p>
        </div>
      </div>

      {/* Grid Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mainStats.map(({ label, value, subtext, icon: Icon, color, bg, href }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: i * 0.05 }}
          >
            <Link href={href}>
              <Card className="border border-border/50 bg-white shadow-sm rounded-2xl hover:shadow-md transition-all cursor-pointer group">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        {label}
                      </p>
                      <p className="text-2xl font-black text-gray-900 group-hover:text-violet-600 transition-colors">
                        {value}
                      </p>
                      <p className="text-[10px] font-medium text-gray-400">
                        {subtext}
                      </p>
                    </div>
                    <div className={`${bg} p-3 rounded-2xl transition-transform group-hover:scale-110`}>
                      <Icon className={`h-5 w-5 ${color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Charts Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Submissions / Users Trend */}
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
              <LineChart data={activityChartData}>
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
                    borderRadius: "12px"
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

        {/* Top Performed Quizzes */}
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
            {topQuizzesData.length === 0 ? (
              <div className="h-[260px] flex items-center justify-center text-sm text-gray-400">
                No quiz submission stats logged yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topQuizzesData} layout="vertical">
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
                      borderRadius: "12px"
                    }}
                  />
                  <Bar dataKey="attempts" radius={[0, 4, 4, 0]} name="Attempts">
                    {topQuizzesData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Two Columns List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registered Students */}
        <Card className="border border-border/50 bg-white shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                <UserPlus className="h-4 w-4 text-emerald-600" /> New Registered Students
              </CardTitle>
              <Link href="/admin/students" className="text-xs font-semibold text-violet-600 flex items-center gap-1 hover:underline">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-4 p-0">
            {recentStudentsData.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">
                No registered students recorded yet
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentStudentsData.map((student, i) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-gray-50/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs shrink-0">
                        {student.name.slice(0, 1).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {student.name}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                          {student.email}
                        </p>
                      </div>
                    </div>
                    <time className="text-xs text-gray-400 font-mono shrink-0">
                      {new Date(student.joinedAt).toLocaleDateString()}
                    </time>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Action Logs */}
        <Card className="border border-border/50 bg-white shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Activity className="h-4 w-4 text-violet-600" /> Recent Action Logs
              </CardTitle>
              <Link href="/admin/activity-logs" className="text-xs font-semibold text-violet-600 flex items-center gap-1 hover:underline">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="pt-4 p-0">
            {!data.recentActivity || data.recentActivity.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">
                No recent actions recorded yet
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {data.recentActivity.slice(0, 7).map((a, i) => (
                  <div
                    key={a.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 py-3 hover:bg-gray-50/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full border border-violet-200/50">
                        {formatAction(a.action)}
                      </span>
                      {a.entityType && (
                        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full uppercase">
                          {a.entityType}
                        </span>
                      )}
                      <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5 text-gray-400" />
                        by {a.userId.slice(0, 15)}...
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 font-medium flex items-center gap-1.5 sm:self-center">
                      <Clock className="w-3.5 h-3.5 text-gray-300" />
                      {new Date(a.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

function formatAction(action: string): string {
  return action.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}