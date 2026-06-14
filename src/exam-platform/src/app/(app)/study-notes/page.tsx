import type { Metadata } from "next";
import { studyNotesMetadata } from "@/lib/seo";
import StudyNotes from "@/views/StudyNotes";

export const metadata: Metadata = studyNotesMetadata;

export default function StudyNotesPage() {
  return <StudyNotes />;
}
