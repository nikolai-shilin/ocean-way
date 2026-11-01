"""Build ru/de/es copies of the RYC prototype pages from the English ones.
Each language gets its own file (home.ru.html, …) so every version has a crawlable URL: html lang, canonical, hreflang
to all four, og:locale, translated title/description/JSON-LD, same-language internal links, a language switcher.
Run after the English pages change. Reports any string without a translation."""
import re, json, html, os, sys
S = os.path.dirname(os.path.abspath(__file__))
P = '/Users/shilin/Developer/ocean-way/prototypes'
BASE = 'https://www.rycrentals.com'
LANGS = ['en', 'ru', 'de', 'es']
NAMES = {'en': 'English', 'ru': 'Русский', 'de': 'Deutsch', 'es': 'Español'}
SW_LABEL = {'en': 'Language', 'ru': 'Язык', 'de': 'Sprache', 'es': 'Idioma'}
LOCALE = {'en': 'en_GB', 'ru': 'ru_RU', 'de': 'de_DE', 'es': 'es_ES'}
PAGES = {'home.html': '/{l}/', 'bareboat-skipper-course.html': '/{l}/courses/bareboat-skipper/', 'booking.html': None}
import glob as _g
if os.path.exists(f'{P}/theory.html'):
    PAGES['theory.html'] = '/{l}/theory/'
    for _f in sorted(_g.glob(f'{P}/theory-*.html')):
        _n = os.path.basename(_f)
        if re.fullmatch(r'theory-[a-z-]+\.html', _n):
            PAGES[_n] = '/{l}/theory/' + _n[len('theory-'):-5] + '/'
LINKED = ('home', 'bareboat-skipper-course', 'booking', 'theory(?:-[a-z-]+)?')
ATTRS = ('alt', 'aria-label', 'placeholder', 'title')
LD_KEYS = ('name', 'description', 'text', 'educationalCredentialAwarded')

def fname(page, l):
    return page if l == 'en' else page.replace('.html', f'.{l}.html')

SWITCH_CSS = '''
/* Language switcher */
.lang { position: relative; }
.lang summary { list-style: none; width: auto; min-width: 40px; padding: 0 12px; font: 700 13px/1 var(--sans); letter-spacing: .02em; cursor: pointer; }
.lang summary::-webkit-details-marker { display: none; }
.lang-menu { position: absolute; right: 0; top: calc(100% + 8px); z-index: 50; min-width: 180px; margin: 0; padding: 8px; list-style: none; background: var(--bg); border: 1px solid var(--line); border-radius: 22px; box-shadow: 0 12px 32px rgba(0,0,0,.12); }
.lang-menu a { display: flex; justify-content: space-between; gap: 12px; padding: 10px 14px; border-radius: 14px; font: 400 16px var(--sans); color: var(--ink); }
.lang-menu a:hover { background: var(--band); }
.lang-menu a[aria-current] { font-weight: 700; }
.lang-menu a span { color: var(--muted); font-size: 13px; font-weight: 700; }
@supports (corner-shape: squircle) { .lang-menu { corner-shape: squircle; border-radius: 38px; } .lang-menu a { corner-shape: squircle; border-radius: 24px; } }
'''

def switcher(page, l):
    items = ''.join(f'<li><a href="{fname(page, x)}" hreflang="{x}" lang="{x}"{" aria-current=\"true\"" if x == l else ""}>{NAMES[x]}<span>{x.upper()}</span></a></li>' for x in LANGS)
    return (f'<details class="lang" translate="no"><summary class="round" aria-label="{SW_LABEL[l]}: {NAMES[l]}">{l.upper()}</summary>'
            f'<ul class="lang-menu">{items}</ul></details>')

def seo_links(page, l):
    path = PAGES[page]
    if not path:
        return ''
    out = ''.join(f'<link rel="alternate" hreflang="{x}" href="{BASE}{path.format(l=x)}">\n' for x in LANGS)
    out += f'<link rel="alternate" hreflang="x-default" href="{BASE}{path.format(l="en")}">\n'
    out += f'<meta property="og:locale" content="{LOCALE[l]}">\n' + ''.join(f'<meta property="og:locale:alternate" content="{LOCALE[x]}">\n' for x in LANGS if x != l)
    return out

def protect(s):
    """Split into (is_code, chunk): style and non-JSON-LD scripts are code and are never translated as text."""
    parts = re.split(r'(<style>.*?</style>|<script(?![^>]*ld\+json)[^>]*>.*?</script>)', s, flags=re.S)
    return [(i % 2 == 1, p) for i, p in enumerate(parts)]

def build(page, l, tr, missing):
    s = open(f'{P}/{page}').read()
    # switcher (same position in every language) and its CSS
    s = re.sub(r'\n\s*<details class="lang".*?</details>', '', s, flags=re.S)
    s = s.replace('<div class="site-tools">', '<div class="site-tools">\n      ' + switcher(page, l), 1)
    if '/* Language switcher */' not in s:
        s = s.replace('</style>', SWITCH_CSS + '</style>', 1)
    # hreflang / locale block, rebuilt each time
    s = re.sub(r'<link rel="alternate" hreflang="[^"]+" href="[^"]+">\n', '', s)
    s = re.sub(r'<meta property="og:locale(?::alternate)?" content="[^"]+">\n', '', s)
    if PAGES[page]:
        s = s.replace('<meta property="og:type"', seo_links(page, l) + '<meta property="og:type"', 1)
        s = s.replace(f'{BASE}{PAGES[page].format(l="en")}"', f'{BASE}{PAGES[page].format(l=l)}"')  # canonical, og:url
    if l == 'en':
        return s

    done_values = set(tr.values())

    def T(text):
        key = html.unescape(text.strip())
        if not key or key.split(':')[0] in SW_LABEL.values():
            return text
        if key in tr:
            lead = text[:len(text) - len(text.lstrip())]; tail = text[len(text.rstrip()):]
            return lead + html.escape(tr[key], quote=False) + tail
        if key in done_values:
            return text
        if re.search(r'[A-Za-z]', key) and key not in NAMES.values() and not re.fullmatch(r'[A-Z]{2}', key):
            missing.add(key)
        return text

    out = []
    for code, chunk in protect(s):
        if code:
            out.append(chunk); continue
        if 'application/ld+json' in chunk:
            def ld(m):
                data = json.loads(m.group(1))
                def walk(o):
                    if isinstance(o, dict):
                        for k, v in list(o.items()):
                            if k in LD_KEYS and isinstance(v, str):
                                if v in tr: o[k] = tr[v]
                                elif re.search(r'[a-z]{3}', v): missing.add(v)
                            elif k == 'inLanguage' and v == 'en': o[k] = l
                            elif isinstance(v, str) and v.startswith(BASE + '/en/'): o[k] = v.replace('/en/', f'/{l}/', 1)
                            else: walk(v)
                    elif isinstance(o, list):
                        for v in o: walk(v)
                walk(data)
                return '<script type="application/ld+json">\n' + json.dumps(data, ensure_ascii=False, indent=1) + '\n</script>'
            chunk = re.sub(r'<script type="application/ld\+json">(.*?)</script>', ld, chunk, flags=re.S)
            # keep the JSON-LD out of the text-node pass
            pieces = re.split(r'(<script type="application/ld\+json">.*?</script>)', chunk, flags=re.S)
        else:
            pieces = [chunk]
        for j, piece in enumerate(pieces):
            if piece.startswith('<script type="application/ld+json">'):
                out.append(piece); continue
            piece = re.sub(r'(<title>)(.*?)(</title>)', lambda m: m.group(1) + T(m.group(2)) + m.group(3), piece)
            piece = re.sub(r'(<(?:meta) (?:name|property)="(?:description|og:title|og:description)" content=")([^"]+)(")',
                           lambda m: m.group(1) + html.escape(html.unescape(T(m.group(2)))) + m.group(3), piece)
            piece = re.sub(r'>([^<>]+)<', lambda m: '>' + T(m.group(1)) + '<', piece)
            for a in ATTRS:
                piece = re.sub(rf'(\s{a}=")([^"]+)(")', lambda m: m.group(1) + html.escape(html.unescape(T(m.group(2)))) + m.group(3), piece)
            out.append(piece)
    s = ''.join(out)
    s = s.replace('<html lang="en">', f'<html lang="{l}">', 1)
    # same-language internal links (not inside the switcher, which already points at the right files)
    def relink(m):
        attr, base, rest = m.group(1), m.group(2), m.group(3)
        return f'{attr}"{base}.{l}.html{rest}"'
    sw = re.search(r'<details class="lang".*?</details>', s, flags=re.S).group(0)
    s = s.replace(sw, '\0SW\0')
    s = re.sub(r'(href=)"(' + '|'.join(LINKED) + r')\.html([^"]*)"', relink, s)
    s = s.replace('\0SW\0', sw)
    if page == 'booking.html':
        js_src = s[s.rindex('<script>'):]
        js_keys = {}
        for m in re.finditer(r"\bt\('((?:[^'\\]|\\.)*)'", js_src):
            k = m.group(1).replace("\\'", "'")
            if k in tr: js_keys[k] = tr[k]
            else: missing.add('[js] ' + k)
        for k in re.findall(r"t\(n \+ ' nights'\)", js_src) and ['4 nights', '7 nights', '14 nights']:
            if k in tr: js_keys[k] = tr[k]
        s = s.replace('<script>\nconst root', '<script>window.RYC_T = ' + json.dumps(js_keys, ensure_ascii=False) + ';</script>\n<script>\nconst root', 1)
    return s

def main():
    report = {}
    for l in LANGS:
        if l != 'en' and not os.path.exists(f'{S}/tr-{l}.json'):
            print('skip', l, '(no translations yet)'); continue
        tr = {}
        if l != 'en':
            for f in (f'tr-{l}.json', f'tr-{l}-booking.json', f'tr-{l}-theory.json'):
                path = f'{S}/{f}'
                if os.path.exists(path): tr.update(json.load(open(path)))
        for page in PAGES:
            if l != 'en' and page == 'booking.html' and not os.path.exists(f'{S}/tr-{l}-booking.json'):
                continue
            if l != 'en' and page.startswith('theory') and not os.path.exists(f'{S}/tr-{l}-theory.json'):
                continue
            missing = set()
            out = build(page, l, tr, missing)
            open(f'{P}/{fname(page, l)}', 'w').write(out)
            if missing: report[f'{fname(page, l)}'] = sorted(missing)
            print(fname(page, l), len(out), 'missing', len(missing))
    json.dump(report, open(f'{S}/i18n_missing.json', 'w'), ensure_ascii=False, indent=1)

if __name__ == '__main__':
    main()
