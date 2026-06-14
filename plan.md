# System Audit Plan

## Purpose

Systematically audit every feature domain across the full stack (DB → API → Frontend) to:
1. Verify filtering, sorting, and querying logic is correct
2. Eliminate all `any` and `unknown` type escapes
3. Fix stale imports, dead code, and broken references
4. Ensure the auth system (RequireAuthModal) is properly integrated
5. Maintain consistent error handling

---

## Audit Methodology

Each system follows the same 6-step process:

### Step 1: DB Schema (`lib/db/src/schema/<domain>.ts`)
- Check column types match usage
- Verify relations/joins are correct
- Confirm insert/select types are properly exported

### Step 2: API Routes — Public (`src/api-server/src/routes/<domain>.ts`)
- Check filtering logic (WHERE clauses, search params)
- Verify pagination is correct (offset/limit)
- Confirm caching strategy (cache keys, TTL, flush patterns)
- Check error handling (try/catch with next(err))
- Verify response serialization (dates, null handling)

### Step 3: API Routes — Admin (`src/api-server/src/routes/admin/<domain>.ts`)
- Same as Step 2, plus:
- Verify Zod validation schemas match the DB schema
- Check admin activity logging is wired up
- Confirm cache invalidation on mutations

### Step 4: Frontend Views (`src/exam-platform/src/views/<domain>.tsx`)
- Check API integration (query keys, hooks)
- Verify auth gating (RequireAuthModal for actions, not page-level AuthGuard)
- Check loading/empty/error states are all handled
- Verify filtering/search/pagination works end-to-end

### Step 5: Admin Pages (`src/exam-platform/src/app/(admin)/admin/<domain>/page.tsx`)
- Check CRUD operations (create, read, update, delete)
- Verify form validation matches API expectations
- Check cache invalidation on mutations
- Verify Sheet/Dialog patterns are consistent

### Step 6: Type Safety Sweep
- Run `pnpm run typecheck` to catch all TS errors
- Fix any remaining `any` types:
  - `Promise<any>` → remove return type annotation (TS infers from Express types)
  - `cacheGet<any>` → `cacheGet<unknown>` or `cacheGet<unknown[]>`
  - `onError: (err: any)` → `onError: (err: Error)`
  - `payload: any` → `payload: Record<string, unknown>`
  - `as any` casts → proper type assertions or restructuring
- Remove unused imports

---

## Systems to Audit (in suggested order)

| # | System | Priority | Est. Effort |
|---|--------|----------|-------------|
| 1 | ✅ **Announcements** | Done | — |
| 2 | ✅ **Current Affairs** | Done | — |
| 3 | ✅ **Daily Quizzes** | Done | — |
| 4 | ✅ **Mock Tests** | Done | All issues fixed — public API created, type safety resolved, UI enhanced |
| 5 | ✅ **NCERT Books** | Done | — |
| 6 | ✅ **Previous Year Papers (PYP)** | Done | — |
| 7 | ✅ **PYQ** | Done | Audited and fixed — missing questionCount resolved |
| 8 | ✅ **Study Notes** | Done | — |
| 9 | ✅ **Syllabus** | Done | — |
| 10 | ✅ **Support** | Done | Audited and all issues fixed — dead import removed, unnecessary casts eliminated, local type duplication replaced with imports |
| 11 | ✅ **Questions** | Done | Audited and all issues fixed |
| 12 | ✅ **Subjects** | Done | Audited and all issues fixed — GET fields expanded, duplicate slug check on POST, 404 check on DELETE, questionCount cast removed, examCategory & isActive UI added |
| 13 | ✅ **Streaks / Leaderboard** | Done | Audited and all issues fixed — dead streaksApi.get removed, period filtering added to leaderboard (monthly/weekly), activeTab wired to API |
| 14 | ✅ **Exam Sets** | Done | Audited and all issues fixed — 5 minor issues resolved (wrong number IDs in local interface, DELETE 404 check, misleading comment, debounced search, Subject type annotations) |
| 15 | ✅ **Admin Dashboard** | Done | Audited and all issues fixed — dashboard backend enhanced with real aggregate stats, settings page falsy-0 bug fixed, dynamic imports in logAdminActivity replaced with static imports, analytics cache invalidation added |

---

## Common Issues to Watch For

### DB / API
- Missing `isActive` filter on public endpoints
- Wrong sort order (should usually be `desc` by createdAt)
- Missing `limit` on unbounded queries
- `parseInt()` without radix 10
- `Number()` coercion on Drizzle count results (necessary for JSON serialization)

### Frontend
- `AuthGuard` import still present (should use `RequireAuthModal` pattern instead)
- `as any` or `as { customField }` type casts for non-existent DB fields
- Missing `"use client"` directive in components using hooks
- `Link` imported from `lucide-react` instead of `next/link`
- Dead imports after refactoring (e.g., `AuthGuard`, `Link`, phantom `Icon`)

### Type Safety
- `customFetch<any>` → `customFetch<Record<string, unknown>>` or proper response type
- `onError: (err: any)` → `onError: (err: Error)` (React Query error type)
- `Promise<any>` on route handlers → remove annotation (TypeScript infers from Express)
- `payload: any` in mutation functions → `payload: Record<string, unknown>`
- `Record<string, string>` for query params → proper typed interface
