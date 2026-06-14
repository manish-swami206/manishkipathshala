"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect, useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu, LogIn } from "lucide-react";
import SearchBar from "./SearchBar";
import {
  ClientSignedIn,
  ClientSignedOut,
  NAV_GROUPS,
  SidebarNavItem,
} from "../layout/AppLayout";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import NotificationsPanel from "./NotificationPanel";
import AuthButton from "./AuthButton";
import { Headphones } from "lucide-react";
import { useSupportUnreadCount } from "@/lib/api";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const { user, isSignedIn } = useUser();
  const { scrollY } = useScroll();

  // Subtle header elevation on scroll
  const headerShadow = useTransform(
    scrollY,
    [0, 40],
    ["0 1px 0 0 rgba(0,0,0,0.06)", "0 4px 24px 0 rgba(0,0,0,0.10)"],
  );
  const headerBg = useTransform(
    scrollY,
    [0, 40],
    ["rgba(255,255,255,0.95)", "rgba(255,255,255,1)"],
  );

  useEffect(() => {
    const unsub = scrollY.on("change", (v) => setScrolled(v > 8));
    return unsub;
  }, [scrollY]);

  // Flat list of all nav items for stagger indexing
  // const allNavItems = NAV_GROUPS.flatMap((g) => g.items);

  const { data: unreadData } = useSupportUnreadCount({
    query: { enabled: !!isSignedIn, refetchInterval: 30_000 },
  });
  const supportUnread = unreadData?.unreadCount ?? 0;

  return (
    <motion.header
      style={{ boxShadow: headerShadow, backgroundColor: headerBg }}
      initial={{ y: -56, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      className={`
  sticky top-0 z-40
  border-b border-border/60
  px-3
  flex items-center justify-between md:justify-start
  gap-2.5
  backdrop-blur-sm
  duration-300
  ${scrolled ? "h-14" : "h-[65px]"}
`}
    >
      {/* ── SIDEBAR TRIGGER ──────────────────────────────────────────────────── */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <motion.button
            whileHover={{ scale: 1.08, backgroundColor: "rgba(0,0,0,0.05)" }}
            whileTap={{ scale: 0.92, rotate: 8 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="w-9 h-9 flex items-center justify-center rounded-xl transition-colors shrink-0 cursor-pointer"
            aria-label="Open navigation menu"
          >
            <motion.span
              animate={
                open ? { rotate: 90, opacity: 0.7 } : { rotate: 0, opacity: 1 }
              }
              transition={{ duration: 0.22 }}
            >
              <Menu className="w-5 h-5 text-foreground" />
            </motion.span>
          </motion.button>
        </SheetTrigger>

        {/* ── SIDEBAR CONTENT ──────────────────────────────────────────────── */}
        <SheetContent
          side="left"
          className="w-72 p-0 flex flex-col overflow-hidden"
        >
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <SheetDescription className="sr-only">
            App navigation and search
          </SheetDescription>

          {/* Sidebar header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="p-5 border-b flex items-center gap-2.5 shrink-0"
          >
            <motion.div
              whileHover={{ scale: 1.1, rotate: [0, -6, 6, 0] }}
              transition={{ duration: 0.4 }}
              className="w-9 h-9 rounded-xl bg-linear-to-br from-primary to-violet-600 flex items-center justify-center shadow text-white font-bold text-sm cursor-pointer"
            >
              MK
            </motion.div>
            <div>
              <span className="font-bold text-[16px] block leading-none">
                Manish Ki Pathshala
              </span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Education Redefined
              </span>
            </div>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="px-4 py-1 border-b border-border/50 shrink-0"
          >
            <SearchBar onNavigate={() => setOpen(false)} />
          </motion.div>

          {/* Nav — custom thin scrollbar via inline style */}
          <nav
            className="flex-1 overflow-y-auto px-3 py-3 space-y-1"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "hsl(var(--border)) transparent",
            }}
          >
            {/* Webkit scrollbar via a style tag trick — scoped to this nav */}
            <style>{`
              nav::-webkit-scrollbar { width: 4px; }
              nav::-webkit-scrollbar-track { background: transparent; }
              nav::-webkit-scrollbar-thumb {
                background: hsl(var(--border));
                border-radius: 99px;
              }
              nav::-webkit-scrollbar-thumb:hover {
                background: hsl(var(--muted-foreground) / 0.5);
              }
            `}</style>

            {NAV_GROUPS.map((group, gi) => {
              // compute base stagger index for this group
              let baseIdx = 0;
              for (let i = 0; i < gi; i++)
                baseIdx += NAV_GROUPS[i].items.length;

              return (
                <div key={gi}>
                  {group.label && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: baseIdx * 0.045 + 0.1 }}
                      className="pt-4 pb-1.5 px-3"
                    >
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        {group.label}
                      </p>
                    </motion.div>
                  )}
                  {group.items.map((item, ii) => (
                    <motion.div
                      key={item.href}
                      custom={baseIdx + ii}
                      // variants={sidebarItemVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      <SidebarNavItem
                        {...item}
                        onClick={() => setOpen(false)}
                      />
                    </motion.div>
                  ))}
                </div>
              );
            })}
          </nav>

          {/* Sidebar footer */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="p-4 border-t shrink-0"
          >
            <ClientSignedIn>
              <Link href="/profile" onClick={() => setOpen(false)}>
                <motion.div
                  whileHover={{ x: 3, backgroundColor: "hsl(var(--muted))" }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ type: "spring", stiffness: 300, damping: 22 }}
                  className="flex items-center gap-3 rounded-xl p-1 transition-colors cursor-pointer"
                >
                  <Avatar className="w-9 h-9">
                    <AvatarImage src={user?.imageUrl} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {(user?.firstName?.[0] ?? "U").toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">
                      {user?.fullName ?? user?.firstName ?? "Learner"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      View Profile →
                    </p>
                  </div>
                </motion.div>
              </Link>
            </ClientSignedIn>
            <ClientSignedOut>
              <Link href="/sign-in" onClick={() => setOpen(false)}>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 380, damping: 20 }}
                  className="flex items-center justify-center gap-2 bg-primary text-white rounded-xl py-2.5 text-sm font-bold hover:bg-primary/90 transition-colors cursor-pointer"
                >
                  <LogIn className="w-4 h-4" /> Sign In / Sign Up
                </motion.div>
              </Link>
            </ClientSignedOut>
          </motion.div>
        </SheetContent>
      </Sheet>

      {/* ── LOGO ─────────────────────────────────────────────────────────────── */}
      <Link href="/" className="flex items-center gap-1.5 shrink-0 min-w-0">
        <motion.div
          whileHover={{ scale: 1.08, rotate: [0, -6, 6, -3, 0] }}
          whileTap={{ scale: 0.94 }}
          transition={{ duration: 0.45 }}
          className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center text-white font-bold text-xs shadow cursor-pointer"
        >
          MK
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
          className="leading-none min-w-0"
        >
          <p className="font-extrabold text-xs text-foreground tracking-tight truncate">
            Manish Ki Pathshala
          </p>
          <p className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">
            Education Redefined
          </p>
        </motion.div>
      </Link>

      {/* ── SEARCH BAR (desktop) ─────────────────────────────────────────────── */}
      <motion.div
        className="flex-1 min-w-0 hidden md:block"
        animate={searchFocused ? { scaleX: 1.01 } : { scaleX: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <div
          onFocusCapture={() => setSearchFocused(true)}
          onBlurCapture={() => setSearchFocused(false)}
        >
          <SearchBar />
        </div>
      </motion.div>

      {/* ── RIGHT ACTIONS ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Scroll indicator pill — shows when scrolled */}
        {/* <AnimatePresence>
          {scrolled && (
            <motion.div
              key="scroll-pill"
              initial={{ opacity: 0, scale: 0.7, width: 0 }}
              animate={{ opacity: 1, scale: 1, width: "auto" }}
              exit={{ opacity: 0, scale: 0.7, width: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 26 }}
              className="hidden sm:flex items-center gap-1 bg-primary/8 border border-primary/15 rounded-full px-2 py-0.5 overflow-hidden"
            >
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-1.5 h-1.5 rounded-full bg-primary inline-block"
              />
              <span className="text-[10px] font-semibold text-primary tracking-wide whitespace-nowrap">
                Pathshala
              </span>
            </motion.div>
          )}
        </AnimatePresence> */}

        {/* <Link href="/support">
          <motion.div
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="relative"
          >
            <Headphones className="w-[18px] h-[18px] text-foreground" />
            {supportUnread > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white px-0.5">
                {supportUnread > 9 ? "9+" : supportUnread}
              </span>
            )}
          </motion.div>
        </Link> */}

        <motion.div
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <NotificationsPanel />
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: "spring", stiffness: 380, damping: 20 }}
        >
          <AuthButton compact />
        </motion.div>
      </div>
    </motion.header>
  );
}
