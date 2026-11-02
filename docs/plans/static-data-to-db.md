# Plan: move static data into the database

Status: phases 1 and 2 done, phase 3 started, phase 4 live (2 Nov 2026). The catalogue and the theory articles are served from the
database; the header, footer and icons are the app's own code. See the progress notes under each phase.

## Where things are today

**Already in Supabase (English text only):** `courses`, `course_dates`, `passage_legs`, `passages`, `yachts`, `instructors`, `bookings`.
The app reads these live. JSON copies in `web/content` serve only as offline fallbacks:

- `catalog.json`
- `fleet.json`
- `instructors.json`
- `seed.json`

`catalog_extra.json` is still the place where course and route texts are written. A script turns it into `supabase/seed_extra.sql`.

**Still in files:**

| Data | Where | Size | Used by |
|---|---|---|---|
| 20 theory articles × 4 languages, plus the Theory hub | `prototypes/_build/theory/*.json + *.html` → built HTML → `web/content/pages/theory-*.json` | ~6 MB | `/theory`, `/theory/[slug]`, home theory row, course pages, footer, sitemap, llms.txt |
| Home, Bareboat Skipper course page, booking page | `prototypes/*.html` → `web/content/pages/*.json` | ~1.5 MB | `/`, `/courses/bareboat-skipper`, `/booking` |
| Header, footer, icon sprite | Copied out of the prototype pages | small | every page |
| Translations of database text (course, route, boat, instructor texts) | `web/content/i18n-app/<lang>.json` (868 strings), keyed by the English text | 416 KB | `t()` at render time |
| Translations of prototype pages | `web/content/i18n/<lang>.json` (2654 strings) | 1.4 MB | baked into the page JSON at build time |
| Route maps (SVG) | `content/passage_maps.json`, `content/course_maps.json`, drawn by `build_leg_maps.py` | 200 KB | course and passage pages |
| Article diagrams (SVG) | Python in `build_theory.py` and `knot_diagrams.py` | — | theory articles |

The main problems today:

- **Editing needs code and a deploy.** Even fixing a typo means a deploy.
- **Translations are tied to English wording.** They are keyed by the exact English text, so changing one English word silently drops the translation.
- **There is no single source of truth.** Course and route data live both in the database and in `catalog_extra.json` / `catalog.json`.

## Principles

1. **Content goes in the database; layout stays in code.** Text, facts, prices, photos and translations go in the database. Page structure, styles and interface labels ("Book", "On this page") stay in the repo.
2. **Each row stores its own translations,** instead of a dictionary keyed by English text. A missing translation falls back to English.
3. **URLs and HTML stay the same.** Every migrated page must render the same text as before. We check this with a before/after comparison of every URL.
4. **Migrate one area at a time,** and keep the file fallback until that area is verified live.
5. **Load data through generated SQL migrations,** as now (`apply_migration` works; `execute_sql` writes time out).

## Phase 1: catalogue

Make the database the only source for courses, routes, boats, instructors and dates.

- **Translations column.** Add `translations jsonb` to `courses`, `passage_legs`, `yachts` and `instructors`. The shape is `{"ru": {"summary": "…", "about": ["…"], "faq": [{"q": "…", "a": "…"}]}, "de": {…}, "es": {…}}`.
- **Export existing translations.** A one-off script fills `translations` from `i18n-app/<lang>.json` by looking up each English field value. It reports any field that has no translation.
- **Localise in one place.** One helper, `localize(row, lang)`, in `src/lib/db.ts`. The getters return text in the page language, and pages stop calling `t()` on database text.
- **Route maps.** Add `map jsonb` (`{d, m, nm}`) to `courses` and `passage_legs`. `build_leg_maps.py` writes a migration instead of `passage_maps.json` / `course_maps.json`. Stop names are translated through the route's `translations`.
- **Bareboat Skipper page.** Its unique content is already in the `courses` row (gallery, skills, route, FAQ). Move the page onto the generic `/courses/[slug]` template and drop the prototype version.
- **Retire the file sources.** Remove `catalog_extra.json`, `build_catalog_extra.py` and the `seed_*.sql` pipeline. From then on the database is edited directly.
- **Remove the offline fallbacks:** `catalog.json`, `fleet.json`, `instructors.json` and `seed.json`. Local development uses a Supabase dev branch or `supabase start` instead.

**Done when:**
- Every course, passage and fleet page in all 4 languages renders the same text as before.
- `i18n-app` holds only interface labels.

**Phase 1 progress (2 Nov 2026):**
- Done: `translations` and `map` columns, filled for 8 courses, 7 routes, 10 boats and 8 instructors, plus 14 route maps.
- Done: getters return rows in the page language. Pages no longer call `t()` on database text. Port, area, base and stop
  names, names, roles and boat models stay English in the database and still go through `t()`, because code uses them as keys.
- Done: icons that are picked by text (scope, used for, skill groups) use the English row through `english()` in `db.ts`.
- Done: route maps come only from the `map` column. `build_leg_maps.py` also writes `supabase/load/route_maps.sql`.
- Done: `i18n-app` trimmed from about 870 to about 218 strings per language. The ones left are labels plus that vocabulary.
- Checked: a before/after comparison of all 248 earlier URLs shows only changes from other commits (new articles, the
  translated "What you do on board" list). Icons are the same in every language.
- Done: Bareboat Skipper is on the shared `/courses/[slug]` template (commit 748453f). The sections the template has no place
  for were dropped.
- Done: offline fallbacks removed (`catalog.json`, `fleet.json`, `instructors.json`, `seed.json`). Pages fail with a clear
  error without the Supabase variables. Only the bookings endpoint still answers "not open yet" without them.
- Done: seed pipeline removed (`catalog_extra.json`, `build_catalog_extra.py`, `make_seed_sql.py`, `seed*.sql`,
  `content/*_maps.json`). `build_leg_maps.py` reads stops from the database and writes the maps and distances to
  `supabase/load/route_maps.sql`.

## Phase 2: theory articles

New tables:

```sql
articles (
  slug text primary key,
  topic text,                 -- e.g. 'boat', 'harbour'
  level text,
  course_slug text references courses(slug),
  sort int,
  read_minutes int,
  photo_id text,
  photo_alt text,
  published boolean default false,
  updated_on date
)

article_translations (
  slug text references articles(slug),
  lang text check (lang in ('en','ru','de','es')),
  title, h1, lead, description text,
  summary text[],
  toc jsonb,                  -- [[id, label], …]
  body_html text,             -- sections; diagrams as <figure data-diagram="key">
  source_hash text,           -- hash of the English version it was translated from
  primary key (slug, lang)
)

diagrams (key text primary key, svg text, caption text, translations jsonb)   -- labels translated per language
theory_topics (key text primary key, sort int, translations jsonb)              -- name and lead per language
```

- **Import.** A script imports the 20 articles from the current build output: the `art-body` part of each page in each language, plus the metadata. Diagrams are rendered once by the existing Python and stored as SVG.
- **Templates.** React templates `TheoryHub` and `Article` replace the prototype HTML. They reuse `theory.css` and the current markup, so the design does not change.
- **Other readers of the article list.** The home theory row, the course-page theory links, the popular articles in the footer, the sitemap and llms.txt all read the `articles` table instead of `index.json` and `content/pages`.
- **Stale translations.** When the English body changes, `source_hash` no longer matches. A query lists the translations that need updating.

**Done when:**
- All 80 article URLs render the same text as before.
- `content/pages/theory-*` and `prototypes/_build/theory` are no longer used by the app.

**Phase 2 progress (2 Nov 2026):**
- Done: `theory_topics`, `articles` and `article_translations` (migration `20261102130000_articles.sql`), with
  read access for published rows only and the `article_translations_stale` view. 7 topics, 28 articles, 112
  translations.
- Done: `scripts/import_theory.py` loads them from the built pages. Articles are still written in
  `prototypes/_build/theory` with the existing build, so adding one stays the same, plus one import step.
- Done: `src/lib/articles.ts` renders the hub and the articles with the same markup as before. The home row, the
  course pages, the footer, the sitemap and llms.txt read the article list from the database.
- Changed from the plan: diagrams stay inline in each translation's `body_html` (their labels are already translated
  there), not in a `diagrams` table. The hub's header, footer and scripts still come from `content/pages/theory.*.json`
  until phase 3.
- Checked: full HTML of all 280 URLs against the old build. Differences: the Article JSON-LD on non-English pages now
  has the headline, level and topic in the page language, and six English titles and descriptions no longer show a
  literal `&#x27;`.

## Phase 3: home, booking, header and footer (optional, the largest phase)

- **React components.** Rebuild the home page, booking page, header, footer and icon sprite as React components. The live rows (dates, passages, boats, articles) already come from the database.
- **Interface text.** Text on these pages is interface or marketing copy. It moves into the repo dictionaries, with `i18n` and `i18n-app` merged into one, not into the database. The exception is copy the team wants to change without a deploy (for example the hero headline or the deals): that goes in a small `site_texts` table.
- **Clean-up.** Remove `content/pages`, `scripts/extract_content.py` and `ProtoPage`. The prototypes remain as design references only.

**Phase 3 progress (2 Nov 2026):**
- Decided: home-page copy stays in code (the repo dictionaries), no `site_texts` table (open decision 2).
- Done: the header (`siteHeader` in `src/lib/chrome.ts`), the footer (`FooterNav`, already React) and the icon sprite
  (`content/ow-icons.svg`, written by `build_icons.py`) are shared by every page. Page files no longer carry their own
  copies (`content/pages` went from 8.8 MB to 4.4 MB). Full HTML of all 280 URLs is unchanged.
- Left, by choice: home and booking stay built from the prototypes for now; `content/pages`, `extract_content.py`
  and `ProtoPage` stay until they move.

## Phase 4: editing and freshness

- **Access rules (RLS).** The public can read published rows only. Writes go through Supabase Studio or the service role, never the public key.
- **`updated_at` triggers** on all content tables.
- **Updating pages.**
  - **On demand:** a Supabase database webhook calls `POST /api/revalidate` with a secret, which refreshes the affected pages (by tag per table). Edits then appear within seconds.
  - **Safety net:** the current `revalidate` timers stay.
- **Editing tool.** Start with Supabase Studio. If the person editing is not technical, add a small password-protected `/admin` with forms per table later.

**Phase 4 progress (2 Nov 2026):**
- Checked: every table has row level security with read-only policies, but `anon` and `authenticated` still held
  INSERT/UPDATE/DELETE/TRUNCATE. Migration `20261102150000_read_only_public_updated_at.sql` leaves them SELECT on the
  content tables only (also for tables created later) and adds `updated_at` with a trigger to every content table.
  The three public functions (`course_dates_live`, `passages_live`, `create_booking`) stay callable by anyone, on purpose.
- Done in code: every database read is tagged with its table; `POST /api/revalidate` (Bearer `REVALIDATE_SECRET`)
  clears a table's tags; a booking clears dates and passages itself. Tested on a local build: wrong or missing
  secret → 401, unknown table → 400, and after a `yachts` change the pages that show boats render fresh on the next
  visit and are cached again after it.
- Done: `20261102150100_revalidate_webhook.sql` (pg_net, the secret and address in Vault, one statement-level trigger
  per content table). Both migrations applied; the Vault secret is `REVALIDATE_SECRET` (Production, hidden) in Vercel.
- Checked live: a write to `yachts` made the database post to `/api/revalidate` (200, `net._http_response`), and the
  next visit to `/en/fleet` was rebuilt (`x-vercel-cache: REVALIDATED`). The public key's writes are refused (401).
- Editing tool: Supabase Studio for now (open decision 1).

## Checking each phase

- **Before/after comparison.** Before switching, save the visible text of every URL in every language. After switching, compare. Allowed differences: none, apart from whitespace.
- **Production build.** `npm run build` must pass with the database environment variables. It needs the database, because the static paths come from it.
- **Rollback.** Keep the file readers on a flag until a phase has been live for a few days.

## Open decisions

1. **Who edits content, and with what?** Supabase Studio is enough for one technical editor. Otherwise a small admin page.
2. ~~Should home-page copy live in the database?~~ No (2 Nov 2026): it stays in code.
3. ~~Is it acceptable to drop the offline JSON fallbacks?~~ Yes (2 Nov 2026): local development uses the Supabase project.
