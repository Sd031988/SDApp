# Nordhafen – Schattenoperation (spielbarer SD-Engine-Prototyp)

**Stand:** 2026-11-05 · Eigenständiges SD-Spiel im *SD Game-Studio*; auf dem bestehenden **KI-Bauplan-Paket** in Draft-PR #105 aufgebaut. Keine Änderung an Inselsturm, Stadtjagd, Luftlandung, Pibo oder den Vanguard-Demos.

## So wird das Spiel gestartet

Nach Integration in den freigegebenen Branch: **SD Game-Studio → Nordhafen – Schattenoperation** oder `studio/game-studio/engine/index.html?spiel=nordhafen` öffnen. Im Menü „▶ Spielen“ wählen; „{ } Skript bearbeiten“ ermöglicht das Ändern des kompletten Spiels, z. B. von Gegnerzahlen, Aussehen, Objekten oder Wetter. Die Engine lädt das Spiel aus `spiele/nordhafen.js`.

**Steuerung:** WASD, Maus, Shift, C ducken, Leertaste springen, linke Maustaste feuern, R nachladen, E Kiste, F Fahrzeug, G Granate, H Medikit, J Missionsziele, Esc Pause. Touch und Controller übernimmt die bestehende Engine.

## Spielziel

Vier Missionsabschnitte: Hafen sichern → zum Dorf fahren → Radarstation sichern → zur Evakuierungszone fahren. 820-Meter-Welt, zwölf Gebäude, drei fahrbare Fahrzeuge (zwei Autos und ein Motorrad), zehn KI-Gegner, elf Beutekisten, Gelände, Wald, dekorative Gleise und Container. Missionsziele kommen von `sd.mission()`. Finale Mission löst `sd.sieg()` aus.

## Maus-Editor und Dateien laden

Im Nordhafen-Spielmenü auf **„✏ Nordhafen-Karte bearbeiten“** klicken. Es wird die **editierbare Grundkarte** `szenen/nordhafen.json` geladen. Beim Öffnen nach Zustimmung wird eine bestehende lokale Szene automatisch unter **📂 Laden → Sicherung-...** gesichert. Dann können Häuser, Autos, Wälder, Gegner, Kisten und Ziele mit der Maus verändert, als JSON gespeichert oder als SD-Skript kopiert werden.

**Wichtig:** Die editierbare Grundkarte bildet den Hauptaufbau nach. Die dekorativen Spezialobjekte, die erweiterten Grafikmaterialien und die vollständige Missionslogik sind im separaten Spielskript definiert und werden durch den JSON-Editor nicht verlustfrei zurückübersetzt. Für diese Details das Spielskript bearbeiten.

**Eigene Modell-Dateien:** Werkstatt → 📦 Meine Modelle → `.glb` oder `.zip` mit `.gltf` importieren (rechtmäßige Lizenz erforderlich). Benannte optionale Modelle `nordhafen-funkanlage.glb` und `nordhafen-hafenkran.glb` werden im Nordhafen-Skript bei vorhandenem lokalem Asset automatisch geladen. Ohne diese Dateien läuft das Grundspiel weiter. Andere Modelle lassen sich im SD-Skript mit `await sd.modell('datei.glb', { pos: [x, y, z] })` einsetzen; animierte Figuren mit `await sd.figurLaden('figur.glb')` und `modell`-Option für Spieler/Gegner.

## Grafikqualität und Lizenz

- Bestehende SD Engine: Babylon.js, PBR, Havok-Physik, Schatten, Zeit/Wetter und KI.
- Industrielle Bodentexturen werden auf Desktop/hoher Geräteklasse **optional** von Poly Haven geladen: [asphalt_03](https://polyhaven.com/a/asphalt_03) und [concrete_floor](https://polyhaven.com/a/concrete_floor), Lizenz **CC0**. Wenn ein Download blockiert wird oder fehlschlägt, bleiben farbige PBR-Materialien erhalten.
- Auf Touch-Geräten/kleineren Renderbreiten reduziert das Spiel automatisch Gras, Bäume, Details und externe Texturen.
- Menschliche Spielfiguren nutzen derzeit das bestehende SD-Skelett und sind **nicht mit PUBG-Finalmodellen zu verwechseln**. Für AAA-Anmutung fehlen insbesondere kunstvoll modellierte und animierte, optimierte GLB-Figuren, professionelle PBR-Texturen, aufgezeichnete Sounds und GPU-Profilierung.

## Testen

```bash
node --test studio/game-studio/engine/nordhafen.test.cjs
```

Prüft die Szene gegen `SDSzene.pruefen`, simuliert die SD-API-Aufrufe für Desktop/Mobil, zählt Gegner, Missionen und prüft den optionalen Modellimport. **Kein** Beleg für GPU-Rendering, Havok-Kollision, FPS oder echte Browser-Kompatibilität.

Vor Merge muss ein manueller Browser-Test auf Desktop und iPhone durchgeführt werden: Start, erster Gegnerkontakt, Missionen J, F in SUV einsteigen, R/E/H, Grafikkartenwechsel, Regen, Return zum Menü, Editor öffnen ohne Datenverlust und GLB-Datei aus der Werkstatt importieren. Große Performance-Probleme müssen vorher behoben werden.
