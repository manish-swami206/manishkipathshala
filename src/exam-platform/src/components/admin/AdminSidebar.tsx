"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { toggleAdminSidebar, setMobileAdminSidebarOpen, toggleMobileAdminSidebar } from "@/store/slices/uiSlice";
import { useEffect } from "react";
import {
  LayoutDashboard,
  HelpCircle,
  GraduationCap,
  Users,
  BarChart3,
  Activity,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Newspaper,
  MessageSquare,
  BookOpen,
  CalendarDays,
  Megaphone,
  Award,
  NotebookTabs,
  Library,
  FileText,
  ScrollText,
  Layers,
} from "lucide-react";

export const NAV = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/questions", icon: HelpCircle, label: "Questions" },

  { href: "/admin/exam-sets", icon: Layers, label: "Exam Sets" },
  { href: "/admin/daily-quizzes", icon: CalendarDays, label: "Daily Quizzes" },
  { href: "/admin/students", icon: Users, label: "Students" },
  { href: "/admin/subjects", icon: BookOpen, label: "Subjects" },
  { href: "/admin/current-affairs", icon: Newspaper, label: "Current Affairs" },
  { href: "/admin/study-notes", icon: NotebookTabs, label: "Study Notes" },
  { href: "/admin/ncert", icon: Library, label: "NCERT Books" },
  { href: "/admin/pyp", icon: FileText, label: "PYP Papers" },
  { href: "/admin/syllabus", icon: ScrollText, label: "Syllabus" },
  { href: "/admin/mock-tests", icon: Award, label: "Mock Tests" },
  { href: "/admin/announcements", icon: Megaphone, label: "Announcements" },
  {
    href: "/admin/support-tickets",
    icon: MessageSquare,
    label: "Support Tickets",
  },
  { href: "/admin/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/admin/activity-logs", icon: Activity, label: "Activity Logs" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const collapsed = useAppSelector((s) => s.ui.adminSidebarCollapsed);
  const mobileOpen = useAppSelector((s) => s.ui.mobileAdminSidebarOpen);

  // Close mobile sidebar on route change
  useEffect(() => {
    dispatch(setMobileAdminSidebarOpen(false));
  }, [pathname, dispatch]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between px-4 h-16 border-b border-gray-200 flex-shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white font-extrabold text-xs shrink-0 shadow-sm shadow-violet-200">
              MK
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <span className="font-extrabold text-xs block text-gray-900 truncate">Manish Pathshala</span>
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Admin Panel</span>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white font-extrabold text-xs shrink-0 mx-auto">
            MK
          </div>
        )}
        {/* Desktop toggle button */}
        <button
          onClick={() => dispatch(toggleAdminSidebar())}
          className="p-1 rounded hover:bg-gray-100 transition-colors ml-auto cursor-pointer shrink-0 hidden lg:block"
          aria-label="Toggle sidebar"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
        {/* Mobile close button */}
        <button
          onClick={() => dispatch(setMobileAdminSidebarOpen(false))}
          className="p-1 rounded hover:bg-gray-100 transition-colors ml-auto cursor-pointer shrink-0 lg:hidden"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 custom-scrollbar">
        {NAV.map(({ href, icon: Icon, label }) => {
          const isActive =
            href === "/admin"
              ? pathname === "/admin"
              : (pathname?.startsWith(href) ?? false);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => dispatch(setMobileAdminSidebarOpen(false))}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors cursor-pointer",
                isActive
                  ? "bg-violet-50 text-violet-700 font-semibold"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              )}
              title={collapsed ? label : undefined}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t px-4 py-3 shrink-0">
        <Link
          href="/"
          className="text-xs text-gray-500 hover:text-gray-900 transition-colors font-semibold flex items-center gap-1"
        >
          {collapsed ? "←" : "← Back to App"}
        </Link>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile backdrop overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => dispatch(setMobileAdminSidebarOpen(false))}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {sidebarContent}
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col h-screen bg-white text-gray-900 transition-all duration-300 sticky top-0 border-r flex-shrink-0 z-40",
          collapsed ? "w-16" : "w-60",
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}