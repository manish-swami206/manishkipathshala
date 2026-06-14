import type { Metadata } from "next";
import {
  contact_gmail,
  contact_number,
  contact_address,
} from "@/lib/data";

/**
 * Centralized SEO metadata factory for Manish Ki Pathshala.
 * All frontend pages should import these helpers for consistent SEO.
 */

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://manishkipathshala.com";

const SITE_NAME = "Manish Ki Pathshala";
const TAGLINE = "Premium Exam Preparation Platform for UPSC, SSC, RAS & More";

export const defaultDescription =
  "Manish Ki Pathshala is India's premier online exam preparation platform offering daily quizzes, current affairs, study notes, PYQs, NCERT MCQs, mock tests, and syllabus guides for UPSC, SSC, RAS, RRB, Banking, and State PCS exams.";
export const defaultKeywords = [
  "UPSC preparation",
  "SSC CGL coaching",
  "RAS exam preparation",
  "RRB NTPC study material",
  "competitive exams India",
  "online quiz platform",
  "daily current affairs",
  "NCERT MCQs practice",
  "previous year questions",
  "mock tests online",
  "study notes for exams",
  "Manish Ki Pathshala",
  "India education platform",
  "free online exam preparation",
  "हिंदी में पढ़ाई",
  "government exam preparation",
];

interface SeoProps {
  title: string;
  description?: string;
  keywords?: string[];
  path?: string;
  ogImage?: string;
  noIndex?: boolean;
}

export function buildMetadata({
  title,
  description = defaultDescription,
  keywords = defaultKeywords,
  path = "",
  ogImage = `${BASE_URL}/og-image.png`,
  noIndex = false,
}: SeoProps): Metadata {
  const fullTitle = `${title} | ${SITE_NAME}`;
  const url = `${BASE_URL}${path}`;

  return {
    title: fullTitle,
    description,
    keywords: keywords.join(", "),
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      locale: "en_IN",
      type: "website",
      images: [{ url: ogImage, width: 1200, height: 630, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [ogImage],
    },
    alternates: { canonical: url },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
    other: {
      "geo.region": "IN-RJ",
      "geo.placename": "Shri Ganga Nagar, Rajasthan",
      "contact:email": contact_gmail,
      "contact:phone": contact_number,
      "contact:address": contact_address,
    },
  };
}

/** Homepage */
export const homeMetadata = buildMetadata({
  title: "Home",
  description: defaultDescription,
  path: "/",
});

/** Daily Quiz listing */
export const dailyQuizMetadata = buildMetadata({
  title: "Daily Quizzes",
  description: "Take daily free quizzes to sharpen your competitive exam preparation. Practice MCQs on current affairs, GK, and subject-wise topics.",
  path: "/daily-quiz",
  keywords: [...defaultKeywords, "daily quiz", "free online quiz", "GK quiz", "MCQ practice"],
});

/** Current Affairs */
export const currentAffairsMetadata = buildMetadata({
  title: "Current Affairs",
  description: "Stay updated with daily current affairs for UPSC, SSC, RAS, and other competitive exams. Expert-curated news summaries in English and Hindi.",
  path: "/current-affairs",
  keywords: [...defaultKeywords, "daily current affairs", "today current affairs", "news analysis", "current affairs 2026"],
});

/** Study Notes */
export const studyNotesMetadata = buildMetadata({
  title: "Study Notes",
  description: "Access premium study notes for competitive exams. Subject-wise notes covering History, Geography, Polity, Economy, and more.",
  path: "/study-notes",
  keywords: [...defaultKeywords, "study notes", "exam notes", "handwritten notes", "subject wise notes"],
});

/** PYQ */
export const pyqMetadata = buildMetadata({
  title: "Previous Year Questions",
  description: "Practice previous year questions (PYQs) from UPSC, SSC, RAS, and other exams with detailed explanations and answer keys.",
  path: "/pyq",
});

/** PYP */
export const pypMetadata = buildMetadata({
  title: "Previous Year Papers",
  description: "Download previous year question papers (PYPs) with answer keys for UPSC, SSC, JEE, NEET, and board exams.",
  path: "/pyp",
});

/** NCERT MCQs */
export const ncertMcqMetadata = buildMetadata({
  title: "NCERT MCQ Practice",
  description: "Practice chapter-wise NCERT MCQs for Classes 6-12. Subject-wise questions for Science, History, Geography, Polity, and more.",
  path: "/ncert-mcq",
  keywords: [...defaultKeywords, "NCERT MCQs", "NCERT questions", "class 6 to 12 MCQs", "NCERT based questions"],
});

/** NCERT Books */
export const ncertBooksMetadata = buildMetadata({
  title: "NCERT Books",
  description: "Free access to NCERT textbooks for Classes 6-12. Download PDFs for all subjects including Science, Maths, History, Geography, and more.",
  path: "/ncert-books",
  keywords: [...defaultKeywords, "NCERT books", "NCERT PDF", "class 6 to 12 books", "free NCERT textbooks"],
});

/** Mock Tests */
export const mockTestsMetadata = buildMetadata({
  title: "Mock Tests",
  description: "Take full-length mock tests designed to simulate real exam conditions for UPSC, SSC, RAS, and other competitive exams.",
  path: "/mock-tests",
  keywords: [...defaultKeywords, "mock tests", "full length test", "online test series", "exam simulation"],
});

/** Syllabus */
export const syllabusMetadata = buildMetadata({
  title: "Syllabus",
  description: "Complete syllabus guide for UPSC, SSC, RAS, RRB, Banking, and other government exams. Updated exam patterns and subject-wise syllabi.",
  path: "/syllabus",
  keywords: [...defaultKeywords, "exam syllabus", "UPSC syllabus", "SSC syllabus", "RAS syllabus", "exam pattern"],
});

/** Leaderboard */
export const leaderboardMetadata = buildMetadata({
  title: "Leaderboard",
  description: "Check the top performers on Manish Ki Pathshala. See rankings based on quiz scores, mock test performance, and streak points.",
  path: "/leaderboard",
});

/** Support */
export const supportMetadata = buildMetadata({
  title: "Support",
  description: "Get help and support for your exam preparation. Contact our team or browse FAQs for Manish Ki Pathshala.",
  path: "/support",
});

/** About */
export const aboutMetadata = buildMetadata({
  title: "About Us",
  description: "Learn about Manish Ki Pathshala - India's premier online exam preparation platform. Our mission, vision, and commitment to quality education.",
  path: "/about",
});

/** Contact */
export const contactMetadata = buildMetadata({
  title: "Contact Us",
  description: `Contact Manish Ki Pathshala at ${contact_gmail} or ${contact_number}. Located in Shri Ganga Nagar, Rajasthan. We're here to help!`,
  path: "/contact",
});

/** Privacy */
export const privacyMetadata = buildMetadata({
  title: "Privacy Policy",
  description: "Read the privacy policy of Manish Ki Pathshala. Learn how we collect, use, and protect your personal information.",
  path: "/privacy",
});

/** Terms */
export const termsMetadata = buildMetadata({
  title: "Terms & Conditions",
  description: "Read the terms and conditions for using Manish Ki Pathshala platform. Understand your rights and responsibilities as a user.",
  path: "/terms",
});

/** Profile */
export const profileMetadata = buildMetadata({
  title: "My Profile",
  description: "View and manage your Manish Ki Pathshala profile. Track your progress, streaks, quiz scores, and mock test performance.",
  path: "/profile",
});
