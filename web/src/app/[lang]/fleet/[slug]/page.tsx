import '@/styles/home.css';
import '@/styles/app.css';
import { notFound } from 'next/navigation';
import Shell from '@/components/Shell';
import Cover from '@/components/Cover';
import { BoatCard } from '@/components/Cards';
import { photoProps } from '@/lib/images';
import { t } from '@/lib/content';
import { getCourseDates, getCourses, getYachts } from '@/lib/db';
import { berthsText, boatSpecs, extraPrice, periodDates, seasonName } from '@/lib/fleet';
import { breadcrumbs, Crumbs, meta, ORG, photo } from '@/lib/meta';
import { boatModel, boatSpec, boatTitle, boatUse, eur, range } from '@/lib/render';
import { path, SITE, type Lang } from '@/lib/site';

export const revalidate = 300;
export async function generateStaticParams() {
  return (await getYachts()).map((y) => ({ slug: y.slug }));
}
export const dynamicParams = false;

const fullName = (y: { name: string | null; model: string }) => [y.name, y.model].filter(Boolean).join(', ');

export async function generateMetadata({ params }: PageProps<'/[lang]/fleet/[slug]'>) {
  const { lang, slug } = await params;
  const l = lang as Lang;
  const y = (await getYachts(l)).find((x) => x.slug === slug);
  if (!y) return {};
  return meta(l, { title: `${fullName(y)}, ${t(l, y.base)}`, description: y.description, pathFor: (x) => path.boat(x, slug), image: photo(y.photo_id, 1200) });
}

export default async function Boat({ params }: PageProps<'/[lang]/fleet/[slug]'>) {
  const { lang: raw, slug } = await params;
  const lang = raw as Lang;
  const [yachts, courses] = await Promise.all([getYachts(lang), getCourses(lang)]);
  const y = yachts.find((x) => x.slug === slug);
  if (!y) notFound();
  // Course weeks on this boat, any course, with places left.
  const weeks = (await Promise.all(courses.map(async (c) => (await getCourseDates(c.slug)).map((d) => ({ ...d, course: c })))))
    .flat().filter((d) => d.yacht_slug === slug && d.places_left > 0).sort((a, b) => a.starts_on.localeCompare(b.starts_on));
  const crumbs: [string, string][] = [[t(lang, 'Home'), path.home(lang)], [t(lang, 'Fleet'), path.fleet(lang)], [boatTitle(y), path.boat(lang, slug)]];
  const ld = { '@context': 'https://schema.org', '@graph': [ORG, breadcrumbs(lang, crumbs), {
    '@type': 'Product', name: fullName(y), description: y.description, image: [photo(y.photo_id, 1200), ...y.gallery.slice(1, 6).map((s) => photo(s.photo_id, 1200))],
    category: 'Sailing yacht charter', brand: { '@type': 'Brand', name: y.model.split(' ')[0] }, model: y.model,
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'Year', value: y.year }, { '@type': 'PropertyValue', name: 'Length', value: Number(y.length_m), unitCode: 'MTR' },
      { '@type': 'PropertyValue', name: 'Cabins', value: y.cabins }, { '@type': 'PropertyValue', name: 'Berths', value: y.berths + y.extra_berths },
    ],
    offers: { '@type': 'Offer', price: y.charter_from_eur, priceCurrency: 'EUR', url: SITE + path.boat(lang, slug),
      priceSpecification: { '@type': 'UnitPriceSpecification', price: y.charter_from_eur, priceCurrency: 'EUR', unitText: 'week' } },
  }] };
  const [useIcon, use] = boatUse(lang, y);
  const model = boatModel(y);
  const others = yachts.filter((x) => x.slug !== slug);
  const where = [y.marina, t(lang, y.base)].filter(Boolean).join(', ');
  const facts = (
    <div className="facts">
      <span className="fact"><svg className="i"><use href={`#${y.kind === 'catamaran' ? 'ow-catamaran' : 'ow-monohull'}`} /></svg>{model ? `${model}, ${y.year}` : y.year}</span>
      <span className="fact"><svg className="i"><use href="#ow-pin" /></svg>{where}</span>
      <span className="fact"><svg className="i"><use href="#ow-crew" /></svg>{t(lang, '{c} cabins, {b} berths', { c: y.cabins, b: berthsText(y) })}</span>
      {useIcon !== 'ow-monohull' && useIcon !== 'ow-catamaran' ? <span className="fact"><svg className="i"><use href={`#${useIcon}`} /></svg>{use}</span> : null}
    </div>
  );
  const layout = [
    ['ow-cabin', y.skipper_cabin ? t(lang, '{n} double cabins plus a skipper’s cabin', { n: y.cabins }) : t(lang, '{n} double cabins', { n: y.cabins })],
    ...(y.heads ? [['ow-check', t(lang, y.heads === 1 ? '1 head' : '{n} heads', { n: y.heads })]] : []),
    ['ow-crew', y.max_guests ? t(lang, '{b} berths, registered for {n} people', { b: berthsText(y), n: y.max_guests }) : t(lang, '{b} berths', { b: berthsText(y) })],
  ];
  const always = [
    ...(y.service_pack_eur ? [[t(lang, 'Service pack'), t(lang, y.kind === 'catamaran' ? 'Transit log, final cleaning, bed linen and towels; dinghy outboard included. €150 more to sail to Greece.' : 'Transit log, final cleaning, bed linen and towels. €150 more to sail to Greece.'), eur(y.service_pack_eur)]] : []),
    ...(y.deposit_eur ? [[t(lang, 'Security deposit'), t(lang, 'Returned at check-out'), eur(y.deposit_eur)]] : []),
  ];
  return (
    <Shell lang={lang} section="fleet" pathFor={(l) => path.boat(l, slug)} jsonld={ld}>
      {y.gallery.length
        ? <Cover lang={lang} top={<Crumbs lang={lang} items={crumbs} current={model || t(lang, y.base)} />} title={boatTitle(y)} lead={y.description} shots={y.gallery} after={facts} />
        : <>
            <section className="ow-hero">
              <Crumbs lang={lang} items={crumbs} current={t(lang, y.base)} />
              <h1 className="display">{boatTitle(y)}</h1>
              <p className="lead">{y.description}</p>
              {facts}
            </section>
            <div className="ow-photo" style={{ marginTop: 40 }}><img {...photoProps(photo(y.photo_id, 1400), 'wide', { priority: true })} alt={y.photo_alt} suppressHydrationWarning /></div>
          </>}
      <div className="ow-item">
        <div className="ow-body">
          <section id="specs">
            <h2>{t(lang, 'Specifications')}</h2>
            <dl className="ow-specs">{boatSpecs(lang, y).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
          </section>
          {y.layout_photo_id ? (
            <section id="layout">
              <h2>{t(lang, 'Layout')}</h2>
              <div className="band fl-layout">
                <div className="fl-plan"><img src={y.layout_photo_id} alt={t(lang, 'Deck plan of {name}', { name: boatTitle(y) })} loading="lazy" /></div>
                <ul>{layout.map(([icon, text]) => <li key={text}><svg className="i" aria-hidden="true"><use href={`#${icon}`} /></svg><span>{text}</span></li>)}</ul>
              </div>
            </section>
          ) : null}
          {y.highlights.length ? (
            <section id="equipment">
              <h2>{t(lang, 'On board')}</h2>
              <ul className="ow-list ow-cols">{y.highlights.map((h) => <li key={h}><svg className="i" aria-hidden="true"><use href="#ow-check" /></svg><span>{h}</span></li>)}</ul>
              <p className="disclaimer">{t(lang, 'Also on every boat: life jackets, liferaft, first aid kit, flares, fire extinguisher and blanket, charts and a dinghy. The full inventory is in the charter contract.')}</p>
            </section>
          ) : null}
          {y.prices.length ? (
            <section id="prices">
              <h2>{t(lang, 'Prices in {year}', { year: y.prices[0].starts_on.slice(0, 4) })}</h2>
              <div className="tbl-wrap"><table className="tbl fl-prices">
                <thead><tr><th>{t(lang, 'Season')}</th><th className="hl">{t(lang, 'Dates')}</th><th className="num">{t(lang, 'A week')}</th></tr></thead>
                <tbody>{y.prices.map((p) => <tr key={p.starts_on}><td>{seasonName(lang, p)}</td><td className="hl">{periodDates(lang, p)}</td><td className="num" style={{ color: 'var(--ink)' }}><b>{eur(p.week_eur)}</b></td></tr>)}</tbody>
              </table></div>
              <p className="disclaimer">{t(lang, 'The boat for one week, Saturday to Saturday. The service pack, deposit and extras are paid at the base.')}</p>
            </section>
          ) : null}
          {always.length || y.extras.length ? (
            <section id="base">
              <h2>{t(lang, 'At the base')}</h2>
              <div className="fl-base">
                {always.length ? <div className="band"><h3>{t(lang, 'Always')}</h3><ul className="fl-rows">{always.map(([n, note, p]) => <li key={n}><div>{n}<span>{note}</span></div><b>{p}</b></li>)}</ul></div> : null}
                {y.extras.length ? <div className="band"><h3>{t(lang, 'If you want')}</h3><ul className="fl-rows fl-cols">{y.extras.map((e) => <li key={e.name}><div>{e.name}{e.note ? <span>{e.note}</span> : null}</div><b>{extraPrice(lang, e)}</b></li>)}</ul></div> : null}
              </div>
              <p className="disclaimer">{t(lang, 'Paid in cash at the base. Prices from the charter company for 2027; we confirm them with your dates.')}</p>
            </section>
          ) : null}
          <section id="courses">
            <h2>{t(lang, 'Sail on this boat')}</h2>
            {weeks.length ? (
              <ul className="ow-list">{weeks.map((d) => <li key={d.id}><svg className="i"><use href="#ow-calendar" /></svg><span><a href={`${path.courseItem(lang, d.course.slug)}#dates`}>{d.course.name}, {range(lang, d.starts_on, d.ends_on)}</a> · {eur(d.price_eur)} {t(lang, 'per person')}</span></li>)}</ul>
            ) : (
              <div className="band ow-empty"><p>{t(lang, 'Ask us for the weeks when this boat is free for charter.')}</p></div>
            )}
          </section>
        </div>
        <aside className="band ow-box" aria-label={t(lang, 'Charter')}>
          <div className="card-title">{boatTitle(y)}</div>
          <div className="card-meta">{[model, boatSpec(lang, y)].filter(Boolean).join(' · ')}</div>
          <div className="ow-price"><b>{eur(y.charter_from_eur)}</b><span className="card-meta">{t(lang, 'a week, from')}</span></div>
          {y.service_pack_eur ? (
            <dl className="ow-facts">
              <div><svg className="i" aria-hidden="true"><use href="#ow-calendar" /></svg><dt>{t(lang, 'Check-in')}</dt><dd>{t(lang, 'Sat {time}', { time: '17:00' })}</dd></div>
              <div><svg className="i" aria-hidden="true"><use href="#ow-clock" /></svg><dt>{t(lang, 'Check-out')}</dt><dd>{t(lang, 'Sat {time}', { time: '09:00' })}</dd></div>
              <div><svg className="i" aria-hidden="true"><use href="#ow-charter" /></svg><dt>{t(lang, 'Service pack')}</dt><dd>{eur(y.service_pack_eur)}</dd></div>
              {y.deposit_eur ? <div><svg className="i" aria-hidden="true"><use href="#ow-lock" /></svg><dt>{t(lang, 'Deposit')}</dt><dd>{eur(y.deposit_eur)}</dd></div> : null}
            </dl>
          ) : null}
          <p className="ow-note">{t(lang, 'Bareboat with a licence, or with one of our skippers. The price depends on the week.')}</p>
          <a className="pill pill-primary pill-wide" href="#">{t(lang, 'Ask about charter weeks')}</a>
          <a className="pill pill-quiet pill-wide" href={path.fleet(lang)}>{t(lang, 'All boats')}</a>
        </aside>
      </div>
      <div className="mbar">
        <div className="ow-mbar">
          <p>{fullName(y)}</p>
          <p><b>{eur(y.charter_from_eur)}</b> {t(lang, 'a week, from')}</p>
        </div>
        <a className="pill pill-primary" href="#">{t(lang, 'Ask about weeks')}</a>
      </div>
      <section className="sec" data-row style={{ marginTop: 96 }}>
        <div className="sec-head row-head"><div><span className="kicker">{t(lang, 'Our fleet')}</span><h2 className="h2" style={{ marginTop: 12 }}>{t(lang, 'Other boats')}</h2></div>
          <div className="row-nav"><button className="round" type="button" data-dir="-1" aria-label={t(lang, 'Previous')}><svg className="i" style={{ transform: 'scaleX(-1)' }}><use href="#ow-arrow" /></svg></button><button className="round" type="button" data-dir="1" aria-label={t(lang, 'Next')}><svg className="i"><use href="#ow-arrow" /></svg></button></div></div>
        <div className="hscroll" tabIndex={0}>{others.map((x) => <BoatCard key={x.slug} lang={lang} y={x} />)}</div>
      </section>
    </Shell>
  );
}
