import type { Metadata } from "next";
import { mockTestsMetadata } from "@/lib/seo";
import MockTests from "@/views/MockTests";

export const metadata: Metadata = mockTestsMetadata;

export default function MockTestsPage() {
  return <MockTests />;
}
