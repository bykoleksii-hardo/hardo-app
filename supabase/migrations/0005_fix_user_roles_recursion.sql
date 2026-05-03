-- 0005_fix_user_roles_recursion.sql
-- The admin_select / admin_write policies on user_roles caused infinite recursion
-- (they query user_roles inside a policy on user_roles).
-- Drop them. Self-select is enough; role admin work goes through service-side helpers
-- or SECURITY DEFINER functions when needed.

drop policy if exists "user_roles_admin_select" on public.user_roles;
drop policy if exists "user_roles_admin_write" on public.user_roles;

-- Also drop any old non-bound versions just in case the redo didn't take
drop policy if exists "user_roles_self_select" on public.user_roles;
create policy "user_roles_self_select"
  on public.user_roles for select
  to authenticated
  using (auth.uid() = user_id);
