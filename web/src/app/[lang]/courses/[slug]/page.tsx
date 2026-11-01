import '@/styles/home.css';
import '@/styles/app.css';
import { notFound } from 'next/navigation';
import Shell from '@/components/Shell';
import { index, loadPage, t } from '@/lib/content';
import { photoProps } from '@/lib/images';
import { getCourseDates, getCourses, getInstructors } from '@/lib/db';
import { scopeIcon } from '@/lib/icons';
import { peopleSection } from '@/lib/people';
import { breadcrumbs, Crumbs, meta, ORG, photo } from '@/lib/meta';
import { courseMap, eur, galleryHtml, range } from '@/lib/render';
import { path, SITE, type Lang } from '@/lib/site';
import { CourseCard } from '@/components/Cards';
import { Faq, faqLd, List, Program, Skills, Stops } from '@/components/Details';

export const revalidate = 300;
// Bareboat Skipper has its own detailed page (courses/bareboat-skipper); every other course uses this one.
export async function generateStaticParams() {
  return (await getCourses()).filter((c) => c.slug !== 'bareboat-skipper').map((c) => ({ slug: c.slug }));
}
export const dynamicParams = false;

async function find(slug: string) {
  return (await getCourses()).find((c) => c.slug === slug);
}

export async function generateMetadata({ params }: PageProps<'/[lang]/courses/[slug]'>) {
  const { lang, slug } = await params;
  const c = await find(slug);
  if (!c) return {};
  const l = lang as Lang;
  return meta(l, { title: t(l, '{name} course', { name: c.name }), description: t(l, c.description), pathFor: (x) => path.courseItem(x, slug), image: photo(c.photo_id, 1200) });
}

export default async function CourseItem({ params }: PageProps<'/[lang]/courses/[slug]'>) {
  const { lang: raw, slug } = await params;
  const lang = raw as Lang;
  const courses = await getCourses();
  const c = courses.find((x) => x.slug === slug);
  if (!c) notFound();
  const dates = (await getCourseDates(slug)).filter((d) => d.places_left > 0);
  const team = (await getInstructors()).filter((p) => p.courses.includes(slug));
  const titles = Object.fromEntries(index.slugs.map((s) => {
    const page = loadPage(`theory-${s}`, lang);
    return [s, page.title.replace(/ · Ocean Way$/, '')];
  }));
  const crumbs: [string, string][] = [[t(lang, 'Home'), path.home(lang)], [t(lang, 'Courses'), path.courses(lang)], [c.name, path.courseItem(lang, slug)]];
  const ld = { '@context': 'https://schema.org', '@graph': [ORG, breadcrumbs(lang, crumbs), {
    '@type': 'Course', name: c.name, description: t(lang, c.description), provider: { '@id': `${SITE}/#org` }, inLanguage: ['en', 'ru'],
    image: photo(c.photo_id, 1200), educationalCredentialAwarded: c.certificate ? t(lang, c.certificate).split(':')[0] : c.name,
    offers: { '@type': 'Offer', price: c.price_from_eur, priceCurrency: 'EUR', category: 'Paid', url: SITE + path.courseItem(lang, slug) },
    hasCourseInstance: dates.map((d) => ({ '@type': 'CourseInstance', courseMode: 'Onsite', startDate: d.starts_on, endDate: d.ends_on, location: { '@type': 'Place', name: t(lang, d.area) } })),
  }, ...(c.faq?.length ? [faqLd(lang, c.faq)] : [])] };
  const others = courses.filter((x) => x.slug !== slug);
  return (
    <Shell lang={lang} section="courses" pathFor={(l) => path.courseItem(l, slug)} jsonld={ld}>
      <section className="ow-hero">
        <Crumbs lang={lang} items={crumbs} />
        <span className="lvl">{t(lang, c.level)}</span>
        <h1 className="display">{t(lang, '{name} course', { name: c.name })}</h1>
        <p className="lead">{t(lang, c.summary)}</p>
        <div className="facts">
          <span className="fact"><svg className="i"><use href="#ow-clock" /></svg>{t(lang, c.duration)}</span>
          <span className="fact"><svg className="i"><use href={`#${scopeIcon(c.scope)}`} /></svg>{t(lang, c.scope)}</span>
          <span className="fact"><svg className="i"><use href="#ow-licence" /></svg>IYT</span>
          <span className="fact"><svg className="i"><use href="#ow-chat" /></svg>{t(lang, 'In English and Russian')}</span>
          {c.route_nm ? <span className="fact"><svg className="i"><use href="#ow-route" /></svg>{t(lang, '{n} nautical miles', { n: c.route_nm })}</span> : null}
        </div>
      </section>
      {c.gallery?.length
        ? <div dangerouslySetInnerHTML={{ __html: galleryHtml(lang, c.gallery) }} />
        : <div className="ow-photo" style={{ marginTop: 40 }}><img {...photoProps(photo(c.photo_id, 1400), 'wide', { priority: true })} alt={t(lang, c.photo_alt)} suppressHydrationWarning /></div>}
      <div className="ow-item">
        <div className="ow-body">
          <section className="ow-text"><h2>{t(lang, 'About the course')}</h2><p>{t(lang, c.description)}</p>{(c.about ?? []).map((x, i) => <p key={i}>{t(lang, x)}</p>)}</section>
          {c.program?.length ? <section id="programme"><h2>{t(lang, 'Course programme')}</h2><Program lang={lang} steps={c.program} /></section> : null}
          {c.skills?.length
            ? <section id="syllabus"><h2>{t(lang, "What you'll learn")}</h2><Skills lang={lang} skills={c.skills} /></section>
            : c.learn.length ? <section id="syllabus"><h2>{t(lang, "What you'll learn")}</h2><List lang={lang} items={c.learn} /></section> : null}
          {c.route?.length ? (
            <section id="route">
              <h2>{t(lang, c.route.length > 1 ? 'Route and stops' : 'Where the course takes place')}</h2>
              <div className="ow-map" dangerouslySetInnerHTML={{ __html: courseMap(lang, slug) }} />
              <div style={{ marginTop: 24 }}><Stops lang={lang} stops={c.route} /></div>
            </section>
          ) : null}
          <div className="ow-two">
            {c.requirements.length ? <div className="band" id="requirements"><h3>{t(lang, 'Requirements')}</h3><List lang={lang} items={c.requirements} /></div> : null}
            {c.bring?.length ? <div className="band" id="bring"><h3>{t(lang, 'What to bring')}</h3><List lang={lang} items={c.bring} /></div> : null}
          </div>
          {c.included?.length ? (
            <div className="ow-two" id="included">
              <div className="band"><h3>{t(lang, 'Included')}</h3><List lang={lang} items={c.included} /></div>
              {c.not_included?.length ? <div className="band"><h3>{t(lang, 'Not included')}</h3><List lang={lang} items={c.not_included} icon="ow-minus" /></div> : null}
            </div>
          ) : null}
          {c.certificate ? <section><h2>{t(lang, 'The certificate')}</h2><p>{t(lang, c.certificate)}</p></section> : null}
          {c.after?.length ? <section id="after"><h2>{t(lang, 'After the course')}</h2><Program lang={lang} steps={c.after} /></section> : null}
          {team.length ? <div dangerouslySetInnerHTML={{ __html: peopleSection(lang, team, 'course') }} /> : null}
          <section id="dates">
            <h2>{t(lang, 'Dates')}</h2>
            {dates.length ? (
              <ul className="ow-list">{dates.map((d) => <li key={d.id}><svg className="i"><use href="#ow-calendar" /></svg><span>{range(lang, d.starts_on, d.ends_on)} · {t(lang, d.area)} · {eur(d.price_eur)}</span></li>)}</ul>
            ) : (
              <div className="band ow-empty"><p>{t(lang, 'New dates for this course are published in Telegram first. Ask us and we will tell you the next start dates and find a week that suits you.')}</p></div>
            )}
          </section>
          {c.theory.length ? (
            <section>
              <h2>{t(lang, 'Read the theory')}</h2>
              <div className="ow-chips">{c.theory.filter((s) => titles[s]).map((s) => <a key={s} href={path.article(lang, s)}><span className="chip">{titles[s]}</span></a>)}</div>
            </section>
          ) : null}
        </div>
        <aside className="band ow-box" aria-label={t(lang, 'Price and dates')}>
          <div className="card-title">{c.name}</div>
          <div className="ow-price"><b>{eur(c.price_from_eur)}</b><span className="card-meta">{t(lang, c.price_unit)}</span></div>
          {c.included?.length
            ? <p className="ow-note"><a href="#included">{t(lang, 'What the price includes')}</a></p>
            : <p className="ow-note">{t(lang, 'Instructor, yacht, fuel and marina fees on the course route, course book and certificate fee included.')}</p>}
          <a className="pill pill-primary pill-wide" href={`${path.booking(lang)}?course=${slug}`}>{t(lang, dates.length ? 'Book a place' : 'Ask about dates')}</a>
          <a className="pill pill-quiet pill-wide" href={path.courses(lang)}>{t(lang, 'All courses')}</a>
        </aside>
      </div>
      {c.faq?.length ? <Faq lang={lang} items={c.faq} /> : null}
      <section className="sec" data-row style={{ marginTop: 96 }}>
        <div className="sec-head row-head"><div><span className="kicker">{t(lang, 'Courses')}</span><h2 className="h2" style={{ marginTop: 12 }}>{t(lang, 'Other courses')}</h2></div>
          <div className="row-nav"><button className="round" type="button" data-dir="-1" aria-label={t(lang, 'Previous')}><svg className="i" style={{ transform: 'scaleX(-1)' }}><use href="#ow-arrow" /></svg></button><button className="round" type="button" data-dir="1" aria-label={t(lang, 'Next')}><svg className="i"><use href="#ow-arrow" /></svg></button></div></div>
        <div className="hscroll" tabIndex={0}>{others.map((x) => <CourseCard key={x.slug} lang={lang} c={x} />)}</div>
      </section>
    </Shell>
  );
}
