"use client";

import { useRequireAuth } from "@/components/shared/RequireAuthModal";
import { Button } from "@/components/ui/button";
import { BookOpen, Download, ExternalLink, Loader2 } from "lucide-react";
import type { ReactNode } from "react";

type ActionType = "read" | "download";

type PageVariant =
  | "ncert-books"
  | "pyp"
  | "study-notes"
  | "syllabus"
  | "default";

interface DocumentActionButtonProps {
  /** The document URL to open */
  url: string;
  /** Page variant for styling */
  page?: PageVariant;
  /** Action type — "read" (BookOpen icon) or "download" (Download icon) */
  action: ActionType;
  /** Optional custom label override */
  label?: string;
  /** Optional extra class names */
  className?: string;
  /** Optional icon override */
  icon?: ReactNode;
  /** Optional variant override for the Button component */
  variant?: "default" | "outline" | "ghost";
}

const pageStyles: Record<
  PageVariant,
  {
    defaultClass: string;
    icon: ReactNode;
    labels: Record<ActionType, string>;
  }
> = {
  "ncert-books": {
    defaultClass:
      "w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl",
    icon: <Download className="w-4 h-4 mr-2" />,
    labels: { read: "Read Online", download: "Download PDF" },
  },
  pyp: {
    defaultClass:
      "w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl",
    icon: <Download className="w-4 h-4" />,
    labels: { read: "Read Online", download: "Download PDF" },
  },
  "study-notes": {
    defaultClass:
      "flex-1 rounded-xl bg-primary/5 text-primary hover:bg-primary/10 border-none",
    icon: <BookOpen className="w-4 h-4 mr-2" />,
    labels: { read: "Read", download: "Download" },
  },
  syllabus: {
    defaultClass:
      "text-[10px] font-semibold px-2 py-0.5 rounded-full border cursor-pointer",
    icon: <ExternalLink className="w-3 h-3 mr-1" />,
    labels: { read: "Read online", download: "Download PDF" },
  },
  default: {
    defaultClass: "",
    icon: <ExternalLink className="w-4 h-4 mr-2" />,
    labels: { read: "Open", download: "Download" },
  },
};

/**
 * Global document action button with auth guard.
 *
 * - If the user is logged in, opens the URL in a new tab.
 * - If the user is NOT logged in, opens the RequireAuthModal dialog.
 *
 * The `page` prop controls the visual style so buttons match the
 * design language of each section (ncert-books, pyp, study-notes, etc.).
 */
export function DocumentActionButton({
  url,
  page = "default",
  action,
  label,
  className,
  icon,
  variant,
}: DocumentActionButtonProps) {
  const { requireAuth } = useRequireAuth();

  const style = pageStyles[page];
  const resolvedLabel = label ?? style.labels[action];
  const resolvedIcon =
    icon ??
    (action === "read" ? (
      <BookOpen className="w-4 h-4 mr-2" />
    ) : (
      <Download className="w-4 h-4 mr-2" />
    ));
  const resolvedVariant =
    variant ?? (page === "syllabus" ? "outline" : "default");

  const handleClick = async () => {
    await requireAuth(() => {
      window.open(url, "_blank", "noopener,noreferrer");
    });
  };

  // For syllabus page — render as a small badge-like button
  if (page === "syllabus") {
    return (
      <Button
        type="button"
        onClick={handleClick}
        className={className ?? style.defaultClass}
      >
        {style.icon}
        {resolvedLabel}
      </Button>
    );
  }

  return (
    <Button
      onClick={handleClick}
      variant={resolvedVariant}
      className={className ?? style.defaultClass}
    >
      {resolvedIcon}
      {resolvedLabel}
    </Button>
  );
}
