"""One map per training-passage leg (the route with its stops), built with the same ryc-rentals tools as
build_passages_map.py: Natural Earth 1:10m land, Mercator fitted to the leg, the line routed by sea through the stops.
Reads the stops from the database (passage_legs.stops, courses.route) and writes web/supabase/load/route_maps.sql,
which sets the map columns ({"d": svg, "m": svg, "nm": distance}) and the distances (distance_nm, route_nm).
Run that file with psql against the project, as with the other files in supabase/load."""
import json, math, os, subprocess, sys, time
RM = '/Users/shilin/Developer/ryc-rentals/hotweb/scripts/route_maps'
sys.path.insert(0, RM)
from geo import Proj, land_path, read_polygons, merc  # noqa: E402
from sea import Sea  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
WEB = os.path.join(HERE, '..', '..', 'web')
ENV = dict(l.strip().split('=', 1) for l in open(os.path.join(WEB, '.env.local')) if '=' in l and not l.startswith('#'))


def rows(table, cols):
    url, key = ENV['SUPABASE_URL'].strip('"'), ENV['SUPABASE_PUBLISHABLE_KEY'].strip('"')
    out = subprocess.run(['curl', '-sf', '-K', '-', f'{url}/rest/v1/{table}?select={cols}'],
                         input=f'header = "apikey: {key}"\n', capture_output=True, text=True, check=True).stdout
    return json.loads(out)


SRC = {r['leg']: r for r in rows('passage_legs', 'leg,stops')}
NE = RM + '/.ne'
BBOX = (25.75, 34.95, 33.95, 41.25)
# keeps the Istanbul leg inside the Dardanelles (same waypoints as the overview map)
VIA = {('Bozcaada', 'Çanakkale'): [(26.05, 39.93), (26.20, 40.03)], ('Gelibolu', 'Marmara Island'): [(27.0, 40.55)]}

t0 = time.time()
sea = Sea(BBOX, cell=0.008, pad=0.2)
print('sea raster', round(time.time() - t0, 1), 's')
rings = list(read_polygons(f'{NE}/ne_10m_land/ne_10m_land.shp', (BBOX[0] - 3, BBOX[1] - 3, BBOX[2] + 3, BBOX[3] + 3))) \
      + list(read_polygons(f'{NE}/ne_10m_minor_islands/ne_10m_minor_islands.shp', (BBOX[0] - 3, BBOX[1] - 3, BBOX[2] + 3, BBOX[3] + 3)))

def nm(a, b):
    (lo1, la1), (lo2, la2) = a, b
    p1, p2 = math.radians(la1), math.radians(la2)
    h = math.sin((p2 - p1) / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(math.radians(lo2 - lo1) / 2) ** 2
    return 2 * 3440.065 * math.asin(math.sqrt(h))

def route(points):
    line = []
    for a, b in zip(points, points[1:]):
        try:
            seg = sea.path(sea.snap(*a), sea.snap(*b))
            seg = [a] + seg[1:-1] + [b]
        except ValueError as e:
            print('  straight', a, b, e)
            seg = [a, b]
        line += seg[1:] if line else seg
    return line

def smooth(pts, r=0.35):
    if len(pts) < 3:
        return 'M' + ' L'.join(f'{x:.1f},{y:.1f}' for x, y in pts)
    d = f'M{pts[0][0]:.1f},{pts[0][1]:.1f}'
    for i in range(1, len(pts) - 1):
        (x0, y0), (x1, y1), (x2, y2) = pts[i - 1], pts[i], pts[i + 1]
        d += f' L{x1 + (x0 - x1) * r:.1f},{y1 + (y0 - y1) * r:.1f} Q{x1:.1f},{y1:.1f} {x1 + (x2 - x1) * r:.1f},{y1 + (y2 - y1) * r:.1f}'
    return d + f' L{pts[-1][0]:.1f},{pts[-1][1]:.1f}'

def place_labels(items, w, h, fs, r, line=()):
    """items: (x, y, text, is_end). Try right, left, above, below; keep the first spot that hits no dot, label or route line."""
    boxes = [(x - r - 2, y - r - 2, x + r + 2, y + r + 2) for x, y, *_ in items]
    for (x0, y0), (x1, y1) in zip(line, line[1:]):
        n = max(1, int(math.hypot(x1 - x0, y1 - y0) / 6))
        boxes += [(x0 + (x1 - x0) * k / n - 2, y0 + (y1 - y0) * k / n - 2, x0 + (x1 - x0) * k / n + 2, y0 + (y1 - y0) * k / n + 2) for k in range(n + 1)]
    out = []
    for x, y, text, end in items:
        tw = len(text) * fs * (0.62 if end else 0.56) + 4
        g = r + 6
        cands = [(x + g, y + fs * .35, 'start', x + g, y - fs * .6, x + g + tw, y + fs * .5),
                 (x - g, y + fs * .35, 'end', x - g - tw, y - fs * .6, x - g, y + fs * .5),
                 (x, y - g - 2, 'middle', x - tw / 2, y - g - fs - 2, x + tw / 2, y - g + 2),
                 (x, y + g + fs * .8, 'middle', x - tw / 2, y + g - 2, x + tw / 2, y + g + fs + 2)]
        best = None
        for tx, ty, anc, bx0, by0, bx1, by1 in cands:
            inside = bx0 > 4 and by0 > 4 and bx1 < w - 4 and by1 < h - 4
            hit = any(bx0 < c[2] and bx1 > c[0] and by0 < c[3] and by1 > c[1] for c in boxes)
            if inside and not hit:
                best = (tx, ty, anc, (bx0, by0, bx1, by1)); break
            if best is None and inside:
                best = (tx, ty, anc, (bx0, by0, bx1, by1))
        tx, ty, anc, box = best or (cands[0][0], cands[0][1], 'start', cands[0][3:])
        boxes.append(box)
        out.append((tx, ty, anc))
    return out

def build(key, leg):
    stops = leg['stops']
    pts = []
    for (a, *_), (b, *__) in zip(stops, stops[1:]):
        pass
    named = [(s[0], s[1], s[2]) for s in stops if s[1] is not None]
    seq = []
    for i, (name, lon, lat) in enumerate(named):
        if i:
            seq += VIA.get((named[i - 1][0], name), [])
        seq.append((lon, lat))
    line = route(seq) if len(seq) > 1 else seq
    dist = sum(nm(a, b) for a, b in zip(line, line[1:]))
    lons = [p[0] for p in line]; lats = [p[1] for p in line]
    span = max(max(lons) - min(lons), (max(lats) - min(lats)) * 1.25, 0.6)
    m = span * 0.14
    bbox = (min(lons) - m, min(lats) - m, max(lons) + m, max(lats) + m)
    if len(line) == 1:  # one place: show the bay around it
        bbox = (lons[0] - 0.35, lats[0] - 0.22, lons[0] + 0.35, lats[0] + 0.22)
    aspect = (math.radians(bbox[2]) - math.radians(bbox[0])) / (merc(bbox[3]) - merc(bbox[1]))
    svgs = {}
    for kind, w, hmin, hmax, pad, fs, r_end, r_mid in (('d', 820, 340, 640, 30, 13, 6, 4.5), ('m', 343, 250, 460, 14, 10, 4.5, 3.5)):
        h = int(max(hmin, min(hmax, (w - 2 * pad) / aspect + 2 * pad)))
        proj = Proj(bbox, w, h, pad)
        land = land_path(rings, proj, margin=20)
        xy = [proj(*p) for p in line]
        items, seen = [], set()
        for i, (name, lon, lat) in enumerate(named):
            if name in seen:
                continue
            seen.add(name)
            x, y = proj(lon, lat)
            items.append((x, y, name, i in (0, len(named) - 1) or named[-1][0] == name))
        labels = place_labels(items, w, h, fs, r_end, xy)
        dots = ''
        for (x, y, name, end), (tx, ty, anc) in zip(items, labels):
            dots += (f'<g class="pm-stop{" pm-end" if end else ""}"><circle cx="{x:.1f}" cy="{y:.1f}" r="{r_end if end else r_mid}"/>'
                     f'<text class="pm-label" x="{tx:.1f}" y="{ty:.1f}" text-anchor="{anc}">{name}</text></g>')
        names = ', '.join(dict.fromkeys(s[0] for s in named))
        leg_svg = f'<g class="rm-leg pm-leg on"><path class="rm-line" d="{smooth(xy)}"/></g>' if len(xy) > 1 else ''
        svgs[kind] = (f'<svg class="rm pm pm-{kind} pm-one" viewBox="0 0 {w} {h}" role="img" aria-label="Map of the route: {names}">'
                      f'<path class="rm-land" d="{land}"/>{leg_svg}{dots}</svg>')
    return {'d': svgs['d'], 'm': svgs['m'], 'nm': int(round(dist / 5) * 5)}

out = {}
for key, leg in SRC.items():
    out[key] = build(key, leg)
    print(key, out[key]['nm'], 'NM', len(out[key]['d']) + len(out[key]['m']), 'bytes', round(time.time() - t0, 1), 's')

# course routes (loops from the base, or one place for classroom courses)
cout = {}
for c in rows('courses', 'slug,route'):
    slug = c['slug']
    if c.get('route'):
        cout[slug] = build(slug, {'stops': c['route']})
        print(slug, cout[slug]['nm'], 'NM')

def lit(v):
    return "'" + json.dumps(v, ensure_ascii=False).replace("'", "''") + "'::jsonb"
sql = ['-- Route maps from prototypes/_build/build_leg_maps.py. Safe to re-run.', 'begin;']
sql += [f"update public.passage_legs set map = {lit(m)}, distance_nm = {m['nm']} where leg = '{k}';" for k, m in out.items()]
sql += [f"update public.courses set map = {lit(m)}, route_nm = {m['nm']} where slug = '{k}';" for k, m in cout.items()]
sql += ['commit;', '']
os.makedirs(os.path.join(WEB, 'supabase', 'load'), exist_ok=True)
open(os.path.join(WEB, 'supabase', 'load', 'route_maps.sql'), 'w').write('\n'.join(sql))
