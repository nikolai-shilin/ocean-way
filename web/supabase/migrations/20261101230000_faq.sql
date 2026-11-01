-- Questions and answers for each course page and each passage route (English; the site translates them).
alter table public.courses add column faq jsonb not null default '[]'::jsonb;
alter table public.passage_legs add column faq jsonb not null default '[]'::jsonb;
comment on column public.courses.faq is 'Ordered list of {"q", "a"} shown under "Asked before booking" and as FAQPage structured data.';
comment on column public.passage_legs.faq is 'Ordered list of {"q", "a"} for this route; the questions shared by all passages are added after them.';
