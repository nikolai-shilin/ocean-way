-- Our discount on the charter fee, per boat. yacht_prices and charter_from_eur keep the list price;
-- the site shows the list price crossed out and our price = list price less this percentage.
-- Service pack, deposit and extras are not discounted.
alter table public.yachts
  add column discount_pct numeric(4, 1) not null default 0
    constraint yachts_discount_pct_range check (discount_pct >= 0 and discount_pct < 100);

comment on column public.yachts.discount_pct is 'Our discount off the weekly charter list price, in percent (10 = 10 %). 0 = list price.';

-- 11 Nov 2026: 10 % off every week of 2027 on the twelve Fethiye boats (we keep 5 % of the 15 % agent discount).
update public.yachts set discount_pct = 10 where published;
