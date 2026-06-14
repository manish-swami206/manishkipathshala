"use client";

import { useEffect, useCallback, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface NavigationWarningProps {
  /** When true, the warning is active (e.g., during an active quiz) */
  enabled: boolean;
  /** Callback when user confirms leaving */
  onLeave?: () => void;
}

/**
 * Warns the user when they try to navigate away, refresh, or close the tab
 * while `enabled` is true. Shows a shadcn AlertDialog.
 */
export function NavigationWarning({ enabled, onLeave }: NavigationWarningProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  // beforeunload for refresh / tab close
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [enabled]);

  // Intercept in-app navigation
  const handleNavigation = useCallback(
    (e: MouseEvent) => {
      if (!enabled) return;
      const target = (e.target as HTMLElement).closest("a");
      if (!target || !target.href || target.href === window.location.href) return;
      // Allow same-page anchors
      if (target.href.startsWith(window.location.href + "#")) return;

      e.preventDefault();
      e.stopPropagation();

      setPendingNavigation(() => () => {
        window.location.href = target.href;
      });
      setShowDialog(true);
    },
    [enabled],
  );

  useEffect(() => {
    if (!enabled) return;
    document.addEventListener("click", handleNavigation, true);
    return () => document.removeEventListener("click", handleNavigation, true);
  }, [enabled, handleNavigation]);

  const handleConfirmLeave = () => {
    setShowDialog(false);
    onLeave?.();
    pendingNavigation?.();
    setPendingNavigation(null);
  };

  const handleCancel = () => {
    setShowDialog(false);
    setPendingNavigation(null);
  };

  return (
    <AlertDialog open={showDialog} onOpenChange={(open) => !open && handleCancel()}>
      <AlertDialogContent className="rounded-2xl border-border bg-white shadow-xl max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <AlertDialogTitle className="text-gray-900 font-bold text-lg">
              Leaving so soon?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-gray-500 text-sm leading-relaxed">
            Your current progress will be lost if you leave or refresh this page.
            Are you sure you want to continue?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel asChild>
            <button
              onClick={handleCancel}
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Stay on page
            </button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <button
              onClick={handleConfirmLeave}
              className="inline-flex items-center justify-center rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 transition-colors"
            >
              Leave anyway
            </button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
