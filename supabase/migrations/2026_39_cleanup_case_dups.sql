-- Migration: cleanup - de-duplicate 3 within-"Case Study" pairs (guarded)
--
-- Each pair is the same case scenario authored twice in Case Study at two levels.
-- Keep the more complete associate/d4 version, drop the thinner analyst/d3 duplicate
-- (d4 is reachable by both analyst and associate selectors, so no level loses it):
--   keep 571 (Pro Forma Build)   | 1201
--   keep 579 (NOL Monetization)  | 1196
--   keep 574 (Cross-Border)      | 1187
--
-- GUARDED delete: only removes a row if it is NOT referenced by interview history
-- (interview_steps / question_exposure). In production 1201 IS referenced (it was
-- already served in interviews) and is therefore retained; 1196 and 1187 are
-- unreferenced and get removed. This guarantees the migration never violates the
-- foreign keys and is safe to re-run.

delete from public.questions q
where q.id in (1201, 1196, 1187)
  and not exists (select 1 from public.interview_steps s where s.question_id = q.id)
  and not exists (select 1 from public.question_exposure e where e.question_id = q.id);
