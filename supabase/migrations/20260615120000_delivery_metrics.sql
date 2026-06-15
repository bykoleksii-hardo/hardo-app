-- Voice delivery metrics per interview step (pace/WPM, filler words, long
-- pauses, hedging), computed deterministically from STT word timestamps.
-- Nullable: text-mode answers and legacy rows leave it null. Read/written
-- best-effort by /api/interview/turn, so the app keeps working whether or not
-- this column exists yet.
-- (Renamed from 2026_17_delivery_metrics.sql to a timestamp version so the
-- Supabase GitHub integration applies it; the 2026_NN name sorted below the
-- baseline migration version and was silently skipped.)
alter table public.interview_steps
  add column if not exists delivery_metrics jsonb;
