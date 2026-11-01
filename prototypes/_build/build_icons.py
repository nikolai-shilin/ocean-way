"""Ocean Way icon set.

Writes:
  prototypes/icons/ow-icons.svg   sprite (<symbol id="ow-…">), drop into a page and use <use href="#ow-…">
  prototypes/icons/svg/<id>.svg   one file per icon (stroke 2, currentColor)
  prototypes/icons.html           study sheet: rules, all icons, where to use them

Grid rules (the same ones the sheet explains):
  24 x 24 box, 2 px stroke, round caps and joins, content inside 2..22.
  The horizon always tilts 8.4 degrees up to the right, like the line in the mark.
  At most one solid shape per icon (class "f"): the sail, the date, the needle...
  Solid shapes take --ow-2 when set, so a page can colour them with the accent.

Run:  python3 prototypes/_build/build_icons.py
"""
import html
import math
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TILT = math.tan(math.radians(8.4))  # slope of the horizon in the mark


def hz(x1, x2, y_mid, cx=12):
    """Tilted horizon from x1 to x2; y_mid is its height at x = cx."""
    y = lambda x: y_mid - TILT * (x - cx)
    return f'<path d="M{x1:g} {y(x1):.2f} {x2:g} {y(x2):.2f}"/>'


def waves(y, x1=2, x2=22, n=4):
    w = (x2 - x1) / n
    d = f"M{x1:g} {y:g}"
    for i in range(n):
        d += f"c{w/3:.2f} {-1.3 if i % 2 == 0 else 1.3} {2*w/3:.2f} {-1.3 if i % 2 == 0 else 1.3} {w:.2f} 0"
    return f'<path d="{d}"/>'


def small_sail(mast_x, base_y, h, fill=False):
    """Mast plus a sail with the curved leech of the mark's sail."""
    w = h * 0.62
    top = base_y - h
    sail = (f"M{mast_x:g} {top:.2f}C{mast_x + w*0.55:.2f} {top + h*0.3:.2f} "
            f"{mast_x + w:.2f} {top + h*0.7:.2f} {mast_x + w:.2f} {base_y:.2f}H{mast_x:g}z")
    cls = ' class="f"' if fill else ""
    return f'<path{cls} d="{sail}"/>'


# ---------------------------------------------------------------------------
# The mark at icon weight: ring, horizon and the sail, cut by the ring.
def mark():
    cx = cy = 12
    r_ring = 9.5
    r_cut = 8.6  # sail and horizon stop a little inside the ring stroke
    k = r_ring / 10.86

    def lp(x, y):  # logo coordinates (viewBox 2..118) -> icon coordinates
        x, y = (x - 2) / 116 * 24, (y - 2) / 116 * 24
        return cx + k * (x - cx), cy + k * (y - cy)

    def bez(p, t):
        (x0, y0), (x1, y1), (x2, y2), (x3, y3) = p
        u = 1 - t
        return (u**3*x0 + 3*u*u*t*x1 + 3*u*t*t*x2 + t**3*x3,
                u**3*y0 + 3*u*u*t*y1 + 3*u*t*t*y2 + t**3*y3)

    def split(p, t):  # first part of a cubic, 0..t
        (x0, y0), (x1, y1), (x2, y2), (x3, y3) = p
        L = lambda a, b: (a[0] + (b[0]-a[0])*t, a[1] + (b[1]-a[1])*t)
        a, b, c = L(p[0], p[1]), L(p[1], p[2]), L(p[2], p[3])
        d, e = L(a, b), L(b, c)
        f = L(d, e)
        return [p[0], a, d, f]

    def cut_t(p):
        lo, hi = 0.0, 1.0
        for _ in range(60):
            m = (lo + hi) / 2
            x, y = bez(p, m)
            if math.hypot(x - cx, y - cy) < r_cut:
                lo = m
            else:
                hi = m
        return lo

    top = [lp(28, 59), lp(36, 36), lp(72, 23.5), lp(118, 32)]
    bot = [lp(28, 59), lp(47, 43.5), lp(84, 41), lp(118, 51)]
    t1, t2 = cut_t(top), cut_t(bot)
    a, b = split(top, t1), split(bot, t2)
    f = lambda q: f"{q[0]:.2f} {q[1]:.2f}"
    sail = (f"M{f(a[0])}C{f(a[1])} {f(a[2])} {f(a[3])}"
            f"A{r_cut} {r_cut} 0 0 1 {f(b[3])}"
            f"C{f(b[2])} {f(b[1])} {f(b[0])}z")
    # horizon chord
    x0, y0 = lp(0, 72.3)
    x1, y1 = lp(120, 54.6)
    dx, dy = x1 - x0, y1 - y0
    # solve |p0 + s d - c| = r_cut
    A = dx*dx + dy*dy
    B = 2 * (dx*(x0-cx) + dy*(y0-cy))
    C = (x0-cx)**2 + (y0-cy)**2 - r_cut**2
    s1 = (-B - math.sqrt(B*B - 4*A*C)) / (2*A)
    s2 = (-B + math.sqrt(B*B - 4*A*C)) / (2*A)
    h1 = (x0 + s1*dx, y0 + s1*dy)
    h2 = (x0 + s2*dx, y0 + s2*dy)
    return (f'<circle cx="12" cy="12" r="{r_ring}"/>'
            f'<path d="M{f(h1)} {f(h2)}"/>'
            f'<path class="f" d="{sail}"/>')


def theme():
    r = 8.5
    a = math.radians(8.4)
    p1 = (12 - r*math.cos(a), 12 + r*math.sin(a))
    p2 = (12 + r*math.cos(a), 12 - r*math.sin(a))
    return (f'<circle cx="12" cy="12" r="{r}"/>'
            f'<path class="f" d="M{p1[0]:.2f} {p1[1]:.2f} {p2[0]:.2f} {p2[1]:.2f}'
            f'A{r} {r} 0 0 1 {p1[0]:.2f} {p1[1]:.2f}z"/>')


def globe():
    r = 9
    a = math.radians(8.4)
    return (f'<circle cx="12" cy="12" r="{r}"/>'
            f'<path d="M{12 - r*math.cos(a):.2f} {12 + r*math.sin(a):.2f} {12 + r*math.cos(a):.2f} {12 - r*math.sin(a):.2f}"/>'
            '<path d="M12 3c-2.6 2.4-3.9 5.4-3.9 9s1.3 6.6 3.9 9c2.6-2.4 3.9-5.4 3.9-9S14.6 5.4 12 3z"/>')


def points_of_sail():
    cx, cy, r = 12, 14, 7
    p = lambda deg: (cx + r*math.cos(math.radians(deg)), cy + r*math.sin(math.radians(deg)))
    a, b = p(-130), p(-50)
    boat = p(15)
    return (f'<path d="M{a[0]:.2f} {a[1]:.2f}A{r} {r} 0 1 0 {b[0]:.2f} {b[1]:.2f}"/>'
            '<path d="M12 2v7.5M9.5 7 12 9.5 14.5 7"/>'
            f'<circle class="f" cx="{boat[0]:.2f}" cy="{boat[1]:.2f}" r="1.6"/>')


def lifebuoy(cy=11, r=7, ri=3):
    s = []
    for d in (45, 135, 225, 315):
        c, si = math.cos(math.radians(d)), math.sin(math.radians(d))
        s.append(f"M{12 + ri*c:.2f} {cy + ri*si:.2f} {12 + r*c:.2f} {cy + r*si:.2f}")
    return (f'<circle cx="12" cy="{cy}" r="{r}"/><circle cx="12" cy="{cy}" r="{ri}"/>'
            f'<path d="{"".join(s)}"/>')


def propeller():
    blade = "M12 9.6c-.9-2.6-.4-5.2 1.6-6.4 1.9 1.3 1.6 4.3-.4 6.6"
    return ('<circle cx="12" cy="12" r="2.2"/>'
            + "".join(f'<path d="{blade}" transform="rotate({a} 12 12)"/>' for a in (0, 120, 240)))


def flotilla():
    y = lambda x: 18.6 - TILT * (x - 12)
    return (hz(2, 22, 18.6)
            + small_sail(4.5, y(4.5) - 1.6, 6)
            + small_sail(10.5, y(10.5) - 1.6, 10, fill=True)
            + small_sail(16.5, y(16.5) - 1.6, 6))


def stars(cx, cy, r, inner=0.32):
    pts = []
    for i in range(8):
        rr = r if i % 2 == 0 else r * inner
        a = math.radians(-90 + i * 45)
        pts.append(f"{cx + rr*math.cos(a):.2f} {cy + rr*math.sin(a):.2f}")
    return f'<path class="f" d="M{" ".join(pts)}z"/>'


# ---------------------------------------------------------------------------
# id, label, svg body, where it goes
GROUPS = [
 ("brand", "Brand", "The mark and the signs taken from it. Use them where Ocean Way speaks for itself: section openers, own-boat badges, empty states.", [
  ("mark", "Mark", mark(), "Footer sign-off, “Ocean Way boat” badge on fleet cards, empty states"),
  ("horizon", "Horizon", hz(2, 22, 12.6) + waves(17.5, 5, 19, 3), "Section divider on long pages, the theory hub header"),
  ("sail", "Sail", small_sail(7, 19, 15, fill=True) + '<path d="M7 19V3.6M4 21h13"/>', "Bullet for lists of skills and highlights"),
  ("theme", "Light and dark", theme(), "Theme button in the header (replaces i-theme)"),
 ]),
 ("ui", "Interface", "Same weight as the rest, kept plain on purpose so the nautical icons stand out.", [
  ("arrow", "Arrow", '<path d="M4.5 12h15M13.5 6l6 6-6 6"/>', "Card links, “All courses”, buttons with a direction"),
  ("arrow-out", "External", '<path d="M7 17 17 7M9 7h8v8"/>', "Links to IYT, the logbook app, maps"),
  ("chevron", "Chevron", '<path d="m6 9 6 6 6-6"/>', "FAQ rows, language menu, date pickers"),
  ("close", "Close", '<path d="M6 6l12 12M18 6 6 18"/>', "Mobile menu, dialogs, photo viewer"),
  ("menu", "Menu", '<path d="M4 7h16M4 12h16M4 17h11"/>', "Burger menu on phones"),
  ("search", "Search", '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/>', "Theory hub search, dates filter"),
  ("plus", "Plus", '<path d="M12 5v14M5 12h14"/>', "Guest counter, open a section"),
  ("minus", "Minus", '<path d="M5 12h14"/>', "“Not included” list, guest counter"),
  ("check", "Check", '<path d="m5 12.5 4.5 4.5L19 7.5"/>', "“Included” list, checklists, form steps done"),
  ("info", "Info", '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.6v.2"/>', "Notes about certificate limits, deposits"),
  ("globe", "Language", globe(), "Language switcher (EN · RU · DE · ES)"),
  ("user", "Account", '<circle cx="12" cy="8" r="3.6"/><path d="M5 20c.8-3.6 3.6-5.6 7-5.6s6.2 2 7 5.6"/>', "Account button, booking “Your details” step"),
  ("saved", "Saved", '<path d="M6 21V3M6 4h12l-3.5 4.5L18 13H6"/>', "Saved courses and passages, a burgee in place of the heart"),
  ("download", "Download", '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>', "Kit list PDF, course syllabus, invoice"),
  ("share", "Share", '<path d="M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>', "Share a passage or a theory article"),
  ("filter", "Filter", '<path d="M4 6h16M7 12h10M10 18h4"/>', "Filter dates by month, course or port"),
  ("play", "Play", '<circle cx="12" cy="12" r="9"/><path class="f" d="M10 8.5v7l5.5-3.5z"/>', "Videos in theory articles and the gallery"),
 ]),
 ("facts", "Course and passage facts", "The small grey icons in front of facts on cards and at the top of course pages.", [
  ("clock", "Duration", '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>', "“6 days”, “Half a day”, “11 days”"),
  ("calendar", "Dates", '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/><rect class="f" x="14" y="14" width="3" height="3" rx=".5"/>', "“Sat to Sat”, next start date, date picker"),
  ("pin", "Port", '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle class="f" cx="12" cy="10" r="2"/>', "“Kuşadası, Türkiye”, “Athens, Alimos Marina”"),
  ("crew", "Students", '<circle cx="9" cy="8" r="3.4"/><path d="M2.5 20c.6-3.6 3.2-5.6 6.5-5.6s5.9 2 6.5 5.6M15.8 4.8a3.4 3.4 0 0 1 0 6.4M18.4 14.8c1.8.8 2.8 2.6 3.1 5.2"/>', "“4 students”, places left, berths"),
  ("licence", "Certificate", '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M7 8h7M7 11.5h4"/><circle cx="16.5" cy="13.5" r="2.5"/><path d="m15 15.5-.8 5.2 2.3-1.3 2.3 1.3-.8-5.2"/>', "“IYT or RYA”, “Valid 5 years”, what you get"),
  ("level", "Level", '<path d="M3 20h5v-4.5h5V11h5V6.5h3"/>', "“No experience needed” → “Passages and Yachtmaster”, the course ladder"),
  ("offshore", "Offshore range", '<circle class="f" cx="4.5" cy="19.5" r="1.8"/><path d="M11 19.5a6.5 6.5 0 0 0-6.5-6.5M17.5 19.5a13 13 0 0 0-13-13M4.5 2.5v2"/>', "“Up to 20 / 60 / 150 nm offshore”, “Any ocean”"),
  ("route", "Route", '<circle cx="5" cy="18.5" r="2"/><circle class="f" cx="19" cy="5.5" r="2"/><path d="M6.8 17.4c3-1.7 1.8-6 5.6-7.6 1.9-.8 3.4-.9 4.9-2.7"/>', "Passage cards: “Kuşadası → Bodrum”, distance in nm"),
  ("night", "Night sailing", '<path d="M14.5 3.5a6 6 0 1 0 5.5 8.6 4.8 4.8 0 0 1-5.5-8.6z"/>' + hz(2, 22, 19.2), "“The night passage”, passages with night legs"),
  ("read", "Reading time", '<path d="M12 6.5C10 5 7 4.5 3 5v13c4-.5 7 0 9 1.5 2-1.5 5-2 9-1.5V5c-4-.5-7 0-9 1.5zM12 6.5v13"/>', "“6 min read” on theory cards (replaces i-clip)"),
  ("price", "Price", '<circle cx="12" cy="12" r="9"/><path d="M15.4 8.6a4.4 4.4 0 1 0 0 6.8M7.5 10.8h5.5M7.5 13.4h4.5"/>', "Prices page in the menu, “Deposit or full payment”"),
  ("logbook", "Sea miles", '<path d="M5 19.5V4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5zm0 0A1.5 1.5 0 0 0 6.5 21H19"/><path d="M8.5 10c1.1-.9 2.2-.9 3.3 0s2.2.9 3.2 0"/>', "Sea miles you log, entry requirements (“300 nm”)"),
 ]),
 ("courses", "Courses", "One sign per course, from first radio licence to ocean crossings. Use the same sign in the course card, the course page header and the ladder.", [
  ("vhf", "VHF Radio Operator", '<rect x="7" y="7" width="8" height="14" rx="2"/><path d="M9 7V3M9.5 11h3M9.5 13.5h3M18 8.5a3 3 0 0 1 0 4M20.3 6.3a6 6 0 0 1 0 8.4"/>', "Course card, course page, “Needed for all crew” note"),
  ("intro", "Introduction to Yachting", small_sail(11, 15.5, 12.5, fill=True) + '<path d="M11 15.5V3M3.5 15.5h17l-2.5 4h-12z"/>', "Course card, “No experience needed” beginners block"),
  ("flotilla", "Flotilla Skipper", flotilla(), "Flotilla Skipper card, “sail in a group” passages"),
  ("icc", "ICC", '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><circle cx="8.5" cy="12" r="3"/>' + hz(5.5, 11.5, 12, 8.5) + '<path d="M14.5 10h3.5M14.5 14h3.5"/>', "ICC card, “Which licence you can get”"),
  ("bareboat", "Bareboat Skipper", '<circle cx="12" cy="12" r="6"/><circle class="f" cx="12" cy="12" r="1.6"/><path d="M12 2.5V6M12 18v3.5M2.5 12H6M18 12h3.5M5.3 5.3l2.5 2.5M16.2 16.2l2.5 2.5M18.7 5.3l-2.5 2.5M7.8 16.2l-2.5 2.5"/>', "Bareboat Skipper card and page header"),
  ("coastal", "Yachtmaster Coastal", '<path d="M9 21 10.2 9h3.6L15 21zM10 9V6h4v3M10 6l2-2.5L14 6M5 21h14M4.5 6.5 7.5 7M19.5 6.5l-3 .5"/><path class="f" d="M10.4 14h3.2l.3 3h-3.8z"/>', "Yachtmaster Coastal card, pilotage topics"),
  ("offshore-ym", "Yachtmaster Offshore", '<circle cx="12" cy="12" r="9"/><path class="f" d="M12 4.8 14 12h-4z"/><path d="M10 12h4l-2 7.2z"/>', "Yachtmaster Offshore card, navigation skills"),
  ("ocean", "Yachtmaster Ocean", stars(12, 7.5, 5) + hz(2, 22, 15.5) + waves(19.5, 4, 20, 4), "Yachtmaster Ocean card, astro-navigation"),
 ]),
 ("theory", "Theory", "One sign per article. They head the article, mark the card on the hub and sit in the “Keep reading” list.", [
  ("points-of-sail", "Points of sail", points_of_sail(), "theory-points-of-sail"),
  ("knots", "Knots", '<path d="M12 12C8.2 9.6 7 8.1 7 6.6a5 5 0 0 1 10 0c0 1.5-1.2 3-5 5.4s-5 3.9-5 5.4a5 5 0 0 0 10 0c0-1.5-1.2-3-5-5.4z"/><path d="M12 1.6v-.1M12 22.4v.1"/>', "theory-knots"),
  ("tacking", "Tacking and gybing", '<path d="M9 21.5 5 16.5l8-4-5-5.5 5.5-3.5"/><path d="M10.3 2.6 14 3.3l-.6 3.7"/>', "theory-tacking-gybing"),
  ("reefing", "Reefing", '<path d="M7 3v16h12C16 13 12.5 7.5 7 3z"/><path d="M7 15h9.5M7 11.2h6.3"/><path d="M4 21h16"/>', "theory-reefing"),
  ("right-of-way", "Right of way", '<path d="M3 8h13M13 5l3 3-3 3"/><path d="M13 21v-3.5a4 4 0 0 1 4-4h3.5M18 10.5l3 3-3 3"/>', "theory-right-of-way"),
  ("lights", "Navigation lights", '<path d="M12 5.5V16M6 16h12l-2 4H8z"/><circle cx="12" cy="3.6" r="1.6"/><circle class="f" cx="5.5" cy="12.5" r="1.7"/><circle cx="18.5" cy="12.5" r="1.7"/>', "theory-navigation-lights"),
  ("buoyage", "Buoyage", '<path class="f" d="M12 2.2 14.3 6H9.7z"/><path d="M12 6v2.5M8.5 18 10 8.5h4l1.5 9.5zM9.3 13.2h5.4"/>' + hz(2, 22, 19.3), "theory-buoyage"),
  ("med-mooring", "Med mooring", '<path d="M2 3h20M9 7.5 6.5 3M15 7.5 17.5 3"/><path d="M8.5 7.5h7v5c0 3.4-1.4 6.3-3.5 8.7-2.1-2.4-3.5-5.3-3.5-8.7z"/>', "theory-med-mooring"),
  ("alongside", "Berthing alongside", '<path d="M2 20.5h20"/><path d="M4 9.5h10.5c3 0 5.3 1.7 6.5 3.75-1.2 2.05-3.5 3.75-6.5 3.75H4z"/><path d="M7.5 17v3.5M14 17v3.5"/>', "theory-berthing-alongside"),
  ("anchor", "Anchoring", '<circle cx="12" cy="4.8" r="2"/><path d="M12 6.8V21M8.5 10.5h7M4.5 13.5a7.5 7.5 0 0 0 15 0M3 15.2l1.5-1.7 1.8 1.4M21 15.2l-1.5-1.7-1.8 1.4"/>', "theory-anchoring, anchorage stops on passage maps"),
  ("tides", "Tides", '<path d="M8 10V3M5.5 5.5 8 3l2.5 2.5M16 3v7M13.5 7.5 16 10l2.5-2.5"/>' + waves(15, 2, 22, 4) + waves(19.5, 2, 22, 4), "theory-tides"),
  ("weather", "Weather", '<path d="M7 16.5h9.5a3.7 3.7 0 0 0 .6-7.4 5.7 5.7 0 0 0-10.9 1.5A2.95 2.95 0 0 0 7 16.5z"/><path d="M3 20.5h8.5M14.5 20.5H17"/>', "theory-weather, wind forecast on passage pages"),
  ("fix", "Position fixing", '<path d="M3 16.5 20.5 8M4 7.5l16.5 9.5M12.4 2.5l.6 19"/><circle cx="12.5" cy="12.2" r="3.4"/>', "theory-position-fixing"),
  ("planning", "Passage planning", '<path d="M3 6l6-2.5 6 2.5 6-2.5v14l-6 2.5-6-2.5-6 2.5z"/><path d="M6.5 15.5 10 12.5l3 1.2 3.4-4.2"/><circle class="f" cx="17.2" cy="8.5" r="1.6"/>', "theory-passage-planning"),
  ("radio", "VHF procedure", '<rect x="9" y="2.5" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"/>', "theory-vhf-procedure, Mayday calls"),
  ("lifejacket", "Safety on board", '<path d="M9 3 6 5v14.5A1.5 1.5 0 0 0 7.5 21H11V9.5zM15 3l3 2v14.5a1.5 1.5 0 0 1-1.5 1.5H13V9.5zM9 3c.6 2 1.6 3.4 3 3.4S14.4 5 15 3"/><path d="M6 14h12"/>', "theory-safety-on-board, safety briefing"),
  ("mob", "Man overboard", lifebuoy(10.5, 7, 3) + waves(20.5, 2, 22, 4), "theory-man-overboard, safety on course pages"),
 ]),
 ("fleet", "Fleet and life aboard", "For the spec rows on boat pages and the “Included / What to bring” blocks.", [
  ("monohull", "Monohull", '<path d="M11 2.5V16"/><path d="M11 3.5C8.2 7.3 6.4 11 5.6 14.5H11z"/>' + '<path class="f" d="M12.6 5.5c2.5 2.7 4.4 5.8 5.2 9H12.6z"/>' + '<path d="M3 16h18l-2.5 4h-13z"/>', "Fleet filter, boat type on yacht cards"),
  ("catamaran", "Catamaran", '<path d="M12 2.5V15"/><path class="f" d="M12.2 4c3.4 2.8 5.4 6.4 6 10H12.2z"/><path d="M3 15h18M4.5 15v3a2 2 0 0 0 4 0v-3M15.5 15v3a2 2 0 0 0 4 0v-3"/>', "Fleet filter, Lagoon and Bali boats"),
  ("length", "Length", '<path d="M4 6h16l-2 4H6z"/><path d="M3 16.5h18M6 13.5l-3 3 3 3M18 13.5l3 3-3 3"/>', "“12.8 m” in the yacht spec row"),
  ("cabin", "Cabins", '<path d="M3 19V7M3 15h18v4M21 15v-2.5a3 3 0 0 0-3-3h-7V15"/><rect x="5" y="10.5" width="3.5" height="2.5" rx="1.25"/>', "Cabins on yacht cards, cabin choice in booking"),
  ("engine", "Engine", propeller(), "Engine hours, “Boat handling under engine” skill"),
  ("fuel", "Fuel and water", '<path d="M5 21V5a1.5 1.5 0 0 1 1.5-1.5h5A1.5 1.5 0 0 1 13 5v16M3.5 21h11M5 10h8M13 8l3 2.5V17a1.5 1.5 0 0 0 3 0V8l-2.5-2.5"/>', "Tank sizes, “Fuel not included”"),
  ("tool", "Boat systems", '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-2.5z"/>', "“Boat systems” skill, service history"),
  ("charter", "Charter", '<circle cx="8" cy="15.5" r="4"/><path d="M11 12.5l8.5-8.5M16 7.5l2.5 2.5M18.5 5 21 7.5"/>', "“Charter skills”, “From licence to your first charter”, charter prices"),
  ("meals", "Meals", '<path d="M7 3v6a2 2 0 0 0 4 0V3M9 11v10M17 21V3c-2 1.2-3 4-3 7.5h3"/>', "“Breakfast and lunch on board”, chef on premium passages"),
  ("snorkel", "Swimming", '<path d="M3 8.5h13.5v4.5a2 2 0 0 1-2 2H12l-1.5-1.8h-1L8 15H5a2 2 0 0 1-2-2z"/><path d="M20 3.5v10.3c0 1.7-1.1 2.7-2.8 2.7"/>' + waves(20.5, 2, 22, 4), "Swim stops on passage itineraries"),
  ("bag", "What to bring", '<rect x="3" y="8" width="18" height="12" rx="3"/><path d="M8.5 8V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v2M3 13h18"/>', "“What to bring”, kit list download"),
  ("sun", "Season", '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4"/>', "Sailing season, “Sun cream and a hat” in kit list"),
 ]),
 ("booking", "Booking and contact", "The booking form, the confirmation screen and the footer.", [
  ("card", "Card", '<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19M6 15h4"/>', "Payment method: card"),
  ("bank", "Bank transfer", '<path d="M3 9 12 4l9 5zM5 11v6.5M9.7 11v6.5M14.3 11v6.5M19 11v6.5M3 20.5h18"/>', "Payment method: bank transfer"),
  ("lock", "Secure", '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/><circle class="f" cx="12" cy="15.5" r="1.4"/>', "Next to the Pay button, “Secure payment”"),
  ("done", "Confirmed", '<circle cx="12" cy="12" r="9"/><path d="m7.8 12.3 2.9 2.9 5.5-5.6"/>', "“Request received” screen, confirmed booking"),
  ("mail", "Email", '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.8 7.2 8.2 6 8.2-6"/>', "Contact block, “We will email you”"),
  ("phone", "Phone", '<path d="M5.3 3.5h3.3l1.6 4.4-2.1 1.4a11.5 11.5 0 0 0 6.6 6.6l1.4-2.1 4.4 1.6v3.3a1.8 1.8 0 0 1-2 1.8A16.5 16.5 0 0 1 3.5 5.5a1.8 1.8 0 0 1 1.8-2z"/>', "Phone field, contact block"),
  ("chat", "Chat", '<path d="M5.5 4.5h13a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2H10l-4.5 3.5v-3.5h0a2 2 0 0 1-2-2V6.5a2 2 0 0 1 2-2z"/><path d="M8 9.5h8M8 12.5h5"/>', "“Ask a question” button, FAQ footer"),
  ("telegram", "Telegram", '<path d="M21 4 3 11l6 2 2 6 3-4 5 4z"/><path d="m9 13 7-5"/>', "Footer, “New dates every day” channel"),
  ("instagram", "Instagram", '<rect x="3" y="3" width="18" height="18" rx="5.5"/><circle cx="12" cy="12" r="4"/><circle class="f" cx="17.2" cy="6.8" r=".4"/>', "Footer"),
  ("youtube", "YouTube", '<rect x="2.5" y="5.5" width="19" height="13" rx="4"/><path class="f" d="M10 9.3v5.4l4.6-2.7z"/>', "Footer, video lessons"),
 ]),
]

SOLID = 'style="fill:var(--ow-2,currentColor);stroke:var(--ow-2,currentColor)"'


def body_for_sprite(b):
    return b.replace('class="f"', SOLID)


def body_standalone(b):
    return b.replace('class="f"', 'fill="currentColor"')


def main():
    os.makedirs(os.path.join(ROOT, "icons", "svg"), exist_ok=True)
    all_icons = [(g, *i) for g in GROUPS for i in g[3]]
    ids = [i[1] for i in all_icons]
    assert len(ids) == len(set(ids)), "duplicate id"

    symbols = "\n".join(
        f'  <symbol id="ow-{i}" viewBox="0 0 24 24">{body_for_sprite(b)}</symbol>'
        for _, i, _, b, _ in all_icons)
    sprite = ('<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute" aria-hidden="true">\n'
              f"{symbols}\n</svg>\n")
    open(os.path.join(ROOT, "icons", "ow-icons.svg"), "w").write(sprite)

    for _, i, _, b, _ in all_icons:
        open(os.path.join(ROOT, "icons", "svg", f"{i}.svg"), "w").write(
            '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" '
            'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
            f"{body_standalone(b)}</svg>\n")

    tpl = open(os.path.join(ROOT, "_build", "icons_sheet.html")).read()
    use = lambda i, cls="i": f'<svg class="{cls}" aria-hidden="true"><use href="#ow-{i}"/></svg>'

    groups_html = []
    for key, title, lead, items in GROUPS:
        tiles = "".join(
            f'<figure class="tile" id="t-{i}"><div class="big">{use(i)}</div>'
            f'<div class="small">{use(i)}{use(i)}</div>'
            f'<figcaption><b>{html.escape(label)}</b><code>ow-{i}</code><span>{html.escape(where)}</span></figcaption></figure>'
            for i, label, _, where in items)
        groups_html.append(
            f'<section class="grp" id="g-{key}"><div class="grp-head"><h2>{title}</h2>'
            f'<span class="count">{len(items)}</span></div><p class="lead">{lead}</p>'
            f'<div class="tiles">{tiles}</div></section>')

    out = (tpl.replace("{{SPRITE}}", sprite)
              .replace("{{GROUPS}}", "\n".join(groups_html))
              .replace("{{COUNT}}", str(len(all_icons))))
    out = re.sub(r"\{\{use:([a-z0-9-]+)\}\}", lambda m: use(m.group(1)), out)
    open(os.path.join(ROOT, "icons.html"), "w").write(out)
    print(f"{len(all_icons)} icons -> icons/ow-icons.svg, icons/svg/, icons.html")


if __name__ == "__main__":
    main()
