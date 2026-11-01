# Translation guide (Ocean Way prototype)

Brand: **Ocean Way** (never translate, never transliterate). Sailing school (IYT courses), live-aboard training passages
along the Turkish coast, own fleet of yachts for charter. Tone: plain, warm, concise, no hype, no exclamation marks.
Keep roughly the English length; buttons, labels, table headers and card titles short.

Input files are JSON `{"part-…": [strings]}` in document order (header, page sections, footer, then alt/aria-label texts,
meta description, structured-data texts). Some strings are fragments of one sentence split around bold text or links:
translate them so the sequence reads naturally. Output: ONE flat JSON object mapping every input string (byte-exact key,
including non-breaking spaces, curly quotes, `&nbsp;` written as the character) to its translation; `ensure_ascii=False`.
Verify with python that keys == input list and no value is empty. **Consistency:** reuse the terms already chosen in
`tr-<lang>.json` and `tr-<lang>-booking.json` in this folder (place names, course names, "Book", nav labels, etc.) —
look them up before translating.

Keep untranslated: Ocean Way, IYT, RYA, ICC, VHF, SRC, DSC, MMSI, NAVTEX, GPS, COLREG/COLREGs (ES may use «RIPA»),
official course names (VHF Radio Operator, Introduction to Yachting, International Flotilla Skipper, International
Bareboat Skipper, Bareboat Skipper, Yachtmaster Coastal/Offshore/Ocean, Day Skipper, Coastal Skipper, Competent Crew),
boat models (Bavaria C42, Dufour 430, Jeanneau Sun Odyssey 440, Beneteau Oceanis 46.1, Hanse 418), Telegram, YouTube,
Instagram, Threads, PDF. Radio procedure words that are spoken in English on the radio worldwide stay in English inside
examples (MAYDAY, PAN-PAN, SÉCURITÉ, OVER, OUT, SAY AGAIN, RECEIVED, SEELONCE…) — explain them in the reader's language
around the example. The phonetic alphabet words (Alfa, Bravo…) stay as they are.

Units: nautical miles → RU «миль» / DE „sm" / ES «mn»; metres → «м» / „m" / «m»; knots → «узлов»/„kn"/«nudos»
(table headers may use «уз», „kn", «nudos»). Beaufort "Force 5" → «5 баллов» / „Windstärke 5" (short „Bft 5") / «fuerza 5».
Keep prices in the source format ("€2 400"). "5 min read" → «5 минут чтения» / „5 Min. Lesezeit" / «5 min de lectura».

## Russian
«вы» lowercase. Natural yachting vocabulary (шкипер, яхта, курс бейдевинд, галфвинд, бакштаг, фордевинд, левый/правый
галс, поворот оверштаг / фордевинд, швартовка кормой, муринг, якорная стоянка, вытравить цепь, вахта, лоция, счисление).
«ёлочки» for quotes. Sentence case headings. Map/diagram labels in the same case as English.

## German
"du" consistently. Natural sailing German (am Wind, Halbwind, raumer Wind, vor dem Wind, Backbord-/Steuerbordbug, Wende,
Halse, römisch-katholisch anlegen, Mooringleine, Ankerkette stecken, Wache, Koppelnavigation, Kreuzpeilung).
German quotes „…". Keep labels short.

## Spanish (Spain)
«tú» consistently. Natural nautical Spanish (ceñida, descuartelar, través, largo, popa, amura de babor/estribor, virada,
trasluchada, amarre de popa / a la mediterránea, muerto, fondear, filar cadena, guardia, estima, demora).
«comillas latinas». Sentence case headings.
