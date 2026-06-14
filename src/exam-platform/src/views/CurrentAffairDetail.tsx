"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { PageTransition } from "@/components/shared/PageTransition";
import { useGetCurrentAffair, getGetCurrentAffairQueryKey } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { telegram_link, whatsapp_link } from "@/lib/data";

/* ─────────────────────────────────────────
   Inline SVG icons for WhatsApp & Telegram
   (avoids external image deps)
───────────────────────────────────────── */
function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

/* ─────────────────────────────────────────
   Date Badge — NOV / 20 / 2023 card
───────────────────────────────────────── */
function DateBadge({ date }: { date: Date | string }) {
  const d = date instanceof Date ? date : new Date(date);
  const day = d.getDate();
  const month = d.toLocaleString("en-IN", { month: "short" }).toUpperCase();
  const year = d.getFullYear();
  return (
    <div className="inline-flex flex-col items-center bg-white rounded-xl shadow-sm border border-gray-100 px-4 pt-2 mt-4 pb-2 min-w-[64px]">
      <span className="text-3xl font-extrabold text-gray-900 leading-none">
        {day}
      </span>
      <span className="text-[11px] font-semibold tracking-widest text-violet-500 leading-none mb-1">
        {month}
      </span>
      <span className="text-[11px] text-gray-400 leading-none mt-1">
        {year}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────
   Hero Banner — purple gradient header card
───────────────────────────────────────── */
function HeroBanner() {
  return (
    <div
      className="relative rounded-t-2xl overflow-hidden flex flex-col items-center justify-center py-8 px-6"
      style={{
        background:
          "linear-gradient(135deg, #6d28d9 0%, #7c3aed 40%, #a855f7 100%)",
        minHeight: "120px",
      }}
    >
      {/* Branding pill */}
      <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 mb-3">
        <span className="text-[10px] text-white/90 tracking-[0.2em] font-semibold uppercase">
          ✦ Manish Ki Pathshala
        </span>
      </div>
      {/* Title */}
      <h2 className="text-white font-extrabold tracking-[0.25em] text-xl md:text-2xl uppercase text-center">
        Daily Current Affairs
      </h2>
    </div>
  );
}

/* ─────────────────────────────────────────
   Main Page
───────────────────────────────────────── */
export default function CurrentAffairDetail() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const fallbackUid = searchParams?.get("id") ?? null;

  const slug = params?.id ?? "";
  const [useUid, setUseUid] = useState(false);
  const queryId = useUid && fallbackUid ? fallbackUid : slug;

  const {
    data: article,
    isLoading,
    isError,
  } = useGetCurrentAffair(queryId, {
    query: { enabled: !!queryId, queryKey: getGetCurrentAffairQueryKey(queryId) },
  });

  // Retry by UUID if slug-based lookup fails and we have a fallback UUID
  React.useEffect(() => {
    if (isError && !useUid && fallbackUid) {
      setUseUid(true);
    }
  }, [isError, useUid, fallbackUid]);

  /* ── Loading ── */
  if (isLoading) {
    return (
      <PageTransition className="p-4 md:p-8 max-w-2xl mx-auto space-y-4">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-[420px] w-full rounded-2xl" />
      </PageTransition>
    );
  }

  /* ── Error ── */
  if (isError || !article) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Article not found.
      </div>
    );
  }

  /* ── Share handler ── */
  const handleShare = (platform: "whatsapp" | "telegram") => {
    if (platform === "whatsapp") {
      window.open(whatsapp_link, "_blank");
    } else {
      window.open(telegram_link, "_blank");
    }
  };

  /* ── Render ── */
  return (
    <PageTransition className="p-4 md:p-8 max-w-5xl mx-auto min-h-screen">
      {/* Page heading */}
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold text-foreground">
          Daily Current Affairs
        </h1>
        <p className="text-sm text-muted-foreground">
          Explore premium educational resources
        </p>
      </div>

      {/* Back button */}
      <Link href="/current-affairs">
        <Button
          variant="outline"
          size="sm"
          className="mb-5 rounded-xl gap-2 text-muted-foreground border-border"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
      </Link>

      {/* Article Card */}
      <div className="bg-background rounded-2xl border border-border shadow-sm overflow-hidden">
        {/* Purple gradient hero */}
        <HeroBanner />

        {/* Date + content area */}
        <div className="px-5 pb-5 pt-0">
          {/* Date badge — overlaps the banner bottom */}
          <div className="flex -mt-6 mb-5">
            <DateBadge date={article.publishedAt} />
          </div>

          {/* Article title */}
          <h2 className="text-xl md:text-2xl font-extrabold leading-snug mb-4  text-violet-500 tracking-wide uppercase">
            {article.title}
          </h2>

          {/* Summary — bold intro paragraph */}
          {article.summary && (
            <p className="text-sm font-bold text-foreground leading-relaxed mb-5">
              {article.summary}
            </p>
          )}

          {/* Deep Analysis box */}
          {article.content && (
            <div className="border border-border rounded-xl px-4 py-3 mb-5 bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-violet-500" />
                <span className="text-sm font-bold tracking-widest uppercase text-violet-500">
                  Deep Analysis
                </span>
              </div>
              <div
                className="prose prose-sm max-w-none text-foreground text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            </div>
          )}

          {/* Footer row: Share + Prev/Next */}
          <div className="flex items-center justify-between pt-3 border-t border-border">
            {/* Share */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-muted-foreground tracking-widest uppercase">
                Share Material
              </span>
              <button
                onClick={() => handleShare("whatsapp")}
                className="w-9 h-9 rounded-full bg-[#25D366] hover:bg-[#1ebe5b] text-white flex items-center justify-center transition-colors"
                aria-label="Share on WhatsApp"
              >
                <WhatsAppIcon />
              </button>
              <button
                onClick={() => handleShare("telegram")}
                className="w-9 h-9 rounded-full bg-[#229ED9] hover:bg-[#1a8cc2] text-white flex items-center justify-center transition-colors"
                aria-label="Share on Telegram"
              >
                <TelegramIcon />
              </button>
            </div>

            {/* Prev / Next arrows */}
            {/* FUTURE IMPLEMENTATION */}
            {/* <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                className="rounded-full w-9 h-9 border-border"
                aria-label="Previous article"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full w-9 h-9 border-border"
                aria-label="Next article"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div> */}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
