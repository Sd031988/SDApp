# SD Hub Kids · Pibo 3D

Pibo ist ein eigenständiges virtuelles Katzenspiel innerhalb von SD Hub. Alle gezeichneten 3D-Grundformen, Animationen und Töne im Repository sind original programmierte Inhalte. Ein fremdes kommerzielles Haustierspiel ist ausschließlich Inspiration für allgemeine Interaktionstypen, **keine Quelle für geschützte Assets**.

## Implementiert
- **Sechs Räume** (Wohnzimmer, Küche, Bad, Schlafzimmer, Toilette, eigener Garten), Pflegewerte und lokal gespeicherter Spielstand. Der Garten nutzt originale, bewegliche 3D-Objekte: Baum, Teich, Blumen, Windrad, drei Schmetterlinge. Die Schmetterlinge sind antippbar; alle fünf Fänge gibt es einen lokalen Spielstern.
- Pflegeabläufe für Füttern, Kauen, Baden, Schlafen und Toilette in `pibo-care.js`.
- Gesicht und Körper: Blinzeln, Blickrichtung, Augenbrauen, Mund-/Kaubewegung, Atmung, Pfoten, Hinterläufe, Ohrwackeln, Schwanzbewegung, Sprung, Streichelreaktionen. Reproduzierbare Posen in `pibo-face.mjs` und `pibo-motion.mjs`.
- Futter per antippbarem Menü oder per Maus-Drag-and-drop / Touch- bzw. Stift-Ziehen **bis zum Mund**, mit Trefferprüfung, unterschiedlichen Futterreaktionen und Kauanimationen.
- Badezimmer als interaktive Sequenz aus Einseifen, Abspülen und Abtrocknen; Toilettenspülung per eigener Taste; Schlafzimmer mit Lichtschalter und Nachtmodus.
- Zwölf Outfits, Zimmerfarben, zwei Minispiele, tägliches Geschenk und auf Wunsch lokale Mikrofonaufnahme mit Nachsprechen.
- Originale synthetisierte Geräusche plus separat lizenzierte, echte Miau- und Schnurr-Aufnahmen in `pibo-audio.js`. Die externen Aufnahmen benötigen Netzwerk und werden in `Pibo-Sound-Lizenzen.md` zugeordnet. Lokal aufgenommenes Nachsprechen mit amplitudengesteuerter Mundbewegung und automatischer Pausenerkennung.
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
node kids/pibo-voice.test.mjs
node kids/pibo-character.test.mjs
node kids/pibo-interactions.test.mjs
node kids/pibo-garden.test.mjs
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
- Bewegung und Sound sind bewusst original erstellt. Trotz neuer Gesichtdetails, echter CC0-Katzenstimmen und zusätzlichem Garten derzeit **nicht** in der Produktionsqualität eines vollständig modellierten, künstlerisch riggten 3D-Tiers mit professionellen Foley-Aufnahmen.
- Für eine professionelle nächste Iteration: originales glTF-/GLB-Charaktermodell mit zusammenhängender Silhouette, Skelettanimationen, Morph Targets für Gesicht, weich blendbaren Animation-Clips, echtem Licht-/Material-Look und stabilen 30/60-FPS-Mobiltests. Die hochwertigen 3D-Assets dürfen weder Tom noch dessen markenspezifischen Look oder dessen Originalgeräusche kopieren.
- Die vorhandenen Playwright-Tests können sichtbare Interaktionen und Crashs abdecken, aber belegen **keine** subjektive AAA-Animationsqualität oder professionelle Audioabmischung.
- Eine Aufnahme ist optional, die Ausgabe läuft lokal. Audio-Berechtigungen und Lautstärke auf Endgeräten müssen separat geprüft werden.
- CDN-Import von Three.js benötigt eine Internetverbindung. Ein kompletter Offline-Betrieb ist noch nicht vorhanden.
- Für Veröffentlichung als vollständig abgenommen fehlen echte iOS-/Android-Hardwaretests, GPU-Performanceprofiling, Barrierefreiheitsprüfung und rechtliche Prüfung eines möglichen echten Crypto-Token-Konzepts. Ein echter Token wird **nicht** in den Kinderbereich eingebaut.

Zur laufenden Projektplanung: [PROJECT_ROADMAP.md](PROJECT_ROADMAP.md). **Produktionsreife nicht behaupten, bevor die offenen Punkte nachgewiesen sind.**

## Kontinuierliche Qualitätsverbesserung

Die bestehende Pibo-Automatisierung wurde am 01.11.2026 auf einen stündlichen Entwicklungs- und Prüfzyklus geändert. Jeder Durchlauf prüft den Hauptbranch, bestehende Funktionen, Testresultate und eine konkrete verbleibende Qualitätslücke; die Automatik bedeutet **nicht**, dass ununterbrochen Rechenarbeit läuft oder 100 % Fertigstellung garantiert ist. Kein geschütztes Talking-Tom-Modell, keine Originalsounds, kein proprietary code. Priorität: eine **eigenständige Pibo-Premium-Welt** mit hoher Spieltiefe, rechtmäßigen Assets und nachweisbaren Browser-/Touch-Tests.

## Qualitätsdurchlauf 01.11.2026 – Pflege ohne Zeitdruck

- **Repariert:** Das Bad endete bisher nach 20 Sekunden automatisch, auch ohne Abspülen/Abtrocknen. Es bleibt jetzt bis zur letzten Pflegeaktion aktiv.
- **Repariert:** Der Toilettengang endete bisher nach 7,5 Sekunden ohne Spülung. Er wartet nun auf den Spülknopf; danach läuft die Ausstiegsanimation.
- **Regressionen:** Neuer `pibo-care.test.mjs` simuliert mehr als 120 Sekunden in Bad und Toilette, Seife → Dusche → Handtuch, Spülung, Kopf-/Pfoten-Rücksetzung sowie zeitgesteuertes Fressen/Schlafen. Der Pibo-Smoke-Workflow führt ihn aus.
- **Vorabprüfung:** JS-Parsing und simulierte Pflegesequenzen bestanden. Vorheriger Main-Stand `547a39693960`: Pibo-Smoke, Chromium-Browser-Checks und Pages-Deployment erfolgreich. Die neuen CI-Resultate sind noch abzuwarten.
- **Offen:** Echte mobile Touch-/GPU-Tests, Animation-Blendings, Kollisionsprüfung, Audioabmischung, Offline-Betrieb. **Nächster Schritt:** Langzeit-Pflegegesten im echten Playwright-WebGL-Browser testen.
