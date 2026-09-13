"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { SignupStepper } from "@/components/shared/SignupStepper";

/**
 * Detects the SSO (Google/GitHub OAuth) callback phase.
 *
 * After the user picks an account on Google, Clerk redirects back to
 * /sign-in or /sign-up with `sso_callback` in the URL and finalizes the
 * session there (token transfer + session creation). This phase shows
 * Clerk's internal spinner for several seconds — we replace it with the
 * branded SignupStepper.
 *
 * Returns a React node: either the stepper (during SSO callback) or null.
 * Also fades the stepper out briefly after auth resolves so the UI
 * doesn't flash back to the form on slow connections.
 */
export function useSsoCallbackStepper(): React.ReactNode {
  const searchParams = useSearchParams();
  const { isLoaded, isSignedIn } = useAuth();
  const [showStepper, setShowStepper] = useState(false);

  const isSsoCallback =
    searchParams.has("sso_callback") || searchParams.has("transfer");

  useEffect(() => {
    if (isSsoCallback && !isSignedIn) {
      setShowStepper(true);
      return undefined;
    }

    // Auth resolved (or callback params gone) — hide after a beat
    // so the user sees "Preparing dashboard" complete rather than a flash.
    if (isSsoCallback && isSignedIn && isLoaded) {
      const timer = setTimeout(() => setShowStepper(false), 700);
      return () => clearTimeout(timer);
    }

    setShowStepper(false);
    return undefined;
  }, [isSsoCallback, isSignedIn, isLoaded]);

  if (!showStepper) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50 px-4">
      <SignupStepper />
    </div>
  );
}
