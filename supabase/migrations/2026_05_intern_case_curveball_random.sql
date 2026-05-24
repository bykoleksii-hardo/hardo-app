-- Migration: intern level case/curveball randomization
-- Date: 2026-05-24
-- Changes the 12th-slot logic for intern interviews:
--   65% chance of 1 case (curveball=0)
--   35% chance of 1 curveball (case=0)
-- Other quotas/levels unchanged.

CREATE OR REPLACE FUNCTION public.select_interview_questions(
  p_user_id uuid,
  p_level text,
  p_count integer DEFAULT 12,
  p_region text DEFAULT NULL::text
)
RETURNS TABLE(q_id bigint, q_order integer, q_phase text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_levels text[];
  v_prev_level text;
  v_quota jsonb;
  v_min_diff int;
  v_max_diff int;
  v_phase text;
  v_need int;
  v_already int;
  v_picked_count int := 0;
  v_inserted_count int := 0;
  v_region text;
  v_regions text[];
BEGIN
  -- Region resolution
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

  -- Per-level config
  IF p_level = 'intern' THEN
    v_levels := ARRAY['intern','any'];
    v_prev_level := NULL;
    v_min_diff := 1;
    v_max_diff := 3;
    -- 12th slot: 65% case, 35% curveball
    IF random() < 0.65 THEN
      v_quota := '{"fit":3,"technical":8,"case":1,"curveball":0}'::jsonb;
    ELSE
      v_quota := '{"fit":3,"technical":8,"case":0,"curveball":1}'::jsonb;
    END IF;
  ELSIF p_level = 'analyst' THEN
    v_levels := ARRAY['analyst','any'];
    v_prev_level := 'intern';
    v_min_diff := 2;
    v_max_diff := 4;
    v_quota := '{"fit":2,"technical":7,"case":2,"curveball":1}'::jsonb;
  ELSE
    v_levels := ARRAY['associate','analyst','any'];
    v_prev_level := 'analyst';
    v_min_diff := 3;
    v_max_diff := 5;
    v_quota := '{"fit":2,"technical":5,"case":4,"curveball":1}'::jsonb;
  END IF;

  DROP TABLE IF EXISTS _pool;
  DROP TABLE IF EXISTS _picked;
  CREATE TEMP TABLE _picked (id bigint, phase text, subtopic text) ON COMMIT DROP;

  CREATE TEMP TABLE _pool ON COMMIT DROP AS
  WITH base AS (
    SELECT q.id, q.category, q.candidate_level, q.difficulty, q.importance,
           COALESCE(q.subtopic, q.category) AS subtopic,
           CASE
             WHEN q.category = 'Behavioral / Fit' THEN 'fit'
             WHEN q.category IN ('Accounting','Corporate Finance','Valuation',
               'M&A','Restructuring','Private Equity / LBO',
               'Capital Markets','Business Acumen / Markets',
               'Due Diligence') THEN 'technical'
             WHEN q.category = 'Case Study' THEN 'case'
             WHEN q.category = 'Brainteaser' THEN 'curveball'
             ELSE 'technical'
           END AS phase,
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
    WHERE q.candidate_level = ANY(v_levels)
      AND q.region = ANY(v_regions)
      AND q.difficulty BETWEEN v_min_diff AND v_max_diff
      AND q.type = 'primary'
  )
  SELECT * FROM base;

  -- Per-phase quota fill
  FOREACH v_phase IN ARRAY ARRAY['fit','technical','case','curveball']
  LOOP
    SELECT COUNT(*) INTO v_already FROM _picked WHERE phase = v_phase;
    v_need := GREATEST(0, ((v_quota->>v_phase)::int) - v_already);
    IF v_need > 0 THEN
      INSERT INTO _picked(id, phase, subtopic)
      SELECT id, phase, subtopic FROM (
        SELECT DISTINCT ON (subtopic) id, phase, subtopic,
               importance_weight, seen, level_weight, difficulty, r
        FROM _pool
        WHERE phase = v_phase
          AND id <> ALL(COALESCE((SELECT array_agg(id) FROM _picked), ARRAY[]::bigint[]))
          AND subtopic <> ALL(COALESCE((SELECT array_agg(subtopic) FROM _picked WHERE phase = v_phase), ARRAY[]::text[]))
          AND level_weight > 0
        ORDER BY subtopic, importance_weight DESC,
                 power(0.25, seen) * level_weight DESC, difficulty ASC, r
      ) sub
      ORDER BY importance_weight DESC, power(0.25, seen) * level_weight DESC,
               difficulty ASC, r
      LIMIT v_need;
      GET DIAGNOSTICS v_inserted_count := ROW_COUNT;
      IF v_inserted_count < v_need THEN
        INSERT INTO _picked(id, phase, subtopic)
        SELECT id, phase, subtopic FROM _pool
        WHERE phase = v_phase
          AND id <> ALL(COALESCE((SELECT array_agg(id) FROM _picked), ARRAY[]::bigint[]))
          AND level_weight > 0
        ORDER BY importance_weight DESC, power(0.25, seen) * level_weight DESC,
                 difficulty ASC, r
        LIMIT (v_need - v_inserted_count);
      END IF;
    END IF;
  END LOOP;

  -- Backfill
  SELECT count(*) INTO v_picked_count FROM _picked;
  IF v_picked_count < p_count THEN
    INSERT INTO _picked(id, phase, subtopic)
    SELECT id, phase, subtopic FROM _pool
    WHERE id <> ALL(COALESCE((SELECT array_agg(id) FROM _picked), ARRAY[]::bigint[]))
      AND level_weight > 0
    ORDER BY importance_weight DESC, power(0.25, seen) * level_weight DESC,
             difficulty ASC, r
    LIMIT (p_count - v_picked_count);
  END IF;

  RETURN QUERY
  SELECT p.id AS q_id,
         (row_number() OVER (
            ORDER BY array_position(ARRAY['fit','technical','case','curveball'], p.phase),
                     random()
         ))::int AS q_order,
         p.phase AS q_phase
  FROM _picked p
  LIMIT p_count;
END;
$function$;
