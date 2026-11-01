# SD BlockWorld – 3D-Sandbox für SD Hub Kids

**Spiel öffnen:** https://thesdhub.com/kids/blockworld/

SD BlockWorld ist ein komplett eigenständiges, spielbares Browser-Sandboxspiel im Stil eines bunten 3D-Blockwelt-Abenteuers. Es gehört zum SD Hub Kids-Bereich und ist **kein Roblox-Produkt, keine Roblox-Kopie und keine vollständige Roblox-Plattform**.

## Spielinhalt

- Begehbares 3D-Dorf mit Häusern, Bäumen, NPC, Schildern und drehbarer Kamera.
- Eigene Spielfigur mit vier Outfitfarben und lokalem Spielernamen.
- 12 täglich neu erscheinende Kristalle. 5 Sterne pro eingesammeltem Kristall.
- Parkour mit 6 nacheinander erreichbaren schwebenden Plattformen und 30 Sternen bei Abschluss.
- Kreativmodus: 6 Blockfarben, 4 Bauhöhen, Boden-/Block-Platzierung durch Klick oder Tippen, Bau- und Löschwerkzeuge, maximal 350 eigene Blöcke.
- Bau-Meilensteine: bei jeweils 5 platzierten Blöcken 15 Sterne, höchstens vier Meilensteine pro lokalem Spielstand.
- Sicheres Exportieren und Importieren eigener Bauwerke als lokale JSON-Dateien (ausschließlich validierte Blockdaten, keine Ausführung fremden Codes).
- Lokaler Spielstand inklusive Blockwelt, Kristallen, Spielfigur, Outfit, Namen und Sternen.
- Mobilbedienung mit Bildschirm-Pfeiltasten und Springtaste, Desktop mit WASD/Pfeilen, Leertaste, B/E/R und Maus-Kamera.
- Keine Anmeldung, kein Chat, keine In-App-Käufe, keine Social-Features und keine Übertragung privater Daten.

**Wichtig:** Die Sterne sind **nicht handelbare lokale Spielpunkte**, keine Blockchain-Token, kein Echtgeld und keine tatsächlichen digitalen Vermögenswerte. Manipulation des Browser-Speichers ist möglich; für virtuelle, nicht-wirtschaftliche Punkte ist das akzeptabel.

## Steuerung

| Funktion | Computer | Handy / Tablet |
|---|---|---|
| Bewegen | WASD / Pfeiltasten | Pfeile unten links |
| Springen | Leertaste | Springen unten rechts |
| Kamera | Auf dem 3D-Bild ziehen | Auf dem 3D-Bild wischen |
| Baumodus | B / Schaltfläche | Schaltfläche |
| Block setzen | E / Boden antippen | Boden antippen / Setzen |
| Block entfernen | R / Löschmodus | Löschmodus, dann Block antippen |
| Teleport | Zielschaltflächen | Zielschaltflächen |

## Architektur und Tests

- `index.html`: Spieloberfläche, HUD, mobile Steuerung, Bauwerkzeuge, Zugänglichkeit.
- `game.mjs`: Three.js-Rendering, Charakter, Deko, Spielschleife, Steuerung, Interaktionen.
- `core.mjs`: reine Spielregeln für Speicherbereinigung, Blockplatzierung, Belohnungen, Kollisionen, Kristalle, Parkour.
- `core.test.mjs`: Node.js-Tests für Gameplay- und Speicherregeln.
- `../e2e/blockworld.spec.mjs`: echte Chromium-WebGL-Browsertests (Desktop und mobiles Geräteprofil).
- `../../.github/workflows/pibo-smoke.yml` und `../../.github/workflows/kids-browser.yml`: GitHub Actions.

```bash
node --check kids/blockworld/core.mjs
node --check kids/blockworld/game.mjs
node kids/blockworld/core.test.mjs
cd kids && npm install && npx playwright install chromium && npm run test:e2e
```

Die Anwendung ist auf GitHub Pages statisch hostbar. Zum Laden der Three.js-3D-Bibliothek wird derzeit eine Internetverbindung zum jsDelivr-CDN benötigt.

## Nicht enthalten (separate große Entwicklungsprojekte)

Roblox-artige globale Multiplayer-Server, Benutzerkonten, eigener 3D-Asset-Upload, Moderation, Echtgeldwährung, Avatar-Marktplatz, Scripting durch Dritte oder ein öffentlicher Spiel-Hosting-Katalog sind **nicht** in diesem Einzelspieler-Release enthalten. Solche Funktionen benötigen einen eigenen Server, Datenschutz-/Jugendschutzkonzept, Abuse-Moderation und Sicherheitsprüfungen; GitHub Pages allein stellt sie nicht bereit.

Erweiterungen sollten nur nach belastbaren Sicherheits- und Kinderschutzprüfungen erfolgen. Dieses Release ist eine funktionsfähige **Einzelspieler-3D-Blockwelt**, keine Behauptung einer vollständigen Roblox-Plattform.
