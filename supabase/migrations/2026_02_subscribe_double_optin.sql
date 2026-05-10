-- Double opt-in for mailing list subscriptions
-- Creates a pending_subscriptions table and two RPCs accessible to anon.
-- The table is locked via RLS; only the SECURITY DEFINER RPCs may write/read.

create table if not exists public.pending_subscriptions (
  token        text primary key,
  email        text not null,
  created_at   timestamptz not null default now(),
  expires_at   timestamptz not null,
  confirmed_at timestamptz
);

create index if not exists pending_subscriptions_email_idx
  on public.pending_subscriptions (email);

alter table public.pending_subscriptions enable row level security;

-- No public policies: all access via SECURITY DEFINER functions below.

-- Enqueue (or refresh) a pending subscription. Returns token + expires_at.
-- If a confirmed row already exists for the email, returns already_confirmed=true.
create or replace function public.enqueue_pending_subscription(p_email text)
returns table (token text, expires_at timestamptz, already_confirmed boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_token text;
  v_expires timestamptz;
  v_existing record;
begin
  v_email := lower(trim(p_email));
  if v_email is null or v_email = '' or position('@' in v_email) = 0 then
    raise exception 'invalid_email';
  end if;
  if length(v_email) > 254 then
    raise exception 'invalid_email';
  end if;

  -- If we have a confirmed subscription already, signal that.
  select * into v_existing
    from public.pending_subscriptions
    where email = v_email and confirmed_at is not null
    order by confirmed_at desc
    limit 1;
  if found then
    token := null;
    expires_at := null;
    already_confirmed := true;
    return next;
    return;
  end if;

  -- Reuse an unexpired pending row if it exists.
  select * into v_existing
    from public.pending_subscriptions
    where email = v_email
      and confirmed_at is null
      and expires_at > now()
    order by created_at desc
    limit 1;
  if found then
    token := v_existing.token;
    expires_at := v_existing.expires_at;
    already_confirmed := false;
    return next;
    return;
  end if;

  -- Otherwise create a new pending row.
  v_token := replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
  v_expires := now() + interval '24 hours';
  insert into public.pending_subscriptions(token, email, expires_at)
    values (v_token, v_email, v_expires);

  token := v_token;
  expires_at := v_expires;
  already_confirmed := false;
  return next;
end;
$$;

revoke all on function public.enqueue_pending_subscription(text) from public;
grant execute on function public.enqueue_pending_subscription(text) to anon, authenticated;

-- Confirm a pending subscription. Returns the email and a status.
-- status values: confirmed | already_confirmed | expired | invalid
create or replace function public.confirm_pending_subscription(p_token text)
returns table (email text, status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row record;
begin
  if p_token is null or length(p_token) < 16 then
    email := null; status := 'invalid'; return next; return;
  end if;

  select * into v_row
    from public.pending_subscriptions
    where token = p_token
    limit 1;

  if not found then
    email := null; status := 'invalid'; return next; return;
  end if;

  if v_row.confirmed_at is not null then
    email := v_row.email; status := 'already_confirmed'; return next; return;
  end if;

  if v_row.expires_at <= now() then
    email := v_row.email; status := 'expired'; return next; return;
  end if;

  update public.pending_subscriptions
    set confirmed_at = now()
    where token = p_token;

  email := v_row.email; status := 'confirmed'; return next;
end;
$$;

revoke all on function public.confirm_pending_subscription(text) from public;
grant execute on function public.confirm_pending_subscription(text) to anon, authenticated;
