"""Weitere Erklärsprachen aus Übersetzungsdateien: quelle/<sprache>/woerter.tsv (Deutsch<TAB>Übersetzung)
und quelle/<sprache>/texte.json ([[Englisch, Übersetzung], ...]). Derzeit: ur (Urdu), ti (Tigrinya)."""
import json
import os

EXTRA_SPRACHEN = ("ur", "ti")
_BASIS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
WORT, TEXT, FEHLT = {}, {}, {}
for _l in EXTRA_SPRACHEN:
    WORT[_l], TEXT[_l], FEHLT[_l] = {}, {}, set()
    try:
        with open(os.path.join(_BASIS, _l, "woerter.tsv"), encoding="utf-8") as fh:
            for zeile in fh:
                zeile = zeile.rstrip("\n")
                if "\t" in zeile:
                    de, tr = zeile.split("\t", 1)
                    if de.strip() and tr.strip():
                        WORT[_l][de.strip()] = tr.strip()
    except FileNotFoundError:
        pass
    try:
        with open(os.path.join(_BASIS, _l, "texte.json"), encoding="utf-8") as fh:
            for en, tr in json.load(fh):
                TEXT[_l][en] = tr
    except FileNotFoundError:
        pass
UR_WORT = WORT["ur"]


def x_text(en, lang):
    if en in TEXT[lang]:
        return TEXT[lang][en]
    FEHLT[lang].add(en)
    return en


def ur_text(en):
    return x_text(en, "ur")
