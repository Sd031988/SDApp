# SD Game-Creator – gezielte Regressionstests

Der Game-Creator befindet sich in gestapelten Draft-PRs #111–#114 und diesem Testpaket. Die Tests dürfen **nicht** mit allgemeinem GitHub-CI-Grün verwechselt werden.

## Lokal / GitHub Actions

Ab Node.js 22 vom Repository-Hauptverzeichnis aus:

```sh
node studio/game-studio/engine/test-game-creator.cjs
```

Der Runner startet alle vier vorhandenen Game-Creator-Testdateien explizit. Ein fehlender Test führt zum Fehler. Rückgabecode ungleich 0 bedeutet Fehlschlag. Keine zusätzlichen Pakete, Netzwerkzugriffe, Datenbankzugriffe oder Änderungen an Nutzerprojekten.

**CI-Integration noch offen:** Die bestehende Workflow-Datei `.github/workflows/studio-tests.yml` liegt außerhalb des vereinbarten Bearbeitungsbereichs `studio/game-studio/`. Daher wurde sie **nicht** verändert. Ein Maintainer muss den obigen Befehl in einem eigenen GitHub-Actions-Schritt eintragen oder eine ausdrückliche Freigabe für die Workflow-Datei geben. Bis dahin ist ein allgemeiner grüner Studio-Workflow **kein Nachweis**, dass diese Tests gelaufen sind.

## Nicht abgedeckt

Kein Browser-/WebGL-/Mobil-Test, keine 3D-Asset-Generierung, keine produktive Editor-Integration, kein Undo/Redo-Import und keine CPU-/GPU-Messung. Vor Merge auf aktuellen main und Claude-Änderungen abgleichen.
