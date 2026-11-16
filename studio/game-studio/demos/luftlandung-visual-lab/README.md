# Luftlandung · Visual Lab 01 (eigenständiger 3D-Prototyp)

Ein **separater, optionaler** spielbarer Grafikversuch als Antwort auf die Referenzszene mit roter Spielfigur, Tropeninsel, Flugzeug und Fallschirmen. Er verändert **weder** die bestehende `studio/game-studio/engine/` **noch** bestehende Nutzerprojekte oder Speicherstände.

## Start

`index.html` über einen HTTP-Server öffnen. Babylon.js ist auf Version 9.31.3 gepinnt und benötigt beim ersten Start eine Verbindung zu jsDelivr. Die App meldet einen fehlgeschlagenen CDN-Import statt einen leeren Bildschirm anzuzeigen.

- Desktop: WASD/Pfeiltasten laufen, Shift sprinten, Maus ziehen dreht die Kamera, Mausklick oder Leertaste schießt.
- Touch: D-Pad und FEUER; den Finger auf dem Bild bewegen, um die Kamera zu drehen.
- Ziel: Fünf Figuren treffen, bevor die Energie auf null fällt.

## Tatsächlich implementiert

- Eigenes 3D-Gelände mit Höhenfunktion, Vertex-Farben und normals; mehr als 15.000 Vertexpositionen, Grasbüschel als Babylon-Thin-Instances
- Prozedurale Palmen, Felsen, Wolken, Himmel-Shader, Transportflugzeug und Fallschirmspringer
- Third-Person-Kamera, Figur mit roter Jacke, Animation der Beine, bewegliche Gegner, Schießen, Trefferanzeige, Lebensleiste, mobile Steuerung
- Sonnenlicht, PBR-Materialien, Schatten, optional FXAA/Bloom, drosselbare Auflösung auf Touchgeräten

## Grenzen

**Kein fotorealistisches Bild, keine fertige Battle-Royale-Engine und kein Ersatz für bestehende Spiele.** Figuren/Palmen/Flugzeug sind geometrische Platzhalter. Für die Qualität des Inspirationsbilds fehlen hochwertige lizenzierte und animierte GLB-Assets, Texturen, Vegetations-LOD, Charakter- und Waffenanimationen, eine entsprechende Art-Direction und echte GPU-Benchmarks. Die Szene dient dem direkten visuellen Vergleich und der Erprobung von Darstellungs- und Steuerungsgrundlagen.

## Qualitätssicherung

`node --check game.js` und `node --test smoke.test.cjs` lokal ausführen. Zusätzlich auf echter WebGL-Hardware Desktop/Chrome, iPhone/Safari, Android/Chrome testen. Die Tests prüfen **nicht** automatisch die reale Qualität einer GPU-Ausgabe. Kein automatischer Merge/Deploy ohne Browser-QA und Rücksprache mit laufenden parallelen Arbeiten.
