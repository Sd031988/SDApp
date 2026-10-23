"""Lehrplan für „Deutsch lernen“ (Alphabetisierung bis B1): Niveaus, Einheiten, Lektionsarten."""

LANGS = {"fa": "Dari/Persisch (persische Schrift, so wie in Afghanistan gesprochen)", "en": "Englisch", "ur": "Urdu (in Urdu-Schrift, so wie in Pakistan und Indien gesprochen)", "ti": "Tigrinya (in Ge'ez-Schrift ፊደል, so wie in Eritrea und Tigray gesprochen)"}

LEVELS = [
    {"id": "alpha", "name": "Alphabetisierung", "desc": "Buchstaben, Laute, Silben, erste Woerter lesen und schreiben. "
     "Sehr kurze, einfache Woerter, grosse Schrift, keine Grammatik-Begriffe.",
     "units": [
         {"title": "Vokale: A, E, I, O, U", "goals": "Vokale erkennen, hören, sprechen; Wörter wie Oma, Igel, Uhr"},
         {"title": "M, L, S, N", "goals": "Buchstaben M L S N mit Vokalen verbinden: ma, la, so, Mama, Name, Salz"},
         {"title": "T, R, H, B", "goals": "Silben und Wörter: Tee, rot, Haus, Brot, Bus"},
         {"title": "K, P, D, G, F, W", "goals": "Wörter: Kaffee, Papa, Dose, Geld, Fisch, Wasser"},
         {"title": "Zahlen 0 bis 20", "goals": "Zahlen lesen, hören, sprechen; Preise und Telefonnummern einfach"},
         {"title": "Mein Name und meine Adresse", "goals": "Namen, Straße, Hausnummer, Postleitzahl, Stadt lesen und schreiben"},
         {"title": "Schwierige Laute: sch, ch, ei, au, eu, ä, ö, ü", "goals": "Schule, ich, Ei, Haus, heute, Äpfel, schön, Tür"},
         {"title": "Kurze Sätze lesen", "goals": "Ich bin Ali. Das ist Brot. Wo ist der Bus? – kurze Schilder und Sätze lesen"},
     ]},
    {"id": "A1", "name": "A1", "desc": "Einfache Saetze, Praesens, du/Sie, Fragen mit W-Woertern, Artikel der/die/das, "
     "Akkusativ einfach, Modalverben koennen/muessen/moechten, trennbare Verben.",
     "units": [
         {"title": "Hallo! Sich vorstellen", "goals": "begrüßen, Name, Herkunft, Sprachen, Wohnort; heißen, kommen, sprechen, wohnen"},
         {"title": "Zahlen, Uhrzeit, Termine", "goals": "Uhrzeit, Wochentage, Termin vereinbaren; um, am, von ... bis"},
         {"title": "Familie", "goals": "Familienmitglieder, Alter, Familienstand; mein/meine, haben"},
         {"title": "Essen und Einkaufen", "goals": "Lebensmittel, Mengen, Preise, im Supermarkt; ich möchte, Akkusativ einen/eine"},
         {"title": "Wohnen", "goals": "Zimmer, Möbel, Wohnungsanzeige verstehen; es gibt, Adjektive groß/klein"},
         {"title": "Mein Tag", "goals": "Tagesablauf, trennbare Verben aufstehen/einkaufen, Uhrzeiten"},
         {"title": "Beim Arzt", "goals": "Körperteile, Schmerzen, Termin beim Arzt; Was fehlt Ihnen? Ich habe Kopfschmerzen."},
         {"title": "In der Stadt", "goals": "Wege beschreiben, Verkehrsmittel, Ortsangaben; mit dem Bus, links, rechts, geradeaus"},
         {"title": "Arbeit und Beruf", "goals": "Berufe, Arbeitszeiten, Arbeitsplatz; ich arbeite als ..., können/müssen"},
     ]},
    {"id": "A2", "name": "A2", "desc": "Perfekt, Praeteritum von sein/haben, Nebensaetze mit weil/dass/wenn, Dativ, "
     "Komparativ, Imperativ, Wechselpraepositionen, Formulare und kurze Briefe.",
     "units": [
         {"title": "Behörden und Formulare", "goals": "Anmeldung, Formular ausfüllen, Termin beim Amt; Perfekt"},
         {"title": "Wohnungssuche", "goals": "Anzeigen, Besichtigung, Miete, Nebenkosten; Komparativ, weil"},
         {"title": "Arbeit suchen", "goals": "Stellenanzeigen, Telefonat mit Arbeitgeber, Lebenslauf; dass-Sätze"},
         {"title": "Gesundheit und Apotheke", "goals": "Krankmeldung, Medikamente, Notfall 112; Imperativ, Modalverben im Präteritum"},
         {"title": "Kinder, Schule, Kita", "goals": "Elterngespräch, Entschuldigung schreiben, Termine; Dativ"},
         {"title": "Unterwegs: Bahn und Reisen", "goals": "Fahrkarte, Verspätung, Durchsage verstehen; wenn-Sätze"},
         {"title": "Feste und Freizeit", "goals": "Einladung, Feste in Deutschland, Hobbys; Perfekt, Wechselpräpositionen"},
         {"title": "Einkaufen und Reklamieren", "goals": "Kleidung, Größen, Umtausch, Reklamation; Adjektivendungen einfach"},
     ]},
    {"id": "B1", "name": "B1", "desc": "Meinung begruenden, Konjunktiv II (wuerde/haette/koennte), Passiv, Relativsaetze, "
     "obwohl/damit/trotzdem, formelle E-Mails/Briefe, Pruefung DTZ.",
     "units": [
         {"title": "Arbeitswelt und Bewerbung", "goals": "Bewerbung, Vorstellungsgespräch, Arbeitsvertrag; Relativsätze"},
         {"title": "Rechte und Pflichten", "goals": "Mietvertrag, Arbeitsrecht einfach, Versicherung; Passiv"},
         {"title": "Beschwerde und Konflikte", "goals": "sich höflich beschweren, Nachbarn, Vermieter; Konjunktiv II höflich"},
         {"title": "Meinung sagen und diskutieren", "goals": "Vor- und Nachteile, zustimmen, widersprechen; obwohl, trotzdem"},
         {"title": "Gesellschaft und Zusammenleben", "goals": "Wahlen, Vereine, Ehrenamt, Feste, Religion; damit, um ... zu"},
         {"title": "Umwelt und Alltag", "goals": "Mülltrennung, Energie sparen, Verkehr; Passiv, Konnektoren"},
         {"title": "Briefe und E-Mails schreiben", "goals": "formelle E-Mail: Anrede, Grund, Bitte, Gruß; DTZ Schreiben"},
         {"title": "Prüfungstraining DTZ", "goals": "Hören, Lesen, Schreiben, Sprechen wie in der DTZ; gemeinsam etwas planen"},
     ]},
]

# Neue Einheiten (siehe book/neu_*.py) hinten anhängen
from book.neu_a1 import UNITS as _N1  # noqa: E402
from book.neu_a2 import UNITS as _N2  # noqa: E402
from book.neu_b1 import UNITS as _N3  # noqa: E402
for _lv in LEVELS:
    for _u in {"A1": _N1, "A2": _N2, "B1": _N3}.get(_lv["id"], []):
        _lv["units"].append({"title": _u["t"], "goals": _u["goals"]})

# Lektionsarten pro Einheit (5 = Test)
LESSONS = [
    {"id": 1, "name": "Neue Wörter", "spec": "8 x word (Wort mit Artikel bei Nomen, Uebersetzung, Beispielsatz), 2 x choice zur Bedeutung"},
    {"id": 2, "name": "Sätze und Grammatik", "spec": "1 x rule (kurze Regel mit Beispielen), 4 x say, 3 x choice (Grammatik), 2 x write (Luecke fuellen)"},
    {"id": 3, "name": "Hören und Sprechen", "spec": "6 x say (Alltagssaetze zum Nachsprechen), 2 x choice (was passt als Antwort?), 2 x write"},
    {"id": 4, "name": "Gespräch", "spec": "Rollenspiel – wird als Chat gefuehrt"},
    {"id": 5, "name": "Test", "spec": "5 x choice, 3 x write, 2 x say – gemischt aus der ganzen Einheit"},
]
ALPHA_LESSONS = [
    {"id": 1, "name": "Buchstaben", "spec": "3 x letter (Buchstabe gross+klein, Laut, 3 kurze Beispielwoerter), 2 x choice (Welcher Buchstabe/Welches Wort hoerst du?)"},
    {"id": 2, "name": "Silben und Wörter", "spec": "6 x say (Silben und sehr kurze Woerter), 2 x choice, 2 x write (kurzes Wort abschreiben)"},
    {"id": 3, "name": "Lesen und Schreiben", "spec": "4 x word (sehr kurze Woerter), 3 x write (Wort schreiben, das man hoert/sieht), 3 x say"},
    {"id": 4, "name": "Gespräch", "spec": "Rollenspiel – wird als Chat gefuehrt (sehr einfach)"},
    {"id": 5, "name": "Test", "spec": "4 x choice, 3 x write, 3 x say – nur Inhalte der Einheit"},
]

ITEM_RULES = """ERLAUBTE ITEMS (Felder genau so):
{"type":"word","de":"der Apfel","l1":"<Uebersetzung>","example":"Ich esse einen Apfel.","example_l1":"<Uebersetzung>"}
{"type":"say","de":"<Satz oder Wort zum Nachsprechen>","l1":"<Uebersetzung>"}
{"type":"choice","q":"<Frage auf Deutsch>","q_l1":"<Frage uebersetzt>","options":["...","...","..."],"answer":<Index 0-2>,"audio":"<optional: deutscher Text zum Vorlesen, wenn es eine Hoeraufgabe ist>","explain_l1":"<kurze Erklaerung>"}
{"type":"write","q":"<Aufgabe auf Deutsch, z. B. Luecke: Ich ___ aus Syrien.>","q_l1":"<Aufgabe uebersetzt>","answer":"<richtige Loesung, nur das einzusetzende Wort/Wortgruppe>","audio":"<optional: Text zum Vorlesen (Diktat)>","explain_l1":"<kurze Erklaerung>"}
{"type":"letter","letter":"M m","sound":"<wie er klingt, z. B. mmm>","words":["Mama","Milch","Mund"],"l1":"<kurzer Hinweis>"}
{"type":"rule","title":"<Regel kurz>","text":"<1-3 einfache deutsche Saetze mit Beispielen>","l1":"<Erklaerung in der Erklaersprache>"}"""
