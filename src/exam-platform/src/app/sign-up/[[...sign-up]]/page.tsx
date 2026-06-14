"use client";

import { SignUp } from "@clerk/nextjs";
import { isClerkConfigured } from "@/lib/clerk";

export default function SignUpPage() {
  if (!isClerkConfigured) {
    return <div className="mx-auto max-w-md px-6 py-20 text-center text-sm text-gray-600">Clerk is not configured for this local environment.</div>;
  }

  return <SignUp />;
}
