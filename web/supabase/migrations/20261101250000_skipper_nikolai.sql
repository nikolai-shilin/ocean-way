-- First real skipper profile: Nikolai Shilin (Aegean passages). Placeholder skippers move one place down.
insert into public.instructors (slug, sort, name, role, photo_id, photo_alt, qualification, seasons, languages, bio, courses, legs, sample) values
  ('nikolai', 5, 'Nikolai Shilin', 'Skipper', '/people/nikolai.webp', 'Nikolai Shilin at the helm of a sailing yacht', 'IYT Bareboat Skipper', 5, array['en','ru']::text[], 'Skippers our Aegean passages, from Fethiye to Bodrum and Kuşadası and on to Istanbul. He also writes the theory articles on this site, so what you read here is what you practise on board.', '{}'::text[], array['fethiye-bodrum','fethiye-kusadasi','kusadasi-istanbul']::text[], false)
on conflict (slug) do nothing;
update public.instructors set sort = sort + 1 where role = 'Skipper' and slug <> 'nikolai' and sort >= 5 and sort < 8;
comment on column public.instructors.photo_id is 'Unsplash photo id (the site crops it to the face), or a local square photo path starting with / such as /people/nikolai.webp.';
