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

/** The first three of a course's theory articles, with their topic. */
export async function courseTheory(lang: Lang, slugs: string[]) {
  const all = (await theoryTopics(lang)).flatMap((tp) => tp.articles.map((a) => ({ ...a, topic: tp.name })));
  return slugs.map((s) => all.find((a) => a.slug === s)).filter((a) => a !== undefined).slice(0, 3);
}
