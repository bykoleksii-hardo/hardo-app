-- 2026_11_start_interview_atomic_quota.sql
-- H1: make the free-plan interview limit race-safe and bypass-proof INSIDE
--     start_interview().
--
-- Problem before this migration
-- -----------------------------
-- start_interview() did NO quota gating of its own. The free limit (1 standard
-- interview, intern level) was enforced only in the Next.js route
-- (app/api/interview/start/route.ts): it called get_user_quota_status(), checked
-- `can_start`, and then called start_interview(). Two defects:
--
--   1. Check-then-act race. Two concurrent POST /api/interview/start requests both
--      read interviews_used = 0, both pass the check, and both call
--      start_interview(), so a free user ends up with 2+ interviews.
--
--   2. Bypassable gate. start_interview is SECURITY DEFINER and is EXECUTE-able by
--      the `authenticated` (and `anon`) role directly via PostgREST at
--      /rest/v1/rpc/start_interview. A client can skip the route entirely and
--      create unlimited interviews at any level.
--
-- Fix
-- ---
-- Move the gate into start_interview() and make it atomic. We ensure the caller's
-- user_entitlements row exists, then take a row lock on it (SELECT ... FOR UPDATE).
-- Concurrent start_interview() calls for the same user serialize on that lock, so
-- the re-count and the interview INSERT happen together in one SECURITY DEFINER
-- transaction. Paid detection mirrors get_user_quota_status() exactly (the live
-- prod version, which counts only kind='standard' interviews and treats
-- 'abandoned' as not counting). Free plan is capped at 1 standard interview and to
-- the intern level — matching the documented "1 Intern interview per account".
--
-- Compatibility
-- -------------
--   * Signature is unchanged: start_interview(p_level text, p_region text DEFAULT NULL).
--     Existing callers (the route passes only p_level) keep working.
--   * Happy path is unchanged: the route's pre-check still returns the friendly
--     403 before we ever get here. The new DB-side checks are the backstop that
--     actually closes the race and the direct-RPC bypass; on rejection the function
--     raises (free_limit_reached / level_locked) instead of silently creating a row.
--   * Everything after the gate (question seeding, the 12-question assertion, and
--     the question_exposure upsert) is identical to the prior prod definition.
--
-- Apply against staging first, then production.

CREATE OR REPLACE FUNCTION public.start_interview(p_level text, p_region text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid;
  v_interview uuid;
  v_count int;
  v_plan text;
  v_status text;
  v_period_end timestamptz;
  v_is_paid boolean;
  v_free_limit int := 1;
BEGIN
  v_user := auth.uid();
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_level NOT IN ('intern','analyst','associate') THEN RAISE EXCEPTION 'Invalid level: %', p_level; END IF;
  IF p_region IS NOT NULL AND p_region NOT IN ('US','EMEA','Global') THEN RAISE EXCEPTION 'Invalid region: %', p_region; END IF;

  -- ---- Atomic quota gate (H1) ------------------------------------------------
  -- Ensure the caller has an entitlements row, then lock it so that concurrent
  -- start_interview() calls for this user serialize. The recount + INSERT below
  -- run while we hold this lock, which closes both the check-then-act race and the
  -- direct-RPC bypass of the route-level gate.
  INSERT INTO public.user_entitlements (user_id, plan)
    VALUES (v_user, 'free')
    ON CONFLICT (user_id) DO NOTHING;

  SELECT plan, subscription_status, current_period_end
    INTO v_plan, v_status, v_period_end
    FROM public.user_entitlements
    WHERE user_id = v_user
    FOR UPDATE;

  -- Mirror get_user_quota_status(): 'hardo' (admin/comp) is always paid; a 'paid'
  -- subscription grants access only while active AND not past current_period_end.
  v_is_paid := (v_plan = 'hardo')
    OR (v_plan = 'paid'
        AND v_status = 'active'
        AND v_period_end IS NOT NULL
        AND v_period_end >= now());

  IF NOT v_is_paid THEN
    -- Free plan is limited to the intern level.
    IF p_level <> 'intern' THEN
      RAISE EXCEPTION 'level_locked: % requires a paid plan', p_level
        USING ERRCODE = 'insufficient_privilege';
    END IF;

    -- Free plan is limited to v_free_limit standard interviews. Counting under the
    -- entitlements row lock makes this race-safe. Predicate matches the prod
    -- get_user_quota_status() count (kind='standard'; 'abandoned' does not count).
    SELECT count(*) INTO v_count
      FROM public.interviews
      WHERE user_id = v_user
        AND kind = 'standard'
        AND status IN ('in_progress','paused','completed','finalized');
    IF v_count >= v_free_limit THEN
      RAISE EXCEPTION 'free_limit_reached: free plan allows % interview(s)', v_free_limit
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  -- ---- End quota gate --------------------------------------------------------

  INSERT INTO public.interviews (user_id, status, started_at, candidate_level, total_questions, total_followups)
    VALUES (v_user, 'in_progress', NOW(), p_level, 12, 0)
    RETURNING id INTO v_interview;

  INSERT INTO public.interview_steps (interview_id, question_id, order_index, is_follow_up, ai_decision, ai_reason)
    SELECT v_interview, q.q_id, q.q_order, false, 'seeded', 'deterministic v1: phase=' || q.q_phase
    FROM public.select_interview_questions(v_user, p_level, 12, p_region) q;
  GET DIAGNOSTICS v_count := ROW_COUNT;
  IF v_count < 12 THEN RAISE EXCEPTION 'Selector returned only % questions, expected 12', v_count; END IF;

  INSERT INTO public.question_exposure (user_id, question_id, last_seen_at, seen_count)
    SELECT v_user, s.question_id, NOW(), 1
    FROM public.interview_steps s
    WHERE s.interview_id = v_interview AND s.question_id IS NOT NULL
    ON CONFLICT (user_id, question_id) DO UPDATE
      SET last_seen_at = EXCLUDED.last_seen_at,
          seen_count = public.question_exposure.seen_count + 1;

  RETURN v_interview;
END;
$function$;
