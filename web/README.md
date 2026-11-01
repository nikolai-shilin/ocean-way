# Ocean Way web

Next.js 16 app for the Ocean Way sailing school: home, Bareboat Skipper course, theory hub and articles, booking.
Four languages (`/en`, `/ru`, `/de`, `/es`), live dates, places and fleet from Supabase, deployed on Vercel.

Live: https://ocean-way.vercel.app

## How it is put together

- **Content and design** come from the finished prototypes in `../prototypes` (already translated).
  `python3 scripts/extract_content.py` turns them into `content/pages/<page>.<lang>.json` (header, main, footer,
  metadata, JSON-LD, page scripts) and `src/styles/<group>.css`. Re-run it after regenerating the prototypes
  (`../prototypes/_build`, see its README).
- **Pages** (`src/app/[lang]/…`) render that content server-side and replace the live parts with database rows:
  passages table and fleet on the home page, course dates and the booking card on the course page, dates and places in
  the booking flow. Pages revalidate every 60 s (booking 30 s).
- **Translations** for live data (dates, routes, places) use the same dictionaries (`content/i18n/<lang>.json`).
- **SEO**: per-language canonical and `hreflang` (incl. `x-default`), Open Graph, JSON-LD (Course, Article,
  BreadcrumbList, FAQPage, Organization), `sitemap.xml`, `robots.txt`; booking pages are `noindex`.
  `/` and paths without a language redirect by `Accept-Language` (`src/proxy.ts`).
- **Bookings**: the booking script posts to `POST /api/bookings`, which calls the database function
  `create_booking()`. That function validates the input, prices the booking from the catalogue (never from the
  browser), locks the date row so the last place cannot be sold twice, and returns the reference (`OW-YYMMDD-NNNN`).

## Database (Supabase)

`supabase/migrations/20261101000000_init.sql` creates `course_dates`, `passages`, `yachts`, `bookings` with row level
security: the catalogue is public read-only; `bookings` has no policies, so it cannot be read through the API at all.
Places left are exposed only as numbers via `course_dates_live(slug)` and `passages_live()`.
`places_held` on dates and passages is for places sold outside the website.
Sample data: `supabase/seed.sql` (generated from `content/seed.json` by `scripts/make_seed_sql.py`).

## Environment

See `.env.example`: `NEXT_PUBLIC_SITE_URL`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`. Without the Supabase
variables the site runs on `content/seed.json` and bookings answer "not open yet".

## Commands

```
npm install
npm run dev        # http://localhost:3000
npm run build
```
Deploy: `vercel deploy --prod` from the repository root (the Vercel project's root directory is `web`).
