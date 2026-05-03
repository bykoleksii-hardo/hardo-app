-- 0003_knowledge_hub.sql
-- Knowledge Hub: articles + role-based access for admin/editor authoring.

create table if not exists public.user_roles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  role       text not null check (role in ('user','editor','admin')) default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;

drop policy if exists "user_roles_self_select" on public.user_roles;
create policy "user_roles_self_select"
  on public.user_roles for select
  using (auth.uid() = user_id);

drop policy if exists "user_roles_admin_select" on public.user_roles;
create policy "user_roles_admin_select"
  on public.user_roles for select
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role = 'admin'
    )
  );

drop policy if exists "user_roles_admin_write" on public.user_roles;
create policy "user_roles_admin_write"
  on public.user_roles for all
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

create table if not exists public.knowledge_articles (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title         text not null,
  description   text,
  body_md       text not null default '',
  cover_url     text,
  tags          text[] not null default '{}',
  status        text not null check (status in ('draft','published')) default 'draft',
  published_at  timestamptz,
  author_id     uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists knowledge_articles_status_published_at_idx
  on public.knowledge_articles (status, published_at desc);

create index if not exists knowledge_articles_slug_idx
  on public.knowledge_articles (slug);

alter table public.knowledge_articles enable row level security;

drop policy if exists "knowledge_articles_public_read" on public.knowledge_articles;
create policy "knowledge_articles_public_read"
  on public.knowledge_articles for select
  using (status = 'published');

drop policy if exists "knowledge_articles_staff_read_all" on public.knowledge_articles;
create policy "knowledge_articles_staff_read_all"
  on public.knowledge_articles for select
  using (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = auth.uid() and ur.role in ('admin','editor')
    )
  );

drop policy if exists "knowledge_articles_staff_write" on public.knowledge_articles;
create policy "knowledge_articles_staff_write"
  on public.knowledge_articles for all
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

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_roles_set_updated_at on public.user_roles;
create trigger user_roles_set_updated_at
  before update on public.user_roles
  for each row execute procedure public.set_updated_at();

drop trigger if exists knowledge_articles_set_updated_at on public.knowledge_articles;
create trigger knowledge_articles_set_updated_at
  before update on public.knowledge_articles
  for each row execute procedure public.set_updated_at();

insert into public.user_roles (user_id, role)
values ('7f1799dd-1314-4b80-9f27-31bce5c12f49', 'admin')
on conflict (user_id) do update set role = 'admin', updated_at = now();
