-- Off White Cafe — Public site visit / click analytics
-- Run once in Supabase Dashboard → SQL Editor
-- Public cafe website INSERTs page_view + click; this admin panel READs counts
-- for the Visitors and Clicks cards.

create table if not exists public.site_analytics (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in ('page_view', 'click')),
  path text not null default '/',
  referrer text null,
  user_agent text null,
  session_id text null,
  created_at timestamptz not null default now()
);

create index if not exists site_analytics_created_at_idx
  on public.site_analytics (created_at desc);

create index if not exists site_analytics_event_type_idx
  on public.site_analytics (event_type);

alter table public.site_analytics enable row level security;

drop policy if exists "Insert site_analytics" on public.site_analytics;
create policy "Insert site_analytics"
on public.site_analytics for insert
to anon, authenticated
with check (true);

drop policy if exists "Read site_analytics" on public.site_analytics;
create policy "Read site_analytics"
on public.site_analytics for select
to anon, authenticated
using (true);
