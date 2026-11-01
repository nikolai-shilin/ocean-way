"""Collect every human-visible string (text nodes, alt/aria-label/placeholder/title, meta descriptions, JSON-LD text) from the
prototype pages, so they can be translated once and applied to each language file."""
import re, json, html
P = '/Users/shilin/Developer/ocean-way/prototypes'
ATTRS = ('alt', 'aria-label', 'placeholder', 'title')
META = ('description', 'og:title', 'og:description')
LD_KEYS = ('name', 'description', 'text', 'educationalCredentialAwarded')

def strip_blocks(s):
    # drop style, scripts (handled separately) and svg geometry, keep svg <text>
    s = re.sub(r'<style>.*?</style>', '', s, flags=re.S)
    s = re.sub(r'<script(?![^>]*ld\+json).*?</script>', '', s, flags=re.S)
    s = re.sub(r'<script type="application/ld\+json">.*?</script>', '', s, flags=re.S)
    return s

def is_text(t):
    t = t.strip()
    if not t or re.fullmatch(r'[\s\d€.,:;/()\-–—+×·%&nbsp;#→|]+', html.unescape(t).replace('\xa0', ' ')):
        return False
    return bool(re.search(r'[A-Za-zÀ-ž]', html.unescape(t)))

def collect(path):
    raw = open(path).read()
    s = strip_blocks(raw)
    out = []
    for m in re.finditer(r'>([^<>]+)<', s):
        t = m.group(1)
        if is_text(t): out.append(html.unescape(t.strip()))
    for a in ATTRS:
        for m in re.finditer(rf'\s{a}="([^"]+)"', s):
            if is_text(m.group(1)): out.append(html.unescape(m.group(1)))
    for k in META:
        for m in re.finditer(rf'(?:name|property)="{re.escape(k)}" content="([^"]+)"', raw):
            out.append(html.unescape(m.group(1)))
    for m in re.finditer(r'<script type="application/ld\+json">(.*?)</script>', raw, re.S):
        def walk(o):
            if isinstance(o, dict):
                for k, v in o.items():
                    if k in LD_KEYS and isinstance(v, str) and is_text(v): out.append(v)
                    else: walk(v)
            elif isinstance(o, list):
                for v in o: walk(v)
        walk(json.loads(m.group(1)))
    seen = []; [seen.append(x) for x in out if x not in seen]
    return seen

res = {}
for name in ['home.html', 'bareboat-skipper-course.html']:
    res[name] = collect(f'{P}/{name}')
    print(name, len(res[name]), 'strings', sum(len(x.split()) for x in res[name]), 'words')
json.dump(res, open(__file__.rsplit('/', 1)[0] + '/i18n_strings.json', 'w'), ensure_ascii=False, indent=1)
