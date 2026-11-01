import type { Lang } from './site';

export type Section = 'courses' | 'passages' | 'theory' | 'fleet' | 'instructors' | 'prices' | null;

/** Point the header menu at the section pages (the prototypes link to anchors on the home page) and mark the
 *  current section. Also used for links inside prototype content that still point at home-page anchors. */
const INSTRUCTORS: Record<Lang, string> = { en: 'Instructors', ru: 'Инструкторы', de: 'Ausbilder', es: 'Instructores' };

export function fixNav(html: string, lang: Lang, active: Section = null): string {
  let out = html
    .replace(new RegExp(`href="/${lang}#courses"`, 'g'), `href="/${lang}/courses"`)
    .replace(new RegExp(`href="/${lang}#passages"`, 'g'), `href="/${lang}/passages"`)
    .replace(new RegExp(`href="/${lang}#fleet"`, 'g'), `href="/${lang}/fleet"`)
    .replace(/<a class="navl" href="#(courses|passages|fleet)">/g, (_, k: string) => `<a class="navl" href="/${lang}/${k}">`)
    .replace(/<a class="navl" href="#">/g, `<a class="navl" href="/${lang}/prices">`)
    .replace(/class="navl on"/g, 'class="navl"')
    // Instructors page: added after Fleet (the prototype menus predate it)
    .replace(new RegExp(`(<a class="navl" href="/${lang}/fleet">[^<]*</a>)(?![\\s\\S]*?/instructors")`), `$1\n      <a class="navl" href="/${lang}/instructors">${INSTRUCTORS[lang]}</a>`);
  if (active) {
    const href = `/${lang}/${active}`;
    out = out.replace(`<a class="navl" href="${href}">`, `<a class="navl on" href="${href}">`);
  }
  return out;
}

const BARS = '<svg class="i bars" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg><svg class="i x" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
const ARROW = '<svg class="i"><use href="#i-arrow"/></svg>';

/** The site name next to the logo mark. */
export function addWordmark(header: string): string {
  if (header.includes('logo-word')) return header;
  return header.replace(/<a class="logo"([^>]*>[\s\S]*?<\/svg>)(<\/a>)/, '<a class="logo has-word"$1<span class="logo-word" translate="no">Ocean Way</span>$2');
}

/** Add the site name, the burger button and the mobile menu (built from the header's own links and language switcher). */
export function addMobileMenu(header: string, menuLabel: string): string {
  header = addWordmark(header);
  if (header.includes('class="mnav"')) return header;
  const links = [...header.matchAll(/<a class="navl( on)?" href="([^"]+)">([^<]+)<\/a>/g)]
    .map((m) => `<a${m[1] ? ' class="on" aria-current="page"' : ''} href="${m[2]}">${m[3]}${ARROW}</a>`).join('');
  const langs = [...header.matchAll(/<a href="([^"]+)" hreflang="(\w\w)" lang="\w\w"( aria-current="true")?>/g)]
    .map((m) => `<a href="${m[1]}" hreflang="${m[2]}" lang="${m[2]}"${m[3] ? ' aria-current="true"' : ''}>${m[2].toUpperCase()}</a>`).join('');
  const btn = `<button class="round menu-btn" type="button" aria-expanded="false" aria-controls="mnav" aria-label="${menuLabel}">${BARS}</button>`;
  return header
    .replace(/(<div class="site-tools">[\s\S]*?)(\s*<\/div>\s*<\/header>)/, `$1${btn}$2`)
    .replace(/<\/header>\s*$/, `</header><nav class="mnav" id="mnav" aria-label="${menuLabel}">${links}<div class="mnav-langs">${langs}</div></nav>`);
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

/** The language links of the header's switcher: [lang, href, current]. */
export function langLinks(header: string): [string, string, boolean][] {
  const seen = new Set<string>();
  return [...header.matchAll(/<a href="([^"]+)" hreflang="(\w\w)" lang="\w\w"( aria-current="true")?>/g)]
    .filter((m) => !seen.has(m[2]) && seen.add(m[2]))
    .map((m) => [m[2], m[1], !!m[3]] as [string, string, boolean]);
}
