-- 2026_10_core_rls_policies.sql
-- C1: version the ACTUAL row-level-security state of the core schema.
--
-- Context: the interview/user core schema (interviews, interview_steps, answers,
-- interview_summaries, question_exposure, user_profiles, user_skills,
-- user_entitlements, questions) was created directly in production and was never
-- captured in supabase/migrations. `list_migrations` on prod is empty, so the
-- repo had no record of the security posture these tables rely on.
--
-- This file is a faithful dump of the LIVE prod policies (verified via pg_policies
-- and pg_class on 2026-06-14). RLS is already ENABLED on every table below and
-- every policy is already owner-scoped via auth.uid(); this migration only
-- versions that state so a fresh database reproduces it exactly. It does NOT add,
-- relax, or change any policy logic.
--
-- Notes:
--  * Both the legacy `{public}`-role policies and the newer `{authenticated}`
--    policies are reproduced verbatim, exactly as they exist in prod. They are
--    permissive (OR-combined); the anon role still matches nothing because every
--    predicate requires auth.uid().
--  * FORCE ROW LEVEL SECURITY is intentionally NOT set. The core SECURITY DEFINER
--    RPCs (start_interview, submit_answer, select_interview_questions, ...) run as
--    the table owner and rely on bypassing RLS to do their cross-row work; forcing
--    RLS on the owner would break them.
--  * Tables whose RLS is already versioned elsewhere are NOT touched here:
--    user_roles + knowledge_articles (0003/0004/0005), interview_step_feedback
--    (2026_03), rate_limit_buckets (2026_06), pending_subscriptions (2026_02),
--    processed_webhook_events (2026_09_webhook_dedup).
--
-- Idempotent: every policy is dropped-if-exists then recreated. Applying against
-- prod is effectively a no-op (identical recreate). Apply to staging first.

-- ============================================================================
-- interviews  (owner row: user_id = auth.uid())
-- ============================================================================
alter table public.interviews enable row level security;

drop policy if exists "Users can create own interviews" on public.interviews;
create policy "Users can create own interviews"
  on public.interviews for insert
  to public
  with check (user_id = auth.uid());

drop policy if exists "Users can view own interviews" on public.interviews;
create policy "Users can view own interviews"
  on public.interviews for select
  to public
  using (user_id = auth.uid());

drop policy if exists "interviews_self_all" on public.interviews;
create policy "interviews_self_all"
  on public.interviews for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================================
-- interview_steps  (ownership via parent interview)
-- ============================================================================
alter table public.interview_steps enable row level security;

drop policy if exists "Users can view own steps" on public.interview_steps;
create policy "Users can view own steps"
  on public.interview_steps for select
  to public
  using (
    interview_id in (
      select interviews.id
      from public.interviews
      where interviews.user_id = auth.uid()
    )
  );

drop policy if exists "interview_steps_self_all" on public.interview_steps;
create policy "interview_steps_self_all"
  on public.interview_steps for all
  to authenticated
  using (
    exists (
      select 1 from public.interviews i
      where i.id = interview_steps.interview_id and i.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.interviews i
      where i.id = interview_steps.interview_id and i.user_id = auth.uid()
    )
  );

-- ============================================================================
-- answers  (ownership via step -> interview)
-- ============================================================================
alter table public.answers enable row level security;

drop policy if exists "Users can view own answers" on public.answers;
create policy "Users can view own answers"
  on public.answers for select
  to public
  using (
    interview_step_id in (
      select interview_steps.id
      from public.interview_steps
      where interview_steps.interview_id in (
        select interviews.id
        from public.interviews
        where interviews.user_id = auth.uid()
      )
    )
  );

drop policy if exists "answers_self_all" on public.answers;
create policy "answers_self_all"
  on public.answers for all
  to authenticated
  using (
    exists (
      select 1
      from public.interview_steps s
      join public.interviews i on i.id = s.interview_id
      where s.id = answers.interview_step_id and i.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.interview_steps s
      join public.interviews i on i.id = s.interview_id
      where s.id = answers.interview_step_id and i.user_id = auth.uid()
    )
  );

-- ============================================================================
-- interview_summaries  (ownership via interview)
-- ============================================================================
alter table public.interview_summaries enable row level security;

drop policy if exists "Users can view own summaries" on public.interview_summaries;
create policy "Users can view own summaries"
  on public.interview_summaries for select
  to public
  using (
    interview_id in (
      select interviews.id
      from public.interviews
      where interviews.user_id = auth.uid()
    )
  );

drop policy if exists "interview_summaries_self_all" on public.interview_summaries;
create policy "interview_summaries_self_all"
  on public.interview_summaries for all
  to authenticated
  using (
    exists (
      select 1 from public.interviews i
      where i.id = interview_summaries.interview_id and i.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.interviews i
      where i.id = interview_summaries.interview_id and i.user_id = auth.uid()
    )
  );

drop policy if exists "interview_summaries_self_read" on public.interview_summaries;
create policy "interview_summaries_self_read"
  on public.interview_summaries for select
  to authenticated
  using (
    exists (
      select 1 from public.interviews i
      where i.id = interview_summaries.interview_id and i.user_id = auth.uid()
    )
  );

-- ============================================================================
-- question_exposure  (owner row: user_id = auth.uid())
-- ============================================================================
alter table public.question_exposure enable row level security;

drop policy if exists "question_exposure_self_all" on public.question_exposure;
create policy "question_exposure_self_all"
  on public.question_exposure for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================================
-- user_profiles  (owner row: auth.uid() = user_id)
-- ============================================================================
alter table public.user_profiles enable row level security;

drop policy if exists "user_profiles_insert_own" on public.user_profiles;
create policy "user_profiles_insert_own"
  on public.user_profiles for insert
  to public
  with check (auth.uid() = user_id);

drop policy if exists "user_profiles_select_own" on public.user_profiles;
create policy "user_profiles_select_own"
  on public.user_profiles for select
  to public
  using (auth.uid() = user_id);

drop policy if exists "user_profiles_update_own" on public.user_profiles;
create policy "user_profiles_update_own"
  on public.user_profiles for update
  to public
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================================
-- user_skills  (owner row: user_id = auth.uid()) -- SELECT only; writes via
-- SECURITY DEFINER paths, so no insert/update/delete policy exists in prod.
-- ============================================================================
alter table public.user_skills enable row level security;

drop policy if exists "Users can view own skills" on public.user_skills;
create policy "Users can view own skills"
  on public.user_skills for select
  to public
  using (user_id = auth.uid());

drop policy if exists "user_skills_self_read" on public.user_skills;
create policy "user_skills_self_read"
  on public.user_skills for select
  to authenticated
  using (user_id = auth.uid());

-- ============================================================================
-- user_entitlements  (owner row: auth.uid() = user_id)
-- ============================================================================
alter table public.user_entitlements enable row level security;

drop policy if exists "insert_own_entitlement" on public.user_entitlements;
create policy "insert_own_entitlement"
  on public.user_entitlements for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "select_own_entitlement" on public.user_entitlements;
create policy "select_own_entitlement"
  on public.user_entitlements for select
  to public
  using (auth.uid() = user_id);

drop policy if exists "update_own_entitlement" on public.user_entitlements;
create policy "update_own_entitlement"
  on public.user_entitlements for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================================
-- questions  (shared reference data: any authenticated user may read; writes
-- are admin-only via service role / definer paths, so no write policy exists)
-- ============================================================================
alter table public.questions enable row level security;

drop policy if exists "questions_read_authenticated" on public.questions;
create policy "questions_read_authenticated"
  on public.questions for select
  to authenticated
  using (true);
