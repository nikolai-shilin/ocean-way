"""Knot diagrams for the knots article: each knot is a rope drawn through control points (x, y, z), where z is depth
(bigger = nearer the viewer). The rope is a smooth curve through the points; wherever it crosses itself, another rope
or an object's edge, the nearer part is drawn on top with a thin gap round it, so over and under read like a
textbook drawing. Objects (rail, ring, cleat) sit at depth 0: rope with z < 0 is drawn behind them, z >= 0 in front."""
import math

W = 15            # rope width (outline)
CORE = W - 4.5    # coloured core inside the outline
HALO = W + 7      # gap left round a part that passes over another
REDRAW = 22       # half length of the piece redrawn on top at a crossing


def spline(pts, n=28):
    """Catmull-Rom curve through the control points; z is interpolated the same way."""
    p = [pts[0]] + list(pts) + [pts[-1]]
    out = []
    for i in range(1, len(p) - 2):
        p0, p1, p2, p3 = p[i - 1], p[i], p[i + 1], p[i + 2]
        for k in range(n):
            t = k / n; t2 = t * t; t3 = t2 * t
            out.append(tuple(0.5 * (2 * p1[d] + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2
                                    + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3) for d in range(len(p1))))
    out.append(tuple(pts[-1]))
    return out


def lengths(poly):
    s = [0.0]
    for a, b in zip(poly, poly[1:]):
        s.append(s[-1] + math.hypot(b[0] - a[0], b[1] - a[1]))
    return s


def seg_x(a, b, c, d):
    """Intersection parameters (t, u) of segments ab and cd in 2D, or None."""
    rx, ry = b[0] - a[0], b[1] - a[1]; sx, sy = d[0] - c[0], d[1] - c[1]
    den = rx * sy - ry * sx
    if abs(den) < 1e-9:
        return None
    t = ((c[0] - a[0]) * sy - (c[1] - a[1]) * sx) / den
    u = ((c[0] - a[0]) * ry - (c[1] - a[1]) * rx) / den
    return (t, u) if 0 <= t < 1 and 0 <= u < 1 else None


class Rope:
    def __init__(self, pts, tint_from=None, end_cap=True, start_cap=False):
        pts = [tuple(p) + (p[2],) if len(p) == 3 else tuple(p) for p in pts]  # (x, y, depth, layer)
        self.poly = spline(pts)
        self.s = lengths(self.poly)
        # control point index where the coloured working part starts (None = whole rope plain)
        n = 28
        self.tint_s = None if tint_from is None else self.s[min(tint_from * n, len(self.poly) - 1)]
        self.end_cap, self.start_cap = end_cap, start_cap

    def piece(self, s0, s1):
        """Polyline between arc lengths s0 and s1."""
        s0 = max(0, s0); s1 = min(self.s[-1], s1)
        out = []
        for i in range(len(self.poly) - 1):
            a, b, sa, sb = self.poly[i], self.poly[i + 1], self.s[i], self.s[i + 1]
            if sb < s0 or sa > s1:
                continue
            def at(sv):
                t = 0 if sb == sa else (sv - sa) / (sb - sa)
                return tuple(a[d] + (b[d] - a[d]) * t for d in range(len(a)))
            if not out:
                out.append(at(max(s0, sa)))
            out.append(at(min(s1, sb)))
        return out

    def layer_at(self, sv):
        p = self.piece(sv, sv + 0.01)
        return p[0][3] if p else self.poly[-1][3]

    def z_at(self, sv):
        for i in range(len(self.s) - 1):
            if self.s[i] <= sv <= self.s[i + 1]:
                a, b = self.poly[i], self.poly[i + 1]
                t = 0 if self.s[i + 1] == self.s[i] else (sv - self.s[i]) / (self.s[i + 1] - self.s[i])
                return a[2] + (b[2] - a[2]) * t
        return self.poly[-1][2]


def d_of(poly):
    return 'M' + ' L'.join(f'{p[0]:.1f},{p[1]:.1f}' for p in poly)


def crossings(ropes):
    """Every place a rope crosses itself or another rope: (over rope, s on it, under rope, s on it)."""
    out = []
    for ai, A in enumerate(ropes):
        for bi in range(ai, len(ropes)):
            B = ropes[bi]
            for i in range(len(A.poly) - 1):
                j0 = i + 3 if A is B else 0
                for j in range(j0, len(B.poly) - 1):
                    r = seg_x(A.poly[i], A.poly[i + 1], B.poly[j], B.poly[j + 1])
                    if not r:
                        continue
                    sa = A.s[i] + (A.s[i + 1] - A.s[i]) * r[0]
                    sb = B.s[j] + (B.s[j + 1] - B.s[j]) * r[1]
                    if A is B and abs(sa - sb) < 3 * W:  # the rope folding over a rail's top, not a crossing
                        continue
                    za, zb = A.z_at(sa), B.z_at(sb)
                    x = (A, sa, B, sb) if za >= zb else (B, sb, A, sa)
                    if not any(y[0] is x[0] and abs(y[1] - x[1]) < 3 and y[2] is x[2] and abs(y[3] - x[3]) < 3 for y in out):
                        out.append(x)
    return out


def runs(rope, front):
    """Arc-length ranges of the rope that lie in front of (z >= 0) or behind (z < 0) the objects."""
    res, start = [], None
    for i, p in enumerate(rope.poly):
        inside = (p[3] >= 0) == front
        if inside and start is None:
            start = rope.s[i - 1] if i else 0.0
            if i:  # start exactly where the layer value crosses 0
                a, b = rope.poly[i - 1], p
                t = a[3] / (a[3] - b[3]) if a[3] != b[3] else 0
                start = rope.s[i - 1] + (rope.s[i] - rope.s[i - 1]) * t
        if not inside and start is not None:
            a, b = rope.poly[i - 1], p
            t = a[3] / (a[3] - b[3]) if a[3] != b[3] else 1
            res.append((start, rope.s[i - 1] + (rope.s[i] - rope.s[i - 1]) * t)); start = None
    if start is not None:
        res.append((start, rope.s[-1]))
    return res


def stroke(rope, s0, s1, halo=True, caps=True):
    """SVG for one stretch of rope: gap, outline, core (plain or tinted), with round ends at the rope's free ends."""
    poly = rope.piece(s0, s1)
    if len(poly) < 2:
        return ''
    g = []
    d = d_of(poly)
    ends = []
    if caps and rope.end_cap and s1 >= rope.s[-1] - 0.01:
        ends.append(poly[-1])
    if caps and rope.start_cap and s0 <= 0.01:
        ends.append(poly[0])
    if halo:
        g.append(f'<path class="kr-halo" d="{d}"/>')
        g += [f'<circle class="kr-halo-dot" cx="{e[0]:.1f}" cy="{e[1]:.1f}" r="{HALO / 2:.1f}"/>' for e in ends]
    g.append(f'<path class="kr-line" d="{d}"/>')
    g += [f'<circle class="kr-line-dot" cx="{e[0]:.1f}" cy="{e[1]:.1f}" r="{W / 2:.1f}"/>' for e in ends]
    # core: plain up to tint_s, tinted after
    ts = rope.tint_s
    parts = [(s0, s1, False)] if ts is None or ts >= s1 else [(s0, s1, True)] if ts <= s0 else [(s0, ts, False), (ts, s1, True)]
    for a, b, tint in parts:
        pp = rope.piece(a, b)
        if len(pp) < 2:
            continue
        cls = 'kr-core kr-tint' if tint else 'kr-core'
        g.append(f'<path class="{cls}" d="{d_of(pp)}"/>')
        # lay of the rope: short marks across the core, phase-locked to the rope's length so redraws line up
        g.append(f'<path class="kr-lay" stroke-dashoffset="{-a:.1f}" d="{d_of(pp)}"/>')
    for e in ends:
        tint = ts is not None and (e is poly[-1] and s1 > ts or e is poly[0] and s0 > ts)
        g.append(f'<circle class="{"kr-core-dot kr-tint-dot" if tint else "kr-core-dot"}" cx="{e[0]:.1f}" cy="{e[1]:.1f}" r="{CORE / 2:.1f}"/>')
    return ''.join(g)


def draw(ropes, objects='', labels=(), view=(640, 360), aria=''):
    """Back rope, objects, front rope, then every crossing redrawn with the nearer part on top."""
    xs = crossings(ropes)
    layers = []
    for front in ((False, True) if objects else (True,)):
        part = []
        for r in ropes:
            for a, b in (runs(r, front) if objects else [(0, r.s[-1])]):
                part.append(stroke(r, a, b, halo=front))
        # crossings in this layer, nearest drawn last
        mine = [x for x in xs if (x[0].layer_at(x[1]) >= 0) == front or not objects]
        mine.sort(key=lambda x: x[0].z_at(x[1]))
        for over, so, under, su in mine:
            lo, hi = so - REDRAW, so + REDRAW
            if objects:  # keep the redraw inside the same layer
                for a, b in runs(over, front):
                    if a <= so <= b:
                        lo, hi = max(lo, a), min(hi, b)
            part.append(stroke(over, lo, hi, halo=True))
        layers.append(''.join(part))
    body = (layers[0] + objects + layers[1]) if objects else layers[0]
    lab = ''.join(labels)
    return (f'<svg class="dg kd" viewBox="0 0 {view[0]} {view[1]}" role="img" aria-label="{aria}">'
            f'{body}{lab}</svg>')


def label(x, y, text, anchor='start', muted=False, lead=None):
    """Text label, optionally with a thin leader line to (x2, y2)."""
    g = ''
    if lead:
        g += f'<line class="kd-lead" x1="{lead[0]}" y1="{lead[1]}" x2="{lead[2]}" y2="{lead[3]}"/>'
    return g + f'<text class="dg-label{" dg-muted" if muted else ""}" x="{x}" y="{y}" text-anchor="{anchor}">{text}</text>'


# ---------- 3D: hitches round a rail, a ring or the standing part, seen a little from above ----------
YAW, TILT = math.radians(-30), math.radians(32)   # turned a little to the side, looking a little down


def set_view(yaw, tilt):
    global YAW, TILT
    YAW, TILT = math.radians(yaw), math.radians(tilt)


def view(P, ox, oy):
    """World point (X right, Y up, Z towards the viewer) -> (screen x, screen y, depth, layer). The layer is the
    world Z: rope with Z < 0 is behind the rail or ring, which lie in the Z = 0 plane."""
    X, Y, Z = P
    Y1, Z1 = Y * math.cos(TILT) - Z * math.sin(TILT), Z * math.cos(TILT) + Y * math.sin(TILT)   # look down a little
    X2, Z2 = X * math.cos(YAW) + Z1 * math.sin(YAW), -X * math.sin(YAW) + Z1 * math.cos(YAW)   # then turn to the side
    return (ox + X2, oy - Y1, Z2, Z)


def plumb(X, Y, Z0):
    """A point on a line that hangs straight down the screen through (X, 0, Z0): leans towards the viewer by the tilt."""
    return (X, Y, Z0 - Y * math.tan(TILT))


def add(*vs):
    return tuple(sum(c) for c in zip(*vs))


def mul(k, v):
    return tuple(k * c for c in v)


def wrap(frame, segs, step=30):
    """Points of a rope wound round an axis. frame(u) -> (axis point, front vector, up vector) at position u along
    the axis; angle 0 is the front, 90 the top. segs: (angle0, angle1, u0, u1, radius0, radius1) pieces."""
    out = []
    for a0, a1, u0, u1, r0, r1 in segs:
        n = max(1, round(abs(a1 - a0) / step))
        for k in range(n + 1):
            if out and k == 0:
                continue
            f = k / n; a = math.radians(a0 + (a1 - a0) * f); u = u0 + (u1 - u0) * f; rr = r0 + (r1 - r0) * f
            O, e1, e2 = frame(u)
            out.append(add(O, mul(rr * math.cos(a), e1), mul(rr * math.sin(a), e2)))
    return out


def clove(x0, d, R, lift=8, dip=4):
    """A clove hitch (or two half hitches) round an axis, starting at the front at x0: first turn, then the
    diagonal across the front (raised by lift so it rides over the start), the second turn beside the first, and
    the end tucked under the diagonal (lowered by dip). Returns wrap() pieces."""
    return [(0, 90, x0, x0, R, R), (90, 270, x0, x0 + d, R, R),
            (270, 300, x0 + d, x0 + d * 2 / 3, R, R + lift), (300, 420, x0 + d * 2 / 3, x0 - d * 2 / 3, R + lift, R + lift),
            (420, 450, x0 - d * 2 / 3, x0 - d, R + lift, R),
            (450, 630, x0 - d, x0 - d / 2, R, R), (630, 720, x0 - d / 2, x0 + d / 2, R, R - dip)]


# ---------- objects ----------
def rail(x0, x1, r, ox, oy):
    """A round rail along the world X axis, drawn in the same view as the rope."""
    a, b = view((x0, 0, 0), ox, oy), view((x1, 0, 0), ox, oy)
    sa, sb = view((x0, r * .5, r * .5), ox, oy), view((x1, r * .5, r * .5), ox, oy)
    return (f'<line class="kd-tube-o" x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke-width="{2 * r + 4}"/>'
            f'<line class="kd-tube" x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke-width="{2 * r}"/>'
            f'<line class="kd-shine" x1="{sa[0]:.1f}" y1="{sa[1]:.1f}" x2="{sb[0]:.1f}" y2="{sb[1]:.1f}"/>')


def ring(Rg, t, ox, oy):
    """A mooring ring in the world XY plane (centre at the origin) hanging from a plate on the wall above it."""
    pts = [view((Rg * math.cos(math.radians(a)), Rg * math.sin(math.radians(a)), 0), ox, oy) for a in range(0, 360, 6)]
    d = 'M' + ' L'.join(f'{p[0]:.1f},{p[1]:.1f}' for p in pts) + 'Z'
    plate = [view(q, ox, oy) for q in ((-36, Rg + 52, -6), (36, Rg + 52, -6), (36, Rg + 8, -6), (-36, Rg + 8, -6))]
    eye = [view(q, ox, oy) for q in ((-9, Rg + 12, 0), (9, Rg + 12, 0), (9, Rg - 4, 0), (-9, Rg - 4, 0))]
    bolt = view((0, Rg + 32, -6), ox, oy)
    poly = lambda ps: 'M' + ' L'.join(f'{p[0]:.1f},{p[1]:.1f}' for p in ps) + 'Z'
    return (f'<path class="kd-obj" d="{poly(plate)}"/><circle class="kd-bolt" cx="{bolt[0]:.1f}" cy="{bolt[1]:.1f}" r="5"/>'
            f'<path class="kd-obj" d="{poly(eye)}"/>'
            f'<path class="kd-tube-o" d="{d}" stroke-width="{t + 4}"/><path class="kd-tube" d="{d}" stroke-width="{t}"/>')


def cleat(cx, cy, half, w):
    h = w / 2
    return (f'<path class="kd-obj" d="M{cx - half},{cy} C{cx - half},{cy - h} {cx - half + 10},{cy - h} {cx - half + 24},{cy - h * .8} '
            f'L{cx - 40},{cy - h * .55} C{cx - 20},{cy - h * .45} {cx + 20},{cy - h * .45} {cx + 40},{cy - h * .55} '
            f'L{cx + half - 24},{cy - h * .8} C{cx + half - 10},{cy - h} {cx + half},{cy - h} {cx + half},{cy} '
            f'C{cx + half},{cy + h} {cx + half - 10},{cy + h} {cx + half - 24},{cy + h * .8} '
            f'L{cx + 40},{cy + h * .55} C{cx + 20},{cy + h * .45} {cx - 20},{cy + h * .45} {cx - 40},{cy + h * .55} '
            f'L{cx - half + 24},{cy + h * .8} C{cx - half + 10},{cy + h} {cx - half},{cy + h} {cx - half},{cy}Z"/>'
            f'<circle class="kd-bolt" cx="{cx - 22}" cy="{cy}" r="4"/><circle class="kd-bolt" cx="{cx + 22}" cy="{cy}" r="4"/>')


# ---------- the knots ----------
def bowline():
    S = [(350, -20, 0), (350, 30, 0), (350, 62, 1),               # standing part: in front of the collar's back pass,
         (350, 112, -1), (350, 152, -1),                           # behind its front pass and behind the small loop's top
         (350, 198, 0), (318, 232, 1), (280, 232, 1),              # small loop: right side, bottom (over both end passes)
         (250, 206, 0), (252, 166, 0), (280, 148, -1), (318, 146, -1),  # left side, top (under both end passes)
         (350, 152, 1), (386, 172, 0),                             # top crosses over the standing part
         (404, 236, 0), (392, 304, 0), (338, 340, 0), (282, 314, 0), (262, 266, 0),  # the big loop
         (280, 232, -1), (280, 190, 0), (280, 148, 1),             # end comes up through the small loop from behind
         (282, 100, 1), (300, 70, 0), (350, 62, -1), (382, 68, 0),  # round behind the standing part
         (388, 96, 0), (350, 112, 1), (324, 124, 0),               # back across the front of it: the collar
         (318, 146, 1), (318, 190, 0), (318, 232, -1), (320, 272, 0)]  # down through the small loop, alongside itself
    r = Rope(S, tint_from=17)
    labels = [label(366, 24, 'Standing part'),
              label(424, 84, 'Collar', 'start', lead=(418, 80, 396, 84)),
              label(196, 196, 'Small loop', 'end', lead=(202, 192, 244, 194)),
              label(330, 298, 'Working end', 'middle'),
              label(428, 300, 'Big loop', 'start', lead=(422, 296, 400, 286))]
    return draw([r], labels=labels, view=(640, 360),
                aria='A bowline: a small loop in the standing part, the working end up through it, round behind the standing part and back down through it, leaving a fixed big loop')


def figure_eight():
    S = [(-10, 200, 0), (120, 200, 0), (200, 200, 1),             # standing part: over the end's upward pass,
         (268, 200, -1), (338, 200, 1), (400, 196, 0),            # under the loop's left side, over the end's way down
         (438, 172, 0), (446, 118, 0), (406, 78, 0), (346, 74, 0), (302, 96, 0),
         (280, 128, -1), (268, 200, 1),                           # loop comes down: under the end, over the standing part
         (256, 252, 0), (222, 290, 0), (172, 296, 0), (146, 262, 0), (166, 230, 0),
         (200, 200, -1),                                           # end goes up behind the standing part
         (222, 158, 0), (250, 136, 0.5), (280, 128, 1),            # across the front of the loop's left side
         (318, 142, 0), (334, 166, 0), (338, 200, -1),             # down through the loop, behind the standing part
         (344, 250, 0), (366, 300, 0)]
    r = Rope(S, tint_from=5)
    labels = [label(20, 180, 'Standing part'), label(386, 324, 'Working end', 'start', lead=(382, 318, 370, 306))]
    return draw([r], labels=labels, view=(640, 360),
                aria='A figure-of-eight stopper knot in the end of a line, shaped like the figure 8')


def clove_hitch():
    set_view(-30, 32)
    cy, r = 170, 12                    # rail centre on screen, rail radius
    R, x0, d = 44, 0, 84               # loose turns stand R out from the rail's axis
    rail_frame = lambda u: ((u, 0, 0), (0, 0, 1), (0, 1, 0))
    P = [plumb(x0, -260, R), plumb(x0, -140, R), plumb(x0, -50, R)]  # standing part hanging down in front
    P += wrap(rail_frame, clove(x0, d, R))
    P += [plumb(x0 + d / 2, 40, R - 4), plumb(x0 + d / 2, 90, R - 4)]  # the end comes out of the middle, upwards
    rope = Rope([view(q, 320, cy) for q in P], tint_from=12)
    labels = [label(344, 384, 'Standing part'),
              label(352, 74, 'Working end', 'start'),
              label(470, 124, 'First turn', 'start', lead=(464, 128, 396, 150)),
              label(470, 252, 'Second turn', 'start', lead=(464, 248, 354, 222))]
    return draw([rope], objects=rail(-420, 420, r, 320, cy), labels=labels, view=(640, 400),
                aria='A clove hitch on a rail: two turns side by side with a diagonal across the front, both ends coming out from under it')


def round_turn():
    set_view(-28, 30)
    ox, oy = 150, 190                   # where the post's axis meets the rope's height, on screen
    Rp, Rr, dp = 26, 26 + 11, 24        # post radius, turns' radius round it, spacing of the two turns
    post_frame = lambda u: (plumb(0, u, 0), (0, 0, 1), (-1, 0, 0))
    S = [(560, 0, Rr), (380, 0, Rr), (150, 0, Rr), (40, 0, Rr)]          # standing part from the boat, along the front
    S += wrap(post_frame, [(0, 540, 0, -1.5 * dp, Rr, Rr)])             # round turn: one and a half times round the post
    yb = -1.5 * dp
    xh, d, Rh = 290, -56, 32            # two half hitches round the standing part, like a clove hitch
    S += [(56, yb + 2, -Rr + 2), (140, yb - 8, -14), (230, -40, 12), plumb(xh - 6, -Rh + 2, Rr + Rh * .7)]
    sp_frame = lambda u: ((u, 0, Rr), (0, 0, 1), (0, 1, 0))
    S += wrap(sp_frame, clove(xh, d, Rh, lift=7, dip=5))
    S += [plumb(xh + d / 2, 34, Rr + Rh - 6), plumb(xh + d / 2 - 2, 70, Rr + Rh - 6)]
    rope = Rope([view(q, ox, oy) for q in S], tint_from=4)
    top = view(plumb(0, 70, 0), ox, oy)
    post = (f'<path class="kd-obj" d="M{ox - Rp},{top[1]:.1f} L{ox - Rp},400 L{ox + Rp},400 L{ox + Rp},{top[1]:.1f}Z"/>'
            f'<ellipse class="kd-obj" cx="{ox}" cy="{top[1]:.1f}" rx="{Rp}" ry="{Rp * math.sin(TILT):.1f}"/>')
    labels = [label(ox, 64, 'Round turn', 'middle'),
              label(ox + 162, 86, 'Two half hitches', 'middle'),
              label(620, 172, 'Standing part', 'end')]
    return draw([rope], objects=post, labels=labels, view=(640, 340),
                aria='A round turn and two half hitches on a post: one and a half turns round the post, then two half hitches round the standing part')


def cleat_hitch():
    cx, cy = 320, 180
    S = [(-20, 350, 0, -1), (120, 292, 0, -1), (230, 256, 0, -1), (350, 246, 0, -1), (432, 236, 0, -1),  # from the load
         (462, 180, 0, -1), (432, 124, 0, -1),                                     # under the far horn first
         (320, 116, 0, -1), (208, 124, 0, -1), (176, 180, 0, -1), (214, 228, 0, -1),  # a turn round the base
         (262, 208, 1, 1), (320, 184, 1, 1), (378, 160, 1, 1), (424, 140, 0, 0),   # figure of eight: over the top,
         (448, 180, -1, -1), (424, 222, 0, 0),                                     # under the far horn,
         (378, 203, 2, 2), (320, 179, 2, 2), (262, 155, 2, 2), (216, 136, 0, 0),   # back over the top,
         (192, 180, -1, -1), (216, 224, 0, 0),                                     # under the near horn
         (270, 212, 3, 3), (330, 190, 3, 3), (390, 166, 3, 3), (430, 150, 1, 1),   # locking hitch over the top,
         (436, 182, -1, -1), (418, 214, 1, 1),                                     # round the far horn
         (380, 198, 2.5, 2.5), (330, 180, 2.5, 2.5), (276, 158, 2.5, 2.5)]         # tail tucked under it
    rope = Rope(S, tint_from=22)
    labels = [label(70, 346, 'To the load', 'start', muted=True),
              label(462, 82, 'Far horn first', 'middle', muted=True, lead=(462, 88, 456, 122)),
              label(510, 262, 'Locking hitch', 'start', lead=(506, 258, 432, 214))]
    return draw([rope], objects=cleat(cx, cy, 170, 44), labels=labels, view=(640, 360),
                aria='A cleat hitch seen from above: a turn round the base of the cleat, a figure of eight over the horns, and a locking hitch')


def reef_knot():
    A = [(-20, 132, 0), (120, 132, 0), (220, 136, 0), (320, 148, 1),        # standing part, over the other line's
         (404, 164, 0), (440, 190, 0), (404, 216, 0),                       # bight closes round the other one
         (320, 232, -1), (226, 246, 0), (172, 250, 0)]                      # end, under the other line's end
    B = [(660, 132, 0), (520, 132, 0), (420, 136, 0), (320, 148, -1),
         (236, 164, 0), (200, 190, 0), (236, 216, 0),
         (320, 232, 1), (414, 246, 0), (468, 250, 0)]
    rA, rB = Rope(A), Rope(B, tint_from=0)
    labels = [label(24, 116, 'Standing part'), label(616, 116, 'Standing part', 'end'),
              label(146, 276, 'Working end', 'middle'), label(494, 276, 'Working end', 'middle')]
    return draw([rA, rB], labels=labels, view=(640, 300),
                aria='A reef knot: two interlocking bights, each end lying alongside its own standing part')


KNOTS = {
    'bowline': (bowline, 'Bowline. The working end comes up through the small loop, round behind the standing part and back down, finishing inside the big loop.'),
    'clove-hitch': (clove_hitch, 'Clove hitch on a rail. Two turns sit side by side, and the second crosses over the first so both ends come out from under it.'),
    'round-turn': (round_turn, 'Round turn and two half hitches on a post. The round turn takes the load; both half hitches go round the standing part the same way.'),
    'cleat-hitch': (cleat_hitch, 'Cleat hitch seen from above, with the load coming from the left: far horn first, a turn round the base, a figure of eight, then the locking hitch on top.'),
    'figure-eight': (figure_eight, 'Figure-of-eight stopper. Too fat to pass through a block, and easy to undo afterwards.'),
    'reef-knot': (reef_knot, 'Reef knot. Each working end lies alongside its own standing part, and both ends are on the same side.'),
}

CSS = r'''
.kd .kr-halo { fill: none; stroke: var(--bg); stroke-width: ''' + str(HALO) + '''; }
.kd .kr-halo-dot { fill: var(--bg); }
.kd .kr-line { fill: none; stroke: var(--ink); stroke-width: ''' + str(W) + '''; stroke-linejoin: round; }
.kd .kr-line-dot { fill: var(--ink); }
.kd .kr-core { fill: none; stroke: var(--bg); stroke-width: ''' + str(CORE) + '''; stroke-linejoin: round; }
.kd .kr-core-dot { fill: var(--bg); }
.kd .kr-tint { stroke: var(--rope-tint); }
.kd .kr-tint-dot { fill: var(--rope-tint); }
.kd .kr-lay { fill: none; stroke: var(--ink); stroke-opacity: .16; stroke-width: ''' + str(CORE) + '''; stroke-dasharray: 1.6 5.4; }
.kd .kd-obj { fill: var(--band); stroke: var(--ink); stroke-width: 2; }
.kd .kd-shine { stroke: var(--bg); stroke-width: 3; stroke-linecap: round; opacity: .9; }
.kd .kd-bolt { fill: var(--bg); stroke: var(--ink); stroke-width: 1.5; }
.kd .kd-tube-o { fill: none; stroke: var(--ink); stroke-linecap: round; stroke-linejoin: round; }
.kd .kd-tube { fill: none; stroke: var(--band); stroke-linecap: round; stroke-linejoin: round; }
.kd .kd-lead { stroke: var(--muted); stroke-width: 1.2; }
.kd { --rope-tint: color-mix(in srgb, var(--accent) 34%, var(--bg)); }
'''
