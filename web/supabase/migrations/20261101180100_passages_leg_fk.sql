-- Every passage sails one of the routes in passage_legs.
alter table public.passages add constraint passages_leg_fkey foreign key (leg) references public.passage_legs (leg);
create index passages_leg_idx on public.passages (leg);
