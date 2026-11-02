import fs from 'node:fs';
import nodePath from 'node:path';
import { t } from './content';
import { LANGS, type Lang } from './site';

export type Section = 'courses' | 'passages' | 'theory' | 'fleet' | 'instructors' | 'prices' | null;

const INSTRUCTORS: Record<Lang, string> = { en: 'Instructors', ru: 'Инструкторы', de: 'Ausbilder', es: 'Instructores' };

/** Links inside prototype content that still point at home-page anchors go to the section pages instead. */
export function fixNav(html: string, lang: Lang): string {
  return html
    .replace(new RegExp(`href="/${lang}#courses"`, 'g'), `href="/${lang}/courses"`)
    .replace(new RegExp(`href="/${lang}#passages"`, 'g'), `href="/${lang}/passages"`)
    .replace(new RegExp(`href="/${lang}#fleet"`, 'g'), `href="/${lang}/fleet"`);
}

const BARS = '<svg class="i bars" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg><svg class="i x" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
const ARROW = '<svg class="i"><use href="#ow-arrow"/></svg>';
const LOGO = '<svg viewBox="2 2 116 116" aria-hidden="true"><defs><clipPath id="logo-clip"><circle cx="60" cy="60" r="47.01"/></clipPath></defs><g clip-path="url(#logo-clip)" fill="currentColor"><line x1="0" y1="72.3" x2="120" y2="54.6" stroke="currentColor" stroke-width="11"/><path d="M28 59 C36 36 72 23.5 118 32 L118 51 C84 41 47 43.5 28 59Z"/></g><circle cx="60" cy="60" r="52.5" fill="none" stroke="currentColor" stroke-width="11"/></svg>';
const LANG_NAME: Record<Lang, string> = { en: 'English', ru: 'Русский', de: 'Deutsch', es: 'Español' };
const LANG_LABEL: Record<Lang, string> = { en: 'Language', ru: 'Язык', de: 'Sprache', es: 'Idioma' };

/** The language switcher's links for this page: [lang, href, current]. */
export const langLinks = (lang: Lang, pathFor: (l: Lang) => string): [Lang, string, boolean][] => LANGS.map((l) => [l, pathFor(l), l === lang]);

/** The site header of every page: logo, main menu (current section marked), language switcher pointing at this
 *  page in each language, theme button, and the full-screen menu for phones. */
export function siteHeader(lang: Lang, section: Section, pathFor: (l: Lang) => string): string {
  const items: [Exclude<Section, null>, string][] = [['courses', 'Courses'], ['passages', 'Passages'], ['theory', 'Theory'], ['fleet', 'Fleet'], ['instructors', 'Instructors'], ['prices', 'Prices']];
  const nav = items.map(([k, label]) => [`/${lang}/${k}`, k === 'instructors' ? INSTRUCTORS[lang] : t(lang, label), k === section] as const);
  const langs = langLinks(lang, pathFor);
  const cur = (on: boolean) => (on ? ' aria-current="true"' : '');
  return `<header class="site-head">
    <a class="logo has-word" href="/${lang}" aria-label="${t(lang, 'Ocean Way, home')}">${LOGO}<span class="logo-word" translate="no">Ocean Way</span></a>
    <nav class="site-nav" aria-label="${t(lang, 'Main')}">
${nav.map(([href, label, on]) => `      <a class="navl${on ? ' on' : ''}" href="${href}">${label}</a>`).join('\n')}
    </nav>
    <div class="site-tools">
      <details class="lang" translate="no"><summary class="round" aria-label="${LANG_LABEL[lang]}: ${LANG_NAME[lang]}">${lang.toUpperCase()}</summary><ul class="lang-menu">${langs.map(([l, href, on]) => `<li><a href="${href}" hreflang="${l}" lang="${l}"${cur(on)}>${LANG_NAME[l]}<span>${l.toUpperCase()}</span></a></li>`).join('')}</ul></details>
      <button class="round" type="button" id="themeBtn" aria-label="${t(lang, 'Theme')}"><svg class="i"><use href="#ow-theme"/></svg></button>
      <button class="round" type="button" aria-label="${t(lang, 'Saved')}"><svg class="i"><use href="#ow-saved"/></svg></button>
      <button class="round" type="button" aria-label="${t(lang, 'Account')}"><svg class="i"><use href="#ow-user"/></svg></button><button class="round menu-btn" type="button" aria-expanded="false" aria-controls="mnav" aria-label="${t(lang, 'Menu')}">${BARS}</button>
    </div>
  </header><nav class="mnav" id="mnav" aria-label="${t(lang, 'Menu')}">${nav.map(([href, label, on]) => `<a${on ? ' class="on" aria-current="page"' : ''} href="${href}">${label}${ARROW}</a>`).join('')}<div class="mnav-langs">${langs.map(([l, href, on]) => `<a href="${href}" hreflang="${l}" lang="${l}"${cur(on)}>${l.toUpperCase()}</a>`).join('')}</div></nav>`;
}

let icons: string | undefined;
/** The icon sprite (content/ow-icons.svg, a copy of prototypes/icons/ow-icons.svg written by build_icons.py), once per page. */
export function sprite(): string {
  return (icons ??= fs.readFileSync(nodePath.join(process.cwd(), 'content', 'ow-icons.svg'), 'utf8'));
}

/** FAQ grids: split the questions into two independent columns (first half left), so opening one question
 *  does not stretch its neighbour; on phones the columns stack in the original order. */
export function splitFaq(html: string): string {
  return html.replace(/(<div class="faq-grid">)([\s\S]*?)(\s*<\/div>\s*<\/section>)/g, (_, open: string, inner: string, close: string) => {
    const items = inner.match(/<details[\s\S]*?<\/details>/g) || [];
    if (items.length < 2) return open + inner + close;
    const half = Math.ceil(items.length / 2);
    return `${open}<div class="faq-col">${items.slice(0, half).join('')}</div><div class="faq-col">${items.slice(half).join('')}</div>${close}`;
  });
}
