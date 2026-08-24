# DOX framework

- DOX is highly performant AGENTS.md hierarchy installed here
- Agent must follow DOX instructions across any edits

## Core Contract

- AGENTS.md files are binding work contracts for their subtrees
- Work products, source materials, instructions, records, assets, and durable docs must stay understandable from the nearest applicable AGENTS.md plus every parent AGENTS.md above it

## Read Before Editing

1. Read the root AGENTS.md
2. Identify every file or folder you expect to touch
3. Walk from the repository root to each target path
4. Read every AGENTS.md found along each route
5. If a parent AGENTS.md lists a child AGENTS.md whose scope contains the path, read that child and continue from there
6. Use the nearest AGENTS.md as the local contract and parent docs for repo-wide rules
7. If docs conflict, the closer doc controls local work details, but no child doc may weaken DOX

Do not rely on memory. Re-read the applicable DOX chain in the current session before editing.

## Update After Editing

Every meaningful change requires a DOX pass before the task is done.

Update the closest owning AGENTS.md when a change affects:

- purpose, scope, ownership, or responsibilities
- durable structure, contracts, workflows, or operating rules
- required inputs, outputs, permissions, constraints, side effects, or artifacts
- user preferences about behavior, communication, process, organization, or quality
- AGENTS.md creation, deletion, move, rename, or index contents

Update parent docs when parent-level structure, ownership, workflow, or child index changes. Update child docs when parent changes alter local rules. Remove stale or contradictory text immediately. Small edits that do not change behavior or contracts may leave docs unchanged, but the DOX pass still must happen.

## Hierarchy

- Root AGENTS.md is the DOX rail: project-wide instructions, global preferences, durable workflow rules, and the top-level Child DOX Index
- Child AGENTS.md files own domain-specific instructions and their own Child DOX Index
- Each parent explains what its direct children cover and what stays owned by the parent
- The closer a doc is to the work, the more specific and practical it must be

## Child Doc Shape

- Create a child AGENTS.md when a folder becomes a durable boundary with its own purpose, rules, responsibilities, workflow, materials, or quality standards
- Work Guidance must reflect the current standards of the project or user instructions; if there are no specific standards or instructions yet, leave it empty
- Verification must reflect an existing check; if no verification framework exists yet, leave it empty and update it when one exists

Default section order:
- Purpose
- Ownership
- Local Contracts
- Work Guidance
- Verification
- Child DOX Index

## Style

- Keep docs concise, current, and operational
- Document stable contracts, not diary entries
- Put broad rules in parent docs and concrete details in child docs
- Prefer direct bullets with explicit names
- Do not duplicate rules across many files unless each scope needs a local version
- Delete stale notes instead of explaining history
- Trim obvious statements, repeated rules, misplaced detail, and warnings for risks that no longer exist

## Closeout

1. Re-check changed paths against the DOX chain
2. Update nearest owning docs and any affected parents or children
3. Refresh every affected Child DOX Index
4. Remove stale or contradictory text
5. Run existing verification when relevant
6. Report any docs intentionally left unchanged and why

## User Preferences

When the user requests a durable behavior change, record it here or in the relevant child AGENTS.md

## Child DOX Index

### lib/db/ — Database Layer
- **Purpose**: Drizzle ORM schema definitions, migrations, and DB instance
- **Ownership**: All schema files (schema/*.ts), migration files, drizzle.config.ts
- **Key files**: src/index.ts (DB instance), src/schema/index.ts (re-exports), drizzle.config.ts
- **Index convention**: Tables use inline `(t) => [...]` index definitions. Columns used in WHERE/ORDER BY/GIN queries must have indexes. Unique constraints (`.unique()`) create implicit indexes — no separate index needed.
- **Schema contracts**: `student_attempts.quiz_id` is TEXT (not uuid) — PYQ stores subject slugs and NCERT stores set ids there; `student_attempts.activity_type` is server-set ('quiz'|'mock'|'pyq'), never trusted from clients for ranking math.
- **Child AGENTS.md**: Not created yet — all DB concerns managed from root

### src/api-server/ — Express API Server
- **Purpose**: Express server exposing JSON routes for all platform features
- **Ownership**: Routes (src/routes/), middleware (src/middleware/), config (src/config/), services (src/services/), utils (src/utils/)
- **Key files**: src/app.ts (Express setup), src/index.ts (entry point), src/routes/index.ts (router), src/config/env.ts (env schema)
- **Type safety**: All controllers use typed table references (no `any` casts). QuestionRefEntry/SubjectRefEntry patterns for dynamic column access.
- **Streaks/points contract**: All streak and point logic lives in src/services/streakMath.ts (pure, unit-tested) + streakService.ts (DB application). Rewards are recorded server-side inside POST /attempts only; POST /streaks/activity accepts "login" exclusively. Leaderboard period boards aggregate verified attempts.
- **Verification**: `pnpm test` (vitest) — pure-helper suites in src/__tests__/services must pass with no DATABASE_URL; admin/routes suites have pre-existing failures (see issue.md).
- **Child AGENTS.md**: Not created yet — all API concerns managed from root

### src/exam-platform/ — Next.js Frontend
- **Purpose**: Next.js 15 app with Clerk auth, Redux Toolkit, React Query, Tailwind CSS
- **Ownership**: Views (src/views/), components (src/components/), app routes (src/app/), API hooks (src/lib/api/), store (src/store/)
- **Key files**: src/app/layout.tsx (root layout), src/app/providers.tsx (providers), src/lib/api/index.ts (API hooks), src/lib/types/api.ts (types)
- **Routing pattern**: Features with a player use `/[feature]/[id]/play` for the player route (e.g., daily-quiz, mock-tests). The detail/instructions page is at `/[feature]/[id]` and the listing at `/[feature]`.
- **SEO**: `lib/seo.ts` exports `buildMetadata()` factory and per-page metadata objects. Homepage uses `export const metadata = homeMetadata`. `sitemap.ts` generates static sitemap. OG image: `public/opengraph.jpg`.
- **File upload contract**: All multipart uploads (FormData) MUST go through `adminFetch`/`apiFetch` (direct to `NEXT_PUBLIC_API_URL`). Never raw-fetch relative `/api/...` paths — those proxy through the Next.js rewrite, and the Vercel function body cap (~4.5MB) rejects large PDFs before Express sees them. `apiFetch` already skips Content-Type for FormData so the browser sets the multipart boundary. Requires frontend origin in api-server `ALLOWED_ORIGINS` (CORS).
- **Effective upload size ceiling**: multer allows 50MB, but Cloudinary's account plan caps raw files (10MB on free tier) and rejects with "File size too large". `uploadToCloudinary` maps that to `AppError(413)` with a clear message; admin UI labels show the current plan limit. Raising the ceiling requires a Cloudinary plan upgrade, not code changes.
- **Type safety**: `ApiError.body` is `unknown` — cast with specific interfaces, not `as any`.
- **Child AGENTS.md**: Not created yet — all frontend concerns managed from root

### scripts/ — Utility Scripts
- **Purpose**: Misc CLI utilities and git hooks
- **Ownership**: All scripts in src/
- **Child AGENTS.md**: Not created yet

### Child AGENTS.md Creation Guidance
Child AGENTS.md files should be created when a folder develops:
- Complex domain rules not clear from the code alone
- Strict contracts or workflows needing documentation
- Verification steps that must be run before/after edits

Currently the root AGENTS.md covers all project-level rules. Each sub-package has its own package.json with scripts, and plan.md + TODO.md serve as the audit trail.
