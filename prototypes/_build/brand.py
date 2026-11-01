"""Brand rename RYC → Ocean Way, applied to English sources, build scripts and translation files alike, so translation
keys keep matching the English text. CSS comments and the rycrentals.com domain are left alone."""
import re, json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
P = os.path.dirname(HERE)

RULES = [
    ('RYC · Russian Yacht Centre', 'Ocean Way'),
    ('Russian Yacht Centre', 'Ocean Way'),
    ('Русский яхтенный центр', 'Ocean Way'),
    ("'RYC-' + c.id", "'OW-' + c.id"),
    ('PRODID:-//RYC//Booking//EN', 'PRODID:-//Ocean Way//Booking//EN'),
    ('@ryc\\n', '@oceanway\\n'),
    ('download="ryc-booking.ics"', 'download="ocean-way-booking.ics"'),
]
WORD = re.compile(r'\bRYC\b(?!_T)')

def brand(s):
    for a, b in RULES:
        s = s.replace(a, b)
    return WORD.sub('Ocean Way', s)

def brand_html(s):
    """Leave <style> blocks (comments cite ryc-rentals sources) untouched."""
    parts = re.split(r'(<style>.*?</style>)', s, flags=re.S)
    return ''.join(p if p.startswith('<style>') else brand(p) for p in parts)

def brand_py(s):
    """Build scripts: rename in string content but keep CSS blocks (css = r'''…''') as they are."""
    parts = re.split(r"((?:CSS|css|SWITCH_CSS) = r?'''.*?''')", s, flags=re.S)
    return ''.join(p if re.match(r"(?:CSS|css|SWITCH_CSS) = ", p) else brand(p) for p in parts)

def brand_json(path):
    d = json.load(open(path))
    if isinstance(d, dict) and all(isinstance(v, str) for v in d.values()):
        d = {brand(k): brand(v) for k, v in d.items()}
    else:
        d = {k: [brand(x) for x in v] for k, v in d.items()}
    json.dump(d, open(path, 'w'), ensure_ascii=False, indent=1)

if __name__ == '__main__':
    for f in ['home.html', 'bareboat-skipper-course.html']:
        p = f'{P}/{f}'; txt = open(p).read(); assert txt, p; open(p, 'w').write(brand_html(txt))
    for f in ['build_booking.py', 'build_flows.py']:
        p = f'{HERE}/{f}'; txt = open(p).read(); assert txt, p; open(p, 'w').write(brand_py(txt))
    for f in os.listdir(HERE):
        if f.startswith(('tr-', 'i18n_')) and f.endswith('.json') and f != 'i18n_missing.json':
            brand_json(f'{HERE}/{f}')
    th = f'{HERE}/theory'
    if os.path.isdir(th):
        for f in os.listdir(th):
            if f.endswith(('.html', '.json')):
                p = f'{th}/{f}'; txt = open(p).read(); assert txt, p; open(p, 'w').write(brand(txt))
    print('renamed')
