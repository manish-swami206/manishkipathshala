import type { Metadata } from "next";
import { Suspense } from "react";
import MockTestDetail from "@/views/MockTestDetail";
import { fetchMockTest } from "@/lib/api/server";
import { buildMetadata } from "@/lib/seo";
import { QuizJsonLd } from "@/components/shared/JsonLd";
import { DetailSkeleton } from "@/components/shared/PageSkeleton";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://manishkipathshala.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const test = await fetchMockTest(id);

  if (!test) {
    return buildMetadata({
      title: "Mock Test Not Found",
      description: "This mock test could not be found.",
      path: `/mock-tests/${id}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: test.title,
    description:
      `${test.title} — ${test.questionCount} questions, ${test.durationMins} minutes, ${test.totalMarks} marks. Take this mock test on Manish Ki Pathshala.`,
    path: `/mock-tests/${id}`,
  });
}

export default async function MockTestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const test = await fetchMockTest(id);

  return (
    <>
      {test && (
        <QuizJsonLd
          title={test.title}
          description={test.description}
          questionCount={test.questionCount}
          durationMins={test.durationMins}
          url={`${BASE_URL}/mock-tests/${id}`}
        />
      )}
      <Suspense fallback={<DetailSkeleton />}>
        <MockTestDetail />
      </Suspense>
    </>
  );
}
