# SD Game-Studio – Professional Gaming Vision & Technical Roadmap

**Status:** Architekturziel / Entwicklungsstandard (kein bereits implementierter Funktionsumfang)  
**Datum:** 02.11.2026  
**Geltungsbereich:** `studio/game-studio/` und zukünftige Runtime-/Export-Module, nicht `kids/` oder vorhandene Benutzerprojekte.

## 1. Produktvision

Das **SD Game-Studio** wird als Werkzeug für ernsthafte Spielentwicklung konzipiert: Action, Shooter, Racing, Survival, Open World, Simulationen, RPGs und später – bei belastbarer Infrastruktur – kompetitiven Multiplayer. Kinderspiele sind nur eine mögliche Anwendung, **nicht** die technische Obergrenze oder Zielgruppe.

Wir messen uns bezüglich **Workflow, Grafikqualität, Asset-Pipeline, Performance und Stabilität** an professionellen Engines. Das bedeutet **nicht**, vorhandene Profi-Engines zeitnah vollständig nachzubauen oder eine PUBG-ähnliche Produktionsreife zu behaupten.

### Produktregel
Jeder neue Feature-Vorschlag muss entweder (a) eine wiederverwendbare professionelle Kernfähigkeit verbessern, (b) einen nachweisbaren Engpass reduzieren, oder (c) diese Fähigkeiten mit einem reproduzierbaren Test belegen. Isolierte, immer neue Minispiele haben **keinen Vorrang** vor Architektur, Asset-Pipeline und Rendering.

## 2. Belegbarer Ist-Stand / Defizite

Aktueller Main-Code in `studio/game-studio/`:

- Browser/WebGL-Renderer, Geometrieerzeugung, Grundbeleuchtung, Kamera, Gelände, Objekt-Inspektor, Undo/Redo, JSON-Szenenimport/-export.
- Einfacher Avatar mit rudimentärer Bewegung, Sprung und Kollision; wenige einfache Natur- und Primitive-Typen.
- Die Szenenlogik ist vorerst auf **70 Objekte** begrenzt (`LIMIT=70` in `scene-core.js`); die JSON-Szene speichert eine flache `objects`-Liste und ein 17×17-Höhenraster.
- Es gibt im verifizierten Code noch **keine** professionelle Import-/Materialpipeline für rigged glTF/GLB, kein vollständiges Rigidbody-/Character-Physics-System, kein Navigationssystem, keine unabhängige Game-Runtime mit Plugin-System, keine Serverautorität, keine Welt-Streaming-Infrastruktur und keinen nachgewiesenen nativen PC-Export speziell für Game-Studio-Projekte.
- Kleine Kristall-Demo auf einem *separaten* Draft-PR ist eine Mechanikprobe, **kein** Beleg für große Spielszenen.

Keine dieser Grenzen wird dadurch aufgehoben, dass ein Objektlimit bloß hochgesetzt oder „AAA“ auf der Startseite steht.

## 3. Architekturprinzipien

1. **Editor, Runtime, Asset-Pipeline und Spielelogik entkoppeln.** Keine monolithische HTML-/JS-Datei für alles; stabile Schnittstellen und separat testbare Module.
2. **Versionsfähiges Projektformat.** Altes JSON v1 weiterhin laden; Migrationen sind explizit, idempotent, getestet und verursachen keinen Datenverlust. Projekt-Dateien sind nicht ungefragt zu verändern.
3. **Echte 3D-Assets statt nur Low-Poly-Primitives.** glTF 2.0 / GLB als priorisierter Asset-Standard für Meshes, PBR, Skelette und Animationen; Größe, Typ, Ressourcen, URLs, Pfade und Lizenzen validieren.
4. **Leistung vor Objektzahl.** Batching, GPU-Instancing, Frustum-/Occlusion-Culling, Level of Detail, Asset-Streaming, CPU/GPU-Profiler, Ressourcenfreigabe und Frametimes messen. Keine unbegrenzten Draw-Calls.
5. **Saubere Gameplay-Bausteine.** Hierarchische Szene/ECS-Prinzipien, Transformationen, Animation State Machines, Kollision, Physik, Navigation, Input-Map, Ereignisse, Spielziele, UI/HUD und Sound-Mixer.
6. **Multiplayer erst mit Vertrauensmodell.** Authentifizierte Sitzungen, serverautoritatives Gameplay, konsistente Ticks, Lag-Kompensation, Validierung, Replikation und Anti-Cheat-Risikobewertung. Kein direkter Peer-Vertrauensvorschuss.
7. **Cross-Platform realistisch.** Web-Editor und Web-Prototyp sind wertvoll; für große High-Fidelity-PC-Spiele die Integration mit einer etablierten nativen Engine ernsthaft prüfen, statt alles neu zu implementieren.
8. **Kontrollierbarer, sicherer Editor.** Asset-Import ohne Codeausführung, Sandbox für spätere Scripte, keine versteckten Netzwerkzugriffe, keine Benutzerprojekt-Mutationen.
9. **Qualität vor Release.** Tests, Performance-Budgets, reproduzierbare Benchmarks und Geräteprüfungen sind harte Gates; „fertig“ erst nach Nachweis.
10. **Klar getrennte Marken und Zielgruppen.** SD Play / Pibo bleiben eigenständige Spiele; das SD Game-Studio ist die professionelle Entwicklungsumgebung.

## 4. Engine-Entscheidung: bewusst offen, aber mit Bewertungsmaßstab

| Architektur | Vorteil | Hauptnachteil | Entscheidung |
| --- | --- | --- | --- |
| Eigene Browser-3D-Runtime (WebGL heute; WebGPU evaluieren) | Sofort im Studio nutzbar, zugänglich am Handy, volle Produktkontrolle | Eigene Entwicklung von Rendering, Physik, Asset-Pipeline und Tools ist aufwendig | **Beibehalten** für Editor/Web-Prototypen, modularisieren |
| Unreal-Toolchain / möglicher Export-Adapter | Bewährte große Welten, moderne Darstellung, Multiplayer-Infrastruktur | Eigene Pakete, Lizenz-/Packaging-/Versionsfragen, kein trivialer HTML-Export | **Proof of Concept prüfen**, nicht als bereits integriert ausgeben |
| Godot-Toolchain / möglicher Export-Adapter | Offene Engine, glTF-Import, native Runtime, geringere Integrationshürde | High-End-AAA-Funktionalität im Einzelfall sorgfältig prüfen | **Proof of Concept prüfen** |
| Unity-Toolchain / möglicher Export-Adapter | Große Ökosystem- und Multiplattform-Abdeckung | Lizenz-/Editor-/Exportfragen und getrennte Datenmodelle | **Alternativbenchmark prüfen** |

**Entscheidungsregel:** Ein nativer Runtime-Adapter wird nur gewählt, wenn ein tatsächlicher Prototyp eine importierte Studio-Szene einschließlich Materialien, Instanzen, Kamera, Physik und mindestens einer Gameplay-Interaktion fehlerfrei ausführt. Lizenzbedingungen und Updatefähigkeit dokumentieren. **Keine** unrealistischen „One-Click-PUBG“-Versprechen.

Technische Referenzen:
- Unreal: World Partition – https://dev.epicgames.com/documentation/unreal-engine/world-partition-in-unreal-engine
- Unreal: Networking & Dedicated Servers – https://dev.epicgames.com/documentation/unreal-engine/networking-overview-for-unreal-engine
- Godot: 3D Import glTF – https://docs.godotengine.org/en/stable/tutorials/assets_pipeline/importing_3d_scenes/available_formats.html
- Godot: Large-World-Koordinaten – https://docs.godotengine.org/en/stable/tutorials/physics/large_world_coordinates.html
- Unity: Entities Graphics – https://docs.unity.com/en-us/engine/6000.6/manual/packages-list/packages-all/pack-core/com-unity-entities-graphics

## 5. Technische Roadmap – nach Abhängigkeiten

### P0 · Produktionsfähige Grundlage (nächste Umsetzung)

**A. Reproduzierbare Profiling-Suite**
- Instrumentierung für FPS / Median- und p95-Framezeit, Draw-Calls, sichtbare Objekte, Szenenladezeit, JS-Heap (falls verfügbar), GPU-Kontextverlust und Framedrops.
- Szenentypen „Innenraum“, „dichter Wald“, „offene Welt“ als standardisierte reproduzierbare Benchmarks; mindestens Desktop-Browser und emuliertes Mobilprofil.
- Ergebnis als CI-Artefakt, Grenzwerte erst nach echtem Hardware-Baselinewert festlegen.

**B. Versioniertes, hierarchisches Szenenmodell**
- Element-ID, Parent-ID, Position/Rotation/Skalierung, Material-/Asset-Referenzen, Komponenten und stabile Schema-Version.
- Migrationspfad von `version: 1`; Backup-Import/-Export und Undo/Redo unverändert nutzbar.
- Keine ausführbaren Scripte im Projekt-JSON und keine frei auflösbaren externen Pfade.

**C. Asset-Pipeline**
- GLB-Datei auswählen, Magic-Bytes und maximale Größe prüfen, sichere Einleseroutine, Asset-Metadaten (SHA-256, Lizenzangabe), Preview.
- Später validierte PBR-Texturen, Skelett-/Animationsclips und Materialeditor.
- Importfehler lassen den ursprünglichen Projektzustand unangetastet.

**Abnahme P0:** Alle bisherigen Studio- und Game-Studio-Tests grün; alte JSON-Szenen unverändert ladbar; drei reproduzierbare Performance-Baselines; mindestens ein importiertes Original-GLB im Editor sichtbar; Browser ohne Konsolenfehler.

### P1 · Hochwertige Grafik und Simulation

- PBR-Materialien, Licht-/Schattenqualität, Tonemapping, transparente Materialien und Postprocessing mit Qualitätsstufen.
- GPU-Instancing, Culling und LOD; Speicherverbrauch, Draw-Calls und Ladezeiten kontinuierlich messen.
- Physik-Adapter mit starren Körpern, Triggern, realistischer Bewegung und getestetem Character Controller; NavMesh/Pathfinding.
- Riggte Charaktere, State Machines und Animation Blending.

**Abnahme P1:** Große Testszene in mehreren Qualitätsstufen; weder unkontrollierte Draw-Call-Explosion noch Ressourcenleck nach Szenenwechseln. Zielbudgets als *Qualitätsziele*, nicht belegte Leistung: 60 FPS / 1080p auf definierter Mittelklasse-Desktop-Testhardware, 30 FPS in definierter mobiler Referenzszene. Hardware und Szeneninhalte dokumentieren.

### P2 · Große Welten und echte Spiele

- In Zellen aufgeteilte Welten und asynchrones Laden/Entladen außerhalb der Sichtweite.
- Spiel-Framework für Levels, Missionssystem, Inventar, Interaktionen, Waffen-/Fahrzeugmechanik, UI und modulare Sound-Systeme.
- AI-Navigation, Spawn- und Ressourcenmanagement; Headless-Testsimulation.
- Dedizierte Runtime / Export-PoC über technische Vergleichskriterien.

**Abnahme P2:** Ein zusammenhängender, begehbarer Showcase statt vieler isolierter Minispiele; korrektes Streaming unter Bewegung; stabiler Re-Import ohne Datenverlust.

### P3 · Multiplayer und Veröffentlichungs-Pipeline

- Dedizierter serverautoritärer Game-Server, Replikation, Tick-Simulation, Reconnect und Sicherheitstests.
- Lasttests mit zunächst 2/8/16/32 Spielern **als getrennte Meilensteine**; erst nach Messung größere Lobbys.
- Packaging und reproduzierbare Builds für ausgewählte Zielplattformen, Crash-/Telemetry-Konzept mit Datenschutzprüfung und Rollback.
- Nutzerkonten, Moderation und Online-Kommunikation nur mit Datenschutz-/Jugendschutz- und Abuse-Konzept.

**Abnahme P3:** Dokumentierte Netzlatenz, Server-CPU-/RAM-Budgets, faire Client-Replikation, Last- und Exploit-Tests; keine Ankündigung eines „PUBG-Konkurrenten“ ohne belastbaren Vertical Slice.

## 6. Entscheidende Produkt-Demos

1. **3D Urban Shooter Sandbox:** eigene rechtmäßig nutzbare Assets, Animation, Deckung, dynamische Beleuchtung, Ziel-/Treffersystem, lokal (kein Multiplayer zu Beginn).
2. **Open-World Traversal:** große Landschaft, LOD, Terrain-/Szenenstreaming, Fahrzeuge oder laufender Charakter, Performance-Overlay.
3. **Netzwerk-Vertical-Slice:** kleine symmetrische Arena, autoritativer Server und synchronisierter Matchstatus – nur nach P0-P2.

Diese Demos sind **Prüfungen der Engine**, nicht Zweck und technisches Limit des Produkts.

## 7. Definition of Done für jede Entwicklung

- [ ] Wiederverwendbar statt hardcodiert auf ein einzelnes Kinderspiel
- [ ] Architektur-, Datenschutz- und Sicherheitsfolgen beschrieben
- [ ] Rückwärtskompatibilität und Rollback überprüft
- [ ] Node-/Browser-/E2E-Regressionen grün; auf realen Zielgeräten getestet, wenn hardwareabhängig
- [ ] Performance-Messung und Grenzwerte für relevante Änderungen dokumentiert
- [ ] Keine fremden Modelle, Marken, Texturen, Tondateien oder urheberrechtlich geschützte Spiellogik unrechtmäßig übernommen
- [ ] Keine bestehenden Benutzerprojekte oder Spielstände ohne explizite Zustimmung verändert
- [ ] Merge und Deployment erst nach dokumentierter Qualitätsfreigabe

## 8. Sofortige nächste drei Arbeitsaufträge

1. **Profiler + Szenen-Benchmark-Katalog** in einem isolierten PR implementieren und p95-Framezeit/Objektzahlen/Darstellungsprobleme messen.
2. **Asset-Pipeline als sicheres GLB-Import-PoC** mit Versionierung, Begrenzungen, Fallbacks, Tests und Original-Modell bauen.
3. **Szenenarchitektur-Migration** v1 → v2 mit Hierarchie, Komponenten, Schema-Tests und unverändertem Altprojekt-Import vorbereiten.

**Kein Fortschritt** ist, nur die 70-Objekt-Grenze anzuheben oder die Spielwelt grafisch mit noch mehr primitiven Objekten zu füllen. Ziel ist messbar mehr Qualität und Skalierbarkeit.
