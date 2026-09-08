-- Off White Cafe Admin — Active session count for Security settings
-- Run once in Supabase Dashboard → SQL Editor
-- Lets authenticated users see how many devices/sessions their account has.

create or replace function public.count_my_sessions()
returns integer
language sql
security definer
set search_path = auth, public
stable
as $$
  select count(*)::integer
  from auth.sessions
  where user_id = auth.uid();
$$;

revoke all on function public.count_my_sessions() from public;
grant execute on function public.count_my_sessions() to authenticated;
