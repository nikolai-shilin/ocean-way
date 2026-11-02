-- Theory articles move into the database (phase 2 of docs/plans/static-data-to-db.md).
-- articles: one row per article (facts shared by all languages); article_translations: the text of each article in
-- each language, body as HTML (sections, notes, diagrams as inline SVG); theory_topics: the hub's topic groups.
-- Rows are loaded by scripts/import_theory.py from the built prototype pages. Anyone can read published articles.

create table public.theory_topics (
  key text primary key,                              -- section id on the hub, e.g. 'harbour'
  sort int not null,
  name text not null,                                -- English; other languages in translations
  lead text not null,
  translations jsonb not null default '{}'::jsonb    -- {"ru": {"name": "…", "lead": "…"}, …}
);

create table public.articles (
  slug text primary key,
  topic text not null references public.theory_topics(key),
  sort int not null,                                 -- reading order: hub, "Keep reading", home row
  read_minutes int not null,
  photo_id text not null,                            -- Unsplash photo id of the cover
  course text,                                       -- course named in the "Practise it on" box
  course_slug text references public.courses(slug),  -- where that box links; null: the course list
  author text references public.instructors(slug),
  published_on date not null,
  updated_on date not null,
  published boolean not null default true
);

create table public.article_translations (
  slug text not null references public.articles(slug) on delete cascade on update cascade,
  lang text not null check (lang in ('en', 'ru', 'de', 'es')),
  title text not null,                               -- <title>, without " · Ocean Way"
  h1 text not null,
  lead text not null,
  description text not null,
  level text not null,                               -- level label in this language, e.g. 'Bareboat skipper'
  photo_alt text not null,
  summary text[] not null default '{}',              -- "In short" points
  toc jsonb not null default '[]'::jsonb,            -- [[section id, label], …]
  body_html text not null,
  source_hash text,                                  -- md5 of the English body this text was made from
  primary key (slug, lang)
);

create index article_translations_lang on public.article_translations (lang);

alter table public.theory_topics enable row level security;
alter table public.articles enable row level security;
alter table public.article_translations enable row level security;
create policy "Anyone can read theory topics" on public.theory_topics for select to anon, authenticated using (true);
create policy "Anyone can read published articles" on public.articles for select to anon, authenticated using (published);
create policy "Anyone can read published article text" on public.article_translations for select to anon, authenticated
  using (exists (select 1 from public.articles a where a.slug = article_translations.slug and a.published));

-- Translations whose English body has changed since they were made (their source_hash no longer matches).
create view public.article_translations_stale with (security_invoker = true) as
  select t.slug, t.lang
  from public.article_translations t
  join public.article_translations e on e.slug = t.slug and e.lang = 'en'
  where t.lang <> 'en' and t.source_hash is distinct from md5(e.body_html);
