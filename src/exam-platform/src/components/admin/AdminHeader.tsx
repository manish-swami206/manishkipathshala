"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Search, Menu } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { UserButton } from "@clerk/nextjs";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import Link from "next/link";
import { useAdminSupportUnreadCount } from "@/lib/api";
import { NAV } from "./AdminSidebar";
import { useAppDispatch } from "@/store/hooks";
import { toggleMobileAdminSidebar } from "@/store/slices/uiSlice";

export function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [searchOpen, setSearchOpen] = React.useState(false);

  const { data: unreadData, isLoading } = useAdminSupportUnreadCount({
    query: {
      refetchInterval: 30_000,
    },
  });

  const unreadCount = unreadData?.unreadCount ?? 0;

  const breadcrumb = buildBreadcrumb(pathname);

  const env = process.env.NEXT_PUBLIC_APP_ENV ?? "dev";
  const envLabel = env.toLowerCase() === "prod" ? "prod" : "dev";
  const envTone =
    envLabel === "prod"
      ? "bg-emerald-500/10 text-emerald-300"
      : "bg-amber-500/10 text-amber-200";

  // Keyboard shortcut
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="h-16 px-4 lg:px-6 flex items-center justify-between gap-2 lg:gap-4">
        <div className="min-w-0 flex items-center gap-2 lg:gap-6">
          {/* Mobile hamburger */}
          <button
            onClick={() => dispatch(toggleMobileAdminSidebar())}
            className="p-2 rounded-lg hover:bg-muted transition-colors lg:hidden shrink-0"
            aria-label="Open sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumb.map((b, idx) => {
                const last = idx === breadcrumb.length - 1;
                return (
                  <React.Fragment key={`${b.label}-${idx}`}>
                    {idx > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      {last ? (
                        <BreadcrumbPage className="max-w-[280px] truncate">
                          {b.label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link href={b.href}>{b.label}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </React.Fragment>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>

          {/* Search Bar */}
          <button
            onClick={() => setSearchOpen(true)}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground bg-muted/50 border border-border rounded-lg hover:bg-muted hover:text-foreground transition-colors min-w-[200px]"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search pages...</span>
            <kbd className="ml-auto text-[10px] font-mono bg-background border border-border px-1.5 py-0.5 rounded">
              ⌘K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Badge className={`border border-border ${envTone}`}>
            {envLabel}
          </Badge>

          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="relative p-2 rounded-md hover:bg-muted transition-colors"
                aria-label="Support tickets notifications"
              >
                <Bell className="h-4 w-4" />
                {!isLoading && unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-red-500" />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
              <div className="p-4 border-b">
                <div className="text-sm font-semibold">
                  Unread support tickets
                </div>
                <div className="text-xs text-muted-foreground">
                  {isLoading ? "Loading..." : `${unreadCount} unread`}
                </div>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {isLoading ? (
                  <div className="p-4 text-sm text-muted-foreground">
                    Loading...
                  </div>
                ) : unreadCount === 0 ? (
                  <div className="p-4 text-sm text-muted-foreground">
                    No unread tickets.
                  </div>
                ) : (
                  <div className="p-4 text-sm text-muted-foreground">
                    {unreadCount} ticket{unreadCount !== 1 ? "s" : ""} waiting for reply.
                  </div>
                )}
              </div>
              <div className="p-3">
                <Link
                  href="/admin/support-tickets"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  View all
                </Link>
              </div>
            </PopoverContent>
          </Popover>

          <Separator orientation="vertical" className="h-6" />

          {/* <UserButton  /> */}
        </div>
      </div>

      {/* Search Dialog */}
      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="Search admin pages..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Admin Pages">
            {NAV.map((item) => (
              <CommandItem
                key={item.href}
                value={item.label}
                onSelect={() => {
                  setSearchOpen(false);
                  router.push(item.href);
                }}
              >
                <item.icon className="mr-2 h-4 w-4" />
                <span>{item.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </header>
  );
}

function buildBreadcrumb(pathname: string) {
  const clean = pathname?.split("?")[0] ?? "";
  const parts = clean.split("/").filter(Boolean);

  // We want to show max 2 levels deep after "admin" group.
  // Examples:
  //   /admin/current-affairs -> Admin / Current Affairs
  //   /admin/questions/new -> Admin / Questions / New (max 2 levels deep -> Questions / New)
  const normalized = parts.map((p) => decodeURIComponent(p));

  const adminIndex = normalized.indexOf("admin");
  const afterAdmin =
    adminIndex >= 0 ? normalized.slice(adminIndex + 1) : normalized;

  const display = afterAdmin.slice(0, 2);

  // Special case: if path is /admin/questions/new, show Questions / New (2 levels)
  // if afterAdmin has 3+ segments, take last segment as second.
  let twoParts: string[];
  if (afterAdmin.length <= 2) {
    twoParts = afterAdmin;
  } else {
    twoParts = [afterAdmin[0], afterAdmin[afterAdmin.length - 1]];
  }

  const labels = twoParts.map(toTitle);

  // Always prepend "Admin".
  const result: Array<{ label: string; href: string }> = [];
  result.push({ label: "Admin", href: "/admin" });

  // Create up to 2 additional levels.
  if (labels[0]) {
    const href = "/admin/" + (twoParts[0] ?? "");
    result.push({ label: labels[0], href });
  }
  if (labels[1]) {
    const href =
      "/admin/" + [twoParts[0], twoParts[1]].filter(Boolean).join("/");
    result.push({ label: labels[1], href });
  }

  // If only one part exists after admin, keep max 2 levels total.
  return result;
}

function toTitle(segment: string) {
  const s = segment.replace(/-/g, " ");
  return s
    .split(" ")
    .filter(Boolean)
    .map((w) => w.slice(0, 1).toUpperCase() + w.slice(1))
    .join(" ");
}
