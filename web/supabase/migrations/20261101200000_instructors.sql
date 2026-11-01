-- Instructors (courses) and skippers (passages). `sample` marks placeholder profiles; the site labels them until
-- real people replace them.
create table public.instructors (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  sort int not null default 0,
  name text not null,
  role text not null check (role in ('Lead instructor', 'Instructor', 'Skipper')),
  photo_id text not null,
  photo_alt text not null default '',
  qualification text not null default '',
  seasons int check (seasons >= 0),
  languages text[] not null default '{}',
  bio text not null default '',
  courses text[] not null default '{}',
  legs text[] not null default '{}',
  sample boolean not null default true,
  created_at timestamptz not null default now()
);
comment on table public.instructors is 'Instructors and skippers. Text is English; the site translates it. courses = course slugs taught, legs = passage_legs.leg skippered. sample = placeholder profile.';
comment on column public.instructors.photo_id is 'Unsplash photo id; the site crops it to the face (fit=facearea).';

alter table public.instructors enable row level security;
create policy "Anyone can read instructors" on public.instructors for select to anon, authenticated using (true);
