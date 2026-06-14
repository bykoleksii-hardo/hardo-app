-- 2026_16_revoke_anon_interview_rpcs.sql
-- Defense-in-depth (advisor 0028, anon_security_definer_function_executable):
-- these interview RPCs are SECURITY DEFINER and require an authenticated session
-- (each checks auth.uid()), so the anon role has no legitimate use for them. They
-- were granted EXECUTE to PUBLIC + anon by default; revoke that so anon can no
-- longer reach them via /rest/v1/rpc, while keeping authenticated (the real
-- caller) and service_role (server-side).
--
-- Notes:
--  * Revoking only anon is insufficient while PUBLIC also has EXECUTE, so we
--    revoke from both anon and public, then (re)grant the intended roles.
--  * Advisor 0029 (authenticated can execute) intentionally REMAINS — these are
--    meant to be callable by signed-in users.
--  * select_interview_questions is called internally by start_interview (a
--    SECURITY DEFINER owned by postgres), so the owner context still executes it;
--    revoking anon/public does not affect that path.
--  * Subscription/webhook/rate-limit RPCs that legitimately serve anon are NOT
--    touched here.

revoke execute on function public.start_interview(text, text)                           from anon, public;
grant  execute on function public.start_interview(text, text)                           to authenticated, service_role;

revoke execute on function public.submit_answer(uuid, text)                             from anon, public;
grant  execute on function public.submit_answer(uuid, text)                             to authenticated, service_role;

revoke execute on function public.apply_ai_grade(uuid, text, text)                      from anon, public;
grant  execute on function public.apply_ai_grade(uuid, text, text)                      to authenticated, service_role;

revoke execute on function public.insert_followup_step(uuid, uuid, text)                from anon, public;
grant  execute on function public.insert_followup_step(uuid, uuid, text)                to authenticated, service_role;

revoke execute on function public.pause_interview(uuid)                                 from anon, public;
grant  execute on function public.pause_interview(uuid)                                 to authenticated, service_role;

revoke execute on function public.get_user_quota_status()                               from anon, public;
grant  execute on function public.get_user_quota_status()                               to authenticated, service_role;

revoke execute on function public.select_interview_questions(uuid, text, integer, text) from anon, public;
grant  execute on function public.select_interview_questions(uuid, text, integer, text) to authenticated, service_role;
