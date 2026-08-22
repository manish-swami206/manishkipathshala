# Platform Audit Report — Pagination, Performance & SEO

> Audit date: 2026-08-22 · Scope: Admin panel pagination, API performance, website performance, SEO
> Monorepo layout: `src/exam-platform/` (Next.js 15) · `src/api-server/` (Express + Drizzle)

---

## Executive Summary

| Area | Verdict |
|---|---|
| Admin pagination | **7 of 15 list pages OK** · 2 unbounded full-table fetches · 4 silently truncated at 20 rows · 1 stuck at fixed 50 |
| API performance | Good security posture, but **2 critical** scalability bugs, Clerk N+1 calls, ~10 missing DB indexes |
| Frontend performance | Heavy initial bundles (Redux, recharts, framer-motion), render-blocking fonts, ~100% client-rendered content |
| SEO | **Critical gaps**: homepage has no metadata, zero `generateMetadata`, no sitemap, broken OG image on every share |

Total issues found: **42** (5 critical · 15 high · 15 medium · 7 low)

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

**P1 [HIGH] — `subjects`: unbounded full-table fetch, no pagination anywhere**
- `admin/subjects/page.tsx:48` → `GET /admin/subjects`
- Backend `subjectsController.ts` `listAllSubjects` runs `db.select().from(subjects)` with no `limit`.
- Entire table fetched + rendered on one page.

**P2 [HIGH] — `announcements`: unbounded full-table fetch**
- `admin/announcements/page.tsx:147` → `GET /admin/announcements`
- Backend `announcementsController.ts` `listAllAnnouncements` has no `skip/take`.
- Public hook `useListAnnouncements()` also fetches all rows.

**P3–P6 [HIGH] — Silent truncation: backend paginates but frontend ignores it (data past row 20 unreachable)**
Backend returns `{ data, pagination }`; frontend sends no page params and renders no controls:

| Page | File |
|---|---|
| P3 syllabus (also: inactive rows hidden from admins via hard `isActive=true` filter) | `admin/syllabus/page.tsx` |
| P4 study-notes | `admin/study-notes/page.tsx:180` |
| P5 ncert books | `admin/ncert/page.tsx` |
| P6 pyp (previous-year papers) | `admin/pyp/page.tsx:122-132` |

**P7 [MEDIUM] — `support-tickets`: hardcoded window, no way to advance**
- `admin/support-tickets/page.tsx:107-113` hardcodes `page: 1, limit: 50`. Tickets beyond the first 50 are unreachable despite backend supporting up to 100/page.

**P8 [LOW] — Duplicated inline Prev/Next blocks instead of shared component**
- `components/ui/pagination.tsx` (shadcn) exists but is used nowhere.
- 7 pages re-implement identical inline Prev/Next button code.

**P9 [MEDIUM] — current-affairs category filter bug**
- Frontend sends `category=` (`lib/api/endpoints.ts`) but backend reads `filter=` (`controllers/admin/currentAffairsController.ts:25`) → category filter silently ignored.

**P10 [LOW] — Dead components**
- `components/admin/CurrentAffairsPagination.tsx` and `CurrentAffairsTable.tsx` are imported nowhere.

**P11 [LOW] — Dashboard data mismatch**
- `admin/page.tsx` renders `activityChart`, `topQuizzes`, `recentStudents`, but `dashboardController.getDashboardStats` never returns those keys → charts/lists always fall back to `[]`.

*(drafts page just redirects to `/admin/questions`; analytics/settings/dashboard are aggregate views — nothing to paginate)*

---

## 2. API Server Performance (`src/api-server/` + `lib/db/`)

### Critical

**A1 [CRITICAL] — Full-table scan fallback in current-affairs service**
- `services/currentAffairsService.ts:45-50`: when slug and UUID lookups miss, it does an **unbounded** `SELECT * FROM current_affairs` then matches slugified titles in JS. Legacy rows whose stored slug ≠ slugified(title) hit this on every public detail view, transferring all article bodies.

**A2 [CRITICAL] — Uncapped `limit` param = resource-exhaustion vector**
- `controllers/web/currentAffairsController.ts:15`: `parseInt(req.query.limit) || 12` with **no `Math.min` cap** (contrast: pyq caps at 100). `?limit=10000000` serializes the whole table.
- Same gap on admin routes: `activityLogsController.ts:9`, `dailyQuizController.ts:24`.

### High

**A3 [HIGH] — Clerk N+1: per-row external HTTP call**
- `admin/studentsController.ts:59-85` and `admin/supportTicketsController.ts:85-104`: `users.getUser(u.userId)` inside `Promise.all(users.map(...))` — up to 100 parallel Clerk API calls per page view, no caching/batching (`getUserList` exists).

**A4 [HIGH] — ~10 missing indexes (sequential scans today)**
Only existing indexes: `student_attempts(user_id, exam_id)`, `activity_logs(user_id, action)`, GIN on `question_ids` ×3.
Missing (column → used by):
- `questions.subject_id`, `.difficulty` → admin filter, reference counts
- `support_tickets.user_id/.status/.is_read_by_admin` → unread-count polled **every 30s per signed-in user**
- `support_messages.ticket_id` → message lookups + correlated subquery
- `exam_sets.subject_id/.type/.slug/.medium` → entire PYQ/NCERT browsing
- `current_affairs.published_at` → ORDER BY DESC on every list
- `subjects.slug` → slug resolution
- `user_streaks.total_points/.created_at` → leaderboard + admin sort
- `daily_quizzes.scheduled_date` → today's quiz lookup

**A5 [HIGH] — PYQ questions endpoint paginates in JS**
- `web/pyqController.ts:155-179`: loads ALL matching exam sets, concatenates all questionIds, `SELECT * FROM questions WHERE id IN (...)` unbounded, then `.slice()` in memory. Public route, re-fetches full payload per page request.

**A6 [HIGH] — Serial round trips in stats endpoints**
- `admin/dashboardController.ts:25-68`: 8 sequential COUNT(*) awaits (~9 serial RTTs cold).
- `web/statsController.ts:20-43`: 7 sequential counts.
- Trivially parallelizable with `Promise.all` (used elsewhere already).

### Medium

**A7 [MEDIUM]** — No `compression` middleware (helmet/cors/rate-limit present). Large JSON payloads (see A1/A2/A5) ship uncompressed unless proxied.
**A8 [MEDIUM]** — Streak write race: `recordActivity` (`web/streaksController.ts:84-144`) SELECT→compute→UPDATE without transaction/upsert; concurrent posts double-increment or throw unique-violation 500.
**A9 [MEDIUM]** — Pool under-configured: `db/index.ts:13-16` `new Pool({ connectionString, max: 10 })` — no idle/connection timeout, no `statement_timeout`, no explicit SSL.
**A10 [MEDIUM]** — Multer memoryStorage with 50MB × 2-file limit (`middleware/upload.ts:20-27`) → up to ~100MB heap per upload request; concurrent uploads can OOM.
**A11 [MEDIUM]** — Activity logger stores entire `req.body` as jsonb (`adminMiddleware.ts:30-37`); bulk CSV imports bloat the fastest-growing table.
**A12 [MEDIUM]** — Leading-wildcard ILIKE search (`%term%`) in questions/tickets/students controllers is non-indexable; `%`/`_` in user input not escaped. Needs pg_trgm/GIN or FTS.
**A13 [MEDIUM]** — node-cache is per-instance (stale/divergent across replicas); `cacheMiddleware` in `lib/cache.ts` is dead code and would ignore query params anyway.
**A14 [MEDIUM]** — Rate limiters defined but mostly unwired: `strictRateLimiter`, `authRateLimiter`, `examCreationLimiter` have zero usages (only `questionCreationLimiter` attached).
**A15 [MEDIUM]** — Bulk delete: non-transactional 3-step cleanup with swallowed errors; raw `${id}::uuid` casts turn invalid input into 500s (`admin/questionsController.ts:174,204,209-220`).

### Low

**A16 [LOW]** — Dead deps: `morgan`, `pino-http`, `hpp`, `cookie-parser` declared, imported nowhere.
**A17 [LOW]** — Small unbounded selects: web subjects list, per-user tickets, PYQ sets list.
**A18 [LOW]** — Leaderboard exposes raw Clerk userIds publicly; leaderboard cache TTL defined but unused.
**A19 [LOW]** — Error handler thin: zod errors and PG codes unmapped (unique violation → 500).

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

**F7 [HIGH] — ~100% client-side rendering of all public content**
- 97 `"use client"` files; 22/45 pages are themselves `"use client"`, remaining ones import fully-client views. HTML delivered to crawlers is an empty shell for every content URL.

### Medium

**F8 [MEDIUM]** — Public StudyNotes search fires a network call on every keystroke (`views/StudyNotes.tsx:29,41,64-66`) — no debounce unlike the 9 debounced admin surfaces.
**F9 [MEDIUM]** — Streaming gaps: zero `<Suspense>` boundaries; only 3 `loading.tsx` files across ~45 route segments.
**F10 [MEDIUM]** — No memoization/virtualization anywhere (`React.memo` grep = 0). 50-row lists re-render wholesale; 1-second countdown timer in `admin/daily-quizzes/page.tsx:120` re-renders its entire table every tick.
**F11 [MEDIUM]** — `next.config.ts` nearly empty: no cache-Control headers, no `optimizePackageImports` (lucide/radix), no bundle analyzer; rewrite targets `:3001` while client defaults `:4000` (silent env drift trap).
**F12 [MEDIUM]** — framer-motion imported in 20 files incl. global chrome (`Header`, `PageTransition`, `MobileBottomBar`) → permanent first-load dependency (~30KB+).
**F13 [MEDIUM]** — Two independent 30s notification pollers (`shared/Header.tsx:61`, `AdminHeader.tsx:47`) hitting the same endpoint class instead of sharing a query key.

### Low

**F14 [LOW]** — `gcTime` (5min) < `staleTime` (15min) → long staleness rarely survives navigation away/back.
**F15 [LOW]** — API base URL defaults to non-standard `localhost:4000` vs rewrite's `:3001`.
**F16 [LOW]** — Root metadata static-only; can't reflect dynamic slugs.

### Frontend done well
Debounce discipline across 9 admin search surfaces · skeleton loaders in 18+ views · route-level loading shells · SSR-safe QueryClient creation · `refetchOnWindowFocus:false` · dynamic imports for Toaster/StreakInitializer/NcertMcqPlayer · MCQ players render one question at a time · clean `ApiError` typing with field validation surfacing.

---

## 4. SEO Audit

### High

**S1 [HIGH] — Homepage has NO metadata**
- `app/(app)/page.tsx` exports nothing; `homeMetadata` exists in `lib/seo.ts` but is never imported.

**S2 [HIGH] — Zero `generateMetadata` in the entire app**
- All dynamic routes ship root-title-only HTML: `daily-quiz/[id]` (+ `/play`), `current-affairs/[id]`, `mock-tests/[id]` (+ `/play`), `pyq/[slug]`, `ncert-mcq/[slug]` — these are exactly the URLs meant to rank.

**S3 [HIGH] — Key listing pages missing metadata**
- `/pyq` listing: `pyqMetadata` defined in seo.ts but unused.
- `/pyp`: fully client component → cannot export metadata at all.

**S4 [HIGH] — Broken OG image on every share**
- `lib/seo.ts:53` defaults to `${BASE_URL}/og-image.png` but `public/` contains `opengraph.jpg` → social shares get 404 images on all 16 pages using `buildMetadata()`.

**S5 [HIGH] — No `sitemap.ts`**
- Content site with many indexable URLs and no sitemap at all.

**S6 [HIGH] — Content invisible to crawlers**
- See F7: all listing/detail content fetched client-side post-hydration; `ncert-mcq/[slug]/page.tsx` even uses `dynamic(..., { ssr: false })`.

### Medium

**S7 [MEDIUM]** — `robots.txt` too permissive: doesn't disallow `/admin`, `/profile`, `/result`, `/sign-in`, `/sign-up`, `/play`.
**S8 [MEDIUM]** — No JSON-LD structured data anywhere (Organization/WebSite/Quiz/Article schema absent).
**S9 [MEDIUM]** — Favicon not wired: `public/favicon.svg` exists but isn't in `src/app/` nor linked in layout head.

### Low

**S10 [LOW]** — Root layout lacks title template (`%s | Site`), openGraph, twitter, canonical/metadataBase, viewport, themeColor.
**S11 [LOW]** — No `manifest.ts`.
**S12 [LOW]** — `next.config.ts` has no redirects/headers policy.

### SEO done well
`lang="en"` + font preconnects · 14 static `(app)` pages have proper metadata via `buildMetadata()` factory (OG, twitter, canonical, keywords, geo) · Clerk middleware protects ONLY `/admin`, leaving content routes publicly crawlable · semantic structure generally sound.

---

## Recommended Fix Priority

1. **Now (critical/correctness)**: A2 cap limits · A1 kill table-scan fallback · S1+S3 import existing metadata builders · S4 fix og-image filename · P9 category/filter param mismatch · A8 streak transaction
2. **Next sprint (scale blockers)**: A4 add missing indexes (migration) · A3 batch/cache Clerk identity lookups · P1–P7 wire pagination params into the 7 broken admin pages · A5 SQL-level pagination for PYQ questions · A6 Promise.all stats
3. **Then (SEO visibility)**: S2 add `generateMetadata` to dynamic routes · S5 sitemap.ts + S7 robots rules · F7 move key listings/detail pages to server components or SSR-hydrated queries
4. **Ongoing hygiene**: F1 next/font · F2 remove Redux · F3 dynamic-import charts · F5/F6 query defaults + AbortController · A7 compression · A12 trgm search indexes

---

*Method note: static source audit (file-by-file trace of admin pages → hooks → Express routes → controllers → Drizzle schema). No live traffic/Lighthouse run was performed; numbers like bundle sizes are library estimates.*
