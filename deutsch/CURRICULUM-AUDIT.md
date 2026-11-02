# The SD Hub – Curriculum-Audit Alphabetisierung bis B1

Stand: 01.11.2026. Arbeitsdokument, **keine Zertifizierung**. Maßstab: GER/CEFR, Goethe-Zertifikat B1, telc Deutsch B1. Die offiziellen Wortlisten und Prüfungsmodelle dienen als Referenz; geschützte Buchinhalte werden nicht übernommen.

## Quellen
- GER / Goethe: https://www.goethe.de/ins/de/de/uun/dln/ger.html
- Goethe B1 Kompetenzprofil: https://www.goethe.de/ins/de/de/uun/dln/db1.html
- Goethe B1 Wortliste: https://www.goethe.de/pro/relaunch/prf/id/Goethe-Zertifikat_B1_Wortliste.pdf
- telc B1 Prüfungsaufbau: https://www.telc.net/sprachpruefungen/deutsch/zertifikat-deutsch-telc-deutsch-b1/

## Vorhandene Module (Codeinspektion)
- `lernwerk-vereinheitlicht.js`: 176 kurze Aufgaben (36 Alphabetisierung, je 40 A1/A2/B1, 20 Praxis), Lernhilfen und Fortschritt. Das sind **keine 176 vollständigen Lektionen**.
- `alphabet-a2-training.js`: Alphabetisierung/A1/A2 mit Einheiten, zusätzlichem Wortschatz und Wiederholung. Wortlisten sind vorhanden, aber ihre vollständige Abdeckung gegenüber der offiziellen B1-Wortliste ist **nicht nachgewiesen**.
- `b1-musterpruefungen.js`: eigenständig erstelltes Training für Goethe/telc/DTZ mit Lesen, Hören, Schreiben und Sprechen. Vorhandensein der Übungsformen ist **kein Nachweis einer validierten Prüfungssimulation**. Browser-Sprachausgabe ersetzt nicht automatisch authentisches Hörmaterial.
- `lernweg-dashboard.js`: Navigation und Fortschrittsanzeige, keine GER-Kompetenzdiagnostik.

## Soll-Curriculum und Lückenprüfung
| Stufe | Verbindliche Themenfelder | Sprachliche Mittel | Nachweis vor Freigabe |
|---|---|---|---|
| Alphabetisierung | Laut-Buchstaben-Zuordnung, Silben, Umlaute, ß, Wörter, Sätze, Alltagsformulare | Lautbewusstsein, Leseflüssigkeit, Schreibmotorik, einfache Orthografie | Lautes Lesen, Diktat, Schreiben eigener Wörter und Sätze; bislang nicht systematisch bewertet |
| A1 | Person, Familie, Wohnen, Zahlen/Uhrzeit, Essen/Einkaufen, Freizeit, Schule/Arbeit, Gesundheit, Verkehr | Präsens, Verbzweitstellung, Fragen, Negation, Artikel, Nominativ/Akkusativ, Possessivartikel, Modal-/trennbare Verben | Wortschatz aktiv verwenden, kurze Dialoge und Nachrichten produzieren; nicht durch Multiple Choice allein belegbar |
| A2 | Alltag, Termine, Arzt, Wohnung, Beruf, Reisen, Behörden, Einladungen, Erlebnisse | Perfekt, Präteritum von sein/haben, Dativ, Wechselpräpositionen, Reflexivverben, Nebensätze, Vergleiche, höfliche Bitten | Zusammenhängende kurze Texte, Telefonate, Hörverstehen und Schreibaufgaben bewerten |
| B1 | Arbeit/Bewerbung, Bildung, Medien, Umwelt, Mobilität, Gesundheit, Zusammenleben, Konsum, Reisen, Meinungen, Pläne | Nebensätze, Relativsätze, Konjunktiv II, Passiv, Infinitiv mit zu, Präpositionalverben, Verknüpfungen, Argumentieren | Authentische Lese-/Hörtexte, freie E-Mails und Meinungsbeiträge, Präsentation, Gespräch und gemeinsame Planung nach Bewertungsraster |

## Priorisierte Lücken / Qualitätsrisiken
1. **Wortschatz:** Keine belegte systematische Wort-für-Wort-Abdeckung der offiziellen B1-Wortliste; zu jedem Eintrag sollten Stufe, Thema, Artikel/Plural oder Verbformen, Beispielsatz, aktive Wiederholung und Beherrschungsstatus erfasst werden. Nicht die gesamte offizielle Wortliste wörtlich kopieren.
2. **Grammatik:** Vorhandene Beispiele und Regelhinweise sind kein vollständiger Lehrgang. Für jedes Lernziel braucht es Erklärung, mehrere Übungen, freie Anwendung, Wiederholung und Fehleranalyse.
3. **Hören:** Unterschiedliche Sprecher, natürliche Sprechgeschwindigkeiten und Aufgaben zum Global-, Detail- und selektiven Verstehen mit überprüfbarer Audioqualität.
4. **Schreiben:** Selbst verfasste Texte mit nachvollziehbarer Rückmeldung zu Aufgabenbewältigung, Kohärenz, Wortschatz und sprachlicher Richtigkeit.
5. **Sprechen:** Aufnahme/Live-Gespräch, Präsentation, Nachfragen und gemeinsames Planen mit Bewertung; Auswahlantworten messen dies nicht.
6. **Lesen:** Zusammenhängende Texte verschiedener Textsorten, nicht nur einzelne Sätze und kurze Informationshäppchen.
7. **Prüfungsvalidität:** Unabhängige B1-Probetests unter realistischen Bedingungen, Bewertungsraster, manuelle Stichproben und Pilotgruppe mit echten Lernenden.
8. **Fortschritt:** 100 % richtige Auswahlantworten darf nicht automatisch als GER-B1 oder „prüfungsbereit“ ausgewiesen werden.

## Freigabekriterien
- Lernziele jeder Stufe explizit und mit mindestens einer **produktiven** und einer **rezeptiven** Aufgabe abgedeckt.
- Wortschatz-Abgleich gegen offizielle Referenz **dokumentiert**, einschließlich nicht abgedeckter Einträge.
- Alle vier Fertigkeiten mit eigenständigen, bewertbaren Leistungen; Feedback auf freie Antworten.
- Tests auf Mobilgeräten und Desktop, Barrierefreiheit, Audio und Fortschrittsmigration erfolgreich.
- Externe fachliche Prüfung sowie Pilotprüfung mit Lernenden abgeschlossen.

**Öffentliche Formulierung bis dahin:** „Deutsch-Lern- und Prüfungstraining von der Alphabetisierung bis B1 (im Ausbau)“. **Nicht behaupten:** „Wer alle Aufgaben löst, beherrscht B1“ oder „garantiert die B1-Prüfung“.

## Technische Qualitätssicherung – 02.11.2026
- Nach der thematischen Sortierung wird die zuletzt geöffnete Übung jetzt über die stabile Aufgaben-ID gespeichert (Cursor-Schema Version 2), statt nur über die wechselnde Listenposition.
- Alte Positionsangaben aus Version 1 werden beim ersten Laden anhand der ursprünglichen Reihenfolge auf die passende Aufgaben-ID abgebildet.
- Die Grammatikzuordnung nutzt korrigierte Wortgrenzen in den regulären Ausdrücken; zusätzliche Regressionstests prüfen unter anderem Dativ und Nebensätze.
- In einer isolierten JavaScript-Funktionsprüfung wurden 176 stabile Aufgaben-IDs und 176 alte Positionen auf korrekte Wiederaufnahme kontrolliert. Dies ist **kein** vollständiger Browser-/GitHub-Actions-Test.
- Weiterhin offen: Playwright-Prüfung auf Smartphone und Desktop, didaktische Einzelprüfung der Themenzuordnung, Wortschatzabgleich mit offiziellen Referenzen und valide Kompetenzmessung in Lesen, Hören, Schreiben und Sprechen.
