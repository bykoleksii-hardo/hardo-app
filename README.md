# hardo-app

AI-powered Investment Banking mock interview platform.

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Tailwind CSS** for styling
- **Supabase** (Auth + Postgres + RLS)
- Hosted on **Cloudflare Pages**

## Local development

```bash
npm install
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

App runs at http://localhost:3000.

## Deployment

This repo is wired to Cloudflare Pages. Pushes to `main` trigger a build.

Build settings:
- **Framework preset**: Next.js
- **Build command**: `npx @cloudflare/next-on-pages@1`
- **Build output directory**: `.vercel/output/static`

Environment variables (set in Cloudflare Pages dashboard):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (production URL, e.g. https://hardo-app.pages.dev)

## Routes

- `/` — redirects to `/login` or `/interview/setup` based on auth
- `/login` — magic-link sign in
- `/auth/callback` — Supabase OAuth/OTP callback
- `/interview/setup` — choose candidate level (auth required)
- `/interview` — main interview UI (TBD)
- `/profile` — analytics dashboard (TBD)

## Database

See the Supabase project for schema. Key tables:
- `users` (mirrors `auth.users`)
- `questions` (413 classified by candidate_level)
- `case_studies` + `case_study_steps` (20 cases, 126 steps)
- `interviews`, `interview_steps`, `answers`, `evaluations`
- `question_exposure` (anti-repeat tracking)
