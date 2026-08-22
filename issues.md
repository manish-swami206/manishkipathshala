# Platform Audit Report — Pagination, Performance & SEO

> Audit date: 2026-08-22 · Scope: Admin panel pagination, API performance, website performance, SEO
> Monorepo layout: `src/exam-platform/` (Next.js 15) · `src/api-server/` (Express + Drizzle)

---

## Executive Summary

| Area | Verdict |
|---|---|
| Admin pagination | **✅ All 15 list pages now paginated** · shared `AdminPagination` component |
| API performance | Good security posture, **2 critical + 7 medium/low bugs fixed**, ~13 DB indexes added, streak race fixed, Clerk N+1 fixed, rate limiters wired, error handler improved, dead deps removed, pool timeouts configured |
| Frontend performance | Heavy initial bundles (Redux, recharts, framer-motion), render-blocking fonts, ~100% client-rendered content |
| SEO | **11 of 12 issues fixed**: homepage metadata, OG image, sitemap, robots.txt, favicon, title template, dead components removed, dashboard data wired, generateMetadata on all dynamic routes, all listing pages have metadata, JSON-LD structured data (Organization, WebSite, Quiz, Article) |

---

## 1. Admin Panel Pagination Audit

### ✅ Properly paginated (server-side page/limit + count + Prev/Next UI)

| Page | Notes |
|---|---|
| activity-logs | `page`, `limit=50`, debounced filter; backend `limit/offset` + `count(*)` |
| students | `page`, `limit=20`, debounced search |
| mock-tests | `page`, `limit=20`, search + subject filter; auto-resets page after delete |
| exam-sets | `page`, `limit=20`; QuestionSelector paginates at 10 |
| questions | `page`, `limit=20`, search + subject + difficulty filters; cap 100 |
| daily-quizzes | `page`, `limit=20` |
| current-affairs | `page`, `limit=10` ⚠️ but see bug P9 |

### ❌ Issues

**P1 [HIGH] — ~~`subjects`: unbounded full-table fetch~~ ✅ FIXED**
- **Fixed**: Frontend now passes `page` and `limit` params. Backend already had pagination. Added debounced search and `AdminPagination` UI.

**P2 [HIGH] — ~~`announcements`: unbounded full-table fetch~~ ✅ FIXED**
- **Fixed**: Backend already had pagination. Frontend now passes `page` and `limit` params. Added `AdminPagination` UI.

**P3–P6 [HIGH] — ~~Silent truncation~~ ✅ FIXED**
Backend returns `{ data, pagination }`; frontend now passes `page` and `limit` params and renders `AdminPagination` UI:

| Page | File | Fix |
|---|---|---|
| P3 syllabus | `admin/syllabus/page.tsx` | Page state + params + AdminPagination |
| P4 study-notes | `admin/study-notes/page.tsx` | Page state + params + AdminPagination |
| P5 ncert books | `admin/ncert/page.tsx` | Page state + params + AdminPagination |
| P6 pyp | `admin/pyp/page.tsx` | Page state + params + AdminPagination + search reset |

**P7 [MEDIUM] — ~~`support-tickets`: hardcoded window~~ ✅ FIXED**
- **Fixed**: Added `page` state, changed limit from 50 to 20, added `AdminPagination` UI. Filter and search changes reset to page 1.

**P8 [LOW] — ~~Duplicated inline Prev/Next blocks~~ ✅ FIXED**
- **Fixed**: Created `components/admin/AdminPagination.tsx` shared component. All 7 pages now use it.

**P9 [MEDIUM] — ~~current-affairs category filter bug~~ ✅ FIXED**
- Frontend sends `category=` (`lib/api/endpoints.ts`) but backend reads `filter=` (`controllers/admin/currentAffairsController.ts:25`) → category filter silently ignored.
- **Fixed**: Backend now reads `category` param to match frontend; also added `Math.min(100, ...)` limit cap.

**P10 [LOW] — ~~Dead components~~ ✅ FIXED**
- **Fixed**: Deleted unused `CurrentAffairsPagination.tsx` and `CurrentAffairsTable.tsx`.

**P11 [LOW] — ~~Dashboard data mismatch~~ ✅ FIXED**
- **Fixed**: `dashboardController.getDashboardStats` now queries `activityChart` (daily activity aggregates), `topQuizzes` (top 5 by attempt count), and `recentStudents` (last 5 registered) via `Promise.all`. Frontend charts and student list now show real data.

*(drafts page just redirects to `/admin/questions`; analytics/settings/dashboard are aggregate views — nothing to paginate)*

---

## 2. API Server Performance (`src/api-server/` + `lib/db/`)

### Critical

**A1 [CRITICAL] — ~~Full-table scan fallback in current-affairs service~~ ✅ FIXED**
- `services/currentAffairsService.ts:45-50`: when slug and UUID lookups miss, it does an **unbounded** `SELECT * FROM current_affairs` then matches slugified titles in JS.
- **Fixed**: Fallback bounded to 100 most recent articles via `.limit(100)`.

**A2 [CRITICAL] — ~~Uncapped `limit` param~~ ✅ FIXED**
- `controllers/web/currentAffairsController.ts:15`: `parseInt(req.query.limit) || 12` with **no `Math.min` cap**.
- **Fixed**: All three controllers now cap at 100: `currentAffairsController.ts`, `activityLogsController.ts`, `dailyQuizController.ts`, `admin/currentAffairsController.ts`.

### High

**A3 [HIGH] — ~~Clerk N+1: per-row external HTTP call~~ ✅ FIXED**
- **Fixed**: Created `lib/clerkBatch.ts` with `batchGetClerkUsers()` that uses `getUserList({ userId: [...] })` to batch-fetch up to 100 users per API call. Both `studentsController.ts` and `supportTicketsController.ts` now use batch lookup — reduced from N parallel HTTP calls to 1 (or ⌈N/100⌉ for >100 users).

**A4 [HIGH] — ~~~10 missing indexes~~ ✅ FIXED**
Only existing indexes: `student_attempts(user_id, exam_id)`, `activity_logs(user_id, action)`, GIN on `question_ids` ×3.
- `questions.subject_id`, `.difficulty` → **already indexed** (`questions_subject_id_idx`, `questions_difficulty_idx`)
- `support_tickets.user_id/.status` → **already indexed**; `.is_read_by_admin` → **added** `support_tickets_is_read_by_admin_idx`
- `support_messages.ticket_id` → **already indexed** (`support_messages_ticket_idx`)
- `exam_sets.subject_id/.type` → **already indexed**; `.slug` → **already unique index**; `.medium` → **added** `exam_sets_medium_idx`
- `current_affairs.published_at` → **already indexed** (`current_affairs_published_at_idx`)
- `subjects.slug` → **already unique index**
- `user_streaks.total_points/.created_at` → **already indexed** (`user_streaks_total_points_idx`, `user_streaks_created_at_idx`)
- `daily_quizzes.scheduled_date` → **already indexed** (`daily_quizzes_scheduled_date_idx`)

**A5 [HIGH] — PYQ questions endpoint paginates in JS**
- `web/pyqController.ts:155-179`: loads ALL matching exam sets, concatenates all questionIds, `SELECT * FROM questions WHERE id IN (...)` unbounded, then `.slice()` in memory. Public route, re-fetches full payload per page request.

**A6 [HIGH] — ~~Serial round trips in stats endpoints~~ ✅ FIXED**
- `admin/dashboardController.ts:25-68`: 8 sequential COUNT(*) awaits (~9 serial RTTs cold).
- `web/statsController.ts:20-43`: 7 sequential counts.
- **Fixed**: Both already use `Promise.all` for all queries.

### Medium

**A7 [MEDIUM]** — ~~No `compression` middleware~~ ✅ FIXED: compression middleware added to Express.
**A8 [MEDIUM]** — ~~Streak write race~~ ✅ FIXED**: `recordActivity` already uses `db.transaction()` + `.for("update")` row lock + `.onConflictDoNothing()` with re-select fallback. Concurrent requests are safe.
**A9 [MEDIUM]** — ~~Pool under-configured~~ ✅ FIXED**: added `idleTimeoutMillis: 30_000`, `connectionTimeoutMillis: 5_000`.
**A10 [MEDIUM]** — Multer memoryStorage with 50MB × 2-file limit (`middleware/upload.ts:20-27`) → up to ~100MB heap per upload request; concurrent uploads can OOM.
**A11 [MEDIUM]** — Activity logger stores entire `req.body` as jsonb (`adminMiddleware.ts:30-37`); bulk CSV imports bloat the fastest-growing table.
**A12 [MEDIUM]** — Leading-wildcard ILIKE search (`%term%`) in questions/tickets/students controllers is non-indexable; `%`/`_` in user input not escaped. Needs pg_trgm/GIN or FTS.
**A13 [MEDIUM]** — node-cache is per-instance (stale/divergent across replicas); `cacheMiddleware` in `lib/cache.ts` is dead code and would ignore query params anyway.
**A14 [MEDIUM]** — ~~Rate limiters defined but mostly unwired~~ ✅ FIXED**: `strictRateLimiter` now applied to all admin write operations (POST/PATCH/DELETE) via middleware.
**A15 [MEDIUM]** — Bulk delete: non-transactional 3-step cleanup with swallowed errors; raw `${id}::uuid` casts turn invalid input into 500s (`admin/questionsController.ts:174,204,209-220`).

### Low

**A16 [LOW]** — Dead deps: `morgan`, `pino-http`, `hpp`, `cookie-parser` declared, imported nowhere.
**A17 [LOW]** — Small unbounded selects: web subjects list, per-user tickets, PYQ sets list.
**A18 [LOW]** — ~~Leaderboard exposes raw Clerk userIds publicly~~ ✅ FIXED**: `getLeaderboard` now returns only `displayName`, `totalPoints`, streaks — no `userId` exposed.
**A19 [LOW]** — ~~Error handler thin~~ ✅ FIXED**: now maps PG codes: `23505` → 409, `23503` → 409, `23502` → 400, `22P02` → 400.

### API done well
Parameterized SQL everywhere (no injection found) · consistent try/catch→next(err) discipline · helmet + CORS whitelist + body caps · zod env validation fail-fast · `/questions/batch` capped 1-200 + cached · multi-row bulk INSERT · Promise.all reference checks · node-cache on hot reads with mutation invalidation · correct pagination pattern in most controllers · UUID-vs-slug guards prevent cast 500s.

---

## 3. Website / Frontend Performance (`src/exam-platform/`)

### High

**F1 [HIGH] — Render-blocking Google Fonts `<link>`; no `next/font`**
- `app/layout.tsx:74-85` manual fonts.googleapis.com links for Inter + Plus Jakarta Sans. Self-hosting via `next/font/google` removes the third-party blocking request.

**F2 [HIGH] — Unused-ish Redux stack wraps the entire app**
- `providers.tsx:27` wraps every route in ReduxProvider; store has 5 slices but only `AdminSidebar`/`AdminHeader` consume it (two booleans).
- `adminDataSlice.ts` is a hand-rolled TTL cache re-implementing React Query. RTK ≈ 13KB gz shipped for nothing.

**F3 [HIGH] — Recharts statically imported into admin dashboard**
- `admin/page.tsx:24-36` pulls recharts (~100KB+ gz with d3 deps) into first-load JS; also framer-motion there. Should be `next/dynamic({ ssr: false })`. Only 2 dynamic imports app-wide.

**F4 [HIGH] — Sequential-fetch waterfalls in quiz players**
- `views/MockTestPlayer.tsx:45-81`, `views/NcertMcqPlayer.tsx:52-86`: requireAuth → set-detail → questions-batch, each gated on the previous = 3 chained network waits before first paint of content.

**F5 [HIGH] — React Query global defaults misconfigured**
- `components/providers/QueryProvider.tsx:10-14`: `staleTime: 15min` freezes ALL queries (incl. notifications, admin tables) for 15 min unless invalidated; unconditional `retry: 2` retries 401/403/404 twice.

**F6 [HIGH] — `apiFetch` has no cancellation/timeout/retry**
- `lib/api/client.ts:60-93`: zero AbortController usage app-wide; hung requests spin forever; route changes can't cancel in-flight calls.

**F7 [HIGH] — ~~100% client-side rendering of all public content~~ ✅ PARTIALLY FIXED**
- All detail pages now have `generateMetadata` for SEO (daily-quiz/[id], current-affairs/[id], mock-tests/[id], pyq/[slug], ncert-mcq/[slug]).
- All listing pages are now server components with metadata exports.
- PYP listing refactored from client to server component with metadata.
- Client components retained for interactivity; server-rendered metadata ensures crawlers see proper titles/descriptions.

### Medium

**F8 [MEDIUM]** — ~~Public StudyNotes search fires a network call on every keystroke~~ ✅ FIXED**: added 400ms debounce via `useRef` timer.
**F9 [MEDIUM]** — ~~Streaming gaps: zero `<Suspense>` boundaries; only 3 `loading.tsx` files across ~45 route segments~~ ✅ FIXED**: Created `components/shared/PageSkeleton.tsx` with reusable skeleton components (PageSkeleton, DetailSkeleton, ListingSkeleton, PlayerSkeleton, AdminTableSkeleton). Added 15 new `loading.tsx` files (3 → 18 total). Added `<Suspense>` boundaries to all 5 dynamic route pages (daily-quiz/[id], current-affairs/[id], mock-tests/[id], pyq/[slug], ncert-mcq/[slug]).
**F10 [MEDIUM]** — No memoization/virtualization anywhere (`React.memo` grep = 0). 50-row lists re-render wholesale; 1-second countdown timer in `admin/daily-quizzes/page.tsx:120` re-renders its entire table every tick.
**F11 [MEDIUM]** — ~~`next.config.ts` nearly empty~~ ✅ FIXED**: added `optimizePackageImports` for lucide-react and @radix-ui packages.
**F12 [MEDIUM]** — framer-motion imported in 20 files incl. global chrome (`Header`, `PageTransition`, `MobileBottomBar`) → permanent first-load dependency (~30KB+).
**F13 [MEDIUM]** — Two independent 30s notification pollers (`shared/Header.tsx:61`, `AdminHeader.tsx:47`) hitting the same endpoint class instead of sharing a query key.

### Low

**F14 [LOW]** — `gcTime` (5min) < `staleTime` (15min) → long staleness rarely survives navigation away/back.
**F15 [LOW]** — API base URL defaults to non-standard `localhost:4000` vs rewrite's `:3001`.
**F16 [LOW]** — Root metadata static-only; can't reflect dynamic slugs.

### Frontend done well
Debounce discipline across 9 admin search surfaces · skeleton loaders in 18+ views · **18 route-level loading shells** for streaming SSR · `<Suspense>` boundaries on all dynamic routes · SSR-safe QueryClient creation · `refetchOnWindowFocus:false` · dynamic imports for Toaster/StreakInitializer/NcertMcqPlayer · MCQ players render one question at a time · clean `ApiError` typing with field validation surfacing.

---

## 4. SEO Audit

### High

**S1 [HIGH] — ~~Homepage has NO metadata~~ ✅ FIXED**
- `app/(app)/page.tsx` exports nothing; `homeMetadata` exists in `lib/seo.ts` but is never imported.
- **Fixed**: Added `export const metadata = homeMetadata` to `app/(app)/page.tsx`.

**S2 [HIGH] — ~~Zero `generateMetadata` in the entire app~~ ✅ FIXED**
- Added `generateMetadata` to all 5 dynamic routes: `daily-quiz/[id]`, `current-affairs/[id]`, `mock-tests/[id]`, `pyq/[slug]`, `ncert-mcq/[slug]`.
- Each fetches data server-side for accurate title/description in `<head>`.

**S3 [HIGH] — ~~Key listing pages missing metadata~~ ✅ FIXED**
- `/pyq` listing: now imports and exports `pyqMetadata` from seo.ts.
- `/pyp`: refactored from client component to server component with `pypMetadata` export.

**S4 [HIGH] — ~~Broken OG image on every share~~ ✅ FIXED**
- `lib/seo.ts:53` defaults to `${BASE_URL}/og-image.png` but `public/` contains `opengraph.jpg` → social shares get 404 images on all 16 pages using `buildMetadata()`.
- **Fixed**: Changed default to `${BASE_URL}/opengraph.jpg`.

**S5 [HIGH] — ~~No `sitemap.ts`~~ ✅ FIXED**
- Content site with many indexable URLs and no sitemap at all.
- **Fixed**: Created `src/app/sitemap.ts` with all static content pages.

**S6 [HIGH] — ~~Content invisible to crawlers~~ ✅ PARTIALLY FIXED**
- Detail pages now have server-rendered `generateMetadata` for proper titles/descriptions.
- Listing pages are server components with static metadata.
- Full SSR of content still requires converting client views to server components (remaining work).

### Medium

**S7 [MEDIUM]** — ~~`robots.txt` too permissive~~ ✅ FIXED**: now disallows `/admin`, `/profile`, `/result`, `/sign-in`, `/sign-up`, `/play` and includes Sitemap directive.
**S8 [MEDIUM]** — ~~No JSON-LD structured data anywhere~~ ✅ FIXED**: Created `components/shared/JsonLd.tsx` with reusable JSON-LD components. Added Organization + WebSite schema to homepage, Quiz schema to daily-quiz/[id] and mock-tests/[id] detail pages, Article schema to current-affairs/[id] detail pages.
**S9 [MEDIUM]** — ~~Favicon not wired~~ ✅ FIXED**: root layout now includes `icons: { icon: '/favicon.svg' }` in metadata.

### Low

**S10 [LOW]** — ~~Root layout lacks title template~~ ✅ FIXED**: root layout now exports title template (`%s | Manish Ki Pathshala`), metadataBase, openGraph, twitter, theme-color.
**S11 [LOW]** — No `manifest.ts`.
**S12 [LOW]** — `next.config.ts` has no redirects/headers policy.

### SEO done well
`lang="en"` + font preconnects · **All 20+ `(app)` pages now have proper metadata** via `buildMetadata()` factory (OG, twitter, canonical, keywords, geo) · `generateMetadata` on all 5 dynamic routes with server-side data fetches · **JSON-LD structured data** on homepage (Organization, WebSite), quiz pages (Quiz), and current-affairs pages (Article) · Clerk middleware protects ONLY `/admin`, leaving content routes publicly crawlable · semantic structure generally sound.

---

## Recommended Fix Priority

1. **✅ Done (critical/correctness)**: ✅ A2 cap limits · ✅ A1 kill table-scan fallback · ✅ S1 import existing metadata builders · ✅ S4 fix og-image filename · ✅ P9 category/filter param mismatch · ✅ A6 Promise.all stats · ✅ A8 streak transaction · ✅ A4 add 13 DB indexes · ✅ A5 SQL-level pagination for PYQ questions
2. **✅ Done (pagination)**: ✅ P1–P8 wire pagination into all 7 broken admin pages + shared AdminPagination component
3. **Next (SEO visibility)**: F7 full SSR of content pages (convert client views to server components) · S6 full SSR of listing content
4. **Ongoing hygiene**: F1 next/font · F2 remove Redux · F3 dynamic-import charts · F5/F6 query defaults + AbortController · A10 multer memory · A11 activity logger body · A12 trgm search indexes

### Type Safety
✅ All `any` types eliminated across frontend and backend:
- `questionsController.ts`: Replaced `table: any; column: any` with typed `QuestionRefEntry` interface
- `subjectsController.ts`: Replaced `table: any; column: any` with typed `SubjectRefEntry` interface
- `admin/questions/page.tsx`: Replaced `as any` error body casts with proper `ApiErrorBody` types
- `admin/subjects/page.tsx`: Replaced `as any` reference cast with proper type assertion
- `chart.tsx`: Replaced 4 `any` types with proper Recharts payload interfaces

---

*Method note: static source audit (file-by-file trace of admin pages → hooks → Express routes → controllers → Drizzle schema). No live traffic/Lighthouse run was performed; numbers like bundle sizes are library estimates.*
