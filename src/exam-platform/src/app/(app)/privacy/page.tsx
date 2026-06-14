import type { Metadata } from "next";
import { privacyMetadata } from "@/lib/seo";
import Privacy from "@/views/Privacy";

export const metadata: Metadata = privacyMetadata;

export default function PrivacyPage() {
  return <Privacy />;
}
