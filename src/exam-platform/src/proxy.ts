import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Public API routes that don't need Clerk auth
const PUBLIC_API_ROUTES = [
  "/api/health",
  "/api/pyp",
  "/api/pyq",
  "/api/ncert",
  "/api/syllabus",
  "/api/announcements",
  "/api/exam-sets",
  "/api/current-affairs",
  "/api/daily-quizzes",
  "/api/ncert-books",
  "/api/subjects",
];

// Admin routes are protected at the middleware level — both auth and role check
// happen server-side BEFORE the page loads, so non-admin users never see admin content.
const isAdminRoute = createRouteMatcher([
  "/admin(.*)",
]);

const isPublicApiRoute = createRouteMatcher(PUBLIC_API_ROUTES);

const isClerkConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? process.env.CLERK_PUBLISHABLE_KEY
);

export default isClerkConfigured ? clerkMiddleware(async (auth, req) => {
  // Skip auth for public API routes
  if (isPublicApiRoute(req)) {
    return NextResponse.next();
  }
  if (isAdminRoute(req)) {
    // 1. Ensure user is signed in (redirects to sign-in if not)
    await auth.protect();

    // 2. Check admin role server-side — redirect non-admins to home immediately
    const { sessionClaims } = await auth();
    const role = (sessionClaims?.metadata as Record<string, unknown>)?.role;
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }
  return NextResponse.next();
}) : function middleware() {
  return NextResponse.next();
};

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
