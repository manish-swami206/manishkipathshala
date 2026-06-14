"use client";

import React from "react";
import { StaticPageLayout, SectionHeading, SectionText, BulletList } from "@/components/shared/StaticPageLayout";

export default function Terms() {
  return (
    <StaticPageLayout title="Terms & Conditions" heading="Terms & Conditions">

      <p className="text-xs text-muted-foreground font-semibold">
        Last Updated : April, 2026
      </p>

      <SectionText>
        Welcome to Manish Ki Pathshala! By accessing or using our platform, you agree to be bound by the following terms and conditions. Please read them carefully.
      </SectionText>

      <SectionHeading>1. Acceptance of Terms</SectionHeading>
      <SectionText>
        By accessing this platform you accept these terms and conditions in full. Do not continue to use Manish Ki Pathshala if you do not agree to all the terms stated on this page.
      </SectionText>

      <SectionHeading>2. License to Use</SectionHeading>
      <SectionText>
        Unless otherwise stated, Manish Ki Pathshala owns the intellectual property rights for all material on this platform. All rights are reserved. You may access content for your own personal, non-commercial use. You must not:
      </SectionText>
      <BulletList items={[
        "Republish, sell, rent, or sub-license material from this platform.",
        "Reproduce, duplicate, or copy material for commercial purposes.",
        "Redistribute content without written permission.",
        "Use the platform to spam or harass others.",
      ]} />

      <SectionHeading>3. User Accounts</SectionHeading>
      <SectionText>
        You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Notify us immediately of any unauthorized use.
      </SectionText>

      <SectionHeading>4. Content Accuracy</SectionHeading>
      <SectionText>
        While we strive to provide accurate and up-to-date educational content, Manish Ki Pathshala makes no warranties regarding the completeness or accuracy of any material. Content is provided for educational purposes only.
      </SectionText>

      <SectionHeading>5. Limitation of Liability</SectionHeading>
      <SectionText>
        Manish Ki Pathshala shall not be held liable for any indirect, incidental, or consequential damages arising from your use of the platform or inability to access it.
      </SectionText>

      <SectionHeading>6. Changes to Terms</SectionHeading>
      <SectionText>
        We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the new terms.
      </SectionText>

    </StaticPageLayout>
  );
}
