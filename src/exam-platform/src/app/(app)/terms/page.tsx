import type { Metadata } from "next";
import { termsMetadata } from "@/lib/seo";
import Terms from "@/views/Terms";

export const metadata: Metadata = termsMetadata;

export default function TermsPage() {
  return <Terms />;
}
