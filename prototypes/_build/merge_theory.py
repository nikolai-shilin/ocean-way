"""Merge tr-<lang>-theory-a/b/c/d.json (+ small fixes) into tr-<lang>-theory.json, which i18n_build.py loads."""
import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
FIX = {
    'ru': {'A transit': 'Створ', 'Technique': 'Способ'},
    'de': {'A transit': 'Eine Deckpeilung', 'Technique': 'Methode'},
    'es': {'A transit': 'Una enfilación', 'Technique': 'Método'},
}
for l in ['ru', 'de', 'es']:
    out = {}
    for part in ('a', 'b', 'c', 'd', 'e'):
        p = f'{HERE}/tr-{l}-theory-{part}.json'
        if os.path.exists(p):
            out.update(json.load(open(p)))
        else:
            print('missing', p)
    out.update(FIX[l])
    json.dump(out, open(f'{HERE}/tr-{l}-theory.json', 'w'), ensure_ascii=False, indent=1)
    print(l, len(out))
