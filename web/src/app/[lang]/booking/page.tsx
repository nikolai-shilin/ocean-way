import '@/styles/booking.css';
import ProtoPage from '@/components/ProtoPage';
import { loadPage, pageMetadata, t } from '@/lib/content';
import { getCourseDates, getCourses, getPassages, type CourseDate, type Passage } from '@/lib/db';
import { ORG, photo } from '@/lib/meta';
import { bookingData } from '@/lib/render';
import { path, type Lang } from '@/lib/site';

const TELEGRAM = ORG.sameAs[0];

export const revalidate = 30;

export async function generateMetadata({ params }: PageProps<'/[lang]/booking'>) {
  const { lang } = await params;
  return pageMetadata(loadPage('booking', lang as Lang), path.booking);
}

/** The prototype's booking script, wired to live dates and places and to the bookings API. */
function wire(script: string) {
  const swap = (from: string, to: string) => {
    if (!script.includes(from)) throw new Error(`booking script changed: ${from.slice(0, 60)}`);
    script = script.replace(from, to);
  };
  swap("const link = (f) => LANG === 'en' ? f : f.replace('.html', '.' + LANG + '.html');",
    "const link = (f) => ({ 'home.html': '/' + LANG, 'bareboat-skipper-course.html': '/' + LANG + '/courses/bareboat-skipper' })[f] || f;");
  swap("const item = CATALOG[q.get('item')] || CATALOG.bareboat;",
    "if (window.OW_DATA) { CATALOG.bareboat.options = window.OW_DATA.course; CATALOG.passage.options = window.OW_DATA.passages; if (window.OW_DATA.info) Object.assign(CATALOG.bareboat, window.OW_DATA.info); }\nconst item = window.OW_DATA && window.OW_DATA.info ? CATALOG.bareboat : CATALOG[q.get('item')] || CATALOG.bareboat;");
  swap("const ref = 'OW-' + c.id.slice(2)", "const ref = st.ref || 'OW-' + c.id.slice(2)");
  swap("$('form').addEventListener('submit', (e) => { e.preventDefault(); if (validate(st.step)) go(st.step + 1); });",
    `$('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validate(st.step)) return;
  if (st.step < 3) { go(st.step + 1); return; }
  const btn = $('next'); const label = btn.textContent; btn.disabled = true; btn.textContent = '…';
  const c = cur(); const back = item.kind === 'passage' && st.add ? pair() : null;
  try {
    const res = await fetch('/api/bookings', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
      item: item.kind, option: c.db_id, returnOption: back ? back.db_id : null, cabin: st.cabin, people: st.ppl, plan: st.plan, method: st.method,
      firstName: $('fname').value, lastName: $('lname').value, email: $('email').value, phone: $('phone').value, telegram: $('tg').value,
      country: $('country').value, experience: st.exp, newsletter: $('news').checked, lang: LANG }) });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(out.error || 'Booking failed');
    st.ref = out.ref; go(4);
    try { sessionStorage.removeItem(KEY); } catch (err) {}
  } catch (err) {
    $('errlist').innerHTML = '<li>' + String(err.message || err) + '</li>'; $('errsum').classList.add('on'); $('errsum').focus();
  } finally { btn.disabled = false; if (st.step !== 4) btn.textContent = label; }
});`);
  return script;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** ?course=<slug> books that course instead of Bareboat Skipper: its own dates, title, photo and links. */
export default async function Booking({ params, searchParams }: PageProps<'/[lang]/booking'>) {
  const lang = (await params).lang as Lang;
  const asked = (await searchParams).course;
  const content = loadPage('booking', lang);
  const course = typeof asked === 'string' && asked !== 'bareboat-skipper' ? (await getCourses()).find((c) => c.slug === asked) : undefined;
  const [dates, passages] = await Promise.all([getCourseDates(course?.slug ?? 'bareboat-skipper'), getPassages()]);
  const chrome = content.scripts.slice(0, -1);

  if (course) {
    const back = path.courseItem(lang, course.slug);
    const h1 = t(lang, 'Book the {name} course', { name: course.name });
    // No open dates yet: say so and point to Telegram, where new dates go first, instead of an empty booking form.
    if (!dates.some((d) => d.places_left > 0)) {
      const main = `<div class="bk"><div>
  <a class="bk-back" href="${back}#dates"><svg class="i"><use href="#ow-arrow"/></svg><span>${esc(t(lang, 'Back to the course'))}</span></a>
  <h1>${esc(h1)}</h1>
  <p class="step-lead">${esc(t(lang, 'New dates for this course are published in Telegram first. Ask us and we will tell you the next start dates and find a week that suits you.'))}</p>
  <div class="ctas"><a class="pill pill-primary" href="${TELEGRAM}">${esc(t(lang, 'Ask in Telegram'))}</a><a class="pill pill-quiet" href="${path.courses(lang)}">${esc(t(lang, 'All courses'))}</a></div>
</div></div>`;
      return <ProtoPage content={content} main={main} scripts={chrome.length ? [chrome.join(';\n')] : []} />;
    }
    const after = course.after?.[0]?.text;
    const info = {
      title: t(lang, '{name} course', { name: course.name }), h1, lead: t(lang, course.summary), img: photo(course.photo_id, 600),
      back: [back + '#dates', t(lang, 'Back to the course')], prep: back + '#bring', ...(after ? { after: t(lang, after) } : {}),
    };
    return <ProtoPage content={content} scripts={[script(lang, dates, passages, info) + chrome.concat(wire(content.scripts[content.scripts.length - 1])).join(';\n')]} />;
  }
  return <ProtoPage content={content} scripts={[script(lang, dates, passages) + chrome.concat(wire(content.scripts[content.scripts.length - 1])).join(';\n')]} />;
}

function script(lang: Lang, dates: CourseDate[], passages: Passage[], info?: object) {
  return 'window.OW_DATA = ' + JSON.stringify({ ...bookingData(lang, dates, passages), info }).replace(/</g, '\\u003c') + ';\n';
}
