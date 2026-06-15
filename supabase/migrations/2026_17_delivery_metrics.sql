-- Voice delivery metrics per interview step (pace/WPM, filler words, long
-- pauses, hedging), computed deterministically from STT word timestamps.
-- Nullable: text-mode answers and legacy rows leave it null. Read/written
-- best-effort by /api/interview/turn, so the app keeps working whether or not
-- this column exists yet.
alter table public.interview_steps
  add column if not exists delivery_metrics jsonb;
