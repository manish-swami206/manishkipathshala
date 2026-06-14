# Exam Platform - Full Stack Application

A comprehensive exam preparation platform built with Next.js 15, Express, PostgreSQL, and Drizzle ORM. Features include NCERT books, previous year papers (PYP/PYQ), daily quizzes, mock tests, current affairs, study notes, syllabus guides, a leaderboard, and a multi-conversation support system.

## Architecture Overview

### Port Assignments

- **Frontend:** `http://localhost:3000` (Next.js 16 App Router)
- **Backend API:** `http://localhost:4000` (Express 5 server)
- **Database:** PostgreSQL (configured via `DATABASE_URL` env var)

### Technology Stack

| Layer        | Technology                                                       |
| ------------ | ---------------------------------------------------------------- |
| Frontend     | Next.js 15, React 19, TypeScript, Tailwind CSS v4, Framer Motion |
| State        | Redux Toolkit, TanStack Query (React Query v5)                   |
| Auth         | Clerk (Next.js + Express SDK)                                    |
| UI Kit       | shadcn/ui (Radix primitives + Tailwind)                          |
| Backend      | Express 5, TypeScript, Drizzle ORM                               |
| Database     | PostgreSQL                                                       |
| File Storage | Cloudinary (PDFs, docs)                                          |
| Validation   | Zod (runtime + API)                                              |
| Icons        | Lucide React                                                     |

## Project Structure

```
Exam-platform/
├── src/
│   ├── api-server/           ← Express API server (port 4000)
│   │   ├── src/
│   │   │   ├── config/       ← Cloudinary, env validation
│   │   │   ├── middleware/   ← Auth (Clerk), rate limiting, file upload
│   │   │   ├── routes/       ← API endpoints (public + admin)
│   │   │   └── lib/          ← DB client, cache, logger, route params
│   │   └── package.json
│   └── exam-platform/        ← Next.js frontend (port 8080)
│       ├── src/
│       │   ├── app/          ← Next.js App Router (admin + public routes)
│       │   ├── components/   ← UI components (admin/, layout/, shared/, ui/)
│       │   ├── views/        ← Page-level view components
│       │   ├── lib/          ← API client, types, utils, data constants
│       │   ├── store/        ← Redux Toolkit slices
│       │   └── hooks/        ← Custom React hooks
│       └── package.json
├── lib/
│   ├── db/                   ← Drizzle ORM schema & client
│   │   ├── src/schema/       ← Table definitions (domain files)
│   │   └── drizzle.config.ts ← Migration config
│   └── api-zod/              ← Generated Zod validation schemas
├── scripts/                  ← Utility scripts (CI, post-merge)
├── docs/                     ← Design notes, demo data
├── .env.example              ← Environment variable template
├── AGENTS.md                 ← AI coding assistant guide
├── AI_RULES.md               ← AI behavior rules
└── CLAUDE.md                 ← Claude-specific config
```

## Quick Start

### Prerequisites

- Node.js 18+ with pnpm (`npm i -g pnpm`)
- PostgreSQL database (local or cloud)
- Clerk account (free tier)
- Cloudinary account (free tier)

### Setup

```bash
# 1. Clone and enter repo
git clone <repo-url>
cd Exam-platform

# 2. Install dependencies
pnpm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your credentials (see Environment Variables below)

# 4. Apply database schema
pnpm -C lib/db run push

# 5. Start development servers
# Terminal 1: API Server
pnpm -C src/api-server run dev

# Terminal 2: Frontend
pnpm -C src/exam-platform run dev
```

### Environment Variables

| Variable                            | Required | Default                 | Description                    |
| ----------------------------------- | -------- | ----------------------- | ------------------------------ |
| `DATABASE_URL`                      | ✓        | —                       | PostgreSQL connection string   |
| `CLERK_SECRET_KEY`                  | ✓        | —                       | Clerk backend secret key       |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | ✓        | —                       | Clerk frontend publishable key |
| `CLOUDINARY_CLOUD_NAME`             | ✓        | —                       | Cloudinary cloud name          |
| `CLOUDINARY_API_KEY`                | ✓        | —                       | Cloudinary API key             |
| `CLOUDINARY_API_SECRET`             | ✓        | —                       | Cloudinary API secret          |
| `API_PORT`                          | —        | `4000`                  | Express server port            |
| `NODE_ENV`                          | —        | `development`           | Environment mode               |
| `ALLOWED_ORIGINS`                   | —        | —                       | CORS origins (comma-separated) |
| `NEXT_PUBLIC_API_URL`               | —        | `http://localhost:4000` | API base URL for frontend      |

## Features

> **Auth Model:** All pages are open to everyone. Auth-gated actions (starting a quiz, mock test, sending a support message, downloading a document) show a sign-in modal via the global `RequireAuthModal` component and `useRequireAuth()` hook. There is no page-level redirect — the modal appears on the action.

### All Pages — Open to Everyone

| Page                           | Route                   | Description                                        |
| ------------------------------ | ----------------------- | -------------------------------------------------- |
| Home                           | `/`                     | Feature grid, announcements, banners               |
| Current Affairs                | `/current-affairs`      | Daily news articles with pagination                |
| Study Notes                    | `/study-notes`          | Subject-wise study material                        |
| NCERT Books                    | `/ncert-books`          | Browse/download NCERT textbooks by class & subject |
| Previous Year Papers           | `/pyp`                  | Access/download exam papers & answer keys          |
| Syllabus                       | `/syllabus`             | Exam syllabus guides with download links           |
| Leaderboard                    | `/leaderboard`          | Top aspirants ranking with points & streaks        |
| Support                        | `/support`              | Multi-conversation support tickets & chat          |
| Daily Quiz                     | `/daily-quiz`           | Daily MCQ quizzes with timer & scoring             |
| Quiz Player                    | `/daily-quiz/[id]/play` | Full-screen quiz interface with palette            |
| PYQ Practice                   | `/pyq`                  | Previous year questions by subject                 |
| NCERT MCQs                     | `/ncert-mcq`            | NCERT-based MCQ practice                           |
| Mock Tests                     | `/mock-tests`           | Full-length mock exam listing                      |
| Mock Test Detail                | `/mock-tests/[id]`       | Mock test details & instructions                   |
| Mock Test Player                | `/mock-tests/[id]/play`  | Full-screen mock exam player with timer & palette  |
| Profile                        | `/profile`              | User stats, streak, settings                       |
| About, Contact, Privacy, Terms | Various                 | Static information pages                           |

### Admin Panel (`/admin`) — Clerk Admin Role Required

| Page            | Description                                      |
| --------------- | ------------------------------------------------ |
| Dashboard       | Overview stats, charts, recent activity          |
| Questions       | CRUD + bulk upload/delete questions              |
| Exams           | Manage full exams with question assignment       |
| Exam Sets       | PYQ/NCERT question set management                |
| Daily Quizzes   | Schedule and manage daily quizzes                |
| Students        | View student attempts and activity               |
| Subjects        | Manage subject categories                        |
| Current Affairs | CRUD for current affairs articles                |
| Study Notes     | CRUD for study notes with URL                    |
| NCERT Books     | CRUD for NCERT book entries                      |
| PYP Papers      | CRUD for previous year paper entries             |
| Syllabus        | CRUD for syllabus guides                         |
| Mock Tests      | CRUD for mock test configurations                |
| Announcements   | Create/manage notification banners               |
| Support Tickets | Chat-like ticket management with status & assign |
| Analytics       | Charts and data visualization                    |
| Activity Logs   | Track all admin actions                          |

## Key Features Detail

### Support System (Multi-Conversation)

- Users can create multiple support tickets (conversations)
- Real-time chat interface with user/support message bubbles
- Soft-delete for users (admin still sees deleted tickets)
- Read/unread tracking for both users and admins
- Notification polling: unread badge in header (30s interval for users, 30s for admin)
- Admin: status management (open/pending/resolved/closed), assignment, detailed thread view

### Quiz System

- Full-screen player with question palette sidebar
- Timer with auto-submit on expiry
- Negative marking support
- Explanation display after submission
- Share functionality

### Streaks & Leaderboard

- Daily activity tracking with streak counts
- Points system: +5 per quiz question, +50 per mock test, +3 per PYQ, +20 daily streak bonus
- Podium display for top 3, detailed rankings for others
- Three leaderboard tabs (All Time, Monthly, Weekly)

### Bulk Question Upload

- Admin can upload questions via JSON array to `POST /admin/questions/bulk-upload`
- A demo CSV file is available at `docs/demo-bulk-questions.csv` with sample questions
- Supported question types: quiz, pyq, ncert, mock
- Each question requires: type, text, optionA-D, correctIndex, and optional: explanation, subject, difficulty, chapter, tags, marks, negativeMarking

## API Endpoints

### Public Endpoints

| Method | Path                                | Description                  |
| ------ | ----------------------------------- | ---------------------------- |
| GET    | `/api/health`                       | Health check                 |
| GET    | `/api/announcements`                | List announcements           |
| GET    | `/api/current-affairs`              | Paginated current affairs    |
| GET    | `/api/study-notes`                  | Study notes with filters     |
| GET    | `/api/ncert-books`                  | NCERT books by class/subject |
| GET    | `/api/pyp`                          | Previous year papers         |
| GET    | `/api/mock-tests`                   | List mock tests              |
| GET    | `/api/quizzes`                      | List quizzes                 |
| GET    | `/api/syllabus`                     | Syllabus guides              |
| GET    | `/api/pyq/questions`                | PYQ questions by subject     |
| GET    | `/api/exam-sets`                    | PYQ/NCERT question sets      |
| GET    | `/api/support/tickets`              | User's support tickets       |
| POST   | `/api/support/tickets`              | Create support ticket        |
| POST   | `/api/support/tickets/:id/messages` | Send message                 |
| DELETE | `/api/support/tickets/:id`          | Soft-delete ticket           |
| GET    | `/api/support/unread-count`         | User unread reply count      |
| GET    | `/api/streaks/me`                   | Current user streak          |
| POST   | `/api/streaks/activity`             | Record activity              |
| GET    | `/api/leaderboard`                  | Leaderboard rankings         |

### Admin Endpoints (require Clerk admin role)

| Method                | Path                                      | Description                                   |
| --------------------- | ----------------------------------------- | --------------------------------------------- |
| GET                   | `/api/admin/dashboard`                    | Dashboard stats                               |
| GET/POST/PATCH/DELETE | `/api/admin/questions`                    | Question CRUD                                 |
| POST                  | `/api/admin/questions/bulk-upload`        | Bulk question upload                          |
| GET/POST              | `/api/admin/exam-sets`                    | Exam set management                           |
| GET                   | `/api/admin/support-tickets`              | All tickets (incl. deleted)                   |
| POST                  | `/api/admin/support-tickets/:id/replies`  | Admin reply                                   |
| GET                   | `/api/admin/support-tickets/unread-count` | Admin unread count                            |
| GET/POST/PATCH/DELETE | `/api/admin/current-affairs`              | Current affairs CRUD                          |
| GET/POST/PATCH/DELETE | `/api/admin/study-notes`                  | Study notes CRUD                              |
| ...                   | ...                                       | All admin CRUD routes follow similar patterns |

## Development Commands

```bash
# Install / update dependencies
pnpm install

# Type check (all packages)
pnpm run typecheck

# Build all packages
pnpm run build

# Run API server
pnpm -C src/api-server run dev

# Run frontend
pnpm -C src/exam-platform run dev

# Apply DB migrations
pnpm -C lib/db run push

# Run tests (no test framework configured yet — coming soon)
pnpm -C src/exam-platform run test
```

## Database Schema

The project uses Drizzle ORM with PostgreSQL. Schema files are in `lib/db/src/schema/`:

- `admin.ts` — exams, exam_questions, student_attempts, activity_logs
- `announcements.ts` — notifications/banners
- `currentAffairs.ts` — daily news articles
- `dailyQuiz.ts` — scheduled daily quizzes
- `exams.ts` — question sets for PYQ/NCERT
- `fileStorage.ts` — NCERT PDFs and PYP PDFs (Cloudinary)
- `mockTests.ts` — mock test configurations
- `ncert.ts` — NCERT book metadata
- `papers.ts` — previous year paper metadata
- `quizzes.ts` — quizzes and questions
- `streaks.ts` — user streaks and points
- `studyNotes.ts` — study note entries
- `subjects.ts` — subject categories
- `support.ts` — support tickets and messages (multi-conversation)
- `syllabus.ts` — exam syllabus guides

## UI Component Library

All UI components are built using **shadcn/ui** (Radix UI primitives + Tailwind CSS):

- Available components in `src/exam-platform/src/components/ui/`:
  - `button.tsx`, `card.tsx`, `input.tsx`, `textarea.tsx`, `select.tsx`
  - `dialog.tsx`, `sheet.tsx`, `popover.tsx`, `alert-dialog.tsx`
  - `badge.tsx`, `avatar.tsx`, `skeleton.tsx`, `separator.tsx`
  - `table.tsx`, `tabs.tsx`, `toggle.tsx`, `toggle-group.tsx`
  - `form.tsx`, `label.tsx`, `toast.tsx`, `sonner.tsx`
  - `dropdown-menu.tsx`, `context-menu.tsx`, `breadcrumb.tsx`
  - `accordion.tsx`, `calendar.tsx`, `carousel.tsx`, `chart.tsx`
  - And more...

## Cloudinary Setup

1. Sign up at [cloudinary.com](https://cloudinary.com) (free tier)
2. Get credentials from Dashboard → Settings → API Keys
3. Add to `.env`: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
4. Files are auto-organized in folders: `exam-platform/ncert/` and `exam-platform/pyp/`

## Security

- **Helmet** — Secure HTTP headers (CSP, X-Frame-Options)
- **CORS** — Restricted to configured origins
- **Rate Limiting** — Global: 200 req/15min, Auth: 20 req/15min
- **Zod Validation** — All API inputs validated at runtime
- **Clerk Auth** — JWT-based session management
- **RequireAuthModal** — Global context provider + `useRequireAuth()` hook. Shows a sign-in modal when unauthenticated users try to perform gated actions (document downloads, quiz starts, support messages). No page-level redirect.
- **Next.js Middleware** (`proxy.ts`) — Only `/admin(.*)` routes protected at the middleware level. All other pages are open.
- **Admin Role** — Checked via Clerk public metadata (`role: "admin"`)

## Troubleshooting

| Issue                   | Solution                                                               |
| ----------------------- | ---------------------------------------------------------------------- |
| API connection failed   | Ensure `NEXT_PUBLIC_API_URL` matches running API server port           |
| Cloudinary upload fails | Verify credentials, file < 50MB, PDF/DOCX only                         |
| DB connection error     | Check `DATABASE_URL`, ensure PostgreSQL is running                     |
| TypeScript errors       | Run `pnpm run typecheck` and fix; clear `.tsbuildinfo` if stale        |
| Clerk not working       | Verify both `CLERK_SECRET_KEY` and `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` |

## Performance

- TanStack Query: Automatic caching, background refetching, stale management
- Cloudinary CDN: Global delivery with automatic optimization
- Incremental TypeScript builds with project references
- Server-side pagination on all list endpoints

## License

MIT

## Support

For issues or feature requests, open a GitHub issue or use the in-app support chat at `/support`.
