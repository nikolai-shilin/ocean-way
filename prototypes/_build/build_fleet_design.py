"""Hi-fi designs for the Fethiye fleet (offer 77, Mercuri International).

Wraps new /fleet and /fleet/<slug> markup in the live site's own header, footer,
icon sprite and stylesheets (saved from ocean-way.vercel.app into
live_boat_shell.html), so the pages render exactly as production would.

  python3 -I prototypes/_build/build_fleet_design.py
  -> prototypes/fleet/index.html, prototypes/fleet/<slug>.html

Photos come from web/public/fleet/<slug>/ through the prototypes/fleet-img symlink.
Data: web/content/fleet_nausys.json (parsed from the NauSYS pages linked in the offer).
"""
import html
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'prototypes' / 'fleet'
LIVE = 'https://ocean-way.vercel.app'
boats = json.loads((ROOT / 'web' / 'content' / 'fleet_nausys.json').read_text())
shell = (Path(__file__).parent / 'live_boat_shell.html').read_text()

esc = html.escape

# ---------------------------------------------------------------- copy

DESC = {
    'Solar': 'The smallest boat in the fleet: three double cabins and one head. Easy to handle for a couple or a family, and a good first charter in the bays around Fethiye.',
    'Lornia': 'A 2020 Sun Odyssey 440 with step-free side decks, an autopilot and a bow thruster. Four cabins sleep eight without crowding the cockpit.',
    'Anda': 'Lornia’s sister ship, with a lazy bag on the full-batten main and diesel heating for the cooler weeks of spring and autumn.',
    'Epoch': 'The longest monohull here at 15.2 m, with twin wheels, a teak cockpit, heating and 780 litres of water. Four cabins plus a skipper’s cabin, registered for eleven.',
    'Alfasyr': 'Launched in 2024: twin wheels, a bow thruster and four cabins with three heads. A newer, roomier step up from the 40-footers.',
    'Leo': 'A catamaran with four cabins, each with its own electric head, and AIS at the chart table. Draws only 1.25 m, so she anchors closer in.',
    'Elenor': 'Five cabins and three heads for a crew of ten. A big, steady monohull for longer legs towards Bodrum or the Greek islands.',
    'Pontika': 'Twin wheels and a self-tacking jib, so a small crew can sail a 15-metre boat. Five cabins for groups of up to ten.',
    'Gusto 7': 'Pontika’s 2024 sister: the same self-tacking jib, twin wheels and five cabins, and the newest monohull in the fleet.',
    'Day Dream': 'A Lagoon 42 with air conditioning, a generator and heating. Four cabins with electric heads, and room for two more in the saloon.',
    'Dream Life': 'Four large cabins with their own heads, air conditioning and a generator, and a flybridge helm above the saloon.',
    'Blue Dream 48': 'The newest boat in the fleet: a 2025 Lagoon 46 with air conditioning, a generator and four cabins with their own heads.',
}
COVER = {'Alfasyr': 'n2', 'Gusto 7': 'n3', 'Pontika': 'n2', 'Blue Dream 48': 'n3', 'Dream Life': 'n1', 'Elenor': 'n1'}
SEASONS = ['Winter', 'Spring', 'Early summer', 'High summer', 'Autumn', 'Late autumn']
CAPTION = {'main': 'Outside', 'n': 'Outside', 'p': 'Saloon and galley', 'r': 'Cabin', 'w': 'Head', 'layout': 'Layout'}
MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']


def eur(n):
    return '€' + f'{n:,}'.replace(',', ' ')


def day(iso):
    y, m, d = iso.split('-')
    return f'{int(d)} {MONTHS[int(m) - 1]}'


def num(s):
    m = re.search(r'[\d.]+', s or '')
    return float(m.group()) if m else None


def berths(b):
    return b['berths'].replace('+', ' + ')


def engine(b):
    m = re.match(r'(\d) x ([\d.]+) HP', b['tech'].get('Engine', ''))
    if not m or m.group(2) == 'N/A':
        return '–'
    hp = round(float(m.group(2)))
    return f'{hp} hp' if m.group(1) == '1' else f'2 × {hp} hp'


def litres(k):
    def f(b):
        v = b['tech'].get(k, 'N/A')
        return '–' if v == 'N/A' else v.replace(' l', ' l')
    return f


def has(b, *words):
    flat = ' '.join(' '.join(v) for v in b['equipment'].values()).lower()
    return any(w.lower() in flat for w in words)


def highlights(b):
    t, out = b['tech'], []
    if t.get('Steering type') == '2 Steering Wheels':
        out.append('Twin wheels')
    if t.get('Genoa') == 'self tacking jib':
        out.append('Self-tacking jib')
    if t.get('Main sail') == 'full batten' or has(b, 'lazy bag'):
        out.append('Full-batten main with lazy bag')
    for words, label in [(('Autopilot',), 'Autopilot'), (('Bow thruster',), 'Bow thruster'), (('AIS',), 'AIS'),
                         (('GPS chart plotter',), 'Chart plotter'), (('Air Conditioning',), 'Air conditioning'),
                         (('Generator',), 'Generator'), (('Heating', 'Webasto'), 'Diesel heating'),
                         (('Electric anchor windlass',), 'Electric windlass'), (('Electric toilet',), 'Electric heads'),
                         (('Inverter',), 'Inverter, 220 V sockets'), (('Liferaft',), 'Liferaft'), (('Dinghy',), 'Dinghy'),
                         (('Bimini',), 'Bimini'), (('TV',), 'TV'), (('Floating mats',), 'Floating mats')]:
        if has(b, *words):
            out.append(label)
    if b['kind'] == 'catamaran' or 'outboard included' in json.dumps(b):
        pass
    return out


def photos(b):
    """Gallery order: cover, other deck shots, saloon, cabins, heads, layout last."""
    order = {'main': 0, 'n': 1, 'p': 2, 'r': 3, 'w': 4, 'layout': 5}
    pics = []
    for p in b['pictures']:
        stem = p['file'].rsplit('.', 1)[0]
        key = 'main' if stem == 'main' else 'layout' if stem == 'layout' else stem[0]
        pics.append({'stem': stem, 'key': key, 'src': '../fleet-img/' + p['webp'].split('/fleet/', 1)[1]})
    cover = COVER.get(b['name']) or ('main' if any(p['stem'] == 'main' for p in pics) else pics[0]['stem'])
    pics.sort(key=lambda p: (p['stem'] != cover, order[p['key']], p['stem']))
    return pics


def cover(b):
    return photos(b)[0]['src']


def from_price(b):
    """Lowest week among seasons that overlap April–October (Winter left out)."""
    return min(p['eur'] for p in b['prices_2027'] if p['to'][5:] >= '04-01' and p['from'][5:] <= '10-31')


def spec_line(b):
    return f"{b['year']} · {round(b['length_m'], 1):g} m · {b['cabins']} cabins · {berths(b)} berths"


def icon(name, extra=''):
    return f'<svg class="i"{extra}><use href="#ow-{name}"></use></svg>'


def kind_icon(b):
    return 'catamaran' if b['kind'] == 'catamaran' else 'monohull'


def card(b, href):
    return f'''<a class="card fl-card" href="{href}" data-kind="{b['kind']}" data-cabins="{b['cabins']}">
  <div class="photo"><div class="clip"><img src="{cover(b)}" alt="{esc(b['name'])}, a {esc(b['model'])}" loading="lazy"></div></div>
  <div class="card-body">
    <span class="card-title">{esc(b['name'])}<span class="fl-model">{esc(b['model'])}</span></span>
    <span class="card-meta">{spec_line(b)}</span>
    <span class="card-price">From {eur(from_price(b))} a week</span>
    <div class="facts"><span class="fact">{icon('pin')}Fethiye</span><span class="fact">{icon(kind_icon(b))}{b['kind'].capitalize()}</span></div>
  </div>
</a>'''


# ---------------------------------------------------------------- extra CSS (new components only)

CSS = '''
<style>
/* Fleet design additions, on top of the live home.css / app.css / chrome.css */
.ow-hero > *, .sec, .fl-sec, .gallery figure, .gallery-wrap { animation: none !important; opacity: 1 !important; transform: none !important; }
.fl-model { display: block; margin-top: 2px; font-weight: 400; font-size: 15px; color: var(--muted); }
.fl-bar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px 24px; margin-top: 40px; }
.fl-bar .tags { gap: 8px; }
.fl-sep { width: 2px; height: 28px; background: var(--tag-line); margin: 0 8px; align-self: center; }
.fl-count { font-family: var(--sans); font-size: 15px; color: var(--muted); }
.ow-grid .fl-card[hidden] { display: none; }
.fl-sec { margin-top: 96px; display: flex; flex-direction: column; gap: 18px; }
.fl-sec > p { margin: 0; font-size: 18px; line-height: 1.45; max-width: 64ch; }
.fl-season { min-width: 860px; }
.fl-season th:not(:first-child), .fl-season td:not(:first-child) { text-align: right; }
.fl-season th span { display: block; font-weight: 400; text-transform: none; letter-spacing: 0; font-size: 12px; }
.fl-season td b { font-family: var(--sans); font-weight: 700; }
.fl-season td a { color: var(--ink); }
.fl-season td a:hover { color: var(--accent); }
.fl-season td span { display: block; font-size: 13px; color: var(--muted); }
.fl-season .lo { color: var(--accent); font-weight: 700; }
.fl-terms { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
.fl-terms .band { padding: 24px 26px; display: flex; flex-direction: column; gap: 10px; }
.fl-terms h3 { margin: 0; font-family: var(--sans); font-weight: 700; font-size: 18px; display: flex; align-items: center; gap: 10px; }
.fl-terms h3 svg { color: var(--accent); }
.fl-terms p { margin: 0; font-size: 16px; line-height: 1.4; }
.fl-terms .big { font-family: var(--title); font-weight: var(--title-w); font-size: 30px; letter-spacing: var(--title-track); line-height: 1; }

/* Boat page */
.fl-gallery .photo img { cursor: zoom-in; }
.fl-gallery figure.g-l .photo { height: 420px; } .fl-gallery figure.g-l { width: 560px; }
.fl-gallery figure.g-p .photo { height: 420px; background: #fff; } .fl-gallery figure.g-p { width: 300px; }
.fl-gallery figure.g-p img { object-fit: contain; padding: 18px; }
.fl-gallery figcaption { margin-top: 10px; font-family: var(--sans); font-size: 14px; color: var(--muted); }
.fl-gtabs { display: flex; gap: 8px; flex-wrap: wrap; }
.fl-layout { display: grid; grid-template-columns: 180px minmax(0, 1fr); gap: 32px; align-items: center; padding: 24px 28px; }
.fl-layout .plan { background: #fff; border-radius: 20px; padding: 14px; aspect-ratio: 3 / 5; display: flex; align-items: center; justify-content: center; }
.fl-layout .plan img { width: 100%; height: 100%; object-fit: contain; }
.fl-layout ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
.fl-layout li { display: grid; grid-template-columns: 22px minmax(0, 1fr); gap: 12px; font-size: 17px; line-height: 1.35; }
.fl-layout li svg { color: var(--accent); margin-top: 1px; }
.fl-two { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.fl-two .band { padding: 24px 26px; }
.fl-two h3 { margin: 0 0 6px; font-family: var(--sans); font-weight: 700; font-size: 18px; }
.fl-rows { list-style: none; margin: 0; padding: 0; }
.fl-rows li { display: flex; justify-content: space-between; gap: 16px; padding: 10px 0; border-bottom: 1px solid var(--tag-line); font-size: 16px; line-height: 1.3; }
.fl-rows li:last-child { border-bottom: 0; }
.fl-rows li span { color: var(--muted); font-size: 14px; display: block; }
.fl-rows li b { white-space: nowrap; font-weight: 700; }
.fl-prices td:last-child, .fl-prices th:last-child { text-align: right; }
.fl-prices tr.now td { font-weight: 700; }
.fl-prices tr.now td:first-child::after { content: 'Quoted week'; margin-left: 10px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .02em; color: var(--accent); }
.ow-body .disclaimer { margin-top: 16px; }
.fl-src { font-family: var(--sans); font-size: 13px; color: var(--muted); }
@supports (corner-shape: squircle) { .fl-terms .band, .fl-two .band, .fl-layout, .fl-layout .plan { corner-shape: squircle; border-radius: 48px; } }
@media (max-width: 1000px) { .fl-terms { grid-template-columns: minmax(0, 1fr); } }
@media (max-width: 680px) {
  .fl-bar { margin-top: 32px; }
  .fl-bar .tags { flex-wrap: nowrap; overflow-x: auto; margin: 0 -20px; padding: 2px 20px; scrollbar-width: none; width: calc(100% + 40px); }
  .fl-bar .tags::-webkit-scrollbar { display: none; }
  .fl-bar .tag { min-height: 42px; padding: 0 16px; font-size: 16px; }
  .fl-sec { margin-top: 64px; }
  .fl-layout, .fl-two { grid-template-columns: minmax(0, 1fr); }
  .fl-layout .plan { max-width: 220px; }
  .fl-gallery figure.g-l { width: 300px; } .fl-gallery figure.g-l .photo { height: 230px; }
  .fl-gallery figure.g-p { width: 170px; } .fl-gallery figure.g-p .photo { height: 230px; }
  .fl-season-wrap { margin: 0 -20px; padding: 0 20px; }
}
</style>'''

JS = '''<script>
// Prototype only: theme button, gallery and row arrows, fleet filters.
document.getElementById('themeBtn')?.addEventListener('click', () => {
  const r = document.documentElement; r.dataset.theme = r.dataset.theme === 'night' ? '' : 'night';
});
document.querySelectorAll('[data-scroll]').forEach((b) => b.addEventListener('click', () => {
  const t = document.querySelector(b.dataset.scroll); t.scrollBy({ left: t.clientWidth * 0.8 * Number(b.dataset.dir), behavior: 'smooth' });
}));
document.querySelectorAll('[data-row]').forEach((sec) => sec.querySelectorAll('.row-nav .round').forEach((b) => b.addEventListener('click', () => {
  const t = sec.querySelector('.hscroll'); t.scrollBy({ left: t.clientWidth * 0.8 * Number(b.dataset.dir), behavior: 'smooth' });
})));
const tags = document.querySelectorAll('.fl-bar .tag');
tags.forEach((t) => t.addEventListener('click', () => {
  document.querySelectorAll(`.fl-bar .tag[data-group="${t.dataset.group}"]`).forEach((x) => x.classList.toggle('tag-on', x === t));
  const kind = document.querySelector('.tag-on[data-group=kind]').dataset.v, cab = document.querySelector('.tag-on[data-group=cabins]').dataset.v;
  let n = 0;
  document.querySelectorAll('.fl-card').forEach((c) => {
    const ok = (kind === 'all' || c.dataset.kind === kind) && (cab === 'all' || c.dataset.cabins === cab);
    c.hidden = !ok; n += ok;
  });
  document.querySelector('.fl-count').textContent = `${n} ${n === 1 ? 'boat' : 'boats'}`;
}));
</script>'''


# ---------------------------------------------------------------- shell

def page(title, main, current_fleet_href):
    h = shell
    h = re.sub(r'<script\b[^>]*>.*?</script>', '', h, flags=re.S)
    h = re.sub(r'<link[^>]+rel="(preload|modulepreload)"[^>]*>', '', h)
    h = h.replace('href="/_next/', f'href="{LIVE}/_next/')
    h = re.sub(r'<title>.*?</title>', f'<title>{esc(title)}</title>', h)
    h = h.replace('</head>', CSS + '\n</head>')
    h = h.replace('href="/en/fleet"', f'href="{current_fleet_href}"')
    h = re.sub(r'href="/(en|ru|de|es)', lambda m: f'href="{LIVE}/{m.group(1)}', h)
    i, j = h.index('<main>'), h.index('</main>') + len('</main>')
    h = h[:i] + '<main>' + main + '</main>' + h[j:]
    return h.replace('</body>', JS + '\n</body>')


def crumbs(items, current):
    lis = ''.join(f'<li><a href="{href}">{esc(t)}</a></li>' for t, href in items)
    return f'<nav class="crumbs" aria-label="Breadcrumb"><ol>{lis}<li aria-current="page">{esc(current)}</li></ol></nav>'


def season_head():
    p = boats[0]['prices_2027']
    return ''.join(f'<th>{SEASONS[i]}<span>{day(x["from"])} – {day(x["to"])}</span></th>' for i, x in enumerate(p))


# ---------------------------------------------------------------- /fleet

def index():
    mono = sum(b['kind'] == 'monohull' for b in boats)
    cats = len(boats) - mono
    by_cab = {c: sum(b['cabins'] == c for b in boats) for c in sorted({b['cabins'] for b in boats})}
    tag = lambda g, v, label, n, on=False: f'<button class="tag{" tag-on" if on else ""}" type="button" data-group="{g}" data-v="{v}">{label}<span class="tag-count">{n}</span></button>'
    filters = (tag('kind', 'all', 'All boats', len(boats), True) + tag('kind', 'monohull', 'Monohulls', mono) + tag('kind', 'catamaran', 'Catamarans', cats)
               + '<span class="fl-sep" aria-hidden="true"></span>' + tag('cabins', 'all', 'Any cabins', len(boats), True)
               + ''.join(tag('cabins', str(c), f'{c} cabins', n) for c, n in by_cab.items()))
    rows = ''.join(
        f'<tr><td><a href="{b["slug"]}.html"><b>{esc(b["name"])}</b></a><span>{esc(b["model"])}, {b["year"]}</span></td>'
        + ''.join(f'<td class="{"lo" if x["eur"] == from_price(b) and x["from"][5:] != "01-01" else ""}">{eur(x["eur"])}</td>' for x in b['prices_2027']) + '</tr>'
        for b in boats)
    sp = sorted({b['service_pack_eur'] for b in boats})
    dep = sorted({b['deposit_eur'] for b in boats})
    main = f'''<section class="ow-hero">
  {crumbs([('Home', LIVE + '/en')], 'Our fleet')}
  <h1 class="display">Twelve yachts in Fethiye</h1>
  <p class="lead">Monohulls from 11.5 to 15.2 metres and catamarans from 12.8 to 14 metres, all at Ece Saray Marina in Fethiye. Charter one for a week, bareboat with a licence or with one of our skippers.</p>
  <div class="facts"><span class="fact">{icon('pin')}Ece Saray Marina, Fethiye</span><span class="fact">{icon('monohull')}{mono} monohulls</span><span class="fact">{icon('catamaran')}{cats} catamarans</span><span class="fact">{icon('calendar')}Saturday to Saturday</span></div>
</section>
<div class="fl-bar"><div class="tags" role="group" aria-label="Filter boats">{filters}</div><span class="fl-count">{len(boats)} boats</span></div>
<div class="ow-grid">{''.join(card(b, b['slug'] + '.html') for b in boats)}</div>

<section class="fl-sec">
  <span class="kicker">Season 2027</span>
  <h2 class="h2">Weekly prices by season</h2>
  <p>The charter fee for the boat for one week, Saturday to Saturday. Each boat’s lowest price between April and October is in blue.</p>
  <div class="tbl-wrap fl-season-wrap"><table class="tbl fl-season"><thead><tr><th>Boat</th>{season_head()}</tr></thead><tbody>{rows}</tbody></table></div>
</section>

<section class="fl-sec">
  <span class="kicker">Every charter</span>
  <h2 class="h2">What you pay at the base</h2>
  <div class="fl-terms">
    <div class="band"><h3>{icon('charter')}Service pack</h3><span class="big">{eur(sp[0])}–{eur(sp[-1])}</span><p>Once per booking: transit log for Türkiye, final cleaning, bed linen and towels. Add €150 if you sail to Greece. On catamarans the dinghy outboard is included.</p></div>
    <div class="band"><h3>{icon('lock')}Security deposit</h3><span class="big">{eur(dep[0])}–{eur(dep[-1])}</span><p>Held at check-in and returned at check-out if the boat comes back as you took her.</p></div>
    <div class="band"><h3>{icon('clock')}Check-in and out</h3><span class="big">Saturday</span><p>Board on Saturday from 17:00, return the following Saturday by 09:00. A skipper is €200 a day plus food, a cook €150 a day.</p></div>
  </div>
</section>'''
    (OUT / 'index.html').write_text(page('Our fleet · Ocean Way', main, 'index.html'))


# ---------------------------------------------------------------- /fleet/<slug>

def boat_page(b):
    t = b['tech']
    pics = photos(b)
    layout = next((p for p in pics if p['key'] == 'layout'), None)
    figs = ''.join(
        f'<figure class="{"g-p" if p["key"] == "layout" else "g-l"}"><div class="photo"><img src="{p["src"]}" alt="{esc(b["name"])}: {CAPTION[p["key"]].lower()}" loading="{"eager" if i < 3 else "lazy"}"></div><figcaption>{CAPTION[p["key"]]}</figcaption></figure>'
        for i, p in enumerate(pics))
    specs = [('Year', b['year']), ('Length', f"{round(b['length_m'], 1):g} m"), ('Beam', f"{round(num(t.get('Beam')), 1):g} m"), ('Draft', f"{round(num(t.get('Draft')), 2):g} m"),
             ('Cabins', t.get('Cabins', b['cabins'])), ('Berths', berths(b)), ('Heads', b['heads']), ('Engine', engine(b)),
             ('Water', litres('Water tank')(b)), ('Fuel', litres('Fuel tank')(b)), ('Hull', b['kind'].capitalize()), ('Guests', re.sub(r'\D', '', t.get('Max. passengers', '')) or '–')]
    dl = ''.join(f'<div><dt>{k}</dt><dd>{esc(str(v))}</dd></div>' for k, v in specs)
    hl = ''.join(f'<li>{icon("check")}<span>{esc(x)}</span></li>' for x in highlights(b))
    prices = ''.join(
        f'<tr><td>{SEASONS[i]}</td><td class="hl">{day(x["from"])} – {day(x["to"])}</td><td>{eur(x["eur"])}</td></tr>'
        for i, x in enumerate(b['prices_2027']))
    extras = [('Skipper', 'per day, plus food; sleeps on board', '€200'), ('Cook or hostess', 'per day, plus food', '€150'), ('One way to Göcek', '', '€250'),
              ('One way to Marmaris', '', '€500'), ('One way to Bodrum', '', '€700'), ('Wi-Fi on board', 'unlimited, per week', '€80'),
              ('Stand-up paddle board', 'per week, €400 deposit', '€100'), ('Gennaker or spinnaker', 'per week, €1 000 deposit', '€400')]
    if b['seabob']:
        extras.append(('Seabob', 'per week, €1 500 deposit', '€1 250'))
    ex = ''.join(f'<li><div>{n}{f"<span>{s}</span>" if s else ""}</div><b>{p}</b></li>' for n, s, p in extras)
    cab_words = {3: 'Three', 4: 'Four', 5: 'Five'}[b['cabins']]
    lay_items = [
        f'{cab_words} double cabins{" plus a skipper’s cabin" if "+" in t.get("Cabins", "") else ""}',
        f'{b["heads"]} {"head" if b["heads"] == 1 else "heads"}{" with electric toilets" if has(b, "Electric toilet") else ""}',
        f'{berths(b)} berths, registered for {re.sub(r"[^0-9]", "", t.get("Max. passengers", "")) or b["berths"]} people',
        'Saloon table converts to a berth' if has(b, 'Convertible table') or '+' in b['berths'] else 'Saloon with dining table and chart table',
    ]
    lay = f'''<section><h2>Layout</h2><div class="band fl-layout"><div class="plan"><img src="{layout['src']}" alt="Deck plan of {esc(b['name'])}"></div>
<ul>{''.join(f'<li>{icon(ic)}<span>{esc(x)}</span></li>' for ic, x in zip(['cabin', 'check', 'crew', 'meals'], lay_items))}</ul></div></section>''' if layout else ''
    others = [x for x in boats if x is not b]
    main = f'''<section class="ow-hero">
  {crumbs([('Home', LIVE + '/en'), ('Fleet', 'index.html')], b['model'])}
  <h1 class="display">{esc(b['name'])}</h1>
  <p class="lead">{esc(DESC[b['name']])}</p>
  <div class="facts"><span class="fact">{icon(kind_icon(b))}{esc(b['model'])}, {b['year']}</span><span class="fact">{icon('pin')}Ece Saray Marina, Fethiye</span><span class="fact">{icon('crew')}{b['cabins']} cabins, {berths(b)} berths</span></div>
</section>
<div class="gallery-wrap fl-gallery">
  <div class="gallery-head"><span class="fl-src">{len(pics)} photos of this boat</span><div class="gallery-nav"><button class="round" type="button" data-scroll="#gal" data-dir="-1" aria-label="Previous">{icon('arrow', ' style="transform:scaleX(-1)"')}</button><button class="round" type="button" data-scroll="#gal" data-dir="1" aria-label="Next">{icon('arrow')}</button></div></div>
  <div class="gallery" id="gal" tabindex="0">{figs}</div>
</div>
<div class="ow-item">
  <div class="ow-body">
    <section><h2>Specifications</h2><dl class="ow-specs">{dl}</dl></section>
    {lay}
    <section><h2>On board</h2><ul class="ow-list ow-cols">{hl}</ul>
      <p class="disclaimer">Also on every boat: life jackets, liferaft, first aid kit, flares, fire extinguisher and blanket, charts and a dinghy. The full inventory is in the charter contract.</p></section>
    <section><h2>Prices in 2027</h2>
      <div class="tbl-wrap"><table class="tbl fl-prices"><thead><tr><th>Season</th><th>Dates</th><th>A week</th></tr></thead><tbody>{prices}</tbody></table></div>
      <p class="disclaimer">Boat only, Saturday to Saturday. Service pack, deposit and extras below are paid at the base.</p></section>
    <section><h2>At the base</h2>
      <div class="fl-two">
        <div class="band"><h3>Always</h3><ul class="fl-rows">
          <li><div>Service pack<span>Transit log, final cleaning, bed linen and towels{"; outboard included" if b['kind'] == 'catamaran' else ""}. €150 more to sail to Greece.</span></div><b>{eur(b['service_pack_eur'])}</b></li>
          <li><div>Security deposit<span>Returned at check-out</span></div><b>{eur(b['deposit_eur'])}</b></li>
          <li><div>Base expenses<span>Optional, per booking</span></div><b>€50</b></li></ul></div>
        <div class="band"><h3>If you want</h3><ul class="fl-rows">{ex}</ul></div>
      </div></section>
  </div>
  <aside class="band ow-box" aria-label="Charter">
    <div class="card-title">{esc(b['name'])}</div>
    <div class="card-meta">{esc(b['model'])} · {spec_line(b)}</div>
    <div class="ow-price"><b>{eur(from_price(b))}</b><span class="card-meta">a week, from</span></div>
    <dl class="ow-facts">
      <div>{icon('calendar')}<dt>Check-in</dt><dd>Sat 17:00</dd></div>
      <div>{icon('clock')}<dt>Check-out</dt><dd>Sat 09:00</dd></div>
      <div>{icon('charter')}<dt>Service pack</dt><dd>{eur(b['service_pack_eur'])}</dd></div>
      <div>{icon('lock')}<dt>Deposit</dt><dd>{eur(b['deposit_eur'])}</dd></div>
    </dl>
    <p class="ow-note">Bareboat with a licence, or with one of our skippers. The price depends on the week.</p>
    <a class="pill pill-primary pill-wide" href="#">Ask about charter weeks</a>
    <a class="pill pill-quiet pill-wide" href="index.html">All boats</a>
  </aside>
</div>
<section class="sec" data-row style="margin-top:96px"><div class="sec-head row-head"><div><span class="kicker">Our fleet</span><h2 class="h2" style="margin-top:12px">Other boats</h2></div>
  <div class="row-nav"><button class="round" type="button" data-dir="-1" aria-label="Previous">{icon('arrow', ' style="transform:scaleX(-1)"')}</button><button class="round" type="button" data-dir="1" aria-label="Next">{icon('arrow')}</button></div></div>
  <div class="hscroll" tabindex="0">{''.join(card(x, x['slug'] + '.html') for x in others)}</div></section>
<div class="mbar"><div class="ow-mbar"><p>{esc(b['name'])}, {esc(b['model'])}</p><p><b>{eur(from_price(b))}</b> a week, from</p></div><a class="pill pill-primary" href="#">Ask about weeks</a></div>'''
    (OUT / f"{b['slug']}.html").write_text(page(f"{b['name']}, {b['model']} · Ocean Way", main, 'index.html'))


OUT.mkdir(exist_ok=True)
index()
for b in boats:
    boat_page(b)
print('wrote', len(boats) + 1, 'pages to', OUT)
