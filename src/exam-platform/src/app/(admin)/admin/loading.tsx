export default function AdminLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 p-6">
      {/* Header skeleton */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gray-200 animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-6 bg-gray-200 rounded-lg animate-pulse w-40" />
            <div className="h-3 bg-gray-100 rounded animate-pulse w-28" />
          </div>
        </div>
        <div className="h-10 w-36 bg-gray-200 rounded-xl animate-pulse" />
      </div>

      {/* Search/filters skeleton */}
      <div className="h-10 bg-gray-100 rounded-xl animate-pulse w-72" />

      {/* Table skeleton */}
      <div className="rounded-2xl border border-border/50 bg-white shadow-sm overflow-hidden">
        {/* Table header */}
        <div className="bg-gray-50/70 px-5 py-3 border-b">
          <div className="flex gap-8">
            <div className="h-3 bg-gray-200 rounded animate-pulse w-48" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-20" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-20" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-16" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-12 ml-auto" />
          </div>
        </div>

        {/* Table rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-border/30">
            <div className="w-8 h-8 rounded-lg bg-gray-100 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-gray-100 rounded animate-pulse w-1/3" />
            </div>
            <div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" />
            <div className="h-8 w-20 bg-gray-100 rounded-lg animate-pulse" />
            <div className="flex gap-1">
              <div className="h-8 w-8 bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-8 w-8 bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-8 w-8 bg-gray-100 rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
