# AI_RULES.md

## Tech Stack (5‑10 bullet points)

- **Next.js 15** (App Router) + **React 19** + **TypeScript** – primary framework for the web application.  
- **Tailwind CSS v4** – utility‑first CSS framework for all UI styling and responsive layouts.  
- **TanStack Query (React Query)** – data fetching, caching, and synchronization layer for API calls.  
- **Clerk** – authentication and user management (frontend sign‑in, session handling, and backend token verification).  
- **Express 5** (Node.js) – REST API server that delegates to the Drizzle ORM layer.  
- **Drizzle ORM** + **PostgreSQL** – type‑safe database access and migrations.  
- **Cloudinary** – external CDN for storing and delivering PDFs, images, and other static assets.  
- **Redux Toolkit** – global UI state management (e.g., selected questions, admin panels).  
- **Lucide React** – icon library for consistent UI symbols across the app.  
- **pnpm workspaces** – monorepo structure for shared libraries (`@workspace/*`) and zero‑install dependency linking.  

## Library Usage Rules

- **UI Components** – always build reusable components in `src/components/`.  
  - Use **Tailwind CSS** classes exclusively for layout, spacing, colors, and typography.  
  - Do **not** add custom CSS files; rely on Tailwind utilities.  

- **Data Fetching** – all API interactions must go through **TanStack Query** (`useQuery`, `useMutation`).  
  - Prefer the local API facade in `src/exam-platform/src/lib/api` for browser requests; keep direct `fetch` usage centralized there.  

- **Authentication** – all protected routes must use **Clerk** (`useUser`, `useAuth`) and the `clerkMiddleware` on the server.  
  - Front‑end: use `useClerk` and `useSession`.  
  - Backend: verify the `sessionToken` passed from the client; never store tokens in localStorage.  

- **State Management** – use **Redux Toolkit** (`createSlice`, `createAsyncThunk`) for global UI state (e.g., admin sidebar, selected items).  

- **Icons** – use **Lucide React** for all UI icons; keep them consistent across the app.  

- **Monorepo Structure** – shared libraries live under `lib/` (`@workspace/db`, etc.), while the front-end API facade now lives under `src/exam-platform/src/lib/api`.  
  - Do **not** edit files in `lib/` directly unless instructed; generate them via Orval if needed.  

- **Package Management** – use **pnpm** workspaces for zero‑install dependency linking.  
  - Do not manually run `npm install` in root; use `pnpm install` at the root level.  
  - When adding a new package, use `<dyad-add-dependency packages="package_name">` to register it.  

- **Testing & Build** – run `pnpm run dev` (or `pnpm -r run dev`) to start dev servers; `pnpm run build` to produce production builds.    - Always run `pnpm run typecheck` before committing to ensure type safety.  - **Environment Variables** – all secrets (e.g., `CLERK_SECRET_KEY`, `DATABASE_URL`, Cloudinary credentials) must be stored in `.env` and referenced via `process.env`.  
  - Do **not** hard‑code secrets in source files.  

- **Deployment** – the front‑end runs on port 3000 (Next.js), the API server on port 4000 (Express).  
  - Ensure `NEXT_PUBLIC_API_URL` points to the correct backend URL.  
  - All environment variables must be defined in `.env` at the repository root.  

---  

*These rules are intended to keep the codebase consistent, maintainable, and secure. Any deviation must be approved by the core development team.*
