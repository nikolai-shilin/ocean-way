"""Map of the 2027 training passages (Turkey and Northern Cyprus), built with the ryc-rentals route-map tools:
Natural Earth 1:10m land, Mercator fitted to the frame, legs routed by sea with A*."""
import json, math, sys, time
RM = '/Users/shilin/Developer/ryc-rentals/hotweb/scripts/route_maps'
sys.path.insert(0, RM)
from geo import Proj, land_path, read_polygons  # noqa: E402
from sea import Sea  # noqa: E402

NE = RM + '/.ne'
BBOX = (25.75, 34.95, 33.95, 41.25)          # Dardanelles to Northern Cyprus
PORTS = {
    'fethiye': ('Fethiye', 29.103, 36.622),
    'bodrum': ('Bodrum', 27.426, 37.031),
    'kusadasi': ('Kuşadası', 27.256, 37.866),
    'istanbul': ('Istanbul', 28.870, 40.966),
    'kemer': ('Kemer', 30.572, 36.600),
    'kekova': ('Kekova', 29.845, 36.193),
    'finike': ('Fenike', 30.152, 36.294),
    'girne': ('Northern Cyprus', 33.330, 35.343),
}
# legs, each run both ways in the season; extra waypoints keep the Istanbul leg in the Dardanelles
LEGS = {
    'fethiye-bodrum': ['fethiye', 'bodrum'],
    'fethiye-kusadasi': ['fethiye', 'kusadasi'],
    'kusadasi-istanbul': ['kusadasi', (26.05, 39.93), (26.40, 40.13), (26.68, 40.40), (27.0, 40.55), 'istanbul'],
    'fethiye-kemer': ['fethiye', 'kemer'],
    'fethiye-kekova': ['fethiye', 'kekova'],
    'fethiye-cyprus': ['fethiye', 'girne'],
    'finike-cyprus': ['finike', 'girne'],
}

t0 = time.time()
sea = Sea(BBOX, cell=0.012, pad=0.2)
print('sea raster', round(time.time() - t0, 1), 's', sea.nx, 'x', sea.ny)

def ll(p):
    return PORTS[p][1:] if isinstance(p, str) else p

legs_ll = {}
for key, pts in LEGS.items():
    line = []
    for a, b in zip(pts, pts[1:]):
        try:
            ca = sea.snap(*ll(a)); cb = sea.snap(*ll(b))
            seg = sea.path(ca, cb)
            seg = [ll(a)] + seg[1:-1] + [ll(b)] if isinstance(a, str) or isinstance(b, str) else seg
        except ValueError as e:
            print('fallback straight', key, a, b, e)
            seg = [ll(a), ll(b)]
        if line:
            seg = seg[1:]
        line += seg
    legs_ll[key] = line
print('legs', round(time.time() - t0, 1), 's')

rings = list(read_polygons(f'{NE}/ne_10m_land/ne_10m_land.shp', (BBOX[0] - 3, BBOX[1] - 3, BBOX[2] + 3, BBOX[3] + 3))) \
      + list(read_polygons(f'{NE}/ne_10m_minor_islands/ne_10m_minor_islands.shp', (BBOX[0] - 3, BBOX[1] - 3, BBOX[2] + 3, BBOX[3] + 3)))

def smooth(pts, r=0.35):
    """Rounded corners like the ryc-rentals legs: straight runs with quadratic bends."""
    if len(pts) < 3:
        return 'M' + ' L'.join(f'{x:.1f},{y:.1f}' for x, y in pts)
    d = f'M{pts[0][0]:.1f},{pts[0][1]:.1f}'
    for i in range(1, len(pts) - 1):
        (x0, y0), (x1, y1), (x2, y2) = pts[i - 1], pts[i], pts[i + 1]
        ax, ay = x1 + (x0 - x1) * r, y1 + (y0 - y1) * r
        bx, by = x1 + (x2 - x1) * r, y1 + (y2 - y1) * r
        d += f' L{ax:.1f},{ay:.1f} Q{x1:.1f},{y1:.1f} {bx:.1f},{by:.1f}'
    d += f' L{pts[-1][0]:.1f},{pts[-1][1]:.1f}'
    return d

# label side per port: (dx, dy, anchor)
LABEL = {
    'd': {'fethiye': (-4, -12, 'end'), 'bodrum': (-11, 4, 'end'), 'kusadasi': (11, 4, 'start'), 'istanbul': (11, -6, 'start'),
          'kemer': (11, 4, 'start'), 'kekova': (-6, 20, 'end'), 'finike': (-6, -11, 'end'), 'girne': (0, 22, 'middle')},
    'm': {'fethiye': (-3, -8, 'end'), 'bodrum': (-7, 3, 'end'), 'kusadasi': (7, 3, 'start'), 'istanbul': (7, -4, 'start'),
          'kemer': (7, 3, 'start'), 'kekova': (-3, 13, 'end'), 'finike': (-3, -7, 'end'), 'girne': (6, 15, 'end')},
}

def build(kind, w, h, pad):
    proj = Proj(BBOX, w, h, pad)
    land = land_path(rings, proj, margin=20)
    legs = ''.join(f'<g class="rm-leg pm-leg" data-leg="{k}"><path class="rm-line" d="{smooth([proj(*p) for p in pts])}"/></g>'
                   for k, pts in legs_ll.items())
    r = 5.5 if kind == 'd' else 4
    stops = ''
    for key, (name, lon, lat) in PORTS.items():
        x, y = proj(lon, lat); dx, dy, anc = LABEL[kind][key]
        stops += (f'<g class="pm-stop" data-port="{key}"><circle cx="{x:.1f}" cy="{y:.1f}" r="{r}"/>'
                  f'<text class="pm-label" x="{x + dx:.1f}" y="{y + dy:.1f}" text-anchor="{anc}">{name}</text></g>')
    # sea names
    seas = [('AEGEAN SEA', 25.95, 38.6), ('SEA OF MARMARA', 28.0, 40.72), ('MEDITERRANEAN SEA', 28.9, 35.3)]
    if kind == 'm':
        seas = [('MEDITERRANEAN', 29.6, 35.45)]
    sea_t = ''.join(f'<text class="pm-sea" x="{proj(lo, la)[0]:.1f}" y="{proj(lo, la)[1]:.1f}">{t}</text>' for t, lo, la in seas)
    return (f'<svg class="rm pm pm-{kind}" viewBox="0 0 {w} {h}" role="img" aria-label="Map of the 2027 training passages along the Turkish coast and to Northern Cyprus">'
            f'<path class="rm-land" d="{land}"/>{sea_t}{legs}{stops}</svg>')

out = {'d': build('d', 1136, 640, 28), 'm': build('m', 343, 372, 12)}
json.dump(out, open(__file__.rsplit('/', 1)[0] + '/passages_map.json', 'w'))
print('sizes', {k: len(v) for k, v in out.items()}, 'total', round(time.time() - t0, 1), 's')
