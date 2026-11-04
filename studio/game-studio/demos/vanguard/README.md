# Project Vanguard — SD Game-Studio Vertical Slice (Alpha)

Ein **spielbarer Third-Person-Action-Test**, der gezielt das bestehende `studio/game-studio/` prüft. Kein zusätzliches Framework und **keine Änderung an vorhandenen Spielprojekten**. Die Demo zeichnet eigene prozedurale Spielfiguren und verwendet die bestehenden SD-Module `large-world-core.js` und `large-world-terrain.js`.

## Spielauftrag

Steuere **Astra Voss** durch ein hügeliges Außengelände. Aktiviere drei verstreute Relais und kehre zur Extraktionsplattform am Start zurück. Sieben Patrouillendrohnen verfolgen dich, wenn du dich näherst. Du kannst sprinten, springen, ausweichen und mit der Energieklinge angreifen. Lebenspunkte, Ausdauer, Drohnenstatus, Missionsfortschritt, Radar und aktive Zellen werden im HUD angezeigt. Sieg und Niederlage besitzen einen Neustart.

**Steuerung:** WASD / Pfeiltasten bewegen · Maus/Finger auf 3D-Bild ziehen für Kamera · Shift sprinten · Leertaste springen · J angreifen · E Relais aktivieren / extrahieren · R neu starten · Mausrad Kameraentfernung. Auf Touchgeräten gibt es Bildschirmtasten.

**Start:** `/studio/game-studio/demos/vanguard/index.html` über HTTP aus dem SDApp-Repository oder nach Bereitstellung öffnen. Kein Build-Tool und keine Server-API erforderlich.

## Wie die Demo gebaut ist

1. `../../large-world-core.js` erzeugt deterministisch eine **640 × 640 Einheiten** große Welt mit **16 × 16 Zellen**. Die Dichte der Demo beträgt 6 Objekte je Zelle, also **1.536 Kulissenobjekte** in der Welt. Zur Laufzeit werden nur die 3 × 3 benachbarten Szenenzellen abgefragt, nicht alle Objekte durchgehend gezeichnet.
2. `../../large-world-terrain.js` berechnet nahtlos anschließende Terrain-Zellen samt Normalen. Der WebGL-Renderer hält nur aktive Terrain-GPU-Puffer im Cache und gibt verlassene Puffer wieder frei.
3. `game.js` zeichnet Gelände, Felsen, Bäume, Relais, Drohnen und **Astra Voss**, eine selbst konstruierte, mehrteilige humanoide Figur. Shader, Sonnenlicht, Dunst, Kameraführung sowie Lauf-/Sprung-/Angriffsposen sind selbst programmiert. Animationen sind **prozedural**, nicht über ein echtes Skelett-Rig.
4. `mission-core.js` enthält unabhängig von Grafik und DOM die Spiellogik: Bewegung, Ausdauer, Sprung/Gravitation, Hindernis- und Steigungsprüfung, Verfolgung, Trefferwinkel mit Cooldown, Schaden und Schutzintervall sowie drei Ziele und Extraktion.
5. HTML/CSS und Radar-Canvas liefern die Benutzeroberfläche und Touch-Steuerung.

## Stärke-Schwäche-Analyse

| Bereich | Im Vertical Slice vorhanden | Aktuell noch fehlend |
|---|---|---|
| Welt / Streaming | Welt-v3-Zellenauswahl, Cache aktiver GPU-Geländekacheln | Kein SSD-/Netzwerk-Streaming in der Demo, keine persistenten Weltänderungen |
| Spielfigur | Eigener 3D-Charakter mit Bewegung, Kamera und Kampfposen | Keine High-Poly-Figur, keine Skeletal Animation, keine Motion-Capture-Pipeline |
| Gegner | Sieben Drohnen, Patrouille/Verfolgung, Treffer und Schaden | Kein Navmesh, keine Wegfindung, keine Gruppen- oder Deckungs-KI |
| Physik | Schwerkraft, vereinfachte Kollisionskörper, Steigungsgrenze | Keine Rigid-Body-Engine, keine Ragdolls, keine Mesh-Collider |
| Grafik | WebGL1, Licht/Nebel, Terrain, Tactical HUD, FPS und Draw-Calls | Noch keine Schatten, PBR, GLB-Skinning, GPU-Instancing dieses Spiels oder fortgeschrittenes LOD |
| Mobile | Touch-Tasten und adaptive Darstellung | GPU-, Browser- und Ergonomietests auf realen Geräten erforderlich |
| Qualität | Reproduzierbare Mission und automatisierte Regeltests | Vollständige visuelle E2E-Tests, GPU-Benchmarks und Playtests fehlen |

## Tests

Im Repository-Hauptverzeichnis:

```bash
node --test studio/game-studio/demos/vanguard/mission-core.test.cjs
node --check studio/game-studio/demos/vanguard/game.js
node --check studio/game-studio/demos/vanguard/mission-core.js
```

Danach manuell Chromium, iPhone/Safari und Android/Chrome prüfen: Start, WASD, Kamera, Sprint, Sprung, Kampf, Relais, Extraktion, Niederlage, Neustart, Touch, GPU-Kontextverlust. FPS, Draw Calls und Speicherbedarf protokollieren. Orientierungsziele: **30 FPS auf konkret festgelegten Mobilgeräten** und **60 FPS auf konkret festgelegten Desktop-Testgeräten**. Das sind **keine bereits gemessenen Ergebnisse**.

**Status:** funktionsorientierter Vertical Slice / Alpha, **kein fertiges AAA-Spiel**. Weder Multiplayer noch echte Motion-Capture-Assets, speicherbare Kampagnen oder eine vollständige AAA-Engine werden behauptet.
