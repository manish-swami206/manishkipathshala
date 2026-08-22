import type { Metadata } from "next";
import { pypMetadata } from "@/lib/seo";
import PypPage from "@/views/PypPage";

export const metadata: Metadata = pypMetadata;

export default function PypSubjectsPage() {
  return <PypPage />;
}
