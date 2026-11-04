# SD Game-Studio — Grafik- und AAA-Workflow-Roadmap

Stand: 04.11.2026 · Forschungsvorlage, **kein Implementierungsnachweis**.

## Was PUBG und Fortnite tatsächlich verwenden
- **Fortnite**: Epic dokumentiert für Battle Royale ab Kapitel 4 die Unreal Engine 5.1 mit Nanite (virtualisierte detailreiche Geometrie), Lumen (dynamische indirekte Beleuchtung/Reflexionen), Virtual Shadow Maps und Temporal Super Resolution. Offizielle Erklärung: https://www.fortnite.com/news/drop-into-the-next-generation-of-fortnite-battle-royale-powered-by-unreal-engine-5-1?lang=de
- **PUBG**: Laut KRAFTON-Roadmap 2026 ist die geplante Einführung von Unreal Engine 5 eine breitere Entwicklung, nicht nur ein Engine-Port. Nicht behaupten, dass der Live-Titel bereits vollständig auf UE5 umgestellt sei. https://www.pubg.com/de/news/9855
- Studioübergreifend wichtig: professionelle Assets, UV-Mapping, Materialbibliotheken, Licht-/Schattenmodell, Animation, Weltenstreaming, LOD, Renderprofiling und Test auf Zielhardware.

## Bestehender überprüfter Stand im Repo
- SD Game-Studio: selbstgeschriebener WebGL1-Renderer, GLB-Vorschau und einfacher Charakter, Editor, prozedurales Terrain.
- World v3: 640 × 640 Einheiten, 256 Zellen, CPU-Zellenauswahl; separat getestetes dateibasiertes Streaming.
- `demos/vanguard-last-zone/`: einfache Solo-Battle-Royale-Spielmechanik, Häuser, Fahrzeuge, KI-Gegner.
- `demos/frontier-graphics-lab/`: unabhängiger, selbstständiger visueller Vergleich mit prozeduralen Shader-Materialien, wechselbarer Lichtstimmung, stilisiert vs. natürlicher und einer fahrbaren Szene. **Kein echtes Nanite, Lumen oder physikalisch basierter PBR-Renderer**.

## Prioritäten (nicht alles gleichzeitig als „fertig“ melden)
1. **Asset-Pipeline (höchste Priorität)**: glTF/GLB Import mit korrekten UVs, Tangenten/Normalen, Metallic-Roughness-PBR-Materialien, Texturen, Animation-Clips und verlässlichem Mesh-Transform. Ein geeignetes, offen lizenziertes Referenzmodell über PC/Mobil testen. Lizenz-/Attributionsnachweise für Drittassets.
2. **Beleuchtung und Materialqualität**: lineares Rendering, Filmic-Tonemapping, sRGB-Farbmanagement, HDR-/IBL-Beleuchtung, realistische Rauigkeit, harte und weiche Schatten, bessere Innenraumbeleuchtung; nachvollziehbare Shader-Tests statt nur „bessere Farben“.
3. **Charakter-Pipeline**: skinnte Skelettmodelle, Animation-Mixing/Blend Trees für Idle/Walk/Run/Crouch, Foot IK, Übergänge und Kollisionen. Zunächst eine gut animierte Originalfigur, danach mehrere.
4. **Große Welten**: Frustum-/Occlusion-Culling, dynamische LODs, GPU Instancing und View-Distance-Budgets; Gameplay-Kollision/Physik über Terrain, Navmesh für Gegner, Fahrzeuge mit Fahrwerk. Ressourcen beim Zellwechsel wieder freigeben.
5. **Professionelle Game-Engine-Interoperabilität**: vorhandenen Godot-Export ausbauen. Für echte AAA-Grafik alternativ Unreal-Engine-Projekt-Export oder Asset-/Szenenaustausch prüfen, statt Unreal-Funktionen als eigene WebGL-Engine auszugeben.
6. **Asset-Kompression und JXL-Unterricht**: JPEG XL für Quell- und Offline-Asset-Archive mit Browser-Fallbacks; GPU-Texturen je Plattform über passende komprimierte Formate (z.B. KTX2/Basis Universal), nicht behaupten, JXL sei direkt GPU-komprimierbar. In der Academy Aufbau, Konvertierung, Kompatibilität und Fallbacks vermitteln.
7. **QA und Spielgefühl**: feste Testszene mit Haus-Interieur, Figur, Fahrzeug, Wald und Wasser. Automatisierte visuelle Regression auf Referenzscreenshots, GPU-Draw-Call-/Memory-/FPS-Aufzeichnung und manuelles Spielen auf iPhone und Windows-PC. Zielwerte (nicht aktuell garantiert): stabile 30 FPS auf festgelegtem Mobilreferenzgerät und 60 FPS auf definiertem Desktop.

## Abnahmekriterien
- „Abgeschlossen“ nur nach Codeprüfung + End-to-End-Szenentest + gemessener Performance + visueller Abnahme; Unterschiede zwischen Mock-up, Live-Spiel und Rendering-Demo offen kennzeichnen.
- Keine Assets/Markenzeichen aus PUBG oder Fortnite kopieren; eigene Figuren, Fahrzeuge und Karte.
- Alle Änderungen modular im `studio/game-studio/`-Bereich; bestehende Nutzerprojekte/Deutschlernen nicht verändern.
