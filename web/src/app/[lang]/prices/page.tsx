import '@/styles/home.css';
import '@/styles/app.css';
import Shell from '@/components/Shell';
import { t } from '@/lib/content';
import { getCourses, getPassages, getYachts, type Passage } from '@/lib/db';
import { breadcrumbs, Crumbs, meta, ORG } from '@/lib/meta';
import { eur } from '@/lib/render';
import { path, SITE, type Lang } from '@/lib/site';

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<'/[lang]/prices'>) {
  const lang = (await params).lang as Lang;
  return meta(lang, { title: t(lang, 'Prices 2027'), description: t(lang, 'What Ocean Way courses, training passages and yacht charter cost in 2027, what the price includes, cabin options, deposit and cancellation.'), pathFor: path.prices });
}

const nights = (p: Passage) => Math.round((Date.parse(p.ends_on) - Date.parse(p.starts_on)) / 864e5);

/** Passages grouped by length: one price per length, with how many dates there are. */
function passageTiers(rows: Passage[]) {
  const m = new Map<number, { n: number; price: number; count: number }>();
  for (const p of rows) {
    const n = nights(p), cur = m.get(n);
    m.set(n, { n, price: Math.min(cur?.price ?? Infinity, p.price_eur), count: (cur?.count ?? 0) + 1 });
  }
  return [...m.values()].sort((a, b) => b.count - a.count || a.n - b.n);
}

const CABINS: [string, string, number][] = [
  ['Shared double cabin', 'With another student of the same gender', 0],
  ['Double cabin for two', 'For couples and friends booking together', 0],
  ['Cabin to yourself', 'Subject to availability', 450],
];
const INCLUDED = ['Instructor for the whole week, max 4 students', 'Yacht, fuel and marina fees on the course route', 'Course book, logbook and assessment', 'Certificate fee (IYT or RYA)', 'Bed linen, towels and final cleaning'];
const EXTRA = ['Food kitty, about €150 per person', 'VHF radio (SRC) course, €190, optional', 'Flights and transfer to the marina', 'Travel insurance'];

export default async function Prices({ params }: PageProps<'/[lang]/prices'>) {
  const lang = (await params).lang as Lang;
  const [courses, passages, yachts] = await Promise.all([getCourses(lang), getPassages(), getYachts(lang)]);
  const tiers = passageTiers(passages);
  const crumbs: [string, string][] = [[t(lang, 'Home'), path.home(lang)], [t(lang, 'Prices'), path.prices(lang)]];
  const offer = (name: string, price: number, url: string, type: string) => ({ '@type': 'Offer', price, priceCurrency: 'EUR', url: SITE + url, itemOffered: { '@type': type, name } });
  const ld = { '@context': 'https://schema.org', '@graph': [ORG, breadcrumbs(lang, crumbs), {
    '@type': 'OfferCatalog', name: t(lang, 'Prices 2027'), url: SITE + path.prices(lang),
    itemListElement: [
      ...courses.map((c) => offer(c.name, c.price_from_eur, path.courseItem(lang, c.slug), 'Course')),
      ...tiers.map((x) => offer(t(lang, 'Training passage: {nights}', { nights: t(lang, `${x.n} nights`) }), x.price, path.passages(lang), 'Trip')),
      ...yachts.map((y) => offer(t(lang, '{boat} charter, one week', { boat: y.model }), y.charter_from_eur, path.boat(lang, y.slug), 'Product')),
    ],
  }] };
  const toc: [string, string][] = [['courses', t(lang, 'Courses')], ['passages', t(lang, 'Passages')], ['charter', t(lang, 'Yacht charter')], ['extras', t(lang, 'Cabins and extras')], ['payment', t(lang, 'Payment and cancellation')]];
  const Head = ({ id, kicker, title, lead }: { id: string; kicker: string; title: string; lead?: string }) => (
    <div className="sec-head" id={id}><span className="kicker">{kicker}</span><h2 className="h2">{title}</h2>{lead ? <p className="ow-note" style={{ fontSize: 17, maxWidth: '64ch' }}>{lead}</p> : null}</div>
  );
  return (
    <Shell lang={lang} section="prices" pathFor={path.prices} jsonld={ld}>
      <section className="ow-hero">
        <Crumbs lang={lang} items={crumbs} current={t(lang, 'Prices 2027')} />
        <h1 className="display">{t(lang, 'What it costs')}</h1>
        <p className="lead">{t(lang, 'All prices are in euros. Courses and passages are priced per person, with the boat, instructor and marina fees included; charter is the price of the whole boat for a week. For courses and passages you pay a 30% deposit to book and the rest six weeks before you sail.')}</p>
        <nav className="toc" aria-label={t(lang, 'On this page')}>{toc.map(([id, label]) => <a key={id} href={`#${id}`}><span className="chip">{label}</span></a>)}</nav>
      </section>

      <section className="sec">
        <Head id="courses" kicker={t(lang, 'Courses')} title={t(lang, 'IYT courses')} lead={t(lang, 'Starting price per person. Dates in a busier month or on a bigger boat can cost a little more; each course page shows the price of every date.')} />
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>{t(lang, 'Course')}</th><th className="hl">{t(lang, 'Level')}</th><th className="hl">{t(lang, 'Duration')}</th><th className="num">{t(lang, 'From')}</th></tr></thead>
            <tbody>{courses.map((c) => (
              <tr key={c.slug}>
                <td className="island"><a href={path.courseItem(lang, c.slug)}>{c.name}</a><span className="sub">{t(lang, c.price_unit)}</span></td>
                <td className="hl">{t(lang, c.level)}</td>
                <td className="hl">{t(lang, c.duration)}</td>
                <td className="num" style={{ color: 'var(--ink)' }}><b>{eur(c.price_from_eur)}</b></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>

      <section className="sec">
        <Head id="passages" kicker={t(lang, 'Passages')} title={t(lang, 'Training passages')} lead={t(lang, 'One price per passage length, whatever the route. Most passages pair up, so you can sail out one week and back the next.')} />
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>{t(lang, 'Length')}</th><th className="num hl">{t(lang, 'Dates in 2027')}</th><th className="num">{t(lang, 'Per person')}</th></tr></thead>
            <tbody>{tiers.map((x) => (
              <tr key={x.n}>
                <td className="island"><a href={path.passages(lang)}>{t(lang, `${x.n} nights`)}</a></td>
                <td className="num hl">{x.count}</td>
                <td className="num" style={{ color: 'var(--ink)' }}><b>{eur(x.price)}</b></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>

      <section className="sec">
        <Head id="charter" kicker={t(lang, 'Fleet')} title={t(lang, 'Yacht charter')} lead={t(lang, 'Price for the whole boat for one week, bareboat. A skipper, cleaning and extras are quoted with the dates.')} />
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>{t(lang, 'Yacht')}</th><th className="hl">{t(lang, 'Home port')}</th><th className="num">{t(lang, 'Cabins')}</th><th className="num">{t(lang, 'A week from')}</th></tr></thead>
            <tbody>{yachts.map((y) => (
              <tr key={y.slug}>
                <td className="island"><a href={path.boat(lang, y.slug)}>{y.model}</a><span className="sub">{y.year}</span></td>
                <td className="hl">{t(lang, y.base)}</td>
                <td className="num">{y.cabins}</td>
                <td className="num" style={{ color: 'var(--ink)' }}><b>{eur(y.charter_from_eur)}</b></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </section>

      <section className="sec">
        <Head id="extras" kicker={t(lang, 'Cabins and extras')} title={t(lang, 'What the price includes')} />
        <div className="tbl-wrap" style={{ marginBottom: 24 }}>
          <table className="tbl">
            <thead><tr><th>{t(lang, 'Cabin')}</th><th className="num">{t(lang, 'Price')}</th></tr></thead>
            <tbody>{CABINS.map(([label, sub, add]) => (
              <tr key={label}><td className="island">{t(lang, label)}<span className="sub">{t(lang, sub)}</span></td><td className="num" style={add ? { color: 'var(--ink)' } : undefined}>{add ? <b>+{eur(add)}</b> : t(lang, 'Included')}</td></tr>
            ))}</tbody>
          </table>
        </div>
        <div className="ow-two">
          <div className="band"><h3>{t(lang, 'Included')}</h3><ul className="ow-list">{INCLUDED.map((x) => <li key={x}><svg className="i"><use href="#ow-check" /></svg><span>{t(lang, x)}</span></li>)}</ul></div>
          <div className="band"><h3>{t(lang, 'Not included')}</h3><ul className="ow-list">{EXTRA.map((x) => <li key={x}><svg className="i"><use href="#ow-minus" /></svg><span>{t(lang, x)}</span></li>)}</ul></div>
        </div>
      </section>

      <section className="sec">
        <Head id="payment" kicker={t(lang, 'Payment')} title={t(lang, 'Payment and cancellation')} />
        <div className="ow-two">
          <div className="band"><h3>{t(lang, 'How you pay')}</h3><ul className="ow-list">
            <li><svg className="i"><use href="#ow-check" /></svg><span>{t(lang, '30% deposit to book, the rest 6 weeks before. No card fees.')}</span></li>
            <li><svg className="i"><use href="#ow-check" /></svg><span>{t(lang, 'Card or bank transfer. You can also pay the full price at once.')}</span></li>
          </ul></div>
          <div className="band"><h3>{t(lang, 'Cancellation')}</h3><ul className="ow-list">
            <li><svg className="i"><use href="#ow-check" /></svg><span>{t(lang, 'Free cancellation until 6 weeks before the start. After that the deposit is kept, or you can move it to another date in the same year once.')}</span></li>
          </ul></div>
        </div>
        <div className="ctas" style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 32 }}>
          <a className="pill pill-primary" href={path.courses(lang)}>{t(lang, 'Choose a course')}</a>
          <a className="pill pill-quiet" href={path.passages(lang)}>{t(lang, 'See all passages')}</a>
        </div>
      </section>
    </Shell>
  );
}
