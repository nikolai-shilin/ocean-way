"""Turn the generated prototype pages (prototypes/*.html, four languages) into content for the Next.js app:
  content/pages/<page>.<lang>.json  title, description, image, robots, JSON-LD, header, main, footer, sprite, scripts
  src/styles/<group>.css            the page's stylesheet (shared by its languages)
  content/i18n/<lang>.json          English → language dictionary, for strings the app renders from live data
Links between prototype files become app routes (/ru/courses/bareboat-skipper …). Run from web/: python3 scripts/extract_content.py"""
import json, os, re, glob
WEB = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROTO = os.path.join(os.path.dirname(WEB), 'prototypes')
BUILD = os.path.join(PROTO, '_build')
LANGS = ['en', 'ru', 'de', 'es']
OLD_SITE = 'https://www.rycrentals.com'

SLUGS = sorted(os.path.basename(f)[len('theory-'):-5] for f in glob.glob(f'{PROTO}/theory-*.html') if re.fullmatch(r'theory-[a-z-]+\.html', os.path.basename(f)))
PAGES = {'home': 'home', 'course-bareboat-skipper': 'bareboat-skipper-course', 'booking': 'booking', 'theory': 'theory'}
PAGES.update({f'theory-{s}': f'theory-{s}' for s in SLUGS})
STYLE_GROUP = {'home': 'home', 'course-bareboat-skipper': 'course', 'booking': 'booking'}

def route(base, lang, rest=''):
    if base == 'home': p = f'/{lang}'
    elif base == 'bareboat-skipper-course': p = f'/{lang}/courses/bareboat-skipper'
    elif base == 'booking': p = f'/{lang}/booking'
    elif base == 'theory': p = f'/{lang}/theory'
    elif base.startswith('theory-'): p = f'/{lang}/theory/{base[7:]}'
    else: return None
    return p + rest

LINK = re.compile(r'href="((?:home|bareboat-skipper-course|booking|theory(?:-[a-z-]+)?))(?:\.(ru|de|es))?\.html([^"]*)"')

def relink(s):
    s = re.sub(r'<a href="user-flows(?:\.\w\w)?\.html">[^<]*</a>', '', s)
    return LINK.sub(lambda m: f'href="{route(m.group(1), m.group(2) or "en", m.group(3).replace("&amp;", "&"))}"', s)

def between(s, a, b):
    i = s.index(a); j = s.index(b, i)
    return s[i:j + len(b)] if b.startswith('</') else s[i:j]

def meta(s, key):
    m = re.search(rf'(?:name|property)="{re.escape(key)}" content="([^"]*)"', s)
    return m.group(1) if m else None

def extract(page, base, lang):
    f = f'{PROTO}/{base}.html' if lang == 'en' else f'{PROTO}/{base}.{lang}.html'
    s = open(f).read()
    body = s[s.index('<body>') + 6:]
    out = {
        'page': page, 'lang': lang,
        'title': re.search(r'<title>(.*?)</title>', s, re.S).group(1),
        'description': meta(s, 'description'),
        'image': meta(s, 'og:image'),
        'robots': meta(s, 'robots'),
        'jsonld': [m.replace(OLD_SITE, '{{SITE}}') for m in re.findall(r'<script type="application/ld\+json">\s*(.*?)\s*</script>', s, re.S)],
        'sprite': body[:body.index('<div class="wrap">')],
        'header': relink(between(body, '<header class="site-head">', '</header>')),
        'main': relink(between(body, '<main>', '</main>')[len('<main>'):-len('</main>')]),
        'footer': relink(between(body, '<footer class="site-foot">', '</footer>')),
        'scripts': [x for x in re.findall(r'<script(?![^>]*ld\+json)[^>]*>(.*?)</script>', body, re.S)],
        'tail': relink(re.split(r'<script', body[body.index('</footer>') + len('</footer>'):], 1)[0].replace('</div>', '', 1).strip()),
    }
    style = s[s.index('<style>') + 7: s.index('</style>')]
    return out, style

def main():
    os.makedirs(f'{WEB}/content/pages', exist_ok=True); os.makedirs(f'{WEB}/content/i18n', exist_ok=True); os.makedirs(f'{WEB}/src/styles', exist_ok=True)
    styles = {}
    for page, base in PAGES.items():
        for lang in LANGS:
            data, style = extract(page, base, lang)
            group = STYLE_GROUP.get(page, 'theory')
            if lang == 'en': styles[group] = style
            data['styles'] = group
            json.dump(data, open(f'{WEB}/content/pages/{page}.{lang}.json', 'w'), ensure_ascii=False)
    for g, css in styles.items():
        open(f'{WEB}/src/styles/{g}.css', 'w').write(css)
    for lang in LANGS[1:]:
        d = {}
        for f in sorted(glob.glob(f'{BUILD}/tr-{lang}*.json')):
            if re.search(r'-theory-[abc]\.json$', f): continue
            d.update(json.load(open(f)))
        json.dump(d, open(f'{WEB}/content/i18n/{lang}.json', 'w'), ensure_ascii=False)
    json.dump({'slugs': SLUGS, 'pages': list(PAGES)}, open(f'{WEB}/content/index.json', 'w'))
    print('pages', len(PAGES), 'x', len(LANGS), '| styles', list(styles), '| slugs', SLUGS)

if __name__ == '__main__':
    main()
