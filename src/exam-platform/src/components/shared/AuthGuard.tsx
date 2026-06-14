"use client";

import type { ReactNode } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface AuthGuardProps {
  children: ReactNode;
  /** Optional redirect path after sign-in (defaults to current page) */
  redirectBackTo?: string;
}

/**
 * Page-level auth guard.
 * Wraps a page to require authentication.
 * Shows a loading spinner while checking auth status,
 * then redirects to Clerk sign-in if not authenticated.
 */
export function AuthGuard({ children, redirectBackTo }: AuthGuardProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      const returnUrl = redirectBackTo ?? window.location.pathname + window.location.search;
      const signInUrl = `/sign-in?redirect_url=${encodeURIComponent(returnUrl)}`;
      router.replace(signInUrl);
    } else {
      setChecking(false);
    }
  }, [isLoaded, isSignedIn, router, redirectBackTo]);

  if (!isLoaded || checking) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin" />
          <p className="text-sm">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
