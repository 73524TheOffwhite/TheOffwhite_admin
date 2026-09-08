-- Off White Cafe Admin — Homepage CMS setup
-- Run once in Supabase Dashboard → SQL Editor
-- Enables admin save/load for page_content + public image hosting.

-- 1) Public media bucket (fast CDN delivery via Supabase Storage)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  10485760,
  array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- 2) Storage policies
drop policy if exists "Public read media" on storage.objects;
create policy "Public read media"
on storage.objects for select
to public
using (bucket_id = 'media');

drop policy if exists "Anon upload media" on storage.objects;
create policy "Anon upload media"
on storage.objects for insert
to anon, authenticated
with check (bucket_id = 'media');

drop policy if exists "Anon update media" on storage.objects;
create policy "Anon update media"
on storage.objects for update
to anon, authenticated
using (bucket_id = 'media')
with check (bucket_id = 'media');

drop policy if exists "Anon delete media" on storage.objects;
create policy "Anon delete media"
on storage.objects for delete
to anon, authenticated
using (bucket_id = 'media');

-- 3) page_content read/write for CMS (anon key used by admin Vite app)
alter table public.page_content enable row level security;

drop policy if exists "Public read page_content" on public.page_content;
create policy "Public read page_content"
on public.page_content for select
to public
using (true);

drop policy if exists "Anon insert page_content" on public.page_content;
create policy "Anon insert page_content"
on public.page_content for insert
to anon, authenticated
with check (true);

drop policy if exists "Anon update page_content" on public.page_content;
create policy "Anon update page_content"
on public.page_content for update
to anon, authenticated
using (true)
with check (true);

-- 4) testimonials write for CMS (UPDATE already allowed; INSERT needed for new reviews)
drop policy if exists "Anon insert testimonials" on public.testimonials;
create policy "Anon insert testimonials"
on public.testimonials for insert
to anon, authenticated
with check (true);

drop policy if exists "Anon update testimonials" on public.testimonials;
create policy "Anon update testimonials"
on public.testimonials for update
to anon, authenticated
using (true)
with check (true);
