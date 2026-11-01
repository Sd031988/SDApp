# The SD Hub · Premium Dashboard und Designsystem

Stand: 2026-11-01. Eigenständiges SD-Hub-Design, inspiriert durch typische
Desktop-Dashboard- und Mobile-Navigationsmuster der Kombai-Galerie, **ohne
fremde Templates oder geschütztes Design zu kopieren**.

## Bereits implementiert

**Zentraler Einstieg:** `/mein-sd-hub/` mit Launcher für Deutschlernen,
Code-Studio, KI-Agent und Spiele sowie allen in
`mein-sd-hub/data.js` eingetragenen Werkzeugen. Suche und Kategorien
funktionieren lokal; Favoriten, letzte Tools, Lernfortschritt und das
persönliche Dashboard behalten ihre bisherigen gespeicherten Daten.

**Desktop (ab 921 px):** schmale linke Seitenleiste mit allen sechs
Bereichen, breite Arbeitsfläche, anpassungsfähige Aktionskacheln.

**Mobil (bis 920 px):** eigenständige feste untere Navigation mit
Übersicht, Wegweiser, Akademie, Projekte und **Mehr** für Mein Weg und
Sprachtrainer. Touch-Flächen und safe-area-Insets für Smartphones,
schmale Kachelansicht und eine einspaltige Anwendungsliste.

**Aussehen:** Designvariablen in `mein-sd-hub/dashboard-ui.css`,
Hell-/Dunkelmodus, gespeicherte Auswahl (Browser), sichtbare
Tastatur-Fokus-Markierung. Benötigt keine externe Schriften-CDN oder
Kombai-Bibliothek.

**Hauptwebsite:** Direkte Dashboard-Schaltfläche in `/index.html`.
Alle bisherigen Kategorien, Links und Bereiche bleiben erhalten.

**Automatisierte Tests:** `tests/mein-sd-hub.browser.cjs`,
`tests/hub-homepage.browser.cjs` und
`tests/hub/dashboard.browser.cjs`. GitHub Actions:
`hub-dashboard.yml` und bestehende Mein-SD-Hub-Qualitätsprüfung.

## Gemeinsame Navigation innerhalb der Anwendungen (neu)

Die SD Hub Apps nutzen jetzt ein gemeinsames, eigenständiges Navigationsmodul:
- `sd-workspace.js` – datensparsame, lokale App-Wechselnavigation
- `sd-workspace.css` – Designfarben und responsives App-Menü
- `sd-bereich.css` – aktualisierte Karten, Formulare und Farben für kleine Verwaltungs-Apps

**Normale Apps:** feste Orientierung als App-Leiste oben mit Dashboard-Link,
auf Handys zusätzlich eine untere Navigation (Dashboard, Code-Studio, KI,
Alle Apps). Die individuelle App-Funktionalität bleibt unverändert.

**Vollbild-/Spezial-Apps:** Code-Studio, Design-Studio, Deutschlernen,
B1-Prüfung, KI-Assistent, Pibo, BlockWorld und eine Online-PDF-Oberfläche
verwenden stattdessen einen kleinen, aufklappbaren SD-Hub-Schalter, damit
ihre Arbeitsflächen, Chats, Lerninhalte und Spielflächen nicht durch einen
zweiten Navigationsstreifen verkleinert werden.

Das gemeinsame Menü ist in mehr als zwei Dutzend HTML-Anwendungsseiten
eingebaut; es verlinkt die wesentlichen Apps und die persönliche Übersicht.
Es liest keine privaten Daten aus anderen Apps aus, verwendet keine
Administratorcodes und sendet keine Telemetrie.

Die automatisierten Tests `tests/hub/app-workspace.test.cjs` und
`tests/hub/app-workspace.browser.cjs` prüfen die App-Einbindung und den
Aufruf auf Laptop und Handy. Der Workflow
`.github/workflows/app-workspace.yml` führt diese Tests bei Änderungen aus.

**Noch offen:** Tiefgreifende Neubauten der **internen** Editoren,
Spielwelten oder Chatfunktionen sind damit nicht erfolgt. Das
verschlüsselte **lokale PC-Agentenpaket** wurde nicht neu gebaut; es
braucht weiterhin den gesonderten, getesteten Update- und
Freigabeprozess. Der in einer früheren Unterhaltung geteilte
Administratorschlüssel wurde nicht im Repository gespeichert.

## Weiterer gemeinsamer Ausbau der Anwendungen

Die neue Übersicht bündelt die **bestehenden Apps**, statt ihre eigenen
Editor-/Lern-/Agenten-Oberflächen ungeprüft zu überschreiben.
Für die schrittweise optische Vereinheitlichung gelten:

1. Gleiche Farben, Typografie, Abstände und deutlich sichtbare Aktionen;
   je Anwendung passende Arbeitsfläche und Bedienlogik erhalten.
2. **Deutschlernen / B1:** Lerntexte lesbar, Fortschritt und Prüfungsnavigation
   zugänglich, keine Änderung an Kursinhalten/Prüfungslogik durch CSS.
3. **Code-Studio:** Dateibaum, Editor und Vorschau behalten ihre
   Arbeitsflächen; **▶ Ausführen** bleibt permanent sichtbar.
4. **SD KI-Agent:** Chat-Konversationen, Modellwahl, Projekte und
   Berechtigungsdialoge nicht durch ein Dashboard ersetzen.
5. **Design-, PDF- und Schreibstudio:** große Touchziele und einheitlicher
   Einstieg ins Dashboard, aber native Bearbeitungswerkzeuge beibehalten.
6. **Spiele / Pibo:** kindgerechte Oberfläche und unabhängige Spiellogik.
7. Jede App einzeln auf mindestens 320, 390, 768 und 1440 px testen;
   keine horizontale Seitenverschiebung oder überlagerte Primärknöpfe.
8. Bestehende lokal gespeicherte Projekte und Chat-Daten niemals migrieren
   oder überschreiben, ohne Backup und ausdrückliche Zustimmung.

**Noch nicht abgeschlossen:** Die komplette innere Oberfläche jedes
einzelnen Studios, der Lernplattform, des verschlüsselten KI-Agenten
und aller weiteren Anwendungen wurde **nicht** gleichzeitig neugestaltet.
Das zentrale Dashboard ist der erste freigegebene gemeinsame Einstieg.
Der verschlüsselte Agent benötigt weiterhin seinen autorisierten
PC-Update-Prozess, bevor das Design dort erscheint.

## Datenschutz

Dashboard-Favoriten, Fortschritte und Theme-Präferenz sind lokal im
Browser gespeichert. Kein heimlicher Upload von Chats, Projekten oder
Profildaten. Lokale Daten können über den bestehenden Bereich
`/mein-sd-hub/#uebersicht` exportiert werden.
