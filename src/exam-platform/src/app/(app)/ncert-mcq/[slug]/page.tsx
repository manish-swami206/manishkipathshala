"use client";

import dynamic from "next/dynamic";

const NcertMcqPlayer = dynamic(() => import("@/views/NcertMcqPlayer"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  ),
});

export default function NcertMcqPlayerPage() {
  return <NcertMcqPlayer />;
}
