# Issue Log — Streak / Points / Leaderboard Audit (2026-08-24)

Audit of the streak, points, and leaderboard systems across `src/api-server`, `src/exam-platform`, and `lib/db`.
Status legend: `[ ] open · [~] in progress · [x] fixed`

---

## Critical

### C1. Points system is dead — quiz/mock/PYQ activities are never recorded `[x]`
- All four players (`DailyQuizPlayer`, `MockTestPlayer`, `PyqQuestions`, `NcertMcqPlayer`) only called `useSaveAttempt`; `saveAttempt` never touched `user_streaks`; the only frontend trigger was `"login"` worth 0 points.
- **Consequence:** every user's `totalPoints` stayed 0 forever; leaderboard ranked everyone at 0 in arbitrary order; Profile counters always 0.
- **Fix:** rewards are now applied server-side inside `saveAttempt` (`attemptsController.ts`) via shared `streakService.applyUserActivity` — streak day-dedupe, point awarding, quiz/mock/pyq counters. Cannot be faked by client calls.

### C2. PYQ attempts silently never save `[x]`
- `GlobalMcqPlayer.tsx` gated attempt saving to mock/daily only; additionally `student_attempts.quiz_id` was a `uuid` column while PYQ sends subject slugs — inserts would fail once enabled.
- **Fix:** PYQ mode now saves attempts (`GlobalMcqPlayer`); migration `0006_attempts_text_quizid_and_activity_type.sql` converts `quiz_id` uuid→text (lossless) and adds server-set `activity_type` column; each player wrapper passes an explicit `activityType` hint so slugs aren't misread as daily quizzes. NCERT stays practice-only by design.

## High

### H1. Weekly/Monthly leaderboard tabs were misleading `[x]`
- Backend filtered *who* appears by `lastActivityDate` but displayed **all-time** points.
- **Fix:** period boards aggregate real points earned in the period from `student_attempts` (legacy rows classified by their id columns), joined to `user_streaks`, ranked and tie-broken in SQL. UI shows "pts this week / pts this month" captions.

### H2. Ghost streaks never decayed on read `[x]`
- Users inactive for weeks still displayed stale streak flames.
- **Fix:** `effectiveCurrentStreak()` derives display streaks — alive only if last activity was today or yesterday (UTC). Applied to `/streaks/me` and both leaderboard paths.

### H3. Leaderboard `limit` query param unsanitized `[x]`
- `?limit=abc` → NaN → 500; `?limit=-1` → Postgres error → 500.
- **Fix:** `sanitizeLimit()` integer-parses, clamps into [1,50], falls back to 20 on garbage (incl. empty string).

### H4. Ties ranked arbitrarily `[x]`
- Sort was `total_points DESC` only.
- **Fix:** deterministic ordering: points desc → currentStreak desc → longestStreak desc → createdAt asc (oldest account wins ties).

### H5. UI advertised points that don't exist `[x]`
- Leaderboard legend showed a "+20 pts Daily streak bonus" that never existed.
- **Fix:** legend now states truthful sources: daily quiz +5, mock +50, PYQ set +3, daily login builds streak (+1 day).

## Medium

### M1. Same-day point farming via direct API calls `[x]`
- Points were awarded on every bare `POST /streaks/activity`; client-supplied display names allowed impersonation.
- **Fix:** `/streaks/activity` is login-only now (400 otherwise) — rewarded activities flow exclusively through verified attempt saves; first-completion-per-item dedupe via `hasPriorAttemptForRef` (retakes keep streak credit, earn no repeat points); display names sanitized (`sanitizeDisplayName`: trim, collapse whitespace, control chars stripped, ≤40 chars).

### M2. Mixed timezones in period boundaries `[x]`
- Activity dates were UTC but week/month boundaries used server-local time — off-by-one-day risk on non-UTC servers.
- **Fix:** `weekStartUtcStr`/`monthStartUtcStr` compute pure UTC boundaries; covered by unit tests incl. year rollover.

### M3. Double login POST on every visit `[x]`
- `StreakInitializer` (providers, every load) + `StreakTracker` (AppLayout, daily) both posted.
- **Fix:** `StreakInitializer` deleted; `StreakTracker` is the single owner of login recording (once/day per browser via localStorage).

### M4. React key collisions in leaderboard list `[x]`
- Rows keyed `displayName + rank`; duplicate names collided.
- **Fix:** keyed by `rank` (unique per response).

## Low

### L1. Toast read "+0 points earned today" on login streaks `[x]`
- Now shows "Come back tomorrow to keep it alive!" when no points were earned.

### L2. `?period=garbage` silently treated as all-time `[x]`
- Whitelist enforced: `allTime | weekly | monthly` (plus undefined); anything else → 400.

### L3. No behavioral tests `[x]`
- Added `src/api-server/src/__tests__/services/streakMath.test.ts` — 31 unit tests covering streak transitions, ghost-streak decay, limit/display-name sanitizers, UTC week/month math, attempt classification, reward refs, and the points table. Pure logic extracted into `services/streakMath.ts` (no DB imports) so tests need no database. `"test": "vitest run"` added to api-server package.json.

---

## Regression found during rollout (2026-08-24) — fixed `[x]`

### R1. Every attempt earned 0 points (dedupe self-match) `[x]`
- `saveAttempt` inserted the attempt row **before** checking `hasPriorAttemptForRef`, so the query matched the row it had just written inside the same transaction — every play read as a retake and awarded 0 points.
- **Fix:** dedupe check moved before the insert (`hasPriorRewardForRef`), and it now only counts reward-era attempts (`activity_type IS NOT NULL`), so legacy pre-feature attempts can never block future earnings either.
- Affected rows retro-credited manually (+10 pts for the two blocked daily quizzes on 2026-08-24).

### R2. Profile/points UI stayed stale after playing `[x]`
- Nothing invalidated the React Query caches when an attempt was saved server-side (the deleted StreakInitializer had been the only invalidator).
- **Fix:** `useSaveAttempt` now invalidates `streaks.current`, `attempts.mine`, and `stats.leaderboard` caches on success; `useTokenizedMutation` supports `onSuccess`/`onError` passthrough.

---

## Verified working (no action needed)
- Core streak math: new user = 1; consecutive UTC day = +1; gap ≥ 2 days = reset to 1; same-day repeat = no double-increment.
- Race safety: transaction + `SELECT … FOR UPDATE` + `onConflictDoNothing` + lost-race re-select.
- `longestStreak` via `Math.max`.
- Auth enforced on `/streaks/me` and `/streaks/activity`; `/leaderboard` public by design.
- Indexes support the queries (`user_streaks_total_points_idx`, unique `user_id`, new `attempts_user_attempted_idx`).

## Follow-ups (out of scope)
- Historical attempts are not backfilled into `user_streaks.total_points` (all-time totals start accruing from deploy; weekly/monthly boards do include legacy attempts via fallback classification).
- NCERT MCQ sets remain practice-only (no points advertised, none awarded).
- Consider Clerk Backend API as authoritative source for display names instead of sanitized client input.
- Pre-existing unrelated failures in `admin/subjectsController.test.ts`, `admin/questionsController.test.ts`, and `routes.test.ts` (mock/assertion drift + missing DATABASE_URL in test env) — verified broken before these changes.

## Deployment notes
1. Apply `lib/db/drizzle/0006_attempts_text_quizid_and_activity_type.sql` (or `pnpm --filter @workspace/db push`). Lossless: uuid→text widening + nullable column + `IF NOT EXISTS` indexes.
2. Rebuild db project declarations before api-server typecheck: `pnpm run typecheck:libs` at repo root.
