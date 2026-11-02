import '@/styles/home.css';
import '@/styles/app.css';
import Shell from '@/components/Shell';
import { t } from '@/lib/content';
import { getCourseDates, getCourses } from '@/lib/db';
import { CourseCard } from '@/components/Cards';
import { Schedule, scheduleYear } from '@/components/Schedule';
import { breadcrumbs, Crumbs, meta, ORG } from '@/lib/meta';
import { galleryHtml, mixShots } from '@/lib/render';
import { path, SITE, type Lang } from '@/lib/site';

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<'/[lang]/courses'>) {
  const lang = (await params).lang as Lang;
  return meta(lang, { title: t(lang, 'IYT sailing courses'), description: t(lang, 'All IYT sailing courses at Ocean Way, from the one-day VHF licence to Yachtmaster Ocean: what each one covers, how long it takes and what it costs.'), pathFor: path.courses });
}

export default async function Courses({ params }: PageProps<'/[lang]/courses'>) {
  const lang = (await params).lang as Lang;
  const courses = await getCourses(lang);
  const dates = (await Promise.all(courses.map((c) => getCourseDates(c.slug)))).flat();
  const year = scheduleYear(dates);
  const crumbs: [string, string][] = [[t(lang, 'Home'), path.home(lang)], [t(lang, 'Courses'), path.courses(lang)]];
  const ld = { '@context': 'https://schema.org', '@graph': [ORG, breadcrumbs(lang, crumbs), {
    '@type': 'ItemList', name: t(lang, 'IYT sailing courses'),
    itemListElement: courses.map((c, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE + path.courseItem(lang, c.slug),
      item: { '@type': 'Course', name: c.name, description: c.summary, provider: { '@id': `${SITE}/#org` },
        offers: { '@type': 'Offer', price: c.price_from_eur, priceCurrency: 'EUR', category: 'Paid' } } })),
  }] };
  return (
    <Shell lang={lang} section="courses" pathFor={path.courses} jsonld={ld}>
      <section className="ow-hero">
        <Crumbs lang={lang} items={crumbs} />
        <h1 className="display">{t(lang, 'From first crew to Yachtmaster Ocean')}</h1>
        <p className="lead">{t(lang, 'The IYT course ladder, from entry level up. Most practical courses are a week living aboard with an instructor and at most four students. Start where your experience is.')}</p>
      </section>
      <div dangerouslySetInnerHTML={{ __html: galleryHtml(lang, mixShots(courses.map((c) => c.gallery), courses.map((c) => c.photo_id))) }} />
      <section className="sch-sec" id="all">
        <h2 className="h2">{t(lang, 'All courses')}</h2>
        <p className="lead">{t(lang, 'Each card shows the level, who the course is for, how long it takes and the price per person. Open a course for its programme, requirements and every start date.')}</p>
        <div className="ow-grid">{courses.map((c) => <CourseCard key={c.slug} lang={lang} c={c} />)}</div>
      </section>
      <section className="sch-sec" id="schedule">
        <h2 className="h2">{t(lang, 'Course schedule {year}', { year })}</h2>
        <p className="lead">{t(lang, 'Every start date for the year. Most weeks aboard run Saturday to Saturday; the theory courses and exams are held in our classroom at Ece Marina, Fethiye. Tap a date to see it on the course page.')}</p>
        <Schedule lang={lang} year={year} courses={courses} dates={dates} />
        <p className="sch-key"><span><i className="sch-bar" /> {t(lang, 'Places free')}</span><span><i className="sch-bar is-full" /> {t(lang, 'Full')}</span><span><i className="sch-bar is-day" /> {t(lang, 'One-day course or exam')}</span></p>
      </section>
    </Shell>
  );
}
