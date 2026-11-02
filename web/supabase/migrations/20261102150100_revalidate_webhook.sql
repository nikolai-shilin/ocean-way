-- Phase 4: tell the site when content changes. After any write to a content table the database posts
-- {"table": "<name>"} to the site's /api/revalidate, which clears that table's cached reads; pages render fresh on
-- their next visit. The address and the shared secret live in Vault (revalidate_url, revalidate_secret); the same
-- secret is REVALIDATE_SECRET in the Vercel project. Without either Vault entry the trigger does nothing.

create extension if not exists pg_net;

-- Secret and address, created once. The secret is generated here and never written in the repo.
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'revalidate_secret') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'revalidate_secret', 'Bearer token for the site''s /api/revalidate');
  end if;
  if not exists (select 1 from vault.secrets where name = 'revalidate_url') then
    perform vault.create_secret('https://ocean-way.vercel.app/api/revalidate', 'revalidate_url', 'Where content changes are reported');
  end if;
end $$;

create or replace function private.revalidate_site() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  url text := (select decrypted_secret from vault.decrypted_secrets where name = 'revalidate_url');
  secret text := (select decrypted_secret from vault.decrypted_secrets where name = 'revalidate_secret');
begin
  if url is null or secret is null then return null; end if;
  -- pg_net sends after the transaction commits, so a rolled-back edit is never reported.
  perform net.http_post(
    url := url,
    body := jsonb_build_object('table', tg_table_name),
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || secret),
    timeout_milliseconds := 5000);
  return null;
end $$;
revoke all on function private.revalidate_site() from public, anon, authenticated;

-- One call per statement, not per row: a bulk import of 100 rows is one request.
do $$
declare t text;
begin
  foreach t in array array['courses', 'course_dates', 'passage_legs', 'passages', 'yachts', 'instructors',
                           'theory_topics', 'articles', 'article_translations', 'bookings'] loop
    execute format('drop trigger if exists revalidate_site on public.%I', t);
    execute format('create trigger revalidate_site after insert or update or delete or truncate on public.%I for each statement execute function private.revalidate_site()', t);
  end loop;
end $$;
