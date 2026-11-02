import Script from 'next/script';
import { langLinks, siteHeader, sprite, type Section } from '@/lib/chrome';
import FooterNav from './FooterNav';
import type { Lang } from '@/lib/site';

/** Header, footer and icons of the site around a page written in React; the language switcher points at this page. */
export default function Shell({ lang, section, pathFor, jsonld, children, scripts = [] }: {
  lang: Lang; section: Section; pathFor: (l: Lang) => string; jsonld?: object; children: React.ReactNode; scripts?: string[];
}) {
  const header = siteHeader(lang, section, pathFor);
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: sprite() }} />
      <div className="wrap">
        <div dangerouslySetInnerHTML={{ __html: header }} />
        <main>{children}</main>
        <FooterNav lang={lang} langLinks={langLinks(lang, pathFor)} />
      </div>
      {jsonld ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonld).replace(/</g, '\\u003c') }} /> : null}
      <Script id="chrome" strategy="afterInteractive">{CHROME_JS}</Script>
      {scripts.map((s, i) => <Script key={i} id={`page-${i}`} strategy="afterInteractive">{s}</Script>)}
    </>
  );
}

/** Theme switch, language links keep the query string, and arrow buttons for sideways card rows. */
const CHROME_JS = `
const root = document.documentElement;
const tb = document.getElementById('themeBtn');
if (tb) tb.addEventListener('click', () => { if (root.dataset.theme === 'night') delete root.dataset.theme; else root.dataset.theme = 'night'; });
if (new URLSearchParams(location.search).get('theme') === 'night') root.dataset.theme = 'night';
document.querySelectorAll('[data-row]').forEach((row) => {
  const g = row.querySelector('.hscroll, .gallery'); if (!g) return;
  const btns = [...row.querySelectorAll('.round[data-dir]')]; if (btns.length < 2) return;
  const sync = () => { btns[0].disabled = g.scrollLeft <= 4; btns[1].disabled = g.scrollLeft + g.clientWidth >= g.scrollWidth - 4; };
  btns.forEach((b) => b.addEventListener('click', () => g.scrollBy({ left: Number(b.dataset.dir) * g.clientWidth * 0.7, behavior: 'smooth' })));
  g.addEventListener('scroll', sync, { passive: true }); addEventListener('resize', sync); sync();
});`;
