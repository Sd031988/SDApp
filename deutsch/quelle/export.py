"""Erzeugt die Daten für „Deutsch lernen“ (deutsch/daten/*.json) aus den Kursbuch-Quellen in quelle/book.

Aufruf (im Ordner deutsch/quelle):  python3 export.py
Danach die JSON-Dateien mit hochladen. Die App selbst braucht keinen Server.
"""
import json
import os
import sys

HIER = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HIER)

import book as B  # noqa: E402
from book import articles as ART  # noqa: E402
from lehrplan import LEVELS, LESSONS, ALPHA_LESSONS, LANGS  # noqa: E402

ZIEL = os.path.join(HIER, "..", "daten")
os.makedirs(ZIEL, exist_ok=True)


def schreibe(name, obj):
    pfad = os.path.join(ZIEL, name)
    with open(pfad, "w", encoding="utf-8") as fh:
        json.dump(obj, fh, ensure_ascii=False, separators=(",", ":"))
    print(f"{name}: {os.path.getsize(pfad) // 1024} KB")


# Lehrplan (für /learn/curriculum und die KI-Lektionen)
schreibe("lehrplan.json", {
    "levels": [{"id": lv["id"], "name": lv["name"], "desc": lv["desc"],
                "units": [u["title"] for u in lv["units"]], "goals": [u["goals"] for u in lv["units"]]} for lv in LEVELS],
    "lessons": {"default": LESSONS, "alpha": ALPHA_LESSONS},
    "langs": LANGS,
})

# Artikel-Regeln: gegen den ganzen Wortschatz geprüft
ALLE = B.pool("B1", 99, "en")["words"]
STAT = ART.stats(ALLE)
AR = {w["de"]: (w.get("ar"), w.get("ax")) for w in ALLE if w.get("ar")}

for lang in ("fa", "en"):
    order = list(B.BOOK.keys())
    units = {}
    seen, seen_s = set(), set()
    for lv in order:
        units[lv] = []
        for i in range(len(B.BOOK[lv])):
            u = B.unit(lv, i, lang)
            u["goals"] = next(x for x in LEVELS if x["id"] == lv)["units"][i]["goals"]
            # Vorrat für das Training: nur die NEUEN Wörter/Sätze dieser Einheit (die App setzt sie zusammen)
            neu_w, neu_s = [], []
            for grp, lines in B.word_groups(lv, i):
                for w in lines:
                    pw = B.parse_word(w)
                    k = pw["de"].lower()
                    if k in seen:
                        continue
                    seen.add(k)
                    e = {"de": pw["de"], "pl": pw["pl"], "art": pw["art"], "pic": pw["pic"], "ph": pw["ph"],
                         "l1": pw["fa"] if lang == "fa" else pw["en"], "level": lv, "unit": i, "grp": grp}
                    if pw["de"] in AR:
                        e["ar"], e["ax"] = AR[pw["de"]]
                    neu_w.append(e)
            texts = [r["text"] for r in B._all(lv, i, "r")] + [ln[1] for d in B._all(lv, i, "d") for ln in d["lines"]]
            texts += [t["model"] for t in B._all(lv, i, "s")]
            for t in texts:
                for s in B._sentences(t):
                    if s not in seen_s:
                        seen_s.add(s)
                        neu_s.append({"de": s, "level": lv, "unit": i})
            u["poolWords"], u["poolSents"] = neu_w, neu_s
            units[lv].append(u)
    rules = [{"id": r["id"], "art": r["art"], "title": r["title"], "de": r["de"], "l1": r["fa"] if lang == "fa" else r["en"],
              "ex": r["ex"], **STAT[r["id"]]} for r in ART.RULES]
    general = [{"icon": g["icon"], "de": g["de"], "l1": g["fa"] if lang == "fa" else g["en"]} for g in ART.GENERAL]
    schreibe(f"buch-{lang}.json", {"order": order, "units": units,
                                   "articles": {"rules": rules, "general": general, "videos": ART.VIDEOS},
                                   "channels": B.CHANNELS})
