import type { Metadata } from "next";
import { profileMetadata } from "@/lib/seo";
import Profile from "@/views/Profile";

export const metadata: Metadata = profileMetadata;

export default function ProfilePage() {
  return <Profile />;
}
