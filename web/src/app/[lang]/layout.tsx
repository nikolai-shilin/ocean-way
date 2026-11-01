import '@/styles/chrome.css';
import Script from 'next/script';
import { notFound } from 'next/navigation';
import { LANGS, isLang } from '@/lib/site';

export function generateStaticParams() {
  return LANGS.map((lang) => ({ lang }));
}
export const dynamicParams = false;

export default async function LangLayout({ children, params }: LayoutProps<'/[lang]'>) {
  const { lang } = await params;
  if (!isLang(lang)) notFound();
  return (
    <html lang={lang}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Carlito:ital,wght@0,400;0,700;1,400&family=Merriweather:ital,wght@0,300;1,300&display=swap" />
        <link rel="preconnect" href="https://images.unsplash.com" />
      </head>
      <body>
        {children}
        <Script id="menu" strategy="afterInteractive">{MENU_JS}</Script>
      </body>
    </html>
  );
}

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
