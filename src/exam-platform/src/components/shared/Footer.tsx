"use client";
import React from "react";
import { MessageCircle, Send, Youtube, Instagram, Twitter } from "lucide-react";
import Link from "next/link";
import {
  telegram_link,
  youtube_link,
  instagram_link,
  x_link,
  whatsapp_link,
} from "@/lib/data";

const SOCIALS = [
  { key: "telegram", href: telegram_link, title: "Telegram", icon: Send, color: "text-sky-500", bg: "hover:bg-sky-50" },
  { key: "whatsapp", href: whatsapp_link, title: "WhatsApp", icon: MessageCircle, color: "text-green-500", bg: "hover:bg-green-50" },
  { key: "youtube", href: youtube_link, title: "YouTube", icon: Youtube, color: "text-red-500", bg: "hover:bg-red-50" },
  { key: "instagram", href: instagram_link, title: "Instagram", icon: Instagram, color: "text-pink-500", bg: "hover:bg-pink-50" },
  { key: "x", href: x_link, title: "X (Twitter)", icon: Twitter, color: "text-slate-800", bg: "hover:bg-slate-100" },
];

const resources = [
  { label: "Quiz", href: "/daily-quiz" },
  { label: "Study Notes", href: "/study-notes" },
  { label: "PYQ", href: "/pyq" },
  { label: "Syllabus", href: "/syllabus" },
  { label: "NCERT Books", href: "/ncert-books" },
];

const companyLinks = [
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

export default function Footer() {
  return (
    <footer className="mt-4 bg-white w-full">
      <div className="p-5">
        {/* Brand */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shrink-0">
            <span className="text-white font-extrabold text-xs">MK</span>
          </div>
          <span className="font-extrabold text-base text-foreground">Manish Ki Pathshala</span>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground leading-relaxed mb-4 max-w-[220px]">
          A premium learning platform dedicated to providing the best study materials and tools for competitive exam aspirants.
        </p>

        {/* Social Icons */}
        <div className="flex flex-wrap items-center gap-2.5 mb-6">
          {SOCIALS.filter((s) => !!s.href).map(({ key, href, title, icon: Icon, color, bg }) => (
            <a
              key={key}
              href={href!}
              target="_blank"
              rel="noopener noreferrer"
              title={title}
              className={`w-9 h-9 rounded-xl border border-border flex items-center justify-center ${color} ${bg} transition-colors hover:scale-105`}
            >
              <Icon className="w-4 h-4" />
            </a>
          ))}
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-0 mb-6">
          <div>
            <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mb-2.5">RESOURCES</p>
            <div className="space-y-2">
              {resources.map((item) => (
                <Link key={item.href} href={item.href} className="flex items-center gap-1.5 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
                  <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-widest mb-2.5">COMPANY</p>
            <div className="flex flex-col space-y-2">
              {companyLinks.map((item) => (
                <Link key={item.href} href={item.href} className="text-xs text-muted-foreground hover:text-primary transition-colors">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border/50 mb-3" />

        {/* Copyright */}
        <p className="text-center text-[10px] text-muted-foreground">
          © 2026 MANISH KI PATHSHALA •{" "}
          <Link href="https://my-portfolio-nine-eta-bo1n0vx4mt.vercel.app/" className="text-violet-600 font-semibold">
            DESIGNED BY ❤️ Gaurav Dadhich
          </Link>
        </p>
      </div>
    </footer>
  );
}
