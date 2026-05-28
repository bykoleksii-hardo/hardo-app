-- Axis 4 (Billing) fix: enforce subscription period in quota gating.
--
-- Source of truth for entitlements is public.user_entitlements
-- (columns: plan, subscription_status, lemonsqueezy_*, current_period_end).
-- The LemonSqueezy webhook -> apply_lemonsqueezy_event(...) upserts these.
--
-- Problem before this migration: get_user_quota_status() granted paid access
-- based on the `plan` column alone. If a renewal/cancellation/refund webhook was
-- missed, an expired subscription kept full access indefinitely.
--
-- Fix: paid access now requires subscription_status='active' AND a
-- current_period_end in the future. The 'hardo' plan (admin/comp) stays paid
-- unconditionally. This is purely a read-path (gating) change; no data is mutated.
--
-- Apply via Supabase SQL Editor against staging first, then production.

CREATE OR REPLACE FUNCTION public.get_user_quota_status()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid := auth.uid();
  v_plan text;
  v_status text;
  v_period_end timestamptz;
  v_used int;
  v_free_limit int := 1;
  v_is_paid boolean;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('error','not_authenticated');
  END IF;

  SELECT plan, subscription_status, current_period_end
    INTO v_plan, v_status, v_period_end
    FROM public.user_entitlements WHERE user_id = v_user;
  IF v_plan IS NULL THEN
    INSERT INTO public.user_entitlements (user_id, plan) VALUES (v_user, 'free')
    ON CONFLICT (user_id) DO NOTHING;
    v_plan := 'free';
  END IF;

  -- Entitlement gate: 'hardo' (admin/comp) is always paid; a 'paid' subscription
  -- only grants access while it is active AND the paid period has not ended.
  -- This makes access expire exactly when the paid term ends, even if a renewal/
  -- cancellation webhook was missed.
  v_is_paid := (v_plan = 'hardo')
    OR (v_plan = 'paid'
        AND v_status = 'active'
        AND v_period_end IS NOT NULL
        AND v_period_end >= now());

  SELECT count(*) INTO v_used FROM public.interviews
  WHERE user_id = v_user AND status IN ('in_progress','paused','completed','finalized');

  RETURN jsonb_build_object(
    'plan', CASE WHEN v_is_paid THEN v_plan ELSE 'free' END,
    'is_paid', v_is_paid,
    'interviews_used', v_used,
    'free_limit', v_free_limit,
    'subscription_status', v_status,
    'current_period_end', v_period_end,
    'allowed_levels', CASE WHEN v_is_paid THEN ARRAY['intern','analyst','associate'] ELSE ARRAY['intern'] END,
    'can_start', CASE WHEN v_is_paid THEN true ELSE v_used < v_free_limit END
  );
END;
$function$;
