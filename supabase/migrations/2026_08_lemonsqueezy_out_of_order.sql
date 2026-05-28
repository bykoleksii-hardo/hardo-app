-- 2026_08_lemonsqueezy_out_of_order.sql
--
-- Axis 4 (Billing) fix #2: out-of-order webhook protection.
--
-- LemonSqueezy webhooks can arrive out of order (retries, network reordering).
-- The ON CONFLICT upsert in apply_lemonsqueezy_event previously set
-- current_period_end = excluded.current_period_end unconditionally, so a
-- delayed/stale event could SHORTEN an active subscription period.
--
-- Fix: clamp with greatest(existing, incoming) so current_period_end can only
-- move forward. Applied to staging then production directly during the
-- 2026-05 audit; this file commits that change to version control.
--
-- Body below is the exact current production definition (pg_get_functiondef).

CREATE OR REPLACE FUNCTION public.apply_lemonsqueezy_event(p_secret text, p_user_id uuid, p_status text, p_subscription_id text, p_customer_id text, p_variant_id text, p_current_period_end timestamp with time zone)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_expected text;
  v_plan text;
begin
  select value into v_expected
    from public.app_secrets
   where key = 'lemonsqueezy_rpc_secret';

  if v_expected is null or length(v_expected) = 0 then
    raise exception 'apply_lemonsqueezy_event: server secret not configured';
  end if;
  if p_secret is null or p_secret <> v_expected then
    raise exception 'apply_lemonsqueezy_event: invalid secret';
  end if;
  if p_user_id is null then
    raise exception 'apply_lemonsqueezy_event: user_id required';
  end if;

  -- Plan resolution:
  --  * active / paused / past_due  -> paid
  --  * cancelled  but paid period still in future -> paid (user paid for this period)
  --  * cancelled  and period expired (or unknown) -> free
  --  * anything else (expired, unpaid, refunded, ...)  -> free
  if p_status in ('active','paused','past_due') then
    v_plan := 'paid';
  elsif p_status = 'cancelled'
        and p_current_period_end is not null
        and p_current_period_end > now() then
    v_plan := 'paid';
  else
    v_plan := 'free';
  end if;

  insert into public.user_entitlements (
    user_id, plan, subscription_status,
    lemonsqueezy_customer_id, lemonsqueezy_subscription_id, lemonsqueezy_variant_id,
    current_period_end, updated_at
  ) values (
    p_user_id, v_plan, p_status,
    p_customer_id, p_subscription_id, p_variant_id,
    p_current_period_end, now()
  )
  on conflict (user_id) do update set
    plan = excluded.plan,
    subscription_status = excluded.subscription_status,
    lemonsqueezy_customer_id = coalesce(excluded.lemonsqueezy_customer_id, public.user_entitlements.lemonsqueezy_customer_id),
    lemonsqueezy_subscription_id = coalesce(excluded.lemonsqueezy_subscription_id, public.user_entitlements.lemonsqueezy_subscription_id),
    lemonsqueezy_variant_id = coalesce(excluded.lemonsqueezy_variant_id, public.user_entitlements.lemonsqueezy_variant_id),
    current_period_end = greatest(user_entitlements.current_period_end, excluded.current_period_end),
    updated_at = now();
end;
$function$;
