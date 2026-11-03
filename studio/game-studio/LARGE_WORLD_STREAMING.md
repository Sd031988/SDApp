# SD Game-Studio – Lokales Datei-Streaming (v3, Entwicklungsstufe 1)

Das normale SD Game-Studio bleibt unverändert. Die eigenständige **Großwelt-Engine**
unter `large-world.html` kann zusätzlich eine auf Dateien aufgeteilte Welt anzeigen.

## Welt in Zellen-Dateien umwandeln

1. Im Großwelt-Editor zuerst **Großwelt speichern (v3 JSON)** wählen.
2. Auf einem Rechner mit Node.js (Version 22 oder neuer) innerhalb des Repositorys ausführen:

```bash
node studio/game-studio/tools/pack-world.cjs sd-game-large-world-v3.json meine-grosswelt-zellen
```

Der Zielordner **darf noch nicht existieren**. Das Programm überschreibt
keine vorhandenen Dateien.

3. Der Ordner enthält `manifest.json` und bis zu 256 Dateien
`chunk-X-Z.json`. Jeder Eintrag im Manifest enthält einen SHA-256-Hash.
4. In **Großwelt-Engine → Datei-Streaming** den gesamten Ordner
(Desktop, wenn vom Browser unterstützt) oder die Manifestdatei zusammen
mit allen Zellendateien auswählen.

Die Dateien werden **nicht hochgeladen**. Der Browser speichert die
ausgewählten File-Handles im Sitzungsspeicher und liest die Byte-Inhalte
erst, wenn die Kamera in die Nähe einer Zelle kommt. Mehrere Ladevorgänge
dürfen parallel stattfinden, aber höchstens drei gleichzeitig. Der Cache
enthält maximal zwölf Zellen (beim Standardradius üblicherweise neun).
Zellen werden nach dem Verlassen des Bereichs aus dem Cache entfernt.

## Einschränkungen, die bewusst noch bestehen

- Der gestreamte Dateisatz ist **schreibgeschützt**. Die vorhandenen
  Demo- und v3-Projektfunktionen bleiben getrennt; Änderungen im normalen
  v3-Modus lassen sich weiterhin als Gesamtwelt-JSON speichern.
- Beim erneuten Öffnen ist die Dateiauswahl wieder erforderlich. Keine
  Speicherung von File-Handles, Tokens oder Nutzerdaten in der Cloud.
- Das ist **lokales dateibasiertes Streaming** und keine Server-, Netzwerk-,
  SSD- oder GPU-Streaming-Lösung.
- Die aktuelle Welt umfasst 640×640 Einheiten und verwaltet bis zu
  8.192 Objekte. Sichtbare Objekte sind weiterhin vereinfachte
  Low-Poly-Geometrie; GLB-Animationen, komplexe LOD-Meshes, Physik,
  Navigation, Terrain-Höhenkarten und Multiplayer sind nicht enthalten.
- Das v3-Chunkschema ist unabhängig von v1/v2; alte Projektdateien
  werden **weder automatisch migriert noch verändert**.
- Ordnerauswahl wird nicht in allen mobilen Browsern unterstützt.
  Alternativ kann man die einzelnen JSON-Dateien mehrfach auswählen,
  sofern der Dateidialog dies zulässt.

## Sicherheitsgrenzen

- Nur exakte Dateinamen aus `manifest.json`; keine relativen Pfade,
  externen URLs oder dynamischen Netzzugriffe.
- Vor dem Import werden Größe, IDs, Weltkoordinaten, Zellenzahlen und
  Datenbudget geprüft. Beim tatsächlichen Lesen folgt der Vergleich
  der SHA-256-Prüfsumme und die vollständige v3-Zellenvalidierung.
- Fehlerhafte Zellen werden nicht gerendert, und der Dateisatz kann
  gewechselt werden, ohne die vorherige v3-Projektdatei zu überschreiben.
- Testfälle müssen verspätete Dateiantworten, Zellwechsel,
  Dateimanipulation, Aufräumen des Cache und altes v1/v2-Schema abdecken.

**Nächster technischer Schritt:** indizierte, dauerhaft gespeicherte
Zellen-Deltas, Frustum-Culling und GPU-Instancing mit dokumentierter
Performance-Messung. Die aktuelle Fassung beansprucht keine
AAA-Performance.
