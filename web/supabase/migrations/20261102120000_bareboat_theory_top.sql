-- Bareboat Skipper: the first three theory articles are shown as "Start with these" cards on the course page.
-- They match the course summary: mooring, anchoring, navigation into harbour.
update public.courses set theory = array['med-mooring','anchoring','pilotage','sail-trim','reefing','right-of-way','navigation-lights','night-sailing','buoyage','berthing-alongside','dinghy-outboard','charter-check-in','engine-checks','engine-handling','boat-systems','skippering','provisioning','weather']::text[]
where slug = 'bareboat-skipper';
