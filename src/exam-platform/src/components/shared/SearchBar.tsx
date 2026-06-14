"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ALL_NAV_ITEMS } from "../layout/AppLayout";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SearchBar({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const results =
    query.trim().length === 0
      ? []
      : ALL_NAV_ITEMS.filter((item) => {
          const q = query.toLowerCase();
          return (
            item.label.toLowerCase().includes(q) ||
            (item.keywords ?? "").toLowerCase().includes(q)
          );
        }).slice(0, 6);

  const showDropdown = focused && query.trim().length > 0;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (href: string) => {
    router.push(href);
    setQuery("");
    setFocused(false);
    onNavigate?.();
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          placeholder="Search quizzes, notes, news..."
          className="w-full pl-8 pr-8 h-9 text-xs bg-gray-100 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full mt-1.5 left-0 right-0 bg-white rounded-xl shadow-lg border border-border z-[200] overflow-hidden">
          {results.length > 0 ? (
            results.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  onMouseDown={() => handleSelect(item.href)}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {item.label}
                  </span>
                  {item.protected && (
                    <span className="ml-auto text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
                      LOGIN
                    </span>
                  )}
                </button>
              );
            })
          ) : (
            <div className="px-4 py-3 text-xs text-muted-foreground text-center">
              No results for &quot;
              <span className="font-semibold text-foreground">{query}</span>
              &quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
}