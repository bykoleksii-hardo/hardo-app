-- Per-question feedback (thumbs up/down) on completed interview summaries.
-- One feedback row per (user, step). The step represents a main question
-- block — the feedback covers the question + all of its follow-ups as one unit.

create table if not exists public.interview_step_feedback (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  step_id     uuid not null references public.interview_steps(id) on delete cascade,
  rating      smallint not null check (rating in (-1, 1)),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, step_id)
);

create index if not exists interview_step_feedback_step_idx
  on public.interview_step_feedback (step_id);

create index if not exists interview_step_feedback_user_idx
  on public.interview_step_feedback (user_id);

alter table public.interview_step_feedback enable row level security;

create policy "step_feedback_select_own"
  on public.interview_step_feedback
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "step_feedback_insert_own"
  on public.interview_step_feedback
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.interview_steps s
      join public.interviews i on i.id = s.interview_id
      where s.id = step_id
        and i.user_id = auth.uid()
    )
  );

create policy "step_feedback_update_own"
  on public.interview_step_feedback
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "step_feedback_delete_own"
  on public.interview_step_feedback
  for delete
  to authenticated
  using (user_id = auth.uid());

create or replace function public.touch_step_feedback_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_step_feedback_updated on public.interview_step_feedback;
create trigger trg_step_feedback_updated
  before update on public.interview_step_feedback
  for each row execute function public.touch_step_feedback_updated_at();
