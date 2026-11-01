import type { Metadata } from 'next';
import { t } from './content';
import { LANGS, OG_LOCALE, SITE, type Lang } from './site';

/** Share image for pages without their own photo (the home page's Open Graph image). */
export const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1563296291-14f26f10c20f?w=1200&h=630&fit=crop&q=80';

/** Shorten text for a meta description without cutting a word: whole sentences if they fit, else whole words and "…". */
export function clip(text: string, max = 158): string {
  const s = text.replace(/\s+/g, ' ').trim();
  if (s.length <= max) return s;
  const sentences = s.slice(0, max + 1).match(/^.*[.!?](?=\s)/);
  if (sentences && sentences[0].length >= 70) return sentences[0];
  const cut = s.slice(0, max).replace(/\s+\S*$/, '').replace(/[\s,;:–—-]+$/, '');
  return `${cut}…`;
}

/** Metadata for the app's own pages: translated title and description, canonical, hreflang, Open Graph. */
export function meta(lang: Lang, o: { title: string; description: string; pathFor: (l: Lang) => string; image?: string }): Metadata {
  const languages: Record<string, string> = Object.fromEntries(LANGS.map((l) => [l, SITE + o.pathFor(l)]));
  languages['x-default'] = SITE + o.pathFor('en');
  const title = `${o.title} · Ocean Way`;
  const description = clip(o.description);
  return {
    title,
    description,
    alternates: { canonical: SITE + o.pathFor(lang), languages },
    openGraph: { type: 'website', siteName: 'Ocean Way', title, description, url: SITE + o.pathFor(lang), images: [o.image ?? DEFAULT_IMAGE], locale: OG_LOCALE[lang] },
    twitter: { card: 'summary_large_image' },
  };
}

/** The same organisation entity as the prototype pages, so every page describes Ocean Way the same way. */
export const ORG = { '@type': 'Organization', '@id': `${SITE}/#org`, name: 'Ocean Way', url: `${SITE}/en`, logo: `${SITE}/logo.png`, sameAs: ['https://t.me/rycrentals'] };

export function breadcrumbs(lang: Lang, items: [string, string][]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, href], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE + href })),
  };
}

/** Visible breadcrumbs matching the BreadcrumbList. The last item is the current page. */
/** Breadcrumb line. `current` replaces the last item's label, so the trail doubles as the page kicker ("Home / Our fleet"). */
export function Crumbs({ lang, items, current }: { lang: Lang; items: [string, string][]; current?: React.ReactNode }) {
  return (
    <nav className="crumbs" aria-label={t(lang, 'Breadcrumb')}>
      <ol>
        {items.map(([name, href], i) => (
          <li key={href} aria-current={i === items.length - 1 ? 'page' : undefined}>
            {i === items.length - 1 ? (current ?? name) : <a href={href}>{name}</a>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Unsplash photo by id, or a local file (fleet photos in /public start with '/'). */
export const photo = (id: string, w = 900) => id.startsWith('/') ? id : `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`;
