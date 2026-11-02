import { getArticles } from '@/lib/articles';
import { getCourseDates, getCourses, getLegs, getPassages, getYachts, passageSlug } from '@/lib/db';
import { LANGS, SITE, path } from '@/lib/site';

/** /llms.txt: a plain-text summary of the site for AI assistants (https://llmstxt.org), built from the same
 *  live rows as the pages, so prices, dates and places left match what visitors see. English only. */
export const revalidate = 3600;

const eur = (n: number) => `€${n.toLocaleString('en-US')}`;
const url = (p: string) => SITE + p;
const nights = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
const day = (iso: string) => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const ENT: Record<string, string> = { amp: '&', quot: '"', lt: '<', gt: '>', '#39': "'", '#x27': "'", nbsp: ' ' };
const plain = (s: string) => s.replace(/&(amp|quot|lt|gt|#39|#x27|nbsp);/g, (_, e: string) => ENT[e]).replace(/ · Ocean Way$/, '').replace(/\s+/g, ' ').trim();

export async function GET() {
  const [courses, passages, yachts, legs, bareboat, articles] = await Promise.all([getCourses(), getPassages(), getYachts(), getLegs(), getCourseDates('bareboat-skipper'), getArticles('en')]);
  const bb = courses.find((c) => c.slug === 'bareboat-skipper');
  const out: string[] = [];
  const add = (...lines: string[]) => out.push(...lines);

  add('# Ocean Way', '',
    '> Sailing school and yacht charter in the Mediterranean. IYT sailing courses from the one-day VHF licence to Yachtmaster Ocean, '
    + 'live-aboard Bareboat Skipper weeks in Greece and Croatia, and one-way training passages along the Turkish coast and to Northern Cyprus '
    + 'for building sea miles. Small groups: at most four students on a Bareboat Skipper week.', '',
    'Key facts:',
    '- Certificates: IYT Worldwide (International Yacht Training); the Bareboat Skipper week can also end with an RYA Day Skipper assessment.',
    '- Prices are in euros, per person for courses and passages (boat, instructor and marina fees included), per boat per week for charter.',
    '- Payment: 30% deposit to book, the rest 6 weeks before the start. No card fees.',
    '- Cancellation: free until 6 weeks before the start; after that the deposit is kept, or it can be moved once to another date in the same year.',
    `- Languages of the site: ${LANGS.join(', ')} (same paths with /ru, /de, /es instead of /en).`,
    '- Contact and new dates: Telegram https://t.me/rycrentals',
    '');

  add('## Courses', '');
  for (const c of courses) {
    add(`- [${c.name} course](${url(path.courseItem('en', c.slug))}): ${c.summary} ${c.duration}; ${c.scope}. From ${eur(c.price_from_eur)} ${c.price_unit}.`);
  }
  add('');

  add('## Bareboat Skipper course, 2027 dates', '', `${plain(bb?.description ?? '')} Details: ${url(path.courseItem('en', 'bareboat-skipper'))}`, '');
  for (const d of bareboat) {
    add(`- ${day(d.starts_on)} – ${day(d.ends_on)}, ${d.area}, ${d.boat}: ${eur(d.price_eur)}, ${d.places_left > 0 ? `${d.places_left} of ${d.places_total} places left` : 'full'}`);
  }
  add('');

  add('## Training passages 2027', '', 'One-way passages with an instructor aboard: watches (also at night), skippering legs under supervision, every mile logged and signed for Yachtmaster sea-time.', '');
  for (const p of passages) {
    const leg = legs[p.leg];
    const nm = leg?.distance_nm ? `, about ${leg.distance_nm} nautical miles` : '';
    const left = p.places_left > 0 ? `${p.places_left} of ${p.places_total} places left` : 'full';
    add(`- [${p.from_port} → ${p.to_port}, ${day(p.starts_on)} – ${day(p.ends_on)}](${url(path.passage('en', passageSlug(p)))}): ${nights(p.starts_on, p.ends_on)} nights${nm}, ${eur(p.price_eur)} per person, ${left}.`);
  }
  add('');

  add('## Fleet', '');
  for (const y of yachts) {
    add(`- [${y.model}](${url(path.boat('en', y.slug))}) (${y.year}, ${Number(y.length_m)} m, ${y.cabins} cabins, ${y.berths} berths), based in ${y.base}: ${y.used_for}. Charter from ${eur(y.charter_from_eur)} a week.`);
  }
  add('');

  add('## Sailing theory (free articles)', '');
  for (const a of articles) {
    add(`- [${plain(a.title)}](${url(path.article('en', a.slug))}): ${plain(a.description)}`);
  }
  add('');

  add('## More', '',
    `- [All prices for 2027](${url(path.prices('en'))}): courses, passages, charter, cabins and extras, payment and cancellation`,
    `- [Instructors and skippers](${url(path.instructors('en'))})`,
    `- [All courses](${url(path.courses('en'))}), [all passages](${url(path.passages('en'))}), [the fleet](${url(path.fleet('en'))})`,
    `- [Sitemap](${url('/sitemap.xml')})`,
    '');

  return new Response(out.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
