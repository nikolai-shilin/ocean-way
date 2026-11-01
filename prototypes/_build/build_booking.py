"""booking.html: one checkout for courses and training passages (dates and cabin → your details → payment → confirmation).
Shares the head CSS, icons, header and footer of the course page."""
P = '/Users/shilin/Developer/ocean-way/prototypes'
src = open(P + '/bareboat-skipper-course.html').read()

style = src[src.index('<style>') + 7: src.index('</style>')]
sprite = src[src.index('<body>') + 6: src.index('<div class="wrap">')]
header = src[src.index('<header class="site-head">'): src.index('</header>') + 9]
header = header.replace('<a class="navl on" href="home.html#courses">Courses</a>', '<a class="navl" href="home.html#courses">Courses</a>')
footer = src[src.index('<footer class="site-foot">'): src.index('</footer>') + 9]

css = r'''
/* ---------- Booking ---------- */
[hidden] { display: none !important; }
.steps li span { white-space: nowrap; }
.bk { display: grid; grid-template-columns: minmax(0, 1fr) 380px; gap: 48px; align-items: start; margin-top: 16px; }
.bk-back { display: inline-flex; align-items: center; gap: 6px; font-family: var(--sans); font-weight: 700; font-size: 15px; color: var(--ink); }
.bk-back svg.i { width: 16px; height: 16px; transform: scaleX(-1); }
.bk h1 { font-family: var(--title); font-weight: var(--title-w); letter-spacing: var(--trk-1); font-size: 44px; line-height: .98; margin: 14px 0 0; }
.steps { display: flex; gap: 8px; list-style: none; margin: 24px 0 32px; padding: 0; counter-reset: s; }
.steps li { flex: 1; display: flex; flex-direction: column; gap: 8px; font-family: var(--sans); font-weight: 700; font-size: 13px; color: var(--faint); }
.steps li::before { content: ""; height: 4px; border-radius: 2px; background: var(--line); }
.steps li.done, .steps li.now { color: var(--ink); }
.steps li.done::before { background: var(--ink); }
.steps li.now::before { background: var(--accent); }
.step-title { font-family: var(--title); font-weight: var(--title-w); letter-spacing: var(--trk-2); font-size: 30px; line-height: 1.05; margin: 0 0 6px; }
.step-lead { margin: 0 0 24px; color: var(--muted); font-size: 17px; }
fieldset { border: 0; margin: 0 0 32px; padding: 0; min-width: 0; }
legend { font-family: var(--sans); font-weight: 700; font-size: 18px; padding: 0; margin: 0 0 12px; }
.choices { display: grid; gap: 10px; }
.choice { position: relative; display: grid; grid-template-columns: 22px minmax(0, 1fr) auto; gap: 4px 14px; align-items: start; padding: 16px 18px; border: 2px solid var(--tag-line); border-radius: 22px; cursor: pointer; background: var(--bg); }
.choice:hover { border-color: var(--muted); }
.choice input { position: absolute; opacity: 0; pointer-events: none; }
.choice .dot { grid-row: span 2; width: 22px; height: 22px; border-radius: 50%; border: 2px solid var(--tag-line); margin-top: 1px; }
.choice.check .dot { border-radius: 7px; }
.choice b { font-family: var(--sans); font-size: 17px; line-height: 1.25; }
.choice .sub { grid-column: 2; font-size: 14px; line-height: 1.3; color: var(--muted); }
.choice .end { grid-row: span 2; text-align: right; font-family: var(--sans); font-size: 16px; white-space: nowrap; }
.choice .end .avail { margin-top: 6px; }
.choice:has(input:checked) { border-color: var(--ink); box-shadow: inset 0 0 0 1px var(--ink); }
.choice:has(input:checked) .dot { border-color: var(--ink); background: radial-gradient(circle, var(--ink) 0 5px, transparent 6px); }
.choice.check:has(input:checked) .dot { background: var(--ink); box-shadow: inset 0 0 0 3px var(--bg); }
.choice:has(input:disabled) { cursor: not-allowed; opacity: .5; }
.choice:has(input:focus-visible) { outline: 2px solid var(--accent); outline-offset: 2px; }
.stepper { display: inline-flex; align-items: center; gap: 14px; }
.stepper output { min-width: 2ch; text-align: center; font-family: var(--sans); font-weight: 700; font-size: 20px; }
.stepper .round:disabled { opacity: .35; cursor: default; }
.hint { font-size: 14px; line-height: 1.35; color: var(--muted); margin: 8px 0 0; }
.grid2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.fld { display: flex; flex-direction: column; gap: 6px; }
.fld label { font-family: var(--sans); font-weight: 700; font-size: 14px; }
.fld label .opt-l { font-weight: 400; color: var(--muted); }
.fld input, .fld select { height: 52px; padding: 0 16px; border: 2px solid var(--tag-line); border-radius: 16px; background: var(--bg); color: var(--ink); font: 400 17px var(--sans); }
.fld input:focus, .fld select:focus { outline: none; border-color: var(--accent); }
.fld.bad input, .fld.bad select { border-color: #d0342c; }
.fld .err { display: none; font-size: 14px; color: #d0342c; }
.fld.bad .err { display: block; }
.errsum { display: none; margin: 0 0 24px; padding: 16px 20px; border: 2px solid #d0342c; border-radius: 22px; }
.errsum.on { display: block; }
.errsum b { display: block; margin-bottom: 6px; }
.errsum ul { margin: 0; padding-left: 18px; }
.errsum a { color: #d0342c; text-decoration: underline; }
.tick { display: flex; gap: 12px; align-items: flex-start; font-size: 16px; line-height: 1.35; cursor: pointer; }
.tick input { width: 22px; height: 22px; margin: 0; flex: none; accent-color: var(--ink); }
.paybox { border: 2px dashed var(--tag-line); border-radius: 22px; padding: 20px; color: var(--muted); font-size: 15px; display: flex; gap: 12px; align-items: center; margin-top: 12px; }
.nav-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-top: 8px; padding-top: 24px; border-top: 1px solid var(--line); }
.nav-row .pill-primary { min-width: 240px; }
.linkbtn { background: none; border: 0; padding: 0; font: 700 16px var(--sans); color: var(--ink); cursor: pointer; text-decoration: underline; text-underline-offset: 3px; }
.sum { position: sticky; top: 24px; padding: 24px; display: flex; flex-direction: column; gap: 14px; }
.sum .ph { aspect-ratio: 16 / 10; border-radius: 22px; overflow: hidden; }
.sum .ph img { width: 100%; height: 100%; object-fit: cover; display: block; }
.sum dl { margin: 0; display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 8px 16px; font-size: 15px; }
.sum dt { color: var(--muted); }
.sum dd { margin: 0; text-align: right; }
.sum .line { border-top: 1px solid var(--tag-line); }
.sum .total { display: flex; justify-content: space-between; align-items: baseline; }
.sum .total b { font-family: var(--title); font-weight: var(--title-w); font-size: 30px; letter-spacing: var(--title-track); font-variant-numeric: lining-nums; }
.sum .trust { display: grid; gap: 8px; font-size: 14px; color: var(--muted); list-style: none; padding: 0; margin: 0; }
.sum .trust li { display: flex; gap: 8px; align-items: flex-start; }
.sum .trust svg.i { width: 16px; height: 16px; color: var(--accent); margin-top: 1px; flex: none; }
.done-hero { display: flex; flex-direction: column; gap: 12px; }
.done-mark { width: 56px; height: 56px; border-radius: 50%; background: var(--accent); color: var(--on-accent); display: inline-flex; align-items: center; justify-content: center; }
.done-mark svg.i { width: 28px; height: 28px; stroke-width: 2.4; }
.ref { font-family: var(--sans); font-weight: 700; letter-spacing: .04em; }
.timeline { list-style: none; margin: 8px 0 32px; padding: 0; display: grid; gap: 0; }
.timeline li { display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: 16px; padding: 16px 0; border-bottom: 1px solid var(--line); }
.timeline .when { font-family: var(--sans); font-weight: 700; font-size: 14px; color: var(--muted); text-transform: uppercase; letter-spacing: .02em; }
.timeline b { display: block; font-size: 17px; }
.timeline p { margin: 2px 0 0; color: var(--muted); font-size: 15px; line-height: 1.35; }
.acts { display: flex; flex-wrap: wrap; gap: 12px; }
.msum { display: none; }
@supports (corner-shape: squircle) { .choice, .paybox, .errsum, .fld input, .fld select, .sum .ph { corner-shape: squircle; } .choice, .paybox, .errsum { border-radius: 38px; } .fld input, .fld select { border-radius: 28px; } .sum .ph { border-radius: 38px; } }
@media (max-width: 960px) {
  .bk { grid-template-columns: minmax(0, 1fr); gap: 0; }
  .bk aside { display: none; }
  .msum { display: block; margin: 0 0 24px; }
  .msum summary { list-style: none; display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 14px 18px; cursor: pointer; font-family: var(--sans); font-size: 16px; }
  .msum summary::-webkit-details-marker { display: none; }
  .msum summary b { font-size: 18px; }
  .msum .sum { position: static; padding: 0 18px 18px; }
  .msum .sum .ph { display: none; }
}
@media (max-width: 680px) {
  .bk h1 { font-size: 36px; }
  .steps li span { display: none; }
  .steps li.now span { display: inline; }
  .grid2 { grid-template-columns: minmax(0, 1fr); }
  .timeline li { grid-template-columns: minmax(0, 1fr); gap: 4px; }
  .nav-row { position: sticky; bottom: 0; background: var(--bg); padding: 12px 0 calc(12px + env(safe-area-inset-bottom, 0px)); margin-inline: -20px; padding-inline: 20px; z-index: 5; }
  .nav-row .pill-primary { min-width: 0; flex: 1; }
  .choice { padding: 14px 16px; }
}
'''

main = r'''
<main>
  <div class="bk">
    <div>
      <a class="bk-back" id="back" href="bareboat-skipper-course.html#dates"><svg class="i"><use href="#i-arrow"/></svg><span>Back to the course</span></a>
      <h1 id="h1">Book your place</h1>
      <ol class="steps" id="steps" aria-label="Booking steps">
        <li data-s="1"><span>1 · Dates</span></li><li data-s="2"><span>2 · Your details</span></li><li data-s="3"><span>3 · Payment</span></li><li data-s="4"><span>4 · Done</span></li>
      </ol>
      <details class="msum band" id="msum"><summary><span id="msumLabel">Your booking</span><b id="msumTotal"></b></summary><div class="sum" id="sumM"></div></details>
      <div class="errsum" id="errsum" role="alert" tabindex="-1"><b>Please check these fields</b><ul id="errlist"></ul></div>
      <form id="form" novalidate>
        <section data-step="1" aria-labelledby="t1">
          <h2 class="step-title" id="t1">Choose dates</h2>
          <p class="step-lead" id="lead1"></p>
          <fieldset><legend id="dateLegend">Start date</legend><div class="choices" id="dates"></div></fieldset>
          <fieldset id="addFs" hidden><legend>Add the return leg</legend><div class="choices" id="adds"></div></fieldset>
          <fieldset><legend>Cabin</legend><div class="choices" id="cabins"></div></fieldset>
          <fieldset><legend>People</legend>
            <div class="stepper"><button class="round" type="button" id="minus" aria-label="One person fewer">−</button><output id="ppl" aria-live="polite">1</output><button class="round" type="button" id="plus" aria-label="One more person">+</button></div>
            <p class="hint" id="pplHint"></p>
          </fieldset>
        </section>

        <section data-step="2" aria-labelledby="t2" hidden>
          <h2 class="step-title" id="t2">Your details</h2>
          <p class="step-lead">No account needed. We use these to confirm the booking and to put you in touch with your instructor.</p>
          <fieldset><legend>Lead person</legend>
            <div class="grid2">
              <div class="fld"><label for="fname">First name</label><input id="fname" name="fname" autocomplete="given-name" required><span class="err">Enter your first name</span></div>
              <div class="fld"><label for="lname">Last name</label><input id="lname" name="lname" autocomplete="family-name" required><span class="err">Enter your last name</span></div>
              <div class="fld"><label for="email">Email</label><input id="email" name="email" type="email" autocomplete="email" inputmode="email" required><span class="err">Enter an email like name@example.com</span></div>
              <div class="fld"><label for="phone">Phone</label><input id="phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" required><span class="err">Enter a phone number with country code</span></div>
              <div class="fld"><label for="tg">Telegram <span class="opt-l">(optional)</span></label><input id="tg" name="tg" autocomplete="off" placeholder="@username"></div>
              <div class="fld"><label for="country">Country</label><select id="country" name="country" autocomplete="country-name"><option>Cyprus</option><option>Germany</option><option>Israel</option><option>Russia</option><option>Serbia</option><option>Turkey</option><option>United Kingdom</option><option>Other</option></select></div>
            </div>
          </fieldset>
          <fieldset><legend id="expLegend">Sailing experience</legend><div class="choices" id="exp"></div><p class="hint" id="expHint"></p></fieldset>
          <fieldset id="othersFs"><legend>Other people <span class="opt-l" style="font-weight:400;color:var(--muted)">(you can add names later)</span></legend><div class="grid2" id="others"></div></fieldset>
          <label class="tick"><input type="checkbox" id="news"> Send me new course dates and free places, about twice a month</label>
        </section>

        <section data-step="3" aria-labelledby="t3" hidden>
          <h2 class="step-title" id="t3">Payment</h2>
          <p class="step-lead">Nothing is charged now. We confirm your place first, then send you a payment link or bank details.</p>
          <fieldset><legend>What you pay first</legend><div class="choices" id="plan"></div></fieldset>
          <fieldset><legend>Method</legend><div class="choices" id="method"></div>
            <div class="paybox" id="paybox"><svg class="i"><use href="#i-info"/></svg><span id="payboxText">After we confirm your place, we send a secure card payment link. Nothing is charged today.</span></div>
          </fieldset>
          <fieldset><legend>Cancellation</legend><p style="margin:0 0 14px;font-size:16px">Free cancellation until 6 weeks before the start. After that the deposit is kept, or you can move it to another date in the same year once.</p>
            <label class="tick"><input type="checkbox" id="terms" required> I agree to the <a href="#" style="text-decoration:underline">booking terms</a> and the <a href="#" style="text-decoration:underline">privacy policy</a></label>
            <div class="fld" id="termsFld"><span class="err">Please accept the booking terms</span></div>
          </fieldset>
        </section>

        <div class="nav-row" id="navRow">
          <button class="linkbtn" type="button" id="prev">Back</button>
          <button class="pill pill-primary" type="submit" id="next">Continue</button>
        </div>
      </form>

      <section id="done" hidden aria-labelledby="t4">
        <div class="done-hero">
          <span class="done-mark"><svg class="i"><use href="#i-check"/></svg></span>
          <h2 class="step-title" id="t4" tabindex="-1">Request received</h2>
          <p class="step-lead" style="margin:0" id="doneLead"></p>
          <span class="meta">Booking reference <span class="ref" id="ref"></span></span>
        </div>
        <h3 class="h3" style="margin:40px 0 4px">What happens next</h3>
        <ol class="timeline" id="timeline"></ol>
        <div class="acts">
          <a class="pill pill-primary" id="ics" download="ocean-way-booking.ics" href="#"><svg class="i"><use href="#i-cal"/></svg>Add to calendar</a>
          <a class="pill pill-quiet" href="#"><svg class="i"><use href="#i-tg"/></svg>Join the course chat</a>
          <a class="pill pill-quiet" id="prep" href="bareboat-skipper-course.html#prepare">What to bring</a>
        </div>
        <div class="band" style="padding:24px 28px;margin-top:40px">
          <span class="kicker">After the course</span>
          <p style="margin:10px 0 0;font-size:17px" id="afterText"></p>
        </div>
      </section>
    </div>
    <aside aria-label="Booking summary"><div class="sum band" id="sumD"></div></aside>
  </div>
</main>
'''

js = r'''
<script>
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
    kind: 'course', title: t('Bareboat Skipper course'), h1: t('Book the Bareboat Skipper course'), img: IMG('1540946485063-a40da27545f8'),
    back: [link('bareboat-skipper-course.html') + '#dates', t('Back to the course')], lead: t('Saturday to Saturday, living aboard with an instructor and at most four students.'),
    dateLegend: t('Start date'), prep: link('bareboat-skipper-course.html') + '#prepare',
    options: [
      { id: '2027-05-01', label: t('Sat 1 May – Sat 8 May'), sub: t('Saronic Gulf, Greece · Bavaria C42'), price: 1590, left: 2, place: t('Alimos Marina, Athens') },
      { id: '2027-05-22', label: t('Sat 22 May – Sat 29 May'), sub: t('Saronic Gulf, Greece · Bavaria C42'), price: 1590, left: 0, place: t('Alimos Marina, Athens') },
      { id: '2027-06-12', label: t('Sat 12 Jun – Sat 19 Jun'), sub: t('Split, Croatia · Dufour 430'), price: 1690, left: 4, place: t('ACI Marina Split') },
      { id: '2027-09-11', label: t('Sat 11 Sep – Sat 18 Sep'), sub: t('Saronic Gulf, Greece · Bavaria C42'), price: 1590, left: 3, place: t('Alimos Marina, Athens') },
      { id: '2027-10-02', label: t('Sat 2 Oct – Sat 9 Oct'), sub: t('Split, Croatia · Dufour 430'), price: 1490, left: 4, place: t('ACI Marina Split') },
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
    <ul class="trust"><li><svg class="i"><use href="#i-check"/></svg>${t('Free cancellation until 6 weeks before')}</li><li><svg class="i"><use href="#i-check"/></svg>${t('Instructor checks your experience before payment')}</li><li><svg class="i"><use href="#i-check"/></svg>${t('Questions? Ask the instructor in Telegram')}</li></ul>`;
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
</script>
'''

head = (src[:src.index('<title>')]
        + '<title>Book your place · Ocean Way</title>\n<meta name="robots" content="noindex, follow">\n'
        + '<meta name="description" content="Book a course or training passage with Ocean Way: choose dates and cabin, add your details, pay a 30% deposit.">\n'
        + src[src.index('<link rel="preconnect"'):src.index('<style>')])
html = head + '<style>' + style + css + '</style>\n</head>\n<body>' + sprite + '<div class="wrap">\n  ' + header + '\n' + main + '\n  ' + footer + '\n</div>\n' + js + '</body>\n</html>\n'
open(P + '/booking.html', 'w').write(html)
print('ok', len(html))
