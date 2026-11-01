-- Courses that end in an IYT certificate carry the IYT prefix in their name (ICC is a UN-ECE certificate, left as is).
update public.courses set name = 'IYT ' || name
where slug in ('vhf-radio-operator', 'introduction-to-yachting', 'international-flotilla-skipper', 'bareboat-skipper',
               'yachtmaster-coastal', 'yachtmaster-offshore', 'yachtmaster-ocean')
  and name not like 'IYT %';
