"""user-flows.html: the journeys from search to the next booking, with the UX and SEO decisions per step."""
import html as H
P = '/Users/shilin/Developer/ocean-way/prototypes'
src = open(P + '/home.html').read()
style = src[src.index('<style>') + 7: src.index('</style>')]
sprite_start = src.index('<body>') + 6
sprite = src[sprite_start: src.index('<div class="wrap">')]
header = src[src.index('<header class="site-head">'): src.index('</header>') + 9]
header = header.replace('href="#courses"', 'href="home.html#courses"').replace('href="#passages"', 'href="home.html#passages"').replace('href="#fleet"', 'href="home.html#fleet"').replace('href="#how"', 'href="home.html#how"')
footer = src[src.index('<footer class="site-foot">'): src.index('</footer>') + 9]

CSS = r'''
/* ---------- Flows ---------- */
.lc { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 0; margin: 8px 0 0; padding: 0; list-style: none; }
.lc li { position: relative; padding: 18px 16px 0 0; border-top: 4px solid var(--line); display: flex; flex-direction: column; gap: 4px; }
.lc li.on { border-top-color: var(--accent); }
.lc b { font-family: var(--sans); font-size: 17px; }
.lc span { font-size: 14px; line-height: 1.3; color: var(--muted); }
.jhead { display: flex; justify-content: space-between; align-items: flex-end; gap: 24px; }
.persona { max-width: 64ch; margin: 0 0 24px; font-size: 18px; line-height: 1.4; }
.flow { --gpad: max(24px, calc((100vw - 1180px) / 2 + 24px)); display: flex; align-items: stretch; gap: 0; overflow-x: auto; scroll-snap-type: x proximity; scroll-padding: 0 var(--gpad); padding: 4px var(--gpad) 12px; margin: 0 calc(50% - 50vw); scrollbar-width: thin; }
.fstep { flex: none; width: 300px; scroll-snap-align: start; display: flex; flex-direction: column; gap: 10px; padding: 20px 22px; border: 2px solid var(--tag-line); border-radius: 28px; background: var(--bg); }
.fstep.built { border-color: var(--ink); }
.fstep .stage { font-family: var(--sans); font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: .04em; color: var(--accent); }
.fstep h3 { margin: 0; font-family: var(--sans); font-weight: 700; font-size: 19px; line-height: 1.2; }
.fstep h3 a { text-decoration: underline; text-underline-offset: 3px; }
.fstep .want { margin: 0; font-size: 15px; line-height: 1.35; }
.fstep dl { margin: 4px 0 0; display: grid; gap: 8px; }
.fstep dt { font-family: var(--sans); font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); }
.fstep dd { margin: 0; font-size: 14px; line-height: 1.35; color: var(--ink); }
.fstep > .tag-built, .fstep > .tag-todo { align-self: flex-start; margin-top: auto; }
.arrow { flex: none; width: 36px; display: flex; align-items: center; justify-content: center; color: var(--faint); }
.arrow svg.i { width: 20px; height: 20px; }
.tag-built { display: inline-flex; align-items: center; height: 26px; padding: 0 10px; border-radius: 13px; font-family: var(--sans); font-weight: 700; font-size: 12px; background: var(--sel-bg); color: var(--sel-ink); }
.tag-todo { display: inline-flex; align-items: center; height: 26px; padding: 0 10px; border-radius: 13px; font-family: var(--sans); font-weight: 700; font-size: 12px; background: var(--band); color: var(--muted); }
.legend { display: flex; gap: 16px; flex-wrap: wrap; align-items: center; font-size: 14px; color: var(--muted); }
.cols2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.cols2 .band { padding: 28px; }
.cols2 h3 { margin: 0 0 14px; font-family: var(--sans); font-weight: 700; font-size: 18px; }
.cl { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.cl li { display: grid; grid-template-columns: 20px minmax(0, 1fr); gap: 10px; font-size: 15px; line-height: 1.35; }
.cl svg.i { width: 18px; height: 18px; margin-top: 1px; color: var(--accent); }
.cl.todo svg.i { color: var(--faint); }
.cl b { font-weight: 700; }
.tbl code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; }
.tbl td { vertical-align: top; }
@supports (corner-shape: squircle) { .fstep { corner-shape: squircle; border-radius: 48px; } }
@media (max-width: 900px) { .lc { grid-template-columns: repeat(3, minmax(0, 1fr)); row-gap: 20px; } .cols2 { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 680px) { .flow { --gpad: 20px; } .fstep { width: 270px; } .lc { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
'''

ARROW = '<span class="arrow" aria-hidden="true"><svg class="i"><use href="#ow-arrow"/></svg></span>'

def step(stage, page, href, want, ux, seo, built):
    title = f'<a href="{href}">{page}</a>' if href else page
    tag = '<span class="tag-built">In the prototype</span>' if built else '<span class="tag-todo">To build</span>'
    seo_dd = f'<dt>SEO</dt><dd>{seo}</dd>' if seo else ''
    return f'''<article class="fstep{' built' if built else ''}"><span class="stage">{stage}</span><h3>{title}</h3><p class="want">{want}</p>
<dl><dt>UX</dt><dd>{ux}</dd>{seo_dd}</dl>{tag}</article>'''

JOURNEYS = [
  ('course', 'Course: from a search to a certificate', 'Someone with a few days of crew experience who wants to charter on their own. Searches “bareboat skipper course Greece”, compares two or three schools, books for spring.', [
    ('Discover', 'Google search', None, 'Find a course that fits: where, when, how much, which certificate.', 'The result shows dates and price before the click.', 'Unique title with place and year; description with price “from €1 490”; Course + CourseInstance data for course rich results.', True),
    ('Decide', 'Course page', 'bareboat-skipper-course.html', 'Check the week day by day, the route, what is included and whether the certificate is accepted.', 'Price and next date in the sticky booking card and mobile bar; route map; FAQ answers the doubts.', 'One H1, breadcrumbs, canonical, hreflang for en/ru/de/es, FAQPage, internal links to related courses.', True),
    ('Decide', 'Pick a date', 'bareboat-skipper-course.html#dates', 'Choose a week with places left.', 'Every date row has its own Book button; full dates offer a waitlist instead of a dead end.', 'Dates are HTML text, not an image, so they can be indexed and quoted.', True),
    ('Book', 'Dates and cabin', 'booking.html?item=bareboat&date=2027-05-01', 'Confirm the week, cabin and number of people.', 'The date from the course page is already selected; total updates live; no account.', 'Booking pages: noindex, follow.', True),
    ('Book', 'Your details', 'booking.html?item=bareboat&date=2027-05-01&step=2&demo=1', 'Give contact details and experience.', 'Autocomplete and input types; inline errors plus an error summary; experience checked by the instructor before payment.', '', True),
    ('Book', 'Payment', 'booking.html?item=bareboat&date=2027-05-01&step=3&demo=1', 'Pay a deposit and know what happens if plans change.', '30% deposit or full; card, Apple/Google Pay or bank transfer; cancellation terms next to the button.', '', True),
    ('Book', 'Confirmation', 'booking.html?item=bareboat&date=2027-05-01&step=4&demo=1', 'Know it worked and what comes next.', 'Reference, timeline until day 1, add to calendar, join the course chat, what to bring.', 'Purchase event for analytics.', True),
    ('Prepare', 'Emails and chat', None, 'Feel looked after before the trip.', 'Instructor says hello within a day; balance link 6 weeks before; joining instructions 2 weeks before.', '', False),
    ('Sail', 'The course week', None, 'Learn, pass, enjoy.', 'Daily plan in the chat; logbook signed every day.', '', False),
    ('Return', 'After the course', None, 'Use the certificate and keep sailing.', 'Certificate, logbook summary, and one clear next step: a training passage or a first charter on one of our boats.', 'A short trip report (with consent) can become a blog post that links back to the course.', False),
  ]),
  ('passage', 'Training passage: building miles for Yachtmaster', 'Holds a Bareboat or Day Skipper certificate and needs sea miles and night hours. Finds the passages through search, Telegram or the course follow-up email.', [
    ('Discover', 'Search, Telegram, follow-up email', None, '“Sea miles for Yachtmaster in Turkey”, or a new dates post in Telegram.', 'Every post links to the exact passage, not to the home page.', 'A hub page per season, one page per passage: route, miles, nights, dates.', False),
    ('Decide', 'Passages on the home page', 'home.html#passages', 'See all routes and dates at once.', 'Map plus table; hovering a row highlights its leg; a Book button on every row.', 'The table is real HTML; the map is inline SVG with a text description.', True),
    ('Book', 'Choose the passage', 'booking.html?item=passage&id=2027-06-12', 'Book the chosen leg, maybe both ways.', 'Only the chosen passage is shown, with “Show all 16” to change; the return leg is one tick away.', 'noindex, follow.', True),
    ('Book', 'Details and sea time', 'booking.html?item=passage&id=2027-06-12&step=2&demo=1', 'Tell the instructor their level.', 'Sea-time question instead of “experience”; watches, also at night, are said up front.', '', True),
    ('Book', 'Payment and confirmation', 'booking.html?item=passage&id=2027-06-12&step=4&demo=1', 'Pay and get the joining port and date.', 'Same checkout as the courses, so returning students know it.', '', True),
    ('Return', 'Logbook and exam invite', None, 'Get the miles signed and know when they are enough.', 'Miles and night hours added to the logbook; invite to a Yachtmaster exam week when the numbers are there.', '', False),
  ]),
  ('first', 'First-timer: never sailed', 'Wants a sailing holiday that teaches something. Searches “learn to sail Turkey” or “sailing course for beginners”.', [
    ('Discover', 'Search', None, 'Find out whether a beginner can join.', '', 'Course page for Introduction to Yachting with “no experience needed” in the title and description.', False),
    ('Decide', 'Home page, courses row', 'home.html#courses', 'See where to start.', 'Courses in IYT order, from VHF up; the beginner course says “No experience needed”.', 'ItemList of Course on the home page.', True),
    ('Decide', 'FAQ: “I’ve never sailed”', 'home.html#faq', 'Get a straight answer.', 'Points to Introduction to Yachting plus the one-day VHF course.', 'FAQPage data.', True),
    ('Book', 'Booking', 'booking.html?item=bareboat', 'Book without fear of being out of depth.', 'Experience question: “I have never sailed” leads to a suggestion of the right course, with nothing to pay.', '', True),
    ('Return', 'Next step', None, 'Move up a level next season.', 'Follow-up email after the week suggests Bareboat Skipper with the student’s own dates.', '', False),
  ]),
]

def journey(key, title, persona, steps):
    row = ARROW.join(step(*s) for s in steps)
    return f'''
    <section class="sec" id="{key}" style="margin-top:88px">
      <div class="sec-head"><span class="kicker">Journey</span><h2 class="h2">{title}</h2></div>
      <p class="persona">{persona}</p>
      <div class="flow" tabindex="0" aria-label="{H.escape(title)}">{row}</div>
    </section>'''

PAGES = [
    ('Home', '<code>/en/</code>', 'Index', 'IYT Sailing Courses and Training Passages · Ocean Way', 'Organization, WebSite, ItemList of Course, FAQPage', 'Courses row, passages Book', True),
    ('Course', '<code>/en/courses/bareboat-skipper/</code>', 'Index', '{Course} in {places}, {year} · Ocean Way', 'Course with CourseInstance and Offer per date, BreadcrumbList, FAQPage', 'Book a date', True),
    ('Courses hub', '<code>/en/courses/</code>', 'Index', 'IYT Sailing Courses: VHF to Yachtmaster · Ocean Way', 'ItemList of Course, BreadcrumbList', 'Open a course', False),
    ('Passages hub', '<code>/en/passages/2027/</code>', 'Index', 'Training Passages 2027: Turkey and Northern Cyprus · Ocean Way', 'ItemList, BreadcrumbList', 'Book a passage', False),
    ('Passage', '<code>/en/passages/kusadasi-istanbul-2027-06/</code>', 'Index', '{From} to {To} training passage, {month year} · Ocean Way', 'Event or Product with Offer, BreadcrumbList', 'Book', False),
    ('Booking', '<code>/en/booking?item=…</code>', 'noindex, follow', 'Step name · item · Ocean Way', 'None', 'Continue, Pay', True),
    ('Confirmation', '<code>/en/booking/done</code>', 'noindex, nofollow', 'Booking confirmed · Ocean Way', 'None (purchase event in analytics)', 'Add to calendar', True),
]
page_rows = ''.join(f'<tr><td><b>{n}</b><span class="sub">{"In the prototype" if b else "To build"}</span></td><td>{u}</td><td>{i}</td><td class="wrap-c">{t}</td><td class="wrap-c">{s}</td><td>{c}</td></tr>' for n, u, i, t, s, c, b in PAGES)

def cl(items, todo=False):
    icon = 'ow-minus' if todo else 'ow-check'
    return f'<ul class="cl{" todo" if todo else ""}">' + ''.join(f'<li><svg class="i"><use href="#{icon}"/></svg><span>{x}</span></li>' for x in items) + '</ul>'

UX_DONE = ['<b>Entry point carries over:</b> the date or passage you clicked is already selected in the booking.',
    '<b>Price always visible:</b> total in the summary on every step, deposit and balance spelled out, no card fees.',
    '<b>No account:</b> guest checkout; Telegram is optional.',
    '<b>Forms that help:</b> autocomplete, right keyboards on phones, inline errors on blur, an error summary that takes focus.',
    '<b>Progress and going back:</b> named steps, Back keeps what you typed (session storage).',
    '<b>Phones:</b> collapsible summary at the top, sticky Continue button, square photos in card rows.',
    '<b>Trust at the decision point:</b> cancellation terms and “experience checked before payment” next to the pay button.',
    '<b>No dead ends:</b> full dates offer a waitlist; the confirmation ends with three useful actions.',
    '<b>Accessible:</b> real labels and fieldsets, aria-current on the step, focus moves to each new step heading.']
UX_TODO = ['<b>Live availability:</b> hold the place for 30 minutes during payment, release it after.',
    '<b>Saved booking link:</b> email the half-finished booking (only with consent).',
    '<b>Currency:</b> show prices in the visitor’s currency, charge in euros.',
    '<b>Group bookings:</b> invite crew by link so each pays their own share.']
SEO_DONE = ['<b>Titles and descriptions</b> written per page, with place, year and starting price.',
    '<b>Four languages, four URLs:</b> English, Russian, German and Spanish pages, each with its own address, html lang, canonical, hreflang to all four plus x-default, og:locale and translated structured data. A switcher in the header keeps you on the same page.',
    '<b>Structured data:</b> Course with a CourseInstance and Offer for every date; BreadcrumbList; FAQPage; Organization and WebSite.',
    '<b>Visible breadcrumbs</b> that match the BreadcrumbList data.',
    '<b>Booking pages kept out of search</b> with noindex, follow.',
    '<b>Social previews:</b> Open Graph and a large Twitter card.',
    '<b>Stable layout:</b> fixed image sizes in card rows and galleries, lazy-loaded photos below the fold.']
SEO_TODO = ['<b>One page per course and per passage</b>, so each can rank for its own search (today only Bareboat Skipper has one).',
    '<b>Server-rendered HTML</b> for all content, and a sitemap.xml with hreflang alternates.',
    '<b>Speed:</b> self-host fonts, preload the first gallery photo, serve AVIF/WebP.',
    '<b>FAQ data is a bonus, not a goal:</b> Google shows FAQ rich results only for a few authoritative sites now; the questions still help readers.',
    '<b>Real reviews</b> only if collected after the course; never marked up without them.']

EVENTS = [('view_item', 'Course or passage page opened'), ('select_item', 'Book clicked on a date or passage'), ('begin_checkout', 'Booking step 1 shown'),
          ('add_shipping_info', 'Details step completed (GA4 name for “details”)'), ('add_payment_info', 'Payment method chosen'), ('purchase', 'Confirmation shown, with value and reference')]
ev_rows = ''.join(f'<tr><td><code>{e}</code></td><td class="wrap-c">{d}</td></tr>' for e, d in EVENTS)

main = f'''
  <main>
    <section class="hero">
      <span class="kicker">Prototype · User flows</span>
      <h1 class="display">From the first search to the next booking</h1>
      <p class="lead">Three journeys through the Ocean Way pages, step by step, with what each person wants at that moment and the UX and SEO choices that help. Black-framed steps are working pages in this prototype; open them to click through.</p>
      <ol class="lc" aria-label="Lifecycle">
        <li class="on"><b>Discover</b><span>Search, Telegram, a friend</span></li>
        <li class="on"><b>Decide</b><span>Course page, dates, FAQ</span></li>
        <li class="on"><b>Book</b><span>Dates, details, payment</span></li>
        <li><b>Prepare</b><span>Emails, instructor, packing</span></li>
        <li><b>Sail</b><span>The week aboard</span></li>
        <li><b>Return</b><span>Certificate, next step</span></li>
      </ol>
      <div class="legend"><span class="tag-built">In the prototype</span><span class="tag-todo">To build</span><span>Scroll each journey sideways.</span></div>
    </section>
    {''.join(journey(*j) for j in JOURNEYS)}

    <section class="sec" id="pages" style="margin-top:88px">
      <div class="sec-head"><span class="kicker">SEO</span><h2 class="h2">Page plan</h2></div>
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr><th>Page</th><th>URL</th><th>Search</th><th>Title</th><th>Structured data</th><th>Main action</th></tr></thead>
        <tbody>{page_rows}</tbody></table></div>
      <p class="disclaimer">URLs assume the school lives on rycrentals.com under /en/, /ru/, /de/ and /es/. Change the domain in the canonical and hreflang tags if it moves.</p>
    </section>

    <section class="sec" id="practices" style="margin-top:88px">
      <div class="sec-head"><span class="kicker">Checklist</span><h2 class="h2">What the prototype already does</h2></div>
      <div class="cols2">
        <div class="band"><h3>UX</h3>{cl(UX_DONE)}</div>
        <div class="band"><h3>SEO</h3>{cl(SEO_DONE)}</div>
      </div>
      <div class="sec-head" style="margin-top:56px"><h2 class="h2">Next to build</h2></div>
      <div class="cols2">
        <div class="band"><h3>UX</h3>{cl(UX_TODO, True)}</div>
        <div class="band"><h3>SEO</h3>{cl(SEO_TODO, True)}</div>
      </div>
    </section>

    <section class="sec" id="measure" style="margin-top:88px">
      <div class="sec-head"><span class="kicker">Measure</span><h2 class="h2">Funnel events</h2></div>
      <p class="sec-lead">Standard GA4 e-commerce names, so the funnel report works without custom setup. Each event carries the item (course or passage), date and price.</p>
      <div class="tbl-wrap" style="max-width:820px"><table class="tbl"><thead><tr><th>Event</th><th>When</th></tr></thead><tbody>{ev_rows}</tbody></table></div>
    </section>
  </main>
'''

js = '''<script>
const root = document.documentElement;
document.getElementById('themeBtn').addEventListener('click', () => { if (root.dataset.theme === 'night') delete root.dataset.theme; else root.dataset.theme = 'night'; });
if (new URLSearchParams(location.search).get('theme') === 'night') root.dataset.theme = 'night';
</script>'''

head = src[:src.index('<title>')] + '''<title>User Flows · Ocean Way prototype</title>
<meta name="robots" content="noindex, nofollow">
<meta name="description" content="Ocean Way prototype: user journeys from search to booking, with UX and SEO decisions per step.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Carlito:ital,wght@0,400;0,700;1,400&family=Merriweather:ital,wght@0,300;1,300&display=swap">
'''
extra_css = '.tbl td.wrap-c { white-space: normal; min-width: 180px; }\n'
html = head + '<style>' + style + CSS + extra_css + '</style>\n</head>\n<body>' + sprite + '<div class="wrap">\n  ' + header + '\n' + main + '\n  ' + footer + '\n</div>\n' + js + '\n</body>\n</html>\n'
open(P + '/user-flows.html', 'w').write(html)
print('ok', len(html))
