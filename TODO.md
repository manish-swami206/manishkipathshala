# Completed Work — issues.md Audit

## Batch 1: Type Safety ✅
- Eliminated all `any` types across frontend and backend
- `questionsController.ts`: Replaced `table: any; column: any` with typed `QuestionRefEntry` interface
- `subjectsController.ts`: Replaced `table: any; column: any` with typed `SubjectRefEntry` interface
- `admin/questions/page.tsx`: Replaced `as any` error body casts with proper `ApiErrorBody` types
- `admin/subjects/page.tsx`: Replaced `as any` reference cast with proper type assertion
- `chart.tsx`: Replaced 4 `any` types with proper Recharts payload interfaces

## Batch 2: Critical/Correctness Fixes ✅
- **A2**: Capped `limit` param in `currentAffairsController.ts`, `activityLogsController.ts`, `dailyQuizController.ts`, `admin/currentAffairsController.ts` (all max 100)
- **A1**: Bounded full-table scan fallback in `currentAffairsService.ts` to 100 most recent articles
- **A6**: Both `dashboardController.ts` and `statsController.ts` already use `Promise.all`
- **P9**: Fixed current-affairs admin category/filter param mismatch (backend now reads `category`)

## Batch 3: SEO Fixes ✅
- **S1**: Added `export const metadata = homeMetadata` to `app/(app)/page.tsx`
- **S4**: Fixed OG image path from `og-image.png` to `opengraph.jpg` in `lib/seo.ts`
- **S5**: Created `src/app/sitemap.ts` with all static content pages
- **S7**: Updated `robots.txt` to disallow `/admin`, `/profile`, `/result`, `/sign-in`, `/sign-up`, `/play` and added Sitemap directive

## Batch 4: DB Indexes ✅
- **A4**: Audited all schema files — most indexes already existed from prior work
- `support.ts`: Added `support_tickets_is_read_by_admin_idx` on `isReadByAdmin` (polled every 30s per user)
- `exams.ts`: Added `exam_sets_medium_idx` on `medium` (filtered in 4 controller locations)
- Confirmed `subjects.slug` and `exams.slug` already have implicit unique indexes via `.unique()`
- All other columns from A4 audit already indexed: questions, support_messages, current_affairs, streaks, daily_quizzes

## Batch 5: Admin Pagination ✅
- Created shared `AdminPagination` component (`components/admin/AdminPagination.tsx`)
- **P1 (subjects)**: Added page state, debounced search, wired page/limit params, added AdminPagination UI
- **P2 (announcements)**: Added page state, wired page/limit params, added AdminPagination UI
- **P3 (syllabus)**: Added page state, wired page/limit params, added AdminPagination UI
- **P4 (study-notes)**: Added page state, wired page/limit params, added AdminPagination UI
- **P5 (ncert)**: Added page state, wired page/limit params, added AdminPagination UI
- **P6 (pyp)**: Added page state, wired page/limit params, search reset on page change, added AdminPagination UI
- **P7 (support-tickets)**: Added page state, changed limit from 50→20, added AdminPagination UI, filter/search reset to page 1
- **P8**: Eliminated duplicated Prev/Next blocks — all 7 pages now use shared component
- All backends already had pagination support — only frontend wiring was needed

## Remaining Issues (from issues.md)
### High Priority
- **A3**: Batch/cache Clerk identity lookups (N+1 problem)
- **A5**: SQL-level pagination for PYQ questions endpoint
- **A8**: Streak write race condition (needs transaction/upsert)
- **S2**: Add `generateMetadata` to dynamic routes
- **S3**: Import unused metadata builders for `/pyq` and `/pyp`
- **F1–F7**: Frontend performance improvements (next/font, remove Redux, dynamic imports, query defaults, AbortController, SSR)

### Medium Priority
- **A7**: Add compression middleware
- **A9–A15**: Various API server improvements
- **F8–F13**: Frontend performance and UX improvements
- **S8–S12**: SEO and configuration improvements

### Low Priority
- **A16–A19**: Dead deps, unbounded selects, leaderboard, error handler
- **F14–F16**: Minor frontend issues
- **P10, P11**: UI/UX cleanup
