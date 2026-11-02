-- 2027 schedule: dates for every course, for the year schedule on /courses.
-- One-day courses (VHF, ICC exam) start and end on the same day, so the end date may now equal the start.
alter table public.course_dates drop constraint course_dates_check;
alter table public.course_dates add constraint course_dates_check check (ends_on >= starts_on);

-- Classroom courses have no boat ('').
insert into public.course_dates (key, course_slug, starts_on, ends_on, area, boat, meeting_point, price_eur)
select d.s::text, d.slug, d.s, d.e, 'Fethiye, Türkiye', d.boat, 'Ece Marina, Fethiye', d.price
from (values
  ('vhf-radio-operator', date '2027-04-16', date '2027-04-16', '', 190),
  ('vhf-radio-operator', date '2027-05-14', date '2027-05-14', '', 190),
  ('vhf-radio-operator', date '2027-06-11', date '2027-06-11', '', 190),
  ('vhf-radio-operator', date '2027-07-09', date '2027-07-09', '', 190),
  ('vhf-radio-operator', date '2027-09-10', date '2027-09-10', '', 190),
  ('vhf-radio-operator', date '2027-10-08', date '2027-10-08', '', 190),
  ('introduction-to-yachting', date '2027-04-17', date '2027-04-24', 'Beneteau Oceanis 34.1', 990),
  ('introduction-to-yachting', date '2027-05-15', date '2027-05-22', 'Beneteau Oceanis 34.1', 990),
  ('introduction-to-yachting', date '2027-06-12', date '2027-06-19', 'Beneteau Oceanis 34.1', 990),
  ('introduction-to-yachting', date '2027-07-10', date '2027-07-17', 'Beneteau Oceanis 34.1', 990),
  ('introduction-to-yachting', date '2027-08-07', date '2027-08-14', 'Beneteau Oceanis 34.1', 990),
  ('introduction-to-yachting', date '2027-09-04', date '2027-09-11', 'Beneteau Oceanis 34.1', 990),
  ('introduction-to-yachting', date '2027-10-02', date '2027-10-09', 'Beneteau Oceanis 34.1', 990),
  ('international-flotilla-skipper', date '2027-05-15', date '2027-05-22', 'Beneteau Oceanis 38.1', 1290),
  ('international-flotilla-skipper', date '2027-06-12', date '2027-06-19', 'Beneteau Oceanis 38.1', 1290),
  ('international-flotilla-skipper', date '2027-09-11', date '2027-09-18', 'Beneteau Oceanis 38.1', 1290),
  ('international-flotilla-skipper', date '2027-10-09', date '2027-10-16', 'Beneteau Oceanis 38.1', 1290),
  ('icc', date '2027-05-22', date '2027-05-22', '', 150),
  ('icc', date '2027-06-19', date '2027-06-19', '', 150),
  ('icc', date '2027-09-18', date '2027-09-18', '', 150),
  ('icc', date '2027-10-16', date '2027-10-16', '', 150),
  ('yachtmaster-coastal', date '2027-05-08', date '2027-05-15', 'Jeanneau Sun Odyssey 490', 1890),
  ('yachtmaster-coastal', date '2027-06-26', date '2027-07-03', 'Jeanneau Sun Odyssey 490', 1890),
  ('yachtmaster-coastal', date '2027-09-25', date '2027-10-02', 'Jeanneau Sun Odyssey 490', 1890),
  ('yachtmaster-offshore', date '2027-05-29', date '2027-06-10', 'Hanse 460', 2690),
  ('yachtmaster-offshore', date '2027-10-16', date '2027-10-28', 'Hanse 460', 2690),
  ('yachtmaster-ocean', date '2027-02-15', date '2027-02-20', '', 890),
  ('yachtmaster-ocean', date '2027-11-15', date '2027-11-20', '', 890)
) as d(slug, s, e, boat, price)
on conflict (course_slug, key) do nothing;
