"""Theory section: theory.html (hub) and theory-<slug>.html (articles), from the article files in _build/theory/
(<slug>.json meta + <slug>.html body). Also adds the Theory teaser row to home.html and theory links to the course page
(idempotent). Shares head CSS, icons, header and footer with the course page. Run i18n_build.py afterwards."""
import json, os, re, html, math
import knot_diagrams
HERE = os.path.dirname(os.path.abspath(__file__))
P = os.path.dirname(HERE)
C = os.path.join(HERE, 'theory')
BASE = 'https://www.rycrentals.com'
BRAND = 'Ocean Way'
UPDATED = ('2026-11-01', '1 Nov 2026')
# Author of every article; the app serves the photo from web/public and the profile at /<lang>/instructors#<slug>.
AUTHOR = {'slug': 'nikolai', 'name': 'Nikolai Shilin', 'photo': '/people/nikolai.webp', 'job': 'Skipper, IYT Bareboat Skipper'}

ORDER = ['points-of-sail', 'sail-trim', 'knots', 'tacking-gybing', 'reefing', 'right-of-way', 'navigation-lights', 'night-sailing', 'buoyage',
         'med-mooring', 'berthing-alongside', 'anchoring', 'dinghy-outboard', 'charter-check-in', 'engine-checks', 'engine-handling', 'boat-systems',
         'skippering', 'provisioning', 'weather', 'position-fixing', 'pilotage', 'tides', 'passage-planning', 'astronavigation',
         'vhf-procedure', 'man-overboard', 'safety-on-board']
TOPICS = [('Sailing basics', 'basics', 'How a yacht moves and the handful of knots you use every day.'),
          ('Rules of the road', 'rules', 'Who gives way, what the lights at night are telling you and how to read the buoys.'),
          ('Harbour and anchorage', 'harbour', 'Getting in, tied up and settled for the night.'),
          ('Boat and engine', 'boat', 'Taking over a charter yacht, checking the engine every morning and handling her under power.'),
          ('Skipper and crew', 'crew', 'Leading the crew, keeping everyone fed and well, and the decisions that are yours.'),
          ('Weather and navigation', 'weather', 'Knowing what the wind will do and where you are.'),
          ('Radio and safety', 'radio', 'What to say on the radio, the safety gear on board and what to do if someone falls in.')]
PHOTO = {'points-of-sail': ('1540946485063-a40da27545f8', 'A sailing yacht close-hauled on open water'),
         'knots': ('1563296291-14f26f10c20f', 'A schooner with all sails set'),
         'right-of-way': ('1605281317010-fe5ffe798166', 'A motor yacht crossing open water'),
         'navigation-lights': ('1534447677768-be436bb09401', 'A yacht under a starry night sky'),
         'med-mooring': ('1570077188670-e3a8d69ac5ff', 'A harbour town lit at dusk above the sea'),
         'anchoring': ('1506929562872-bb421503ef21', 'Boats anchored in a turquoise cove'),
         'weather': ('1500375592092-40eb2168fd21', 'A wave breaking in clear water'),
         'position-fixing': ('1534008897995-27a23e859048', 'Boats in a bay between cliffs'),
         'vhf-procedure': ('1528154291023-a6525fabe5b4', 'A boat seen from above on dark water'),
         'tacking-gybing': ('1777880652269-ff1dd5e65fbb', 'Two sailors at the wheel under sail'),
         'reefing': ('1777404380697-6b0725b148a7', 'Two crew working at the mast in a fresh breeze'),
         'buoyage': ('1780335282813-db330424b1bd', 'A skipper at the wheel leaving harbour'),
         'berthing-alongside': ('1533105079780-92b9be482077', 'Whitewashed steps down to the sea'),
         'tides': ('1505118380757-91f5f5632de0', 'Waves meeting a sandy shore from above'),
         'passage-planning': ('1764726411645-744d48aa4497', 'A sextant, watch and dividers on a chart'),
         'man-overboard': ('1732267994253-4b9e4fd70a41', 'A crew in sailing jackets on deck in open water'),
         'safety-on-board': ('1542405242-8217b4c9e34c', 'A crew in life jackets on deck'),
         'charter-check-in': ('1754353702475-f0c295d9eb77', 'Sailing yachts in a marina on a sunny day'),
         'engine-checks': ('1670711226713-599750185024', 'A wooden sailing yacht moored alongside a pontoon'),
         'engine-handling': ('1743798574119-36a30e44799d', 'The wheel and compass of a sailing yacht'),
         'sail-trim': ('1474917518260-23f84bd71c75', 'A winch and sheets on a yacht under sail'),
         'night-sailing': ('1787848438272-b08ca3161a2d', 'A sailing yacht with its masthead light on at night'),
         'dinghy-outboard': ('1786339904188-562036aea403', 'Small boats and tenders moored in clear blue water'),
         'boat-systems': ('1769655991158-094971dd1404', 'The cabin of a sailing yacht in daylight from the companionway'),
         'skippering': ('1605387202149-47169c4ea58a', 'A crew on a yacht sailing into the evening sun'),
         'provisioning': ('1760812875584-155ee59adac5', 'Grilling dinner on the deck of a boat'),
         'pilotage': ('1776022699364-f2b02e0c66d3', 'A calm harbour entrance between two breakwaters'),
         'astronavigation': ('1631599797710-83f1cbe65653', 'The Milky Way over the sea at night')}
IMG = lambda pid, w=900: f'https://images.unsplash.com/photo-{pid}?w={w}&q=80&auto=format&fit=crop'
COURSE_LINK = {'IYT International Bareboat Skipper': 'bareboat-skipper-course.html'}

def load():
    arts = []
    for slug in ORDER:
        meta = json.load(open(f'{C}/{slug}.json'))
        meta['body'] = open(f'{C}/{slug}.html').read()
        arts.append(meta)
    return arts

# ---------- diagrams ----------
def boat(x, y, h, sail, mirror=False, cls=''):
    a = math.radians(sail); sx = math.sin(a) * 15 * (-1 if mirror else 1); sy = -5 + math.cos(a) * 15
    return (f'<g class="dg-boat {cls}" transform="translate({x:.1f} {y:.1f}) rotate({h})">'
            f'<path class="dg-hull" d="M0,-17 C6.5,-8 6.5,8 4,15 L-4,15 C-6.5,8 -6.5,-8 0,-17Z"/>'
            f'<line class="dg-sail" x1="0" y1="-5" x2="{sx:.1f}" y2="{sy:.1f}"/></g>')

def diagram_points():
    cx, cy, R = 320, 250, 150
    pts = [(45, 8, 'Close-hauled'), (65, 25, 'Close reach'), (90, 45, 'Beam reach'), (135, 65, 'Broad reach'), (180, 85, 'Running')]
    g = []
    x1, y1 = cx + R * 1.25 * math.sin(math.radians(-45)), cy - R * 1.25 * math.cos(math.radians(-45))
    x2, y2 = cx + R * 1.25 * math.sin(math.radians(45)), cy - R * 1.25 * math.cos(math.radians(45))
    g.append(f'<path class="dg-nogo" d="M{cx},{cy} L{x1:.1f},{y1:.1f} A{R*1.25:.1f},{R*1.25:.1f} 0 0 1 {x2:.1f},{y2:.1f} Z"/>')
    g.append(f'<text class="dg-label dg-muted" x="{cx}" y="{cy - R - 6}" text-anchor="middle">No-go zone</text>')
    g.append(f'<circle class="dg-ring" cx="{cx}" cy="{cy}" r="{R}"/>')
    for h, s, name in pts:
        for side in (1, -1):
            if h == 180 and side == -1:
                continue
            hh = h * side
            x = cx + R * math.sin(math.radians(hh)); y = cy - R * math.cos(math.radians(hh))
            g.append(boat(x, y, hh, s, mirror=side < 0, cls='' if side > 0 else 'dg-faint'))
            if side > 0:
                lx = cx + (R + 34) * math.sin(math.radians(hh)); ly = cy - (R + 34) * math.cos(math.radians(hh)) + 4
                anchor = 'start' if 0 < h < 180 else 'middle'
                if h == 180: ly += 18
                g.append(f'<text class="dg-label" x="{lx:.1f}" y="{ly:.1f}" text-anchor="{anchor}">{name}</text>')
    g.append(f'<line class="dg-wind" x1="{cx}" y1="18" x2="{cx}" y2="64"/><path class="dg-windhead" d="M{cx-7},56 L{cx},70 L{cx+7},56Z"/>')
    g.append(f'<text class="dg-label" x="{cx + 12}" y="34">Wind</text>')
    g.append(f'<text class="dg-label dg-muted" x="{cx + R + 26}" y="{cy + 40}" text-anchor="start">Port tack</text>')
    g.append(f'<text class="dg-label dg-muted" x="{cx - R - 26}" y="{cy + 40}" text-anchor="end">Starboard tack</text>')
    return f'<svg class="dg" viewBox="0 0 640 480" role="img" aria-label="Points of sail around the wind, with the no-go zone about 45 degrees either side of the wind">{"".join(g)}</svg>'

def diagram_lights():
    cx, cy = 320, 215
    def sector(r, a0, a1, cls):
        p = lambda a: (cx + r * math.sin(math.radians(a)), cy - r * math.cos(math.radians(a)))
        (x0, y0), (x1, y1) = p(a0), p(a1); large = 1 if (a1 - a0) % 360 > 180 else 0
        return f'<path class="{cls}" d="M{cx},{cy} L{x0:.1f},{y0:.1f} A{r},{r} 0 {large} 1 {x1:.1f},{y1:.1f} Z"/>'
    g = [sector(175, -112.5, 112.5, 'dg-white'), sector(118, 0, 112.5, 'dg-green'), sector(118, -112.5, 0, 'dg-red'),
         sector(130, 112.5, 247.5, 'dg-white dg-stern')]
    g.append(boat(cx, cy, 0, 0).replace('<line', '<line style="display:none"').replace(f'translate({cx:.1f} {cy:.1f}) rotate(0)', f'translate({cx:.1f} {cy:.1f}) scale(1.7)'))
    labels = [(cx, cy - 186, 'middle', 'Masthead light, white, 225°'), (cx + 196, cy - 70, 'start', 'Starboard'),
              (cx + 196, cy - 52, 'start', 'green, 112.5°'), (cx - 196, cy - 70, 'end', 'Port'), (cx - 196, cy - 52, 'end', 'red, 112.5°'),
              (cx, cy + 152, 'middle', 'Sternlight, white, 135°')]
    for x, y, a, t in labels:
        g.append(f'<text class="dg-label" x="{x}" y="{y}" text-anchor="{a}">{t}</text>')
    return f'<svg class="dg" viewBox="0 0 640 380" role="img" aria-label="Arcs of navigation lights seen from above: masthead light 225 degrees forward, red and green sidelights 112.5 degrees each, sternlight 135 degrees aft">{"".join(g)}</svg>'

def diagram_cardinals():
    cx, cy = 320, 250
    def mark(x, y, bands, cones):
        g = []
        g.append(f'<line class="dg-water" x1="{x - 34}" y1="{y + 30}" x2="{x + 34}" y2="{y + 30}"/>')
        h = 56 / len(bands)
        for i, b in enumerate(bands):
            g.append(f'<rect class="dg-{b}" x="{x - 13}" y="{y - 28 + i * h:.1f}" width="26" height="{h:.1f}"/>')
        g.append(f'<rect class="dg-outline" x="{x - 13}" y="{y - 28}" width="26" height="56" rx="3"/>')
        g.append(f'<line class="dg-mast" x1="{x}" y1="{y - 28}" x2="{x}" y2="{y - 38}"/>')
        for k, up in enumerate(cones):  # k=0 lower cone, k=1 upper cone
            b = y - 38 - k * 15
            pts = f'{x - 9},{b} {x + 9},{b} {x},{b - 13}' if up else f'{x - 9},{b - 13} {x + 9},{b - 13} {x},{b}'
            g.append(f'<polygon class="dg-cone" points="{pts}"/>')
        return ''.join(g)
    g = []
    for a in (45, 135, 225, 315):
        r = math.radians(a)
        g.append(f'<line class="dg-ring" x1="{cx + 46 * math.sin(r):.1f}" y1="{cy - 46 * math.cos(r):.1f}" x2="{cx + 175 * math.sin(r):.1f}" y2="{cy - 175 * math.cos(r):.1f}"/>')
    g.append(f'<path class="dg-nogo" d="M{cx - 30},{cy + 6} C{cx - 34},{cy - 14} {cx - 10},{cy - 26} {cx + 8},{cy - 20} C{cx + 30},{cy - 16} {cx + 34},{cy + 4} {cx + 22},{cy + 18} C{cx + 8},{cy + 30} {cx - 22},{cy + 26} {cx - 30},{cy + 6}Z"/>')
    g.append(f'<text class="dg-label dg-muted" x="{cx}" y="{cy + 50}" text-anchor="middle">Danger</text>')
    marks = [((cx, 100), ['blk', 'yel'], (True, True), (cx + 30, 70, 'start'), 'North cardinal', 'Q · pass north of it'),
             ((510, cy), ['blk', 'yel', 'blk'], (False, True), (510, cy + 56, 'middle'), 'East cardinal', 'Q(3) · pass east of it'),
             ((cx, 410), ['yel', 'blk'], (False, False), (cx + 30, 380, 'start'), 'South cardinal', 'Q(6)+LFl · pass south of it'),
             ((130, cy), ['yel', 'blk', 'yel'], (True, False), (130, cy + 56, 'middle'), 'West cardinal', 'Q(9) · pass west of it')]
    for (x, y), bands, cones, (lx, ly, anc), name, sub in marks:
        g.append(mark(x, y, bands, cones))
        g.append(f'<text class="dg-label" x="{lx}" y="{ly}" text-anchor="{anc}">{name}</text>')
        g.append(f'<text class="dg-label dg-muted" x="{lx}" y="{ly + 18}" text-anchor="{anc}">{sub}</text>')
    return f'<svg class="dg" viewBox="0 0 640 470" role="img" aria-label="Four cardinal marks around a danger, each on the side named after it, with their colours, topmarks and quick-flashing light rhythms">{"".join(g)}</svg>'

def diagram_propwalk():
    """Two top views, bow at the top. Left: going astern, prop walk swings the stern to port. Right: going ahead,
    the boat turns around a pivot point about a third back from the bow, so the stern swings out."""
    S = 4.6
    def hull(x, y, h, py, cls=''):
        # The hull drawn so its point (0, py) sits at (x, y), rotated h degrees about it; the stroke stays thin when scaled.
        return (f'<g class="{cls}" transform="translate({x} {y}) rotate({h}) scale({S}) translate(0 {-py})">'
                f'<path class="dg-hull" vector-effect="non-scaling-stroke" d="M0,-17 C6.5,-8 6.5,8 4,15 L-4,15 C-6.5,8 -6.5,-8 0,-17Z"/>'
                f'<line class="dg-mast" vector-effect="non-scaling-stroke" x1="0" y1="15" x2="0" y2="19.5"/>'
                f'<line class="dg-prop" vector-effect="non-scaling-stroke" x1="-3.2" y1="17.5" x2="3.2" y2="17.5"/></g>')
    def arrow(pts):
        d = 'M' + ' L'.join(f'{x:.1f},{y:.1f}' for x, y in pts)
        (x0, y0), (x1, y1) = pts[-2], pts[-1]; a = math.atan2(y1 - y0, x1 - x0)
        head = [(x1 + 11 * math.cos(a), y1 + 11 * math.sin(a)), (x1 + 6 * math.cos(a + 2.1), y1 + 6 * math.sin(a + 2.1)), (x1 + 6 * math.cos(a - 2.1), y1 + 6 * math.sin(a - 2.1))]
        return f'<path class="dg-move" d="{d}"/><polygon class="dg-movehead" points="{" ".join(f"{x:.1f},{y:.1f}" for x, y in head)}"/>'
    def arc(cx, cy, r, a0, a1, below):
        # Points on a circle round (cx, cy); angles in degrees from straight up (or straight down if below), clockwise on screen.
        sgn = -1 if below else 1
        return [(cx + sgn * r * math.sin(math.radians(a)), cy - sgn * r * math.cos(math.radians(a))) for a in [a0 + (a1 - a0) * k / 12 for k in range(13)]]
    g = [f'<line class="dg-ring" x1="320" y1="24" x2="320" y2="310"/>']
    # Left: prop walk going astern.
    X, Y, PY = 160, 130, -8
    g.append(hull(X, Y, 22, PY, 'dg-faint'))
    g.append(hull(X, Y, 0, PY))
    g.append(arrow(arc(X, Y, (15 - PY) * S + 16, 3, 26, True)))
    g.append(arrow([(X + 82, Y - 20), (X + 82, Y + 62)]))
    g.append(f'<text class="dg-label" x="{X}" y="30" text-anchor="middle">Going astern</text>')
    g.append(f'<text class="dg-label dg-muted" x="{X + 96}" y="{Y + 30}" text-anchor="start">Astern</text>')
    g.append(f'<text class="dg-label" x="{X - 20}" y="{Y + 160}" text-anchor="middle">Stern kicks to port</text>')
    # Right: turning ahead around the pivot point.
    X, Y, PY = 480, 130, -6
    g.append(hull(X, Y, 0, PY, 'dg-faint'))
    g.append(hull(X, Y, 30, PY))
    g.append(arrow(arc(X, Y, (17 + PY) * S + 18, 4, 38, False)))
    g.append(arrow(arc(X, Y, (15 - PY) * S + 16, 4, 34, True)))
    g.append(f'<circle class="dg-pivot" cx="{X}" cy="{Y}" r="5"/>')
    g.append(f'<text class="dg-label" x="{X}" y="30" text-anchor="middle">Turning ahead</text>')
    g.append(f'<text class="dg-label dg-muted" x="{X + 36}" y="{Y + 28}" text-anchor="start">Pivot point</text>')
    g.append(f'<text class="dg-label" x="{X + 62}" y="{Y - 60}" text-anchor="start">Bow</text>')
    g.append(f'<text class="dg-label" x="{X - 40}" y="{Y + 160}" text-anchor="middle">Stern swings out</text>')
    return f'<svg class="dg" viewBox="0 0 640 320" role="img" aria-label="Two yachts seen from above: going astern, prop walk kicks the stern to port; turning ahead, the yacht turns around a pivot point near the mast and the stern swings out">{"".join(g)}</svg>'

def diagram_intercept():
    """Intercept method on the plotting sheet, north up, with the article's example: azimuth 135°, intercept 8 miles
    towards. From the assumed position the intercept runs towards the sun's geographical position, and the position
    line crosses its end at right angles: a short piece of the huge circle of equal altitude."""
    AZ = 135
    az = math.radians(AZ); ux, uy = math.sin(az), -math.cos(az); px, py = -uy, ux  # along the azimuth / across it
    AX, AY, I, R = 252, 100, 130, 720
    TX, TY = AX + ux * I, AY + uy * I
    CX, CY = TX + ux * R, TY + uy * R  # the sun's geographical position, far off the sheet
    g = ['<line class="dg-ring" x1="24" y1="20" x2="24" y2="380"/>',
         '<polygon class="dg-windhead" points="24,14 18,30 30,30"/>',
         '<text class="dg-label" x="36" y="30">N</text>']
    pts = []
    for k in range(-14, 15):
        a = math.atan2(TY - CY, TX - CX) + k * 0.022
        pts.append(f'{CX + R * math.cos(a):.1f},{CY + R * math.sin(a):.1f}')
    g.append(f'<path class="dg-ring" d="M{" L".join(pts)}"/>')
    g.append(f'<line class="dg-ring" x1="{AX - ux * 50:.1f}" y1="{AY - uy * 50:.1f}" x2="{AX + ux * 320:.1f}" y2="{AY + uy * 320:.1f}"/>')
    hx, hy = TX - ux * 8, TY - uy * 8
    g.append(f'<path class="dg-move" d="M{AX:.1f},{AY:.1f} L{hx:.1f},{hy:.1f}"/>')
    g.append(f'<polygon class="dg-movehead" points="{TX:.1f},{TY:.1f} {hx + px * 6:.1f},{hy + py * 6:.1f} {hx - px * 6:.1f},{hy - py * 6:.1f}"/>')
    g.append(f'<line class="dg-pl" x1="{TX - px * 175:.1f}" y1="{TY - py * 175:.1f}" x2="{TX + px * 175:.1f}" y2="{TY + py * 175:.1f}"/>')
    g.append(f'<circle class="dg-ap" cx="{AX}" cy="{AY}" r="6"/>')
    g.append(f'<rect class="dg-outline" x="{TX - 5:.1f}" y="{TY - 5:.1f}" width="10" height="10" transform="rotate({AZ} {TX:.1f} {TY:.1f})"/>')
    sx, sy = AX + ux * 320, AY + uy * 320
    g.append(f'<circle class="dg-sun" cx="{sx + ux * 20:.1f}" cy="{sy + uy * 20:.1f}" r="13"/>')
    mx, my = (AX + TX) / 2, (AY + TY) / 2
    g += [f'<text class="dg-label" x="{AX - 14}" y="{AY - 26}" text-anchor="end">Assumed position</text>',
          f'<text class="dg-label dg-muted" x="{AX - 14}" y="{AY - 8}" text-anchor="end">from the DR, rounded</text>',
          f'<text class="dg-label" x="{mx + px * 18:.1f}" y="{my + py * 18 + 4:.1f}" text-anchor="end">Intercept, 8 nm towards</text>',
          f'<text class="dg-label" x="{TX - px * 140 + 12:.1f}" y="{TY - py * 140 + 4:.1f}" text-anchor="start">Position line, 045°–225°</text>',
          f'<text class="dg-label dg-muted" x="{TX + px * 150 - 18:.1f}" y="{TY + py * 150 + 4:.1f}" text-anchor="end">Circle of equal altitude</text>',
          f'<text class="dg-label" x="{sx - 24:.1f}" y="{sy + 2:.1f}" text-anchor="end">Azimuth 135°</text>',
          f'<text class="dg-label dg-muted" x="{sx - 24:.1f}" y="{sy + 20:.1f}" text-anchor="end">towards the sun</text>']
    return f'<svg class="dg" viewBox="0 0 660 400" role="img" aria-label="Plotting a sun sight: from the assumed position, the azimuth line points towards the sun; the intercept of 8 miles is measured along it towards the sun, and the position line is drawn at right angles through its end">{"".join(g)}</svg>'

DIAGRAMS = {'points-of-sail': (diagram_points, 'Points of sail with the wind from the top. No yacht can sail inside the no-go zone, about 45° either side of the wind; boats on the right have the wind over their port side (port tack), the faint ones on the left are on starboard tack.'),
            'cardinals': (diagram_cardinals, 'Cardinal marks around a danger, north at the top. Each mark sits on the side it is named after, so you pass on that side. The cones point to where the black is, and the white light flashes like a clock face: 3 at east, 6 at south, 9 at west.'),
            'lights': (diagram_lights, 'Light arcs seen from above. Where the arcs meet, you see two lights at once: from dead ahead, both red and green.'),
            'propwalk': (diagram_propwalk, 'Seen from above, bow at the top. Left: with a right-handed propeller, going astern kicks the stern to port. Right: going ahead, the yacht turns around a point near the mast, so the stern swings out the opposite way.'),
            'intercept': (diagram_intercept, 'Plotting a sun sight, north at the top. The sun is far off the sheet along the azimuth. Its circle of equal altitude is so large that the short piece you need is drawn as a straight position line, at right angles to the azimuth. You are somewhere on that line.')}
DIAGRAMS.update({f'knot-{k}': v for k, v in knot_diagrams.KNOTS.items()})

# ---------- shared page parts ----------
src = open(f'{P}/bareboat-skipper-course.html').read()
assert src, 'course page is empty'
STYLE = src[src.index('<style>') + 7: src.index('</style>')]
SPRITE = src[src.index('<body>') + 6: src.index('<div class="wrap">')]
HEADER = src[src.index('<header class="site-head">'): src.index('</header>') + 9].replace('class="navl on"', 'class="navl"')
HEADER = HEADER.replace('<a class="navl" href="theory.html">Theory</a>', '<a class="navl on" href="theory.html">Theory</a>')
FOOTER = src[src.index('<footer class="site-foot">'): src.index('</footer>') + 9]
HEAD0 = src[:src.index('<title>')]
FONTS = src[src.index('<link rel="preconnect"'): src.index('<style>')]

CSS = r'''
/* ---------- Theory ---------- */
.row-head { flex-direction: row; justify-content: space-between; align-items: flex-end; }
.row-nav { display: flex; align-items: center; gap: 8px; }
.hscroll { --gpad: max(24px, calc((100vw - 1180px) / 2 + 24px)); display: flex; align-items: flex-start; gap: 24px; overflow-x: auto; scroll-snap-type: x mandatory; scroll-padding: 0 var(--gpad); padding: 4px var(--gpad) 8px; margin: 0 calc(50% - 50vw); scrollbar-width: none; overscroll-behavior-x: contain; }
.hscroll::-webkit-scrollbar { display: none; }
.hscroll > .card { flex: none; width: 360px; scroll-snap-align: start; }
.hscroll > .card .photo { aspect-ratio: auto; width: 100%; height: 240px; }
.tgband { display: grid; grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr); gap: 24px 56px; align-items: center; padding: 44px; }
.tgband p { margin: 0; font-size: 18px; line-height: 1.4; max-width: 52ch; }
@media (max-width: 680px) { .hscroll { --gpad: 20px; gap: 14px; } .hscroll > .card { width: 280px; } .hscroll > .card .photo { height: auto; aspect-ratio: 1 / 1; } .tgband { grid-template-columns: minmax(0, 1fr); padding: 26px 22px; } .tgband .pill { width: 100%; } }
@supports (corner-shape: squircle) { .tgband { corner-shape: squircle; border-radius: 48px; } }
.th-hero { padding: 32px 0 8px; display: flex; flex-direction: column; gap: 22px; }
.th-hero .display { font-size: 44px; max-width: 18ch; }
.topics { display: flex; flex-wrap: wrap; gap: 8px; }
.topics a:hover .chip { background: var(--sel-bg); color: var(--sel-ink); }
.th-topic { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 2fr); gap: 24px 48px; align-items: start; margin-top: 56px; padding-top: 40px; border-top: 1px solid var(--line); }
.th-topic-head { position: sticky; top: 24px; display: flex; flex-direction: column; gap: 12px; }
.th-topic-head .sec-lead { margin: 0; }
.th-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 40px 24px; }
.th-card .photo { aspect-ratio: 16 / 10; }
.lvl { display: inline-flex; align-self: flex-start; align-items: center; height: 24px; padding: 0 10px; border-radius: 12px; background: var(--band); font-family: var(--sans); font-weight: 700; font-size: 12px; color: var(--ink); }
.art-head { display: flex; flex-direction: column; gap: 22px; padding: 32px 0 8px; max-width: 820px; }
.art-head .display { font-size: 44px; }
.art-head .byline { align-items: center; }
.author { display: inline-flex; align-items: center; gap: 8px; color: var(--ink); text-decoration: none; }
.author img { width: 28px; height: 28px; border-radius: 50%; object-fit: cover; background: var(--line); }
.author:hover .meta { text-decoration: underline; }
.art-grid { display: grid; grid-template-columns: minmax(0, 680px) 300px; gap: 72px; justify-content: space-between; margin-top: 40px; align-items: start; }
.art-side { position: sticky; top: 24px; display: flex; flex-direction: column; gap: 16px; }
.toc-list { list-style: none; margin: 0; padding: 0; border-left: 2px solid var(--line); }
.toc-list a { display: block; padding: 6px 0 6px 16px; margin-left: -2px; border-left: 2px solid transparent; font-family: var(--sans); font-size: 15px; line-height: 1.3; color: var(--muted); }
.toc-list a:hover, .toc-list a.on { color: var(--ink); border-left-color: var(--accent); }
.art-course { padding: 22px; display: flex; flex-direction: column; gap: 10px; }
.art-course p { margin: 0; font-size: 15px; line-height: 1.35; color: var(--muted); }
.art-body { font-size: 18px; }
.art-body > .summary { padding: 22px 26px; margin: 0 0 36px; }
.art-body > .summary ul { margin: 10px 0 0; padding-left: 20px; display: grid; gap: 6px; }
.art-body section { scroll-margin-top: 24px; }
.art-body h2 { font-family: var(--title); font-weight: var(--title-w); letter-spacing: var(--trk-2); font-size: 30px; line-height: 1.05; margin: 48px 0 16px; }
.art-body section:first-of-type h2 { margin-top: 0; }
.art-body h3 { font-family: var(--sans); font-weight: 700; font-size: 19px; line-height: 1.25; margin: 28px 0 8px; }
.art-body p { margin: 0 0 1em; }
.art-body ul, .art-body ol { margin: 0 0 1.1em; padding-left: 22px; display: grid; gap: 6px; }
.art-body .tbl { margin: 8px 0 24px; font-size: 15px; }
.art-body .tbl td, .art-body .tbl th { white-space: normal; }
.note { background: var(--band); border-radius: 22px; padding: 18px 22px; margin: 8px 0 24px; font-size: 16px; }
.note b { display: block; font-family: var(--sans); font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: .02em; margin-bottom: 4px; }
.note p { margin: 0; }
.note.warn { background: transparent; border: 2px solid var(--ink); }
.dgfig { margin: 8px 0 28px; }
.dgfig .frame { border: 1px solid var(--line); border-radius: 22px; padding: 12px; background: var(--bg); }
.dgfig figcaption { margin-top: 10px; }
.dg { display: block; width: 100%; height: auto; font-family: var(--sans); }
.dg-label { font-size: 14px; font-weight: 700; fill: var(--ink); }
.dg-muted { fill: var(--muted); font-weight: 400; }
.dg-ring { fill: none; stroke: var(--line); stroke-width: 1.5; stroke-dasharray: 4 5; }
.dg-nogo { fill: var(--band); stroke: var(--tag-line); }
.dg-hull { fill: var(--bg); stroke: var(--ink); stroke-width: 2; }
.dg-sail { stroke: var(--accent); stroke-width: 3.2; stroke-linecap: round; }
.dg-faint { opacity: .35; }
.dg-wind { stroke: var(--ink); stroke-width: 2.4; }
.dg-windhead { fill: var(--ink); }
.dg-white { fill: var(--band); stroke: var(--tag-line); }
.dg-red { fill: rgba(208, 52, 44, .22); stroke: #d0342c; stroke-width: 1.5; }
.dg-blk { fill: #1d1d1f; }
.dg-yel { fill: #f2c230; }
.dg-outline { fill: none; stroke: var(--ink); stroke-width: 1.5; }
.dg-mast { stroke: var(--ink); stroke-width: 2; }
.dg-cone { fill: #1d1d1f; stroke: var(--ink); stroke-width: 1.2; stroke-linejoin: round; }
.dg-water { stroke: var(--accent); stroke-width: 2; stroke-linecap: round; opacity: .6; }
.dg-green { fill: rgba(26, 158, 90, .22); stroke: #1a9e5a; stroke-width: 1.5; }
.dg-move { fill: none; stroke: var(--accent); stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; }
.dg-movehead, .dg-pivot { fill: var(--accent); }
.dg-prop { stroke: var(--ink); stroke-width: 3; stroke-linecap: round; }
.dg-pl { stroke: var(--ink); stroke-width: 3; stroke-linecap: round; }
.dg-ap { fill: var(--bg); stroke: var(--ink); stroke-width: 2.4; }
.dg-sun { fill: #f2c230; stroke: var(--ink); stroke-width: 1.5; }
.art-mobile-toc, .art-mobile-course { display: none; }
''' + knot_diagrams.CSS + r'''
@supports (corner-shape: squircle) { .note, .dgfig .frame, .art-course, .lvl { corner-shape: squircle; } .note, .dgfig .frame { border-radius: 38px; } }
@media (max-width: 1000px) {
  .art-grid { grid-template-columns: minmax(0, 1fr); gap: 0; }
  .art-side { display: none; }
  .art-mobile-toc { display: block; margin: 0 0 28px; }
  .art-mobile-toc summary { cursor: pointer; font-family: var(--sans); font-weight: 700; font-size: 16px; padding: 14px 18px; list-style: none; display: flex; justify-content: space-between; }
  .art-mobile-toc summary::-webkit-details-marker { display: none; }
  .art-mobile-toc .toc-list { margin: 0 18px 16px; }
  .art-mobile-course { display: flex; margin-top: 32px; }
  .th-topic { grid-template-columns: minmax(0, 1fr); }
  .th-topic-head { position: static; }
}
@media (max-width: 680px) {
  .th-grid { grid-template-columns: minmax(0, 1fr); }
  .art-head .display, .th-hero .display { font-size: 36px; }
  .art-body { font-size: 17px; }
  .art-body h2 { font-size: 26px; }
}
'''

def page(title, desc, path, img, ld, body):
    url = BASE + path
    head = (HEAD0 + f'<title>{html.escape(title)}</title>\n<meta name="description" content="{html.escape(desc)}">\n'
            f'<link rel="canonical" href="{url}">\n'
            f'<meta property="og:type" content="article">\n<meta property="og:site_name" content="{BRAND}">\n'
            f'<meta property="og:title" content="{html.escape(title)}">\n<meta property="og:description" content="{html.escape(desc)}">\n'
            f'<meta property="og:url" content="{url}">\n<meta property="og:image" content="{img}">\n<meta name="twitter:card" content="summary_large_image">\n'
            f'<script type="application/ld+json">\n{json.dumps({"@context": "https://schema.org", "@graph": ld}, ensure_ascii=False, indent=1)}\n</script>\n'
            + FONTS)
    js = '''<script>
const root = document.documentElement;
document.getElementById('themeBtn').addEventListener('click', () => { if (root.dataset.theme === 'night') delete root.dataset.theme; else root.dataset.theme = 'night'; });
if (new URLSearchParams(location.search).get('theme') === 'night') root.dataset.theme = 'night';
(() => {
  const links = [...document.querySelectorAll('.art-side .toc-list a')]; if (!links.length) return;
  const secs = links.map((a) => document.getElementById(a.getAttribute('href').slice(1)));
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) links.forEach((a, i) => a.classList.toggle('on', secs[i] === e.target)); }), { rootMargin: '-20% 0px -70% 0px' });
  secs.forEach((s) => s && io.observe(s));
})();
</script>'''
    return head + '<style>' + STYLE + CSS + '</style>\n</head>\n<body>' + SPRITE + '<div class="wrap">\n  ' + HEADER + '\n  <main>\n' + body + '\n  </main>\n  ' + FOOTER + '\n</div>\n' + js + '\n</body>\n</html>\n'

ORG = {'@type': 'Organization', '@id': BASE + '/#org', 'name': BRAND, 'url': BASE + '/en/'}

def card(a, cls='card th-card'):
    pid, alt = PHOTO[a['slug']]
    return (f'<a class="{cls}" href="theory-{a["slug"]}.html"><div class="photo"><div class="clip"><img src="{IMG(pid)}" alt="{alt}" loading="lazy"></div></div>'
            f'<div class="card-body"><span class="lvl">{a["level"]}</span><span class="card-title">{a["h1"]}</span><span class="card-meta">{a["description"]}</span>'
            f'<div class="facts"><span class="fact"><svg class="i"><use href="#ow-read"/></svg>{a["read_minutes"]} min read</span></div></div></a>')

def build_hub(arts):
    by = {t: [a for a in arts if a['topic'] == t] for t, _, _ in TOPICS}
    missing = [a['slug'] for a in arts if a['topic'] not in by]
    assert not missing, f'unknown topic in {missing}'
    chips = ''.join(f'<a href="#{k}"><span class="chip">{t}</span></a>' for t, k, _ in TOPICS)
    secs = ''.join(f'''
    <section class="sec th-topic" id="{k}">
      <div class="th-topic-head"><span class="kicker">{len(by[t])} {"article" if len(by[t]) == 1 else "articles"}</span><h2 class="h2">{t}</h2><p class="sec-lead">{lead}</p></div>
      <div class="th-grid">{"".join(card(a) for a in by[t])}</div>
    </section>''' for t, k, lead in TOPICS if by[t])
    body = f'''    <section class="th-hero">
      <nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="home.html">Home</a></li><li aria-current="page">Theory</li></ol></nav>
      <h1 class="display">Sailing theory, in plain words</h1>
      <p class="lead">What our instructors teach on board, written down: how a yacht sails, who gives way, how to moor, anchor, read the weather and use the radio. Read it before a course, look it up after one.</p>
      <nav class="topics" aria-label="Topics">{chips}</nav>
    </section>
{secs}
    <section class="band tgband" style="margin-top:96px">
      <div><span class="kicker">On the water</span><h2 class="h2" style="margin:12px 0 12px">Theory sticks when you practise it</h2><p>Every article ends with where you practise it. Most of it is part of the Bareboat Skipper week: a skipper's licence in seven days aboard.</p></div>
      <div><a class="pill pill-primary" href="bareboat-skipper-course.html">See the IYT Bareboat Skipper course</a></div>
    </section>'''
    ld = [ORG,
          {'@type': 'BreadcrumbList', 'itemListElement': [{'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': BASE + '/en/'}, {'@type': 'ListItem', 'position': 2, 'name': 'Theory', 'item': BASE + '/en/theory/'}]},
          {'@type': 'CollectionPage', 'name': 'Sailing theory, in plain words', 'url': BASE + '/en/theory/', 'inLanguage': 'en',
           'mainEntity': {'@type': 'ItemList', 'itemListElement': [{'@type': 'ListItem', 'position': i + 1, 'url': f'{BASE}/en/theory/{a["slug"]}/', 'name': a['h1']} for i, a in enumerate(arts)]}}]
    out = page(f'Sailing Theory: Rules, Mooring, Weather, Radio · {BRAND}',
               f'Free sailing theory from {BRAND} instructors: points of sail, knots, tacking, reefing, right of way, buoys, mooring, anchoring, tides, weather, navigation, VHF and safety.',
               '/en/theory/', IMG(PHOTO['points-of-sail'][0], 1200), ld, body)
    open(f'{P}/theory.html', 'w').write(out)

def build_article(a, arts):
    body_html = a['body']
    for name, (fn, cap) in DIAGRAMS.items():
        body_html = body_html.replace(f'<figure data-diagram="{name}"></figure>',
                                      f'<figure class="dgfig"><div class="frame">{fn()}</div><figcaption class="disclaimer">{cap}</figcaption></figure>')
    toc = ''.join(f'<li><a href="#{i}">{t}</a></li>' for i, t in a['toc'])
    course = a['course']; clink = COURSE_LINK.get(course, 'home.html#courses')
    course_card = (f'<div class="band art-course"><span class="kicker">Practise it on</span><div class="card-title">{course}</div>'
                   f'<p>Learn this on the water with an instructor, in a week living aboard.</p>'
                   f'<a class="pill pill-primary pill-wide pill-sm" href="{clink}">{"See the course" if course in COURSE_LINK else "See the courses"}</a></div>')
    related = [x for x in arts if x['slug'] != a['slug'] and x['topic'] == a['topic']] + [x for x in arts if x['slug'] != a['slug'] and x['topic'] != a['topic']]
    related = related[:6]
    pid, alt = PHOTO[a['slug']]
    body = f'''    <article>
      <header class="art-head">
        <nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="home.html">Home</a></li><li><a href="theory.html">Theory</a></li><li aria-current="page">{a["topic"]}</li></ol></nav>
        <h1 class="display">{a["h1"]}</h1>
        <p class="lead">{a["lead"]}</p>
        <div class="byline"><a class="author" href="instructors.html#{AUTHOR["slug"]}"><img src="{AUTHOR["photo"]}" alt="{AUTHOR["name"]}" width="28" height="28"><span class="meta" style="color:var(--ink)">{AUTHOR["name"]}</span></a><span class="meta">Updated {UPDATED[1]}</span><span class="meta">{a["read_minutes"]} min read</span><span class="lvl">{a["level"]}</span></div>
      </header>
      <div class="art-grid">
        <div class="art-body">
          <details class="art-mobile-toc band"><summary>On this page<svg class="i"><use href="#ow-chevron"/></svg></summary><ol class="toc-list">{toc}</ol></details>
          <div class="band summary"><span class="kicker">In short</span><ul>{"".join(f"<li>{s}</li>" for s in a["summary"])}</ul></div>
          {body_html}
          <div class="art-mobile-course">{course_card}</div>
        </div>
        <aside class="art-side" aria-label="On this page"><span class="kicker">On this page</span><ol class="toc-list">{toc}</ol>{course_card}</aside>
      </div>
    </article>
    <section class="sec" style="margin-top:96px">
      <div class="sec-head row-head"><div><span class="kicker">Theory</span><h2 class="h2" style="margin-top:12px">Keep reading</h2></div><div class="row-nav"><a class="pill pill-quiet" href="theory.html">All theory</a></div></div>
      <div class="hscroll" tabindex="0" aria-label="More theory">{"".join(card(x, "card") for x in related)}</div>
    </section>'''
    url = f'{BASE}/en/theory/{a["slug"]}/'
    ld = [ORG,
          {'@type': 'BreadcrumbList', 'itemListElement': [{'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': BASE + '/en/'}, {'@type': 'ListItem', 'position': 2, 'name': 'Theory', 'item': BASE + '/en/theory/'}, {'@type': 'ListItem', 'position': 3, 'name': a['h1'], 'item': url}]},
          {'@type': 'Article', 'headline': a['h1'], 'description': a['description'], 'image': IMG(pid, 1200), 'inLanguage': 'en',
           'datePublished': UPDATED[0], 'dateModified': UPDATED[0], 'author': {'@type': 'Person', '@id': BASE + '/#' + AUTHOR['slug'], 'name': AUTHOR['name'], 'jobTitle': AUTHOR['job'], 'image': BASE + AUTHOR['photo'], 'url': BASE + '/en/instructors#' + AUTHOR['slug'], 'worksFor': {'@id': BASE + '/#org'}}, 'publisher': {'@id': BASE + '/#org'},
           'mainEntityOfPage': url, 'educationalLevel': a['level'], 'about': a['topic'],
           'timeRequired': f'PT{a["read_minutes"]}M', 'isPartOf': {'@type': 'CollectionPage', 'url': BASE + '/en/theory/'}}]
    out = page(f'{a["title"]} · {BRAND}', a['description'], f'/en/theory/{a["slug"]}/', IMG(pid, 1200), ld, body)
    open(f'{P}/theory-{a["slug"]}.html', 'w').write(out)

def patch_home(arts):
    f = f'{P}/home.html'; s = open(f).read(); assert s, 'home.html is empty'
    sec = f'''
    <section class="sec" id="theory" data-row style="margin-top:96px">
      <div class="sec-head row-head"><div><span class="kicker">Theory</span><h2 class="h2" style="margin-top:12px">Read before you sail</h2></div><div class="row-nav"><a class="pill pill-quiet" href="theory.html">All theory</a><button class="round" type="button" data-dir="-1" aria-label="Previous"><svg class="i" style="transform:scaleX(-1)"><use href="#ow-arrow"/></svg></button><button class="round" type="button" data-dir="1" aria-label="Next"><svg class="i"><use href="#ow-arrow"/></svg></button></div></div>
      <p class="sec-lead">What our instructors teach on board, in plain words: right of way, mooring, anchoring, weather, radio. Free to read, before a course or after one.</p>
      <div class="hscroll" tabindex="0" aria-label="Theory articles">{"".join(card(a, "card") for a in arts)}</div>
    </section>'''
    s = re.sub(r'\n    <section class="sec" id="theory".*?</section>', '', s, flags=re.S)
    anchor = '\n    <section class="sec" id="fleet"' if 'id="fleet"' in s else '\n    <section class="sec" id="deals"'
    assert anchor in s
    s = s.replace(anchor, sec + anchor, 1)
    if '.lvl {' not in s:
        s = s.replace('/* ---------- Home page ---------- */', '.lvl { display: inline-flex; align-self: flex-start; align-items: center; height: 24px; padding: 0 10px; border-radius: 12px; background: var(--band); font-family: var(--sans); font-weight: 700; font-size: 12px; color: var(--ink); }\n/* ---------- Home page ---------- */', 1)
    open(f, 'w').write(s)

def patch_course(arts):
    f = f'{P}/bareboat-skipper-course.html'; s = open(f).read(); assert s, 'course page is empty'
    picks = [a for a in arts if a['course'] == 'IYT International Bareboat Skipper']
    block = ('<div class="theory-links"><span class="kicker">Read the theory</span><div class="toc">'
             + ''.join(f'<a href="theory-{a["slug"]}.html"><span class="chip">{a["h1"]}</span></a>' for a in picks) + '</div></div>')
    s = re.sub(r'\s*<div class="theory-links">.*?</div></div>', '', s, flags=re.S)
    i = s.index('id="syllabus"'); j = s.index('</section>', i)
    s = s[:j] + '  ' + block + '\n    ' + s[j:]
    if '.theory-links' not in s:
        s = s.replace('</style>', '.theory-links { display: flex; flex-direction: column; gap: 10px; margin-top: 32px; }\n</style>', 1)
    open(f, 'w').write(s)

if __name__ == '__main__':
    arts = load()
    patch_home(arts); patch_course(arts)
    build_hub(arts)
    for a in arts: build_article(a, arts)
    print('built', len(arts), 'articles')
