import { cache } from 'react';
import { hasT, t, type PageContent } from './content';
import { english, getInstructors, live, localize, type Translations } from './db';
import { photo } from './meta';
import { SITE, path, type Lang } from './site';
import { theoryScript } from './templates';

/** Theory articles from the database (articles, article_translations, theory_topics; loaded by
 *  scripts/import_theory.py), and the HTML of the hub and article pages, the same markup as the prototype. */

export type Topic = { key: string; sort: number; name: string; lead: string; translations?: Translations };
export type Article = {
  slug: string; topic: string; sort: number; read_minutes: number; photo_id: string; course: string | null;
  course_slug: string | null; author: string | null; published_on: string; updated_on: string;
  title: string; h1: string; lead: string; description: string; level: string; photo_alt: string; summary: string[]; toc: [string, string][];
};

const TEXT = 'title, h1, lead, description, level, photo_alt, summary, toc';

/** Published articles in reading order, with their text in this language (no body). One query per page render. */
export const getArticles = cache(async (lang: Lang): Promise<Article[]> => {
  const { data, error } = await live().from('articles')
    .select(`slug, topic, sort, read_minutes, photo_id, course, course_slug, author, published_on, updated_on, article_translations!inner(${TEXT})`)
    .eq('article_translations.lang', lang).order('sort');
  if (error) throw error;
  return (data as (Omit<Article, keyof ArticleText> & { article_translations: ArticleText[] })[])
    .map(({ article_translations: [tr], ...a }) => ({ ...a, ...tr }));
});
type ArticleText = Pick<Article, 'title' | 'h1' | 'lead' | 'description' | 'level' | 'photo_alt' | 'summary' | 'toc'>;

export const getTopics = cache(async (lang: Lang): Promise<Topic[]> => {
  const { data, error } = await live().from('theory_topics').select('key, sort, name, lead, translations').order('sort');
  if (error) throw error;
  return (data as Topic[]).map((x) => localize(x, lang));
});

async function getBody(slug: string, lang: Lang): Promise<string> {
  const { data, error } = await live().from('article_translations').select('body_html').eq('slug', slug).eq('lang', lang).single();
  if (error) throw error;
  return data.body_html as string;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const MO = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const LOCALE: Record<Lang, string> = { en: 'en-GB', ru: 'ru-RU', de: 'de-DE', es: 'es-ES' };

/** "Updated 1 Nov 2026" in the page language (the dictionary first, so it reads as before). */
function updated(lang: Lang, iso: string) {
  const d = new Date(iso + 'T00:00:00Z');
  const en = `Updated ${d.getUTCDate()} ${MO[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  if (hasT(lang, en)) return t(lang, en);
  return `${t(lang, 'Updated')} ${new Intl.DateTimeFormat(LOCALE[lang], { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(d)}`;
}
export const readTime = (lang: Lang, n: number) => t(lang, `${n} min read`);

/** Article card: the theory hub (th-card), "Keep reading" and the home page row. */
export function articleCard(lang: Lang, a: Article, cls = 'card th-card') {
  return `<a class="${cls}" href="${path.article(lang, a.slug)}"><div class="photo"><div class="clip"><img src="${photo(a.photo_id)}" alt="${esc(a.photo_alt)}" loading="lazy"></div></div>`
    + `<div class="card-body"><span class="lvl">${esc(a.level)}</span><span class="card-title">${esc(a.h1)}</span><span class="card-meta">${esc(a.description)}</span>`
    + `<div class="facts"><span class="fact"><svg class="i"><use href="#ow-read"/></svg>${esc(readTime(lang, a.read_minutes))}</span></div></div></a>`;
}

const crumbs = (lang: Lang, items: string) =>
  `<nav class="crumbs" aria-label="${esc(t(lang, 'Breadcrumb'))}"><ol><li><a href="${path.home(lang)}">${esc(t(lang, 'Home'))}</a></li>${items}</ol></nav>`;

const ORG = (lang: Lang) => ({ '@type': 'Organization', '@id': `${SITE}/#org`, name: 'Ocean Way', url: SITE + path.home(lang) });
const crumbLd = (items: [string, string][]) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, href], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE + href })),
});

/** A theory page for HtmlPage, with the script all theory pages share. */
function shell(lang: Lang, o: { page: string; title: string; description: string; image: string; ld: object[]; main: string }): PageContent {
  return {
    lang, page: o.page, title: o.title, description: o.description, image: o.image, robots: null, main: o.main, tail: '',
    jsonld: [JSON.stringify({ '@context': 'https://schema.org', '@graph': o.ld }, null, 1)],
    scripts: [theoryScript()], styles: 'theory',
  };
}

/** The theory hub: topics, each with its articles. */
export async function hubPage(lang: Lang): Promise<PageContent> {
  const [arts, topics] = await Promise.all([getArticles(lang), getTopics(lang)]);
  const by = (k: string) => arts.filter((a) => a.topic === k);
  const chips = topics.filter((tp) => by(tp.key).length).map((tp) => `<a href="#${tp.key}"><span class="chip">${esc(tp.name)}</span></a>`).join('');
  const secs = topics.filter((tp) => by(tp.key).length).map((tp) => {
    const n = by(tp.key).length;
    return `
    <section class="sec th-topic" id="${tp.key}">
      <div class="th-topic-head"><span class="kicker">${esc(t(lang, `${n} ${n === 1 ? 'article' : 'articles'}`))}</span><h2 class="h2">${esc(tp.name)}</h2><p class="sec-lead">${esc(tp.lead)}</p></div>
      <div class="th-grid">${by(tp.key).map((a) => articleCard(lang, a)).join('')}</div>
    </section>`;
  }).join('');
  const h1 = t(lang, 'Sailing theory, in plain words');
  const main = `
    <section class="th-hero">
      ${crumbs(lang, `<li aria-current="page">${esc(t(lang, 'Theory'))}</li>`)}
      <h1 class="display">${esc(h1)}</h1>
      <p class="lead">${esc(t(lang, 'What our instructors teach on board, written down: how a yacht sails, who gives way, how to moor, anchor, read the weather and use the radio. Read it before a course, look it up after one.'))}</p>
      <nav class="topics" aria-label="${esc(t(lang, 'Topics'))}">${chips}</nav>
    </section>
${secs}
    <section class="band tgband" style="margin-top:96px">
      <div><span class="kicker">${esc(t(lang, 'On the water'))}</span><h2 class="h2" style="margin:12px 0 12px">${esc(t(lang, 'Theory sticks when you practise it'))}</h2><p>${esc(t(lang, 'Every article ends with where you practise it. Most of it is part of the Bareboat Skipper week: a skipper\'s licence in seven days aboard.'))}</p></div>
      <div><a class="pill pill-primary" href="${path.courseItem(lang, 'bareboat-skipper')}">${esc(t(lang, 'See the IYT Bareboat Skipper course'))}</a></div>
    </section>
  `;
  const ld = [ORG(lang), crumbLd([[t(lang, 'Home'), path.home(lang)], [t(lang, 'Theory'), path.theory(lang)]]), {
    '@type': 'CollectionPage', name: h1, url: SITE + path.theory(lang), inLanguage: lang,
    mainEntity: { '@type': 'ItemList', itemListElement: arts.map((a, i) => ({ '@type': 'ListItem', position: i + 1, url: SITE + path.article(lang, a.slug), name: a.h1 })) },
  }];
  return shell(lang, {
    page: 'theory', title: t(lang, 'Sailing Theory: Rules, Mooring, Weather, Radio · Ocean Way'),
    description: t(lang, 'Free sailing theory from Ocean Way instructors: points of sail, knots, tacking, reefing, right of way, buoys, mooring, anchoring, tides, weather, navigation, VHF and safety.'),
    image: photo(arts[0]?.photo_id ?? '1540946485063-a40da27545f8', 1200), ld, main,
  });
}

/** One article, or null when there is no published article with this slug. */
export async function articlePage(lang: Lang, slug: string): Promise<PageContent | null> {
  const [arts, topics, people] = await Promise.all([getArticles(lang), getTopics(lang), getInstructors(lang)]);
  const a = arts.find((x) => x.slug === slug);
  if (!a) return null;
  const body = await getBody(slug, lang);
  const topic = topics.find((tp) => tp.key === a.topic);
  const author = people.find((p) => p.slug === a.author);
  const toc = a.toc.map(([id, label]) => `<li><a href="#${id}">${esc(label)}</a></li>`).join('');
  const courseBox = a.course ? `<div class="band art-course"><span class="kicker">${esc(t(lang, 'Practise it on'))}</span><div class="card-title">${esc(a.course)}</div>`
    + `<p>${esc(t(lang, 'Learn this on the water with an instructor, in a week living aboard.'))}</p>`
    + `<a class="pill pill-primary pill-wide pill-sm" href="${a.course_slug ? path.courseItem(lang, a.course_slug) : path.courses(lang)}">${esc(t(lang, a.course_slug ? 'See the course' : 'See the courses'))}</a></div>` : '';
  const related = [...arts.filter((x) => x.slug !== slug && x.topic === a.topic), ...arts.filter((x) => x.slug !== slug && x.topic !== a.topic)].slice(0, 6);
  const name = author ? t(lang, author.name) : '';
  const byline = (author ? `<a class="author" href="${path.instructors(lang)}#${author.slug}"><img src="${author.photo_id}" alt="${esc(name)}" width="28" height="28"><span class="meta" style="color:var(--ink)">${esc(name)}</span></a>` : '')
    + `<span class="meta">${esc(updated(lang, a.updated_on))}</span><span class="meta">${esc(readTime(lang, a.read_minutes))}</span><span class="lvl">${esc(a.level)}</span>`;
  const onPage = t(lang, 'On this page');
  const main = `
    <article>
      <header class="art-head">
        ${crumbs(lang, `<li><a href="${path.theory(lang)}">${esc(t(lang, 'Theory'))}</a></li><li aria-current="page">${esc(topic?.name ?? '')}</li>`)}
        <h1 class="display">${esc(a.h1)}</h1>
        <p class="lead">${esc(a.lead)}</p>
        <div class="byline">${byline}</div>
      </header>
      <div class="art-grid">
        <div class="art-body">
          <details class="art-mobile-toc band"><summary>${esc(onPage)}<svg class="i"><use href="#ow-chevron"/></svg></summary><ol class="toc-list">${toc}</ol></details>
          <div class="band summary"><span class="kicker">${esc(t(lang, 'In short'))}</span><ul>${a.summary.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div>
          ${body}
          <div class="art-mobile-course">${courseBox}</div>
        </div>
        <aside class="art-side" aria-label="${esc(onPage)}"><span class="kicker">${esc(onPage)}</span><ol class="toc-list">${toc}</ol>${courseBox}</aside>
      </div>
    </article>
    <section class="sec" style="margin-top:96px">
      <div class="sec-head row-head"><div><span class="kicker">${esc(t(lang, 'Theory'))}</span><h2 class="h2" style="margin-top:12px">${esc(t(lang, 'Keep reading'))}</h2></div><div class="row-nav"><a class="pill pill-quiet" href="${path.theory(lang)}">${esc(t(lang, 'All theory'))}</a></div></div>
      <div class="hscroll" tabindex="0" aria-label="${esc(t(lang, 'More theory'))}">${related.map((x) => articleCard(lang, x, 'card')).join('')}</div>
    </section>
  `;
  const url = SITE + path.article(lang, slug);
  const who = author && english(author);
  const ld = [ORG(lang), crumbLd([[t(lang, 'Home'), path.home(lang)], [t(lang, 'Theory'), path.theory(lang)], [a.h1, path.article(lang, slug)]]), {
    '@type': 'Article', headline: a.h1, description: a.description, image: photo(a.photo_id, 1200), inLanguage: lang,
    datePublished: a.published_on, dateModified: a.updated_on,
    ...(author && who ? { author: { '@type': 'Person', '@id': `${SITE}/#${author.slug}`, name, jobTitle: [who.role, who.qualification].filter(Boolean).join(', '), image: SITE + author.photo_id, url: `${SITE}${path.instructors(lang)}#${author.slug}`, worksFor: { '@id': `${SITE}/#org` } } } : {}),
    publisher: { '@id': `${SITE}/#org` }, mainEntityOfPage: url, educationalLevel: a.level, about: topic?.name,
    timeRequired: `PT${a.read_minutes}M`, isPartOf: { '@type': 'CollectionPage', url: SITE + path.theory(lang) },
  }];
  return shell(lang, { page: `theory-${slug}`, title: `${a.title} · Ocean Way`, description: a.description, image: photo(a.photo_id, 1200), ld, main });
}
