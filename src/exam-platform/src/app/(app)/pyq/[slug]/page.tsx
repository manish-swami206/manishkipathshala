import type { Metadata } from "next";
import { Suspense } from "react";
import PyqQuestions from "@/views/PyqQuestions";
import { buildMetadata } from "@/lib/seo";
import { PlayerSkeleton } from "@/components/shared/PageSkeleton";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  return buildMetadata({
    title: `PYQ Practice — ${slug}`,
    description:
      "Practice previous year questions (PYQs) on Manish Ki Pathshala. Solved papers with detailed explanations for UPSC, SSC, RAS and more.",
    path: `/pyq/${slug}`,
    keywords: ["PYQ", "previous year questions", slug, "UPSC", "SSC", "RAS"],
  });
}

export default function PyqQuestionsPage() {
  return (
    <Suspense fallback={<PlayerSkeleton />}>
      <PyqQuestions />
    </Suspense>
  );
}
