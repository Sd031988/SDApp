# SD Engine (Etappe 1)

Echte 3D-Spiel-Engine im SD Game-Studio, aufgebaut auf **Babylon.js 9.31.3** (Grafik) und **Havok 1.3.14** (Physik).
Beide sind kostenlos (Apache-2.0 / MIT) und werden über cdn.jsdelivr.net mit fester Version geladen.

- `index.html` – Spielseite mit Menü, HUD, Minikarte, Pause, Touch-Steuerung und **Skript-Editor**
- `sd-engine.js` – die Engine und die deutsche SD-API (`sd.gelaende`, `sd.haus`, `sd.gegner`, …)
- `sd-baukasten.js` – Generatoren: Oberflächen (Farbe + Normal-Map, kachelbar), Bäume (Laub, Nadel, Palme, Herbst, Busch, mit Detailstufen), Gebäude (Fenster, Tür, Balkone, Flach-/Satteldach, Dachtreppe, Kollision), Roboter (3 Bauarten, Gelenke, Laufanimation)
- `werkstatt.html` – SD Werkstatt: Objekte mit Reglern erzeugen, live ansehen, als .glb exportieren (Blender, Godot, Unity), SD-Skript-Zeile kopieren
- `sd-assets.js` – eigener Speicher im Browser (IndexedDB) für importierte Modelle, Foto-Häuser und Foto-Materialien; nichts wird hochgeladen
- `sd-foto.js` – Foto entzerren (4 Ecken, Homographie), nahtlos machen, Normal-Map aus Helligkeit
- Werkstatt-Bereiche **📷 Foto-Haus**, **📷 Foto-Material**, **📦 Meine Modelle** (Import .glb, z. B. Mixamo-Figuren oder Handy-Scans); in der Engine: `sd.fotoHaus`, `textur: 'foto:name'`, `sd.modell('datei.glb')`, `sd.figurLaden` + `modell:` bei Spieler/Gegnern (Animationen werden automatisch zugeordnet, unsichtbare Trefferzonen für Körper und Kopf)
- `sd-fahrzeug.js` – Fahrzeug-Generator (Limousine, SUV, Sportwagen, Pickup, Bus, **Motorrad** mit Schräglage und Fahrer, **Motorboot** mit Auftrieb und Kiel, **Propellerflugzeug** mit vereinfachter Flugphysik: Schub, Auftrieb, Querneigung, Absturz) + Fahrphysik (Havok-Karosserie, 4 Strahlen-Räder mit Federung, Dämpfung, Reifenhaftung, Antrieb, Bremse, Handbremse), Ein-/Aussteigen mit F, Fahrkamera, Tacho, Motorgeräusch
- `sd-mensch.js` – Menschen mit echtem Skelett (17 Knochen) und Animationen (Stehen, Gehen, Rennen, Sterben), als .glb exportierbar
- `sd-stadt.js` – Stadt-Generator (Straßennetz, Markierungen, Zebrastreifen, Gehwege, Laternen, Häuserblöcke mit Hochhäusern in der Mitte, Parks), Verkehr (KI-Autos mit Abbiegen und Abstand halten), Passanten (fliehen bei Schüssen)
- `sd-ki.js` – Navigationsraster + A*-Wegfindung, Deckung suchen, Gruppen-Alarm, Flankieren
- `sd-wetter.js` – Tag/Nacht-Wechsel, echte Laternen- und Scheinwerferlichter in der Nacht, Regen (Partikel, nasse Oberflächen, Geräusch), Wasser mit Wellen, Wind in Blättern und Gras (Shader), Gras rund um den Spieler; 3D-Ton (HRTF) in der Engine
- `blender/sd_mixamo_zu_glb.py` – Blender-Helfer: Mixamo-Figur + Animationen (FBX) → eine .glb (getestet mit Blender 5.2)
- `sd-netz.js` – Mehrspieler (bis 8 Spieler, Raum-Code, Server: `/hub/spiel/*` im SD-Hub, Repo agents/computer-agent/computer_agent/spiel_api.py): Positionen, Autos, Treffer, Abschüsse, Wiederbeleben, Punktetafel (Tab); keine Namen, kein Chat, nichts gespeichert
- `sd-szene.js` – gemeinsamer Teil von Editor und Engine: Objektarten, Prüfung (`SDSzene.pruefen`) und Code-Erzeugung (`SDSzene.code`)
- `editor.html` – SD Szenen-Editor: Welten mit der Maus bauen und direkt spielen (Spiel „Eigene Szene“); **Gelände formen** mit Pinsel (Heben, Senken, Glätten, Ebnen), gespeichert als `formen` in `sd.gelaende`
- Schadensmodell für Autos (Beulen, Rauch, Feuer, Explosion, Wrack) und Gegner, die Außentreppen auf Dächer nehmen
- `sd-spiel.js` – Geld, Inventar (Medikits H, Granaten G), Nahkampf (V), Läden (E), Missionen mit Schritten (gehe, fahre, sammle, besiege, warte, eigen), Zeitlimit, Belohnung, Zielstrahl und Kartenmarker, Missionsliste (J), Spielstand im Browser, Krankenhaus statt Spielende
- `sd-grafik.js` – ab Qualität „Mittel“: Himmel mit Lichtstreuung je nach Sonnenstand (Abendrot, Nacht mit Sternen und Mond), ziehende Wolken (bei Regen dicht und grau), Umgebungslicht aus dem Himmel, Nebel passend zum Horizont; bei „Hoch“ zusätzlich Spiegelungen (SSR) und Sonnenstrahlen. `sd.grafik({ wolken, strahlen, spiegelungen })`
- `sd-klang.js` – Musik live erzeugt (`sd.musik('ruhig' | 'spannung' | 'action' | 'auto')`, „auto“ wechselt bei Schüssen zu Action), eigene Ton- und Musikdateien (.mp3/.ogg/.wav/.m4a über 📦 Meine Modelle) mit `sd.musik('datei')` und `sd.klang('datei', { pos })` (3D-Ton); Mischpult mit Kompressor und Hall, neue Töne (Explosion, Münze, Tür, Alarm, Sieg …)
- `sd-veroeffentlichen.js` – Spiel als eigene Webseite veröffentlichen (über „Online stellen“, nur mit Zugangsschlüssel); eigene Modelle/Foto-Häuser werden mitgepackt
- `spiele/stadtjagd.js` – Open-World-Demo „Stadtjagd“ (Stadt, Verkehr, Autos, Tag/Nacht, Regen, Gang)
- `spiele/inselsturm.js` – Beispielspiel „Inselsturm“ (Third-Person-Shooter, Battle-Royale-Modus), komplett als SD-Skript

## Was in Etappe 1 drin ist

| Bereich | Umsetzung |
|---|---|
| Grafik | PBR-Materialien, Himmel mit Farbverlauf, Umgebungslicht, Kaskaden-Schatten, ACES-Tonemapping, Bloom, FXAA, SSAO (Qualität „Hoch“) |
| Welt | Gelände 640 × 640 m mit Rauschen, Wasser, flache Dorfflächen, Wald als Instanzen, Felsen, begehbare Häuser (Tür, Fenster, Dachaufgang) |
| Große Welten | ab 1000 m (bis 2400 m im Editor): Gelände aus 160-m-Kacheln mit 3 Detailstufen, Physik nur in der Nähe von Spieler, Gegnern und beweglichen Objekten |
| Spielgefühl | Kamerawackeln (Schüsse, Treffer, Explosionen, Landungen), Gegner zucken bei Treffern, Schrittgeräusche (auch 3D bei Gegnern), dynamische Auflösung bei niedriger Bildrate |
| Physik | Havok: Spielfigur-Controller (Kollision, Steigungen, Springen), umschießbare Objekte, umfallende Gegner |
| Gameplay | 4 Waffen (Streuung, Rückstoß, Nachladen, Kopftreffer, Zielfernrohr), Beutekisten, Leben und Schutzweste, schrumpfende Zone, Sieg und Niederlage |
| Gegner-KI | Sichtprüfung per Strahl, Verfolgen, seitliches Ausweichen, Trefferchance je nach Entfernung und Bewegung, gehen in die Zone |
| Skript | SD-Skript = JavaScript + SD-API, im Spiel bearbeitbar, Fehler mit Zeilennummer, voller Babylon-Zugriff (`sd.BABYLON`) |

## Ehrliche Grenzen (noch nicht vorhanden)

- Roboter, Bäume und Gebäude sind prozedural erzeugt und kommen nicht an Modelle von 3D-Künstlern heran. Eigene Modelle (.glb mit Animationen, z. B. von Mixamo) lassen sich mit `sd.modell()` laden, sind im Beispiel aber nicht eingebaut.
- Foto-Häuser sind Kisten mit Fotos auf den Wänden: von außen wie im Foto, aber ohne echte Vorsprünge und nicht begehbar. Echte 3D-Gebäude aus Fotos entstehen mit Fotogrammetrie-Apps (Polycam, Luma, Scaniverse, Meshroom) und werden als .glb importiert.
- Importiert werden .glb und .zip mit .gltf + Texturen (z. B. Sketchfab-/Poly-Haven-Downloads; werden beim Import zu .glb umgewandelt), kein .fbx. Eigene Dateien liegen nur im Browser dieses Geräts. Die Quelle/Lizenz wird beim Import abgefragt und im veröffentlichten Spiel angezeigt.
- Mehrspieler: über HTTP etwa 8 Aktualisierungen pro Sekunde (spürbare Verzögerung), Treffer entscheidet der Schütze, ohne Computer-Gegner; Verkehr und Passanten laufen bei jedem Spieler unabhängig. Eigene Szenen gehen im Mehrspieler: Der Gastgeber schickt seine Szene als reine Daten mit, jeder Browser prüft sie und baut daraus den Code (eigene Modelle und Foto-Häuser bleiben dabei weg). Der Server (Render) schläft ohne Nutzung und braucht beim ersten Verbinden bis zu einer Minute.
- Passanten und Verkehr weichen aus, werden aber nicht verletzt.
- Wegfindung arbeitet auf einem 1,5-m-Raster; Gegner nehmen Außentreppen, aber keine Innentreppen.
- Flugzeug und Boot nutzen vereinfachte Physik (kein echter Strömungs- oder Wellenrechner).
- Ein Spiel in der Größe von GTA oder PUBG entsteht damit nicht per Knopfdruck. Die Engine ist das Fundament für die nächsten Etappen.
- Getestet wurde in Chromium mit Software-Grafik (SwiftShader). Wie flüssig es auf einer echten Grafikkarte läuft, muss am Gerät geprüft werden.
