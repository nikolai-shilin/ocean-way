import '@/styles/home.css';
import '@/styles/app.css';
import { notFound } from 'next/navigation';
import Shell from '@/components/Shell';
import { BoatCard } from '@/components/Cards';
import { photoProps } from '@/lib/images';
import { t } from '@/lib/content';
import { getCourseDates, getYachts } from '@/lib/db';
import { usedForIcon } from '@/lib/icons';
import { breadcrumbs, Crumbs, meta, ORG, photo } from '@/lib/meta';
import { eur, range, boatSpec } from '@/lib/render';
import { path, SITE, type Lang } from '@/lib/site';

export const revalidate = 300;
export async function generateStaticParams() {
  return (await getYachts()).map((y) => ({ slug: y.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }: PageProps<'/[lang]/fleet/[slug]'>) {
  const { lang, slug } = await params;
  const l = lang as Lang;
  const y = (await getYachts()).find((x) => x.slug === slug);
  if (!y) return {};
  return meta(l, { title: `${y.model}, ${t(l, y.base)}`, description: t(l, y.description), pathFor: (x) => path.boat(x, slug), image: photo(y.photo_id, 1200) });
}

const LOC: Record<Lang, string> = { en: 'en-GB', ru: 'ru-RU', de: 'de-DE', es: 'es-ES' };
const numIn = (lang: Lang) => (x: number | null, unit = '') => (x == null ? '–' : `${Number(x).toLocaleString(LOC[lang])}${unit}`);

export default async function Boat({ params }: PageProps<'/[lang]/fleet/[slug]'>) {
  const { lang: raw, slug } = await params;
  const lang = raw as Lang;
  const yachts = await getYachts();
  const y = yachts.find((x) => x.slug === slug);
  if (!y) notFound();
  const weeks = (await getCourseDates('bareboat-skipper')).filter((d) => d.boat === y.model && d.places_left > 0);
  const crumbs: [string, string][] = [[t(lang, 'Home'), path.home(lang)], [t(lang, 'Fleet'), path.fleet(lang)], [y.model, path.boat(lang, slug)]];
  const ld = { '@context': 'https://schema.org', '@graph': [ORG, breadcrumbs(lang, crumbs), {
    '@type': 'Product', name: y.model, description: t(lang, y.description), image: photo(y.photo_id, 1200), category: 'Sailing yacht charter',
    brand: { '@type': 'Brand', name: y.model.split(' ')[0] },
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Year', value: y.year }, { '@type': 'PropertyValue', name: 'Length', value: Number(y.length_m), unitCode: 'MTR' },
      { '@type': 'PropertyValue', name: 'Cabins', value: y.cabins }, { '@type': 'PropertyValue', name: 'Berths', value: y.berths },
    ],
    offers: { '@type': 'Offer', price: y.charter_from_eur, priceCurrency: 'EUR', url: SITE + path.boat(lang, slug),
      priceSpecification: { '@type': 'UnitPriceSpecification', price: y.charter_from_eur, priceCurrency: 'EUR', unitText: 'week' } },
  }] };
  const num = numIn(lang);
  const specs: [string, string][] = [
    [t(lang, 'Year'), String(y.year)], [t(lang, 'Length'), num(y.length_m, ' m')], [t(lang, 'Beam'), num(y.beam_m, ' m')], [t(lang, 'Draft'), num(y.draft_m, ' m')],
    [t(lang, 'Cabins'), String(y.cabins)], [t(lang, 'Berths'), String(y.berths)], [t(lang, 'Heads'), num(y.heads)], [t(lang, 'Engine'), y.engine_hp ? `${y.engine_hp} ${t(lang, 'hp')}` : '–'],
  ];
  const others = yachts.filter((x) => x.slug !== slug);
  return (
    <Shell lang={lang} section="fleet" pathFor={(l) => path.boat(l, slug)} jsonld={ld}>
      <section className="ow-hero">
        <Crumbs lang={lang} items={crumbs} current={t(lang, y.base)} />
        <h1 className="display">{y.model}</h1>
        <p className="lead">{t(lang, y.description)}</p>
        <div className="facts">
          <span className="fact"><svg className="i"><use href="#ow-pin" /></svg>{t(lang, y.base)}</span>
          <span className="fact"><svg className="i"><use href={`#${usedForIcon(y.used_for)}`} /></svg>{t(lang, y.used_for)}</span>
        </div>
      </section>
      <div className="ow-item">
        <div className="ow-body">
          <div className="ow-photo"><img {...photoProps(photo(y.photo_id, 1400), 'wide', { priority: true })} alt={t(lang, y.photo_alt)} suppressHydrationWarning /></div>
          <section>
            <h2>{t(lang, 'Specifications')}</h2>
            <dl className="ow-specs">{specs.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
            <p className="disclaimer">{t(lang, 'Approximate figures for this model; the exact layout and equipment of each boat are in the charter contract.')}</p>
          </section>
          <section>
            <h2>{t(lang, 'Sail on this boat')}</h2>
            {weeks.length ? (
              <ul className="ow-list">{weeks.map((d) => <li key={d.id}><svg className="i"><use href="#ow-calendar" /></svg><span><a href={`${path.booking(lang)}?item=bareboat&date=${d.key}`}>{t(lang, 'IYT Bareboat Skipper course')}, {range(lang, d.starts_on, d.ends_on)}</a> · {eur(d.price_eur)}</span></li>)}</ul>
            ) : (
              <div className="band ow-empty"><p>{t(lang, 'Ask us for the weeks when this boat is free for charter.')}</p></div>
            )}
          </section>
        </div>
        <aside className="band ow-box" aria-label={t(lang, 'Charter')}>
          <div className="card-title">{y.model}</div>
          <div className="card-meta">{boatSpec(lang, y)}</div>
          <div className="ow-price"><b>{eur(y.charter_from_eur)}</b><span className="card-meta">{t(lang, 'a week, from')}</span></div>
          <p className="ow-note">{t(lang, 'Bareboat with a licence, or with one of our skippers. Final price depends on the week.')}</p>
          <a className="pill pill-primary pill-wide" href="#">{t(lang, 'Ask about charter weeks')}</a>
          <a className="pill pill-quiet pill-wide" href={path.fleet(lang)}>{t(lang, 'All boats')}</a>
        </aside>
      </div>
      <section className="sec" data-row style={{ marginTop: 96 }}>
        <div className="sec-head row-head"><div><span className="kicker">{t(lang, 'Our fleet')}</span><h2 className="h2" style={{ marginTop: 12 }}>{t(lang, 'Other boats')}</h2></div>
          <div className="row-nav"><button className="round" type="button" data-dir="-1" aria-label={t(lang, 'Previous')}><svg className="i" style={{ transform: 'scaleX(-1)' }}><use href="#ow-arrow" /></svg></button><button className="round" type="button" data-dir="1" aria-label={t(lang, 'Next')}><svg className="i"><use href="#ow-arrow" /></svg></button></div></div>
        <div className="hscroll" tabIndex={0}>{others.map((x) => <BoatCard key={x.slug} lang={lang} y={x} />)}</div>
      </section>
    </Shell>
  );
}
