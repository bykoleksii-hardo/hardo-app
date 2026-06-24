-- Migration: full-bank level audit re-tags (pass 3)
-- Date: 2026-06-23
--
-- Applies a systematic per-category level audit of all 542 primary questions
-- (one domain reviewer per category against a shared IB level rubric). 61 questions
-- move to a better-fitting candidate_level: 17 -> intern, 21 -> analyst,
-- 21 -> associate, 2 -> any. (617 and 1025 were already handled in 2026_17.)
--
-- Reachability: the selector only serves a question whose difficulty falls in the
-- new level's band (intern 1-3, analyst 2-4, associate 3-5). All 61 are in-band
-- EXCEPT 1214 (analyst diff 2 -> associate), whose difficulty is bumped to 3 so it
-- stays reachable.
--
-- Each UPDATE is guarded by the expected current level, so re-running is a no-op
-- once applied. To undo, restore the prior candidate_level (and 1214's difficulty=2).

-- -> intern (17): classic first-round fundamentals tagged too senior, basic
--    estimations/definitions, self-contained quant cases.
update public.questions set candidate_level='intern'
where id in (1570,132,152,615,61,67,77,610,1542,1544,1553,585,1184,1185,568,1139,613)
  and candidate_level in ('any','analyst','associate');

-- -> analyst (21): real mechanics / structured-judgment items mistagged at
--    any / intern / associate.
update public.questions set candidate_level='analyst'
where id in (570,571,583,597,599,1054,594,1051,609,606,1505,1506,612,614,1519,1521,524,1510,1511,1512,1513)
  and candidate_level in ('any','intern','associate');

-- -> associate (20, plus 1214 below): deal-running / structuring / negotiation judgment.
update public.questions set candidate_level='associate'
where id in (1192,1206,1188,1189,1197,1205,1503,1134,1165,1166,1172,1173,1167,1169,1161,1138,1105,1111,1554,1155)
  and candidate_level in ('any','analyst');

-- -> associate + difficulty fix (1214): unreachable at diff 2 under the associate
--    band (3-5); bump to 3.
update public.questions set candidate_level='associate', difficulty=3
where id = 1214 and candidate_level='analyst';

-- -> any (2): genuinely level-agnostic behavioral prompts mistagged associate.
update public.questions set candidate_level='any'
where id in (1378,1383) and candidate_level='associate';
