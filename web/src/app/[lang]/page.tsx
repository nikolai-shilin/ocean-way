import '@/styles/home.css';
import ProtoPage from '@/components/ProtoPage';
import { loadPage, pageMetadata, t } from '@/lib/content';
import { getCourseDates, getCourses, getPassages, getYachts } from '@/lib/db';
import { fleetCards, passagesRows, replaceInner } from '@/lib/render';
import { path, type Lang } from '@/lib/site';

export const revalidate = 60;

export async function generateMetadata({ params }: PageProps<'/[lang]'>) {
  const { lang } = await params;
  return pageMetadata(loadPage('home', lang as Lang), path.home);
}

export default async function Home({ params }: PageProps<'/[lang]'>) {
  const lang = (await params).lang as Lang;
  const content = loadPage('home', lang);
  const [passages, yachts, courses] = await Promise.all([getPassages(), getYachts(lang), getCourses(lang)]);
  const courseDates = (await Promise.all(courses.map((c) => getCourseDates(c.slug)))).flat();
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = [...courseDates, ...passages].filter((d) => d.starts_on >= today).length;
  let main = content.main;
  // Hero line and "in numbers": facts a visitor can check against the rest of the site, counted from the database.
  main = main.replace(/<p class="lead">[^<]*<\/p>/, `<p class="lead">${t(lang, 'Courses from your first knot to Yachtmaster in Greece, Croatia and Türkiye, on yachts we own and look after ourselves. Every route planned day by day.')}</p>`);
  const fig = (old: number, n: number, label?: string) => {
    main = main.replace(new RegExp(`<div class="fig"><b>${old}</b><span class="meta">([^<]*)</span></div>`), (_, l) => `<div class="fig"><b>${n}</b><span class="meta">${label ?? l}</span></div>`);
  };
  fig(82, upcoming, t(lang, 'upcoming start dates'));
  fig(14, courses.length, t(lang, 'IYT courses to choose from'));
  fig(5, yachts.length);
  main = replaceInner(main, /<table class="tbl stack passages">[\s\S]*?<tbody>/, '</tbody>', passagesRows(lang, passages));
  main = replaceInner(main, /<section class="sec" id="fleet"[\s\S]*?<div class="hscroll"[^>]*>/, '</div>\n    </section>', fleetCards(lang, yachts));
  // Course cards → course pages (names are the official IYT names, the same in every language; the "IYT " prefix is optional so the database and the page text can be renamed separately).
  for (const c of courses) {
    const name = `(?:IYT )?${c.name.replace(/^IYT /, '')}`;
    main = main.replace(new RegExp(`<a class="card" href="[^"]*">(\\s*<div class="photo">(?:(?!</a>)[\\s\\S])*?<span class="card-title">${name}</span>)`), `<a class="card" href="${path.courseItem(lang, c.slug)}">$1`);
  }
  return <ProtoPage content={content} main={main} />;
}
