import { t } from './content';
import { passageSlug, type Passage, type PassageLeg } from './db';
import { eur, nightsOf, places } from './render';
import { path, type Lang } from './site';

/** Passage cards for the home page row and the /passages list (styles in src/styles/passages.css).
 *  One card markup for both: dates, route, waters and miles, price, places and the Book button.
 *  The whole card opens the passage page; Book goes straight to the booking form. */

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const LOCALE: Record<Lang, string> = { en: 'en-GB', ru: 'ru-RU', de: 'de-DE', es: 'es-ES' };
const day = (iso: string) => new Date(iso + 'T12:00:00Z');
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** "10–17 Apr", "12 Jun – 3 Jul" in the page language. */
export function dates(lang: Lang, a: string, b: string) {
  return new Intl.DateTimeFormat(LOCALE[lang], { day: 'numeric', month: 'short', timeZone: 'UTC' }).formatRange(day(a), day(b));
}

/** Out one week, back the next: the dates of both legs together, when the paired passage joins on directly. */
function bothWays(lang: Lang, p: Passage, pair?: Passage) {
  if (!pair) return '';
  if (pair.starts_on === p.ends_on) return dates(lang, p.starts_on, pair.ends_on);
  if (pair.ends_on === p.starts_on) return dates(lang, pair.starts_on, p.ends_on);
  return '';
}

type Ctx = { lang: Lang; legs: Record<string, PassageLeg>; byId: Map<string, Passage> };

function card({ lang, legs, byId }: Ctx, p: Passage, pair: boolean) {
  const route = t(lang, `${p.from_port} → ${p.to_port}`);
  const pl = places(lang, p.places_left, p.places_total);
  const full = p.places_left <= 0;
  const nm = legs[p.leg]?.distance_nm;
  const both = pair && p.return_id ? bothWays(lang, p, byId.get(p.return_id)) : '';
  const action = full
    ? `<a class="pill pill-quiet pill-sm" href="#">${esc(t(lang, 'Join waitlist'))}</a>`
    : `<a class="pill pill-primary pill-sm" href="${path.booking(lang)}?item=passage&amp;id=${p.key}" aria-label="${esc(t(lang, `Book ${p.from_port} → ${p.to_port}`))}">${esc(t(lang, 'Book'))}</a>`;
  return `<article class="pp${full ? ' is-full' : ''}" id="p-${p.key}" data-leg="${p.leg}">
  <div class="pp-when"><b class="pp-dates">${esc(dates(lang, p.starts_on, p.ends_on))}</b><span class="pp-nights">${esc(t(lang, `${nightsOf(p)} nights`))}</span></div>
  <div class="pp-what"><h3 class="pp-route"><a href="${path.passage(lang, passageSlug(p))}">${esc(route)}</a></h3><p class="pp-sub">${esc(t(lang, p.waters))}${nm ? ` · <span class="nw">${esc(t(lang, '{n} nm', { n: nm }))}</span>` : ''}</p>${both ? `<p class="pp-pair"><svg class="i" aria-hidden="true"><use href="#ow-route"/></svg>${esc(t(lang, 'Both ways: {dates}', { dates: both }))}</p>` : ''}</div>
  <p class="pp-price"><b>${eur(p.price_eur)}</b><span>${esc(t(lang, 'per person'))}</span></p>
  <div class="pp-act"><span class="${pl.cls}">${esc(pl.text)}</span>${action}</div>
</article>`;
}

const ctx = (lang: Lang, rows: Passage[], legs: Record<string, PassageLeg>): Ctx => ({ lang, legs, byId: new Map(rows.map((p) => [p.id, p])) });

/** The home page row: every passage as a card in a sideways row, arrows on wide screens. */
export function passageRow(lang: Lang, rows: Passage[], legs: Record<string, PassageLeg>) {
  const c = ctx(lang, rows, legs);
  const cards = rows.map((p) => card(c, p, false)).join('\n');
  return `<div class="pp-rowwrap" data-row>
  <div class="pp-rowhead"><a class="pp-all" href="${path.passages(lang)}">${esc(t(lang, 'Show all {n} passages', { n: rows.length }))}<svg class="i" aria-hidden="true"><use href="#ow-arrow"/></svg></a><div class="row-nav"><button class="round" type="button" data-dir="-1" aria-label="${esc(t(lang, 'Previous'))}"><svg class="i" style="transform:scaleX(-1)"><use href="#ow-arrow"/></svg></button><button class="round" type="button" data-dir="1" aria-label="${esc(t(lang, 'Next'))}"><svg class="i"><use href="#ow-arrow"/></svg></button></div></div>
  <div class="hscroll pp-row" tabindex="0" aria-label="${esc(t(lang, 'Training passages 2027'))}">${cards}</div>
</div>`;
}

/** Route buttons for /passages (inside .pp-filter): all routes, then one per route in date order, with counts. */
export function passageFilter(lang: Lang, rows: Passage[]) {
  const legs = new Map<string, Passage[]>();
  for (const p of rows) legs.set(p.leg, [...(legs.get(p.leg) ?? []), p]);
  const label = (ps: Passage[]) => {
    const a = ps[0].from_port, b = ps[0].to_port;
    const twoWay = ps.some((p) => p.from_port === b && p.to_port === a);
    return twoWay ? `${t(lang, a)} ↔ ${t(lang, b)}` : t(lang, `${a} → ${b}`);
  };
  const btn = (leg: string, text: string, n: number, on = false) =>
    `<button type="button" class="tag${on ? ' tag-on' : ''}" data-leg="${leg}" aria-pressed="${on}">${esc(text)} <span class="tag-count">${n}</span></button>`;
  return `<div class="pp-chips">${btn('', t(lang, 'All routes'), rows.length, true)}${[...legs].map(([leg, ps]) => btn(leg, label(ps), ps.length)).join('')}</div>`;
}

/** The /passages list: cards grouped by the month they start in. */
export function passageList(lang: Lang, rows: Passage[], legs: Record<string, PassageLeg>) {
  const c = ctx(lang, rows, legs);
  const months = new Map<string, Passage[]>();
  for (const p of rows) months.set(p.starts_on.slice(0, 7), [...(months.get(p.starts_on.slice(0, 7)) ?? []), p]);
  const year = rows[0]?.starts_on.slice(0, 4);
  const name = (ym: string) => cap(new Intl.DateTimeFormat(LOCALE[lang], { month: 'long', ...(ym.startsWith(year) ? {} : { year: 'numeric' }), timeZone: 'UTC' }).format(day(ym + '-15')));
  return [...months].map(([ym, ps]) => `<section class="pp-month" data-month="${ym}"><h2 class="pp-mh">${esc(name(ym))}</h2><div class="pp-list">${ps.map((p) => card(c, p, true)).join('\n')}</div></section>`).join('\n');
}

/** Hovering or focusing a card lights its route on the map. On /passages the route buttons filter the list
 *  (also from ?leg=…, and by clicking a route on the map); on the home page, swiping the row on a phone
 *  lights the route of the card in front. */
export const PASSAGES_JS = `(() => {
  const maps = [...document.querySelectorAll('.pm')];
  const cards = [...document.querySelectorAll('.pp[data-leg]')];
  if (!cards.length) return;
  const chips = [...document.querySelectorAll('.pp-filter [data-leg]')];
  const months = [...document.querySelectorAll('.pp-month')];
  const list = document.querySelector('.pp-months');
  const live = document.querySelector('.pp-live');
  let sel = '';
  const paint = (leg, card) => {
    maps.forEach((svg) => { svg.classList.toggle('has-on', !!leg); svg.querySelectorAll('.pm-leg').forEach((g) => g.classList.toggle('on', g.dataset.leg === leg)); });
    cards.forEach((c) => c.classList.toggle('on', c === card));
  };
  const filter = (leg, user) => {
    sel = leg;
    chips.forEach((c) => { const on = c.dataset.leg === leg; c.classList.toggle('tag-on', on); c.setAttribute('aria-pressed', String(on)); if (on && user) c.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' }); });
    let n = 0;
    cards.forEach((c) => { c.hidden = !!leg && c.dataset.leg !== leg; if (!c.hidden) n++; });
    months.forEach((m) => { m.hidden = !m.querySelector('.pp:not([hidden])'); });
    paint(leg || null);
    if (live) live.textContent = live.dataset.text.replace('{n}', n);
    if (!user) return;
    const u = new URL(location.href);
    if (leg) u.searchParams.set('leg', leg); else u.searchParams.delete('leg');
    history.replaceState(history.state, '', u);
    if (list && list.getBoundingClientRect().top < 0) list.scrollIntoView({ block: 'start' });
  };
  chips.forEach((c) => c.addEventListener('click', () => filter(c.dataset.leg, true)));
  if (chips.length) {
    maps.forEach((svg) => svg.querySelectorAll('.pm-leg').forEach((g) => {
      if (!chips.some((c) => c.dataset.leg === g.dataset.leg)) return;
      g.classList.add('pick');
      g.addEventListener('click', () => filter(sel === g.dataset.leg ? '' : g.dataset.leg, true));
    }));
    const q = new URLSearchParams(location.search).get('leg');
    if (q && chips.some((c) => c.dataset.leg === q)) filter(q, false);
  }
  cards.forEach((c) => {
    const on = () => paint(c.dataset.leg, c), off = () => paint(sel || null);
    c.addEventListener('mouseenter', on); c.addEventListener('mouseleave', off);
    c.addEventListener('focusin', on); c.addEventListener('focusout', (e) => { if (!c.contains(e.relatedTarget)) off(); });
  });
  const row = document.querySelector('.pp-row');
  if (row && matchMedia('(hover: none)').matches) {
    let timer = 0;
    row.addEventListener('scroll', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const x = row.getBoundingClientRect().left + (parseFloat(getComputedStyle(row).scrollPaddingLeft) || 0);
        let best = null, d = Infinity;
        cards.forEach((c) => { const k = Math.abs(c.getBoundingClientRect().left - x); if (k < d) { d = k; best = c; } });
        if (best) paint(best.dataset.leg, best);
      }, 90);
    }, { passive: true });
  }
})();`;
