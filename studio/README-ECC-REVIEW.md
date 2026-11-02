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


## Ausbau V2 – Vergleich mit weiteren Coding-Agenten (November 2026)

Die folgenden Konzepte sind eigenständig umgesetzt, nicht als fremder Agent eingebettet:

| Referenz | Beobachtete Stärke | Umsetzung in SD Studio |
| --- | --- | --- |
| [Aider](https://github.com/Aider-AI/aider) | Codebasis-Karte und Git-orientierte Bearbeitung | Lokale Abhängigkeitskarte für HTML, CSS und statische JS-Imports |
| [Cline](https://github.com/cline/cline) | Plan/Act und überprüfbare Änderungen | Gesonderte Aufgabenplanung mit Freigabe-Übergabe |
| [Roo Code](https://github.com/RooCodeInc/Roo-Code) | Spezialisierte Arbeitsmodi | Sechs transparente Phasen mit Prüfaufgaben |
| [OpenCode](https://opencode.ai/docs/agents/) | Granulare Berechtigungen | Kein automatisches Teilen von Dateien; gesonderte Zustimmung |
| [OpenHands](https://github.com/OpenHands/software-agent-sdk) | Isolierte Agent-Workspaces | Für eine spätere serverseitige Ausführung vorgesehen, noch nicht implementiert |

**V2-Funktionen:**
1. Aufgabe beschreiben → Dateien anhand Dateinamen, lokalem Textinhalt und Verknüpfungen priorisieren.
2. Den sechsphasigen Umsetzungs- und Prüfplan ansehen.
3. Optional „Zur KI-Werkstatt übergeben“ – nur Ziel und lokal vorgeschlagene Pfade
   wandern in die *Oberfläche* der KI-Werkstatt. Dateien werden erst nach erneuter,
   ausdrücklicher Zustimmung in den kopierten Prompt übernommen.
4. Unterschiede, Projektkopien und bestehende Sicherheitskontrollen bleiben erhalten.

**Keine falschen Versprechen:** Das ist ein lokaler, regelbasierter Assistent, kein
LLM mit autonomer Werkzeugausführung. Es gibt noch keine Sandbox, selbständige
Codeänderungen, echten Testlauf oder automatisches Deploying in diesem Agent.
Dateipfade und Dateiinhalte werden nicht vom Agenten automatisch an KI-Anbieter
gesendet. Vor dem Kopieren in ChatGPT/Gemini die Quellen und Geheimnisse prüfen.
