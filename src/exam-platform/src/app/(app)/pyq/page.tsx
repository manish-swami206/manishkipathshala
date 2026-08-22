import type { Metadata } from "next";
import { pyqMetadata } from "@/lib/seo";
import PyqPage from "@/views/PyqPage";

export const metadata: Metadata = pyqMetadata;

export default function PyqSubjectsPage() {
  return <PyqPage />;
}
