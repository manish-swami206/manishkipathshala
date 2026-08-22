/**
 * JSON-LD Structured Data Components for SEO.
 * Renders <script type="application/ld+json"> tags for Google rich results.
 */

const SITE_NAME = "Manish Ki Pathshala";
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://manishkipathshala.com";

interface JsonLdProps {
  data: Record<string, unknown>;
}

/** Generic JSON-LD wrapper */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** Organization schema — use on homepage and about page */
export function OrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        name: SITE_NAME,
        url: BASE_URL,
        logo: `${BASE_URL}/favicon.svg`,
        description:
          "India's premier online exam preparation platform for UPSC, SSC, RAS, RRB, Banking, and State PCS exams.",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Sri Ganganagar",
          addressRegion: "Rajasthan",
          addressCountry: "IN",
          postalCode: "335001",
        },
        contactPoint: {
          "@type": "ContactPoint",
          telephone: "+91-7023464080",
          contactType: "customer service",
          email: "Manishkipathshalaofficial@gmail.com",
        },
        sameAs: [
          "https://youtube.com/@manish_ki_pathshala",
          "https://www.instagram.com/manish_ki_pathshala",
          "https://x.com/MK_Pathshala",
          "https://t.me/ManishKiPathshala",
        ],
      }}
    />
  );
}

/** WebSite schema with SearchAction — use on homepage */
export function WebSiteJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: SITE_NAME,
        url: BASE_URL,
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${BASE_URL}/daily-quiz?search={search_term_string}`,
          },
          "query-input": "required name=search_term_string",
        },
      }}
    />
  );
}

interface QuizJsonLdProps {
  title: string;
  description?: string | null;
  questionCount: number;
  durationMins: number;
  url: string;
}

/** Quiz schema — use on daily-quiz/[id] and mock-tests/[id] detail pages */
export function QuizJsonLd({
  title,
  description,
  questionCount,
  durationMins,
  url,
}: QuizJsonLdProps) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Quiz",
        name: title,
        description: description || `${title} — Free practice quiz on ${SITE_NAME}`,
        url,
        educationalLevel: "Competitive Exam Preparation",
        timeRequired: `PT${durationMins}M`,
        numberOfQuestion: questionCount,
        about: {
          "@type": "Thing",
          name: "Competitive Exam Preparation",
        },
        provider: {
          "@type": "Organization",
          name: SITE_NAME,
          url: BASE_URL,
        },
      }}
    />
  );
}

interface ArticleJsonLdProps {
  title: string;
  summary?: string | null;
  category?: string;
  url: string;
  publishedAt?: string | null;
  updatedAt?: string | null;
}

/** Article schema — use on current-affairs/[id] detail pages */
export function ArticleJsonLd({
  title,
  summary,
  category,
  url,
  publishedAt,
  updatedAt,
}: ArticleJsonLdProps) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        description: summary || `${title} — Daily current affairs on ${SITE_NAME}`,
        url,
        author: {
          "@type": "Organization",
          name: SITE_NAME,
          url: BASE_URL,
        },
        publisher: {
          "@type": "Organization",
          name: SITE_NAME,
          url: BASE_URL,
          logo: {
            "@type": "ImageObject",
            url: `${BASE_URL}/favicon.svg`,
          },
        },
        ...(category ? { about: { "@type": "Thing", name: category } } : {}),
        ...(publishedAt ? { datePublished: publishedAt } : {}),
        ...(updatedAt ? { dateModified: updatedAt } : {}),
      }}
    />
  );
}
