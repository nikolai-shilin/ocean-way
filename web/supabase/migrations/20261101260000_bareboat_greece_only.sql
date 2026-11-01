-- Bareboat Skipper runs only in the Saronic Gulf, Greece: drop the two Split, Croatia weeks.
-- Neither had bookings or places held when this was written; the guard keeps any that do.
delete from public.course_dates d
where d.course_slug = 'bareboat-skipper'
  and d.key in ('2027-06-12', '2027-10-02')
  and d.area = 'Split, Croatia'
  and not exists (select 1 from public.bookings b where b.course_date_id = d.id);
