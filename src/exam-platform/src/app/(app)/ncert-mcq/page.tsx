import type { Metadata } from "next";
import { ncertMcqMetadata } from "@/lib/seo";
import NcertMcqSets from "@/views/NcertMcqSets";

export const metadata: Metadata = ncertMcqMetadata;

export default function NcertMcqPage() {
  return <NcertMcqSets />;
}
