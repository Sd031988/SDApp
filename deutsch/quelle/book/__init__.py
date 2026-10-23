"""Kursbuch: feste, eigene Lehrbuch-Inhalte pro Einheit (keine Kopien aus Verlagsbuechern).

Format pro Einheit:
  w: Wortschatz  "Wort|Plural|Englisch|Dari"   (Plural leer, wenn es keinen gibt)
  p: Redemittel  ["Satz", ...]
  g: Grammatik   {title, head, rows, de, en, fa}
  r: Lesetext    {title, text, q: [[Frage, [richtig, falsch, falsch], 0], ...]}
  d: Hoertext    {title, lines: [[Sprecher, Satz], ...], q: [...]}
  s: Schreiben   {task, model}
Bei den Fragen steht die richtige Antwort immer an Index 0 (die Oberflaeche mischt).
"""
import importlib

from .alpha import UNITS as _ALPHA
from .a1 import UNITS as _A1
from .a2 import UNITS as _A2
from .b1 import UNITS as _B1

BOOK = {"alpha": _ALPHA, "A1": _A1, "A2": _A2, "B1": _B1}

# Erweiterungen (mehr Wortschatz, Grammatik, Texte): book/x_<niveau>.py mit EXTRA = {einheit: {...}}
#   words: mehrzeiliger Text, "# Thema" als Ueberschrift, sonst "Wort|Plural|Englisch|Dari"
#   g / r / d / s: Listen weiterer Grammatik-Kaesten, Lesetexte, Hoertexte, Schreibaufgaben
EXTRA = {}
for _lv, _mod in (("alpha", "x_alpha"), ("A1", "x_a1"), ("A2", "x_a2"), ("B1", "x_b1")):
    try:
        EXTRA[_lv] = importlib.import_module("." + _mod, __name__).EXTRA
    except ModuleNotFoundError:
        EXTRA[_lv] = {}


# Neue Einheiten (Themen wie in A1–B1-Integrationskursbüchern): HINTEN anhängen, damit der gespeicherte Lernstand gültig bleibt
from .neu_a1 import UNITS as _NEU_A1  # noqa: E402
from .neu_a2 import UNITS as _NEU_A2  # noqa: E402
from .neu_b1 import UNITS as _NEU_B1  # noqa: E402
NEU = {"A1": _NEU_A1, "A2": _NEU_A2, "B1": _NEU_B1}
for _lv, _neu in NEU.items():
    BOOK[_lv] = list(BOOK[_lv])
    EXTRA[_lv] = dict(EXTRA.get(_lv) or {})
    for _u in _neu:
        _i = len(BOOK[_lv])
        BOOK[_lv].append({k: v for k, v in _u.items() if k not in ("words", "goals")})
        if _u.get("words"):
            EXTRA[_lv][_i] = {"words": _u["words"]}


def _extra(level, idx):
    return (EXTRA.get(level) or {}).get(idx) or {}


def word_groups(level: str, idx: int) -> list:
    """[(Gruppenname, [Wortzeilen])] – zuerst der Grundwortschatz der Einheit, dann die Themen-Gruppen."""
    u = BOOK[level][idx]
    groups = [("Grundwortschatz", list(u["w"]))]
    cur = None
    for line in (_extra(level, idx).get("words") or "").splitlines():
        line = line.strip()
        if not line:
            continue
        if line.startswith("#"):
            cur = (line.lstrip("# ").strip(), [])
            groups.append(cur)
        else:
            if cur is None:
                cur = ("Mehr Wörter", [])
                groups.append(cur)
            cur[1].append(line)
    return [g for g in groups if g[1]]


def _all(level, idx, key):
    u = BOOK[level][idx]
    return [u[key]] + list(_extra(level, idx).get(key) or [])


from .pics import pic_for  # noqa: E402
from .urdu import UR_WORT, ur_text  # noqa: E402


def l1_wort(pw, lang):
    """Bedeutung eines Wortes in der Erklärsprache (fa, en, ur). Fehlt Urdu, steht Englisch da."""
    if lang == "fa":
        return pw["fa"]
    if lang == "ur":
        return UR_WORT.get(pw["de"]) or pw["en"]
    return pw["en"]


def l1_text(en, fa, lang):
    if lang == "fa":
        return fa
    if lang == "ur":
        return ur_text(en)
    return en
from .articles import annotate  # noqa: E402
from .grammar_tips import tip_for, CHANNELS  # noqa: E402,F401


def parse_word(s: str) -> dict:
    parts = (s.split("|") + ["", "", "", ""])[:4]
    de, pl, en, fa = (x.strip() for x in parts)
    art = de.split(" ", 1)[0] if de.split(" ", 1)[0] in ("der", "die", "das") and " " in de else ""
    emo, photo = pic_for(de)
    return {"de": de, "pl": pl, "en": en, "fa": fa, "art": art, "pic": emo, "ph": photo}


def _gram(g, lang):
    return {"title": g["title"], "head": g["head"], "rows": g["rows"], "de": g["de"], "l1": l1_text(g["en"], g["fa"], lang),
            "tip": tip_for(g["title"], lang)}


def unit(level: str, idx: int, lang: str = "en"):
    units = BOOK.get(level) or []
    if not 0 <= idx < len(units):
        return None
    u = units[idx]
    words, seen = [], set()
    for grp, lines in word_groups(level, idx):
        for w in lines:
            pw = parse_word(w)
            if pw["de"].lower() in seen:
                continue
            seen.add(pw["de"].lower())
            words.append({"de": pw["de"], "pl": pw["pl"], "art": pw["art"], "pic": pw["pic"], "ph": pw["ph"], "l1": l1_wort(pw, lang),
                          "en": pw["en"], "grp": grp})
    grams = [_gram(g, lang) for g in _all(level, idx, "g")]
    reads, dialogs, writes = _all(level, idx, "r"), _all(level, idx, "d"), _all(level, idx, "s")
    return {
        "title": u["t"], "words": words, "phrases": list(u["p"]) + list(_extra(level, idx).get("p") or []),
        "grammar": grams[0], "grammars": grams, "read": reads[0], "reads": reads, "dialog": dialogs[0], "dialogs": dialogs,
        "write": writes[0], "writes": writes,
    }


def core_words(level: str, idx: int) -> list:
    units = BOOK.get(level) or []
    if not 0 <= idx < len(units):
        return []
    return [parse_word(w)["de"] for w in units[idx]["w"]] + \
        [parse_word(w)["de"] for _, ls in word_groups(level, idx)[1:] for w in ls][:40]


def dictionary(lang: str = "en") -> list:
    seen, out = set(), []
    for lv, units in BOOK.items():
        for i, u in enumerate(units):
            for w in [x for _, ls in word_groups(lv, i) for x in ls]:
                pw = parse_word(w)
                if pw["de"].lower() in seen:
                    continue
                seen.add(pw["de"].lower())
                out.append({"de": pw["de"], "pl": pw["pl"], "art": pw["art"], "pic": pw["pic"], "ph": pw["ph"], "l1": l1_wort(pw, lang),
                            "level": lv, "unit": i})
    return out


def grammar_all(lang: str = "en") -> list:
    out = []
    for lv, units in BOOK.items():
        for i, u in enumerate(units):
            for g in _all(lv, i, "g"):
                out.append(dict(_gram(g, lang), level=lv, unit=i, unit_title=u["t"]))
    return out


def stats() -> dict:
    """Zaehlt pro Niveau: neue Woerter (ohne Doppelte), Grammatik-Themen, Texte, Schreibaufgaben."""
    seen, out = set(), {}
    for lv, units in BOOK.items():
        new = set()
        for i in range(len(units)):
            for _, ls in word_groups(lv, i):
                for w in ls:
                    k = parse_word(w)["de"].lower()
                    if k not in seen:
                        new.add(k)
        seen |= new
        out[lv] = {"words_new": len(new), "words_total": len(seen),
                   "grammar": sum(len(_all(lv, i, "g")) for i in range(len(units))),
                   "read": sum(len(_all(lv, i, "r")) for i in range(len(units))),
                   "listen": sum(len(_all(lv, i, "d")) for i in range(len(units))),
                   "write": sum(len(_all(lv, i, "s")) for i in range(len(units)))}
    return out


def validate() -> list:
    """Liefert eine Liste von Problemen (leer = alles ok)."""
    errs = []
    for lv, units in BOOK.items():
        for i in (EXTRA.get(lv) or {}):
            if not 0 <= i < len(units):
                errs.append(f"{lv}: EXTRA fuer unbekannte Einheit {i}")
        for i, u in enumerate(units):
            tag = f"{lv}:{i}"
            for k in ("t", "w", "p", "g", "r", "d", "s"):
                if k not in u:
                    errs.append(f"{tag}: Feld {k} fehlt")
            for _, ls in word_groups(lv, i):
                for w in ls:
                    if w.count("|") != 3:
                        errs.append(f"{tag}: Wortformat {w!r}")
                    pw = parse_word(w)
                    if not (pw["de"] and pw["en"] and pw["fa"]):
                        errs.append(f"{tag}: Wort unvollstaendig {w!r}")
            for g in _all(lv, i, "g"):
                for k in ("title", "head", "rows", "de", "en", "fa"):
                    if not g.get(k):
                        errs.append(f"{tag}: Grammatik {k} fehlt ({g.get('title')})")
                for row in g.get("rows", []):
                    if len(row) != len(g.get("head", [])):
                        errs.append(f"{tag}: Tabellenzeile passt nicht zum Kopf: {row}")
            for part in ("r", "d"):
                for t in _all(lv, i, part):
                    if not t.get("title"):
                        errs.append(f"{tag}: Titel fehlt ({part})")
                    if part == "r" and not t.get("text"):
                        errs.append(f"{tag}: Lesetext fehlt")
                    if part == "d" and not t.get("lines"):
                        errs.append(f"{tag}: Hoertext fehlt")
                    for line in t.get("lines", []) if part == "d" else []:
                        if len(line) != 2 or not line[1]:
                            errs.append(f"{tag}: Dialogzeile {line!r}")
                    for q in t.get("q", []):
                        if len(q) != 3 or not isinstance(q[1], list) or len(q[1]) < 2 or q[2] != 0 or len(set(q[1])) != len(q[1]):
                            errs.append(f"{tag}: Frage {q!r}")
            for t in _all(lv, i, "s"):
                if not t.get("task") or not t.get("model"):
                    errs.append(f"{tag}: Schreibaufgabe unvollstaendig")
    return errs


_ORDER = ["alpha", "A1", "A2", "B1"]


def _sentences(text: str) -> list:
    import re
    out = []
    for s in re.split(r"(?<=[.!?])\s+", text or ""):
        s = s.strip().strip("„“\"")
        words = s.split()
        if (3 <= len(words) <= 12 and s[-1:] in ".!?" and "…" not in s and "___" not in s
                and not re.search(r"\d{3,}|[:;()/]|^[a-z]\)", s) and s[0].isupper()):
            out.append(s)
    return out


def pool(level: str, unit_idx: int, lang: str = "en") -> dict:
    """Alle Wörter und Übungssätze bis einschließlich der angegebenen Einheit (für das Training)."""
    if level not in _ORDER:
        level = "A1"
    words, sents, seen, seen_s = [], [], set(), set()
    for lv in _ORDER[:_ORDER.index(level) + 1]:
        last = unit_idx if lv == level else len(BOOK[lv]) - 1
        for i in range(0, min(last, len(BOOK[lv]) - 1) + 1):
            for grp, lines in word_groups(lv, i):
                for w in lines:
                    pw = parse_word(w)
                    k = pw["de"].lower()
                    if k in seen:
                        continue
                    seen.add(k)
                    words.append({"de": pw["de"], "pl": pw["pl"], "art": pw["art"], "pic": pw["pic"], "ph": pw["ph"],
                                  "l1": l1_wort(pw, lang), "level": lv, "unit": i, "grp": grp})
            texts = [r["text"] for r in _all(lv, i, "r")] + [l[1] for d in _all(lv, i, "d") for l in d["lines"]]
            texts += [t["model"] for t in _all(lv, i, "s")]
            for t in texts:
                for s in _sentences(t):
                    if s not in seen_s:
                        seen_s.add(s)
                        sents.append({"de": s, "level": lv, "unit": i})
    annotate(words)
    return {"words": words, "sentences": sents}
