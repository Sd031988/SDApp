# SD Code-Studio – lokale Vorher/Nachher-Testschleife

Die KI-Code-Werkstatt kann vor der Übernahme einer vorgeschlagenen Korrektur
**echte statische Testregeln** auf dem Codeentwurf ausführen und beide
Ergebnisse vergleichen.

## Ablauf

1. KI-Code einfügen und **Dateien automatisch erkennen**.
2. **Reparaturvorschläge erstellen**.
3. **Vorher/Nachher lokal testen** ausführen. Die KI-Werkstatt prüft die
   ausgewählten Dateien vor und nach der vorgeschlagenen Korrektur.
4. Der Bericht zeigt fehlgeschlagene Prüfungen, Warnungen sowie
   behobene und neu hinzugekommene Befunde.
5. Nur wenn keine neuen Fehler oder Warnungen entstehen, mindestens ein
   Befund verschwindet und die Sicherheitsprüfungen nach der Korrektur
   erfolgreich sind, darf der reparierte Code als Vorschau vorbereitet werden.
6. Auch beim Klick auf **Korrektur in Vorschau vorbereiten** laufen die
   lokalen Tests nochmals – das vorherige Ein-Klick-Verhalten bleibt nutzbar.
7. Die tatsächliche Übernahme in eine Projektkopie oder ins geöffnete
   Projekt bleibt ein **gesonderter Bestätigungsschritt**.

## Welche Tests laufen?

- Die existierende lokale KI-Codeprüfung inklusive Token-/Privatschlüsselprüfung.
- Sicherheitsbefunde für Links, dynamische JS-Ausführung und Python-Risiken.
- JSON-Datendateien werden mit JSON.parse auf gültige JSON-Syntax geprüft.
- Verknüpfungen zwischen lokalen HTML-, CSS- und JS-Dateien werden mit der
  vorhandenen Projektkarte auf fehlende Projektdateien geprüft.
- Zu große, unlesbare oder abgeschnittene Analysen werden nicht freigegeben.
- Der Vergleich erkennt sowohl behobene Befunde als auch neue Regressionen.

## Wesentliche Sicherheitsgrenze

**Das ist eine isolierte statische Testschleife, keine Runtime-Sandbox.**
Der importierte HTML-, JavaScript-, Python- oder sonstige Programmcode wird
dabei **nicht ausgeführt, kompiliert oder in einem Browser-Frame geladen**.
Es werden ausschließlich begrenzte, vertrauenswürdige, lokale Prüfregeln
auf Textdaten ausgeführt. Das schützt das Projekt vor der Ausführung fremden
Codes, belegt aber keine funktionierenden Programme, Browserinteraktionen oder
Serverprozesse. Die Ergebnisse dürfen nicht als bestandener Laufzeittest
ausgegeben werden.

Eine spätere echte Ausführung fremden Projektcodes muss in einer separat
isolierten Laufzeit erfolgen – mit gesperrtem Netzwerk, Limits für CPU,
Arbeitsspeicher, Prozesse, Dateizugriff und Laufzeit, ohne Secrets und ohne
Zugriff auf Originalprojekte. Ein alleiniges iframe oder JS-Worker reicht
hierfür nicht als allgemeiner Schutz.

## Qualitätskontrolle

- `node --test tests/studio/ki-test-loop.test.cjs`
- GitHub Actions: Unit-Tests, Syntaxprüfung, bisheriger Browser-Smoke
  und neuer eigenständiger Playwright-Test
  (`tests/studio/test-loop-browser.test.cjs`).

Keine Fremddienste oder zusätzlichen Zugangsdaten erforderlich.
