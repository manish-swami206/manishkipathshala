import type { Metadata } from "next";
import { Suspense } from "react";
import DailyQuizInstructions from "@/views/DailyQuizInstructions";
import { fetchQuiz } from "@/lib/api/server";
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
  const quiz = await fetchQuiz(id);

  if (!quiz) {
    return buildMetadata({
      title: "Quiz Not Found",
      description: "This quiz could not be found.",
      path: `/daily-quiz/${id}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: quiz.title,
    description:
      `${quiz.title} — ${quiz.questionCount} questions, ${quiz.durationMins} minutes. Take this daily free quiz on Manish Ki Pathshala to sharpen your exam preparation.`,
    path: `/daily-quiz/${id}`,
  });
}

export default async function DailyQuizInstructionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quiz = await fetchQuiz(id);

  return (
    <>
      {quiz && (
        <QuizJsonLd
          title={quiz.title}
          description={quiz.instructions}
          questionCount={quiz.questionCount}
          durationMins={quiz.durationMins}
          url={`${BASE_URL}/daily-quiz/${id}`}
        />
      )}
      <Suspense fallback={<DetailSkeleton />}>
        <DailyQuizInstructions />
      </Suspense>
    </>
  );
}
