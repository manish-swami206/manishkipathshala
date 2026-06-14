export default function RootLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gray-200 animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-5 bg-gray-200 rounded-lg animate-pulse w-48" />
            <div className="h-3 bg-gray-100 rounded animate-pulse w-72" />
          </div>
        </div>

        {/* Cards grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-border/50 p-5 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-gray-200 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
              <div className="h-3 bg-gray-100 rounded animate-pulse w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
