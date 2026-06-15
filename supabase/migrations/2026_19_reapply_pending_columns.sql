-- Trigger migration: re-applies the columns from 2026_17 and 2026_18 so the
-- Supabase GitHub integration picks them up. The previous two migration files
-- were already in main before the integration was enabled, so they were never
-- run against production. Every statement is idempotent (if not exists), so
-- this is a no-op if the columns already exist.
alter table public.interview_steps
  add column if not exists delivery_metrics jsonb;

alter table public.questions
  add column if not exists key_points jsonb,
  add column if not exists model_answer text;
