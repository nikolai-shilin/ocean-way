import { t } from './content';
import type { Instructor } from './db';
import { path, type Lang } from './site';

/** Profile cards for instructors and skippers, as HTML so the React pages and the prototype course page share them. */
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Head-and-shoulders photo: a local square file (photo_id starts with "/", e.g. /people/nikolai.webp) or an Unsplash id cropped around the face. */
export const face = (id: string, size = 240) => id.startsWith('/') ? id : `https://images.unsplash.com/photo-${id}?w=${size}&h=${size}&fit=facearea&facepad=3&q=80&auto=format`;

export function personCard(lang: Lang, p: Instructor, extra = '') {
  const facts = [
    p.seasons ? `<span class="fact"><svg class="i"><use href="#ow-logbook"/></svg>${esc(t(lang, 'Seasons: {n}', { n: p.seasons }))}</span>` : '',
    p.languages.length ? `<span class="fact"><svg class="i"><use href="#ow-globe"/></svg>${p.languages.map((l) => l.toUpperCase()).join(' · ')}</span>` : '',
  ].join('');
  return `<article class="band ow-person" id="${p.slug}">
  <img class="ow-face" src="${face(p.photo_id)}" alt="${esc(p.photo_alt)}" width="112" height="112" loading="lazy">
  <div class="ow-person-body">
    <b class="ow-person-name">${esc(t(lang, p.name))}</b>
    <span class="ow-person-role">${esc(t(lang, p.role))}${p.qualification ? ' · ' + esc(p.qualification) : ''}</span>
    <div class="facts">${facts}</div>
    <p>${esc(p.bio)}</p>${extra}
    ${p.sample ? `<span class="ow-sample">${esc(t(lang, 'Sample profile'))}</span>` : ''}
  </div>
</article>`;
}

/** "Your instructors" / "Your skipper" block for a course or passage page. */
export function peopleSection(lang: Lang, people: Instructor[], kind: 'course' | 'passage') {
  if (!people.length) return '';
  const title = kind === 'course' ? (people.length > 1 ? 'Your instructors' : 'Your instructor') : (people.length > 1 ? 'Your skippers' : 'Your skipper');
  return `<section class="ow-people-sec" id="instructors"><h2>${esc(t(lang, title))}</h2>
  <div class="ow-people">${people.map((p) => personCard(lang, p)).join('')}</div>
  <p class="ow-note"><a href="${path.instructors(lang)}">${esc(t(lang, 'All instructors and skippers'))}</a></p></section>`;
}
