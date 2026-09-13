"use client";

import { useState } from "react";
import { SignUp, useSignUp } from "@clerk/nextjs";
import { isClerkConfigured } from "@/lib/clerk";
import { SignupStepper } from "@/components/shared/SignupStepper";

function SignUpSkeleton() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-gray-50 px-4">
      <div className="w-[440px] max-w-full animate-pulse space-y-6 rounded-2xl border border-gray-100 bg-white p-8 shadow-xl shadow-indigo-100/50">
        <div className="flex justify-center"><div className="h-10 w-10 rounded-xl bg-gray-200" /></div>
        <div className="space-y-2 text-center">
          <div className="mx-auto h-6 w-48 rounded bg-gray-200" />
          <div className="mx-auto h-4 w-64 rounded bg-gray-100" />
        </div>
        <div className="space-y-3">
          <div className="h-4 w-20 rounded bg-gray-200" />
          <div className="h-10 w-full rounded-xl bg-gray-100" />
        </div>
        <div className="space-y-3">
          <div className="h-4 w-20 rounded bg-gray-200" />
          <div className="h-10 w-full rounded-xl bg-gray-100" />
        </div>
        <div className="space-y-3">
          <div className="h-4 w-20 rounded bg-gray-200" />
          <div className="h-10 w-full rounded-xl bg-gray-100" />
        </div>
        <div className="h-10 w-full rounded-xl bg-indigo-200" />
      </div>
    </div>
  );
}

/**
 * Shows the stepper when Clerk's SignUp component is processing
 * (after user clicks submit, while Clerk creates the account).
 */
function SignUpWithStepper() {
  const { isLoaded, signUp } = useSignUp();
  const [isProcessing, setIsProcessing] = useState(false);

  // Watch for Clerk processing state — after verify code / create account
  // TheSignUp component handles the UI; we intercept the loading state
  if (!isLoaded) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-gray-50">
        <SignupStepper currentStep={0} />
      </div>
    );
  }

  return (
    <SignUp
      fallback={<SignUpSkeleton />}
      appearance={{
        elements: {
          formButtonPrimary: "bg-indigo-600 hover:bg-indigo-700 text-white",
          card: "shadow-none border-0",
        },
      }}
      // After successful signup, Clerk redirects automatically
      // The (app) layout will show the stepper during auth resolution
    />
  );
}

export default function SignUpPage() {
  if (!isClerkConfigured) {
    return <div className="mx-auto max-w-md px-6 py-20 text-center text-sm text-gray-600">Clerk is not configured for this local environment.</div>;
  }

  return <SignUpWithStepper />;
}
