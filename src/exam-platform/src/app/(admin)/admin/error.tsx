"use client";

import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

export default function AdminErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
        <p className="text-sm text-muted-foreground mb-2">
          An unexpected error occurred while loading this admin page.
        </p>
        {error.message && (
          <p className="text-xs text-red-600 bg-red-50 rounded-lg p-2 mb-4 font-mono">
            {error.message}
          </p>
        )}
        <div className="flex gap-3 justify-center">
          <Button
            onClick={reset}
            className="rounded-xl gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </Button>
          <Button
            variant="outline"
            onClick={() => (window.location.href = "/admin")}
            className="rounded-xl gap-2"
          >
            <Home className="w-4 h-4" /> Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
