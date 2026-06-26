-- Migration: cleanup - remove one exact-duplicate primary question
--
-- id 329 ("Pitch me a stock", category Case Study, childless) is an exact text
-- duplicate of id 319 ("Pitch me a stock", category Business Acumen / Markets),
-- which is the canonical copy and carries the follow-up chain (320, 321, 322).
-- Removing the childless duplicate de-duplicates the bank. Reversible.
--
-- NOTE (not applied here): a set of venture-capital-flavored questions currently
-- live under "Private Equity / LBO" (538,1040,1041,1042,1173,1175-1181),
-- "Case Study" (561,584,586) and "Corporate Finance" (1136). They are defensibly
-- categorized (there is no dedicated Venture Capital category); recategorizing
-- them is left as a product decision rather than changed unilaterally.

delete from public.questions where id = 329;
