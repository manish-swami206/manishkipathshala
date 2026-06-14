"use client";

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogIn, Lock } from "lucide-react";

interface RequireAuthContextType {
  /**
   * Requires authentication before executing a callback.
   * If the user is signed in, the callback runs immediately.
   * If not, a modal prompts them to sign in.
   * Returns a promise that resolves when the action completes or is cancelled.
   */
  requireAuth: <T>(callback: () => T | Promise<T>) => Promise<T | undefined>;
}

const RequireAuthContext = createContext<RequireAuthContextType>({
  requireAuth: async <T,>(callback: () => T | Promise<T>) => callback(),
});

export function useRequireAuth() {
  return useContext(RequireAuthContext);
}

export function RequireAuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const cancelResolverRef = useRef<((value?: undefined) => void) | null>(null);

  const requireAuth = useCallback(
    async <T,>(callback: () => T | Promise<T>): Promise<T | undefined> => {
      if (!isLoaded) return undefined;

      if (isSignedIn) {
        return await callback();
      }

      // Not signed in — show modal
      return await new Promise<T | undefined>((resolve) => {
        cancelResolverRef.current = resolve as (value?: undefined) => void;
        setPendingAction(() => async () => {
          const result = await callback();
          resolve(result);
        });
        setShowModal(true);
      });
    },
    [isLoaded, isSignedIn],
  );

  const handleSignIn = () => {
    setShowModal(false);
    const returnUrl = window.location.pathname + window.location.search;
    router.push(`/sign-in?redirect_url=${encodeURIComponent(returnUrl)}`);
  };

  const handleCancel = () => {
    setShowModal(false);
    setPendingAction(null);
    // Resolve the pending promise with undefined so callers can proceed
    cancelResolverRef.current?.(undefined);
    cancelResolverRef.current = null;
  };

  return (
    <RequireAuthContext.Provider value={{ requireAuth }}>
      {children}

      <Dialog open={showModal} onOpenChange={(open) => { if (!open) handleCancel(); }}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6 gap-6">
          <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="w-6 h-6 text-primary" />
          </div>
          <DialogHeader className="text-center space-y-2">
            <DialogTitle className="text-xl font-bold">Sign in required</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              You need to be signed in to access this feature. Sign in to continue or go back.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Button
              size="lg"
              className="w-full rounded-xl h-12 gap-2 text-base font-semibold"
              onClick={handleSignIn}
            >
              <LogIn className="w-4 h-4" />
              Sign in
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="w-full rounded-xl h-12 text-base"
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </RequireAuthContext.Provider>
  );
}
