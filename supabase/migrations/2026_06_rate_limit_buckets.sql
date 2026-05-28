-- 2026_06_rate_limit_buckets.sql
-- Simple fixed-window rate limiter backed by Postgres.
-- Atomic upsert in a SECURITY DEFINER RPC keeps the logic race-free.

create table if not exists public.rate_limit_buckets (
  key text primary key,
  window_start timestamptz not null,
  count int not null
);

-- RLS: deny direct access. The RPC is SECURITY DEFINER and is the only entry point.
alter table public.rate_limit_buckets enable row level security;

create or replace function public.rate_limit_take(
  p_key text,
  p_capacity int,
  p_window_seconds int
)
returns table(allowed boolean, remaining int, reset_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_window_end timestamptz;
  v_row public.rate_limit_buckets%rowtype;
begin
  -- Acquire / refresh bucket atomically.
  insert into public.rate_limit_buckets as b (key, window_start, count)
  values (p_key, v_now, 1)
  on conflict (key) do update
    set
      window_start = case
        when b.window_start + make_interval(secs => p_window_seconds) <= v_now
          then v_now
        else b.window_start
      end,
      count = case
        when b.window_start + make_interval(secs => p_window_seconds) <= v_now
          then 1
        else b.count + 1
      end
  returning * into v_row;

  v_window_end := v_row.window_start + make_interval(secs => p_window_seconds);
  allowed := v_row.count <= p_capacity;
  remaining := greatest(0, p_capacity - v_row.count);
  reset_at := v_window_end;
  return next;
end;
$$;

comment on function public.rate_limit_take is
  'Fixed-window rate limiter. Returns allowed/remaining/reset_at.';

-- Periodic cleanup of stale buckets (run via cron or call manually).
create or replace function public.rate_limit_cleanup(p_max_age_seconds int default 86400)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted int;
begin
  delete from public.rate_limit_buckets
  where window_start < now() - make_interval(secs => p_max_age_seconds);
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

grant execute on function public.rate_limit_take(text, int, int) to anon, authenticated, service_role;
grant execute on function public.rate_limit_cleanup(int) to service_role;
