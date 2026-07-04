# Engineering Decision Log — Acowale CRM Machine Test by Sachin Rana

### 1. Why did you choose this technology stack?
Next.js (App Router) with TypeScript and Tailwind CSS. One framework for both frontend and backend meant a single repo, single deploy target, and API routes living right next to the pages that call them — no separate backend server to stand up, configure, or deploy independently. Given the 6–10 hour window, minimizing moving parts mattered more than architectural purity.

### 2. Why did you choose this database?
Supabase (hosted Postgres). It gave me a production-grade relational database with zero infrastructure setup — table creation, Row Level Security, and a typed client were all available within minutes of signing up. Postgres also made the analytics queries (category grouping, date-based trends) straightforward with plain SQL rather than needing an aggregation pipeline.

### 3. Why did you structure your application this way?
Public form and admin dashboard as separate routes (`/` and `/admin`) sharing one Next.js app, with all backend logic under `/app/api/*` as isolated route handlers (`feedback`, `analytics`, `health`, `seed`). This kept concerns cleanly separated — client validation in the UI, a second layer of server-side validation in the API routes, and all persistence logic isolated in `lib/supabase.ts` and `lib/db.ts` so the API routes stay thin.

### 4. What trade-offs did you make due to time constraints?
- No authentication layer on `/admin` — it's openly accessible at the deployed URL. This wasn't in the core requirements (only listed under optional bonus points), so I prioritized the required feedback/analytics functionality first.
- Row Level Security policies on the `feedback` table are permissive (anon read/insert/update/delete) rather than scoped to an authenticated role, since there's no auth system yet.
- Rate limiting is implemented in-memory rather than with a persistent store like Redis — functionally correct for a single-instance demo, but resets on server restart and won't hold consistent state across multiple serverless instances in production.
- No automated test suite — all verification was manual, end-to-end, against the live Supabase database.

### 5. What would you improve if you had one more week?
Add Supabase Auth to gate the admin dashboard behind a real login, tighten RLS policies to require an authenticated admin role for writes/deletes, move rate limiting to a durable store (Upstash Redis works well with Vercel), add a proper test suite (unit tests for validation logic, integration tests for the API routes), and set up basic CI so `npm run build` and tests run automatically on push.

### 6. What was the most difficult technical challenge you faced?
Getting TypeScript to correctly infer table types from Supabase's `.from('tableName')` calls. Passing a `Database` generic into `createClient` requires matching a very specific internal type shape, and mismatches produced confusing compiler errors. The fix was to drop the generic and instead define and use my own typed interfaces (`Feedback`, etc.) to type the Supabase responses manually — less "automatic" but far more predictable.

### 7. Which AI tools did you use?
Claude and Gemini for architecture planning and code review, and an agentic coding assistant (Antigravity, running Claude) for implementation — writing the API routes, Supabase integration, validation, and rate-limiting logic.

### 8. Share one instance where AI helped you.
The TypeScript/Supabase typing issue above — the agent correctly diagnosed that the generic constraint mismatch was the root cause across several seemingly unrelated compile errors, and proposed the manual-interface workaround instead of me spending hours chasing each error individually.

### 9. Share one instance where you disagreed with AI and why.
The task PDF explicitly states the provided reference UI images are for inspiration only and asks candidates not to replicate them exactly. Rather than instructing the AI to clone the reference screenshots pixel-for-pixel, I asked for a UI that matched the same layout logic and information hierarchy while being visually distinct, in line with what the brief actually asked for.

### 10. What would break first if this application suddenly had 100,000 users?
The in-memory rate limiter — it's scoped to a single server instance's memory, so on Vercel's serverless model (multiple concurrent instances, cold starts) it wouldn't enforce limits consistently, and would reset constantly. Right behind that, Supabase's free-tier connection pool would become a bottleneck without connection pooling (e.g. PgBouncer/Supavisor) properly configured for high concurrency.

### 11. What is one thing in this assignment that you would improve, change, or challenge?
[Add your own honest take here — e.g. clearer guidance up front on whether auth is expected as part of the core scope vs. bonus, since it affects several other decisions like RLS design.]