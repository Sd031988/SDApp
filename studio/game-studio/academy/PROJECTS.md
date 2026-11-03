# Abschlussprojekte / Capstones

Die Academy besitzt unter `studio/game-studio/academy/projects.html` vier eigenständige Projektaufträge mit realistischen Bedienungs- und Technikzielen.

1. Wald-Parcours (spielbarer Level-Editor-Prototyp).
2. Wüsten-Außenposten (Level-Design, Architektur und Licht).
3. GLB-Asset-Showroom (lokale Modellprüfung und v2-JSON).
4. Open-World-Techniklabor (experimentelle v3-Zellenwelt, Messungen und Architekturplanung).

Jeder Projektauftrag umfasst 6 Meilensteine, ein Bewertungsraster, konkrete abzugebende Ergebnisse, einen direkten Editor-Link, lokale Projektnotizen sowie eine druckbare Aufgabenansicht.

**Wichtig:** Die Häkchen sind eine Selbsteinschätzung. Die Academy greift weder auf die 3D-Projekte noch auf Dateien des Nutzers zu und bestätigt keine bestandene Prüfung automatisch. Ein vollständig markierter Projektauftrag wird daher als „Selbstprüfung abgeschlossen“ bezeichnet. Der Fortschritt ist getrennt von den ersten 16 Lektionen im Schlüssel `sd-game-academy-capstones-v1` hinterlegt.

Aktueller Umfang: Terrain, Basisobjekte, Spielmodus, begrenzter GLB-Import, lokale JSON-Projekte und experimentelle Großwelt. Es gibt derzeit weder vollwertige Multiplayer-Server noch Fahrzeugphysik oder Festplatten-Streaming. Darauf abgestimmte Aufgaben sind ausdrücklich planerisch.

Tests:

```sh
node --check studio/game-studio/academy/projects.js
node --test tests/studio/game-studio-academy-projects.test.cjs
node tests/studio/game-studio-academy-projects-browser.test.cjs
```
