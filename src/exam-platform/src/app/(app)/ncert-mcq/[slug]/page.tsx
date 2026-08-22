import type { Metadata } from "next";
import { Suspense } from "react";
import { buildMetadata } from "@/lib/seo";
import { PlayerSkeleton } from "@/components/shared/PageSkeleton";
import NcertMcqPlayerWrapper from "@/components/shared/NcertMcqPlayerWrapper";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  return buildMetadata({
    title: `NCERT MCQ Practice — ${slug}`,
    description:
      "Practice chapter-wise NCERT MCQs on Manish Ki Pathshala. Subject-wise questions for Classes 6-12 covering Science, History, Geography, and more.",
    path: `/ncert-mcq/${slug}`,
    keywords: ["NCERT MCQs", slug, "class 6 to 12", "NCERT practice"],
  });
}

export default function NcertMcqPlayerPage() {
  return (
    <Suspense fallback={<PlayerSkeleton />}>
      <NcertMcqPlayerWrapper />
    </Suspense>
  );
}
