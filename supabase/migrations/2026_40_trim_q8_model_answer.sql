-- Migration: trim the model answer of question 8 (Behavioral / Resume Walkthrough)
--
-- Remove the meta-preamble opener ("I'll give you the throughline rather than every
-- detail. ") so the model answer leads straight into substance. Idempotent and
-- apostrophe-encoding-agnostic: strips everything before "I studied economics" (the
-- start of the real answer). A no-op once already trimmed.

update public.questions
set model_answer = substring(model_answer from position('I studied economics' in model_answer))
where id = 8 and position('I studied economics' in model_answer) > 1;
