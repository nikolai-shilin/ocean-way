import '@/styles/home.css';
import '@/styles/passages.css';
import HtmlPage from '@/components/HtmlPage';
import { articleCard, getArticles } from '@/lib/articles';
import { pageMetadata, t } from '@/lib/content';
import { getCourseDates, getCourses, getLegs, getPassages, getYachts } from '@/lib/db';
import { PASSAGES_JS, passageRow } from '@/lib/passages';
import { coverHtml, fleetCards, replaceInner, type CoverShot } from '@/lib/render';
import { path, type Lang } from '@/lib/site';
import { templatePage } from '@/lib/templates';

export const revalidate = 60;

export async function generateMetadata({ params }: PageProps<'/[lang]'>) {
  const { lang } = await params;
  return pageMetadata(templatePage('home', lang as Lang), path.home);
}

export default async function Home({ params }: PageProps<'/[lang]'>) {
  const lang = (await params).lang as Lang;
  const content = templatePage('home', lang);
  const [passages, yachts, courses, legs] = await Promise.all([getPassages(), getYachts(lang), getCourses(lang), getLegs(lang)]);
  const courseDates = (await Promise.all(courses.map((c) => getCourseDates(c.slug)))).flat();
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = [...courseDates, ...passages].filter((d) => d.starts_on >= today).length;
  let main = content.main;
  // Hero line and "in numbers": facts a visitor can check against the rest of the site, counted from the database.
  main = main.replace(/<p class="lead">[^<]*<\/p>/, `<p class="lead">${t(lang, 'Courses from your first knot to Yachtmaster in Greece, Croatia and Türkiye, on yachts we own and look after ourselves. Every route planned day by day.')}</p>`);
  // Hero and photo gallery become one cover block: the hero text on white strips over the photo row (cover.css).
  main = main.replace(/<section class="hero">([\s\S]*?)<\/section>\s*<div class="gallery-wrap"[\s\S]*?<div class="gallery"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/, (whole, hero: string, figs: string) => {
    const pick = (re: RegExp) => re.exec(hero)?.[1] ?? '';
    const shots: CoverShot[] = [...figs.matchAll(/<figure class="g-([lp])"><div class="photo"><img src="([^"]+)" alt="([^"]*)"[^>]*><\/div><figcaption[^>]*>([^<]*)<\/figcaption><\/figure>/g)]
      .map(([, shape, src, alt, caption]) => ({ shape: shape as 'l' | 'p', src: unesc(src).replace(/w=1200/, 'w=1400'), alt: unesc(alt), caption: unesc(caption) }));
    if (!shots.length) return whole;
    return coverHtml(lang, { top: `<span class="kicker">${pick(/<span class="kicker">([^<]*)<\/span>/)}</span>`, title: pick(/<h1 class="display">([^<]*)<\/h1>/), lead: pick(/<p class="lead">([^<]*)<\/p>/) }, shots);
  });
  const fig = (old: number, n: number, label?: string) => {
    main = main.replace(new RegExp(`<div class="fig"><b>${old}</b><span class="meta">([^<]*)</span></div>`), (_, l) => `<div class="fig"><b>${n}</b><span class="meta">${label ?? l}</span></div>`);
  };
  fig(82, upcoming, t(lang, 'upcoming start dates'));
  fig(14, courses.length, t(lang, 'IYT courses to choose from'));
  fig(5, yachts.length);
  // Passages: the prototype's table becomes a sideways row of cards under the map.
  main = main.replace(/<div class="tbl-wrap">\s*<table class="tbl stack passages">[\s\S]*?<\/table>\s*<\/div>/, () => passageRow(lang, passages, legs));
  main = replaceInner(main, /<section class="sec" id="fleet"[\s\S]*?<div class="hscroll"[^>]*>/, '</div>\n    </section>', fleetCards(lang, yachts));
  // Theory row: every published article, in reading order.
  main = replaceInner(main, /<section class="sec" id="theory"[\s\S]*?<div class="hscroll"[^>]*>/, '</div>\n    </section>', (await getArticles(lang)).map((a) => articleCard(lang, a, 'card')).join(''));
  // Course cards → course pages (names are the official IYT names, the same in every language; the "IYT " prefix is optional so the database and the page text can be renamed separately).
  for (const c of courses) {
    const name = `(?:IYT )?${c.name.replace(/^IYT /, '')}`;
    main = main.replace(new RegExp(`<a class="card" href="[^"]*">(\\s*<div class="photo">(?:(?!</a>)[\\s\\S])*?<span class="card-title">${name}</span>)`), `<a class="card" href="${path.courseItem(lang, c.slug)}">$1`);
  }
  // The prototype's arrow script also drives the cover row.
  const scripts = content.scripts.map((js) => js.replace("'.gallery, .hscroll'", "'.gallery, .hscroll, .cv-row'"));
  return <HtmlPage pathFor={path.home} content={content} main={main} scripts={[...scripts, PASSAGES_JS]} />;
}

const unesc = (s: string) => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
