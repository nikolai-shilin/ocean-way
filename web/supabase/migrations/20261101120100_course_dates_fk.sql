
-- Every course date belongs to a course in the catalogue.
alter table public.course_dates add constraint course_dates_course_slug_fkey foreign key (course_slug) references public.courses (slug);
create index course_dates_course_slug_idx on public.course_dates (course_slug);
