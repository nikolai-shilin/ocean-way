import '@/styles/chrome.css';
import '@/styles/motion.css';
import '@/styles/cover.css';
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
    // suppressHydrationWarning: the head scripts add the ow-sk class and data-theme before React hydrates.
    <html lang={lang} className={`${sans.variable} ${title.variable} ${sansItalic.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" />
        <script dangerouslySetInnerHTML={{ __html: THEME_JS }} />
        <script dangerouslySetInnerHTML={{ __html: SKELETON_JS }} />
        <script dangerouslySetInnerHTML={{ __html: MOTION_JS }} />
      </head>
      <body>
        {children}
        <Script id="menu" strategy="afterInteractive">{MENU_JS}</Script>
        <Analytics />
      </body>
    </html>
  );
}

/** Remembered theme: applied in <head> before the first paint, so a night page never flashes light. The theme
 *  button's own script (in every page) switches data-theme; this listener on document runs after it and saves the
 *  result. Storage can be blocked (private mode), so both reads and writes are wrapped. */
const THEME_JS = `(function(){var r=document.documentElement,k='ow-theme';try{if(localStorage.getItem(k)==='night')r.dataset.theme='night'}catch(e){}document.addEventListener('click',function(e){if(!e.target.closest||!e.target.closest('#themeBtn'))return;try{localStorage.setItem(k,r.dataset.theme==='night'?'night':'day')}catch(e){}})})();`;

/** Photo skeletons (chrome.css): runs in <head> before any image, so it sees every load and error event
 *  (listening on document: image load events never reach window). A loaded photo is marked by a rule in a style
 *  sheet of its own, not by an attribute on the <img>: the page markup must stay as the server sent it until React
 *  has hydrated it. */
const SKELETON_JS = `document.documentElement.classList.add('ow-sk');(function(){var s=document.createElement('style'),seen={};document.head.appendChild(s);function m(e){var t=e.target||e;if(!t||t.tagName!=='IMG')return;var u=t.getAttribute('src');if(!u||seen[u])return;seen[u]=1;var q='[src="'+u.replace(/["\\\\]/g,'\\\\$&')+'"]';try{s.sheet.insertRule('html.ow-sk.ow-sk img'+q+'{opacity:1}',0);s.sheet.insertRule('html.ow-sk.ow-sk :has(> img'+q+')::after{content:none}',0)}catch(_){}}document.addEventListener('load',m,true);document.addEventListener('error',m,true);document.addEventListener('DOMContentLoaded',function(){for(var i of document.images)if(i.complete)m(i)})})();`;

/** Motion (motion.css has the CSS-only parts). Runs in <head>; nothing here changes the page markup, so it can
 *  start before React hydrates:
 *  - theme button: the new theme spreads in a circle from the button (View Transitions), and is remembered;
 *  - scroll reveals: blocks that start below the screen are held invisible by a paused animation and rise in,
 *    one after another, the first time they scroll into view; route maps draw their legs day by day, and the
 *    figures on course pages count up;
 *  - nothing moves for visitors who ask for reduced motion. */
const MOTION_JS = `(() => {
  const d = document, r = d.documentElement;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const EASE = 'cubic-bezier(.23,1,.32,1)', EASE_IO = 'cubic-bezier(.77,0,.175,1)';

  addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('#themeBtn');
    if (!b || !d.startViewTransition) return;
    e.stopImmediatePropagation();
    const c = b.getBoundingClientRect(), x = c.left + c.width / 2, y = c.top + c.height / 2;
    const R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    r.classList.add('ow-vt-theme');
    // Flip when the change applies, not at click time: a second quick click must flip it back.
    const t = d.startViewTransition(() => {
      const night = r.dataset.theme !== 'night';
      if (night) r.dataset.theme = 'night'; else delete r.dataset.theme;
      try { localStorage.setItem('ow-theme', night ? 'night' : 'day'); } catch (_) {}
    });
    t.ready.then(() => r.animate({ clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + R + 'px at ' + x + 'px ' + y + 'px)'] },
      { duration: 550, easing: EASE_IO, pseudoElement: '::view-transition-new(root)' })).catch(() => {});
    t.finished.finally(() => r.classList.remove('ow-vt-theme'));
  }, true);

  if (!('IntersectionObserver' in window) || !Element.prototype.animate) return;
  const SEL = 'main section:not(.hero,.ow-hero,.th-hero,.cover) > *, .prose > *, .article > .side, .ow-body > *, .ow-box, .card, .fig, .ow-person, .social,'
    + ' .faq-item, .mod, .ow-two > *, .ow-specs > *, .ow-prog > li, .ow-stops > li, .th-topic-head, .fnav > *';
  const SKIP = '.hero, .ow-hero, .th-hero, .gallery-wrap, .cover, .bk, form';
  const armed = new Map();

  const arm = (el) => {
    const list = [el.animate([{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'none' }], { duration: 700, easing: EASE, fill: 'both' })];
    let n = 0;
    el.querySelectorAll('.rm-leg').forEach((leg) => {
      const line = leg.querySelector('.rm-line');
      if (!line || !line.getClientRects().length) return;
      const L = line.getTotalLength(); if (!L) return;
      const at = 250 + Math.min(n++, 10) * 110;
      list.push(line.animate([{ strokeDasharray: L + ' ' + L, strokeDashoffset: L }, { strokeDasharray: L + ' ' + L, strokeDashoffset: 0 }],
        { duration: 900, delay: at, easing: EASE_IO, fill: 'both' }));
      leg.querySelectorAll('.rm-arrow').forEach((a) => list.push(a.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250, delay: at + 750, fill: 'both' })));
    });
    list.forEach((a) => a.pause());
    armed.set(el, list);
  };

  const count = (b, delay) => {
    const txt = b.textContent, n = Number(txt);
    if (!/^[0-9]+$/.test(txt) || n < 2) return;
    const t0 = performance.now() + delay, D = 1000;
    b.textContent = '0';
    const f = (now) => {
      const k = Math.min(1, Math.max(0, (now - t0) / D));
      b.textContent = k < 1 ? String(Math.round(n * (1 - Math.pow(1 - k, 3)))) : txt;
      if (k < 1) requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  };

  const play = (el, delay) => {
    const list = armed.get(el); if (!list) return;
    armed.delete(el); io.unobserve(el);
    list.forEach((a) => {
      a.effect.updateTiming({ delay: (a.effect.getTiming().delay || 0) + delay });
      a.onfinish = () => a.cancel();
      a.play();
    });
    // Numbers are page text React hydrates, so they only count once hydration is done (MENU_JS sets the flag).
    if (window.__owReady && el.matches('.fig')) { const b = el.querySelector('b'); if (b) count(b, delay + 100); }
  };

  const io = new IntersectionObserver((entries) => {
    const batch = entries.filter((e) => e.isIntersecting && armed.has(e.target)).map((e) => e.target);
    // A sideways row reveals as a whole, so cards scrolled in later are already there.
    batch.slice().forEach((el) => {
      const p = el.parentElement;
      if (p && p.matches('.hscroll')) for (const s of p.children) if (armed.has(s) && !batch.includes(s)) batch.push(s);
    });
    const at = new Map(batch.map((el) => [el, el.getBoundingClientRect()]));
    batch.sort((a, b) => (at.get(a).top - at.get(b).top) || (at.get(a).left - at.get(b).left));
    batch.forEach((el, i) => play(el, Math.min(i, 6) * 70));
  }, { rootMargin: '0px 0px -40px 0px' });

  d.addEventListener('DOMContentLoaded', () => {
    const found = [...d.querySelectorAll(SEL)].filter((el) => !el.closest(SKIP));
    const keep = new Set(found);
    // Animate the smallest blocks: drop any block that holds other blocks.
    found.forEach((el) => { for (let p = el.parentElement; p; p = p.parentElement) keep.delete(p); });
    const H = innerHeight;
    keep.forEach((el) => {
      if (!el.getClientRects().length || el.getBoundingClientRect().top < H) return;
      arm(el); io.observe(el);
    });
  });
  addEventListener('beforeprint', () => { armed.forEach((list, el) => { list.forEach((a) => a.cancel()); io.unobserve(el); }); armed.clear(); });
})();`;

/** Burger menu (and the hydration-done flag MOTION_JS waits for): open and close the full-screen menu below the header; Escape and link clicks close it. */
const MENU_JS = `window.__owReady = true;
(() => {
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
