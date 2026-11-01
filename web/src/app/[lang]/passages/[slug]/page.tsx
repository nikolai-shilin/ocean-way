import '@/styles/home.css';
import '@/styles/app.css';
import { notFound } from 'next/navigation';
import Shell from '@/components/Shell';
import { t } from '@/lib/content';
import { catalog, getInstructors, getLegs, getPassages, passageSlug, stopsFor, type Passage } from '@/lib/db';
import { peopleSection } from '@/lib/people';
import { Faq, faqLd, List, Program, Stops } from '@/components/Details';
import { breadcrumbs, Crumbs, meta, ORG, photo } from '@/lib/meta';
import { eur, galleryHtml, legMap, range, shortRange } from '@/lib/render';
import { path, SITE, type Lang } from '@/lib/site';

export const revalidate = 60;
export async function generateStaticParams() {
  return (await getPassages()).map((p) => ({ slug: passageSlug(p) }));
}
export const dynamicParams = false;

const nights = (p: Passage) => Math.round((Date.parse(p.ends_on) - Date.parse(p.starts_on)) / 864e5);

export async function generateMetadata({ params }: PageProps<'/[lang]/passages/[slug]'>) {
  const { lang, slug } = await params;
  const l = lang as Lang;
  const p = (await getPassages()).find((x) => passageSlug(x) === slug);
  if (!p) return {};
  const route = t(l, `${p.from_port} → ${p.to_port}`);
  const leg = (await getLegs())[p.leg];
  const shot = leg?.gallery?.find((g) => g.shape === 'l') ?? leg?.gallery?.[0];
  return meta(l, {
    title: t(l, 'Training passage {route}, {dates}', { route, dates: shortRange(l, p.starts_on, p.ends_on) }),
    description: t(l, leg?.summary ?? catalog().legs[p.leg] ?? ''), pathFor: (x) => path.passage(x, slug),
    image: shot ? photo(shot.photo_id, 1200) : undefined,
  });
}

export default async function PassageItem({ params }: PageProps<'/[lang]/passages/[slug]'>) {
  const { lang: raw, slug } = await params;
  const lang = raw as Lang;
  const all = await getPassages();
  const p = all.find((x) => passageSlug(x) === slug);
  if (!p) notFound();
  const leg = (await getLegs())[p.leg];
  const skippers = (await getInstructors()).filter((x) => x.legs.includes(p.leg));
  const summary = t(lang, leg?.summary ?? catalog().legs[p.leg] ?? '');
  const back = p.return_id ? all.find((x) => x.id === p.return_id) : undefined;
  const route = t(lang, `${p.from_port} → ${p.to_port}`);
  const when = range(lang, p.starts_on, p.ends_on);
  const n = nights(p);
  const full = p.places_left <= 0;
  const places = full ? t(lang, 'Full') : p.places_left === 1 ? t(lang, '1 of 4 left') : p.places_left === p.places_total ? t(lang, `${p.places_total} places`) : t(lang, '{n} of 4 left', { n: p.places_left });
  const same = all.filter((x) => x.leg === p.leg && x.id !== p.id && x.id !== back?.id);
  const crumbs: [string, string][] = [[t(lang, 'Home'), path.home(lang)], [t(lang, 'Passages'), path.passages(lang)], [`${route}, ${when}`, path.passage(lang, slug)]];
  const ld = { '@context': 'https://schema.org', '@graph': [ORG, breadcrumbs(lang, crumbs), {
    '@type': 'Event', name: `${t(lang, 'Training passage')}: ${route}`, description: summary,
    startDate: p.starts_on, endDate: p.ends_on, eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled', organizer: { '@id': `${SITE}/#org` },
    location: { '@type': 'Place', name: t(lang, p.from_port), address: { '@type': 'PostalAddress', addressCountry: p.from_port === 'Northern Cyprus' ? 'CY' : 'TR' } },
    offers: { '@type': 'Offer', price: p.price_eur, priceCurrency: 'EUR', availability: `https://schema.org/${full ? 'SoldOut' : 'InStock'}`, url: SITE + path.passage(lang, slug) },
  }, ...(leg?.faq?.length ? [faqLd(lang, leg.faq)] : [])] };
  const doList = ['Plan each leg with the instructor: route, shipping and weather windows', 'Stand watches, also at night', 'Skipper legs yourself under supervision', 'Log every mile and night hour, signed by the instructor'];
  const map = legMap(lang, p.leg);
  return (
    <Shell lang={lang} section="passages" pathFor={(l) => path.passage(l, slug)} jsonld={ld}>
      <section className="ow-hero">
        <Crumbs lang={lang} items={crumbs} />
        <span className="kicker">{t(lang, 'Training passage')} · {when}</span>
        <h1 className="display">{route}</h1>
        <p className="lead">{summary}</p>
        <div className="facts">
          <span className="fact"><svg className="i"><use href="#i-cal" /></svg>{t(lang, `${n} nights`)}</span>
          {leg?.distance_nm ? <span className="fact"><svg className="i"><use href="#i-chart" /></svg>{t(lang, '{n} nautical miles', { n: leg.distance_nm })}</span> : null}
          <span className="fact"><svg className="i"><use href="#i-compass" /></svg>{t(lang, p.waters)}</span>
          <span className="fact"><svg className="i"><use href="#i-guests" /></svg>{places}</span>
        </div>
      </section>
      {leg?.gallery?.length ? <div dangerouslySetInnerHTML={{ __html: galleryHtml(lang, leg.gallery) }} /> : null}
      <div className="ow-item">
        <div className="ow-body">
          <div className="ow-map" dangerouslySetInnerHTML={{ __html: map }} />
          {leg?.about.length ? <section className="ow-text"><h2>{t(lang, 'About the route')}</h2>{leg.about.map((x, i) => <p key={i}>{t(lang, x)}</p>)}</section> : null}
          {leg?.stops.length ? <section id="route"><h2>{t(lang, 'Route and stops')}</h2><Stops lang={lang} stops={stopsFor(leg, p)} /></section> : null}
          {leg?.program.length ? <section id="programme"><h2>{t(lang, 'How the passage runs')}</h2><Program lang={lang} steps={leg.program} /></section> : null}
          <section>
            <h2>{t(lang, 'What you do on board')}</h2>
            <List lang={lang} items={doList} />
          </section>
          {skippers.length ? <div dangerouslySetInnerHTML={{ __html: peopleSection(lang, skippers, 'passage') }} /> : null}
          {leg ? (
            <div className="ow-two">
              <div className="band" id="requirements"><h3>{t(lang, 'Requirements')}</h3><List lang={lang} items={leg.requirements} /></div>
              <div className="band" id="bring"><h3>{t(lang, 'What to bring')}</h3><List lang={lang} items={leg.bring} /></div>
            </div>
          ) : null}
          {back ? (
            <section>
              <h2>{t(lang, 'The return leg')}</h2>
              <p><a href={path.passage(lang, passageSlug(back))}>{t(lang, `${back.from_port} → ${back.to_port}`)}, {range(lang, back.starts_on, back.ends_on)}</a>. {t(lang, 'Most people sail both ways: twice the miles, one flight')}.</p>
            </section>
          ) : null}
          {same.length ? (
            <section>
              <h2>{t(lang, 'Other dates on this route')}</h2>
              <ul className="ow-list">{same.map((x) => <li key={x.id}><svg className="i"><use href="#i-cal" /></svg><span><a href={path.passage(lang, passageSlug(x))}>{t(lang, `${x.from_port} → ${x.to_port}`)}, {range(lang, x.starts_on, x.ends_on)}</a></span></li>)}</ul>
            </section>
          ) : null}
        </div>
        <aside className="band ow-box" aria-label={t(lang, 'Price and dates')}>
          <div className="card-title">{route}</div>
          <div className="card-meta">{when} · {t(lang, `${n} nights`)}</div>
          <div className="ow-price"><b>{eur(p.price_eur)}</b><span className="card-meta">{t(lang, 'per person')}</span></div>
          <span className={full ? 'avail full' : p.places_left <= 2 ? 'avail low' : 'avail'} style={{ alignSelf: 'flex-start' }}>{places}</span>
          {full
            ? <a className="pill pill-quiet pill-wide" href="#">{t(lang, 'Join waitlist')}</a>
            : <a className="pill pill-primary pill-wide" href={`${path.booking(lang)}?item=passage&id=${p.key}`}>{t(lang, 'Book')}</a>}
          <a className="pill pill-quiet pill-wide" href={path.passages(lang)}>{t(lang, 'All passages')}</a>
        </aside>
      </div>
      {leg?.faq?.length ? <Faq lang={lang} items={leg.faq} /> : null}
    </Shell>
  );
}
