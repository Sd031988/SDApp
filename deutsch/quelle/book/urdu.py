"""Urdu-Übersetzungen (Erklärsprache Urdu). Quelle: quelle/ur/woerter.tsv (Deutsch<TAB>Urdu) und quelle/ur/texte.json ([[Englisch, Urdu], ...])."""
import json
import os

_HIER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "ur")
UR_WORT, UR_TEXT, FEHLT = {}, {}, set()
try:
    with open(os.path.join(_HIER, "woerter.tsv"), encoding="utf-8") as fh:
        for zeile in fh:
            zeile = zeile.rstrip("\n")
            if "\t" in zeile:
                de, ur = zeile.split("\t", 1)
                if de.strip() and ur.strip():
                    UR_WORT[de.strip()] = ur.strip()
except FileNotFoundError:
    pass
try:
    with open(os.path.join(_HIER, "texte.json"), encoding="utf-8") as fh:
        for en, ur in json.load(fh):
            UR_TEXT[en] = ur
except FileNotFoundError:
    pass


def ur_text(en):
    if en in UR_TEXT:
        return UR_TEXT[en]
    FEHLT.add(en)
    return en
