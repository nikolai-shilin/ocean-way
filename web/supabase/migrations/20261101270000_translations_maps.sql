-- Translations live on each row: {"ru": {...}, "de": {...}, "es": {...}} with the same field names as the English
-- columns. Strings replace the English value; lists of objects (program, faq, gallery, stops…) hold only the text keys
-- and merge with the English list item by item. A missing language or field falls back to English.
-- Route maps (SVG from prototypes/_build/build_leg_maps.py) move here from content/*_maps.json: {"d", "m", "nm"}.
alter table public.courses add column translations jsonb not null default '{}'::jsonb, add column map jsonb;
alter table public.passage_legs add column translations jsonb not null default '{}'::jsonb, add column map jsonb;
alter table public.yachts add column translations jsonb not null default '{}'::jsonb;
alter table public.instructors add column translations jsonb not null default '{}'::jsonb;
comment on column public.courses.translations is 'Text in other languages: {"ru": {"summary": "…", "program": [{"title": "…", "text": "…"}]}, …}. Missing keys fall back to English.';
comment on column public.passage_legs.translations is 'Text in other languages, same shape as courses.translations; stops hold only note.';
comment on column public.yachts.translations is 'Text in other languages: used_for, photo_alt, description.';
comment on column public.instructors.translations is 'Text in other languages: photo_alt, qualification, bio.';
comment on column public.courses.map is 'Route map SVG: {"d": desktop svg, "m": phone svg, "nm": distance}. Stop labels are English; the site translates them.';
comment on column public.passage_legs.map is 'Route map SVG: {"d": desktop svg, "m": phone svg, "nm": distance}. Stop labels are English; the site translates them.';
