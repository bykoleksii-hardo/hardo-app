# Hardo App

AI-powered Investment Banking mock interview platform.

## Stack
- Next.js 15 (App Router) on Cloudflare Workers via @opennextjs/cloudflare
- Supabase (Postgres + Auth, Magic Link)
- TailwindCSS

## Local dev
```bash
npm install
cp .env.example .env.local
# fill NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

## Deploy
Auto-deploy via Cloudflare Workers Builds on push to `main`.

Build command: `npx opennextjs-cloudflare build`
Deploy command: `npx wrangler deploy`

Required env vars (set in Cloudflare dashboard):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (e.g. https://hardo-app.workers.dev)

## Auth flow
Magic Link only (MVP). After login, redirects to `/interview/setup`.
