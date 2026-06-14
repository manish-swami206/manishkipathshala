"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ChevronRight, X } from "lucide-react";
import {
  getListAnnouncementsQueryKey,
  useListAnnouncements,
} from "@/lib/api";

// ─── Announcement config ───────────────────────────────────────────────────────
const TYPE_CONFIG = {
  urgent: {
    bg: "bg-red-50",
    border: "border-red-200",
    icon: Megaphone,
    iconColor: "text-red-600",
    badge: "bg-red-600 text-white",
    label: "URGENT",
  },
  warning: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    icon: AlertTriangle,
    iconColor: "text-amber-600",
    badge: "bg-amber-500 text-white",
    label: "NOTICE",
  },
  success: {
    bg: "bg-green-50",
    border: "border-green-200",
    icon: CheckCircle2,
    iconColor: "text-green-600",
    badge: "bg-green-600 text-white",
    label: "NEW",
  },
  info: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    icon: Info,
    iconColor: "text-blue-600",
    badge: "bg-blue-600 text-white",
    label: "INFO",
  },
} as const;

export default function AnnouncementBanner() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { data: announcements } = useListAnnouncements({
    query: { enabled: mounted, queryKey: getListAnnouncementsQueryKey() },
  });
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!mounted) return;
    try {
      const stored = localStorage.getItem("dismissed_announcements");
      if (stored) setDismissed(new Set(JSON.parse(stored)));
    } catch {}
  }, [mounted]);

  const dismiss = (id: string) => {
    const next = new Set(dismissed).add(id);
    setDismissed(next);
    try {
      localStorage.setItem(
        "dismissed_announcements",
        JSON.stringify([...next]),
      );
    } catch {}
  };

  if (!mounted) return null;
  const visible = announcements?.filter((a) => !dismissed.has(a.id)) ?? [];
  if (visible.length === 0) return null;

  return (
    <div className="px-4 pt-3 space-y-2.5">
      <AnimatePresence initial={false}>
        {visible.map((ann) => {
          const cfg =
            TYPE_CONFIG[ann.type as keyof typeof TYPE_CONFIG] ??
            TYPE_CONFIG.info;
          const Icon = cfg.icon;
          return (
            <motion.div
              key={ann.id}
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden"
            >
              <div
                className={cn(
                  "rounded-2xl border p-3.5 flex gap-3 items-start shadow-sm",
                  cfg.bg,
                  cfg.border,
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border",
                    cfg.bg,
                    cfg.border,
                  )}
                >
                  <Icon className={cn("w-4 h-4", cfg.iconColor)} />
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={cn(
                        "text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full",
                        cfg.badge,
                      )}
                    >
                      {cfg.label}
                    </span>
                    <p className="font-bold text-sm text-foreground leading-snug">
                      {ann.title}
                    </p>
                  </div>
                  {ann.body && (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {ann.body}
                    </p>
                  )}
                  {ann.linkText &&
                    ann.linkUrl &&
                    (ann.linkUrl.startsWith("/") ? (
                      <Link href={ann.linkUrl}>
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 text-xs font-bold mt-1 cursor-pointer",
                            cfg.iconColor,
                          )}
                        >
                          {ann.linkText} <ChevronRight className="w-3 h-3" />
                        </span>
                      </Link>
                    ) : (
                      <a
                        href={ann.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "inline-flex items-center gap-1 text-xs font-bold mt-1",
                          cfg.iconColor,
                        )}
                      >
                        {ann.linkText} <ChevronRight className="w-3 h-3" />
                      </a>
                    ))}
                </div>
                <button
                  onClick={() => dismiss(ann.id)}
                  className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:bg-black/10 transition-colors mt-0.5"
                  aria-label="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
