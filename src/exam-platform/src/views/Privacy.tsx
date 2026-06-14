"use client";

import React from "react";
import {
  StaticPageLayout,
  SectionHeading,
  SectionText,
  BulletList,
} from "@/components/shared/StaticPageLayout";
import { contact_gmail } from "@/lib/data";

export default function Privacy() {
  return (
    <StaticPageLayout title="Privacy" heading="Privacy Policy">
      <p className="text-xs text-muted-foreground font-semibold">
        Last Updated : April, 2026
      </p>

      <SectionText>
        Manish Ki Pathshala ("we," "our," or "us") is committed to protecting
        your privacy. This Privacy Policy explains how we collect, use, and
        safeguard your information.
      </SectionText>

      <SectionHeading>1. Information We Collect</SectionHeading>
      <SectionText>
        We collect information that you provide directly to us when you create
        an account, such as your name, email address, and exam preferences.
      </SectionText>

      <SectionHeading>2. How We Use Your Information</SectionHeading>
      <BulletList
        items={[
          "To provide and maintain our services.",
          "To personalize your learning experience.",
          "To notify you about updates and new content.",
          "To analyze usage patterns and improve our platform.",
        ]}
      />

      <SectionHeading>3. Data Security</SectionHeading>
      <SectionText>
        We implement a variety of security measures to maintain the safety of
        your personal information when you enter, submit, or access your
        personal information.
      </SectionText>

      <SectionHeading>4. Cookies</SectionHeading>
      <SectionText>
        We use cookies to enhance your experience, gather general visitor
        information, and track visits to our platform. You can choose to disable
        cookies through your browser settings.
      </SectionText>

      <SectionHeading>5. Contact Us</SectionHeading>
      <SectionText>
        If you have any questions about this Privacy Policy, please contact us
        at{" "}
        <a
          href="mailto:privacy@manishkipathshala.com"
          className="text-primary font-semibold hover:underline"
        >
          {contact_gmail}
        </a>
        .
      </SectionText>
    </StaticPageLayout>
  );
}
