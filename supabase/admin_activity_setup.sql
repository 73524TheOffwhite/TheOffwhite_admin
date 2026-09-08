-- Off White Cafe Admin — Activity log
-- Run once in Supabase Dashboard → SQL Editor

create table if not exists public.admin_activity (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid null,
  actor_name text not null default 'Admin',
  action text not null,
  avatar_url text null,
  created_at timestamptz not null default now()
);

create index if not exists admin_activity_created_at_idx
  on public.admin_activity (created_at desc);

alter table public.admin_activity enable row level security;

drop policy if exists "Read admin_activity" on public.admin_activity;
create policy "Read admin_activity"
on public.admin_activity for select
to anon, authenticated
using (true);

drop policy if exists "Insert admin_activity" on public.admin_activity;
create policy "Insert admin_activity"
on public.admin_activity for insert
to anon, authenticated
with check (true);
