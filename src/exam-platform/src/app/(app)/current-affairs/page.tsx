import type { Metadata } from "next";
import { currentAffairsMetadata } from "@/lib/seo";
import CurrentAffairsListing from "@/views/CurrentAffairsListing";

export const metadata: Metadata = currentAffairsMetadata;

export default function CurrentAffairsPage() {
  return <CurrentAffairsListing />;
}
