import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Admin | Manish Ki Pathshala",
};

export const dynamic = "force-dynamic";

export default async function AdminGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, sessionClaims } = await auth();
  if (!userId) redirect("/sign-in");
  const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role;

  if (role !== "admin") redirect("/");
  return <>{children}</>;
}
