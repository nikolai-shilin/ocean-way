export const LANGS = ['en', 'ru', 'de', 'es'] as const;
export type Lang = (typeof LANGS)[number];
export const isLang = (x: string): x is Lang => (LANGS as readonly string[]).includes(x);

/** Public URL of the site, used for canonical links, hreflang, sitemap and structured data. */
export const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://ocean-way.vercel.app').replace(/\/$/, '');

export const OG_LOCALE: Record<Lang, string> = { en: 'en_GB', ru: 'ru_RU', de: 'de_DE', es: 'es_ES' };

export const path = {
  home: (l: Lang) => `/${l}`,
  course: (l: Lang) => `/${l}/courses/bareboat-skipper`,
  theory: (l: Lang) => `/${l}/theory`,
  article: (l: Lang, slug: string) => `/${l}/theory/${slug}`,
  booking: (l: Lang) => `/${l}/booking`,
  courses: (l: Lang) => `/${l}/courses`,
  courseItem: (l: Lang, slug: string) => `/${l}/courses/${slug}`,
  passages: (l: Lang) => `/${l}/passages`,
  passage: (l: Lang, slug: string) => `/${l}/passages/${slug}`,
  fleet: (l: Lang) => `/${l}/fleet`,
  boat: (l: Lang, slug: string) => `/${l}/fleet/${slug}`,
  prices: (l: Lang) => `/${l}/prices`,
};
