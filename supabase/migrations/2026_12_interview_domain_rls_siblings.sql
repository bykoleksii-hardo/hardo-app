-- 2026_12_interview_domain_rls_siblings.sql
-- C1 follow-up: version the live RLS for the two interview-domain child tables
-- that were not in the named core set but follow the same ownership model:
-- answer_evaluations and interview_events. Faithful dump of prod policies
-- (verified 2026-06-14). RLS is already enabled and owner-scoped; both tables are
-- read-only for clients (writes happen via SECURITY DEFINER paths), so prod has
-- only SELECT policies. No logic is added or relaxed.
--
-- Idempotent: drop-if-exists then recreate. Effectively a no-op against prod.

-- ===== answer_evaluations (ownership via answer -> step -> interview) =====
alter table public.answer_evaluations enable row level security;

drop policy if exists "Users can view own evaluations" on public.answer_evaluations;
create policy "Users can view own evaluations"
  on public.answer_evaluations for select
  to public
  using (
    answer_id in (
      select answers.id
      from public.answers
      where answers.interview_step_id in (
        select interview_steps.id
        from public.interview_steps
        where interview_steps.interview_id in (
          select interviews.id
          from public.interviews
          where interviews.user_id = auth.uid()
        )
      )
    )
  );

drop policy if exists "answer_evaluations_self_read" on public.answer_evaluations;
create policy "answer_evaluations_self_read"
  on public.answer_evaluations for select
  to authenticated
  using (
    exists (
      select 1
      from public.answers a
      join public.interview_steps s on s.id = a.interview_step_id
      join public.interviews i on i.id = s.interview_id
      where a.id = answer_evaluations.answer_id and i.user_id = auth.uid()
    )
  );

-- ===== interview_events (ownership via interview) =====
alter table public.interview_events enable row level security;

drop policy if exists "Users can view own events" on public.interview_events;
create policy "Users can view own events"
  on public.interview_events for select
  to public
  using (
    interview_id in (
      select interviews.id
      from public.interviews
      where interviews.user_id = auth.uid()
    )
  );

drop policy if exists "interview_events_self_read" on public.interview_events;
create policy "interview_events_self_read"
  on public.interview_events for select
  to authenticated
  using (
    exists (
      select 1 from public.interviews i
      where i.id = interview_events.interview_id and i.user_id = auth.uid()
    )
  );
