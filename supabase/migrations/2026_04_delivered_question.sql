-- 2026_04: store the AI-rephrased question text shown to the candidate.
-- delivered_question is the persona/level-adjusted version of the raw question.
-- Reader fallback chain: COALESCE(delivered_question, custom_question, questions.question).
-- NULL for legacy rows or when AI rephrasing is skipped (e.g. user disabled use_in_persona).

alter table public.interview_steps
  add column if not exists delivered_question text;

comment on column public.interview_steps.delivered_question is
  'AI-rephrased question text actually shown to the candidate. NULL for legacy interviews or when AI rephrasing is skipped; readers must fallback to custom_question or questions.question.';
