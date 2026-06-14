import type { Metadata } from "next";
import { syllabusMetadata } from "@/lib/seo";
import Syllabus from "@/views/Syllabus";

export const metadata: Metadata = syllabusMetadata;

export default function SyllabusPage() {
  return <Syllabus />;
}
