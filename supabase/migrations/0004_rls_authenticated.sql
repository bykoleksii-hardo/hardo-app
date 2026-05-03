-- 0004_rls_authenticated.sql
-- Rebind RLS policies on user_roles + knowledge_articles to the "authenticated" role.
-- Without an explicit role binding, policies attach to the "public" role only,
-- and authenticated requests fall through and get blocked.

-- ----- user_roles -----

drop policy if exists "user_roles_self_select" on public.user_roles;
create policy "user_roles_self_select"
  on public.user_roles for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "user_roles_admin_select" on public.user_roles;
create policy "user_roles_admin_select"
  on public.user_roles for select
  to authenticated
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  );

drop policy if exists "user_roles_admin_write" on public.user_roles;
create policy "user_roles_admin_write"
  on public.user_roles for all
  to authenticated
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  );

-- ----- knowledge_articles -----

drop policy if exists "knowledge_articles_public_read" on public.knowledge_articles;
create policy "knowledge_articles_public_read"
  on public.knowledge_articles for select
  to anon, authenticated
  using (status = 'published');

drop policy if exists "knowledge_articles_staff_read_all" on public.knowledge_articles;
create policy "knowledge_articles_staff_read_all"
  on public.knowledge_articles for select
  to authenticated
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role in ('admin','editor')
    )
  );

drop policy if exists "knowledge_articles_staff_write" on public.knowledge_articles;
create policy "knowledge_articles_staff_write"
  on public.knowledge_articles for all
  to authenticated
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role in ('admin','editor')
    )
  )
  with check (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role in ('admin','editor')
    )
  );
