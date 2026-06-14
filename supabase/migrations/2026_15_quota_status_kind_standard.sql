-- 2026_15_quota_status_kind_standard.sql
-- Repo<->prod drift reconciliation for get_user_quota_status().
--
-- The repo's 2026_07_billing_period_enforcement.sql still defines this function
-- with a count that does NOT filter by interview kind:
--     ... FROM public.interviews WHERE user_id = v_user AND status IN (...)
-- Production was later updated (alongside the `kind` column from
-- 2026_09_question_vault.sql) to count only standard interviews:
--     ... AND kind = 'standard' AND status IN (...)
-- so deep-dive interviews never consume the free-interview allowance.
--
-- This migration versions the CURRENT production definition so the repo matches
-- prod. The only difference vs 2026_07 is the `kind = 'standard'` predicate in the
-- count; applying against prod is a no-op (identical body). It also keeps the
-- quota read-path counting interviews the same way as H1 (2026_11 start_interview).

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

  v_is_paid := (v_plan = 'hardo')
    OR (v_plan = 'paid'
        AND v_status = 'active'
        AND v_period_end IS NOT NULL
        AND v_period_end >= now());

  -- Count only standard interviews against the free allowance (deep-dive excluded).
  SELECT count(*) INTO v_used FROM public.interviews
  WHERE user_id = v_user
    AND kind = 'standard'
    AND status IN ('in_progress','paused','completed','finalized');

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
