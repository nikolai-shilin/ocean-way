# Plan: move static data into the database

Status: proposal, 1 Nov 2026. Nothing has been migrated yet.

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

## Phase 3: home, booking, header and footer (optional, the largest phase)

- **React components.** Rebuild the home page, booking page, header, footer and icon sprite as React components. The live rows (dates, passages, boats, articles) already come from the database.
- **Interface text.** Text on these pages is interface or marketing copy. It moves into the repo dictionaries, with `i18n` and `i18n-app` merged into one, not into the database. The exception is copy the team wants to change without a deploy (for example the hero headline or the deals): that goes in a small `site_texts` table.
- **Clean-up.** Remove `content/pages`, `scripts/extract_content.py` and `ProtoPage`. The prototypes remain as design references only.

## Phase 4: editing and freshness

- **Access rules (RLS).** The public can read published rows only. Writes go through Supabase Studio or the service role, never the public key.
- **`updated_at` triggers** on all content tables.
- **Updating pages.**
  - **On demand:** a Supabase database webhook calls `POST /api/revalidate` with a secret, which refreshes the affected pages (by tag per table). Edits then appear within seconds.
  - **Safety net:** the current `revalidate` timers stay.
- **Editing tool.** Start with Supabase Studio. If the person editing is not technical, add a small password-protected `/admin` with forms per table later.

## Checking each phase

- **Before/after comparison.** Before switching, save the visible text of every URL in every language. After switching, compare. Allowed differences: none, apart from whitespace.
- **Production build.** `npm run build` must pass with the database environment variables. It needs the database, because the static paths come from it.
- **Rollback.** Keep the file readers on a flag until a phase has been live for a few days.

## Open decisions

1. **Who edits content, and with what?** Supabase Studio is enough for one technical editor. Otherwise a small admin page.
2. **Should home-page copy live in the database** so it can change without a deploy, or stay in code?
3. **Is it acceptable to drop the offline JSON fallbacks?** Local development would then need Supabase (dev branch or local).
