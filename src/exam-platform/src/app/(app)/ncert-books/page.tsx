import type { Metadata } from "next";
import { ncertBooksMetadata } from "@/lib/seo";
import NcertBooks from "@/views/NcertBooks";

export const metadata: Metadata = ncertBooksMetadata;

export default function NcertBooksPage() {
  return <NcertBooks />;
}
