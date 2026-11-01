import '@/styles/home.css';
import '@/styles/app.css';
import Shell from '@/components/Shell';
import { t } from '@/lib/content';
import { getCourses, getInstructors, getLegs } from '@/lib/db';
import { breadcrumbs, Crumbs, meta, ORG } from '@/lib/meta';
import { personCard } from '@/lib/people';
import { path, type Lang } from '@/lib/site';

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<'/[lang]/instructors'>) {
  const lang = (await params).lang as Lang;
  return meta(lang, { title: t(lang, 'Instructors and skippers'), description: t(lang, 'The IYT instructors who teach Ocean Way courses and the skippers who lead our training passages: qualifications, seasons at sea and languages.'), pathFor: path.instructors });
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export default async function Instructors({ params }: PageProps<'/[lang]/instructors'>) {
  const lang = (await params).lang as Lang;
  const [people, courses, legs] = await Promise.all([getInstructors(), getCourses(), getLegs()]);
  const courseName = Object.fromEntries(courses.map((c) => [c.slug, c.name]));
  const chips = (label: string, items: [string, string][]) => items.length
    ? `<div class="ow-person-chips"><span class="ow-person-role">${esc(label)}</span><div class="ow-chips">${items.map(([href, text]) => `<a href="${href}"><span class="chip">${esc(text)}</span></a>`).join('')}</div></div>` : '';
  const card = (p: (typeof people)[number]) => personCard(lang, p,
    chips(t(lang, 'Teaches'), p.courses.filter((s) => courseName[s]).map((s) => [path.courseItem(lang, s), courseName[s]]))
    + chips(t(lang, 'Routes'), p.legs.filter((l) => legs[l]).map((l) => {
      const st = legs[l].stops; return [path.passages(lang), `${t(lang, st[0].name)} – ${t(lang, st[st.length - 1].name)}`];
    })));
  const teach = people.filter((p) => p.role !== 'Skipper'), skip = people.filter((p) => p.role === 'Skipper');
  const crumbs: [string, string][] = [[t(lang, 'Home'), path.home(lang)], [t(lang, 'Instructors'), path.instructors(lang)]];
  const ld = { '@context': 'https://schema.org', '@graph': [ORG, breadcrumbs(lang, crumbs)] };
  return (
    <Shell lang={lang} section="instructors" pathFor={path.instructors} jsonld={ld}>
      <section className="ow-hero">
        <Crumbs lang={lang} items={crumbs} />
        <span className="kicker">{t(lang, 'Instructors and skippers')}</span>
        <h1 className="display">{t(lang, 'The people on board with you')}</h1>
        <p className="lead">{t(lang, 'Our instructors hold IYT instructor qualifications and teach at most four students at a time. Our skippers lead the training passages and sign your miles in the logbook.')}</p>
      </section>
      <section className="sec">
        <div className="sec-head"><span className="kicker">{t(lang, 'Courses')}</span><h2 className="h2">{t(lang, 'Instructors')}</h2></div>
        <div className="ow-people ow-people-wide" dangerouslySetInnerHTML={{ __html: teach.map(card).join('') }} />
      </section>
      <section className="sec">
        <div className="sec-head"><span className="kicker">{t(lang, 'Passages')}</span><h2 className="h2">{t(lang, 'Skippers')}</h2></div>
        <div className="ow-people ow-people-wide" dangerouslySetInnerHTML={{ __html: skip.map(card).join('') }} />
      </section>
    </Shell>
  );
}
