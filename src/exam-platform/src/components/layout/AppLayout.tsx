"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Newspaper,
  FileText,
  GraduationCap,
  BookMarked,
  Library,
  Bell,
  Info,
  Phone,
  Shield,
  ScrollText,
  FlaskConical,
  RotateCcw,
  StickyNote,
  X,
  Zap,
  Cpu,
  Bot,
  Headphones,
  AlertTriangle,
  CheckCircle2,
  Megaphone,
  Trophy,
} from "lucide-react";

import { StreakTracker } from "@/components/shared/StreakTracker";
import { cn } from "@/lib/utils";
import { SignedOut, useUser } from "@clerk/nextjs";
import Footer from "../shared/Footer";
import Header from "../shared/Header";
import MobileBottomBar from "../shared/MobileBottomBar";

export function useClientMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

export function ClientSignedIn({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const mounted = useClientMounted();
  if (!mounted || !isLoaded || !user) return null;
  return <>{children}</>;
}

export function ClientSignedOut({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const mounted = useClientMounted();
  if (!mounted || !isLoaded || user) return null;
  return <>{children}</>;
}

type NavGroup = {
  label?: string;
  items: {
    href: string;
    icon: React.ElementType;
    label: string;
    keywords?: string;
    protected?: boolean;
  }[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { href: "/", icon: Home, label: "Home", keywords: "home dashboard" },
      {
        href: "/daily-quiz",
        icon: Zap,
        label: "Daily Quizzes",
        keywords: "quiz mcq test questions",
        protected: true,
      },
      {
        href: "/current-affairs",
        icon: Newspaper,
        label: "Current Affairs",
        keywords: "news current affairs daily",
      },
      {
        href: "/study-notes",
        icon: BookMarked,
        label: "Study Notes",
        keywords: "notes study material",
        protected: true,
      },
    ],
  },
  {
    label: "Resources",
    items: [
      {
        href: "/mock-tests",
        icon: GraduationCap,
        label: "Mock Tests",
        keywords: "mock test full exam",
        protected: true,
      },
      {
        href: "/pyq",
        icon: RotateCcw,
        label: "PYQ's",
        keywords: "previous year questions pyq",
        protected: true,
      },
      {
        href: "/pyp",
        icon: FileText,
        label: "PYP's",
        keywords: "previous year papers pyp",
      },
      {
        href: "/syllabus",
        icon: ScrollText,
        label: "Syllabus",
        keywords: "syllabus upsc ssc ras rrb",
      },
      {
        href: "/ncert-mcq",
        icon: Cpu,
        label: "NCERT MCQ's",
        keywords: "ncert mcq class books",
        protected: true,
      },
      {
        href: "/ncert-books",
        icon: Library,
        label: "NCERT Books",
        keywords: "ncert books class 6 7 8 9 10 11 12",
      },
    ],
  },
  {
    label: "Community",
    items: [
      {
        href: "/leaderboard",
        icon: Trophy,
        label: "Leaderboard",
        keywords: "leaderboard ranking top students scores",
      },
      {
        href: "/support",
        icon: Headphones,
        label: "Support",
        keywords: "ai chat support help",
      },
    ],
  },
  {
    label: "Company",
    items: [
      { href: "/about", icon: Info, label: "About Us", keywords: "about" },
      {
        href: "/contact",
        icon: Phone,
        label: "Contact",
        keywords: "contact phone email",
      },
      {
        href: "/privacy",
        icon: Shield,
        label: "Privacy Policy",
        keywords: "privacy policy",
      },
      {
        href: "/terms",
        icon: ScrollText,
        label: "Terms & Conditions",
        keywords: "terms conditions",
      },
    ],
  },
];

export const ALL_NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

export const BOTTOM_NAV = [
  { href: "/", icon: Home, label: "HOME" },
  { href: "/daily-quiz", icon: FlaskConical, label: "QUIZ" },
  { href: "/study-notes", icon: StickyNote, label: "NOTES" },
  { href: "/pyq", icon: RotateCcw, label: "PYQS" },
];

export const NOTIF_ICON: Record<string, React.ElementType> = {
  urgent: Megaphone,
  warning: AlertTriangle,
  success: CheckCircle2,
  info: Bell,
};
export const NOTIF_COLOR: Record<string, string> = {
  urgent: "text-red-600 bg-red-100",
  warning: "text-amber-600 bg-amber-100",
  success: "text-green-600 bg-green-100",
  info: "text-blue-600 bg-blue-100",
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col bg-background md:flex-row">
      {/* <DesktopSidebar /> */}
      <div className="flex-1 flex flex-col  w-full">
        <Header />
        <main className="flex-1 pb-20 md:pb-0 overflow-x-hidden bg-gray-50 md:bg-background">
          {children}
          <Footer />
        </main>
        <MobileBottomBar />
      </div>
      <ClientSignedIn>
        <StreakTracker />
      </ClientSignedIn>
    </div>
  );
}

export function SidebarNavItem({
  href,
  icon: Icon,
  label,
  onClick,
  protected: isProtected,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  onClick?: () => void;
  protected?: boolean;
}) {
  const pathname = usePathname() ?? "";
  const isActive =
    pathname === href || (href !== "/" && pathname.startsWith(href));

  return (
    <Link href={href} onClick={onClick}>
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer text-sm",
          isActive
            ? "bg-primary/10 text-primary font-semibold"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        <Icon className={cn("w-4 h-4 shrink-0", isActive && "text-primary")} />
        <span className="truncate">{label}</span>
        <SignedOut>
          {isProtected && !isActive && (
            <span className="ml-auto text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
              LOGIN
            </span>
          )}
        </SignedOut>
        {isActive && (
          <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
        )}
      </div>
    </Link>
  );
}

export function MobileNavItem({
  href,
  icon: Icon,
  label,
  isActive,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  isActive: boolean;
}) {
  return (
    <Link href={href} className="flex-1">
      <div
        className={cn(
          "flex flex-col items-center justify-center h-full gap-0.5 cursor-pointer transition-colors py-2",
          isActive ? "text-primary" : "text-muted-foreground",
        )}
      >
        <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.8} />
        <span
          className={cn(
            "text-[9px] font-bold tracking-wide",
            isActive ? "text-primary" : "text-muted-foreground",
          )}
        >
          {label}
        </span>
      </div>
    </Link>
  );
}
