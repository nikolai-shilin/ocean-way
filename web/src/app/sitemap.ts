import type { MetadataRoute } from 'next';
import { index } from '@/lib/content';
import { getCourses, getPassages, getYachts, passageSlug } from '@/lib/db';
import { LANGS, SITE, path, type Lang } from '@/lib/site';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [courses, passages, yachts] = await Promise.all([getCourses(), getPassages(), getYachts()]);
  const routes: ((l: Lang) => string)[] = [
    path.home, path.courses, ...courses.map((c) => (l: Lang) => path.courseItem(l, c.slug)),
    path.passages, ...passages.map((p) => (l: Lang) => path.passage(l, passageSlug(p))),
    path.fleet, ...yachts.map((y) => (l: Lang) => path.boat(l, y.slug)),
    path.prices,
    path.theory, ...index.slugs.map((s) => (l: Lang) => path.article(l, s)),
  ];
  return routes.flatMap((r) => LANGS.map((l) => ({
    url: SITE + r(l),
    lastModified: new Date('2026-11-01'),
    alternates: { languages: Object.fromEntries(LANGS.map((x) => [x, SITE + r(x)])) },
  })));
}
