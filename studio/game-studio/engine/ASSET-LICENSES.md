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
