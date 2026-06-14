import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { shadcn } from "@clerk/themes";
import Providers from "@/app/providers";
import "@/index.css";
import { clerkPublishableKey, isClerkConfigured } from "@/lib/clerk";

export const metadata: Metadata = {
  title: "Manish Ki Pathshala",
  description: "Premium exam preparation platform for UPSC, SSC, RAS and more",
};

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: "/",
    socialButtonsPlacement: "top" as const,
    socialButtonsVariant: "blockButton" as const,
  },
  variables: {
    colorPrimary: "#4F46E5",
    colorForeground: "#111827",
    colorMutedForeground: "#6b7280",
    colorDanger: "#dc2626",
    colorBackground: "#ffffff",
    colorInput: "#f9fafb",
    colorInputForeground: "#111827",
    colorNeutral: "#e5e7eb",
    fontFamily: "Inter, system-ui, sans-serif",
    borderRadius: "0.75rem",
  },
  elements: {
    rootBox:
      "w-full flex justify-center items-center min-h-[100dvh] bg-gray-50 px-4",
    cardBox:
      "bg-white rounded-2xl shadow-xl shadow-indigo-100/50 border border-gray-100 w-[440px] max-w-full overflow-hidden",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-gray-900 font-extrabold",
    headerSubtitle: "text-gray-500",
    socialButtonsBlockButtonText: "text-gray-700 font-semibold",
    formFieldLabel: "text-gray-700 font-medium",
    footerActionLink: "text-indigo-600 font-semibold hover:text-indigo-700",
    footerActionText: "text-gray-500",
    dividerText: "text-gray-400",
    identityPreviewEditButton: "text-indigo-600",
    formFieldSuccessText: "text-green-600",
    alertText: "text-red-600",
    logoBox: "flex justify-center pt-2",
    logoImage: "h-10 w-auto",
    socialButtonsBlockButton:
      "border border-gray-200 hover:bg-gray-50 rounded-xl",
    formButtonPrimary: "bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold",
    formFieldInput:
      "rounded-xl border-gray-200 bg-gray-50 focus:ring-indigo-500 focus:border-indigo-500",
    footerAction: "bg-gray-50",
    dividerLine: "bg-gray-200",
    alert: "rounded-xl",
    otpCodeFieldInput: "rounded-xl border-gray-200",
    formFieldRow: "gap-3",
    main: "px-6 pb-6",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <ClerkProvider
          publishableKey={clerkPublishableKey}
          proxyUrl={
            process.env.NEXT_PUBLIC_CLERK_PROXY_URL ??
            process.env.VITE_CLERK_PROXY_URL
          }
          appearance={clerkAppearance}
          signInUrl="/sign-in"
          signUpUrl="/sign-up"
          localization={{
            signIn: {
              start: {
                title: "Welcome back",
                subtitle: "Sign in to your Manish Ki Pathshala account",
              },
            },
            signUp: {
              start: {
                title: "Create your account",
                subtitle: "Start your exam preparation journey today",
              },
            },
          }}
        >
          <Providers clerkEnabled={isClerkConfigured}>{children}</Providers>
        </ClerkProvider>
      </body>
    </html>
  );
}
