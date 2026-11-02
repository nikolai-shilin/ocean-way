import fs from 'node:fs';
import nodePath from 'node:path';
import { TEMPLATES, type TemplateName } from '@/templates/pages';
import { dictionary, type PageContent } from './content';
import type { Lang } from './site';

/** Pages written as one English HTML template (src/templates/<page>.html, its script <page>.js, its metadata in
 *  pages.ts) and translated when they render: text between tags and the alt, aria-label, placeholder and title
 *  attributes go through the dictionaries (content/i18n), keyed by the English text, as the prototype build did.
 *  A string without a translation stays English. Links to /en/… point to the page's language. */

const DIR = nodePath.join(process.cwd(), 'src', 'templates');
const file = (name: string) => fs.readFileSync(nodePath.join(DIR, name), 'utf8');

const ENT: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
const unesc = (s: string) => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) =>
  e[0] === '#' ? String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : ENT[e] ?? m);
const escText = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s: string) => escText(s).replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
const ATTRS = ['alt', 'aria-label', 'placeholder', 'title'];
const LD_KEYS = new Set(['name', 'description', 'text', 'educationalCredentialAwarded']);

/** Translate an English HTML fragment. Styles and scripts are left alone. */
export function translateHtml(src: string, lang: Lang): string {
  if (lang === 'en') return src;
  const tr = dictionary(lang);
  // A text or attribute value, trimmed and decoded, is the dictionary key; surrounding whitespace is kept.
  const T = (text: string) => {
    const key = unesc(text.trim());
    if (!key || !Object.hasOwn(tr, key)) return text;
    return text.slice(0, text.length - text.trimStart().length) + escText(tr[key]) + text.slice(text.trimEnd().length);
  };
  return src.split(/(<style>[\s\S]*?<\/style>|<script[^>]*>[\s\S]*?<\/script>)/).map((part, i) => {
    if (i % 2) return part;
    let s = part.replace(/>([^<>]+)</g, (_, text: string) => '>' + T(text) + '<');
    for (const a of ATTRS) s = s.replace(new RegExp(`(\\s${a}=")([^"]+)(")`, 'g'), (_, pre: string, v: string, post: string) => pre + escAttr(unesc(T(v))) + post);
    return s;
  }).join('');
}

const relink = (s: string, lang: Lang) => lang === 'en' ? s : s.replaceAll('href="/en/', `href="/${lang}/`).replaceAll('href="/en"', `href="/${lang}"`);

/** JSON-LD in the page language: names, descriptions and texts translated, inLanguage and /en/ addresses switched. */
function translateLd(o: unknown, lang: Lang, tr: Record<string, string>): unknown {
  if (Array.isArray(o)) return o.map((v) => translateLd(v, lang, tr));
  if (!o || typeof o !== 'object') return o;
  return Object.fromEntries(Object.entries(o).map(([k, v]) => {
    if (LD_KEYS.has(k) && typeof v === 'string') return [k, Object.hasOwn(tr, v) ? tr[v] : v];
    if (k === 'inLanguage' && v === 'en') return [k, lang];
    if (typeof v === 'string' && v.startsWith('{{SITE}}/en/')) return [k, v.replace('/en/', `/${lang}/`)];
    return [k, translateLd(v, lang, tr)];
  }));
}

/** The booking script looks its labels up in window.RYC_T: every t('…') string it uses, in this language. */
function scriptStrings(js: string, tr: Record<string, string>): string {
  const keys = new Map<string, string>();
  for (const m of js.matchAll(/\bt\('((?:[^'\\]|\\.)*)'/g)) {
    const k = m[1].replaceAll("\\'", "'");
    if (Object.hasOwn(tr, k)) keys.set(k, tr[k]);
  }
  if (js.includes("t(n + ' nights')")) for (const k of ['4 nights', '7 nights', '14 nights']) if (Object.hasOwn(tr, k)) keys.set(k, tr[k]);
  return `window.RYC_T = {${[...keys].map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(', ')}};`;
}

const memo = new Map<string, PageContent>();
/** One template page in one language, ready for HtmlPage. Built once per process (templates are part of the build). */
export function templatePage(name: TemplateName, lang: Lang): PageContent {
  const cached = memo.get(name + lang);
  if (cached) return cached;
  const m = TEMPLATES[name];
  const tr = lang === 'en' ? {} : dictionary(lang);
  const say = (s: string) => (Object.hasOwn(tr, s) ? tr[s] : s);
  const js = file(`${name}.js`);
  const page: PageContent = {
    page: name, lang, title: say(m.title), description: m.description && say(m.description), image: m.image, robots: m.robots,
    jsonld: m.jsonld.map((j) => JSON.stringify(lang === 'en' ? j : translateLd(j, lang, tr), null, 1)),
    main: relink(translateHtml(file(`${name}.html`), lang), lang), tail: '',
    scripts: name === 'booking' && lang !== 'en' ? [scriptStrings(js, tr), js] : [js],
    styles: m.styles,
  };
  if (process.env.NODE_ENV === 'production') memo.set(name + lang, page);
  return page;
}

/** The theory hub and article pages share one script (theme switch, scroll rows, contents highlight). */
export const theoryScript = () => file('theory.js');
