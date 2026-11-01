-- Fuller course pages: extra paragraphs, a day-by-day programme and a packing list.
alter table public.courses
  add column about text[] not null default '{}',
  add column program jsonb not null default '[]'::jsonb,
  add column bring text[] not null default '{}';
comment on column public.courses.program is 'Ordered list of {"title", "text"} steps (days or sessions).';

-- One row per passage route (each run in both directions): text, stops in route order, requirements, packing list.
create table public.passage_legs (
  leg text primary key,
  summary text not null,
  about text[] not null default '{}',
  stops jsonb not null default '[]'::jsonb,
  distance_nm int check (distance_nm > 0),
  program jsonb not null default '[]'::jsonb,
  requirements text[] not null default '{}',
  bring text[] not null default '{}',
  created_at timestamptz not null default now()
);
comment on table public.passage_legs is 'Passage routes. Text is English; the site translates it with its dictionaries. Stops run from the first port in the leg key to the second.';
comment on column public.passage_legs.stops is 'Ordered list of {"name", "lon", "lat", "note"}; lon/lat are null for an open-sea crossing.';

alter table public.passage_legs enable row level security;
create policy "Anyone can read passage legs" on public.passage_legs for select to anon, authenticated using (true);
