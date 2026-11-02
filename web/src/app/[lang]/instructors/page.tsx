import '@/styles/home.css';
import '@/styles/app.css';
import Shell from '@/components/Shell';
import { t } from '@/lib/content';
import { getCourses, getInstructors, getLegs } from '@/lib/db';
import { breadcrumbs, Crumbs, meta, ORG } from '@/lib/meta';
import Cover from '@/components/Cover';
import { personCard } from '@/lib/people';
import { path, type Lang } from '@/lib/site';

export const revalidate = 300;

export async function generateMetadata({ params }: PageProps<'/[lang]/instructors'>) {
  const lang = (await params).lang as Lang;
  return meta(lang, { title: t(lang, 'Instructors and skippers'), description: t(lang, 'The IYT instructors who teach Ocean Way courses and the skippers who lead our training passages: qualifications, seasons at sea and languages.'), pathFor: path.instructors });
}

/** Photos from our courses: instructors and skippers at work on board (Unsplash ids, l = landscape, p = portrait). */
const GALLERY: { photo_id: string; shape: 'l' | 'p'; caption: string }[] = [
  { photo_id: '1534447677768-be436bb09401', shape: 'l', caption: 'Night passages: the skipper plans the watches, you keep them.' },
  { photo_id: '1519801715040-6d1074715ca5', shape: 'p', caption: 'Your turn at the helm: the instructor hands over early and often.' },
  { photo_id: '1506929562872-bb421503ef21', shape: 'l', caption: 'Anchoring in a quiet bay: you pick the spot, the instructor checks it.' },
  { photo_id: '1630853239357-2300d9cd562f', shape: 'p', caption: 'Rigging and sails: shown once, then done by you.' },
  { photo_id: '1780335282813-db330424b1bd', shape: 'l', caption: 'Berthing in a busy harbour: you bring the boat in, the skipper stands by.' },
  { photo_id: '1518837695005-2083093ee35b', shape: 'p', caption: 'Reading the water: the skipper shows you where the wind is coming from.' },
  { photo_id: '1777880652269-ff1dd5e65fbb', shape: 'l', caption: 'At most four students, so everyone gets time on every job.' },
  { photo_id: '1533105079780-92b9be482077', shape: 'p', caption: "Ashore in the evening: the day's debrief often happens over dinner." },
];

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export default async function Instructors({ params }: PageProps<'/[lang]/instructors'>) {
  const lang = (await params).lang as Lang;
  const [people, courses, legs] = await Promise.all([getInstructors(lang), getCourses(lang), getLegs(lang)]);
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
      <Cover lang={lang} top={<Crumbs lang={lang} items={crumbs} current={t(lang, 'Instructors and skippers')} />}
        title={t(lang, 'The people on board with you')}
        lead={t(lang, 'Our instructors hold IYT instructor qualifications and teach at most four students at a time. Our skippers lead the training passages and sign your miles in the logbook.')}
        shots={GALLERY.map((g) => ({ ...g, caption: t(lang, g.caption) }))} />
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
