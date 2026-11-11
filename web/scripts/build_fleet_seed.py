"""Seed migration for the Fethiye fleet (Mercuri International, offer 77).

Reads content/fleet_nausys.json (parsed from the NauSYS pages linked in the offer) and content/fleet_i18n.json
(ru/de/es for the English text written here), writes supabase/migrations/20261111100100_fleet_fethiye_data.sql:
12 published boats with gallery, extras and translations, their 2027 prices, their sources (private), the sample
boats hidden, and the course dates moved onto real boats.

  python3 -I web/scripts/build_fleet_seed.py
"""
import json
import re
import subprocess
from pathlib import Path

WEB = Path(__file__).resolve().parents[1]
boats = json.loads((WEB / 'content' / 'fleet_nausys.json').read_text())
I18N = json.loads((WEB / 'content' / 'fleet_i18n.json').read_text())
OUT = WEB / 'supabase' / 'migrations' / '20261111100100_fleet_fethiye_data.sql'
LANGS = ['ru', 'de', 'es']

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
# Best first photo where the boat has a better one than "main" (drone shots at sea).
COVER = {'Alfasyr': 'n2', 'Gusto 7': 'n3', 'Pontika': 'n2', 'Blue Dream 48': 'n3', 'Dream Life': 'n1', 'Elenor': 'n1'}
# What each boat is used for (decided 11 Nov 2026); labels already have translations and icons in the app.
USED_FOR = {'Solar': 'Introduction to Yachting', 'Anda': 'Flotilla Skipper courses', 'Lornia': 'Bareboat Skipper courses',
            'Elenor': 'Passages and Yachtmaster'}
# Course dates: course → boat. One course per boat, so no week is double-booked.
COURSE_BOAT = {'introduction-to-yachting': 'Solar', 'international-flotilla-skipper': 'Anda', 'bareboat-skipper': 'Lornia',
               'yachtmaster-coastal': 'Elenor', 'yachtmaster-offshore': 'Elenor'}
CAPTION = {'n': 'Outside', 'm': 'Outside', 'p': 'Saloon and galley', 'r': 'Cabin', 'w': 'Head'}
ORDER = {'m': 0, 'n': 1, 'p': 2, 'r': 3, 'w': 4}
# NauSYS extra → our wording; None drops it. Notes: NauSYS notes we keep, translated.
EXTRA = {
    'Skipper': ('Skipper', 'plus food; sleeps on board'), 'Cook': ('Cook', 'plus food'), 'Hostess': ('Hostess', 'plus food'),
    'WI-FI Internet connection on boat': ('Wi-Fi on board', 'unlimited'), 'Base expenses: other charges': ('Base expenses', ''),
    'Outboard engine': ('Outboard for the dinghy', ''), 'Stand up paddle (SUP)': ('Stand-up paddle board', ''),
    'Gennaker': ('Gennaker', ''), 'Spinnaker': ('Spinnaker', ''), 'Railing net (Safety net)': ('Safety net on the railings', ''),
    'Seabob': ('Seabob', ''), 'Extra bedlinen': ('Extra bed linen', '1 sheet and 2 pillowcases'),
    'Extra blankets': ('Extra blanket', ''), 'Towels': ('Towels', '1 small and 1 large'), 'Service Pack': None,
}
UNIT = {'day': 'day', 'week': 'week', 'booking': 'booking', 'trip': 'trip', 'set': 'booking', 'piece': 'booking'}


def tr(en, lang, **kw):
    s = I18N.get(en, {}).get(lang)
    if s is None:
        raise SystemExit(f'No {lang} translation for: {en}')
    return s.format(**kw)


def num(s):
    m = re.search(r'[\d.]+', s or '')
    return float(m.group()) if m else None


def litres(s):
    return int(num(s)) if s and s != 'N/A' else None


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
                         (('Teak cockpit',), 'Teak cockpit'), (('Bathing platform',), 'Bathing platform'),
                         (('Inverter',), 'Inverter, 220 V sockets'), (('Bimini',), 'Bimini'), (('TV',), 'TV'),
                         (('Floating mats',), 'Floating mats')]:
        if has(b, *words):
            out.append(label)
    return out


def shape(path):
    """'p' for portrait photos, 'l' for the rest (sips is on every Mac)."""
    o = subprocess.run(['sips', '-g', 'pixelWidth', '-g', 'pixelHeight', str(path)], capture_output=True, text=True).stdout
    w, h = (int(re.search(rf'{k}: (\d+)', o).group(1)) for k in ('pixelWidth', 'pixelHeight'))
    return 'p' if h > w else 'l'


def gallery(b):
    shots = []
    for p in b['pictures']:
        stem = p['file'].rsplit('.', 1)[0]
        if stem == 'layout':
            continue
        shots.append({'photo_id': p['webp'], 'shape': shape(WEB / 'public' / p['webp'].lstrip('/')), 'caption': CAPTION[stem[0]], '_stem': stem})
    cover = COVER.get(b['name'], 'main' if any(s['_stem'] == 'main' for s in shots) else shots[0]['_stem'])
    shots.sort(key=lambda s: (s['_stem'] != cover, ORDER[s['_stem'][0]], s['_stem']))
    for s in shots:
        del s['_stem']
    return shots


def extras(b):
    out = []
    for s in b['services'] + b['options']:
        if s['name'] == 'One way':
            out.append({'name': f"One way to {s['notes'][0]}", 'note': '', 'price_eur': s['price_eur'], 'unit': 'trip'})
            continue
        if s['name'] not in EXTRA:
            raise SystemExit(f"Unknown NauSYS extra: {s['name']}")
        if EXTRA[s['name']] is None:
            continue
        name, note = EXTRA[s['name']]
        dep = next((n for n in s['notes'] if 'deposit' in n.lower()), None)
        if dep:
            amount = int(re.sub(r'\D', '', dep))
            note = f"€{amount:,} deposit".replace(',', ' ')
        out.append({'name': name, 'note': note, 'price_eur': s['price_eur'], 'unit': UNIT[s['unit']]})
    # Base expenses are optional and rarely chosen: last.
    return sorted(out, key=lambda e: e['name'] == 'Base expenses')


def from_price(b):
    return min(p['eur'] for p in b['prices_2027'] if p['to'][5:] >= '04-01' and p['from'][5:] <= '10-31')


def q(v):
    """SQL literal."""
    if v is None:
        return 'null'
    if isinstance(v, bool):
        return 'true' if v else 'false'
    if isinstance(v, (int, float)):
        return repr(v)
    if isinstance(v, (list, dict)):
        return "'" + json.dumps(v, ensure_ascii=False).replace("'", "''") + "'::jsonb"
    return "'" + str(v).replace("'", "''") + "'"


def arr(xs):
    return 'array[' + ', '.join(q(x) for x in xs) + ']::text[]' if xs else "'{}'::text[]"


rows, prices, sources = [], [], []
for b in sorted(boats, key=lambda x: (from_price(x), x['name'])):
    t = b['tech']
    used = USED_FOR.get(b['name'], 'Charter')
    gal, ext, hl = gallery(b), extras(b), highlights(b)
    eng = re.match(r'(\d) x ([\d.]+|N/A) HP', t.get('Engine', ''))
    alt = '{name}, a {model}'
    translations = {}
    for l in LANGS:
        translations[l] = {
            'description': tr(DESC[b['name']], l),
            'used_for': tr(used, l),
            'photo_alt': tr(alt, l, name=b['name'], model=b['model']),
            'highlights': [tr(h, l) for h in hl],
            'gallery': [{'caption': tr(s['caption'], l)} for s in gal],
            'extras': [{'name': tr(e['name'], l), 'note': tr(e['note'], l) if e['note'] else ''} for e in ext],
        }
    layout = next((p['webp'] for p in b['pictures'] if p['file'].startswith('layout')), None)
    extra_berths = sum(int(x) for x in b['berths'].split('+')[1:])
    rows.append({
        'slug': b['slug'], 'name': b['name'], 'model': b['model'], 'year': b['year'], 'length_m': b['length_m'],
        'beam_m': num(t.get('Beam')), 'draft_m': num(t.get('Draft')), 'cabins': b['cabins'], 'berths': int(b['berths'].split('+')[0]),
        'heads': b['heads'], 'engines': int(eng.group(1)) if eng else 1,
        'engine_hp': round(float(eng.group(2))) if eng and eng.group(2) != 'N/A' else None,
        'base': 'Fethiye, Türkiye', 'marina': 'Ece Saray Marina', 'kind': b['kind'], 'used_for': used,
        'charter_from_eur': from_price(b), 'photo_id': gal[0]['photo_id'], 'photo_alt': alt.format(name=b['name'], model=b['model']),
        'description': DESC[b['name']], 'skipper_cabin': '+' in t.get('Cabins', ''), 'extra_berths': extra_berths,
        'max_guests': int(re.sub(r'\D', '', t['Max. passengers'])) if re.search(r'\d', t.get('Max. passengers', '')) else None,
        'water_l': litres(t.get('Water tank')), 'fuel_l': litres(t.get('Fuel tank')), 'highlights': hl, 'gallery': gal,
        'layout_photo_id': layout, 'service_pack_eur': next(s['price_eur'] for s in b['services'] if s['name'] == 'Service Pack'),
        'deposit_eur': b['deposit_eur'], 'extras': ext, 'translations': translations,
    })
    prices += [(b['slug'], p['from'], p['to'], p['eur']) for p in b['prices_2027']]
    sources.append((b['slug'], b['nausys_id']))

cols = list(rows[0])
sql = ['-- Generated by web/scripts/build_fleet_seed.py from content/fleet_nausys.json. Do not edit by hand.',
       '-- The Fethiye fleet (Mercuri International, offer 77) replaces the sample boats. Plan: docs/plans/fleet-fethiye.md.', '']
sql.append(f"insert into public.yachts (sort, {', '.join(cols)}, published) values")
vals = []
for i, r in enumerate(rows, start=1):
    vals.append('  (' + ', '.join([str(100 + i)] + [arr(r[c]) if c == 'highlights' else q(r[c]) for c in cols] + ['true']) + ')')
sql.append(',\n'.join(vals) + ';\n')

sql.append('-- Weekly prices for 2027 (NauSYS list prices, boat only).')
sql.append('insert into public.yacht_prices (yacht_id, starts_on, ends_on, week_eur)')
sql.append('select y.id, p.s, p.e, p.eur from (values')
sql.append(',\n'.join(f"  ({q(s)}, date {q(a)}, date {q(z)}, {e})" for s, a, z, e in prices))
sql.append(') as p(slug, s, e, eur) join public.yachts y on y.slug = p.slug;\n')

sql.append('-- Where each boat comes from (private).')
sql.append('insert into public.yacht_sources (yacht_id, operator, nausys_id, offer_ref, agent_discount_pct)')
sql.append("select y.id, 'Mercuri International', s.nausys_id, 'Offer 77, 11 Nov 2026', 15 from (values")
sql.append(',\n'.join(f"  ({q(s)}, {n})" for s, n in sources))
sql.append(') as s(slug, nausys_id) join public.yachts y on y.slug = s.slug;\n')

sql.append('-- The sample boats leave the site (rows kept until nothing refers to them).')
sql.append("update public.yachts set published = false where name is null;\n")

sql.append('-- Course dates sail on real boats: one course per boat, so no week is double-booked.')
by = {b['name']: b for b in boats}
for course, name in COURSE_BOAT.items():
    b = by[name]
    sql.append(f"update public.course_dates set yacht_slug = {q(b['slug'])}, boat = {q(name + ', ' + b['model'])} where course_slug = {q(course)} and boat <> '';")
OUT.write_text('\n'.join(sql) + '\n')
print(f'{len(rows)} boats, {len(prices)} prices -> {OUT.relative_to(WEB.parent)}')
for r in rows:
    print(f"  {r['slug']:34} from €{r['charter_from_eur']:>5}  {len(r['gallery']):2} photos  {len(r['extras']):2} extras  {r['used_for']}")
