# SD Hub Kids · Pibo 3D

Pibo ist ein eigenständiges virtuelles Katzenspiel innerhalb von SD Hub. Alle gezeichneten 3D-Grundformen, Animationen und Töne im Repository sind original programmierte Inhalte. Ein fremdes kommerzielles Haustierspiel ist ausschließlich Inspiration für allgemeine Interaktionstypen, **keine Quelle für geschützte Assets**.

## Implementiert
- Fünf Räume (Wohnzimmer, Küche, Bad, Schlafzimmer, Toilette), Pflegewerte und lokal gespeicherter Spielstand.
- Pflegeabläufe für Füttern, Kauen, Baden, Schlafen und Toilette in `pibo-care.js`.
- Gesicht und Körper: Blinzeln, Blickrichtung, Augenbrauen, Mund-/Kaubewegung, Atmung, Pfoten, Hinterläufe, Ohrwackeln, Schwanzbewegung, Sprung, Streichelreaktionen. Reproduzierbare Posen in `pibo-face.mjs` und `pibo-motion.mjs`.
- Futter per antippbarem Menü oder per Maus-Drag-and-drop / Touch- bzw. Stift-Ziehen auf Pibo.
- Zwölf Outfits, Zimmerfarben, zwei Minispiele, tägliches Geschenk und auf Wunsch lokale Mikrofonaufnahme mit Nachsprechen.
- Originale synthetisierte Geräusche in `pibo-audio.js`.
- Sterne als **rein lokale, nicht handelbare Spielpunkte** mit Obergrenze und Tagesgeschenk-Sperre in `pibo-rewards.mjs`. Dies ist **kein Token auf einer Blockchain**, keine Wallet und kein Geldwert.
- Keine Benutzerkonten, Käufe oder Drittanbieterwerbung im Kids-Spiel. Das Mikrofon wird nur nach ausdrücklicher Freigabe verwendet; Aufnahmen werden nicht an einen Server geschickt.

## Tests

```sh
node --check kids/pibo-care.js
node --check kids/pibo-audio.js
node --check kids/pibo-smoke.js
node --check kids/pibo-face.mjs
node --check kids/pibo-motion.mjs
node --check kids/pibo-rewards.mjs
node kids/pibo-face.test.mjs
node kids/pibo-motion.test.mjs
node kids/pibo-rewards.test.mjs
node kids/pibo-smoke-test.mjs
```

Automatisch im GitHub-Workflow `.github/workflows/pibo-smoke.yml`.

Zusätzlich sind Playwright-Browsertests für Desktop- und Mobil-Chromium definiert. Sie testen das echte WebGL-Spiel mit einem lokalen HTTP-Server und geladenem Three.js-Modul. Dafür sind Netzwerk und die Browser-Binaries nötig.

```sh
cd kids
npm install
npx playwright install chromium
npm run test:e2e
```

Der GitHub-Workflow `.github/workflows/kids-browser.yml` startet diese Tests nach Kids-Code-Änderungen. Die Browsertests ersetzen keine Tests auf physischer Android- oder iOS-Hardware.

## Grenzen und offene Abnahme

- Pibo ist eine prozedural aus 3D-Grundformen gebaute Figur; **noch kein professionelles glTF-Modell mit Skelett/Morph Targets**.
- Bewegung und Sound sind bewusst original erstellt und funktional, nicht qualitativ vergleichbar mit professionellen Tier- und Foley-Aufnahmen oder von Animatoren geriggten Figuren.
- Eine Aufnahme ist optional, die Ausgabe läuft lokal. Audio-Berechtigungen und Lautstärke auf Endgeräten müssen separat geprüft werden.
- CDN-Import von Three.js benötigt eine Internetverbindung. Ein kompletter Offline-Betrieb ist noch nicht vorhanden.
- Für Veröffentlichung als vollständig abgenommen fehlen echte iOS-/Android-Hardwaretests, GPU-Performanceprofiling, Barrierefreiheitsprüfung und rechtliche Prüfung eines möglichen echten Crypto-Token-Konzepts. Ein echter Token wird **nicht** in den Kinderbereich eingebaut.

Zur laufenden Projektplanung: [PROJECT_ROADMAP.md](PROJECT_ROADMAP.md). **Produktionsreife nicht behaupten, bevor die offenen Punkte nachgewiesen sind.**
