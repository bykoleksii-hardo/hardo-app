-- Migration: re-tag 3 borderline intern questions to analyst (pass 2)
-- Date: 2026-06-23
--
-- Follow-up to 2026_17. These three sit just above an intern (summer-analyst)
-- screen and move to the analyst pool:
--   552  carve-out vs clean standalone acquisition (Case Study) — deal-structure
--        nuance that assumes M&A process exposure
--   536  what is a quality-of-earnings analysis, why a buyer cares (Due
--        Diligence) — a DD workstream an intern would not run
--   1557 why hire a restructuring advisor instead of refinancing
--        (Restructuring) — RX-domain judgment beyond an intern screen
--
-- Intern case pool stays healthy after moving 552: 37 Global case questions
-- across 21 subtopics remain, and the intern quota needs only 1 case/interview.
--
-- Idempotent (WHERE excludes already-'analyst' rows). All three are 'intern'
-- today; to undo, restore candidate_level = 'intern' for these ids.

update public.questions
set candidate_level = 'analyst'
where id in (552, 536, 1557)
and candidate_level in ('intern', 'any');
