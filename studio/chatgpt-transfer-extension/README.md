# SD Code-Studio – ChatGPT/Gemini Browser-Brücke

Diese kleine Chrome-Erweiterung überträgt **nur ausdrücklich markierten Text**
aus ChatGPT oder Gemini in die bestehende KI-Code-Werkstatt des SD Code-Studios.

## Installieren

1. `https://www.thesdhub.com/studio/chatgpt-bruecke.html` öffnen.
2. **Chrome-Erweiterung als ZIP herunterladen** und die ZIP entpacken.
3. In Chrome `chrome://extensions` aufrufen, den Entwicklermodus aktivieren
   und **Entpackte Erweiterung laden** wählen.
4. Den Ordner wählen, der `manifest.json`, `background.js` und
   `studio-bridge.js` enthält.

## Benutzen

1. ChatGPT unter `https://chatgpt.com/` öffnen und gegebenenfalls anmelden.
2. Nur die gewünschte Antwort oder den Code markieren.
3. Rechtsklick: **Ausgewählten KI-Text an SD Code-Studio senden**.
4. Der Online-Code-Editor öffnet sich oder wird fokussiert. Er füllt das
   KI-Code-Feld aus, erkennt Dateien und zeigt sie zur Kontrolle an.
5. Dateien vergleichen und die gewünschte Übernahme **bewusst bestätigen**.

Die bisherige manuelle Übernahme über „📋 Gesamte KI-Antwort einfügen“
funktioniert weiterhin ohne Erweiterung.

## Datenschutz / technische Grenzen

- **Kein** Zugriff auf Passwörter, Cookies, API-Schlüssel oder sonstige Chats.
  Es gibt keine ChatGPT-Anmeldeschnittstelle, kein automatisches Durchsuchen
  privater Chatverläufe und keine versteckte Browserautomatisierung.
- Die Auswahl wird maximal 15 Minuten im flüchtigen Chrome-Sitzungsspeicher
  gehalten, bis das Studio sie bestätigt; danach wird sie gelöscht.
- Die Erweiterung liest nur eine markierte Textauswahl nach einem
  ausdrücklichen Rechtsklick auf ChatGPT oder Gemini.
- Die Auswahl wird **nicht** an einen SD-Hub-Server gesendet. Sie wird lokal
  per Browser-Extension-Nachricht an die bereits geöffnete Studio-Seite
  übergeben. Der empfangene Text ist dort sichtbar und kann verarbeitet werden.
- Übernommener Text wird **nicht** automatisch ausgeführt, gespeichert oder
  als Projekt veröffentlicht. Der normale Prüf- und Sicherungsablauf gilt.
- Nur `https://www.thesdhub.com/studio/` (oder die kanonische Domain ohne
  `www`) kann die Sitzungsauswahl abfragen. Kein unbeschränkter Zugriff auf
  Webseiten oder die lokale Festplatte.
- Kein fertiger Chrome-Web-Store-Eintrag; der Nutzer muss die Erweiterung
  ausdrücklich manuell installieren. Bei Chrome- oder ChatGPT-Änderungen
  können Anpassungen erforderlich werden.
- Der unter `http://localhost:8765` installierte **ursprüngliche PC-Agent**
  ist ein gesondertes verschlüsseltes Release und wird durch diese
  Online-Studio-Erweiterung **nicht** automatisch aktualisiert.

## Chatverlauf recherchieren

Ein kompletter privater ChatGPT-Verlauf wird durch diese Erweiterung
**nicht** durchsucht. Für vom Nutzer ausdrücklich gewünschte Archivanalysen
gibt es den offiziellen ChatGPT-Datenexport über
**Einstellungen → Datenkontrollen → Daten exportieren**. Ein solcher
Export darf nur nach gesonderter Freigabe und mit klarer Auswahl verarbeitet
werden; er kann sehr private Inhalte enthalten.
