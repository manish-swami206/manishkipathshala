import Providers from "@/app/providers";
import { AppLayout } from "@/components/layout/AppLayout";

export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <AppLayout>{children}</AppLayout>
    </Providers>
  );
}
