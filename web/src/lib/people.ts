import { t } from './content';
import type { Instructor } from './db';
import { path, type Lang } from './site';

/** Profile cards for instructors and skippers, as HTML so the React pages and the prototype course page share them. */
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Unsplash crop around the face (head and shoulders). */
export const face = (id: string, size = 240) => `https://images.unsplash.com/photo-${id}?w=${size}&h=${size}&fit=facearea&facepad=3&q=80&auto=format`;

export function personCard(lang: Lang, p: Instructor, extra = '') {
  const facts = [
    p.seasons ? `<span class="fact"><svg class="i"><use href="#i-boat"/></svg>${esc(t(lang, 'Seasons: {n}', { n: p.seasons }))}</span>` : '',
    p.languages.length ? `<span class="fact"><svg class="i"><use href="#i-guests"/></svg>${p.languages.map((l) => l.toUpperCase()).join(' · ')}</span>` : '',
  ].join('');
  return `<article class="band ow-person" id="${p.slug}">
  <img class="ow-face" src="${face(p.photo_id)}" alt="${esc(t(lang, p.photo_alt))}" width="112" height="112" loading="lazy">
  <div class="ow-person-body">
    <b class="ow-person-name">${esc(p.name)}</b>
    <span class="ow-person-role">${esc(t(lang, p.role))}${p.qualification ? ' · ' + esc(t(lang, p.qualification)) : ''}</span>
    <div class="facts">${facts}</div>
    <p>${esc(t(lang, p.bio))}</p>${extra}
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
