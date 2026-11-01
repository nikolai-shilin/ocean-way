import fs from 'node:fs';
import nodePath from 'node:path';
import { t, hasT } from './content';
import { passageSlug, type CourseDate, type Passage, type Yacht } from './db';
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
  const en = `${enDay(a, nbsp ? NB : ' ')} – ${enDay(b, nbsp ? NB : ' ')}`;
  return hasT(lang, en) ? t(lang, en) : lang === 'en' ? en : `${intlDay(lang, a)} – ${intlDay(lang, b)}`;
}
export const eur = (n: number) => '€' + n.toLocaleString('en-US').replace(/,/g, NB);
const nightsOf = (p: { starts_on: string; ends_on: string }) => Math.round((d(p.ends_on).getTime() - d(p.starts_on).getTime()) / 864e5);

function places(lang: Lang, left: number, total: number) {
  if (left <= 0) return { cls: 'avail full', text: t(lang, 'Full') };
  if (left === total) return { cls: 'avail', text: t(lang, `${total} places`) };
  return { cls: left <= 2 ? 'avail low' : 'avail', text: left === 1 ? t(lang, '1 of 4 left') : t(lang, '{n} of 4 left', { n: left }) };
}

export function passagesRows(lang: Lang, rows: Passage[]) {
  return rows.map((p) => {
    const route = t(lang, `${p.from_port} → ${p.to_port}`);
    const pl = places(lang, p.places_left, p.places_total);
    const book = t(lang, 'Book');
    const action = p.places_left > 0
      ? `<a class="pill pill-primary pill-sm" href="${path.booking(lang)}?item=passage&id=${p.key}" aria-label="${esc(t(lang, `Book ${p.from_port} → ${p.to_port}`))}">${esc(book)}</a>`
      : `<a class="pill pill-quiet pill-sm" href="#">${esc(t(lang, 'Join waitlist'))}</a>`;
    return `<tr data-leg="${p.leg}"><td data-label="Dates"><b>${esc(range(lang, p.starts_on, p.ends_on, true))}</b></td><td data-label="Route" class="island"><a href="${path.passage(lang, passageSlug(p))}">${esc(route)}</a></td><td data-label="Waters" class="hl">${esc(t(lang, p.waters))}</td><td data-label="Nights" class="num">${nightsOf(p)}</td><td data-label="Places" class="num"><span class="${pl.cls}">${esc(pl.text)}</span></td><td class="book">${action}</td></tr>`;
  }).join('\n            ');
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

export function fleetCards(lang: Lang, rows: Yacht[]) {
  return rows.map((y) => {
    const spec = t(lang, `${y.year} · ${Number(y.length_m)} m · ${y.cabins} cabins · ${y.berths} berths`);
    const price = t(lang, `From ${eur(y.charter_from_eur)} a week to charter`);
    return `<a class="card" href="${path.boat(lang, y.slug)}">
          <div class="photo"><div class="clip"><img src="https://images.unsplash.com/photo-${y.photo_id}?w=900&q=80&auto=format&fit=crop" alt="${esc(t(lang, y.photo_alt))}" loading="lazy"></div></div>
          <div class="card-body"><span class="card-title">${esc(y.model)}</span><span class="card-meta">${esc(spec)}</span><span class="card-price">${esc(price)}</span><div class="facts"><span class="fact"><svg class="i"><use href="#i-pin"/></svg>${esc(t(lang, y.base))}</span><span class="fact"><svg class="i"><use href="#i-sail"/></svg>${esc(t(lang, y.used_for))}</span></div></div>
        </a>`;
  }).join('\n        ');
}

/** Data for the booking script: the same shape as the prototype's built-in catalogue, plus database ids. */
export function bookingData(lang: Lang, dates: CourseDate[], passages: Passage[]) {
  const byId = new Map(passages.map((p) => [p.id, p]));
  return {
    course: dates.map((c) => ({ id: c.key, db_id: c.id, label: range(lang, c.starts_on, c.ends_on), sub: t(lang, `${c.area} · ${c.boat}`), price: c.price_eur, left: Math.max(0, c.places_left), place: t(lang, c.meeting_point) })),
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

/** The map of one passage route (drawn by prototypes/_build/build_leg_maps.py): desktop and phone versions,
 *  stop names in the page language. */
let legMaps: Record<string, { d: string; m: string; nm: number }> | undefined;
export function legMap(lang: Lang, leg: string) {
  legMaps ??= JSON.parse(fs.readFileSync(nodePath.join(process.cwd(), 'content', 'passage_maps.json'), 'utf8'));
  const m = legMaps![leg];
  if (!m) return '';
  const tr = (svg: string) => svg
    .replace(/(<text class="pm-label"[^>]*>)([^<]+)(<\/text>)/g, (_, a: string, name: string, b: string) => a + esc(t(lang, name)) + b)
    .replace(/aria-label="Map of the route: ([^"]+)"/, (_, names: string) => `aria-label="${esc(t(lang, 'Map of the route'))}: ${esc(names.split(', ').map((n) => t(lang, n)).join(', '))}"`);
  return `<figure class="pmap"><div class="rmap-frame">${tr(m.d)}${tr(m.m)}</div><figcaption class="disclaimer">${esc(t(lang, 'Lines show the usual sea route; the instructor plans each leg to the weather. Coastline: Natural Earth.'))}</figcaption></figure>`;
}
