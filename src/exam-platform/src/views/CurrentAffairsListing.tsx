"use client";

import { useState } from "react";
import Link from "next/link";
import { PageTransition } from "@/components/shared/PageTransition";
import { useQuery } from "@tanstack/react-query";
import { currentAffairsApi } from "@/lib/api/endpoints";
import { queryKeys } from "@/lib/api/query-keys";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Empty, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Calendar, ChevronRight, Newspaper } from "lucide-react";

// Fallback slugifier if DB slug is not available
function slugifyTitle(value: string) {
  let slug = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  // Fallback for non-Latin scripts (e.g., Hindi/Devanagari)
  if (!slug) {
    slug = value
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{M}\p{N}\s-]+/gu, "")
      .replace(/[\s]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  return slug;
}

export default function CurrentAffairsListing() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.currentAffairs.list({ page, limit: 12 }),
    queryFn: () => currentAffairsApi.list({ page, limit: 12 }),
    staleTime: 60 * 1000,
  });
  return (
    <PageTransition className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Current Affairs</h1>
          <p className="text-muted-foreground">
            Daily news analysis and updates for competitive exams.
          </p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array(6)
            .fill(0)
            .map((_, i) => <Skeleton key={i} className="h-64 rounded-2xl" />)
        ) : data && data.data && data.data.length === 0 ? (
          <div className="col-span-full">
            <Empty>
              <Newspaper className="w-10 h-10 text-gray-300" />
              <EmptyTitle>No articles found</EmptyTitle>
              <EmptyDescription>
                There are no current affairs articles available at the moment.
                Check back later for updates.
              </EmptyDescription>
            </Empty>
          </div>
        ) : (
          data?.data?.map((article) => (
            <Card
              key={article.id}
              className="card-hover border-border/50 rounded-2xl bg-card overflow-hidden flex flex-col"
            >
              <CardContent className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start gap-2 mb-3">
                  <span className="text-xs font-semibold text-blue-600 bg-blue-500/10 px-2 py-1 rounded-md">
                    {article.category}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(article.publishedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <h3 className="font-bold text-lg leading-tight mb-2 line-clamp-2 text-violet-500 hover:underline">
                  {article.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
                  {article.summary}
                </p>

                <Link
                  href={`/current-affairs/${article.slug ?? slugifyTitle(article.title)}?id=${article.id}`}
                >
                  <Button
                    variant="ghost"
                    className="w-full justify-between px-0 hover:bg-transparent hover:text-primary"
                  >
                    Read Full Article <ChevronRight className="w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      {data && data.totalPages > 1 && (
        <Pagination className="mt-8">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className={
                  page === 1
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>

            {Array.from({ length: data.totalPages }).map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink
                  onClick={() => setPage(i + 1)}
                  isActive={page === i + 1}
                  className="cursor-pointer"
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}

            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                className={
                  page === data.totalPages
                    ? "pointer-events-none opacity-50"
                    : "cursor-pointer"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}{" "}
    </PageTransition>
  );
}
