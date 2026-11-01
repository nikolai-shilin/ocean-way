-- Course catalogue and boat details for the course, fleet and boat pages.

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  sort integer not null default 0,
  name text not null,
  level text not null,
  duration text not null,
  scope text not null,
  price_from_eur integer not null check (price_from_eur >= 0),
  price_unit text not null default 'per person',
  photo_id text not null,
  photo_alt text not null,
  summary text not null,
  description text not null,
  learn text[] not null default '{}',
  requirements text[] not null default '{}',
  certificate text not null default '',
  theory text[] not null default '{}',
  created_at timestamptz not null default now()
);
comment on table public.courses is 'IYT course catalogue. Text is English; the site translates it with its dictionaries.';

alter table public.courses enable row level security;
create policy "Anyone can read courses" on public.courses for select to anon, authenticated using (true);

alter table public.yachts
  add column slug text,
  add column beam_m numeric(3, 1),
  add column draft_m numeric(3, 1),
  add column heads integer,
  add column engine_hp integer,
  add column description text not null default '';
create unique index yachts_slug_key on public.yachts (slug);
