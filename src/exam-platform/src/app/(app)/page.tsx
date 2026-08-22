import Home from "@/views/Home";
import { homeMetadata } from "@/lib/seo";
import { OrganizationJsonLd, WebSiteJsonLd } from "@/components/shared/JsonLd";

export const metadata = homeMetadata;

export default function HomePage() {
  return (
    <>
      <OrganizationJsonLd />
      <WebSiteJsonLd />
      <Home />
    </>
  );
}
