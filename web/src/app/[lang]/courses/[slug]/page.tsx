import '@/styles/home.css';
import '@/styles/app.css';
import '@/styles/passages.css';
import { notFound } from 'next/navigation';
import Shell from '@/components/Shell';
import { t } from '@/lib/content';
import { courseTheory } from '@/lib/theory';
import { photoProps } from '@/lib/images';
import { english, getCourseDates, getCourses, getInstructors, getRouteMap } from '@/lib/db';
import { scopeIcon } from '@/lib/icons';
import { peopleSection } from '@/lib/people';
import { breadcrumbs, Crumbs, meta, ORG, photo } from '@/lib/meta';
import { eur, galleryHtml, nightsOf, places, routeMap } from '@/lib/render';
import { dates as dateRange } from '@/lib/passages';
import { path, SITE, type Lang } from '@/lib/site';
import { CourseCard } from '@/components/Cards';
import { Faq, faqLd, List, Program, Skills, Stops } from '@/components/Details';

export const revalidate = 300;
export async function generateStaticParams() {
  return (await getCourses()).map((c) => ({ slug: c.slug }));
}
export const dynamicParams = false;

async function find(slug: string, lang: Lang) {
  return (await getCourses(lang)).find((c) => c.slug === slug);
}

export async function generateMetadata({ params }: PageProps<'/[lang]/courses/[slug]'>) {
  const { lang, slug } = await params;
  const c = await find(slug, lang as Lang);
  if (!c) return {};
  const l = lang as Lang;
  return meta(l, { title: t(l, '{name} course', { name: c.name }), description: c.description, pathFor: (x) => path.courseItem(x, slug), image: photo(c.photo_id, 1200) });
}

export default async function CourseItem({ params }: PageProps<'/[lang]/courses/[slug]'>) {
  const { lang: raw, slug } = await params;
  const lang = raw as Lang;
  const courses = await getCourses(lang);
  const c = courses.find((x) => x.slug === slug);
  if (!c) notFound();
  const dates = (await getCourseDates(slug)).filter((d) => d.places_left > 0);
  const next = [...dates].sort((a, b) => a.starts_on.localeCompare(b.starts_on))[0];
  const team = (await getInstructors(lang)).filter((p) => p.courses.includes(slug));
  const map = routeMap(lang, await getRouteMap('courses', slug));
  const theory = await courseTheory(lang, c.theory);
  const crumbs: [string, string][] = [[t(lang, 'Home'), path.home(lang)], [t(lang, 'Courses'), path.courses(lang)], [c.name, path.courseItem(lang, slug)]];
  const ld = { '@context': 'https://schema.org', '@graph': [ORG, breadcrumbs(lang, crumbs), {
    '@type': 'Course', name: c.name, description: c.description, provider: { '@id': `${SITE}/#org` }, inLanguage: ['en', 'ru'],
    image: photo(c.photo_id, 1200), educationalCredentialAwarded: c.certificate ? c.certificate.split(':')[0] : c.name,
    offers: { '@type': 'Offer', price: c.price_from_eur, priceCurrency: 'EUR', category: 'Paid', url: SITE + path.courseItem(lang, slug) },
    hasCourseInstance: dates.map((d) => ({ '@type': 'CourseInstance', courseMode: 'Onsite', startDate: d.starts_on, endDate: d.ends_on, location: { '@type': 'Place', name: t(lang, d.area) } })),
  }, ...(c.faq?.length ? [faqLd(c.faq)] : [])] };
  const others = courses.filter((x) => x.slug !== slug);
  return (
    <Shell lang={lang} section="courses" pathFor={(l) => path.courseItem(l, slug)} jsonld={ld}>
      <section className="ow-hero">
        <Crumbs lang={lang} items={crumbs} />
        <span className="lvl">{c.level}</span>
        <h1 className="display">{t(lang, '{name} course', { name: c.name })}</h1>
        <p className="lead">{c.summary}</p>
        <div className="facts">
          <span className="fact"><svg className="i"><use href="#ow-clock" /></svg>{c.duration}</span>
          <span className="fact"><svg className="i"><use href={`#${scopeIcon(english(c).scope)}`} /></svg>{c.scope}</span>
          <span className="fact"><svg className="i"><use href="#ow-licence" /></svg>IYT</span>
          <span className="fact"><svg className="i"><use href="#ow-chat" /></svg>{t(lang, 'In English and Russian')}</span>
          {c.route_nm ? <span className="fact"><svg className="i"><use href="#ow-route" /></svg>{t(lang, '{n} nautical miles', { n: c.route_nm })}</span> : null}
        </div>
      </section>
      {c.gallery?.length
        ? <div dangerouslySetInnerHTML={{ __html: galleryHtml(lang, c.gallery) }} />
        : <div className="ow-photo" style={{ marginTop: 40 }}><img {...photoProps(photo(c.photo_id, 1400), 'wide', { priority: true })} alt={c.photo_alt} suppressHydrationWarning /></div>}
      <div className="ow-item">
        <div className="ow-body">
          <section className="ow-text"><h2>{t(lang, 'About the course')}</h2><p>{c.description}</p>{(c.about ?? []).map((x, i) => <p key={i}>{x}</p>)}</section>
          {c.program?.length ? <section id="programme"><h2>{t(lang, 'Course programme')}</h2><Program steps={c.program} /></section> : null}
          {c.skills?.length
            ? <section id="syllabus"><h2>{t(lang, "What you'll learn")}</h2><Skills skills={c.skills} en={english(c).skills} /></section>
            : c.learn.length ? <section id="syllabus"><h2>{t(lang, "What you'll learn")}</h2><List items={c.learn} /></section> : null}
          {c.route?.length ? (
            <section id="route">
              <h2>{t(lang, c.route.length > 1 ? 'Route and stops' : 'Where the course takes place')}</h2>
              <div className="ow-map" dangerouslySetInnerHTML={{ __html: map }} />
              <div style={{ marginTop: 24 }}><Stops lang={lang} stops={c.route} /></div>
            </section>
          ) : null}
          <div className="ow-two">
            {c.requirements.length ? <div className="band" id="requirements"><h3>{t(lang, 'Requirements')}</h3><List items={c.requirements} /></div> : null}
            {c.bring?.length ? <div className="band" id="bring"><h3>{t(lang, 'What to bring')}</h3><List items={c.bring} /></div> : null}
          </div>
          {c.included?.length ? (
            <div className="ow-two" id="included">
              <div className="band"><h3>{t(lang, 'Included')}</h3><List items={c.included} /></div>
              {c.not_included?.length ? <div className="band"><h3>{t(lang, 'Not included')}</h3><List items={c.not_included} icon="ow-minus" /></div> : null}
            </div>
          ) : null}
          {c.certificate ? <section><h2>{t(lang, 'The certificate')}</h2><p>{c.certificate}</p></section> : null}
          {c.after?.length ? <section id="after"><h2>{t(lang, 'After the course')}</h2><Program steps={c.after} /></section> : null}
          {team.length ? <div dangerouslySetInnerHTML={{ __html: peopleSection(lang, team, 'course') }} /> : null}
          <section id="dates">
            <h2>{t(lang, 'Dates')}</h2>
            {dates.length ? (
              <div className="pp-list">{dates.map((d) => {
                const pl = places(lang, d.places_left, d.places_total);
                return (
                  <article key={d.id} className="pp">
                    <div className="pp-when"><b className="pp-dates">{dateRange(lang, d.starts_on, d.ends_on)}</b><span className="pp-nights">{t(lang, `${nightsOf(d)} nights`)}</span></div>
                    <div className="pp-what"><h3 className="pp-route">{t(lang, d.area)}</h3>{d.boat ? <p className="pp-sub">{d.boat}</p> : null}</div>
                    <p className="pp-price"><b>{eur(d.price_eur)}</b><span>{t(lang, 'per person')}</span></p>
                    <div className="pp-act"><span className={pl.cls}>{pl.text}</span><a className="pill pill-primary pill-sm" href={`${path.booking(lang)}?course=${slug}`}>{t(lang, 'Book')}</a></div>
                  </article>
                );
              })}</div>
            ) : (
              <div className="band ow-empty"><p>{t(lang, 'New dates for this course are published in Telegram first. Ask us and we will tell you the next start dates and find a week that suits you.')}</p></div>
            )}
          </section>
          {theory.length ? (
            <section id="theory">
              <h2>{t(lang, 'Read the theory')}</h2>
              <div className="ow-th-cards">{theory.map((a) => (
                <a key={a.slug} className="card" href={path.article(lang, a.slug)}>
                  <div className="photo"><div className="clip"><img {...photoProps(a.img, 'card', { lazy: true })} alt={a.alt} suppressHydrationWarning /></div></div>
                  <div className="card-body"><span className="card-meta">{a.topic}</span><span className="card-title">{a.title}</span><span className="card-meta">{a.read}</span></div>
                </a>
              ))}</div>
              <a className="ow-th-all" href={path.theory(lang)}>{t(lang, 'All theory')}<svg className="i" aria-hidden="true"><use href="#ow-arrow" /></svg></a>
            </section>
          ) : null}
        </div>
        <aside className="band ow-box" aria-label={t(lang, 'Price and dates')}>
          <div className="card-title">{c.name}</div>
          <div className="ow-price"><b>{eur(c.price_from_eur)}</b><span className="card-meta">{c.price_unit}</span></div>
          {c.included?.length
            ? <p className="ow-note"><a href="#included">{t(lang, 'What the price includes')}</a></p>
            : <p className="ow-note">{t(lang, 'Instructor, yacht, fuel and marina fees on the course route, course book and certificate fee included.')}</p>}
          <a className="pill pill-primary pill-wide" href={`${path.booking(lang)}?course=${slug}`}>{t(lang, dates.length ? 'Book a place' : 'Ask about dates')}</a>
          <a className="pill pill-quiet pill-wide" href={path.courses(lang)}>{t(lang, 'All courses')}</a>
          <dl className="ow-facts">
            {next ? <div><svg className="i" aria-hidden="true"><use href="#ow-calendar" /></svg><dt>{t(lang, 'Next start')}</dt><dd>{dateRange(lang, next.starts_on, next.ends_on)}</dd></div> : null}
            <div><svg className="i" aria-hidden="true"><use href="#ow-clock" /></svg><dt>{t(lang, 'Duration')}</dt><dd>{c.duration}</dd></div>
            <div><svg className="i" aria-hidden="true"><use href="#ow-pin" /></svg><dt>{t(lang, 'Where')}</dt><dd>{next ? t(lang, next.area) : c.scope}</dd></div>
            {next?.boat ? <div><svg className="i" aria-hidden="true"><use href="#ow-monohull" /></svg><dt>{t(lang, 'Boat')}</dt><dd>{next.boat}</dd></div> : null}
            {next ? <div><svg className="i" aria-hidden="true"><use href="#ow-crew" /></svg><dt>{t(lang, 'Group')}</dt><dd>{t(lang, 'Up to {n} students', { n: next.places_total })}</dd></div> : null}
            {c.route_nm ? <div><svg className="i" aria-hidden="true"><use href="#ow-route" /></svg><dt>{t(lang, 'Route')}</dt><dd>{t(lang, '{n} nautical miles', { n: c.route_nm })}</dd></div> : null}
            <div><svg className="i" aria-hidden="true"><use href="#ow-chat" /></svg><dt>{t(lang, 'Language')}</dt><dd>{t(lang, 'English and Russian')}</dd></div>
          </dl>
        </aside>
      </div>
      {c.faq?.length ? <Faq lang={lang} items={c.faq} /> : null}
      <div className="mbar">
        <div className="ow-mbar">
          <p><b>{eur(c.price_from_eur)}</b> {c.price_unit}</p>
          <p>{next ? `${dateRange(lang, next.starts_on, next.ends_on)} · ` : ''}{c.duration}</p>
          {next ? <p className={places(lang, next.places_left, next.places_total).cls.includes('low') ? 'low' : undefined}>{places(lang, next.places_left, next.places_total).text}</p> : null}
        </div>
        {next
          ? <a className="pill pill-primary" href="#dates">{t(lang, 'Choose dates')}</a>
          : <a className="pill pill-primary" href={`${path.booking(lang)}?course=${slug}`}>{t(lang, 'Ask about dates')}</a>}
      </div>
      <section className="sec" data-row style={{ marginTop: 96 }}>
        <div className="sec-head row-head"><div><span className="kicker">{t(lang, 'Courses')}</span><h2 className="h2" style={{ marginTop: 12 }}>{t(lang, 'Other courses')}</h2></div>
          <div className="row-nav"><button className="round" type="button" data-dir="-1" aria-label={t(lang, 'Previous')}><svg className="i" style={{ transform: 'scaleX(-1)' }}><use href="#ow-arrow" /></svg></button><button className="round" type="button" data-dir="1" aria-label={t(lang, 'Next')}><svg className="i"><use href="#ow-arrow" /></svg></button></div></div>
        <div className="hscroll" tabIndex={0}>{others.map((x) => <CourseCard key={x.slug} lang={lang} c={x} />)}</div>
      </section>
    </Shell>
  );
}
