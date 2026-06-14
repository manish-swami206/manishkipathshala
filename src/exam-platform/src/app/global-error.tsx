"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center px-6">
          <div className="w-20 h-20 rounded-3xl bg-red-100 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl font-black text-red-600">!</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
            {error?.message || "An unexpected error occurred."}
          </p>
          <button
            onClick={reset}
            className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
