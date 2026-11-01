import '@/styles/booking.css';
import ProtoPage from '@/components/ProtoPage';
import { loadPage, pageMetadata } from '@/lib/content';
import { getCourseDates, getPassages } from '@/lib/db';
import { bookingData } from '@/lib/render';
import { path, type Lang } from '@/lib/site';

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
    "if (window.OW_DATA) { CATALOG.bareboat.options = window.OW_DATA.course; CATALOG.passage.options = window.OW_DATA.passages; }\nconst item = CATALOG[q.get('item')] || CATALOG.bareboat;");
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

export default async function Booking({ params }: PageProps<'/[lang]/booking'>) {
  const lang = (await params).lang as Lang;
  const content = loadPage('booking', lang);
  const [dates, passages] = await Promise.all([getCourseDates('bareboat-skipper'), getPassages()]);
  const data = 'window.OW_DATA = ' + JSON.stringify(bookingData(lang, dates, passages)).replace(/</g, '\\u003c') + ';\n';
  const scripts = content.scripts.slice(0, -1).concat(wire(content.scripts[content.scripts.length - 1]));
  return <ProtoPage content={content} scripts={[data + scripts.join(';\n')]} />;
}
