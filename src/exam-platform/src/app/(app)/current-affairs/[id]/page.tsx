import type { Metadata } from "next";
import { Suspense } from "react";
import CurrentAffairDetail from "@/views/CurrentAffairDetail";
import { fetchCurrentAffair } from "@/lib/api/server";
import { buildMetadata } from "@/lib/seo";
import { ArticleJsonLd } from "@/components/shared/JsonLd";
import { DetailSkeleton } from "@/components/shared/PageSkeleton";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://manishkipathshala.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const article = await fetchCurrentAffair(id);

  if (!article) {
    return buildMetadata({
      title: "Article Not Found",
      description: "This current affairs article could not be found.",
      path: `/current-affairs/${id}`,
      noIndex: true,
    });
  }

  return buildMetadata({
    title: article.title,
    description:
      article.summary || `${article.title} — Daily current affairs on Manish Ki Pathshala for UPSC, SSC, RAS exam preparation.`,
    path: `/current-affairs/${article.slug || id}`,
    keywords: ["current affairs", article.category, "UPSC", "SSC", "RAS", "Manish Ki Pathshala"],
  });
}

export default async function CurrentAffairDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const article = await fetchCurrentAffair(id);

  return (
    <>
      {article && (
        <ArticleJsonLd
          title={article.title}
          summary={article.summary}
          category={article.category}
          url={`${BASE_URL}/current-affairs/${article.slug || id}`}
          publishedAt={article.publishedAt}
        />
      )}
      <Suspense fallback={<DetailSkeleton />}>
        <CurrentAffairDetail />
      </Suspense>
    </>
  );
}
