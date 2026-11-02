import fs from 'node:fs';
import nodePath from 'node:path';
import type { Metadata } from 'next';
import { LANGS, OG_LOCALE, SITE, type Lang } from './site';

/** One page of the prototype, in one language (see scripts/extract_content.py). */
export type PageContent = {
  page: string;
  lang: Lang;
  title: string;
  description: string | null;
  image: string | null;
  robots: string | null;
  jsonld: string[];
  main: string;
  tail: string;
  scripts: string[];
  styles: string;
};

const ROOT = nodePath.join(process.cwd(), 'content');
const read = (rel: string) => JSON.parse(fs.readFileSync(nodePath.join(ROOT, rel), 'utf8'));

export function loadPage(page: string, lang: Lang): PageContent {
  return read(`pages/${page}.${lang}.json`) as PageContent;
}

const dicts: Partial<Record<Lang, Record<string, string>>> = {};
function dict(lang: Lang): Record<string, string> {
  if (lang === 'en') return {};
  if (!dicts[lang]) {
    // Prototype dictionaries first, then strings written for the app's own pages (content/i18n-app).
    const app = nodePath.join(ROOT, 'i18n-app', `${lang}.json`);
    dicts[lang] = { ...read(`i18n/${lang}.json`), ...(fs.existsSync(app) ? JSON.parse(fs.readFileSync(app, 'utf8')) : {}) };
  }
  return dicts[lang]!;
}

/** Translate an English UI string (the prototype's dictionaries are keyed by English text). */
export function t(lang: Lang, en: string, vars: Record<string, string | number> = {}): string {
  const s = dict(lang)[en] ?? en;
  return s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}
export const hasT = (lang: Lang, en: string) => lang === 'en' || en in dict(lang);

/** Metadata for a page: title, description, canonical, hreflang to all languages, Open Graph. */
export function pageMetadata(c: PageContent, pathFor: (l: Lang) => string): Metadata {
  const languages: Record<string, string> = Object.fromEntries(LANGS.map((l) => [l, SITE + pathFor(l)]));
  languages['x-default'] = SITE + pathFor('en');
  const robots = c.robots?.includes('noindex') ? { index: false, follow: !c.robots.includes('nofollow') } : undefined;
  return {
    title: c.title,
    description: c.description ?? undefined,
    alternates: { canonical: SITE + pathFor(c.lang), languages },
    openGraph: {
      type: 'website', siteName: 'Ocean Way', title: c.title, description: c.description ?? undefined,
      url: SITE + pathFor(c.lang), images: c.image ? [c.image] : undefined, locale: OG_LOCALE[c.lang],
    },
    twitter: { card: 'summary_large_image' },
    robots,
  };
}
