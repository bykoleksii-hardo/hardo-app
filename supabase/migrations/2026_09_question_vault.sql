-- 2026_09: Question Vault foundation.
-- Adds interviews.kind to distinguish standard interviews from single-question
-- deep-dive sessions launched from the Question Vault. Deep-dive sessions reuse
-- the interview engine but must NOT consume the free-interview quota and must not
-- pollute profile stats (which already filter on status = 'completed').

alter table public.interviews
  add column if not exists kind text not null default 'standard';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'interviews_kind_check'
  ) then
    alter table public.interviews
      add constraint interviews_kind_check check (kind in ('standard', 'deep_dive'));
  end if;
end $$;

create index if not exists interviews_kind_idx on public.interviews (kind);

comment on column public.interviews.kind is
  'standard = normal multi-question interview; deep_dive = single-question Question Vault session. Deep-dive rows are excluded from the free-interview quota count.';

-- Recreate the quota RPC so deep-dive sessions never count toward the free limit.
-- Identical to the prior definition except the interviews count filter adds
-- "kind = 'standard'".
create or replace function public.get_user_quota_status()
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user uuid := auth.uid();
  v_plan text;
  v_status text;
  v_period_end timestamptz;
  v_used int;
  v_free_limit int := 1;
  v_is_paid boolean;
begin
  if v_user is null then
    return jsonb_build_object('error','not_authenticated');
  end if;

  select plan, subscription_status, current_period_end
  into v_plan, v_status, v_period_end
  from public.user_entitlements where user_id = v_user;
  if v_plan is null then
    insert into public.user_entitlements (user_id, plan) values (v_user, 'free')
    on conflict (user_id) do nothing;
    v_plan := 'free';
  end if;

  v_is_paid := (v_plan = 'hardo')
    or (v_plan = 'paid'
        and v_status = 'active'
        and v_period_end is not null
        and v_period_end >= now());

  select count(*) into v_used from public.interviews
  where user_id = v_user
    and kind = 'standard'
    and status in ('in_progress','paused','completed','finalized');

  return jsonb_build_object(
    'plan', case when v_is_paid then v_plan else 'free' end,
    'is_paid', v_is_paid,
    'interviews_used', v_used,
    'free_limit', v_free_limit,
    'subscription_status', v_status,
    'current_period_end', v_period_end,
    'allowed_levels', case when v_is_paid then array['intern','analyst','associate'] else array['intern'] end,
    'can_start', case when v_is_paid then true else v_used < v_free_limit end
  );
end;
$function$;
