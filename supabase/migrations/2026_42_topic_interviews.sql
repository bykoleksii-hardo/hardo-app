-- 2026_42_topic_interviews.sql
-- Topic sprints: a light 3-question interview on ONE chosen category, next to the
-- full 12-question round.
--
-- Why
-- ---
-- Funnel data shows users abandoning the full 12-question interview after 0-3
-- answers. A 3-question single-topic format is a lower-friction entry point and a
-- natural "drill one weakness" loop for returning users.
--
-- What this adds
-- --------------
--   1. interviews.kind gains a third value 'topic' (CHECK constraint recreated),
--      plus a topic_category column recording the chosen category.
--   2. select_topic_questions(): single-category selector. Reuses the exact pool
--      semantics of select_interview_questions (candidate_level ladder, region
--      resolution, type='primary', question_exposure decay 0.25^seen, subtopic
--      de-dup) but skips the fit/technical/case/curveball blueprint. Three passes:
--      in-band + distinct subtopic -> in-band any subtopic -> relaxed difficulty
--      (insurance for small categories). Questions are ordered easiest-first.
--   3. start_topic_interview(): mirrors start_interview's atomic quota gate
--      (entitlements row lock, paid detection identical to get_user_quota_status).
--      Free plan: intern-only and ONE topic sprint per account, metered separately
--      from the 1 free standard interview (predicate kind='topic'). Paid:
--      unlimited. Seeds exactly 3 steps and upserts question_exposure the same
--      way start_interview does.
--   4. get_user_quota_status(): adds topic_used / topic_free_limit /
--      can_start_topic keys (existing keys unchanged, so current consumers are
--      unaffected).
--
-- The standard 12-question path is untouched: kind='topic' rows are invisible to
-- both existing free-limit counts (they filter kind='standard').
--
-- Everything downstream of creation (turn, finalize, summary, progress UI) reads
-- interviews.total_questions / order_index dynamically, so 3-question interviews
-- run and finalize with no further changes.
--
-- Safe to re-run (CREATE OR REPLACE / IF NOT EXISTS / drop-and-recreate CHECK).

-- 1. Schema ------------------------------------------------------------------

alter table public.interviews
  drop constraint if exists interviews_kind_check;
alter table public.interviews
  add constraint interviews_kind_check
  check (kind in ('standard', 'deep_dive', 'topic'));

alter table public.interviews
  add column if not exists topic_category text;

-- 2. Single-category selector --------------------------------------------------

CREATE OR REPLACE FUNCTION public.select_topic_questions(
  p_user_id uuid,
  p_level text,
  p_category text,
  p_count integer DEFAULT 3,
  p_region text DEFAULT NULL::text
)
RETURNS TABLE(q_id bigint, q_order integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_levels text[];
  v_min_diff int;
  v_max_diff int;
  v_region text;
  v_regions text[];
  v_picked int := 0;
BEGIN
  -- Region resolution (same as select_interview_questions)
  IF p_region IS NOT NULL AND p_region IN ('US','EMEA','Global') THEN
    v_region := p_region;
  ELSE
    SELECT COALESCE(up.interview_region, 'Global') INTO v_region
      FROM public.user_profiles up WHERE up.user_id = p_user_id;
    IF v_region IS NULL OR v_region NOT IN ('US','EMEA','Global') THEN
      v_region := 'Global';
    END IF;
  END IF;
  IF v_region = 'Global' THEN
    v_regions := ARRAY['Global'];
  ELSE
    v_regions := ARRAY[v_region, 'Global'];
  END IF;

  -- Per-level candidate pool + difficulty band (same ladder as the 12-question selector)
  IF p_level = 'intern' THEN
    v_levels := ARRAY['intern','any'];   v_min_diff := 1; v_max_diff := 3;
  ELSIF p_level = 'analyst' THEN
    v_levels := ARRAY['analyst','any'];  v_min_diff := 2; v_max_diff := 4;
  ELSE
    v_levels := ARRAY['associate','analyst','any']; v_min_diff := 3; v_max_diff := 5;
  END IF;

  DROP TABLE IF EXISTS _topic_pool;
  DROP TABLE IF EXISTS _topic_picked;
  CREATE TEMP TABLE _topic_picked (id bigint, subtopic text) ON COMMIT DROP;

  CREATE TEMP TABLE _topic_pool ON COMMIT DROP AS
  SELECT q.id, q.difficulty,
         COALESCE(q.subtopic, q.category) AS subtopic,
         (q.difficulty BETWEEN v_min_diff AND v_max_diff) AS in_band,
         CASE
           WHEN q.candidate_level = p_level THEN 3
           WHEN p_level = 'analyst' AND q.candidate_level = 'intern' THEN 2
           WHEN p_level = 'associate' AND q.candidate_level IN ('analyst','intern') THEN 2
           WHEN q.candidate_level = 'any' THEN 1
           ELSE 0
         END AS level_weight,
         CASE q.importance
           WHEN 'anchor' THEN 4 WHEN 'core' THEN 3
           WHEN 'standard' THEN 2 WHEN 'advanced' THEN 1 ELSE 0
         END AS importance_weight,
         COALESCE(qe.seen_count, 0) AS seen,
         random() AS r
  FROM public.questions q
  LEFT JOIN public.question_exposure qe
    ON qe.user_id = p_user_id AND qe.question_id = q.id
  WHERE q.category = p_category
    AND q.candidate_level = ANY(v_levels)
    AND q.region = ANY(v_regions)
    AND q.type = 'primary';

  -- Pass 1: inside the difficulty band, at most one question per subtopic.
  INSERT INTO _topic_picked(id, subtopic)
  SELECT id, subtopic FROM (
    SELECT DISTINCT ON (subtopic) id, subtopic, importance_weight, seen, level_weight, difficulty, r
    FROM _topic_pool
    WHERE in_band AND level_weight > 0
    ORDER BY subtopic, importance_weight DESC, power(0.25, seen) * level_weight DESC, difficulty ASC, r
  ) sub
  ORDER BY importance_weight DESC, power(0.25, seen) * level_weight DESC, difficulty ASC, r
  LIMIT p_count;

  -- Pass 2: still short -> allow repeated subtopics, stay inside the band.
  SELECT count(*) INTO v_picked FROM _topic_picked;
  IF v_picked < p_count THEN
    INSERT INTO _topic_picked(id, subtopic)
    SELECT tp.id, tp.subtopic FROM _topic_pool tp
    WHERE tp.in_band AND tp.level_weight > 0
      AND tp.id <> ALL(COALESCE((SELECT array_agg(pk.id) FROM _topic_picked pk), ARRAY[]::bigint[]))
    ORDER BY tp.importance_weight DESC, power(0.25, tp.seen) * tp.level_weight DESC, tp.difficulty ASC, tp.r
    LIMIT (p_count - v_picked);
  END IF;

  -- Pass 3: still short -> relax the difficulty band, nearest-to-band first
  -- (insurance for small categories so a sprint never dies on the band filter).
  SELECT count(*) INTO v_picked FROM _topic_picked;
  IF v_picked < p_count THEN
    INSERT INTO _topic_picked(id, subtopic)
    SELECT tp.id, tp.subtopic FROM _topic_pool tp
    WHERE tp.level_weight > 0
      AND tp.id <> ALL(COALESCE((SELECT array_agg(pk.id) FROM _topic_picked pk), ARRAY[]::bigint[]))
    ORDER BY GREATEST(v_min_diff - tp.difficulty, tp.difficulty - v_max_diff, 0) ASC,
             tp.importance_weight DESC, power(0.25, tp.seen) * tp.level_weight DESC, tp.r
    LIMIT (p_count - v_picked);
  END IF;

  -- Easiest question first: a warm-up ramp instead of the blueprint's phase order.
  RETURN QUERY
  SELECT pk.id AS q_id,
         (row_number() OVER (ORDER BY tp.difficulty ASC, random()))::int AS q_order
  FROM _topic_picked pk
  JOIN _topic_pool tp ON tp.id = pk.id
  LIMIT p_count;
END;
$function$;

REVOKE ALL ON FUNCTION public.select_topic_questions(uuid, text, text, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.select_topic_questions(uuid, text, text, integer, text) TO authenticated, service_role;

-- 3. Topic-sprint creator -------------------------------------------------------

CREATE OR REPLACE FUNCTION public.start_topic_interview(
  p_level text,
  p_category text,
  p_region text DEFAULT NULL::text
)
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
  v_free_topic_limit int := 1;
  v_topic_count int := 3;
BEGIN
  v_user := auth.uid();
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_level NOT IN ('intern','analyst','associate') THEN RAISE EXCEPTION 'Invalid level: %', p_level; END IF;
  IF p_category NOT IN ('Behavioral / Fit','Accounting','Corporate Finance','Valuation','M&A',
                        'Restructuring','Private Equity / LBO','Capital Markets',
                        'Business Acumen / Markets','Due Diligence','Case Study','Brainteaser') THEN
    RAISE EXCEPTION 'Invalid category: %', p_category;
  END IF;
  IF p_region IS NOT NULL AND p_region NOT IN ('US','EMEA','Global') THEN RAISE EXCEPTION 'Invalid region: %', p_region; END IF;

  -- Atomic quota gate: same entitlements row lock pattern as start_interview
  -- (2026_11), so concurrent calls serialize and a direct RPC call can't bypass
  -- the route. Topic sprints are metered separately from standard interviews.
  INSERT INTO public.user_entitlements (user_id, plan)
    VALUES (v_user, 'free')
    ON CONFLICT (user_id) DO NOTHING;

  SELECT plan, subscription_status, current_period_end
    INTO v_plan, v_status, v_period_end
    FROM public.user_entitlements
    WHERE user_id = v_user
    FOR UPDATE;

  v_is_paid := (v_plan = 'hardo')
    OR (v_plan = 'paid'
        AND v_status = 'active'
        AND v_period_end IS NOT NULL
        AND v_period_end >= now());

  IF NOT v_is_paid THEN
    IF p_level <> 'intern' THEN
      RAISE EXCEPTION 'level_locked: % requires a paid plan', p_level
        USING ERRCODE = 'insufficient_privilege';
    END IF;

    SELECT count(*) INTO v_count
      FROM public.interviews
      WHERE user_id = v_user
        AND kind = 'topic'
        AND status IN ('in_progress','paused','completed','finalized');
    IF v_count >= v_free_topic_limit THEN
      RAISE EXCEPTION 'topic_limit_reached: free plan allows % topic sprint(s)', v_free_topic_limit
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;

  INSERT INTO public.interviews (user_id, status, started_at, candidate_level, total_questions, total_followups, kind, topic_category)
    VALUES (v_user, 'in_progress', NOW(), p_level, v_topic_count, 0, 'topic', p_category)
    RETURNING id INTO v_interview;

  INSERT INTO public.interview_steps (interview_id, question_id, order_index, is_follow_up, ai_decision, ai_reason)
    SELECT v_interview, q.q_id, q.q_order, false, 'seeded', 'topic v1: category=' || p_category
    FROM public.select_topic_questions(v_user, p_level, p_category, v_topic_count, p_region) q;
  GET DIAGNOSTICS v_count := ROW_COUNT;
  IF v_count < v_topic_count THEN
    -- Raising aborts the transaction, so the interview row above is rolled back.
    RAISE EXCEPTION 'topic_unavailable: only % question(s) available for % at % level', v_count, p_category, p_level;
  END IF;

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

REVOKE ALL ON FUNCTION public.start_topic_interview(text, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_topic_interview(text, text, text) TO authenticated, service_role;

-- 4. Quota status: expose topic-sprint usage (existing keys unchanged) ----------

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
  v_topic_used int;
  v_free_limit int := 1;
  v_free_topic_limit int := 1;
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

  -- Standard and topic interviews are metered separately.
  SELECT count(*) INTO v_used FROM public.interviews
  WHERE user_id = v_user
    AND kind = 'standard'
    AND status IN ('in_progress','paused','completed','finalized');

  SELECT count(*) INTO v_topic_used FROM public.interviews
  WHERE user_id = v_user
    AND kind = 'topic'
    AND status IN ('in_progress','paused','completed','finalized');

  RETURN jsonb_build_object(
    'plan', CASE WHEN v_is_paid THEN v_plan ELSE 'free' END,
    'is_paid', v_is_paid,
    'interviews_used', v_used,
    'free_limit', v_free_limit,
    'topic_used', v_topic_used,
    'topic_free_limit', v_free_topic_limit,
    'subscription_status', v_status,
    'current_period_end', v_period_end,
    'allowed_levels', CASE WHEN v_is_paid THEN ARRAY['intern','analyst','associate'] ELSE ARRAY['intern'] END,
    'can_start', CASE WHEN v_is_paid THEN true ELSE v_used < v_free_limit END,
    'can_start_topic', CASE WHEN v_is_paid THEN true ELSE v_topic_used < v_free_topic_limit END
  );
END;
$function$;
