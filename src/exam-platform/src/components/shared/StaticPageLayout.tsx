"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageTransition } from "./PageTransition";
import { Button } from "./../ui/button";

interface StaticPageLayoutProps {
  title: string;
  subtitle?: string;
  heading: string;
  children: React.ReactNode;
}


export function StaticPageLayout({ title, subtitle = "Explore premium educational resources", heading, children }: StaticPageLayoutProps) {
  const router = useRouter();

  return (
    <PageTransition className="min-h-screen bg-gray-50 flex flex-col">

      <div className="relative overflow-hidden border-b bg-background p-2">
        {/* NOT NEEDED RIGHT NOW  */}
        {/* <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle, currentColor 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        /> */}

        <div className="relative flex items-center gap-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/")}
            className="h-8 rounded-lg px-3 shadow-sm"
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>

          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              {title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {subtitle}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 pt-6 pb-4 max-w-2xl w-full mx-auto">
        <div className="mb-5">
          <h2 className="text-2xl font-extrabold text-foreground">{heading}</h2>
          <div className="mt-1.5 w-14 h-[3px] rounded-full bg-primary" />
        </div>

        <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-5 space-y-4 text-sm leading-relaxed text-foreground">
          {children}
        </div>
      </div>

    </PageTransition>
  );
}

export function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="font-bold text-base text-foreground mt-4 mb-1.5">{children}</h3>;
}

export function SectionText({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-[#374151] leading-relaxed">{children}</p>;
}

export function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1 mt-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-[#374151]">
          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
          {item}
        </li>
      ))}
    </ul>
  );
}
