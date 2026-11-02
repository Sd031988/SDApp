# SD Code-Studio – mehrstufiger Projekt-Review

Die Erweiterung unter **🧠 Projekt-Review** nutzt die Idee eines geordneten Arbeitsablaufs
(**Planen → Implementieren → Prüfen → Sicherheit → Freigabe**) aus
[Everything Claude Code / ECC](https://github.com/affaan-m/ECC). ECC ist unter der
[MIT-Lizenz](https://github.com/affaan-m/ECC/blob/main/LICENSE) verfügbar.
**Dies ist eine eigenständige Implementierung ohne kopierte ECC-Dateien und ohne
eingebautes Claude-Modell oder autonomen Agenten.**

## Verhalten

- Liest ausschließlich die geöffneten Projektdateien einschließlich ungespeicherter Editorstände.
- Verwendet vorhandene lokale statische Diagnosen und die Veröffentlichungsvorprüfung.
- Erkennt Quellsprachen, Testdateien, npm-Skriptnamen und Risiken.
- Erstellt einen fünfstufigen Review und eine manuelle Prüfliste.
- Bietet eine manuell kopierbare KI-Anfrage **nur aus aggregierten Metadaten**
  (keine Dateiinhalte, Dateinamen, Befundtexte oder Zugangsdaten).
- Speichert oder verändert keine Dateien, führt keinen Projektcode aus,
  ruft keine externen APIs auf und veröffentlicht nichts.

**Grenzen:** Die lokale Analyse beweist keine Funktionsfähigkeit, Sicherheit,
Datenschutzkonformität oder erfolgreiche Tests. npm-, Python-, Java- oder
Framework-Tests müssen in der passenden Ausführungsumgebung zusätzlich laufen.
Ein rein lokaler Browsercheck erkennt auch nicht alle eingebetteten Geheimnisse.

## Tests

Lokal: `node --test tests/studio/agent-review.test.cjs`

Die vorhandenen Studio-CI-Workflows enthalten zusätzlich JavaScript-Syntax,
Unit-Tests und einen Playwright-Browsersmoke. Die neue Funktion wird dort ebenfalls
geprüft.
