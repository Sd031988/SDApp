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

## Qualitätskorrektur – 03.11.2026
- Fehler festgestellt: Die generische Lernhilfe zeigte vor der Antwort bereits `item.note` und die richtige Option an. Dadurch war die Lernkontrolle bei Aufgaben ohne spezielle Grammatikregel nicht aussagekräftig.
- Korrigiert: Vor der Antwort erscheinen bei diesen Aufgaben nur neutrale Lernstrategien. Die fachliche Lösungserklärung bleibt im Feedback nach dem Prüfen verfügbar.
- Regressionstest ergänzt: Für alle 176 Aufgaben wird kontrolliert, dass generische Vorabhinweise weder den Lösungstext noch die korrekte Option verraten.
- JavaScript-Syntax der geänderten Dateien isoliert geprüft; vollständige Node-/Playwright-Ausführung und didaktische Validierung stehen noch aus.
- Rest-Risiko: Spezifische Themenregeln können vereinzelt inhaltliche Hinweise geben; Multiple-Choice-Abschlüsse allein sind kein Nachweis der B1-Kompetenz.

## Freies Schreiben – 04.11.2026
- Die vereinheitlichte Lernwerkstatt bietet nun pro Lernstufe (Alphabetisierung, A1, A2, B1, Praxis) eine eigene offene Schreibaufgabe. Für B1 wird eine formelle Problembeschwerde mit konkreter Bitte geübt.
- Textentwürfe werden pro Lernstufe ausschließlich lokal im Browser unter `sdHubWritingDraftsV1` gespeichert. Ein Wortzähler und aufklappbare Selbstprüfkriterien unterstützen die Bearbeitung; es gibt bewusst keine automatische B1-Benotung oder falsche Prüfungszusage.
- JavaScript-Syntax des geänderten Skripts über `new Function` geprüft; Wortzählungs-RegEx nach der Erstimplementierung korrigiert.
- Verbleibende Risiken: Noch kein vollständiger Playwright-Test für Eingabe, Speichern, Wiederherstellen und mobile Darstellung; lokale Daten können beim Löschen des Browsers verloren gehen. Für belastbare Schreibbewertungen sind fachlich überprüfte Rubriken und menschliches oder validiertes Feedback erforderlich. Die übrigen Fertigkeiten bleiben unabhängig zu prüfen.

## Schreibentwürfe – 05.11.2026
- Ist-Zustand geprüft: Freie Schreibaufgaben existieren für Alphabetisierung, A1, A2, B1 und Praxis. Bisher wurde nur nach Klick auf „Entwurf speichern“ gespeichert; ein Wechsel der Lektion löst `render()` aus und ersetzt das Textfeld. Dadurch konnten ungespeicherte Eingaben verloren gehen.
- Verbesserung: Jede Texteingabe speichert den aktuellen Entwurf der Lernstufe unmittelbar unter dem bestehenden Schlüssel `sdHubWritingDraftsV1` in `localStorage`. Der bisherige Speichern-Knopf bleibt als manuelle Wiederholung erhalten. Wiederherstellung und deaktivierte automatische Großschreibung bleiben unverändert.
- Regressionstest im bestehenden Node-Testmodul ergänzt (Autosave, Wiederherstellung, manueller Speichern-Knopf, `autocapitalize="off"`).
- Syntaxprüfung der geänderten JavaScript-Dateien mit `new Function` erfolgreich. Vollständiger Node-/Playwright-Test und mobiler Browsertest sind noch nicht nachgewiesen.
- Risiken: `localStorage` kann durch Browser-Einstellungen, Speichermangel oder Löschen der Browserdaten ausfallen; der bestehende `save`-Helfer unterdrückt Speicherfehler, daher kann eine Erfolgsmeldung fälschlich erscheinen. Die Daten bleiben geräte- und browsergebunden. Keine automatische fachliche Bewertung, keine B1-Zertifizierung.

## Schreibentwürfe – Speicherfehler erkennen (06.11.2026)
- Codeprüfung: Der gemeinsame `save(k,v)`-Helfer unterdrückte bisher `localStorage`-Fehler; beide Schreibfunktionen meldeten trotzdem Erfolg.
- Korrektur: `save` gibt nur dann `true` zurück, wenn `setItem` gelingt und `getItem` unmittelbar den gleichen serialisierten Wert zurückliefert. Sonst wird `false` geliefert. Beide Schreibfunktionen zeigen dann ausdrücklich „Speichern fehlgeschlagen!“ und empfehlen, den Text extern zu sichern.
- Regressionstest ergänzt: erfolgreicher Schreib-/Lesevorgang, Exception bei `setItem`, stiller Nicht-Speicherfall sowie beide Statusmeldungsstellen.
- JavaScript-Parsing der Änderungen geprüft; vollständiger Node-Testlauf, Playwright und reale Browser-Speicherfehler wurden in diesem Durchgang nicht ausgeführt.
- Restrisiken: Browserdaten können später gelöscht werden, Browser-/Geräte-Synchronisation fehlt; auch eine erfolgreiche direkte Rücklesung garantiert keine dauerhafte Datensicherung. Kein fachlich validiertes automatisches Schreibfeedback.


### 2026-11-07 – Manuelle Selbstkontrolle für freie Schreibaufgaben

- In `deutsch/lernwerk-vereinheitlicht.js` wurden fünf stufenspezifische Checklisten ergänzt (Alphabetisierung, A1, A2, B1, Praxis). Die Lernenden markieren selbst, ob sie die geforderten Inhaltspunkte bearbeitet haben.
- Eine Fortschrittsanzeige zählt die selbst angekreuzten Punkte; sie ist ausdrücklich **keine automatische Sprachbewertung**. Bestehende Schreibentwürfe und deren Speicherformat bleiben unverändert.
- In `tests/lernwerk-data.test.cjs` prüft ein neuer Regressionstest das Vorhandensein und die Eindeutigkeit der Kriterien sowie die Anbindung der Checkboxen.
- Prüfung in diesem Durchgang: JavaScript-Quelltext und Testdatei wurden syntaktisch als Funktionen geparst; vollständiger Node-Testlauf und Playwright-Browserprüfung nicht durchgeführt.
- Restrisiken: Checkboxen prüfen nicht, ob die Aussagen tatsächlich zutreffen; sie werden bei einer Neudarstellung zurückgesetzt. Keine automatische Beurteilung von Grammatik, Wortschatz, Textkohärenz oder B1-Prüfungsreife. Vor Veröffentlichung End-to-End-Test einschließlich Tastaturbedienung und Mobilansicht durchführen.

### 2026-11-08 – Keine Lösungsvorgabe nach falscher Auswahl

- Bei einer falschen Multiple-Choice-Antwort wurde bisher die korrekte Option unmittelbar angezeigt. Das unterlief die Wiederholungsfunktion und konnte die Aussagekraft des Lernfortschritts mindern.
- Der Hinweis fordert nun zum erneuten Lesen der Lernhilfe und Vergleichen der Antworten auf; der Button „Noch einmal versuchen“ bleibt bestehen. Richtige Antworten werden weiterhin über den vorhandenen Erfolgszweig verarbeitet.
- Regressionstest in `tests/lernwerk-data.test.cjs` prüft, dass der falsche Antwortzweig die richtige Option nicht mehr ausdrücklich verrät und der Wiederholungsbutton erhalten bleibt.
- JavaScript-Parsing der bearbeiteten Quell- und Testdatei erfolgreich; ein vollständiger Node-Testlauf sowie Playwright-Browsertests wurden nicht ausgeführt.
- Restrisiken: Manche allgemeine Lernhilfen können weiterhin indirekte Hinweise geben; die Wiederholung ist keine standardisierte Prüfung. Vor Freigabe Browserprüfung, Tastaturbedienung und didaktische Prüfung der Aufgaben durchführen.

### 2026-11-09 – Stufengerechte Schreibhilfen

- Bestand geprüft: Schreibaufgaben und Selbstkontrollen für Alphabetisierung, A1, A2, B1 und Praxis waren vorhanden, aber konkrete Hilfen für Textaufbau, Satzverknüpfung und Überarbeitung fehlten.
- Ergänzt: Je Stufe ein ausklappbarer Hilfebereich mit drei Abschnitten (Aufbau, Sprache/Grammatik, Kontrolle vor der Abgabe). B1 enthält Hinweise zu formeller Beschwerde, Konnektoren und der aufgabenspezifischen Wortvorgabe von 80–120 Wörtern. Keine fertigen Musterlösungen; bestehende Entwurfsspeicherung und Selbstkontrolle unverändert.
- Tests: JavaScript-Quelltext und Testdatei syntaktisch geprüft; alle fünf Hilfedatensätze auf die drei Pflichtfelder und Mindestinhalt geprüft; Test für sichere HTML-Einbindung ergänzt. Vollständige Node-Testsuite und Playwright-Browserprüfung **nicht** ausgeführt.
- Restrisiken: Hinweise ersetzen keine fachlich validierte Schreibbewertung. Didaktische Qualität, tatsächliche Anzeige auf Mobilgeräten, Tastaturbedienbarkeit und Wortschatz-/GER-Abdeckung vor Freigabe zusätzlich prüfen.


### 2026-11-10 – Schreibentwurf als TXT-Datei sichern
- Ausgangslage: Schreibentwürfe wurden ausschließlich im jeweiligen Browser gespeichert; bei Speicherfehlern wurde zwar zum Kopieren geraten, aber keine direkte Dateisicherung angeboten.
- Änderung: Die fünf Schreibbereiche bieten nun „Text als Datei sichern (.txt)“. Ein nichtleerer Entwurf wird als UTF-8-Textdatei mit stufenbezogenem Dateinamen über einen lokalen Blob-Download angeboten. Leere Entwürfe werden nicht exportiert; Fehler bei der Dateierstellung werden sichtbar gemeldet. Es werden keine Texte an einen Server übertragen.
- Prüfungen: JavaScript-Quelltext und Testdatei über Parser geprüft; statischer Regressionstest für Exportbutton, Blob-MIME, Dateinamen, URL-Freigabe und Meldungen hinzugefügt. **Vollständiger Node-Testlauf und Browser-/Mobiltests nicht durchgeführt.**
- Risiken: Browser können Downloads blockieren; die Erfolgsmeldung bestätigt nur den Start, nicht die tatsächliche Speicherung. TXT enthält keine Selbstkontroll-Häkchen und ist keine Prüfungsbewertung. Lokal gespeicherte Entwürfe bleiben weiterhin verlierbar. Für eine B1-Freigabe fehlen außerdem Wortschatz-/GER-Abgleich, Hör-/Sprechprüfung und fachlich validierte Schreibbewertung.
