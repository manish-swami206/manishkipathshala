"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useListAnnouncements, getListAnnouncementsQueryKey } from "@/lib/api";
import { NOTIF_COLOR, NOTIF_ICON, useClientMounted } from "../layout/AppLayout";

export default function NotificationsPanel() {
  const [open, setOpen] = useState(false);
  const mounted = useClientMounted();
  const { data: announcements } = useListAnnouncements({
    query: { enabled: mounted, queryKey: getListAnnouncementsQueryKey() },
  });
  const count = mounted ? (announcements?.length ?? 0) : 0;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 relative"
          aria-label="Notifications"
        >
          <Bell className="w-[18px] h-[18px] text-foreground" />
          {count > 0 && (
            <span className="absolute top-1 right-1 min-w-[14px] h-[14px] bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white px-0.5">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 p-0 flex flex-col">
        <SheetTitle className="sr-only">Notifications</SheetTitle>
        <SheetDescription className="sr-only">
          Recent alerts and announcements
        </SheetDescription>
        <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <span className="font-bold text-sm">Notifications</span>
            {count > 0 && (
              <span className="text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded-full">
                {count}
              </span>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {!announcements || announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-6 py-12">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                <Bell className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">
                  All caught up!
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  No new notifications right now.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {announcements.map((ann) => {
                const Icon = NOTIF_ICON[ann.type] ?? Bell;
                const colorClass = NOTIF_COLOR[ann.type] ?? NOTIF_COLOR.info;
                return (
                  <div
                    key={ann.id}
                    className="px-5 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex gap-3">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                          colorClass,
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground leading-snug">
                          {ann.title}
                        </p>
                        {ann.body && (
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                            {ann.body}
                          </p>
                        )}
                        {ann.linkText &&
                          ann.linkUrl &&
                          (ann.linkUrl.startsWith("/") ? (
                            <Link
                              href={ann.linkUrl}
                              onClick={() => setOpen(false)}
                            >
                              <span className="text-xs font-semibold text-primary mt-1 inline-block hover:underline cursor-pointer">
                                {ann.linkText} →
                              </span>
                            </Link>
                          ) : (
                            <a
                              href={ann.linkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-semibold text-primary mt-1 inline-block hover:underline"
                            >
                              {ann.linkText} →
                            </a>
                          ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
