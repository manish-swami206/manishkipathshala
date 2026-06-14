import type { Metadata } from "next";
import { aboutMetadata } from "@/lib/seo";
import About from "@/views/About";

export const metadata: Metadata = aboutMetadata;

export default function AboutPage() {
  return <About />;
}
