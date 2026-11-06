# Nordhafen Lab – Asset licenses

## BoomBox.glb (Khronos glTF sample)
- Runtime URL: https://assets.babylonjs.com/meshes/BoomBox.glb
- Original project: https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/BoomBox
- Original author/credit: Microsoft, 2017 (Khronos glTF sample assets).
- License: CC0-1.0 (Creative Commons Zero 1.0 Universal).
- License evidence: https://github.com/KhronosGroup/glTF-Sample-Assets/blob/main/REUSE.toml (Models/BoomBox/*), https://github.com/KhronosGroup/glTF-Sample-Assets/blob/main/Models/Models.md
- Use: optional runtime-only loading in the isolated Nordhafen benchmark; illustrative building proxy, not a building model or an SD Engine production asset.
- Hosting note: the Babylon-hosted file has not been byte-for-byte verified against the upstream Khronos release; validate before production use.

No asset is bundled or redistributed in this PR.

## Babylon.js studio.env (IBL environment)
- Runtime URL: https://assets.babylonjs.com/environments/studio.env
- Source project: https://github.com/BabylonJS/Assets/tree/master/environments
- License: Creative Commons Attribution 4.0 International (CC-BY-4.0), per Babylon.js Asset Libraries guidance for Studio IBL.
- Source/licensing discussion: https://forum.babylonjs.com/t/sandbox-studio-environment-texture-file/36190
- Usage: opt-in PBR lighting in the Nordhafen benchmark lab; no local redistribution.
- Attribution: Babylon.js Assets contributors / Studio Softbox environment. Verify precise author attribution before production redistribution.

## Device test 2026-11-06: GLB disabled
- The previously listed Babylon-hosted BoomBox.glb runtime URL returned HTTP 404 in the user's iPhone Safari test.
- No replacement HTTP 200 URL has been verified. The Nordhafen lab therefore makes **no GLB request** and displays a visible disabled status.
- Existing source/licensing notes are historical provenance, not evidence that a runtime asset is available.

## Spielfigur: Rogue (Quaternius „RPG Characters“)

- Datei: `assets/nordhafen-player-rogue.glb` (1,65 MB)
- Quelle: Quaternius – RPG Characters Pack, https://quaternius.com/packs/rpgcharacters.html
- Lizenz: **CC0 1.0 Universal (Public Domain Dedication)** – laut `License.txt` im Original-Paket, https://creativecommons.org/publicdomain/zero/1.0/
- Bezug: vom Nutzer heruntergeladen und am 06.11.2026 übergeben; unverändert aus `glTF/Rogue.gltf` mit gltf-pipeline in GLB umgewandelt (eingebettete Texturen).
- Inhalt geprüft: 1 Skelett, Animationen u. a. `Idle`, `Walk`, `Run`, `Roll`, `Death`, `Punch`.
- Hinweis: Modellraum-Höhe ca. 3,8 Einheiten → beim Einbau auf 1,8 m normalisieren.

## Weitere Figuren (Quaternius „RPG Characters“) – Gegner/Passanten

- Dateien: `assets/nordhafen-char-warrior.glb`, `-ranger.glb`, `-wizard.glb`, `-cleric.glb`, `-monk.glb` (je 1,7–2,1 MB)
- Quelle/Lizenz: wie Rogue – Quaternius RPG Characters Pack, **CC0 1.0** laut `License.txt` im vom Nutzer übergebenen Original-Paket.
- Unverändert aus `glTF/<Name>.gltf` mit gltf-pipeline in GLB umgewandelt (eingebettete Texturen).
- Jede Datei: 1 Skelett, Animationen u. a. `Idle`, `Walk`, `Run`, `Death`, `RecieveHit`, `Punch`; Modellraum-Höhe ≈ 3,8 → beim Einbau auf ca. 1,8 m normalisieren.

## Fahrzeuge (Quaternius „Cars“)

- Dateien: `assets/nordhafen-car-cop.glb`, `-taxi.glb`, `-suv.glb`, `-sportscar.glb`, `-sportscar2.glb`, `-normalcar1.glb`, `-normalcar2.glb` (je 165–182 KB)
- Quelle: Quaternius – Cars Pack, https://quaternius.com
- Lizenz: **CC0 1.0 Universal (Public Domain Dedication)** laut `License.txt` im vom Nutzer am 07.11.2026 übergebenen Original-Paket.
- Unverändert aus `OBJ/<Name>.obj` + `.mtl` mit obj2gltf in GLB umgewandelt.
- Aufbau je Auto: Karosserie + `BackWheels` + `FrontLeftWheel` + `FrontRightWheel` als eigene Knoten (Vorderräder einzeln lenkbar). Maße ca. 1,8 m × 1,2–1,3 m × 3,7–4,2 m (Meter-Maßstab).

## Panzer (Quaternius „Tanks“)

- Dateien: `assets/nordhafen-tank.glb`, `-tank2.glb`, `-tank3.glb`, `-tank4.glb` (266–506 KB)
- Quelle: Quaternius – Tanks Pack, https://quaternius.com
- Lizenz: **CC0 1.0 Universal (Public Domain Dedication)** laut `License.txt` im vom Nutzer am 07.11.2026 übergebenen Original-Paket.
- Unverändert aus `OBJ/<Name>.obj` + `.mtl` mit obj2gltf in GLB umgewandelt.
- Aufbau: `Tank_body`, `Tank_Turret`, `Tank_Gun`, `TrackMesh.L`, `TrackMesh.R` als eigene Knoten (Turm/Rohr drehbar).
- Größe im Modell ca. 15–18 × 5–7,5 × 10 Einheiten → beim Einbau auf ca. 8–9 m Länge skalieren (Faktor ≈ 0,5).

## Züge und Gleise (Quaternius „Trains“)

- Dateien: `assets/nordhafen-train-*.glb` (14 Dateien, zusammen ca. 3,1 MB): Güterzug (Lok, Wagen, Container, Kohle), Hochgeschwindigkeitszug (Triebkopf, Wagen), Dampflok (Lok, Tender, Personen-/Güterwagen), Gleis gerade (18 m) und Kurve.
- Quelle: Quaternius – Trains Pack, https://quaternius.com
- Lizenz: **CC0 1.0 Universal (Public Domain Dedication)** laut `License.txt` im vom Nutzer am 07.11.2026 übergebenen Original-Paket.
- Unverändert aus `OBJ/<Name>.obj` + `.mtl` mit obj2gltf in GLB umgewandelt. Meter-Maßstab (Wagen ca. 8–12 m lang, ca. 2 m breit).

## Modularer Baukasten (Quaternius, Burg-/Dungeon-Kit) – Innenräume

- Dateien: `assets/nordhafen-kit-*.glb` (19 Teile, zusammen ca. 1,9 MB): wall, wall-half, wall-hole, window-open, window-open-double, doors-roundarch, floor-standard, floor-squares, floor-standard-half, stairs, stairs-2, column-square, trapdoor, rail-straight, crate, barrel, bookcase-full, torch, chest-gold.
- Quelle: Quaternius (Modular-Kit, 92 Teile im Original), https://quaternius.com
- Lizenz: **CC0 1.0 Universal (Public Domain Dedication)** laut `License.txt` im vom Nutzer am 07.11.2026 übergebenen Original-Paket.
- Auswahl unverändert aus `OBJ/<Name>.obj` + `.mtl` mit obj2gltf in GLB umgewandelt.
- Raster 2 m (Wand 2 × 2 m, Boden 2 × 2 m, Treppe ca. 2 m lang / 0,9 m hoch, Tür 2,3 × 3 m).
- Hinweis aus `How-To-Use.txt`: Bei 90°-Ecken die neue Wand zusätzlich um 180° drehen, sonst überlappen die Kanten.

## Tiere (Quaternius „Animals“)

- Dateien: `assets/nordhafen-animal-husky.glb`, `-shibainu.glb`, `-wolf.glb`, `-horse.glb`, `-deer.glb` (je 1,7–2,2 MB); Auswahl aus 12 Tieren im Original.
- Quelle: Quaternius – Animals Pack, https://quaternius.com
- Lizenz: **CC0 1.0 Universal (Public Domain Dedication)** laut `License.txt` im vom Nutzer am 07.11.2026 übergebenen Original-Paket.
- Unverändert aus `glTF/<Name>.gltf` mit gltf-pipeline in GLB umgewandelt (eingebettete Texturen).
- Je Tier 1 Skelett, Animationen u. a. `Idle`, `Walk`, `Gallop`, `Attack`, `Death`, `Eating`, `Idle_HitReact1`.

## Moderner Baukasten (Quaternius, Sci-Fi-Modular-Kit) – bevorzugt für Stadt-Innenräume

- Dateien: `assets/nordhafen-modern-*.glb` (24 Teile, zusammen ca. 1,5 MB): Wände (wall-1, wall-2, wall-empty), Fensterwände (window-wall-sidea, longwindow-wall-sidea, threewindows-wall-sidea), Türwände (doorsingle-/doordouble-wall-sidea), Türen (door-single, door-double), Böden (floortile-basic, -side, -corner), Dach (rooftile-empty, rooftile-vents), staircase, column-slim, Requisiten (props-crate, props-cratelong, props-containerfull, props-computer, props-shelf, props-chest), pipes.
- Quelle: Quaternius (Modular-Kit, 91 Teile im Original), https://quaternius.com
- Lizenz: **CC0 1.0 Universal (Public Domain Dedication)** laut `License.txt` im vom Nutzer am 07.11.2026 übergebenen Original-Paket.
- Auswahl unverändert aus `OBJ/<Name>.obj` + `.mtl` mit obj2gltf in GLB umgewandelt.
- Maße: Wandelement 4 m breit × 4,4 m hoch; Boden 2 × 2 m; Treppe ca. 3,8 × 1,45 m hoch × 3,1 m.

## Möbel (Quaternius „Furniture“)

- Dateien: `assets/nordhafen-furn-*.glb` (25 Teile, zusammen ca. 0,5 MB): Betten, Sofas, Stuhl, Hocker, Tische, Regal, Kommode, Nachttisch, Küche (Kühlschrank, Herd, Spüle, Schrank), Bad (Toilette, Waschbecken, Dusche), Teppich, Zimmerpflanze, Decken- und Stehlampe, Mülleimer, Tür, großes Fenster.
- Quelle: Quaternius – Furniture Pack (123 Teile im Original), https://quaternius.com
- Lizenz: **CC0 1.0 Universal (Public Domain Dedication)** laut `License.txt` im vom Nutzer am 07.11.2026 übergebenen Original-Paket.
- Auswahl unverändert aus `OBJ/<Name>.obj` + `.mtl` mit obj2gltf in GLB umgewandelt.
- Maßstab ca. 2× zu groß (Bett 3,9 m lang, Tür 4,2 m hoch) → beim Einbau mit Faktor ≈ 0,5 skalieren.

## Waffen und Beute (Quaternius „Survival“)

- Dateien: `assets/nordhafen-loot-*.glb` (21 Teile, zusammen ca. 0,75 MB): Waffen (pistol-1, pistol-2, revolver-1, shotgun-1, shotgun-2, shotgun-sawedoff, flaregun, axe, knife) und Beute (backpack, bandages, firstaidkit, firstaidkit-hard, gascan, radio, battery-big, can-closed, propanetank, compass-closed, phone, waterbottle-1).
- Quelle: Quaternius – Survival Pack (53 Teile im Original), https://quaternius.com
- Lizenz: **CC0 1.0 Universal (Public Domain Dedication)** laut `License.txt` im vom Nutzer am 07.11.2026 übergebenen Original-Paket.
- Auswahl unverändert aus `OBJ/<Name>.obj` + `.mtl` mit obj2gltf in GLB umgewandelt.
- Maßstab ca. 6× zu groß (Pistole 1,8 m, Schrotflinte 5,2 m) → Waffen Faktor ≈ 0,15–0,2, Beute als Bodenobjekt ≈ 0,2–0,3.
- Hinweis: Das Paket enthält kein Sturmgewehr; Gewehr-Rolle vorerst mit shotgun-2/shotgun-1 besetzen oder Waffe ohne sichtbares Modell.
