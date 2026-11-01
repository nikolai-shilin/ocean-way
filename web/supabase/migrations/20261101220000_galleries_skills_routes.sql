-- Top photo galleries for courses and passage routes, grouped skills and a route for every course.
alter table public.courses
  add column gallery jsonb not null default '[]'::jsonb,
  add column skills jsonb not null default '[]'::jsonb,
  add column route jsonb not null default '[]'::jsonb,
  add column route_nm int;
alter table public.passage_legs add column gallery jsonb not null default '[]'::jsonb;
comment on column public.courses.gallery is 'Ordered list of {"photo_id", "shape" (l|p), "caption"} for the top gallery.';
comment on column public.courses.skills is 'Ordered list of {"icon", "title", "items"} for "What you will learn".';
comment on column public.courses.route is 'Ordered list of {"name", "lon", "lat", "note"}: the course route (or the one place a classroom course runs).';
