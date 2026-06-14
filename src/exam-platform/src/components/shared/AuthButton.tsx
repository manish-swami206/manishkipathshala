"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import Footer from "../shared/Footer";
import { useClientMounted } from "../layout/AppLayout";

export default function AuthButton({ compact = false }: { compact?: boolean }) {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const mounted = useClientMounted();

  if (!mounted || !isLoaded)
    return <div className="w-7 h-7 rounded-full bg-gray-200 animate-pulse" />;

  if (user) {
    return (
      <button onClick={() => router.push("/profile")} className="shrink-0">
        <Avatar className="w-7 h-7 border border-primary/20 hover:ring-2 hover:ring-primary/30 transition-all">
          <AvatarImage src={user.imageUrl} />
          <AvatarFallback className="bg-primary text-white font-bold text-xs">
            {(
              user.firstName?.[0] ??
              user.primaryEmailAddress?.emailAddress?.[0] ??
              "U"
            ).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </button>
    );
  }

  return (
    <button
      onClick={() => router.push("/sign-in")}
      className={cn(
        "flex items-center gap-1.5 rounded-xl font-semibold transition-colors",
        compact
          ? "text-xs text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-1.5"
          : "text-xs text-white bg-primary hover:bg-primary/90 px-3 py-1.5",
      )}
    >
      <LogIn className="w-3.5 h-3.5" />
      Sign In
    </button>
  );
}
