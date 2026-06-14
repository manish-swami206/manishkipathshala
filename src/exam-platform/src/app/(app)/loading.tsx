export default function AppLoading() {
  return (
    <div className="min-h-[60vh] p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-8 bg-gray-200 rounded-lg animate-pulse w-64" />
        <div className="h-4 bg-gray-100 rounded animate-pulse w-96" />
      </div>

      {/* Filters skeleton */}
      <div className="flex gap-4 p-4 bg-white border rounded-2xl">
        <div className="h-10 bg-gray-200 rounded-xl animate-pulse flex-1" />
        <div className="h-10 bg-gray-200 rounded-xl animate-pulse w-40" />
      </div>

      {/* Cards grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-border/50 overflow-hidden">
            <div className="h-32 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
            <div className="p-5 space-y-3">
              <div className="h-3 bg-gray-200 rounded animate-pulse w-16" />
              <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-gray-100 rounded animate-pulse w-full" />
              <div className="h-3 bg-gray-100 rounded animate-pulse w-2/3" />
              <div className="h-10 bg-gray-200 rounded-xl animate-pulse w-full mt-3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
