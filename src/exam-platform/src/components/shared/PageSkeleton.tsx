/**
 * Reusable skeleton components for streaming SSR loading states.
 * These provide instant visual feedback while server components stream in.
 */

import { Skeleton } from "@/components/ui/skeleton";

/** Generic page skeleton with header + content area */
export function PageSkeleton() {
  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
      <Skeleton className="h-[400px] w-full rounded-2xl" />
    </div>
  );
}

/** Detail page skeleton (quiz, mock test, article) */
export function DetailSkeleton() {
  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto space-y-4">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-[420px] w-full rounded-2xl" />
    </div>
  );
}

/** Listing page skeleton with grid */
export function ListingSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

/** Quiz/Mock test player skeleton */
export function PlayerSkeleton() {
  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-20" />
      </div>
      <Skeleton className="h-8 w-full" />
      <div className="space-y-3">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
      <div className="flex gap-3">
        <Skeleton className="h-10 flex-1 rounded-xl" />
        <Skeleton className="h-10 flex-1 rounded-xl" />
      </div>
    </div>
  );
}

/** Admin table skeleton */
export function AdminTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="max-w-6xl mx-auto space-y-6 p-2 sm:p-4">
      <div className="flex justify-between">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>
      <Skeleton className="h-10 w-full rounded-xl" />
      <div className="rounded-2xl border border-border/50 bg-white shadow-sm overflow-hidden">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-border/40">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
