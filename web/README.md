# Ocean Way web

Next.js 16 app for the Ocean Way sailing school: home, Bareboat Skipper course, theory hub and articles, booking.
Four languages (`/en`, `/ru`, `/de`, `/es`), live dates, places and fleet from Supabase, deployed on Vercel.

Live: https://ocean-way.vercel.app

## How it is put together

- **Home and booking** are HTML templates in `src/templates` (`home.html`, `booking.html`, their scripts `*.js`, the
  English title, description and JSON-LD in `pages.ts`), translated when they render by `src/lib/templates.ts`: text
  between tags and the `alt`, `aria-label`, `placeholder` and `title` attributes go through the dictionaries, keyed by
  the English text. Edit the English template; add the translation of any new string to `content/i18n/<lang>.json`
  (a string without one shows in English). The pages then swap in live rows from the database. Their styles are
  `src/styles/home.css` and `booking.css`. `../prototypes` is a design reference only, except for theory articles.
- **Theory articles** are served from the database (`articles`, `article_translations`, `theory_topics`); the hub and
  article pages are rendered by `src/lib/articles.ts`. They are still written in `../prototypes/_build/theory` and
  built there (`build_theory.py`, `i18n_build.py`); then `python3 scripts/import_theory.py` loads the built pages
  (`../prototypes/theory*.html`) into the database (needs
  `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`). Pages pick up the change within seconds (see Freshness).
  The view `article_translations_stale` lists translations whose English body changed since they were made.
- **Pages** (`src/app/[lang]/…`) render that content server-side and replace the live parts with database rows:
  passages table and fleet on the home page, course dates and the booking card on the course page, dates and places in
  the booking flow. Pages revalidate every 60 s (booking 30 s).
- **Translations**: interface text, template pages and vocabulary from the database (ports, names) use
  `t()` with `content/i18n/<lang>.json` and `content/i18n-app/<lang>.json` (the second wins). Database text has
  its own translations in each row.
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
The database is the only source of the catalogue (courses, routes, boats, instructors, dates), with each row's
Russian, German and Spanish text in its `translations` column and route maps in `map`. Edit it in Supabase Studio.
One-off data loads go in `supabase/load/` (gitignored) and are run with psql.
The public key can only read: `anon` and `authenticated` hold SELECT on the content tables and nothing else, and row
level security decides which rows (published articles only). Every content table has `updated_at`, set by a trigger.

## Freshness

Every database read is tagged with its table (`tagFor()` in `src/lib/db.ts`). After a write to a content table the
database trigger `private.revalidate_site()` posts `{"table": "…"}` to `POST /api/revalidate`, which clears that
table's tag (`TAGS_FOR`), so an edit in Studio shows on the next page visit. The address and the shared secret are in
Supabase Vault (`revalidate_url`, `revalidate_secret`); the same secret is `REVALIDATE_SECRET` in Vercel. A booking
clears the dates and passages tags itself. The `revalidate` timers on the pages stay as a safety net.

## Environment

See `.env.example`: `NEXT_PUBLIC_SITE_URL`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `REVALIDATE_SECRET`
(optional locally; without it `/api/revalidate` answers 503). The site needs the
Supabase variables to build and render (`vercel env pull` writes them to `.env.local`). Without them, only the
bookings endpoint degrades gracefully: it answers "not open yet".

## Commands

```
npm install
npm run dev        # http://localhost:3000
npm run build
```
Deploy: `vercel deploy --prod` from the repository root (the Vercel project's root directory is `web`).
