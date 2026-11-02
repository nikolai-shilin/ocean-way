
const root = document.documentElement;
document.getElementById('themeBtn').addEventListener('click', () => {
  if (root.dataset.theme === 'night') delete root.dataset.theme; else root.dataset.theme = 'night';
});
const q = new URLSearchParams(location.search);
if (q.get('theme') === 'night') root.dataset.theme = 'night';

const T = window.RYC_T || {};
const t = (s, v = {}) => (T[s] || s).replace(/\{(\w+)\}/g, (_, k) => v[k]);
const LANG = document.documentElement.lang || 'en';
const link = (f) => LANG === 'en' ? f : f.replace('.html', '.' + LANG + '.html');
const IMG = (id) => `https://images.unsplash.com/photo-${id}?w=900&q=80&auto=format&fit=crop`;
const EXP = {
  course: { legend: t('Sailing experience'), hint: t('The instructor reads this before we take any money. If the course is too big a step, we suggest the right one and you pay nothing.'),
    opts: [['none', t('I have never sailed'), t('We will suggest Introduction to Yachting first')], ['some', t('A few days as crew'), t('Fine for this course if you can steer and handle lines')], ['week', t('A week or more'), t('Ideal')], ['skipper', t('I already skipper'), t('You may only need the assessment')]] },
  passage: { legend: t('Sea time so far'), hint: t('Passages count towards Yachtmaster sea time. You need crew experience: you will stand watches, also at night.'),
    opts: [['crew', t('Crew level, under 300 miles'), t('You stand watches with the instructor')], ['day', t('Day Skipper or Bareboat certificate'), t('You skipper legs under supervision')], ['coastal', t('Building miles for Yachtmaster'), t('Tell us your logged miles in the chat')]] },
};
const P7 = 890, P14 = 1690, P4 = 590;
const LEGS = [
  ['2027-04-10', t('Sat 10 Apr – Sat 17 Apr'), t('Fethiye → Bodrum'), 7, '2027-04-17'], ['2027-04-17', t('Sat 17 Apr – Sat 24 Apr'), t('Bodrum → Fethiye'), 7, '2027-04-10'],
  ['2027-05-01', t('Sat 1 May – Sat 8 May'), t('Fethiye → Northern Cyprus'), 7, '2027-05-15'], ['2027-05-15', t('Sat 15 May – Sat 22 May'), t('Northern Cyprus → Fethiye'), 7, '2027-05-01'],
  ['2027-06-05', t('Sat 5 Jun – Sat 12 Jun'), t('Fethiye → Kuşadası'), 7, null], ['2027-06-12', t('Sat 12 Jun – Sat 26 Jun'), t('Kuşadası → Istanbul'), 14, '2027-07-10'],
  ['2027-07-10', t('Sat 10 Jul – Sat 17 Jul'), t('Istanbul → Kuşadası'), 7, '2027-06-12'], ['2027-07-17', t('Sat 17 Jul – Sat 24 Jul'), t('Kuşadası → Fethiye'), 7, null],
  ['2027-08-07', t('Sat 7 Aug – Sat 14 Aug'), t('Fethiye → Kemer'), 7, '2027-08-14'], ['2027-08-14', t('Sat 14 Aug – Sat 21 Aug'), t('Kemer → Fethiye'), 7, '2027-08-07'],
  ['2027-09-04', t('Sat 4 Sep – Sat 11 Sep'), t('Fethiye → Kuşadası'), 7, '2027-09-11'], ['2027-09-11', t('Sat 11 Sep – Sat 18 Sep'), t('Kuşadası → Fethiye'), 7, '2027-09-04'],
  ['2027-10-02', t('Sat 2 Oct – Sat 9 Oct'), t('Fethiye → Kekova'), 7, '2027-10-09'], ['2027-10-09', t('Sat 9 Oct – Sat 16 Oct'), t('Kekova → Fethiye'), 7, '2027-10-02'],
  ['2027-11-13', t('Sat 13 Nov – Sat 20 Nov'), t('Fenike → Northern Cyprus'), 7, '2027-11-20'], ['2027-11-20', t('Sat 20 Nov – Wed 24 Nov'), t('Northern Cyprus → Fethiye'), 4, '2027-11-13'],
].map(([id, when, route, n, pair]) => ({ id, label: when, sub: `${route} · ${t(n + ' nights')}`, route, nights: n, price: n === 14 ? P14 : n === 4 ? P4 : P7, left: 4, pair }));

const CATALOG = {
  bareboat: {
    kind: 'course', title: t('IYT Bareboat Skipper course'), h1: t('Book the IYT Bareboat Skipper course'), img: IMG('1540946485063-a40da27545f8'),
    back: [link('bareboat-skipper-course.html') + '#dates', t('Back to the course')], lead: t('Saturday to Saturday, living aboard with an instructor and at most four students.'),
    dateLegend: t('Start date'), prep: link('bareboat-skipper-course.html') + '#prepare',
    options: [
      { id: '2027-05-01', label: t('Sat 1 May – Sat 8 May'), sub: t('Saronic Gulf, Greece · Bavaria C38'), price: 1590, left: 2, place: t('Alimos Marina, Athens') },
      { id: '2027-05-22', label: t('Sat 22 May – Sat 29 May'), sub: t('Saronic Gulf, Greece · Bavaria C38'), price: 1590, left: 0, place: t('Alimos Marina, Athens') },
      { id: '2027-09-11', label: t('Sat 11 Sep – Sat 18 Sep'), sub: t('Saronic Gulf, Greece · Bavaria C38'), price: 1590, left: 3, place: t('Alimos Marina, Athens') },
    ],
    after: t('You get your IYT or RYA certificate on the last day. A week later we send your logbook summary and a suggestion for the next step: a first charter on one of our boats, or a training passage to build miles for Yachtmaster.'),
  },
  passage: {
    kind: 'passage', title: t('Training passage'), h1: t('Book a training passage'), img: IMG('1500375592092-40eb2168fd21'),
    back: [link('home.html') + '#passages', t('Back to all passages')], lead: t('One-way passages, Saturday to Saturday, with an instructor on board. Four places on each boat.'),
    dateLegend: t('Passage'), prep: link('home.html') + '#passages', options: LEGS, place: t('Ece Marina, Fethiye'),
    after: t('Your logged miles and night hours go into your logbook, signed by the instructor. When you have enough for Yachtmaster Coastal, we invite you to the exam week.'),
  },
};
const CABINS = [
  { id: 'shared', label: t('Shared double cabin'), sub: t('With another student of the same gender'), add: 0 },
  { id: 'two', label: t('Double cabin for two'), sub: t('For couples and friends booking together'), add: 0, min: 2 },
  { id: 'single', label: t('Cabin to yourself'), sub: t('Subject to availability'), add: 450 },
];

const item = CATALOG[q.get('item')] || CATALOG.bareboat;
const KEY = 'ryc-booking-' + (q.get('item') || 'bareboat');
const st = { step: 1, date: null, add: false, cabin: 'shared', ppl: 1, exp: null, plan: 'deposit', method: 'card' };
try { Object.assign(st, JSON.parse(sessionStorage.getItem(KEY) || '{}')); } catch (e) {}
const save = () => { try { sessionStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} };
const $ = (id) => document.getElementById(id);
const eur = (n) => '€' + n.toLocaleString('en-US').replace(/,/g, ' ');
const opt = (name, value, title, sub, end, checked, disabled, type = 'radio') =>
  `<label class="choice${type === 'checkbox' ? ' check' : ''}"><input type="${type}" name="${name}" value="${value}"${checked ? ' checked' : ''}${disabled ? ' disabled' : ''}><span class="dot"></span><b>${title}</b>${end ? `<span class="end">${end}</span>` : ''}<span class="sub">${sub}</span></label>`;

const pick = q.get('date') || q.get('id');
if (pick && item.options.some((o) => o.id === pick && o.left > 0)) st.date = pick;
if (!st.date) st.date = (item.options.find((o) => o.left > 0) || {}).id;
const cur = () => item.options.find((o) => o.id === st.date);
let showAll = !(q.get('date') || q.get('id'));
const pair = () => { const c = cur(); return c && c.pair ? item.options.find((o) => o.id === c.pair) : null; };

function totals() {
  const c = cur(); const cab = CABINS.find((x) => x.id === st.cabin);
  let base = c.price * st.ppl; const lines = [[`${c.label.split(' – ')[0]} · ${st.ppl} × ${eur(c.price)}`, base]];
  if (item.kind === 'passage' && st.add && pair()) { const p = pair(); lines.push([`${t('Return leg')} · ${st.ppl} × ${eur(p.price)}`, p.price * st.ppl]); base += p.price * st.ppl; }
  if (cab.add) { lines.push([t('Cabin to yourself'), cab.add]); base += cab.add; }
  const deposit = Math.round(base * 0.3);
  return { lines, total: base, deposit, now: st.plan === 'deposit' ? deposit : base };
}

function renderSummary() {
  const c = cur(); const tt = totals(); const cab = CABINS.find((x) => x.id === st.cabin);
  const html = `<div class="ph"><img src="${item.img}" alt=""></div>
    <div><div class="card-title">${item.title}</div><div class="card-meta" style="margin-top:4px">${item.kind === 'passage' ? c.route : c.sub}</div></div>
    <dl><dt>${t('Dates')}</dt><dd>${c.label}</dd><dt>${t('Cabin')}</dt><dd>${cab.label}</dd><dt>${t('People')}</dt><dd>${st.ppl}</dd>
    ${tt.lines.map(([k, v]) => `<dt>${k}</dt><dd>${eur(v)}</dd>`).join('')}</dl>
    <div class="line"></div>
    <div class="total"><span>${t('Total')}</span><b>${eur(tt.total)}</b></div>
    ${st.step >= 3 ? `<div class="total" style="margin-top:-6px"><span class="card-meta">${t('Due after confirmation')}</span><span><b style="font-size:20px">${eur(tt.now)}</b></span></div>` : `<span class="card-meta">${t('30% deposit to book, the rest 6 weeks before. No card fees.')}</span>`}
    <ul class="trust"><li><svg class="i"><use href="#ow-check"/></svg>${t('Free cancellation until 6 weeks before')}</li><li><svg class="i"><use href="#ow-check"/></svg>${t('Instructor checks your experience before payment')}</li><li><svg class="i"><use href="#ow-check"/></svg>${t('Questions? Ask the instructor in Telegram')}</li></ul>`;
  $('sumD').innerHTML = html; $('sumM').innerHTML = html;
  $('msumLabel').textContent = `${c.label.split(' – ')[0]} · ${st.ppl === 1 ? t('1 person') : t('{n} people', { n: st.ppl })}`;
  $('msumTotal').textContent = eur(tt.total);
}

function renderStep1() {
  $('lead1').textContent = item.lead; $('dateLegend').textContent = item.dateLegend;
  const collapsed = item.kind === 'passage' && !showAll;
  const list = collapsed ? [cur()] : item.options;
  $('dates').innerHTML = list.map((o) => opt('date', o.id, o.label, o.sub, `${eur(o.price)}<br><span class="avail${o.left === 0 ? ' full' : o.left <= 2 ? ' low' : ''}">${o.left === 0 ? t('Full') : o.left === 1 ? t('1 of 4 left') : t('{n} of 4 left', { n: o.left })}</span>`, o.id === st.date, o.left === 0)).join('') + (collapsed ? `<button class="linkbtn" type="button" id="showAll" style="justify-self:start;margin-top:4px">${t('Show all {n} passages', { n: item.options.length })}</button>` : '');
  if (collapsed) $('showAll').addEventListener('click', () => { showAll = true; renderStep1(); });
  const p = item.kind === 'passage' ? pair() : null;
  $('addFs').hidden = !p;
  if (p) $('adds').innerHTML = opt('add', '1', `${p.route}, ${p.label}`, t('Most people sail both ways: twice the miles, one flight'), `+${eur(p.price)}`, st.add, false, 'checkbox');
  $('cabins').innerHTML = CABINS.map((c) => opt('cabin', c.id, c.label, c.sub, c.add ? `+${eur(c.add)}` : t('Included'), c.id === st.cabin, false)).join('');
  const max = st.cabin === 'single' ? 1 : Math.min(cur().left, 4);
  st.ppl = Math.max(st.cabin === 'two' ? 2 : 1, Math.min(st.ppl, max));
  $('ppl').textContent = st.ppl; $('minus').disabled = st.ppl <= (st.cabin === 'two' ? 2 : 1); $('plus').disabled = st.ppl >= max;
  $('pplHint').textContent = (cur().left === 1 ? t('1 place left on this date.') : t('{n} places left on this date.', { n: cur().left })) + (st.cabin === 'two' ? ' ' + t('A double cabin is for two people.') : st.cabin === 'single' ? ' ' + t('A cabin to yourself is for one person.') : '');
}

function renderStep2() {
  const e = EXP[item.kind];
  $('expLegend').textContent = e.legend; $('expHint').textContent = e.hint;
  $('exp').innerHTML = e.opts.map(([v, ti, s]) => opt('exp', v, ti, s, '', st.exp === v, false)).join('');
  $('othersFs').hidden = st.ppl < 2;
  $('others').innerHTML = Array.from({ length: st.ppl - 1 }, (_, i) => `<div class="fld"><label for="o${i}">${t('Person {n}', { n: i + 2 })} <span class="opt-l">${t('(optional)')}</span></label><input id="o${i}" autocomplete="off" placeholder="${t('Full name')}"></div>`).join('');
}

function renderStep3() {
  const tt = totals();
  $('plan').innerHTML = opt('plan', 'deposit', t('Deposit {amount}', { amount: eur(tt.deposit) }), t('The rest, {amount}, is due 6 weeks before the start', { amount: eur(tt.total - tt.deposit) }), '', st.plan === 'deposit', false)
    + opt('plan', 'full', t('Pay in full {amount}', { amount: eur(tt.total) }), t('Nothing more to pay later'), '', st.plan === 'full', false);
  $('method').innerHTML = opt('method', 'card', t('Card, Apple Pay or Google Pay'), t('Visa, Mastercard. Secure 3-D Secure check'), '', st.method === 'card', false)
    + opt('method', 'bank', t('Bank transfer'), t('We hold your place for 3 days while the money arrives'), '', st.method === 'bank', false);
  $('payboxText').textContent = st.method === 'card' ? t('After we confirm your place, we send a secure card payment link. Nothing is charged today.') : t('After we confirm your place, we send the bank details and your booking reference.');
}

function renderDone() {
  const c = cur(); const tt = totals();
  const ref = 'OW-' + c.id.slice(2).replace(/-/g, '') + '-' + String(47 + st.ppl).padStart(3, '0');
  $('ref').textContent = ref;
  const email = $('email').value || t('your email');
  $('doneLead').textContent = `${item.title}, ${c.label}${c.label.endsWith('.') ? '' : '.'} ${t('Nothing has been charged.')} ${t('Your first payment will be {amount}.', { amount: eur(tt.now) })} ${t('We will check availability and send payment details to {email} within one working day.', { email })}`;
  const place = c.place || item.place;
  const steps = [
    [t('Today'), t('Request received'), t('We check the boat and the instructor and reply within one working day.')],
    [t('Within a day'), t('Confirmation and payment link'), st.method === 'bank' ? t('We email the bank details and your booking reference.') : t('We email a secure card payment link and your booking reference.')],
    [t('After payment'), t('Your instructor writes'), t('A hello in Telegram or WhatsApp, and a quick check of your experience.')],
    ...(st.plan === 'deposit' ? [[t('6 weeks before'), t('Balance of {amount}', { amount: eur(tt.total - tt.deposit) }), t('We send a payment link a week before it is due. No card fees.')]] : []),
    [t('2 weeks before'), t('Joining instructions'), t('Marina, berth, what to bring, flights and transfers. Meeting point: {place}.', { place })],
    [t('Day 1'), t('Aboard at 15:00'), t('Safety briefing, cabins, dinner together. You sail on Sunday morning.')],
  ];
  $('timeline').innerHTML = steps.map(([w, b, p]) => `<li><span class="when">${w}</span><div><b>${b}</b><p>${p}</p></div></li>`).join('');
  $('afterText').textContent = item.after;
  $('prep').href = item.prep;
  const d = c.id.replace(/-/g, '');
  const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Ocean Way//Booking//EN\nBEGIN:VEVENT\nUID:${ref}@oceanway\nDTSTART;VALUE=DATE:${d}\nSUMMARY:${item.title} (${ref})\nLOCATION:${place}\nEND:VEVENT\nEND:VCALENDAR`;
  $('ics').href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics);
}

function validate(step) {
  const errs = [];
  document.querySelectorAll('.fld.bad').forEach((f) => f.classList.remove('bad'));
  if (step === 2) {
    [['fname', (v) => v.trim()], ['lname', (v) => v.trim()], ['email', (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)], ['phone', (v) => v.replace(/\D/g, '').length >= 7]].forEach(([id, ok]) => {
      const el = $(id); if (!ok(el.value)) { el.closest('.fld').classList.add('bad'); el.setAttribute('aria-invalid', 'true'); errs.push([id, el.closest('.fld').querySelector('.err').textContent]); } else el.removeAttribute('aria-invalid');
    });
    if (!st.exp) errs.push(['exp', t('Choose your experience')]);
  }
  if (step === 3 && !$('terms').checked) { $('termsFld').classList.add('bad'); errs.push(['terms', t('Please accept the booking terms')]); }
  $('errlist').innerHTML = errs.map(([id, m]) => `<li><a href="#${id}">${m}</a></li>`).join('');
  $('errsum').classList.toggle('on', errs.length > 0);
  if (errs.length) $('errsum').focus();
  return !errs.length;
}

function go(step, focus = true) {
  st.step = step; save();
  document.querySelectorAll('[data-step]').forEach((s) => { s.hidden = Number(s.dataset.step) !== step; });
  $('form').hidden = step === 4; $('done').hidden = step !== 4;
  document.querySelectorAll('#steps li').forEach((li) => { const n = Number(li.dataset.s); li.className = n < step ? 'done' : n === step ? 'now' : ''; if (n === step) li.setAttribute('aria-current', 'step'); else li.removeAttribute('aria-current'); });
  $('errsum').classList.remove('on');
  const tt = totals();
  $('prev').style.visibility = step === 1 ? 'hidden' : 'visible';
  $('h1').textContent = step === 4 ? t('Booking request received') : item.h1; $('back').hidden = step === 4; $('steps').hidden = step === 4;
  $('next').textContent = step === 1 ? t('Continue to your details') : step === 2 ? t('Continue to payment') : t('Send booking request');
  if (step === 1) renderStep1(); if (step === 2) renderStep2(); if (step === 3) renderStep3(); if (step === 4) renderDone();
  renderSummary();
  document.title = ['', t('Choose dates'), t('Your details'), t('Payment'), t('Booking request received')][step] + ' · ' + item.title + ' · Ocean Way';
  if (focus) { window.scrollTo({ top: 0, behavior: 'smooth' }); const h = step === 4 ? $('t4') : $('t' + step); h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
}

document.querySelectorAll('.lang-menu a').forEach((el) => { el.href = el.getAttribute('href') + location.search; });
document.querySelectorAll('a[href]:not(.lang-menu a)').forEach((el) => { const h = el.getAttribute('href'); if (/^(home|bareboat-skipper-course|booking)\.html/.test(h)) el.setAttribute('href', link(h.split('#')[0].split('?')[0]) + h.slice(h.split('#')[0].split('?')[0].length)); });
$('h1').textContent = item.h1; $('back').href = item.back[0]; $('back').querySelector('span').textContent = item.back[1];
$('form').addEventListener('change', (e) => {
  const n = e.target.name;
  if (n === 'date') { st.date = e.target.value; st.add = false; renderStep1(); }
  if (n === 'add') st.add = e.target.checked;
  if (n === 'cabin') { st.cabin = e.target.value; renderStep1(); }
  if (n === 'exp') st.exp = e.target.value;
  if (n === 'plan') { st.plan = e.target.value; renderStep3(); go(3, false); }
  if (n === 'method') { st.method = e.target.value; renderStep3(); go(3, false); }
  save(); renderSummary();
});
document.querySelectorAll('.fld input').forEach((el) => el.addEventListener('blur', () => { if (el.closest('.fld').classList.contains('bad')) validate(st.step); }));
$('minus').addEventListener('click', () => { st.ppl--; renderStep1(); renderSummary(); save(); });
$('plus').addEventListener('click', () => { st.ppl++; renderStep1(); renderSummary(); save(); });
$('prev').addEventListener('click', () => go(Math.max(1, st.step - 1)));
$('form').addEventListener('submit', (e) => { e.preventDefault(); if (validate(st.step)) go(st.step + 1); });

if (q.get('demo')) { $('fname').value = 'Anna'; $('lname').value = 'Sokolova'; $('email').value = 'anna@example.com'; $('phone').value = '+357 99 123 456'; st.exp = st.exp || (item.kind === 'course' ? 'some' : 'day'); }
go(Number(q.get('step')) || 1, false);
