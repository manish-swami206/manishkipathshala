# Completed Work — issues.md Audit

## Batch 1: Type Safety ✅
- Eliminated all `any` types across frontend and backend

## Batch 2: Critical/Correctness Fixes ✅
- **A2**: Capped `limit` param in all 4 controllers (max 100)
- **A1**: Bounded full-table scan fallback to 100 most recent articles
- **A6**: Both stats controllers already use `Promise.all`
- **P9**: Fixed current-affairs admin category/filter param mismatch

## Batch 3: SEO Fixes ✅
- **S1**: Added `export const metadata = homeMetadata` to homepage
- **S4**: Fixed OG image path from `og-image.png` to `opengraph.jpg`
- **S5**: Created `src/app/sitemap.ts` with all static content pages
- **S7**: Updated `robots.txt` to disallow sensitive routes

## Batch 4: DB Indexes ✅
- **A4**: Added `support_tickets_is_read_by_admin_idx` and `exam_sets_medium_idx`

## Batch 5: Admin Pagination ✅
- Created shared `AdminPagination` component
- **P1–P8**: All 7 admin pages now have server-side pagination

## Batch 6: Clerk N+1 Fix ✅
- Created `lib/clerkBatch.ts` with batch Clerk user lookup
- Both `studentsController.ts` and `supportTicketsController.ts` now batch fetch

## Batch 7: Medium/Low Fixes ✅
- **A7**: Added compression middleware
- **A9**: Added pool idle/connection timeouts
- **A13**: Removed dead cacheMiddleware code
- **A14**: Wired `strictRateLimiter` to admin write ops
- **A16**: Removed dead dependencies (morgan, pino-http, hpp, etc.)
- **A18**: Leaderboard no longer exposes userId
- **A19**: Error handler now maps PG codes to proper HTTP responses
- **F8**: Added 400ms debounce to StudyNotes search
- **F11**: Added `optimizePackageImports` for lucide-react and @radix-ui
- **S9**: Wired favicon to root layout metadata
- **S10**: Root layout now has title template, metadataBase, OG, twitter, theme-color
- **P10**: Deleted unused CurrentAffairs components
- **P11**: Dashboard controller now returns activityChart, topQuizzes, recentStudents

## Batch 8: SEO Visibility (F7/S2/S3/S6) ✅
- Created `lib/api/server.ts` with server-side fetch helpers using React `cache()`
- **S2**: Added `generateMetadata` to all 5 dynamic routes
- **S3**: Fixed missing metadata on `/pyq` and `/pyp` listing pages
- **F7**: Refactored PYP listing from client to server component with metadata
- All 20+ app pages now have proper SEO metadata

## Batch 9: JSON-LD Structured Data (S8) ✅
- Created `components/shared/JsonLd.tsx` with reusable JSON-LD components
- Added Organization + WebSite schema to homepage
- Added Quiz schema to daily-quiz/[id] and mock-tests/[id] detail pages
- Added Article schema to current-affairs/[id] detail page

## Batch 10: Admin Cache Invalidation ✅
- Created `src/api-server/src/services/cacheInvalidation.ts` — centralized cache invalidation service
- Created `src/api-server/src/controllers/admin/cacheController.ts` — API endpoint
- Created `src/api-server/src/routes/admin/cache.ts` — admin cache routes
- Updated 6 admin controllers to use centralized `invalidateEntity()`
- Created `src/exam-platform/src/lib/api/cacheInvalidation.ts` — frontend utility
- Wired cache invalidation to admin questions page mutations

### API Endpoints
- `POST /admin/cache/invalidate` — invalidate cache for entity type(s)
- `GET /admin/cache/status` — get cache status for debugging

## Batch 11: Streaming SSR (F9) ✅
- Created `components/shared/PageSkeleton.tsx` with 5 reusable skeleton components:
  - `PageSkeleton` — generic page with header + content area
  - `DetailSkeleton` — detail page (quiz, mock test, article)
  - `ListingSkeleton` — listing page with grid
  - `PlayerSkeleton` — quiz/mock test player
  - `AdminTableSkeleton` — admin table view
- Added 15 new `loading.tsx` files (3 → 18 total):
  - Detail pages: daily-quiz/[id], current-affairs/[id], mock-tests/[id], pyq/[slug], ncert-mcq/[slug]
  - Listing pages: daily-quiz, current-affairs, mock-tests, pyq, ncert-mcq, study-notes, syllabus, ncert-books, leaderboard, pyp
- Added `<Suspense>` boundaries to all 5 dynamic route pages
- Streaming SSR now works — server sends HTML incrementally as data loads

## Remaining Issues (from issues.md)
### High Priority
- **A5**: SQL-level pagination for PYQ questions endpoint
- **F1–F6**: Frontend performance (next/font, remove Redux, dynamic imports, query defaults, AbortController)
- **F7**: Full SSR of content pages (convert remaining client views to server components)

### Medium Priority
- **A10**: Multer memoryStorage OOM risk
- **A11**: Activity logger stores entire req.body
- **A12**: Leading-wildcard ILIKE non-indexable
- **F10**: No memoization/virtualization
- **F12**: framer-motion in global chrome
- **F13**: Duplicate notification pollers

### Low Priority
- **A15**: Bulk delete non-transactional
- **A17**: Small unbounded selects
- **F14–F16**: Minor frontend issues
- **S11–S12**: No manifest.ts, no redirects/headers policy
