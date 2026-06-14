"use client";

import React, { useEffect, useState } from "react";
import {
  FlaskConical,
  Home,
  Newspaper,
  RotateCcw,
  StickyNote,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { MobileNavItem } from "../layout/AppLayout";

const BOTTOM_NAV = [
  { href: "/", icon: Home, label: "HOME" },
  { href: "/daily-quiz", icon: FlaskConical, label: "QUIZZES" },
  { href: "/study-notes", icon: StickyNote, label: "NOTES" },
  { href: "/pyq", icon: RotateCcw, label: "PYQS" },
];

export default function MobileBottomBar() {
  const pathname = usePathname() ?? "";
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Always show near top
      if (currentScrollY < 50) {
        setVisible(true);
      }
      // Scrolling down
      else if (currentScrollY > lastScrollY) {
        setVisible(false);
      }
      // Scrolling up
      else {
        setVisible(true);
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <motion.nav
      initial={{ y: 0 }}
      animate={{
        y: visible ? 0 : 80,
        opacity: visible ? 1 : 0.95,
      }}
      transition={{
        duration: 0.25,
        ease: "easeOut",
      }}
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border/60 flex items-center h-16 z-50 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]"
    >
      {BOTTOM_NAV.slice(0, 2).map((item) => (
        <motion.div
          key={item.href}
          className="flex-1 flex justify-center"
          whileTap={{ scale: 0.9 }}
        >
          <MobileNavItem
            {...item}
            isActive={
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href))
            }
          />
        </motion.div>
      ))}

      <div className="flex-1 flex items-center justify-center">
        <Link
          href="/current-affairs"
          className="flex items-center justify-center"
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-violet-700 flex items-center justify-center shadow-lg shadow-primary/40 -mt-4 cursor-pointer"
          >
            <Newspaper className="w-5 h-5 text-white" />
          </motion.div>
        </Link>
      </div>

      {BOTTOM_NAV.slice(2).map((item) => (
        <motion.div
          key={item.href}
          className="flex-1 flex justify-center"
          whileTap={{ scale: 0.9 }}
        >
          <MobileNavItem
            {...item}
            isActive={
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href))
            }
          />
        </motion.div>
      ))}
    </motion.nav>
  );
}
