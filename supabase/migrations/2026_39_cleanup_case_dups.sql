-- Migration: cleanup - remove 3 within-"Case Study" duplicate pairs
--
-- Each pair is the SAME case scenario (identical numbers) authored twice inside the
-- Case Study category at two levels. We keep the more complete associate (d4)
-- version and drop the thinner analyst (d3) near-duplicate. A d4 question is
-- reachable by both the analyst (2-4) and associate (3-4) selectors, so neither
-- level loses the scenario. All deleted rows are childless. Pre-existing data,
-- reversible.
--
--   keep 571  (Pro Forma Build)   -> delete 1201
--   keep 579  (NOL Monetization)  -> delete 1196
--   keep 574  (Cross-Border)      -> delete 1187

delete from public.questions where id in (1201, 1196, 1187);
