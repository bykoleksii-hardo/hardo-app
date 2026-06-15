-- Per-question answer keys: `key_points` (the must-hit points a strong answer
-- covers — used to ground the grader's correctness and to show the candidate
-- "what a strong answer covers") and `model_answer` (an exemplary answer shown
-- on the scorecard after the interview). Both nullable; the app tolerates their
-- absence, and they are populated by scripts/generate-answer-keys.ts (AI draft)
-- then curated in admin.
-- (Renamed from 2026_18_question_answer_keys.sql to a timestamp version so the
-- Supabase GitHub integration applies it.)
alter table public.questions
  add column if not exists key_points jsonb,
  add column if not exists model_answer text;
