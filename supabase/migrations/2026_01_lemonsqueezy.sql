-- Lemon Squeezy billing integration.
-- Adds subscription columns to public.users and a SECURITY DEFINER RPC
-- that the webhook calls after verifying the LS HMAC signature.
--
-- Apply via Supabase SQL Editor. The shared secret used by the RPC must be
-- set in the database BEFORE running the webhook in production:
--
--   ALTER DATABASE postgres SET app.lemonsqueezy_rpc_secret = '<random-secret>';
--   -- then reconnect or wait for new connections.
--
-- The same value goes into Cloudflare Worker secret LEMONSQUEEZY_RPC_SECRET.

-- 1) Columns on public.users.
alter table public.users
  add column if not exists lemonsqueezy_customer_id text,
  add column if not exists lemonsqueezy_subscription_id text,
  add column if not exists lemonsqueezy_variant_id text,
  add column if not exists subscription_status text,
  add column if not exists current_period_end timestamptz;

create index if not exists idx_users_subscription_status
  on public.users (subscription_status)
  where subscription_status is not null;

-- 2) RPC called by /api/billing/webhook after HMAC verification.
-- Verifies a shared secret stored in app.lemonsqueezy_rpc_secret to gate writes.
create or replace function public.apply_lemonsqueezy_event(
  p_secret text,
  p_user_id uuid,
  p_status text,
  p_subscription_id text,
  p_customer_id text,
  p_variant_id text,
  p_current_period_end timestamptz
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  expected text;
begin
  expected := current_setting('app.lemonsqueezy_rpc_secret', true);
  if expected is null or expected = '' then
    raise exception 'apply_lemonsqueezy_event: server secret not configured';
  end if;
  if p_secret is null or p_secret <> expected then
    raise exception 'apply_lemonsqueezy_event: invalid secret';
  end if;

  update public.users
     set subscription_status = p_status,
         lemonsqueezy_subscription_id = coalesce(p_subscription_id, lemonsqueezy_subscription_id),
         lemonsqueezy_customer_id = coalesce(p_customer_id, lemonsqueezy_customer_id),
         lemonsqueezy_variant_id = coalesce(p_variant_id, lemonsqueezy_variant_id),
         current_period_end = p_current_period_end
   where id = p_user_id;
end;
$$;

-- Lock down: only authenticated/anon can call via PostgREST? We expose to anon
-- because the webhook uses the anon key and gates auth via p_secret.
revoke all on function public.apply_lemonsqueezy_event(
  text, uuid, text, text, text, text, timestamptz
) from public;
grant execute on function public.apply_lemonsqueezy_event(
  text, uuid, text, text, text, text, timestamptz
) to anon, authenticated, service_role;

-- 3) Optional: extend get_user_quota_status to surface subscription_status.
-- If your existing RPC already selects all columns from users, no change is needed.
-- If it whitelists columns, add subscription_status / current_period_end manually.
