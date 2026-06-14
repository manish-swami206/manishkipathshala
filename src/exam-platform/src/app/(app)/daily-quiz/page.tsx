import type { Metadata } from "next";
import { dailyQuizMetadata } from "@/lib/seo";
import DailyQuizListing from "@/views/DailyQuizListing";

export const metadata: Metadata = dailyQuizMetadata;

export default function DailyQuizListingPage() {
  return <DailyQuizListing />;
}
