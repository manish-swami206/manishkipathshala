"use client";

import React from "react";
import Link from "next/link";
import { PageTransition } from "@/components/shared/PageTransition";
import {
  Zap,
  Newspaper,
  BookOpen,
  FlaskConical,
  RotateCcw,
  FileText,
  Headphones,
  List,
  Cpu,
  BookMarked,
  Bot,
  Play,
  GraduationCap,
  CheckCircle2,
  Users,
  Shield,
  RefreshCw,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import Whatsapp from "@/components/shared/Whatsapp";
import AnnouncementBanner from "@/components/shared/AnnouncementBanner";
import SearchBar from "@/components/shared/SearchBar";

// ─── Types ────────────────────────────────────────────────────────────────────
type Feature = {
  label: string;
  sublabel: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  href: string;
  isNew?: boolean;
};

// ─── Static Data ──────────────────────────────────────────────────────────────
const FEATURES: Feature[] = [
  {
    label: "Daily Free Quiz",
    sublabel: "OPEN NOW",
    icon: Zap,
    iconBg: "bg-teal-100",
    iconColor: "text-teal-600",
    href: "/daily-quiz",
  },
  {
    label: "Daily Current Affairs",
    sublabel: "OPEN NOW",
    icon: Newspaper,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    href: "/current-affairs",
  },
  {
    label: "Study Notes",
    sublabel: "OPEN NOW",
    icon: BookOpen,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    href: "/study-notes",
  },
  {
    label: "Mock Tests",
    sublabel: "OPEN NOW",
    icon: FlaskConical,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
    href: "/mock-tests",
  },
  {
    label: "PYQ's",
    sublabel: "OPEN NOW",
    icon: RotateCcw,
    iconBg: "bg-pink-100",
    iconColor: "text-pink-600",
    href: "/pyq",
  },
  {
    label: "PYP's",
    sublabel: "OPEN NOW",
    icon: FileText,
    iconBg: "bg-sky-100",
    iconColor: "text-sky-600",
    href: "/pyp",
  },
  {
    label: "Syllabus",
    sublabel: "OPEN NOW",
    icon: List,
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    href: "/syllabus",
  },
  {
    label: "NCERT MCQ's",
    sublabel: "OPEN NOW",
    icon: Cpu,
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
    href: "/ncert-mcq",
  },
  {
    label: "NCERT Books",
    sublabel: "OPEN NOW",
    icon: BookMarked,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    href: "/ncert-books",
  },
  {
    label: "Support",
    sublabel: "OPEN NOW",
    icon: Headphones,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    href: "/support",
  },
];

// Features list for "वेबसाइट के बेहतरीन फीचर्स" section (list style from image 2)
const FEATURES_LIST_HINDI = [
  {
    label: "Daily Free Quiz",
    desc: "रोज़ाना नए सवालों के साथ अपनी याददाश्त और ज्ञान को परखें।",
    icon: Zap,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-500",
  },
  {
    label: "Current Affairs",
    desc: "देश-दुनिया की ताज़ा खबरें जो परीक्षाओं के नज़रिए से महत्वपूर्ण हैं।",
    icon: Newspaper,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-500",
  },
  {
    label: "Study Notes",
    desc: "विषय-वार सरल भाषा में लिखे गए प्रीमियम क्वालिटी नोट्स।",
    icon: BookOpen,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    label: "Mock Tests",
    desc: "बिल्कुल परीक्षा जैसे माहौल में खुद को जांचें फुल-लेंथ पेपर्स के साथ।",
    icon: FlaskConical,
    iconBg: "bg-violet-100",
    iconColor: "text-violet-600",
  },
  {
    label: "PYQ's",
    desc: "पुराने वर्षों के प्रश्नों का विशाल संग्रह, उनके सटीक उत्तरों के साथ।",
    icon: RotateCcw,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    label: "PYP's",
    desc: "पुराने वर्षों के प्रश्न-पत्र का विशाल संग्रह, उनकी सटीक उत्तरकुंजी के साथ।",
    icon: FileText,
    iconBg: "bg-red-100",
    iconColor: "text-red-500",
  },
  {
    label: "Syllabus Guide",
    desc: "लेटेस्ट सरकारी भर्तियों का अपडेटेड और विस्तृत सिलेबस।",
    icon: List,
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
  },
  {
    label: "NCERT Books",
    desc: "कक्षा 6 से 12 तक की सभी ज़रूरी किताबों का फ्री एक्सेस।",
    icon: BookMarked,
    iconBg: "bg-teal-100",
    iconColor: "text-teal-600",
  },
  {
    label: "NCERT MCQs",
    desc: "NCERT पर आधारित बहुविकल्पीय प्रश्न विषय के गहराई से अभ्यास के लिए।",
    icon: CheckCircle2,
    iconBg: "bg-indigo-100",
    iconColor: "text-indigo-600",
  },
  {
    label: "Support",
    desc: "अपनी किसी भी समस्या का तुरंत समाधान पाएं हमारी सहायता से।",
    icon: Headphones,
    iconBg: "bg-gray-100",
    iconColor: "text-gray-700",
  },
];

// "किसके लिए उपयोगी है?" targets
const EXAM_TARGETS = [
  "RAS, SI, EO/RO & PCS Exams",
  "CTET, REET & All Teaching Exams",
  "Patwar, VDO, Police & Other Exams",
  "SSC, Banking & Railway Preparation",
  "School Students (NCERT Foundation)",
];

// "हमें क्यों चुनें?" reasons
const WHY_US = [
  {
    icon: Shield,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-500",
    text: "Clean UI: बहुत ही सरल और तेज़ इंटरफ़ेस ताकि आप कम समय में ज़्यादा सीखें।",
  },
  {
    icon: RefreshCw,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-500",
    text: "Regular Updates: रोज़ाना नया कंटेंट ताकि आप दुनिया से पीछे न रहें।",
  },
  {
    icon: Users,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    text: "Expert Guidance: सर्वश्रेष्ठ शिक्षकों द्वारा तैयार की गई अध्ययन सामग्री जो आपकी सफलता सुनिश्चित करती है।",
  },
  {
    icon: Target,
    iconBg: "bg-red-100",
    iconColor: "text-red-500",
    text: "Focused Preparation: परीक्षा के पैटर्न के अनुसार सटीक मार्गदर्शन ताकि आपका समय व्यर्थ न हो।",
  },
];

// ─── AnnouncementBanner ────────────────────────────────────────────────────────

// ─── FeatureCard ───────────────────────────────────────────────────────────────
function FeatureCard({
  label,
  sublabel,
  icon: Icon,
  iconBg,
  iconColor,
  href,
  isNew,
}: Feature) {
  return (
    <Link href={href}>
      <div className="bg-white rounded-2xl border border-border/50 shadow-sm p-3 flex flex-col items-center text-center gap-2 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 active:scale-95 min-h-[110px] justify-center">
        <div
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center relative",
            iconBg,
          )}
        >
          <Icon className={cn("w-6 h-6", iconColor)} />
          {isNew && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white" />
          )}
        </div>
        <div className="space-y-0.5">
          <p className="text-[11px] font-bold text-foreground leading-snug">
            {label}
          </p>
          <p className="text-[9px] font-semibold text-red-500 uppercase tracking-wide flex items-center justify-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
            {sublabel}
          </p>
        </div>
      </div>
    </Link>
  );
}

// ─── Home Page ─────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <PageTransition className="min-h-screen bg-gray-50 pb-8">
      {/* SEARCH BAR - added on client request */}
      <div className="md:hidden block px-4 pt-4">
        <SearchBar />
      </div>

      {/* ── Announcement Banner ── */}
      <AnnouncementBanner />

      {/* ── Welcome Banner ── */}
      <div className="p-4 pt-3">
        <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-violet-700 to-purple-600 p-5 text-white shadow-lg">
          <div className="absolute right-0 top-0 w-40 h-40 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/3" />
          <div className="absolute right-8 bottom-0 w-24 h-24 rounded-full bg-white/5 translate-y-1/2" />
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="space-y-1.5">
              <h1 className="text-xl font-extrabold leading-tight">
                Welcome, <span className="text-yellow-300">Learner!</span>
              </h1>
              <p className="text-sm text-purple-100 leading-snug max-w-[200px]">
                Master your exams with expert notes, daily quizzes and AI
                strategy.
              </p>
            </div>
            <Link href="/daily-quiz">
              <Button
                size="sm"
                className="bg-white text-primary hover:bg-gray-100 font-bold rounded-xl shrink-0 shadow-md shadow-black/10 gap-1.5 px-4 h-10"
              >
                <Play className="w-3.5 h-3.5 fill-primary" />
                START QUIZ
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Feature Grid ── */}
      <div className="px-4 pb-2">
        <div className="grid grid-cols-3 gap-3">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.href} {...feature} />
          ))}
        </div>
      </div>

      {/* ── About / Hindi Hero Section ── */}
      <div className="mx-4 mt-4 rounded-2xl bg-white border border-border/50 shadow-sm overflow-hidden">
        <div className="p-6 text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-red-200">
            <GraduationCap className="w-3 h-3" /> Best Learning Platform
          </div>
          <h2 className="text-2xl font-extrabold leading-tight">
            <span className="text-red-600">मनीष की पाठशाला</span>
            <span className="text-foreground">
              {" "}
              में आपका स्वागत है – गुणवत्तापूर्ण शिक्षा हेतु समर्पित
            </span>
          </h2>
          <p className="text-sm font-bold text-foreground">
            A Great Place For Learn And Grow.
          </p>
        </div>
      </div>

      {/* ── वेबसाइट के बेहतरीन फीचर्स (list style) ── */}
      <div className="mx-4 mt-4 rounded-2xl bg-white border border-border/50 shadow-sm overflow-hidden">
        {/* Section header */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-border/40">
          <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <h3 className="font-extrabold text-base text-foreground">
            वेबसाइट के बेहतरीन फीचर्स
          </h3>
        </div>

        {/* Feature rows */}
        <div className="divide-y divide-border/40">
          {FEATURES_LIST_HINDI.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="flex items-start gap-3 px-4 py-3.5">
                <div
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                    f.iconBg,
                  )}
                >
                  <Icon className={cn("w-5 h-5", f.iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground leading-snug">
                    {f.label}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                    {f.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── किसके लिए उपयोगी है? ── */}
      <div className="mx-4 mt-4 rounded-2xl bg-[#4B3FE4] overflow-hidden shadow-lg">
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-white" />
            <h3 className="text-lg font-extrabold text-white">
              किसके लिए उपयोगी है?
            </h3>
          </div>
          <div className="space-y-2.5">
            {EXAM_TARGETS.map((target, i) => (
              <div
                key={i}
                className="bg-white/10 rounded-xl px-4 py-3 flex items-center gap-2.5"
              >
                <span className="w-2 h-2 rounded-full bg-white shrink-0" />
                <span className="text-sm font-semibold text-white">
                  {target}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── हमें क्यों चुनें? ── */}
      <div className="mx-4 mt-4 rounded-2xl bg-white border border-border/50 shadow-sm overflow-hidden">
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-emerald-500" />
            <h3 className="text-lg font-extrabold text-foreground">
              हमें क्यों चुनें?
            </h3>
          </div>
          <div className="space-y-4">
            {WHY_US.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className={cn(
                      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                      item.iconBg,
                    )}
                  >
                    <Icon className={cn("w-4 h-4", item.iconColor)} />
                  </div>
                  <p className="text-sm text-foreground leading-relaxed flex-1">
                    {item.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Quote / CTA banner ── */}
      <div className="mx-4 mt-4 rounded-2xl border border-dashed border-border bg-white shadow-sm px-6 py-5 text-center">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
          START YOUR JOURNEY
        </p>
        <p className="text-base font-bold text-foreground">
          "कल की जीत के लिए आज का अभ्यास ज़रूरी है।"
        </p>
      </div>

      {/* ── Footer ── */}

      {/* ── WhatsApp FAB ── */}
      <Whatsapp />
    </PageTransition>
  );
}
