"""Artikel-Tricks: einfache Regeln für der / die / das.

Jede Regel wird gegen den Wortschatz der App geprüft (wie oft stimmt sie, welche Ausnahmen gibt es),
damit nichts behauptet wird, was nicht stimmt.
"""
import re

TIME_WORDS = {"Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag", "Sonnabend",
              "Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober",
              "November", "Dezember", "Frühling", "Sommer", "Herbst", "Winter", "Morgen", "Vormittag", "Mittag",
              "Nachmittag", "Abend", "Nacht", "Norden", "Süden", "Westen", "Osten", "Frühjahr", "Wochentag",
              "Wochenende", "Feiertag", "Tag", "Monat"}

# Reihenfolge = Vorrang beim Tipp im Artikel-Trainer
RULES = [
    {"id": "ung", "art": "die", "re": r"ung$", "title": "-ung",
     "de": "Wörter mit -ung haben immer „die“.",
     "en": "Words ending in -ung always take “die”.",
     "fa": "کلمه‌هایی که به ‎-ung‎ ختم می‌شوند، همیشه «die» دارند.", "ex": ["die Zeitung", "die Wohnung", "die Rechnung"]},
    {"id": "heit", "art": "die", "re": r"(heit|keit)$", "title": "-heit · -keit",
     "de": "-heit und -keit: immer „die“.", "en": "-heit and -keit: always “die”.",
     "fa": "‎-heit‎ و ‎-keit‎: همیشه «die».", "ex": ["die Gesundheit", "die Möglichkeit"]},
    {"id": "schaft", "art": "die", "re": r"schaft$", "title": "-schaft",
     "de": "-schaft: immer „die“.", "en": "-schaft: always “die”.", "fa": "‎-schaft‎: همیشه «die».",
     "ex": ["die Mannschaft", "die Schwangerschaft"]},
    {"id": "ion", "art": "die", "re": r"ion$", "title": "-ion",
     "de": "-ion (oft -tion): „die“.", "en": "-ion (often -tion): “die”.", "fa": "‎-ion‎ (بیشتر ‎-tion‎): «die».",
     "ex": ["die Information", "die Religion"]},
    {"id": "taet", "art": "die", "re": r"tät$", "title": "-tät",
     "de": "-tät: „die“.", "en": "-tät: “die”.", "fa": "‎-tät‎: «die».", "ex": ["die Universität", "die Qualität"]},
    {"id": "chen", "art": "das", "re": r"(chen|lein)$", "title": "-chen · -lein",
     "de": "-chen und -lein machen etwas klein – und klein ist immer „das“: das Mädchen.",
     "en": "-chen and -lein make things small – and small is always “das”: das Mädchen.",
     "fa": "‎-chen‎ و ‎-lein‎ چیزی را کوچک می‌کنند – و کوچک همیشه «das» است: ‎das Mädchen‎.",
     "ex": ["das Mädchen", "das Brötchen", "das Hähnchen"]},
    {"id": "ment", "art": "das", "re": r"ment$", "title": "-ment",
     "de": "-ment: meistens „das“.", "en": "-ment: usually “das”.", "fa": "‎-ment‎: بیشتر وقت‌ها «das».",
     "ex": ["das Dokument", "das Medikament", "das Instrument"]},
    {"id": "um", "art": "das", "re": r"[^a]um$", "title": "-um",
     "de": "-um (Fremdwörter): „das“. Achtung: der Baum, der Raum (-aum) zählen nicht.",
     "en": "-um (loanwords): “das”. Careful: der Baum, der Raum (-aum) don't count.",
     "fa": "‎-um‎ (کلمه‌های خارجی): «das». دقت: ‎der Baum, der Raum‎ (‎-aum‎) حساب نمی‌شوند.",
     "ex": ["das Museum", "das Zentrum", "das Datum"]},
    {"id": "ling", "art": "der", "re": r"ling$", "title": "-ling",
     "de": "-ling: „der“.", "en": "-ling: “der”.", "fa": "‎-ling‎: «der».", "ex": ["der Frühling", "der Lehrling"]},
    {"id": "ismus", "art": "der", "re": r"ismus$", "title": "-ismus",
     "de": "-ismus: „der“.", "en": "-ismus: “der”.", "fa": "‎-ismus‎: «der».", "ex": ["der Tourismus"]},
    {"id": "ei", "art": "die", "re": r"ei$", "title": "-ei",
     "de": "-ei (Orte, Geschäfte): „die“. Ausnahme: das Ei.", "en": "-ei (places, shops): “die”. Exception: das Ei.",
     "fa": "‎-ei‎ (جاها، دکان‌ها): «die». استثنا: ‎das Ei‎.", "ex": ["die Bäckerei", "die Polizei"]},
    {"id": "ie", "art": "die", "re": r"ie$", "title": "-ie",
     "de": "-ie: „die“. Ausnahme: das Knie.", "en": "-ie: “die”. Exception: das Knie.",
     "fa": "‎-ie‎: «die». استثنا: ‎das Knie‎.", "ex": ["die Familie", "die Linie"]},
    {"id": "time", "art": "der", "words": True, "title": "Tage · Monate · Jahreszeiten",
     "de": "Wochentage, Monate, Jahreszeiten, Tageszeiten und Himmelsrichtungen: „der“. Ausnahmen: die Nacht, das Wochenende, das Frühjahr.",
     "en": "Days, months, seasons, times of day and compass points: “der”. Exceptions: die Nacht, das Wochenende, das Frühjahr.",
     "fa": "روزهای هفته، ماه‌ها، فصل‌ها، وقت‌های روز و جهت‌ها: «der». استثنا: ‎die Nacht, das Wochenende, das Frühjahr‎.",
     "ex": ["der Montag", "der Mai", "der Sommer", "der Abend", "der Norden"]},
    {"id": "verb", "art": "das", "title": "Verb als Nomen",
     "de": "Ein Verb wird zum Nomen (groß geschrieben): „das“. essen → das Essen, leben → das Leben.",
     "en": "A verb used as a noun (capitalised): “das”. essen → das Essen, leben → das Leben.",
     "fa": "وقتی فعل اسم می‌شود (با حرف بزرگ): «das». ‎essen → das Essen, leben → das Leben‎.",
     "ex": ["das Essen", "das Leben", "das Schwimmen"]},
    {"id": "comp", "art": None, "title": "Zusammengesetzte Wörter",
     "de": "Bei langen Wörtern entscheidet immer das letzte Wort: die Tür → die Haustür, der Schrank → der Kühlschrank.",
     "en": "In compound words the last word decides: die Tür → die Haustür, der Schrank → der Kühlschrank.",
     "fa": "در کلمه‌های ترکیبی همیشه کلمهٔ آخر تصمیم می‌گیرد: ‎die Tür → die Haustür, der Schrank → der Kühlschrank‎.",
     "ex": ["die Haustür", "der Kühlschrank", "das Schlafzimmer"]},
    {"id": "e", "art": "die", "re": r"[^e]e$", "title": "-e",
     "de": "Endet das Wort auf -e, ist es meistens „die“. Ausnahmen: männliche Personen und Tiere (der Junge, der Kollege, der Löwe) und einige andere (der Name, das Auge, das Gebäude).",
     "en": "Words ending in -e are mostly “die”. Exceptions: male people and animals (der Junge, der Kollege, der Löwe) and a few others (der Name, das Auge, das Gebäude).",
     "fa": "اگر کلمه به ‎-e‎ ختم شود، بیشتر وقت‌ها «die» است. استثنا: آدم‌ها و حیوان‌های نر (‎der Junge, der Kollege, der Löwe‎) و چند کلمهٔ دیگر (‎der Name, das Auge, das Gebäude‎).",
     "ex": ["die Lampe", "die Straße", "die Tasche"]},
]

GENERAL = [
    {"icon": "🎨", "de": "Lerne jedes Nomen mit Artikel und Farbe: der = blau, die = rot, das = grün. Nie nur „Tisch“, sondern immer „der Tisch“.",
     "en": "Learn every noun with its article and colour: der = blue, die = red, das = green. Never just “Tisch”, always “der Tisch”.",
     "fa": "هر اسم را با حرف تعریف و رنگش یاد بگیر: ‎der‎ = آبی، ‎die‎ = سرخ، ‎das‎ = سبز. هیچ‌وقت فقط ‎„Tisch“‎ نه، همیشه ‎„der Tisch“‎."},
    {"icon": "👥", "de": "Im Plural ist der Artikel immer „die“: der Tisch → die Tische, das Kind → die Kinder.",
     "en": "In the plural the article is always “die”: der Tisch → die Tische, das Kind → die Kinder.",
     "fa": "در جمع، حرف تعریف همیشه «die» است: ‎der Tisch → die Tische, das Kind → die Kinder‎."},
    {"icon": "👨‍👩", "de": "Männer sind „der“, Frauen „die“: der Lehrer – die Lehrerin, der Vater – die Mutter. Frauenberufe enden auf -in.",
     "en": "Men are “der”, women “die”: der Lehrer – die Lehrerin, der Vater – die Mutter. Female job titles end in -in.",
     "fa": "مردها «der» و زن‌ها «die»: ‎der Lehrer – die Lehrerin, der Vater – die Mutter‎. نام شغل زنانه به ‎-in‎ ختم می‌شود."},
    {"icon": "🔊", "de": "Sag die Wörter laut mit Artikel – immer wieder. Das Ohr merkt sich „der Tisch“ wie ein kleines Lied.",
     "en": "Say the words out loud with the article – again and again. Your ear remembers “der Tisch” like a little song.",
     "fa": "کلمه‌ها را با حرف تعریف بلند بگو – بارها و بارها. گوش ‎„der Tisch“‎ را مثل یک آهنگ کوچک به یاد می‌سپارد."},
    {"icon": "🤷", "de": "Keine Regel passt? Dann ist „der“ der beste Tipp – aber schau lieber im Wörterbuch nach.",
     "en": "No rule fits? Then “der” is the best guess – but better check the dictionary.",
     "fa": "هیچ قاعده‌ای نمی‌خورد؟ آن وقت «der» بهترین حدس است – ولی بهتر است در قاموس نگاه کنی."},
]

VIDEOS = [
    {"id": "CblSoXXvBww", "title": "Der, Die, Das – einfach erklärt!", "channel": "EinfachSchule", "lang": "Deutsch", "note": "kurz, ca. 3 Minuten"},
    {"id": "xdWCs1YQXO4", "title": "German articles DER – DIE – DAS: Regeln & Erklärung", "channel": "Sprakuko – Deutsch lernen", "lang": "Deutsch + Englisch", "note": "ca. 13 Minuten, mit Regeln"},
    {"id": "bUXCHCQLEmM", "title": "der die das lernen! Deutsche Artikel leicht gemacht", "channel": "Easy German Grammar Stories", "lang": "Deutsch", "note": "Trick mit Endungen"},
    {"id": "Epi-iVTyWZE", "title": "ARTIKEL lernen – DER, DIE, DAS. Alle Regeln", "channel": "German with Tetiana", "lang": "Deutsch", "note": "ausführlich, eher ab A2"},
]

_RX = {r["id"]: re.compile(r["re"]) for r in RULES if r.get("re")}


def _bare(de):
    head = de.split(" ", 1)
    return head[1] if len(head) == 2 and head[0] in ("der", "die", "das") else de


def _simple(w):
    return bool(w.get("art")) and re.fullmatch(r"(der|die|das) [A-ZÄÖÜ][A-Za-zÄÖÜäöüß]+", w["de"] or "") is not None


class Checker:
    """Findet zu einem Nomen die passende Regel (mit dem Wortschatz der App für Verben und Teilwörter)."""

    def __init__(self, words):
        self.nouns = {}
        self.verbs = set()
        self.adjs = set()
        for w in words:
            if _simple(w):
                self.nouns.setdefault(_bare(w["de"]), w["art"])
            elif re.fullmatch(r"[a-zäöüß]+en", w["de"] or ""):
                self.verbs.add(w["de"])
            elif re.fullmatch(r"[a-zäöüß]{3,}", w["de"] or ""):
                self.adjs.add(w["de"])

    PREFIX = {"haupt", "vor", "nach", "neben", "ober", "unter", "über", "mittel", "klein", "groß", "alt", "neu", "hoch", "früh", "spät",
              "voll", "teil", "kalt", "warm", "fern", "nah", "doppel", "einzel", "halb", "kurz", "lang", "schnell", "weiter", "fort", "rück",
              "zu", "ab", "an", "auf", "aus", "ein", "mit", "um", "durch", "gegen", "frei", "selbst", "sonder", "zwischen", "erst", "fein"}

    def _is_stem(self, pre):
        """Ist der Anfang ein echtes Wort (Nomen, Verbstamm, Vorsilbe)? Fugen-s/-n/-en/-e/-er werden abgezogen."""
        low = pre.lower()
        cands = {low}
        for f in ("s", "es", "n", "en", "e", "er"):
            if low.endswith(f) and len(low) - len(f) >= 2:
                cands.add(low[: -len(f)])
        nouns = {n.lower() for n in self.nouns}
        stems = {v[:-2] for v in self.verbs} | {v[:-1] for v in self.verbs if v.endswith("ln") or v.endswith("rn")}
        return any(c in nouns or c in stems or c in self.adjs or c in self.PREFIX for c in cands)

    def rule(self, noun):
        """(regel_id, erwarteter_artikel) oder (None, None)."""
        for r in RULES:
            rid = r["id"]
            if rid in _RX and rid != "e" and _RX[rid].search(noun):
                return rid, r["art"]
            if rid == "time" and noun in TIME_WORDS:
                return rid, "der"
            if rid == "verb" and noun.lower() in self.verbs and noun.endswith("en"):
                return rid, "das"
            if rid == "comp":
                for k in range(3, len(noun) - 2):
                    tail = noun[k:].capitalize()
                    if tail in self.nouns and len(tail) >= 3 and self._is_stem(noun[:k]):
                        return rid, self.nouns[tail] + " " + tail
            if rid == "e" and _RX[rid].search(noun):
                return rid, r["art"]
        return None, None


def expected_art(exp):
    return exp.split(" ", 1)[0] if exp else None


def annotate(words):
    """Hängt an jedes einfache Nomen 'ar' (Regel-ID) und 'ax' (erwarteter Artikel bzw. 'die Tür' bei Teilwörtern)."""
    ck = Checker(words)
    for w in words:
        if _simple(w):
            rid, exp = ck.rule(_bare(w["de"]))
            if rid:
                w["ar"], w["ax"] = rid, exp
    return words


def stats(words):
    """Pro Regel: wie viele Nomen im Wortschatz passen, wie viele davon stimmen, Ausnahmen."""
    ck = Checker(words)
    out = {r["id"]: {"n": 0, "ok": 0, "exc": [], "ex": []} for r in RULES}
    seen = set()
    for w in words:
        if not _simple(w) or w["de"] in seen:
            continue
        seen.add(w["de"])
        rid, exp = ck.rule(_bare(w["de"]))
        if not rid:
            continue
        s = out[rid]
        s["n"] += 1
        if expected_art(exp) == w["art"]:
            s["ok"] += 1
            if len(s["ex"]) < 6:
                s["ex"].append(w["de"] + (" ← " + exp if rid == "comp" else ""))
        else:
            s["exc"].append(w["de"])
    return out
