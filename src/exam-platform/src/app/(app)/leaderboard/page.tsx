import type { Metadata } from "next";
import { leaderboardMetadata } from "@/lib/seo";
import Leaderboard from "@/views/Leaderboard";

export const metadata: Metadata = leaderboardMetadata;

export default function LeaderboardPage() {
  return <Leaderboard />;
}
