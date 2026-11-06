# SD Engine – AAAA-Ziel und messbare Qualitätsstufen

**AAAA ist ein ambitioniertes internes Entwicklungsziel, kein bereits erreichter technischer Standard.** Diese Qualitätsprüfungen sind ein erster, bewusst begrenzter Baustein. Die angegebenen Grenzwerte sind **Projektziele**, keine Messungen der bestehenden Engine.

## Erste technische Abnahmekriterien

1. **Rendering:** GPU/CPU-Profiling, stabile Frametimes (P95), LOD, Occlusion-/Frustum-Culling, Streaming, PBR, Schatten, Licht; Nachweis auf definierten Testgeräten.
2. **Welt:** große, unterteilte Nordhafen-Karte mit Hintergrund-Streaming, begehbaren Gebäuden, verlässlichem Save/Load und editorseitigem Undo/Redo.
3. **Gameplay:** reproduzierbare Fahrzeugphysik, Charakter-Controller, Animationen, Kollision, Navigation und Gegner-KI.
4. **Netzwerk:** autoritativer Server, Replikation, Interpolation, Last-/Latenztests, Anti-Cheat-Strategie.
5. **Produktion:** GLB/glTF-Pipeline, PBR-Texturen, JXL-Evaluation mit Fallbacks, Asset-Validierung, Build-System, Crash-Reports, Sicherheitsprüfung.
6. **Qualität:** automatisierte Unit-, Integrations-, Browser-, GPU- und End-to-End-Tests; Benchmark-Szenen, dokumentierte Hardware und Ergebnisse.

## Messbare Budgetprüfung (vorläufig)

`game-quality-gates.js` bewertet **nur bereits extern gemessene** Werte, erzeugt selbst keine Telemetrie. Zwei konfigurationsfeste Presets:

| Messwert | Desktop 60 | Desktop 120 |
|---|---:|---:|
| Durchschnittliche FPS (Minimum) | 60 | 120 |
| P95 Framezeit (Maximum) | 20 ms | 10 ms |
| Draw Calls (Maximum) | 1500 | 1200 |
| Speicher (Maximum) | 4096 MB | 6144 MB |
| Ladezeit (Maximum) | 15 s | 12 s |

Die Grenzen sind Ausgangshypothesen und müssen mit echten Hardware-/Szenenmessungen kalibriert werden. Ein bestandener Budgetcheck allein **beweist kein AAAA-Niveau**. Fehlende oder ungültige Messwerte werden abgewiesen.

## Priorität

**Zuerst:** reproduzierbarer Nordhafen-Benchmark und echtes Performance-Instrumentieren. **Danach:** Chunk-Streaming, begehbare Gebäude und Fahrzeugsteuerung. **Später:** Multiplayer und Produktionspipeline. Bestehende Claude-Engine, Projekte und Deployment nicht automatisch verändern.
