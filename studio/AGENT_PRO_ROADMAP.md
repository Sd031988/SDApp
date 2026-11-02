# SD Agent Pro – Aufgabenboard (erste Ausbaustufe)

Stand: 02.11.2026. Der Agent ist **noch kein autonomer Codex-Ersatz**. Diese erste Version ergänzt das bestehende SD Code-Studio, ohne Projektdateien zu ändern.

## Funktioniert jetzt

1. **Aufgaben anlegen:** Einen Entwicklungsauftrag eingeben. Die vorhandene lokale Projektkarte schlägt bis zu sechs geeignete Dateien vor.
2. **Pro Projekt getrennte Warteschlange:** Aufträge werden ausschließlich als Metadaten (Titel, Status, ausgewählte Pfade und Prüfergebnisse) in diesem Browser gespeichert. Keine Quelltexte, Geheimnisse oder Projektdateien im Aufgabenboard.
3. **Status mit Sperren:** Offen → In Arbeit → Testen → Freigabe → Erledigt. Ein Sprung direkt zu »Erledigt« ist nicht möglich.
4. **Sichere KI-Übergabe:** »Zur KI-Werkstatt« öffnet den bestehenden bestätigungspflichtigen Workflow. Die KI erhält nicht automatisch Projektcode und die Einwilligung bleibt zurückgesetzt.
5. **Statische Prüfungen:** In der Prüfphase ruft das Aufgabenboard die vorhandene vertrauenswürdige lokale Prüfroutine auf. Sie prüft nur statische Befunde und führt keinen Projektcode aus. Bei Fehlern, Warnungen oder veränderten Dateien bleibt die Freigabe gesperrt.
6. **Manuelle Fertigmeldung:** Abschluss nur nach aktiver Bestätigung, dass tatsächliche Funktionstests und Änderungen eigenständig geprüft wurden.

## Grenzen

- **Kein LLM integriert:** Der Agent schreibt noch keinen eigenen Quellcode und sendet keine Aufgaben an Modell-APIs. Ein echter Modelladapter braucht eine sichere serverseitige Architektur, Authentifizierung und ausdrückliche Freigaben.
- **Kein isolierter Runner:** Es werden keine beliebigen Projektprogramme ausgeführt. Für echte autonome Programmtests wäre ein getrenntes, ressourcenbegrenztes, kurzlebiges Ausführungssystem erforderlich.
- **Keine GitHub-Schreibrechte aus dem Browser:** Keine automatischen Commits, Pull Requests, Merges oder Deployments.
- **Lokale Speicherung:** Andere Geräte sehen den Aufgabenverlauf nicht. Löschen der Browserdaten löscht lokale Aufgaben; kein Sync oder Server-Backup. Aufgabenbeschreibungen enthalten möglicherweise private Angaben und bleiben daher lokal.
- **Statische Prüfberichte sind keine Test- oder Sicherheitsgarantie:** Manuelle Laufzeitprüfung, Browser- und Mobilgerätetests bleiben nötig.
- **Status und Prüf-Häkchen sind keine Berechtigungsgrenze:** Bei zukünftigen Modell-/Runner-/GitHub-Integrationen muss der Server Berechtigungen unabhängig prüfen.

## Ausbau zum vollwertigen Agenten

1. Freigegebene Modellanbindung mit expliziter Quelltextauswahl, Schutz vor Prompt Injection und serverseitiger Geheimnisverwaltung.
2. Isolierter Arbeitsbereich mit Projektkopien und begrenzten Dateiberechtigungen; Änderungen immer als Diff mit Backup.
3. Isolierter Test-Runner mit Limits für CPU, RAM, Netzwerk, Prozesslaufzeit und Dateisystem; nachprüfbares Testprotokoll.
4. Sichere GitHub-Integration über minimal berechtigte Token bzw. GitHub App, Pull Requests statt Direkt-Deployment und menschliche Merge-Freigabe.
5. Später optional wiederaufnehmbare Tasks mit Zugriffskontrolle, Lösch- und Exportfunktion sowie Datenschutzprüfung.

## Tests

- node --test tests/studio/agent-pro.test.cjs
- node tests/studio/agent-pro-browser.test.cjs (Playwright + Chromium benötigt)
- .github/workflows/studio-tests.yml enthält Syntax-, Unit- und Browser-Prüfungen.

Bis die CI-Checks erfolgreich sind, die Änderung **nicht** als vollständig getestet oder öffentlich veröffentlicht bezeichnen.
