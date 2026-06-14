import type { Metadata } from "next";
import { supportMetadata } from "@/lib/seo";
import Support from "@/views/Support";

export const metadata: Metadata = supportMetadata;

export default function SupportPage() {
  return <Support />;
}
