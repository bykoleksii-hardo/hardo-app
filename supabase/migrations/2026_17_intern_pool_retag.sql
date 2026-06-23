-- Migration: re-tag intern-pool questions that don't fit a summer-analyst screen
-- Date: 2026-06-23
--
-- Two groups move from the intern-eligible pool (candidate_level intern/any) to
-- 'analyst', so they stop surfacing on intern interviews. They remain available
-- to the analyst pool, where they belong.
--
--   1) Deal mechanics / legal / structure that assume deal context an intern
--      would not have:
--        617  R&W insurance                1035 SPA key sections
--        1034 MAC clause                   1033 escrow in M&A
--        1061 QoE one-time add-backs       1563 HY bond vs leveraged loan
--        555  sources & uses w/ rollover   553  dividend recap
--        1025 lever / unlever beta
--   2) Venture-capital / startup domain (off-domain for IB recruiting):
--        538  VC vs PE          539  funding stages     1040 pre/post-money
--        1041 founder dilution  1042 power law          580  SaaS LTV/CAC
--
-- Idempotent: the WHERE clause excludes rows already at 'analyst', so re-running
-- is a no-op. To undo, restore the prior candidate_level for these ids
-- (all were 'intern' except 617 and 580, which were 'any').

update public.questions
set candidate_level = 'analyst'
where id in (
  -- deal mechanics / legal / structure (Bucket 1)
  617, 1035, 1034, 1033, 1061, 1563, 555, 553, 1025,
  -- venture-capital / startup domain (Bucket 2)
  538, 539, 1040, 1041, 1042, 580
)
and candidate_level in ('intern', 'any');
