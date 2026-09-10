"use client";

import { SignIn } from "@clerk/nextjs";
import { isClerkConfigured } from "@/lib/clerk";

function SignInSkeleton() {
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
        <div className="h-10 w-full rounded-xl bg-indigo-200" />
      </div>
    </div>
  );
}

export default function SignInPage() {
  if (!isClerkConfigured) {
    return <div className="mx-auto max-w-md px-6 py-20 text-center text-sm text-gray-600">Clerk is not configured for this local environment.</div>;
  }

  return (
    <SignIn
      fallback={<SignInSkeleton />}
    />
  );
}
