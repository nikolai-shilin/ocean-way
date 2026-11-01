import '@/styles/chrome.css';
import Script from 'next/script';
import { Carlito, Merriweather } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { notFound } from 'next/navigation';
import { LANGS, SITE, isLang } from '@/lib/site';

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}
export const dynamicParams = false;

// The icon files live in src/app (one set for every language); pages inherit these links.
export const metadata = {
  // Relative image addresses in metadata (fleet photos in /public) resolve against the public site URL.
  metadataBase: new URL(SITE),
  // ?v= changes the address so browsers that cached the old Next.js icon fetch the new one.
  icons: { icon: [{ url: '/icon.svg?v=2', type: 'image/svg+xml' }], shortcut: [{ url: '/favicon.ico?v=2' }], apple: [{ url: '/apple-icon.png?v=2', sizes: '180x180' }] },
};

// Self-hosted fonts (no render-blocking request to Google, preloaded, with a size-matched fallback while they load).
// Weights are the ones the pages use: Carlito 400/700, Merriweather Light for titles, and Carlito italic for the few <em>
// in theory articles (same family name, not preloaded). Only Latin is preloaded; Cyrillic and other ranges are still in
// the font CSS and load when a page needs them.
const sans = Carlito({ weight: ['400', '700'], style: 'normal', subsets: ['latin'], variable: '--ow-sans', display: 'swap' });
const sansItalic = Carlito({ weight: '400', style: 'italic', subsets: ['latin'], variable: '--ow-sans-italic', display: 'swap', preload: false });
const title = Merriweather({ weight: '300', style: 'normal', subsets: ['latin'], variable: '--ow-title', display: 'swap' });

export default async function LangLayout({ children, params }: LayoutProps<'/[lang]'>) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return (
    // suppressHydrationWarning: the head script adds the ow-sk class before React hydrates.
    <html lang={lang} className={`${sans.variable} ${title.variable} ${sansItalic.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" />
        <script dangerouslySetInnerHTML={{ __html: SKELETON_JS }} />
      </head>
      <body>
        {children}
        <Script id="menu" strategy="afterInteractive">{MENU_JS}</Script>
        <Analytics />
      </body>
    </html>
  );
}

/** Photo skeletons (chrome.css): runs in <head> before any image, so it sees every load and error event
 *  (listening on document: image load events never reach window). */
const SKELETON_JS = `document.documentElement.classList.add('ow-sk');(function(){function m(e){var t=e.target;if(t&&t.tagName==='IMG')t.setAttribute('data-ld','')}document.addEventListener('load',m,true);document.addEventListener('error',m,true);document.addEventListener('DOMContentLoaded',function(){for(var i of document.images)if(i.complete)i.setAttribute('data-ld','')})})();`;

/** Burger menu: open and close the full-screen menu below the header; Escape and link clicks close it. */
const MENU_JS = `(() => {
  const btn = document.querySelector('.menu-btn'); const nav = document.getElementById('mnav'); if (!btn || !nav) return;
  const set = (open) => {
    btn.setAttribute('aria-expanded', String(open)); nav.classList.toggle('open', open); document.body.classList.toggle('menu-open', open);
    if (open) { const h = document.querySelector('.site-head'); if (h) nav.style.top = h.offsetHeight + 'px'; }
  };
  btn.addEventListener('click', () => set(btn.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) set(false); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') set(false); });
  addEventListener('resize', () => { if (innerWidth > 1000) set(false); });
})();`;
