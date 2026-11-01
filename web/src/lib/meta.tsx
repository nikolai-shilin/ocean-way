import type { Metadata } from 'next';
import { t } from './content';
import { LANGS, OG_LOCALE, SITE, type Lang } from './site';

/** Metadata for the app's own pages: translated title and description, canonical, hreflang, Open Graph. */
export function meta(lang: Lang, o: { title: string; description: string; pathFor: (l: Lang) => string; image?: string }): Metadata {
  const languages: Record<string, string> = Object.fromEntries(LANGS.map((l) => [l, SITE + o.pathFor(l)]));
  languages['x-default'] = SITE + o.pathFor('en');
  const title = `${o.title} · Ocean Way`;
  return {
    title,
    description: o.description,
    alternates: { canonical: SITE + o.pathFor(lang), languages },
    openGraph: { type: 'website', siteName: 'Ocean Way', title, description: o.description, url: SITE + o.pathFor(lang), images: o.image ? [o.image] : undefined, locale: OG_LOCALE[lang] },
    twitter: { card: 'summary_large_image' },
  };
}

export const ORG = { '@type': 'Organization', '@id': `${SITE}/#org`, name: 'Ocean Way', url: `${SITE}/en` };

export function breadcrumbs(lang: Lang, items: [string, string][]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, href], i) => ({ '@type': 'ListItem', position: i + 1, name, item: SITE + href })),
  };
}

/** Visible breadcrumbs matching the BreadcrumbList. The last item is the current page. */
export function Crumbs({ lang, items }: { lang: Lang; items: [string, string][] }) {
  return (
    <nav className="crumbs" aria-label={t(lang, 'Breadcrumb')}>
      <ol>
        {items.map(([name, href], i) => (
          <li key={href} aria-current={i === items.length - 1 ? 'page' : undefined}>
            {i === items.length - 1 ? name : <a href={href}>{name}</a>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export const photo = (id: string, w = 900) => `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`;
