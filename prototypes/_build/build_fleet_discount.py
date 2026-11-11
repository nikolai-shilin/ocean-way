"""Design: Ocean Way's 10 % discount on charter boats, on top of the live pages.

Takes pages saved from ocean-way.vercel.app (prototypes/fleet-discount/_live/*.html),
drops their scripts (hydration would put the old prices back), points styles and
photos at the live site, and rewrites every boat price to show our price with the
list price crossed out.

  python3 -I prototypes/_build/build_fleet_discount.py
  -> prototypes/fleet-discount/{fleet,boat,prices,home}.html
"""
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DIR = ROOT / 'prototypes' / 'fleet-discount'
LIVE = 'https://ocean-way.vercel.app'
PCT = 10
NB = '\xa0'
EUR = r'€(\d{1,3}(?:\xa0\d{3})*)'


def num(s):
    return int(s.replace(NB, ''))


def eur(n):
    return '€' + f'{n:,}'.replace(',', NB)


def ours(n):
    return round(n * (100 - PCT) / 100)


CSS = f'''<style>
/* Design only: what the 10 % charter discount adds to app.css */
.ow-hero > *, .sec, .fl-sec, .cover *, .gallery figure {{ animation: none !important; opacity: 1 !important; transform: none !important; }}
.was {{ text-decoration: line-through; text-decoration-thickness: 1px; color: var(--muted); font-weight: 400; }}
.off {{ color: var(--accent); font-weight: 700; }}
/* Card: our price in bold, list price crossed out, one blue line under it */
/* .card-price b and .card-price s are already styled in home.css */
/* Live bug: home does not load app.css, so the model ran into the name; this moves to home.css */
.card-model {{ display: block; margin-top: 2px; font-weight: 400; font-size: 15px; color: var(--muted); }}
.card-deal {{ font-family: var(--sans); font-size: 14px; color: var(--accent); font-weight: 700; margin: 0; }}
/* Season table: our price, list price small underneath */
.fl-season td .was, .fl-prices td .was, .tbl td.num .was {{ display: block; font-size: 13px; line-height: 1.2; margin-top: 2px; }}
.fl-season td.lo .was {{ color: var(--muted); }}
/* Boat page box */
.ow-price {{ flex-wrap: wrap; row-gap: 6px; }}
.ow-price .was {{ font-family: var(--title); font-weight: var(--title-w); font-size: 20px; letter-spacing: var(--title-track); margin-right: auto; margin-left: 10px; }}
.ow-off {{ display: flex; gap: 10px; align-items: flex-start; font-size: 15px; line-height: 1.35; margin: 0; }}
.ow-off svg {{ color: var(--accent); flex: none; margin-top: 1px; }}
.mbar .ow-mbar .was {{ font-size: 13px; margin-right: 4px; }}
/* Fleet page band */
.fl-deal {{ display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 6px 22px; align-items: center; padding: 22px 28px; margin-top: 28px; }}
.fl-deal .big {{ grid-row: span 2; font-family: var(--title); font-weight: var(--title-w); font-size: 48px; letter-spacing: var(--title-track); line-height: 1; color: var(--accent); }}
.fl-deal h3 {{ margin: 0; font-family: var(--sans); font-weight: 700; font-size: 19px; }}
.fl-deal p {{ margin: 0; font-size: 16px; line-height: 1.4; max-width: 70ch; }}
@supports (corner-shape: squircle) {{ .fl-deal {{ corner-shape: squircle; border-radius: 48px; }} }}
@media (max-width: 680px) {{ .fl-deal {{ grid-template-columns: minmax(0, 1fr); padding: 20px 22px; }} .fl-deal .big {{ grid-row: auto; font-size: 40px; }} }}
</style>'''

JS = '''<script>
// Design only: theme button and fleet filters (live scripts are dropped).
document.querySelectorAll('[data-theme-toggle], #themeBtn').forEach((b) => b.addEventListener('click', () => {
  const r = document.documentElement; r.dataset.theme = r.dataset.theme === 'dark' ? 'light' : 'dark';
}));
const bar = document.querySelector('.fl-bar');
if (bar) bar.addEventListener('click', (e) => {
  const b = e.target.closest('.tag'); if (!b) return;
  bar.querySelectorAll('.tag[data-group="' + b.dataset.group + '"]').forEach((x) => x.classList.toggle('tag-on', x === b));
  const kind = bar.querySelector('.tag-on[data-group=kind]').dataset.v, cab = bar.querySelector('.tag-on[data-group=cabins]').dataset.v;
  let n = 0;
  document.querySelectorAll('.ow-grid .card[data-kind]').forEach((c) => { const ok = (kind === 'all' || c.dataset.kind === kind) && (cab === 'all' || c.dataset.cabins === cab); c.hidden = !ok; n += ok; });
  bar.querySelector('.fl-count').textContent = n + (n === 1 ? ' boat' : ' boats');
});
</script>'''


def base(h, title):
    h = re.sub(r'<script\b[^>]*>.*?</script>', '', h, flags=re.S)
    h = re.sub(r'<link[^>]+rel="(preload|modulepreload)"[^>]*>', '', h)
    h = re.sub(r'(href|src)="/(_next|fleet)/', lambda m: f'{m.group(1)}="{LIVE}/{m.group(2)}/', h)
    h = re.sub(r'srcSet="/', f'srcSet="{LIVE}/', h)
    h = re.sub(r'href="/(en|ru|de|es)', lambda m: f'href="{LIVE}/{m.group(1)}', h)
    h = re.sub(r'<title>.*?</title>', f'<title>{title}</title>', h)
    h = h.replace('</head>', CSS + '\n</head>')
    return h.replace('</body>', JS + '\n</body>')


def cards(h):
    """'From €2 300 a week to charter' -> 'From €2 070 €2 300 a week to charter' + a blue line."""
    def f(m):
        n = num(m.group(1))
        return (f'<span class="card-price">From <b>{eur(ours(n))}</b><s>{eur(n)}</s> a week to charter</span>'
                f'<span class="card-deal">{PCT}% off the list price</span>')
    return re.sub(r'<span class="card-price">From ' + EUR + r' a week to charter</span>', f, h)


def both(m):
    n = num(m.group(1))
    return f'<b>{eur(ours(n))}</b><s class="was">{eur(n)}</s>'


def fleet():
    h = (DIR / '_live' / 'en_fleet.html').read_text()
    h = cards(h)
    # Season table: every cell
    i = h.index('<table class="tbl fl-season">'); j = h.index('</table>', i)
    t = re.sub(r'(<td(?: class="lo")?>)' + EUR + '</td>', lambda m: m.group(1) + both(re.match(EUR, m.group(0)[len(m.group(1)):])) + '</td>', h[i:j])
    h = h[:i] + t + h[j:]
    h = h.replace('The charter fee for the boat for one week, Saturday to Saturday. Each boat’s lowest price between April and October is in blue.',
                  f'Our price for the boat for one week, Saturday to Saturday, with the list price crossed out under it. Each boat’s lowest price between April and October is in blue.')
    # Cover: one more fact, and a band above the filters
    h = h.replace('<svg class="i"><use href="#ow-calendar"></use></svg>Saturday to Saturday</span></div>',
                  f'<svg class="i"><use href="#ow-calendar"></use></svg>Saturday to Saturday</span><span class="fact off"><svg class="i"><use href="#ow-price"></use></svg>{PCT}% off every charter week</span></div>', 1)
    deal = (f'<div class="band fl-deal"><span class="big">−{PCT}%</span><h3>Every boat, every week of 2027</h3>'
            f'<p>Book a charter with us and the weekly fee is {PCT}% below the operator’s list price. The service pack, deposit and extras stay as listed.</p></div>')
    h = h.replace('<div class="fl-bar">', deal + '<div class="fl-bar">', 1)
    (DIR / 'fleet.html').write_text(base(h, 'Fleet, 10% off · design'))


def boat():
    h = (DIR / '_live' / 'en_fleet_lagoon-42-day-dream.html').read_text()
    h = cards(h)
    i = h.index('<table class="tbl fl-prices">'); j = h.index('</table>', i)
    t = h[i:j].replace('<th class="num">A week</th>', '<th class="num">A week</th>')
    t = re.sub(r'<b>' + EUR + '</b>', both, t)
    h = h[:i] + t + h[j:]
    h = h.replace('The boat for one week, Saturday to Saturday.', f'The boat for one week, Saturday to Saturday: our price, {PCT}% below the list price crossed out under it.', 1)

    def box(m):
        n = num(m.group(1))
        return (f'<div class="ow-price"><b>{eur(ours(n))}</b><s class="was">{eur(n)}</s><span class="card-meta">a week, from</span></div>'
                f'<p class="ow-off"><svg class="i"><use href="#ow-price"></use></svg><span><b class="off">{PCT}% off</b> the list price, every week of 2027.</span></p>')
    h = re.sub(r'<div class="ow-price"><b>' + EUR + r'</b><span class="card-meta">a week, from</span></div>', box, h)
    # Phone bar: too narrow for both prices, so the first line says the discount
    h = re.sub(r'<div class="ow-mbar"><p>([^<]*)</p><p><b>' + EUR + r'</b> <!-- -->a week, from</p>',
               lambda m: f'<div class="ow-mbar"><p>{m.group(1).split(",")[0]} · <span class="off">{PCT}% off</span> <s class="was">{eur(num(m.group(2)))}</s></p><p><b>{eur(ours(num(m.group(2))))}</b> a week, from</p>', h)
    (DIR / 'boat.html').write_text(base(h, 'Day Dream, 10% off · design'))


def prices():
    h = (DIR / '_live' / 'en_prices.html').read_text()
    i = h.index('id="charter"'); j = h.index('</table>', i)
    t = re.sub(r'<b>' + EUR + '</b>', both, h[i:j])
    t = t.replace('Price for the whole boat for one week, bareboat.', f'Price for the whole boat for one week, bareboat, {PCT}% below the list price.')
    (DIR / 'prices.html').write_text(base(h[:i] + t + h[j:], 'Prices, 10% off · design'))


def home():
    h = (DIR / '_live' / 'en.html').read_text()
    (DIR / 'home.html').write_text(base(cards(h), 'Home, 10% off · design'))


fleet(); boat(); prices(); home()
print('wrote', *sorted(p.name for p in DIR.glob('*.html')))
