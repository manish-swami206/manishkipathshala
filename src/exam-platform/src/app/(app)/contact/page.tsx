import type { Metadata } from "next";
import { contactMetadata } from "@/lib/seo";
import Contact from "@/views/Contact";

export const metadata: Metadata = contactMetadata;

export default function ContactPage() {
  return <Contact />;
}
