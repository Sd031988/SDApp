# Vanguard Eclipse – Premium Vertical Slice

**Vanguard Eclipse** ist eine spielbare, eigenständige Actionspiel-Demo innerhalb des SD Game-Studios. Sie wird parallel zur ursprünglichen Vanguard-Demo angeboten, ohne vorhandene Spielstände oder Projekte zu überschreiben.

## Start
- Lokal: `Project_Vanguard_Eclipse_Premium.html` direkt im Browser öffnen (Standalone-Version).
- Im SD Hub: `studio/game-studio/demos/vanguard-eclipse/index.html` öffnen.
- Im Level-Editor: die neue Karte „Vanguard Eclipse · 3D-Actionspiel“.

Das HTML enthält alle zur Demo benötigten Skripte und Styles direkt; es lädt keine externen 3D-Bibliotheken, Nutzerdateien oder Telemetrie. Browser mit WebGL1-Unterstützung sind Voraussetzung.

## Spiel
Astra Voss muss 3 Relais in einer 640×640 Einheiten großen prozeduralen Welt aktivieren und zum Landepad zurückkehren. Sieben Patrouillendrohnen können sie angreifen.

- WASD/Pfeiltasten: bewegen; Shift: sprinten
- Leertaste: springen; J: Energieklinge
- Q: Ionenimpuls (Abklingzeit / Ausdauerverbrauch)
- F: Ausweichmanöver (Abklingzeit / Ausdauerverbrauch)
- E: Relais aktivieren / extrahieren
- Maus/Finger über dem Spielfeld bewegen: Kamera drehen
- Auf Smartphones: Touchsteuerung für alle Funktionen

## Technik
- Prozeduraler Mehrteil-Charakter mit einfachen Gelenkbewegungen, keine importierte Skeletal-Rig-/Motion-Capture-Animation
- WebGL1-Shader für Beleuchtung, Oberflächen, Himmel, Dunst und Emissive-Akzente
- Procedural terrain, 16×16 Chunks (256), etwa 1.536 Kulissenobjekte, aktive 3×3-Zellen-Auswahl
- GPU-Geländekacheln werden beim Zellwechsel wieder freigegeben
- Treffer-, Beacon- und Impuls-Partikel im transparenten 2D-Overlay; synthetische, schaltbare WebAudio-Effekte
- Mobiler Renderingpfad reduziert Terrain-Auflösung, Detailobjekte und maximale interne Auflösung
- Keine Mehrspieler-Unterstützung, keine Persistenz, keine professionellen PBR-Materialien, kein echtes Schattenmapping, keine Rigid-Body-Physik oder Navmesh-KI

## Qualität und Grenzen
Lokale Node-Syntaxprüfungen und Smoke-Simulationen der HTML-Oberfläche mit einer WebGL-Mock-Schnittstelle sind erfolgreich. In dieser Entwicklungsumgebung ist echtes WebGL im Browser administrativ gesperrt; die echte Bildqualität und Performance können dadurch nicht lokal bestätigt werden. Deshalb gehört ein Chromium-Test mit WebGL-Software-Renderer in den GitHub-Actions-Workflow. Dieser Test muss erfolgreich sein, bevor die Fassung als verifiziert gilt.

**Keine AAA-Behauptung:** Dies ist ein technisch und visuell erweiterter Vertical Slice, aber noch keine vollwertige AAA-Spielproduktion. Für das nächste Qualitätsniveau müssen authentische Character-Meshes/GLB, Skeletal Animation, echte Schatten/PBR, Navmesh-KI, Physik, Streaming und nachgewiesene GPU-Performance folgen.
