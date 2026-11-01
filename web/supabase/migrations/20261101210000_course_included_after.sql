-- What the course price includes, what it doesn't, and the next steps after the course.
alter table public.courses
  add column included text[] not null default '{}',
  add column not_included text[] not null default '{}',
  add column after jsonb not null default '[]'::jsonb;
comment on column public.courses.after is 'Ordered list of {"title", "text"} next steps shown under "After the course".';
