-- 0006_article_scheduling.sql
-- Article scheduling: extend status enum with 'scheduled' and add publish_due_articles RPC.

alter table public.knowledge_articles
  drop constraint if exists knowledge_articles_status_check;

alter table public.knowledge_articles
  add constraint knowledge_articles_status_check
  check (status in ('draft','scheduled','published'));

create or replace function public.publish_due_articles(p_secret text)
returns table (id uuid, slug text, title text, published_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_expected text;
begin
  select value into v_expected
    from public.app_secrets
   where key = 'cron_rpc_secret';

  if v_expected is null or length(v_expected) = 0 then
    raise exception 'publish_due_articles: server secret not configured';
  end if;
  if p_secret is null or p_secret <> v_expected then
    raise exception 'publish_due_articles: invalid secret';
  end if;

  return query
    update public.knowledge_articles a
       set status = 'published'
     where a.status = 'scheduled'
       and a.published_at is not null
       and a.published_at <= now()
    returning a.id, a.slug, a.title, a.published_at;
end;
$$;

revoke all on function public.publish_due_articles(text) from public;
grant execute on function public.publish_due_articles(text) to anon, authenticated, service_role;
