import { getArticles, getTopics, readTime } from './articles';
import { photo } from './meta';
import type { Lang } from './site';

export type TheoryArticle = { slug: string; title: string; img: string; alt: string; read: string };
export type TheoryTopic = { id: string; name: string; articles: TheoryArticle[] };

/** Theory topics with their articles (title, photo, reading time), in the order of the theory hub page. */
export async function theoryTopics(lang: Lang): Promise<TheoryTopic[]> {
  const [arts, topics] = await Promise.all([getArticles(lang), getTopics(lang)]);
  return topics
    .map((tp) => ({
      id: tp.key, name: tp.name,
      articles: arts.filter((a) => a.topic === tp.key)
        .map((a) => ({ slug: a.slug, title: a.h1, img: photo(a.photo_id), alt: a.photo_alt, read: readTime(lang, a.read_minutes) })),
    }))
    .filter((tp) => tp.articles.length);
}

/** The course's articles, grouped by topic. */
export async function theoryFor(lang: Lang, slugs: string[]): Promise<TheoryTopic[]> {
  const want = new Set(slugs);
  return (await theoryTopics(lang))
    .map((tp) => ({ ...tp, articles: tp.articles.filter((a) => want.has(a.slug)) }))
    .filter((tp) => tp.articles.length);
}

/** A course's articles: the first three in the course's list as "start with these" cards when it has more than
 *  four, the rest grouped by topic. */
export async function courseTheory(lang: Lang, slugs: string[]) {
  const all = (await theoryTopics(lang)).flatMap((tp) => tp.articles.map((a) => ({ ...a, topic: tp.name })));
  const found = slugs.filter((s) => all.some((a) => a.slug === s));
  const top = found.length > 4 ? found.slice(0, 3).map((s) => all.find((a) => a.slug === s)!) : [];
  return { top, rest: await theoryFor(lang, found.slice(top.length)) };
}

/** A small Unsplash thumbnail at the given width. */
export const thumb = (src: string, w: number) => src.replace(/([?&])w=\d+/, `$1w=${w}`);
