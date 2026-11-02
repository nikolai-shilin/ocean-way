import { t, hasT } from './content';
import { english, type CourseDate, type Passage, type RouteMap, type Shot, type Yacht } from './db';
import { usedForIcon } from './icons';
import { path, type Lang } from './site';

/** HTML for the live parts of the prototype pages, built from database rows in the page's language.
 *  English strings are looked up in the translation dictionaries; dates fall back to Intl formatting. */
const NB = ' ';
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const LOCALE: Record<Lang, string> = { en: 'en-GB', ru: 'ru-RU', de: 'de-DE', es: 'es-ES' };
const d = (iso: string) => new Date(iso + 'T12:00:00Z');

function enDay(iso: string, sep = ' ') {
  const x = d(iso);
  return `${WD[x.getUTCDay()]}${sep}${x.getUTCDate()}${sep}${MO[x.getUTCMonth()]}`;
}
function intlDay(lang: Lang, iso: string) {
  const x = d(iso);
  const wd = new Intl.DateTimeFormat(LOCALE[lang], { weekday: 'short', timeZone: 'UTC' }).format(x);
  const dm = new Intl.DateTimeFormat(LOCALE[lang], { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(x);
  return `${wd.charAt(0).toUpperCase()}${wd.slice(1)} ${dm}`;
}
/** "Sat 10 Apr" in the page language (dictionary first, so it matches the translated prototype). */
export function day(lang: Lang, iso: string, nbsp = false) {
  const en = enDay(iso, nbsp ? NB : ' ');
  return hasT(lang, en) ? t(lang, en) : lang === 'en' ? en : intlDay(lang, iso);
}
export function range(lang: Lang, a: string, b: string, nbsp = false) {
  if (a === b) return day(lang, a, nbsp); // one-day courses and exams
  const en = `${enDay(a, nbsp ? NB : ' ')} – ${enDay(b, nbsp ? NB : ' ')}`;
  return hasT(lang, en) ? t(lang, en) : lang === 'en' ? en : `${intlDay(lang, a)} – ${intlDay(lang, b)}`;
}
/** Compact date range for page titles: "10–17 Apr 2027" in the page language. */
export function shortRange(lang: Lang, a: string, b: string) {
  return new Intl.DateTimeFormat(LOCALE[lang], { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).formatRange(d(a), d(b));
}
export const eur = (n: number) => '€' + n.toLocaleString('en-US').replace(/,/g, NB);
export const nightsOf = (p: { starts_on: string; ends_on: string }) => Math.round((d(p.ends_on).getTime() - d(p.starts_on).getTime()) / 864e5);

/** "7 nights" for a week aboard; "1 day" or "6 days" for classroom courses and exams (no boat). */
export function courseLength(lang: Lang, c: { starts_on: string; ends_on: string; boat: string }) {
  const n = nightsOf(c);
  if (c.boat && n > 0) return t(lang, `${n} nights`);
  return t(lang, n === 0 ? '1 day' : `${n + 1} days`);
}

export function places(lang: Lang, left: number, total: number) {
  if (left <= 0) return { cls: 'avail full', text: t(lang, 'Full') };
  if (left === total) return { cls: 'avail', text: t(lang, `${total} places`) };
  return { cls: left <= 2 ? 'avail low' : 'avail', text: left === 1 ? t(lang, '1 of 4 left') : t(lang, '{n} of 4 left', { n: left }) };
}

export function courseRows(lang: Lang, rows: CourseDate[]) {
  return rows.map((c) => {
    const pl = places(lang, c.places_left, c.places_total);
    const full = c.places_left <= 0;
    const start = day(lang, c.starts_on);
    const action = full
      ? `<a class="pill pill-quiet pill-sm" href="#">${esc(t(lang, 'Join waitlist'))}</a>`
      : `<a class="pill pill-primary pill-sm" href="${path.booking(lang)}?item=bareboat&date=${c.key}" aria-label="${esc(t(lang, `Book ${enDay(c.starts_on)}`))}">${esc(t(lang, 'Book'))}</a>`;
    const price = full ? `<td class="num">${eur(c.price_eur)}</td>` : `<td class="num" style="color:var(--ink)"><b>${eur(c.price_eur)}</b></td>`;
    return `<tr${full ? ' class="is-full"' : ''}><td><b>${esc(start)}</b></td><td>${esc(t(lang, c.area))}</td><td>${esc(c.boat)}</td><td><span class="${pl.cls}">${esc(pl.text)}</span></td>${price}<td class="book">${action}</td></tr>`;
  }).join('\n            ');
}

/** "2023 · 11.5 m · 3 cabins · 6 berths" and "From €2 000 a week to charter" in the page language, with plurals. */
const plural = (n: number, one: string, few: string, many: string) => {
  const a = n % 10, b = n % 100;
  return a === 1 && b !== 11 ? one : a >= 2 && a <= 4 && (b < 12 || b > 14) ? few : many;
};
export function boatSpec(lang: Lang, y: Pick<Yacht, 'year' | 'length_m' | 'cabins' | 'berths'>) {
  const len = String(Number(y.length_m)), c = y.cabins, b = y.berths;
  if (lang === 'ru') return `${y.year} · ${len.replace('.', ',')} м · ${c} ${plural(c, 'каюта', 'каюты', 'кают')} · ${b} ${plural(b, 'спальное место', 'спальных места', 'спальных мест')}`;
  if (lang === 'de') return `${y.year} · ${len.replace('.', ',')} m · ${c} ${c === 1 ? 'Kabine' : 'Kabinen'} · ${b} ${b === 1 ? 'Koje' : 'Kojen'}`;
  if (lang === 'es') return `${y.year} · ${len.replace('.', ',')} m · ${c} ${c === 1 ? 'camarote' : 'camarotes'} · ${b} ${b === 1 ? 'litera' : 'literas'}`;
  return `${y.year} · ${len} m · ${c} ${c === 1 ? 'cabin' : 'cabins'} · ${b} ${b === 1 ? 'berth' : 'berths'}`;
}
export function boatPrice(lang: Lang, n: number) {
  return { en: `From ${eur(n)} a week to charter`, ru: `Чартер от ${eur(n)} в неделю`, de: `Charter ab ${eur(n)} pro Woche`, es: `Chárter desde ${eur(n)} a la semana` }[lang];
}

export function fleetCards(lang: Lang, rows: Yacht[]) {
  return rows.map((y) => {
    const spec = boatSpec(lang, y);
    const price = boatPrice(lang, y.charter_from_eur);
    return `<a class="card" href="${path.boat(lang, y.slug)}">
          <div class="photo"><div class="clip"><img src="${y.photo_id.startsWith('/') ? y.photo_id : `https://images.unsplash.com/photo-${y.photo_id}?w=900&q=80&auto=format&fit=crop`}" alt="${esc(y.photo_alt)}" loading="lazy"></div></div>
          <div class="card-body"><span class="card-title">${esc(y.model)}</span><span class="card-meta">${esc(spec)}</span><span class="card-price">${esc(price)}</span><div class="facts"><span class="fact"><svg class="i"><use href="#ow-pin"/></svg>${esc(t(lang, y.base))}</span><span class="fact"><svg class="i"><use href="#${usedForIcon(english(y).used_for)}"/></svg>${esc(y.used_for)}</span></div></div>
        </a>`;
  }).join('\n        ');
}

/** Data for the booking script: the same shape as the prototype's built-in catalogue, plus database ids. */
export function bookingData(lang: Lang, dates: CourseDate[], passages: Passage[]) {
  const byId = new Map(passages.map((p) => [p.id, p]));
  return {
    course: dates.map((c) => ({ id: c.key, db_id: c.id, label: range(lang, c.starts_on, c.ends_on), sub: c.boat ? `${t(lang, c.area)} · ${c.boat}` : t(lang, c.area), price: c.price_eur, left: Math.max(0, c.places_left), place: t(lang, c.meeting_point), classroom: !c.boat })),
    passages: passages.map((p) => {
      const n = nightsOf(p);
      const route = t(lang, `${p.from_port} → ${p.to_port}`);
      return { id: p.key, db_id: p.id, label: range(lang, p.starts_on, p.ends_on), sub: `${route} · ${t(lang, `${n} nights`)}`, route, nights: n, price: p.price_eur, left: Math.max(0, p.places_left), pair: p.return_id && byId.get(p.return_id) ? byId.get(p.return_id)!.key : null };
    }),
  };
}

/** Replace the inner HTML of the first element matched by `open` (up to its `close` tag) inside `html`. */
export function replaceInner(html: string, open: RegExp, close: string, inner: string) {
  const m = open.exec(html);
  if (!m) return html;
  const start = m.index + m[0].length;
  const end = html.indexOf(close, start);
  if (end < 0) return html;
  return html.slice(0, start) + '\n            ' + inner + '\n          ' + html.slice(end);
}

/** The passages map from the home page in this language, optionally with one leg highlighted. */
export function passagesMap(homeMain: string, leg?: string) {
  const m = /<figure class="pmap">[\s\S]*?<\/figure>/.exec(homeMain);
  if (!m) return '';
  let fig = m[0];
  if (leg) {
    fig = fig.replace(/class="rm pm (pm-[dm])"/g, 'class="rm pm $1 has-on"')
      .replace(new RegExp(`<g class="rm-leg pm-leg" data-leg="${leg}">`, 'g'), `<g class="rm-leg pm-leg on" data-leg="${leg}">`);
  }
  return fig;
}

/** The map of one passage route or course route (the map column, drawn by prototypes/_build/build_leg_maps.py):
 *  desktop and phone versions, stop names in the page language. Empty when the route has no map. */
export function routeMap(lang: Lang, m: RouteMap | null) {
  if (!m) return '';
  const tr = (svg: string) => svg
    .replace(/(<text class="pm-label"[^>]*>)([^<]+)(<\/text>)/g, (_, a: string, name: string, b: string) => a + esc(t(lang, name)) + b)
    .replace(/aria-label="Map of the route: ([^"]+)"/, (_, names: string) => `aria-label="${esc(t(lang, 'Map of the route'))}: ${esc(names.split(', ').map((n) => t(lang, n)).join(', '))}"`);
  const note = m.d.includes('rm-line') ? 'Lines show the usual sea route; the instructor plans each leg to the weather. Coastline: Natural Earth.' : 'Coastline: Natural Earth.';
  return `<figure class="pmap"><div class="rmap-frame">${tr(m.d)}${tr(m.m)}</div><figcaption class="disclaimer">${esc(t(lang, note))}</figcaption></figure>`;
}

/** A mixed gallery for a list page: takes photos from several galleries in turn (first of each, then second…),
 *  skips repeats and the ids in `skip` (photos already on the page), and alternates landscape and portrait.
 *  8 by default. */
export function mixShots(galleries: (Shot[] | undefined)[], skip: string[] = [], n = 8): Shot[] {
  const pool: Shot[] = [], seen = new Set(skip);
  const lists = galleries.filter((g): g is Shot[] => !!g?.length);
  for (let i = 0; lists.some((g) => i < g.length); i++) {
    for (const g of lists) { const s = g[i]; if (s && !seen.has(s.photo_id)) { seen.add(s.photo_id); pool.push(s); } }
  }
  const out: Shot[] = [];
  while (out.length < n && pool.length) {
    const want = out.length % 2 ? 'p' : 'l';
    const k = Math.max(0, pool.findIndex((s) => s.shape === want));
    out.push(pool.splice(k, 1)[0]);
  }
  return out;
}

/** One photo of the cover row (cover.css). `src` is a full address; ProtoPage or Cover adds srcset/sizes. */
export type CoverShot = { src: string; shape: 'l' | 'p'; caption: string; alt?: string };
export const coverShots = (shots: Shot[]): CoverShot[] => shots.map((s) => ({
  src: s.photo_id.startsWith('/') ? s.photo_id : `https://images.unsplash.com/photo-${s.photo_id}?w=${s.shape === 'l' ? 1400 : 900}&q=80&auto=format&fit=crop`,
  shape: s.shape, caption: s.caption,
}));

/** Text on white strips, one per wrapped line. Two stacked copies (cover.css .st): the back one paints the strips,
 *  the front one the letters, so strips can overlap with tight line spacing without covering the line above.
 *  `html` is already escaped. */
export const stripHtml = (html: string) => `<span class="st"><span class="st-bg" aria-hidden="true"><span class="hl">${html}</span></span><span class="st-fg"><span class="hl">${html}</span></span></span>`;

/** Figures of the cover row: every photo the same height, caption on a strip inside the photo. */
export function coverFigures(shots: CoverShot[]) {
  return shots.map((s, i) => `<figure class="cv-ph ${s.shape}"><div class="photo"><img src="${s.src.replace(/&(?!amp;)/g, '&amp;')}" alt="${esc(s.alt ?? s.caption)}"${i > 1 ? ' loading="lazy"' : ''}></div><figcaption>${stripHtml(esc(s.caption))}</figcaption></figure>`).join('');
}

/** Arrows over the top right of the cover row (hidden on phones). */
export const coverNav = (lang: Lang) => `<div class="cv-nav"><button class="round" type="button" data-dir="-1" aria-label="${esc(t(lang, 'Previous photos'))}"><svg class="i" style="transform:scaleX(-1)"><use href="#ow-arrow"/></svg></button><button class="round" type="button" data-dir="1" aria-label="${esc(t(lang, 'Next photos'))}"><svg class="i"><use href="#ow-arrow"/></svg></button></div>`;

/** The top of a page as one block: kicker, headline and lead on white strips over a sideways row of photos.
 *  On phones the lead moves under the photos (.cv-lead-m). All text arguments are HTML (already escaped).
 *  Used by the prototype home page; React pages use components/Cover.tsx, which renders the same markup. */
export function coverHtml(lang: Lang, text: { top: string; title: string; lead: string }, shots: CoverShot[]) {
  return `<section class="cover" data-row><div class="cv-text">${text.top}<h1 class="cv-title">${stripHtml(text.title)}</h1><p class="cv-lead">${stripHtml(text.lead)}</p></div>`
    + `<div class="cv-row" tabindex="0" aria-label="${esc(t(lang, 'Photo gallery'))}">${coverFigures(shots)}</div>${coverNav(lang)}</section>`
    + `<p class="cv-lead-m">${text.lead}</p>`;
}
