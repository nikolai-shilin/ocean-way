-- Phase 4: the public key reads, nothing else; every content row knows when it last changed.

-- 1. Write privileges. Row-level security already blocks writes (there are only read policies), but the public
--    roles still held INSERT/UPDATE/DELETE/TRUNCATE on every table. Take them away as a second lock. Bookings are
--    written by create_booking() (security definer), editors use Studio or the service role: neither needs them.
revoke all on all tables in schema public from anon, authenticated;
grant select on public.courses, public.course_dates, public.passage_legs, public.passages, public.yachts,
  public.instructors, public.theory_topics, public.articles, public.article_translations to anon, authenticated;
-- article_translations_stale (translations behind their English text) is an editor's list, not for the site.
-- Tables created later: read-only for the public roles too (row-level security still decides which rows).
alter default privileges for role postgres in schema public
  revoke insert, update, delete, truncate, references, trigger on tables from anon, authenticated;

-- 2. updated_at on every content table, kept current by a trigger.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['courses', 'course_dates', 'passage_legs', 'passages', 'yachts', 'instructors',
                           'theory_topics', 'articles', 'article_translations'] loop
    execute format('alter table public.%I add column if not exists updated_at timestamptz not null default now()', t);
    execute format('drop trigger if exists touch_updated_at on public.%I', t);
    execute format('create trigger touch_updated_at before update on public.%I for each row execute function private.touch_updated_at()', t);
  end loop;
end $$;
