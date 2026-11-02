import { loadPage } from './content';
import type { Lang } from './site';

export type TheoryArticle = { slug: string; title: string; img: string; alt: string; read: string };
export type TheoryTopic = { id: string; name: string; articles: TheoryArticle[] };

const cache: Partial<Record<Lang, TheoryTopic[]>> = {};

/** Theory topics with their articles (short title, photo, reading time), in the order of the theory hub page. */
export function theoryTopics(lang: Lang): TheoryTopic[] {
  if (cache[lang]) return cache[lang]!;
  const main = loadPage('theory', lang).main;
  const topics: TheoryTopic[] = [];
  for (const part of main.split('<section class="sec th-topic"').slice(1)) {
    const id = part.match(/^\s*id="([\w-]+)"/)?.[1] ?? '';
    const name = part.match(/<h2 class="h2">([^<]+)<\/h2>/)?.[1] ?? '';
    const articles: TheoryArticle[] = [];
    for (const card of part.split('<a class="card th-card"').slice(1)) {
      const slug = card.match(/href="[^"]*\/theory\/([\w-]+)"/)?.[1];
      if (!slug) continue;
      articles.push({
        slug,
        title: card.match(/<span class="card-title">([^<]+)<\/span>/)?.[1] ?? slug,
        img: card.match(/<img src="([^"]+)"/)?.[1] ?? '',
        alt: card.match(/<img [^>]*alt="([^"]*)"/)?.[1] ?? '',
        read: card.match(/#ow-read"\/><\/svg>([^<]+)<\/span>/)?.[1] ?? '',
      });
    }
    topics.push({ id, name, articles });
  }
  return (cache[lang] = topics);
}

/** The course's articles, grouped by topic. */
export function theoryFor(lang: Lang, slugs: string[]): TheoryTopic[] {
  const want = new Set(slugs);
  return theoryTopics(lang)
    .map((tp) => ({ ...tp, articles: tp.articles.filter((a) => want.has(a.slug)) }))
    .filter((tp) => tp.articles.length);
}

/** A course's articles: the first three in the course's list as "start with these" cards when it has more than
 *  four, the rest grouped by topic. */
export function courseTheory(lang: Lang, slugs: string[]) {
  const all = theoryTopics(lang).flatMap((tp) => tp.articles.map((a) => ({ ...a, topic: tp.name })));
  const found = slugs.filter((s) => all.some((a) => a.slug === s));
  const top = found.length > 4 ? found.slice(0, 3).map((s) => all.find((a) => a.slug === s)!) : [];
  return { top, rest: theoryFor(lang, found.slice(top.length)) };
}

/** A small Unsplash thumbnail at the given width. */
export const thumb = (src: string, w: number) => src.replace(/([?&])w=\d+/, `$1w=${w}`);
