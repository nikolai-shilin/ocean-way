import { t } from './content';
import type { Extra, Yacht, YachtPrice } from './db';
import { eur } from './render';
import type { Lang } from './site';

/** Season of a price period, by its first day: the charter year runs Winter → Late autumn. */
export function seasonName(lang: Lang, p: Pick<YachtPrice, 'starts_on'>) {
  const md = p.starts_on.slice(5);
  const en = md < '03-01' ? 'Winter' : md < '05-01' ? 'Spring' : md < '06-01' ? 'Early summer' : md < '09-01' ? 'High summer' : md < '10-15' ? 'Autumn' : 'Late autumn';
  return t(lang, en);
}

/** "27 Mar – 7 May": a price period without weekdays (they are not Saturdays). */
export function periodDates(lang: Lang, p: Pick<YachtPrice, 'starts_on' | 'ends_on'>) {
  const f = new Intl.DateTimeFormat({ en: 'en-GB', ru: 'ru-RU', de: 'de-DE', es: 'es-ES' }[lang], { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const d = (iso: string) => f.format(new Date(iso + 'T12:00:00Z')).replace(/\.$/, '');
  return `${d(p.starts_on)} – ${d(p.ends_on)}`;
}

/** The lowest week among seasons that overlap April–October: the number "From €X a week" shows. */
export const isSailingSeason = (p: YachtPrice) => p.ends_on.slice(5) >= '04-01' && p.starts_on.slice(5) <= '10-31';

/** "€200 a day", "€80 a week", "€250 one way", "€50 per booking". */
export function extraPrice(lang: Lang, e: Extra) {
  const unit = { day: 'a day', week: 'a week', booking: 'per booking', trip: 'one way' }[e.unit];
  return `${eur(e.price_eur)} ${t(lang, unit)}`;
}

const LOC: Record<Lang, string> = { en: 'en-GB', ru: 'ru-RU', de: 'de-DE', es: 'es-ES' };
const num = (lang: Lang, x: number | null, unit: string) => (x == null ? '–' : `${Number(x).toLocaleString(LOC[lang], { maximumFractionDigits: 2 })} ${unit}`);

/** "8 + 2": cabin berths plus saloon or skipper berths. */
export const berthsText = (y: Pick<Yacht, 'berths' | 'extra_berths'>) => (y.extra_berths ? `${y.berths} + ${y.extra_berths}` : String(y.berths));

/** The specification grid of a boat page, label and value, in the page language. */
export function boatSpecs(lang: Lang, y: Yacht): [string, string][] {
  const engine = y.engine_hp ? `${y.engines > 1 ? `${y.engines} × ` : ''}${y.engine_hp} ${t(lang, 'hp')}` : '–';
  const specs: [string, string][] = [
    [t(lang, 'Year'), String(y.year)], [t(lang, 'Length'), num(lang, Math.round(Number(y.length_m) * 10) / 10, 'm')],
    [t(lang, 'Beam'), num(lang, y.beam_m, 'm')], [t(lang, 'Draft'), num(lang, y.draft_m, 'm')],
    [t(lang, 'Cabins'), y.skipper_cabin ? `${y.cabins} + 1` : String(y.cabins)], [t(lang, 'Berths'), berthsText(y)],
    [t(lang, 'Heads'), y.heads == null ? '–' : String(y.heads)], [t(lang, 'Engine'), engine],
  ];
  // The sample boats have none of these; the real fleet has all four.
  if (y.name) specs.push([t(lang, 'Water'), num(lang, y.water_l, 'l')], [t(lang, 'Fuel'), num(lang, y.fuel_l, 'l')],
    [t(lang, 'Hull'), t(lang, y.kind === 'catamaran' ? 'Catamaran' : 'Monohull')], [t(lang, 'Guests'), y.max_guests == null ? '–' : String(y.max_guests)]);
  return specs;
}

