-- 2026_13_function_search_path.sql
-- Advisor 0011 (function_search_path_mutable): pin an explicit search_path on the
-- six helper/trigger functions that lacked one. All are SECURITY INVOKER; this
-- does NOT change their bodies, it only removes the role-mutable search_path
-- warning. search_path = 'public' matches the convention used by the SECURITY
-- DEFINER RPCs in this database and keeps unqualified references to public
-- objects resolving correctly.

alter function public.grade_to_rank(text)               set search_path to 'public';
alter function public.rank_to_grade(numeric)            set search_path to 'public';
alter function public.interview_letter_grade(uuid)      set search_path to 'public';
alter function public.set_updated_at()                  set search_path to 'public';
alter function public.tg_user_profiles_touch()          set search_path to 'public';
alter function public.touch_step_feedback_updated_at()  set search_path to 'public';
