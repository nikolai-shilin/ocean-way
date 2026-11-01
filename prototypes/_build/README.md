# Prototype build scripts

The English pages are the source. After editing them, regenerate the other files from this folder:

```
python3 build_theory.py      # theory.html + theory-<slug>.html from theory/<slug>.json|html; theory row on home, links on course page
python3 build_booking.py     # booking.html from the course page's styles, icons and header
python3 build_flows.py       # user-flows.html
python3 merge_theory.py      # tr-<lang>-theory-a/b.json → tr-<lang>-theory.json
python3 i18n_build.py        # all pages in ru, de, es + language switcher, hreflang, canonical
```

Brand is Ocean Way (`brand.py` did the one-off RYC → Ocean Way rename of sources and translation files).
Translation dictionaries are context-free: one English string = one translation everywhere. Avoid the same short English
word meaning different things on different pages (e.g. a lone "A", or "Method" as payment vs navigation method).

`i18n_build.py` prints `missing N` per page and writes `i18n_missing.json` with any English text that has no translation yet.
Add those strings to `tr-<lang>.json` (site pages) or `tr-<lang>-booking.json` (booking page), then run it again.
`i18n_extract.py` lists every translatable string of the English pages (`i18n_strings.json`).
`build_passages_map.py` draws the training-passages map; it needs the ryc-rentals route-map tools and Natural Earth data
in `~/Developer/ryc-rentals/hotweb/scripts/route_maps`.
