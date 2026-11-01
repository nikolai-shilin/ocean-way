-- Ocean Way: course dates, training passages, fleet, bookings.
-- Public visitors may read dates, passages and yachts. Nobody can read bookings through the API. Bookings are
-- created only through create_booking(), which checks the input, prices the booking from the database and locks
-- the date so two people cannot take the last place. Places left are exposed only as numbers, via functions.

create table public.course_dates (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  course_slug text not null,
  starts_on date not null,
  ends_on date not null,
  area text not null,
  boat text not null,
  meeting_point text not null,
  price_eur integer not null check (price_eur >= 0),
  places_total integer not null default 4 check (places_total between 1 and 12),
  places_held integer not null default 0 check (places_held >= 0),
  created_at timestamptz not null default now(),
  unique (course_slug, key),
  check (ends_on > starts_on)
);
comment on column public.course_dates.places_held is 'Places taken outside the website (phone, Telegram, staff).';

create table public.passages (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  starts_on date not null,
  ends_on date not null,
  from_port text not null,
  to_port text not null,
  leg text not null,
  waters text not null,
  price_eur integer not null check (price_eur >= 0),
  places_total integer not null default 4 check (places_total between 1 and 12),
  places_held integer not null default 0 check (places_held >= 0),
  return_id uuid references public.passages (id) on delete set null,
  created_at timestamptz not null default now(),
  check (ends_on > starts_on)
);
create index passages_return_id_idx on public.passages (return_id);

create table public.yachts (
  id uuid primary key default gen_random_uuid(),
  sort integer not null default 0,
  model text not null,
  year integer not null,
  length_m numeric(4, 1) not null,
  cabins integer not null,
  berths integer not null,
  base text not null,
  used_for text not null,
  charter_from_eur integer not null,
  photo_id text not null,
  photo_alt text not null,
  created_at timestamptz not null default now()
);

create sequence public.booking_ref_seq start 1000;

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  item_type text not null check (item_type in ('course', 'passage')),
  course_date_id uuid references public.course_dates (id),
  passage_id uuid references public.passages (id),
  return_passage_id uuid references public.passages (id),
  cabin text not null check (cabin in ('shared', 'two', 'single')),
  people integer not null check (people between 1 and 4),
  plan text not null check (plan in ('deposit', 'full')),
  method text not null check (method in ('card', 'bank')),
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  telegram text,
  country text,
  experience text,
  newsletter boolean not null default false,
  lang text not null default 'en' check (lang in ('en', 'ru', 'de', 'es')),
  amount_total integer not null check (amount_total >= 0),
  amount_now integer not null check (amount_now >= 0),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz not null default now(),
  check ((item_type = 'course' and course_date_id is not null and passage_id is null and return_passage_id is null)
      or (item_type = 'passage' and passage_id is not null and course_date_id is null))
);
create index bookings_course_date_id_idx on public.bookings (course_date_id);
create index bookings_passage_id_idx on public.bookings (passage_id);
create index bookings_return_passage_id_idx on public.bookings (return_passage_id);
create index bookings_created_at_idx on public.bookings (created_at desc);

-- Row level security: public read for the catalogue; bookings have no policies, so the API cannot read them.
alter table public.course_dates enable row level security;
alter table public.passages enable row level security;
alter table public.yachts enable row level security;
alter table public.bookings enable row level security;

create policy "Anyone can read course dates" on public.course_dates for select to anon, authenticated using (true);
create policy "Anyone can read passages" on public.passages for select to anon, authenticated using (true);
create policy "Anyone can read yachts" on public.yachts for select to anon, authenticated using (true);

revoke all on sequence public.booking_ref_seq from anon, authenticated;

-- Places taken by web bookings that are not cancelled.
create function public.taken_course(p_id uuid) returns integer
language sql stable security definer set search_path = '' as $$
  select coalesce(sum(people), 0)::integer from public.bookings where course_date_id = p_id and status <> 'cancelled'
$$;
create function public.taken_passage(p_id uuid) returns integer
language sql stable security definer set search_path = '' as $$
  select coalesce(sum(people), 0)::integer from public.bookings
  where (passage_id = p_id or return_passage_id = p_id) and status <> 'cancelled'
$$;
revoke all on function public.taken_course, public.taken_passage from public, anon, authenticated;

-- Catalogue with places left (only the number, never the bookings themselves).
create function public.course_dates_live(p_slug text)
returns table (id uuid, key text, course_slug text, starts_on date, ends_on date, area text, boat text, meeting_point text,
               price_eur integer, places_total integer, places_left integer)
language sql stable security definer set search_path = '' as $$
  select d.id, d.key, d.course_slug, d.starts_on, d.ends_on, d.area, d.boat, d.meeting_point, d.price_eur, d.places_total,
         d.places_total - d.places_held - public.taken_course(d.id)
  from public.course_dates d where d.course_slug = p_slug order by d.starts_on
$$;
create function public.passages_live()
returns table (id uuid, key text, starts_on date, ends_on date, from_port text, to_port text, leg text, waters text,
               price_eur integer, places_total integer, places_left integer, return_id uuid)
language sql stable security definer set search_path = '' as $$
  select p.id, p.key, p.starts_on, p.ends_on, p.from_port, p.to_port, p.leg, p.waters, p.price_eur, p.places_total,
         p.places_total - p.places_held - public.taken_passage(p.id), p.return_id
  from public.passages p order by p.starts_on
$$;
grant execute on function public.course_dates_live, public.passages_live to anon, authenticated;

-- Create a booking. Everything that matters is decided here, not in the browser or the web server.
create function public.create_booking(
  p_item_type text, p_option_id uuid, p_return_id uuid, p_cabin text, p_people integer, p_plan text, p_method text,
  p_first_name text, p_last_name text, p_email text, p_phone text, p_telegram text, p_country text, p_experience text,
  p_newsletter boolean, p_lang text
) returns table (ref text, amount_total integer, amount_now integer)
language plpgsql security definer set search_path = ''
as $$
declare
  v_left integer; v_start date; v_price integer; v_total integer; v_ref text;
  v_ret_price integer := 0; v_ret_left integer;
begin
  if p_item_type not in ('course', 'passage') then raise exception 'invalid: item'; end if;
  if p_people is null or p_people < 1 or p_people > 4 then raise exception 'invalid: people'; end if;
  if p_cabin not in ('shared', 'two', 'single') then raise exception 'invalid: cabin'; end if;
  if p_cabin = 'single' and p_people <> 1 then raise exception 'invalid: a cabin to yourself is for one person'; end if;
  if p_cabin = 'two' and p_people < 2 then raise exception 'invalid: a double cabin is for two people'; end if;
  if p_plan not in ('deposit', 'full') or p_method not in ('card', 'bank') then raise exception 'invalid: payment'; end if;
  if coalesce(length(trim(p_first_name)), 0) not between 1 and 100 or coalesce(length(trim(p_last_name)), 0) not between 1 and 100
     or p_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' or length(p_email) > 200
     or length(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')) not between 7 and 20 then
    raise exception 'invalid: details';
  end if;

  if p_item_type = 'course' then
    select d.price_eur, d.starts_on, d.places_total - d.places_held - public.taken_course(d.id)
      into v_price, v_start, v_left from public.course_dates d where d.id = p_option_id for update;
  else
    select p.price_eur, p.starts_on, p.places_total - p.places_held - public.taken_passage(p.id)
      into v_price, v_start, v_left from public.passages p where p.id = p_option_id for update;
    if p_return_id is not null then
      select p.price_eur, p.places_total - p.places_held - public.taken_passage(p.id)
        into v_ret_price, v_ret_left from public.passages p where p.id = p_return_id for update;
      if v_ret_left is null then raise exception 'invalid: return leg'; end if;
      if v_ret_left < p_people then raise exception 'full: not enough places on the return leg'; end if;
    end if;
  end if;
  if v_price is null then raise exception 'invalid: date'; end if;
  if v_left < p_people then raise exception 'full: not enough places'; end if;

  v_total := (v_price + coalesce(v_ret_price, 0)) * p_people + case when p_cabin = 'single' then 450 else 0 end;
  v_ref := 'OW-' || to_char(v_start, 'YYMMDD') || '-' || nextval('public.booking_ref_seq');

  insert into public.bookings (ref, item_type, course_date_id, passage_id, return_passage_id, cabin, people, plan, method,
    first_name, last_name, email, phone, telegram, country, experience, newsletter, lang, amount_total, amount_now)
  values (v_ref, p_item_type,
    case when p_item_type = 'course' then p_option_id end,
    case when p_item_type = 'passage' then p_option_id end,
    case when p_item_type = 'passage' then p_return_id end,
    p_cabin, p_people, p_plan, p_method, trim(p_first_name), trim(p_last_name), lower(trim(p_email)), trim(p_phone),
    nullif(trim(coalesce(p_telegram, '')), ''), left(p_country, 80), left(p_experience, 40), coalesce(p_newsletter, false),
    case when p_lang in ('en', 'ru', 'de', 'es') then p_lang else 'en' end,
    v_total, case when p_plan = 'deposit' then round(v_total * 0.3)::integer else v_total end);

  return query select v_ref, v_total, case when p_plan = 'deposit' then round(v_total * 0.3)::integer else v_total end;
end;
$$;
revoke all on function public.create_booking from public;
grant execute on function public.create_booking to anon, authenticated;
