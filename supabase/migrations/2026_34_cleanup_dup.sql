-- Migration: cleanup - remove exact-duplicate "Pitch me a stock" (id 329)
--
-- id 329 (Case Study) is an exact text duplicate of id 319 (Business Acumen / Markets),
-- which is canonical and owns the follow-up chain (320,321,322).
--
-- GUARDED delete: only removes 329 if it is NOT referenced by interview history
-- (interview_steps / question_exposure), so it can never violate those foreign keys.
-- In production 329 IS referenced, so this is a safe no-op there and the duplicate is
-- intentionally retained to preserve interview history.
--
-- NOTE (not applied): VC-flavored questions under PE/LBO (538,1040-1042,1173,1175-1181),
-- Case Study (561,584,586) and Corporate Finance (1136) are left as a product decision.

delete from public.questions q
where q.id = 329
  and not exists (select 1 from public.interview_steps s where s.question_id = q.id)
  and not exists (select 1 from public.question_exposure e where e.question_id = q.id);
