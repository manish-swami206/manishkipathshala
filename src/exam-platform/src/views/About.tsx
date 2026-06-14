"use client";

import React from "react";
import { StaticPageLayout, SectionHeading, SectionText } from "@/components/shared/StaticPageLayout";

export default function About() {
  return (
    <StaticPageLayout title="About Us" heading="About Us">

      {/* Welcome intro */}
      <p className="text-sm leading-relaxed text-[#374151]">
        Welcome to{" "}
        <span className="text-primary font-bold">Manish Ki Pathshala</span>
        , your premier destination for high-quality educational resources and exam preparation in Rajasthan and across India.
      </p>

      {/* Mission blockquote */}
      <div className="border-l-4 border-primary bg-primary/5 rounded-r-xl px-4 py-3 my-2">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Our Mission</p>
        <p className="text-sm italic text-foreground leading-relaxed">
          "Empowering the next generation of civil servants and professionals through accessible, affordable, and expert-led education."
        </p>
      </div>

      {/* Who We Are */}
      <SectionHeading>Who We Are</SectionHeading>
      <SectionText>
        Founded by Manish Swami, an educator passionate about transforming the way students prepare
        for competitive exams, Manish Ki Pathshala started as a small initiative to provide quality
        guidance for RAS and RPSC exams. Today, we have grown into a comprehensive learning
        platform serving thousands of aspirants.
      </SectionText>

      {/* What We Offer */}
      <SectionHeading>What We Offer</SectionHeading>
      <div className="grid grid-cols-2 gap-2.5 mt-1">
        {[
          { n: 1, label: "Daily Current Affairs" },
          { n: 2, label: "Exam-Specific Study Notes" },
          { n: 3, label: "Previous Year Questions (PYQs)" },
          { n: 4, label: "Interactive Quizzes & Mock Tests" },
        ].map(({ n, label }) => (
          <div key={n} className="flex items-center gap-2.5 bg-gray-50 border border-border/50 rounded-xl px-3 py-2.5">
            <span className="w-6 h-6 rounded-lg bg-primary text-white text-xs font-extrabold flex items-center justify-center shrink-0">{n}</span>
            <span className="text-xs font-semibold text-foreground leading-snug">{label}</span>
          </div>
        ))}
      </div>

    </StaticPageLayout>
  );
}
