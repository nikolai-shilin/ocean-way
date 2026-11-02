"""Theory articles → the database (theory_topics, articles, article_translations).

Articles are still written in prototypes/_build/theory and built into pages (build_theory.py, then i18n_build.py for
ru/de/es). This script reads those built pages (prototypes/theory*.html, the reading order from the theory row of
prototypes/home.html), turns their links into site addresses and upserts every topic, article and translation, so
the site (which reads only the database) shows them.

Needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in web/.env.local. Usage: python3 scripts/import_theory.py [--dry-run]
"""
import glob, hashlib, html, json, os, re, subprocess, sys, tempfile

WEB = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROTO = os.path.join(os.path.dirname(WEB), 'prototypes')
LANGS = ('en', 'ru', 'de', 'es')
un = html.unescape

# Links between prototype files → site addresses (theory-knots.ru.html → /ru/theory/knots).
LINK = re.compile(r'href="((?:home|bareboat-skipper-course|booking|theory(?:-[a-z-]+)?))(?:\.(ru|de|es))?\.html([^"]*)"')
def route(base, lang, rest):
    p = {'home': f'/{lang}', 'bareboat-skipper-course': f'/{lang}/courses/bareboat-skipper', 'booking': f'/{lang}/booking',
         'theory': f'/{lang}/theory'}.get(base) or f'/{lang}/theory/{base[7:]}'
    return p + rest.replace('&amp;', '&')
def relink(s, lang):
    s = re.sub(r'<a href="user-flows(?:\.\w\w)?\.html">[^<]*</a>', '', s)
    s = s.replace('href="instructors.html', f'href="/{lang}/instructors')
    return LINK.sub(lambda m: f'href="{route(m.group(1), m.group(2) or "en", m.group(3))}"', s)


def page(name, lang):
    """One built prototype page: main (with site links), title, description, image, JSON-LD."""
    s = open(f'{PROTO}/{name}.html' if lang == 'en' else f'{PROTO}/{name}.{lang}.html').read()
    meta = lambda k: (re.search(rf'(?:name|property)="{re.escape(k)}" content="([^"]*)"', s) or [None, None])[1]
    main = s[s.index('<main>') + len('<main>'):s.index('</main>')]
    return {'main': relink(main, lang), 'title': re.search(r'<title>(.*?)</title>', s, re.S).group(1),
            'description': meta('description'), 'image': meta('og:image'),
            'jsonld': re.findall(r'<script type="application/ld\+json">\s*(.*?)\s*</script>', s, re.S)}


def one(pattern, s, what):
    m = re.search(pattern, s, re.S)
    if not m:
        sys.exit(f'not found: {what}')
    return m.group(1)


# Topics, and which article is in which topic, from the hub page.
topics, topic_of, cards = [], {}, {l: {} for l in LANGS}
for lang in LANGS:
    main = page('theory', lang)['main']
    for i, part in enumerate(main.split('<section class="sec th-topic"')[1:]):
        key = one(r'^\s*id="([\w-]+)"', part, 'topic id')
        name = un(one(r'<h2 class="h2">(.*?)</h2>', part, 'topic name'))
        lead = un(one(r'<p class="sec-lead">(.*?)</p>', part, 'topic lead'))
        if lang == 'en':
            topics.append({'key': key, 'sort': i + 1, 'name': name, 'lead': lead, 'translations': {}})
        else:
            next(t for t in topics if t['key'] == key)['translations'][lang] = {'name': name, 'lead': lead}
        for card in part.split('<a class="card th-card"')[1:]:
            slug = one(r'href="/\w\w/theory/([\w-]+)"', card, 'card slug')
            topic_of[slug] = key
            cards[lang][slug] = {'alt': un(one(r'<img [^>]*alt="([^"]*)"', card, 'card alt'))}

# Reading order: the home page's theory row lists every article in it.
home = page('home', 'en')['main']
row = one(r'<section class="sec" id="theory".*?<div class="hscroll"[^>]*>(.*?)</section>', home, 'home theory row')
order = re.findall(r'href="/en/theory/([\w-]+)"', row)
built = sorted(os.path.basename(f)[7:-5] for f in glob.glob(f'{PROTO}/theory-*.html') if re.fullmatch(r'theory-[a-z-]+\.html', os.path.basename(f)))
assert sorted(order) == built, ('home row and built articles differ', set(order) ^ set(built))

articles, translations = [], []
for sort, slug in enumerate(order, 1):
    en_body = None
    for lang in LANGS:
        p = page(f'theory-{slug}', lang)
        m = p['main']
        head = m[:m.index('<div class="art-grid">')]
        side = one(r'<aside class="art-side"[^>]*>(.*?)</aside>', m, 'side')
        start = m.index('</div>', m.index('<div class="band summary">')) + len('</div>')
        body = m[start:m.index('<div class="art-mobile-course">')].strip()
        if lang == 'en':
            en_body = body
            ld = json.loads(p['jsonld'][0])['@graph'][2]
            course_box = side[side.index('<div class="band art-course">'):] if 'art-course' in side else ''
            course_slug = re.search(r'href="/en/courses/([\w-]+)"', course_box)
            articles.append({
                'slug': slug, 'topic': topic_of[slug], 'sort': sort,
                'read_minutes': int(one(r'<span class="meta">(\d+) min read</span>', head, 'read minutes')),
                'photo_id': one(r'photo-([\w-]+)\?', p['image'], 'photo id'),
                'course': un(one(r'<div class="card-title">(.*?)</div>', course_box, 'course name')) if course_box else None,
                'course_slug': course_slug.group(1) if course_slug else None,
                'author': one(r'href="/en/instructors#([\w-]+)"', head, 'author'),
                'published_on': ld['datePublished'], 'updated_on': ld['dateModified'], 'published': True,
            })
        translations.append({
            'slug': slug, 'lang': lang,
            'title': un(re.sub(r' · Ocean Way$', '', p['title'])),
            'h1': un(one(r'<h1 class="display">(.*?)</h1>', head, 'h1')),
            'lead': un(one(r'<p class="lead">(.*?)</p>', head, 'lead')),
            'description': un(p['description']),
            'level': un(one(r'<span class="lvl">(.*?)</span>', head, 'level')),
            'photo_alt': cards[lang][slug]['alt'],
            'summary': [un(x) for x in re.findall(r'<li>(.*?)</li>', one(r'<div class="band summary">.*?<ul>(.*?)</ul>', m, 'summary'))],
            'toc': [[i, un(t)] for i, t in re.findall(r'<li><a href="#([\w-]+)">(.*?)</a></li>', side)],
            'body_html': body,
            'source_hash': hashlib.md5(en_body.encode()).hexdigest(),
        })

print(len(topics), 'topics,', len(articles), 'articles,', len(translations), 'translations')
if '--dry-run' in sys.argv:
    json.dump({'topics': topics, 'articles': articles, 'translations': translations}, sys.stdout, ensure_ascii=False, indent=1)
    sys.exit()

env = dict(l.strip().split('=', 1) for l in open(f'{WEB}/.env.local') if '=' in l and not l.startswith('#'))
url, key = env['SUPABASE_URL'].strip('"'), env.get('SUPABASE_SERVICE_ROLE_KEY', '').strip('"')
if not key:
    sys.exit('SUPABASE_SERVICE_ROLE_KEY is empty in web/.env.local')


def upsert(table, rows):
    # The key goes in a curl config on stdin, so it never shows in the process list; the rows go on stdin too.
    cfg = (f'header = "apikey: {key}"\nheader = "Authorization: Bearer {key}"\n'
           'header = "Content-Type: application/json"\nheader = "Prefer: resolution=merge-duplicates,return=minimal"\n')
    with tempfile.NamedTemporaryFile('w', suffix='.json', delete=False) as f:
        json.dump(rows, f, ensure_ascii=False)
    try:
        out = subprocess.run(['curl', '-s', '-K', '-', '-X', 'POST', '-w', '%{http_code}', '--data-binary', f'@{f.name}',
                              f'{url}/rest/v1/{table}'], input=cfg, capture_output=True, text=True)
    finally:
        os.remove(f.name)
    if not out.stdout.endswith(('200', '201', '204')):
        sys.exit(f'{table}: {out.stdout[:300]}')
    print(table, len(rows))


upsert('theory_topics', topics)
upsert('articles', articles)
for i in range(0, len(translations), 20):
    upsert('article_translations', translations[i:i + 20])
