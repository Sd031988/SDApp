# SD Code-Studio – lokaler Reparaturassistent

Der Reparaturassistent ergänzt die bestehende, Sourcery-inspirierte Codeprüfung
in **KI Coding → Dateien automatisch erkennen → Reparaturvorschläge erstellen**.

## Wie es funktioniert

1. Eine KI-Antwort mit vollständigen Code-Dateien in die KI-Werkstatt einfügen,
   prüfen und die gewünschten Dateien auswählen.
2. **Reparaturvorschläge erstellen**: Der Assistent liest ausschließlich den
   lokalen Prüfbericht und die ausgewählten Dateien. Er zeigt pro sicher
   erkennbarer Korrektur eine Vorher-/Nachher-Vorschau mit Dateiname und Zeile.
3. **Korrektur in Vorschau vorbereiten**: Bei eindeutig begrenzten Fällen
   werden nur die temporären KI-Code-Vorschläge geändert.
   Der normale Dateivergleich mit dem bestehenden Projekt öffnet sich.
   **Keine Projektdatei wird dadurch automatisch gespeichert oder ausgeführt.**
4. Zum tatsächlichen Übernehmen gelten weiterhin die ausdrücklichen Bestätigungen
   und die Versionierung bzw. neue Projektkopie.
5. Für komplexe Befunde kann eine **Reparaturanfrage nur mit Regel, Dateiname,
   Zeile und Handlungsempfehlung** kopiert werden. **Keine Quelltexte werden
   ohne separate Zustimmung an ChatGPT oder Gemini gesendet.**

## Was automatisch geändert werden darf

Aktuell ausschließlich ein kontrollierter HTML-Fall:

- Bei genau einem einzeiligen HTML-Link mit target="_blank" ohne noopener
  kann das Attribut rel="noopener noreferrer" ergänzt werden.
  Bestehende rel-Werte wie nofollow bleiben erhalten.

**Warum so restriktiv?** Bei eval, innerHTML, Shell-Operationen,
Deserialisierung, fehlenden Bildbeschreibungen oder HTTP-Links hängt
die richtige Reparatur vom Programmkontext ab. Hier bietet der Assistent
nur sichere, nachvollziehbare **Anweisungen für eine manuelle oder durch
den Nutzer freigegebene KI-Korrektur**. Ein fehlender alt-Text wird
nicht automatisch zu einem leeren Text umgewandelt, da informative Bilder
dadurch für Screenreader unsichtbar werden könnten.

## Sicherheitsgrenzen

- Rein lokal; kein Netzverkehr, keine Ausführung und keine Projektdateiänderung.
- Bei erkannten Zugangsdaten, unvollständigen oder abgeschnittenen Reviewdaten
  wird keine Reparatur vorgeschlagen.
- Wenn sich Dateiauswahl, Quellantwort oder Projekt nach der Planung ändert,
  müssen Vorschläge erneut erstellt werden.
- Keine heimliche KI-Integration: Die Anfrage bleibt eine bewusst kopierte
  Nachricht und Codefreigaben laufen weiter über die bestehende KI-Werkstatt.
- Zeilenbasierte Prüfung kann nicht jeden Fehler erkennen. Es ist kein
  vollständiger KI-Agent, kein SAST-Ersatz und keine Garantie auf Sicherheit.

## Tests

- node --test tests/studio/ki-repair-assistant.test.cjs
- Studio-GitHub-Actions: Syntax, bestehende Regressionstests und Playwright
  für eine sichere automatische Korrektur sowie komplexe manuelle Befunde.

Entwicklungsinspiration: [Sourcery AI Code Review](https://docs.sourcery.ai/).
Dies ist keine Sourcery-Integration und enthält keine proprietären Sourcery-Regeln.
