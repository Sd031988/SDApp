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


## Verbindlicher Qualitätsvergleich mit dem Original

Der laufend zu aktualisierende, **quellenbasierte Vergleichskatalog** befindet
sich in [pibo-benchmark.json](pibo-benchmark.json). Seine 26 unabhängigen
Kriterien decken Grafik, Animationen, Pflege, natürliche Sounds, direkte
Berührungsreaktionen, Räume, Minispiele, zusätzliche Spielwelten, Offline-Betrieb,
Datenschutz und reale Endgerätetests ab.

Referenzen sind das offizielle **My Talking Tom 2**-Produktprofil, der
Google-Play-Eintrag sowie 2026 veröffentlichte Herstellerinformationen zu
Badezimmer-Minispielen, frei begehbarem Garten und neuen Abenteuern. Bei
jedem weiteren Pibo-Durchlauf gilt:

1. Erneut aktuelle **Originalfunktionen** prüfen und Änderungen vermerken.
2. Pibo im Browser und im Code dagegen **pro Merkmal** vergleichen.
3. Die größte realistische Qualitätslücke konkret verbessern.
4. Regressionstests und CI für die vorhandenen Funktionen ausführen.
5. Änderungen erst mit Code- und Testbeleg im Vergleichskatalog aktualisieren.
6. Fehlende Profi-Assets, Animationen, Sounds, iOS/Android-Tests und sonstige
   Einschränkungen **nicht** als fertig bewerten.

Automatisiert validiert `node kids/pibo-benchmark.test.mjs` die Nachweise.
Der Vergleich orientiert sich an der **Spielqualität und allgemeinen
Mechaniken**, niemals an einer illegalen 1:1-Kopie der markenrechtlich
und urheberrechtlich geschützten Figur, Originalgeräusche oder Grafikdateien.

**Stand 1. November 2026:** Das professionelle Skelett-3D-Modell, echte
freie 3D-Erkundung, eigenständige Begleittiere, Reisen und mehrere
Minispiele fehlen noch oder existieren erst in Basisform. Das ist eine
konkrete offene Aufgabenliste, **keine** Fertigstellungsbestätigung.


## Qualitätsdurchlauf 01.11.2026 – direktes 3D-Baden mit Werkzeugen

- **Neue echte Szenenobjekte:** Eine selbst erzeugte blaue 3D-Dusche erscheint nach mindestens drei Seifenbewegungen; nach dem Abspülen erscheint ein rosa 3D-Handtuch. Beide sind Geometrie in der Three.js-Szene, nicht nur Schaltflächen oder Text. Quelle: `pibo-care.js`.
- **Direkte Maus-/Fingersteuerung:** Die Werkzeuge werden mit einem Raycaster auf dem bewegten 3D-Objekt getroffen, beim Ziehen auf einer Szenenebene bewegt und lösen Abspülen bzw. Abtrocknen erst bei einer Kollision des Zeigers mit Pibos tatsächlichem 3D-Körper aus. Eine aus der 3D-Welt projizierte Beschriftung zeigt, welches Werkzeug gezogen werden kann. Quelle: `index.html`.
- **Rückwärtskompatibilität:** Die bisherigen Knöpfe für Einseifen, Abspülen und Abtrocknen bleiben nutzbar; bestehende Spielstände, Räume und andere SD-Hub-Projekte wurden nicht verändert. Die Werkzeuge werden nach der Pflege samt Geometrie/Material entsorgt.
- **Tests dieser Ausführung:** JS-Syntax des Pflegecontrollers, Inline-Moduls und der neuen Tests geprüft. Der vollständige Pflege-Unit-Test mit simulierten Three.js-Objekten bestand einschließlich Werkzeug-Sichtbarkeit, Pointer-Koordinaten, Pflege-Reihenfolge und Aufräumen. Der Pibo-Headless-Smoke-Test bestand mit **18 geprüften Abläufen und 436 simulierten Animationsframes**, darunter der neue 3D-Werkzeughinweis in beiden Badephasen. Die Benchmark-Struktur wurde auf **26 Kriterien (20 teilweise, 6 fehlen)** geprüft; alle **15 referenzierten Nachweisdateien** sind auf `main` vorhanden. Diese simulierten Tests ersetzen keine WebGL-/Hardwaretests. `pibo-care.test.mjs` und `pibo-smoke.js` enthalten die neuen Regressionen.
- **Browsertest vorbereitet, noch nicht als bestanden bestätigt:** `e2e/pibo.spec.mjs` prüft nun das Ziehen der echten 3D-Dusche und des Handtuchs mit Desktop-Maus und mobilen Chromium-Touch-Events. Ein WebGL-Lauf und die Resultate der GitHub-Push-Workflows konnten in dieser Ausführung nicht unabhängig eingesehen werden. Reale iOS-/Android-Hardwaretests fehlen.
- **Quellenvergleich (01.11.2026):** Die offizielle Produktseite und der am 27.10.2026 aktualisierte Google-Play-Eintrag bestätigen Pflege, Haustiere, Minispiele, Nachsprechen und Welterkundung; die Hersteller-Mitteilungen vom 19.03.2026 und 04.06.2026 beschreiben mehrstufige Badpflege und freie Gartenbewegung. Pibo erfüllt damit **keine** Qualitätsparität: Die neuen Werkzeuge bestehen nur aus primitiven 3D-Körpern, ohne realistische Flüssigkeitsphysik, hochwertige Foley-Geräusche oder animierte Griff-/Handbewegungen.
- **Nächster Schritt:** Den neuen Chromium-Desktop-/Mobil-Touch-Test im CI auswerten, tatsächliche Tool-Treffer und Kameraperspektiven auf echten Geräten messen, danach 3D-Werkzeugmodelle, Wasserpartikel und weiche Bewegungsübergänge ausbauen.

**Status im Vergleichskatalog:** `pibo-benchmark.json` führt das Bad weiterhin nur als `teilweise`; offene Tests und fehlende Produktionsmerkmale sind ausdrücklich dokumentiert.


## Qualitätsdurchlauf 02.11.2026 – sichtbarer 3D-Schaum und bewegte Duschpartikel

- **Umgesetzt:** Zwölf selbst generierte Schaum-Patches sind an Pibos tatsächlicher 3D-Katze befestigt und bewegen sich mit dem Rumpf. Beim Einseifen werden schrittweise mehr Patches sichtbar; beim Abspülen verschwinden sie. Dadurch ist die Reinigung nicht nur eine Änderung eines Pflegewerts.
- **Umgesetzt:** Der bereits ziehbare 3D-Duschkopf besitzt eine eigene Düse und neun wiederverwendete Wassertropfen als echte 3D-Geometrie. Beim Ziehen bewegt sich der Wasserstrahl mit der Dusche; nach 300 ms ohne Bewegung erlischt er. Es wird nicht in jedem Frame neue Geometrie erzeugt.
- **Ressourcenschutz:** Beim Unterbrechen oder Beenden einer Pflegeaktion werden auch die an der Katze befestigten Schaum-Geometrien und Materialien explizit entsorgt. Spielstände, Räume und andere SD-Hub-Bereiche wurden nicht verändert.
- **Tatsächlich geprüft:** pibo-care.js wurde im JavaScript-V8-Parser kompiliert; die vorhandenen Pflege-Unit-Szenarien und neue Regressionen für Schaumaufbau, neun Tropfen, Drag-Aktivierung, Inaktivitätsabschaltung, Abspülen und GPU-Ressourcenbereinigung liefen mit Three.js-Testdoubles erfolgreich. Der bestehende Pibo-Headless-Smoke-Test bestand zusätzlich im V8-Harness mit **18 Checks und 436 simulierten Animationsframes** (Räume, Futter, Bad, Toilette, Schlaf, Spiele, Spielstand). Der Benchmark blieb bewusst bei **26 Kriterien: 20 teilweise, 6 fehlen**.
- **Nicht bestätigt:** Ein echter Node-CI-Lauf, Playwright-Desktop-/Mobil-Chromium, WebGL-Rendering, echte iOS-/Android-GPUs, FPS-Messungen sowie der neue GitHub-Actions-/Pages-Status konnten in diesem Durchlauf nicht unabhängig verifiziert werden. Der GitHub-Connector meldete für den vorangehenden Commit keine kombinierten Statuschecks und keine abrufbaren PR-Workflow-Runs; das ist **kein Beleg** für erfolgreiches CI.
- **Quellenvergleich 02.11.2026:** Die offizielle Herstellerseite und der Google-Play-Eintrag (zuletzt aktualisiert 27.10.2026) beschreiben Pflege, Stimme, Outfits, Offline-Minispiele und Welterkundung; die Herstellerinformation vom 04.06.2026 zeigt freie Gartenbewegung. Pibo besitzt weiterhin keine vergleichbare freie 3D-Erkundung, hochwertige Flüssigkeitssimulation oder professionelles Skelettmodell. Keine geschützten Fremdassets verwendet.
- **Nächster konkreter Schritt:** Desktop- und Mobil-Chromium-WebGL-Test der Duschpartikel sowie Berührungstreffer auswerten und korrigieren; anschließend originalen Rigg-/Animationsübergang und realistische Wasser-/Schaumreaktion auf das Fell.


## Qualitätsdurchlauf 02.11.2026 – Pibo läuft selbst durch seinen 3D-Garten

- **Spielbare Verbesserung:** Im Garten kann das Kind nun auf eine freie Bodenstelle tippen bzw. klicken. Ein Raycast trifft die echte 3D-Bodenebene; der eigenständige `PiboRoam`-Controller führt Pibo mit begrenzter Schrittgeschwindigkeit, sanfter Blickrichtung, alternierenden Vorder-/Hinterpfoten und einer mitlaufenden Kamera zum Ziel. Gartenwechsel setzt die Position zurück; Pflege, Räume, Sterne und Spielstände behalten ihre bisherigen Formate.
- **Eigenständige Hindernisreaktion:** Die Zielposition bleibt innerhalb des Gartens; Baum, Teich, Bank und Windrad haben einfache Abstandszonen. Bei drohender Kollision wird seitlich ausgewichen. Dies ist **keine vollständige Navmesh-Pfadplanung** und noch kein frei begehbares Haus.
- **Neue Nachweise:** `pibo-roam.mjs`, `pibo-roam.test.mjs` (Grenzen, 200 Simulationsframes, 600 Frames Baumkollision, Rücksetzen), Desktop-/Mobil-Chromium-Tap-Test in `e2e/pibo.spec.mjs`, erweiterter Headless-Smoke-Bootstrap und CI-Workflow. Die neuen 3D-Objekte sind selbst erstellt; keine Fremdmodelle, Marken oder Sounds übernommen.
- **Tatsächlich geprüft:** Modul- und Inline-Syntax im V8-Parser, direkter V8-Lauftest für 200 Bewegungsframes und 600 Baum-Frames bestanden. Der vorherige Main-Commit `f6b40ee` hatte nach Abruf über die GitHub-Actions-API am 02.11.2026 erfolgreiche Pibo-Smoke-, Kids-Chromium- und Pages-Läufe. Im **aktuellen** Durchlauf wurden zwei echte Smoke-CI-Fehler gefunden und nachverfolgt: zunächst fehlte `PiboRoam` im Headless-Test-Bootstrap, danach kollidierte ein Modul-Hilfsname `clamp` mit dem Inline-Spielskript. Beide Ursachen wurden im Code korrigiert; das **Ergebnis des neuesten CI-Pushs ist noch abzuwarten**.
- **Bewertung:** 26 Kriterien, **21 teilweise / 5 fehlen**. `freie_erkundung` ist nun *teilweise*, weil begrenztes Tap-to-Walk im Garten existiert. Verbundene frei begehbare Innenräume, Navigation um alle Gegenstände, professionelles Charakter-Rig, Hardware-FPS-Messungen und echte Endgerätetests fehlen.
- **Quellenvergleich (02.11.2026):** Die offiziellen Produktinformationen zu My Talking Tom 2 und die Herstellerankündigung vom 04.06.2026 beschreiben eine größere, direkt begehbare Gartenwelt mit mehreren Spielzonen und Begleittieren. Pibo hat nur eine kleine originale Gartenfläche ohne solche Spieltiefe.
- **Nächster Schritt:** Die neuesten Smoke-/Chromium-/Pages-Resultate abnehmen, eventuelle Touch- und Raycaster-Fehler korrigieren; danach robuste Wegfindung mit Kollisionsradien und nahtlose Animation-Blendings sowie eine zweite Gartenaktivität ergänzen.

## Qualitätsdurchlauf 02.11.2026 – sichere Gartenwege und weicherer Gang

- **Konkrete Spielverbesserung:** `pibo-roam.mjs` berechnet bei Gartentipps nun einen Weg über ein 20-cm-Raster mit A*-Suche und Sichtlinien-Glättung. Dadurch kann Pibo den Teich und andere große Hindernisse **umgehen**, statt nur an einem Hindernis entlang zu schieben und eventuell stecken zu bleiben. Blockierte Randziele werden auf eine begehbare Position verlegt. Beim Wechsel des Zielpunkts wird neu geplant; bestehende Spielstände und Zimmer bleiben unverändert.
- **Sichtbare Bewegung:** Die Fortbewegung besitzt nun eine begrenzte Beschleunigung und Bremsung. Im 3D-Spiel werden die Höhe der Gehbewegung sowie Vorder- und Hinterpfoten-Schritte proportional zur tatsächlichen Laufgeschwindigkeit eingeblendet, statt sofort mit voller Schritthöhe zu starten. Der vorhandene Kamerafolgemodus bleibt erhalten.
- **Gemessen in V8-Simulation (kein WebGL):** Elf Ziele einschließlich eines Umwegs hinter dem Teich, vier Hindernismittelpunkte und Garten-Randecken wurden ohne Eindringen in die Hindernisradien erreicht (94–163 simulierte 60-Hz-Frames pro Weg). Der Teich-Umweg erforderte mindestens zwei Wegpunkte. Neue `pibo-roam.test.mjs`-Regressionen prüfen den Teich, Randziele, Hindernisabstände, Zeitdelta-Begrenzung und Reset.
- **Regressionen:** Der aktuelle Headless-Smoke-Harness lief mit den aktuellen Main-Dateien in einer V8-Testumgebung erfolgreich: **18 Checks, 436 simulierte Frames**, einschließlich Raumwechsel, Futter, Bad, Toilette, Schlaf, Minispielen und lokalem Speichern. Die Inline-Skripte wurden syntaktisch kompiliert. **Node-CI, echte Chromium-/Touch-/WebGL-Tests und Pages-Deployment dieses Pushs sind noch nicht bestätigt.** Die GitHub-Connector-Abfrage zeigt keine Push-Workflow-Runs; fehlende Ergebnisse sind kein Erfolgssignal.
- **Quellenvergleich (02.11.2026):** Offizielle Herstellerangaben vom 04.06.2026 beschreiben eine zusammenhängende Gartenwelt mit unterschiedlichen Zonen; vom 02.07.2026 ein mehrstufiges Abenteuer; vom 22.10.2026 eine zusätzliche Tempelwelt. Pibo besitzt weiterhin nur einen begrenzten eigenen Garten, keine vergleichbare offene Welt oder professionelle Skelettanimation. Keine geschützten Fremdassets verwendet.
- **Benchmark:** Weiterhin **26 Kriterien: 21 teilweise, 5 fehlen**. Der Status `freie_erkundung` bleibt bewusst `teilweise`. Details und Dateinachweise stehen in `pibo-benchmark.json`.
- **Nächster konkreter Schritt:** Aktuelle GitHub-Actions-Resultate abnehmen; im echten Desktop-/Mobil-Chromium-WebGL die Teich-Umgehung und Touch-Eingaben messen und korrigieren, danach Kamera- und Rigg-Blendings verbessern.


## Qualitätsdurchlauf 02.11.2026 – streckengebundene Garten-Ganganimation

- **Umgesetzt:** Pibos Pfoten bewegen sich beim Gartenlauf nun abhängig von der wirklich zurückgelegten Distanz, nicht von der Animationszeit. Vorder- und Hinterpfoten treten diagonal auf und bewegen sich vor und zurück. Körper und Kopf neigen sich leicht gegensinnig in Kurven. Die Schrittintensität klingt nach dem Ankommen ab. Im Stand und nach einer Browserpause gibt es keine künstlichen Schritte.
- **Kollisionskorrektur:** Rasterkoordinaten an den Gartenrändern werden ausdrücklich begrenzt. Ein im V8-Test erkannter Gleitkommaüberlauf (3,8000000000000007 statt 3,8) wurde korrigiert.
- **Regressionen:** Die vollständigen Assertions der Garten-Testdatei bestanden im V8-Harness mit Node-assert-kompatibler Prüflogik, einschließlich acht schwieriger Gartenziele, Hindernisabständen, Schrittpaarkoordination, Pause und reduziertem Bewegungsmodus. Zusätzlich wurden elf Zielpunkte in der V8-Simulation erreicht. Modul- und Inline-Syntax wurden geprüft. Kein Node-/WebGL-/Hardwaretest wird damit behauptet.
- **Unverändert:** Speicherformate, andere Räume, Pflege, Minispiele und andere SD-Hub-Projekte. Originale prozedurale Pibo-Geometrie, keine geschützten Fremdassets.
- **Referenz:** Offizielle Herstellerseite und Herstellerinformation vom 04.06.2026 zum frei begehbaren Garten. Pibo bleibt im Vergleich auf 21 teilweise erfüllten und 5 fehlenden von 26 Kriterien; keine professionelle Qualitätsparität.
- **Offen:** GitHub-Push-CI, Pages, Chromium Desktop/Mobil, echtes WebGL, FPS auf Mobilhardware, professionelle Rig-/IK-Fußkontakte und zusammenhängende Welterkundung. Der GitHub-Connector meldete für den letzten Hauptbranch-Commit keine kombinierten Statuschecks; dies bestätigt keine erfolgreichen Workflows.
- **Nächster Schritt:** Echten WebGL-Desktop-/Mobiltest des Gartenlaufs und CI-Status abnehmen, danach originale Pfoten-IK und weichere Kameraführung entwickeln.

## Qualitätsdurchlauf 02.11.2026 – weichere Gartenkamera

- **Implementiert:** Bildratenunabhängige, zeitbasierte Folgekamera mit synchronisiertem Blickziel und leichter Vorausschau in Laufrichtung. Bei „Bewegung reduzieren“ folgt sie ohne Nachlauf; Zimmerwechsel setzt Kamerafokus zurück.
- **Getestet:** Bestehende Garten-Unit-Assertions einschließlich acht schwieriger Hindernisziele und neue 30/60-FPS-Kamera-Tests, Pausen, Reduced Motion und ungültige Eingaben im V8-Assert-Harness. Modul und HTML-Inline-Modul syntaktisch geprüft. **Kein vollständiger Node-/Chromium-/WebGL-/Hardwaretest**.
- **Bestandsschutz:** Keine Änderung an Spielstandschema, Pflege, Räumen, Minispielen oder anderen SD-Hub-Projekten. Nur originaler Pibo-Code.
- **Vergleich:** Offizielle Herstellerseite, Google Play (App-Update 27.10.2026) und Garten-Ankündigung vom 04.06.2026. Pibo besitzt weiterhin keine gleichwertige verbundene Welt oder professionelles Rigg.
- **Benchmark:** 26 Kriterien: 21 teilweise, 5 fehlen. `freie_erkundung` bleibt `teilweise`.
- **Offen:** GitHub-Push-CI/Pages, Desktop-/Mobil-Chromium, echtes WebGL, FPS auf Mobilhardware, Pfoten-IK und verbundene Hauswelt. Nächster Schritt: Browser-Abnahme und bessere Pfoten-Bodenkontakte.

## Qualitätsdurchlauf 02.11.2026 – sichtbare Pibo-Gesichts- und Pfotendetails

- **Tatsächlich implementiert:** Die vorhandenen beiden Vorderpfoten besitzen nun je drei eigene abgerundete 3D-Zehen und einen kleinen Pfotenballen. Die neuen Meshes hängen direkt an den schon animierten Pfoten, sodass Füttern, Streicheln und Gartenlaufen sie mitbewegen. Beide Augen besitzen zwei zusätzliche eigene geometrische Lichtreflexe, deren horizontale Position mit den bereits animierten Irisbewegungen mitgeht.
- **Bestandsschutz:** Kein Austausch von Spielstandsformat, Räumen, Pflegeabläufen oder Kleidung. Die neuen Meshes werden in `pibo-character.mjs` gebaut und über `kids/index.html` mit den bestehenden Pfoten-/Augenobjekten verbunden. Keine fremden Modelle, Sounds oder Texturen übernommen.
- **Geprüft:** Das aktualisierte `pibo-character.test.mjs` bestand in einer V8-Ausführung (10 Assertions). Die bestehenden Face-/Motion-/Roam-Tests bestanden dort ebenfalls (407/4088/12520 Assertions). Das HTML-Inline-Modul wurde syntaktisch geparst. Zusätzlich bestand der Pibo-Smoke mit WebGL-Mock in V8: **18 Checks und 436 simulierte Frames**; alle 18 eindeutigen Benchmark-Nachweisdateien wurden auf GitHub gefunden. Das sind **keine** bestätigten vollständigen Node- oder WebGL-Browsertests.
- **Nicht bestätigt:** Desktop-/Mobil-Chromium, echtes WebGL-Bild, Touch auf Geräten, FPS/GPU-Speicher, alle GitHub-Actions-Jobs und Pages-Deployment. Die GitHub-Abfrage des vorherigen main-Commits gab keine auswertbaren Statuschecks zurück.
- **Qualitätsurteil:** Weiterhin 21/26 Kriterien teilweise umgesetzt und 5 fehlend. Zusätzliche Primitive-Details sind nur eine kleine sichtbare Verbesserung; Pibo erreicht weiterhin **nicht** die künstlerische Qualität eines professionell geriggten 3D-Katzencharakters.
- **Nächste Priorität:** Echte Browser-/Hardware-Screenshots prüfen und anschließend ein **eigenständiges, rechtmäßig verwendbares** GLB-Katzenmodell mit Rig, Gesichts-Morph-Targets, Fellmaterial und Mobil-LOD integrieren. Das bisherige Modell als Fallback erhalten.

## Qualitätsdurchlauf 02.11.2026 – originales Instanced-Fell statt glatter 3D-Körper

- **Konkrete Grafikänderung:** `pibo-fur.mjs` verteilt 520 kurze eigenständige konische Fellsträhnen deterministisch auf Pibos Kopf und Körper. `pibo-character.mjs` rendert sie in **zwei Three.js-InstancedMeshes** statt 520 separaten Draw Calls. Kopf- und Körperfell folgen den bestehenden Animationsgruppen; Vordergesicht/Brust bleiben weitgehend frei. Deko-Fell wird von Raycast-Treffern ausgeschlossen, damit Füttern, Baden und Streicheln weiterhin die echten Körpermeshes treffen.
- **Kein fremdes Modell:** Pibos orangefarbene Figur bleibt eine eigenständige prozedurale Kreation; keine Tom-Assets, fremden Felltexturen, Sounds oder unklar lizenzierten Katzenmodelle übernommen. Bestehende Räume, Kleidung, Pflege, Minispiele und Spielstandschlüssel nicht geändert.
- **Tatsächlich getestet:** `node --check` für das Charaktermodul und `node --test` für `pibo-character.test.mjs` und `pibo-fur.test.mjs` lokal erfolgreich (2/2 Testdateien). Tests prüfen feste Instanzzahlen, Elternbindung, Raycast-Freigabe, deterministische Fellpositionen, Oberflächennormalen und Gesichtsaussparung. Aktuelle GitHub-main-Dateien wurden im V8-Headless-Smoke mit WebGL-Mock erfolgreich ausgeführt: **18 Checks, 436 Frames**, inklusive Pflege, Räume, Spiele und lokalem Speichern. Der Smoke-Harness und `pibo-smoke.yml` wurden für das neue Modul erweitert.
- **Offen:** Keine echte WebGL- oder Desktop-/Mobil-Chromium-Bildabnahme und keine Messung auf echter Android-/iPhone-Hardware. GitHub-Statuschecks/PR-gefilterte Workflow-Abfragen lieferten keine auswertbaren Runs; **CI und Pages-Deployment dieses Pushs sind nicht bestätigt**. Die neuen Fellsträhnen verbessern die Silhouette nur begrenzt; sie ersetzen weder ein professionelles eigenes GLB-Rig noch Morph-Targets, Skinning oder realistische Fellshader.
- **Referenzvergleich:** Offizielle My-Talking-Tom-2-Produktseite sowie Herstellerberichte vom 19.03.2026 (mehrstufiges Bad) und 04.06.2026 (verbundener Garten). Pibo ist in der grafischen und spielerischen Qualität weiterhin weit entfernt. **Benchmark unverändert: 26 Kriterien, 21 teilweise / 5 fehlen.**
- **Nächster Schritt:** In echtem WebGL auf Desktop und Handy Screenshot, Bildrate und Touch-Verhalten prüfen; Fellwirkung bei Bedarf zurücknehmen/verbessern. Danach ein eigenständiges, vollständig geriggtes GLB-Katzenmodell mit Gesichts-Morph-Targets und mobilem LOD einbauen, vorhandene Figur als Fallback erhalten.


## Qualitätsdurchlauf 02.11.2026 – Torso-Fell sichtbar korrigiert

- **Realer Darstellungsfehler behoben:** Die 300 neu erzeugten Fellsträhnen für den Körper lagen zuvor um die Katzenwurzel `(0,0,0)` und damit weit unter dem eigentlichen Torso `(0,0.97,0)`. Die Körperhülle liegt nun am tatsächlichen Torsozentrum; die 220 Kopfsträhnen bleiben unverändert.
- **Animation:** Die Fellhülle folgt der vorhandenen Atemskalierung des Rumpfs, mit begrenztem Skalierungsbereich. Kein zusätzlicher Speicherzustand, keine neuen Netzwerkressourcen und keine Änderung der Touch-Trefferzonen.
- **Prüfung:** Der modifizierte Charaktercode wurde im V8-JavaScript-Parser geprüft; ein Three.js-Mock bestand Positionierung, Instanzanzahl, Atemskalierung, Begrenzung und deaktivierte Fell-Raycasts. `pibo-character.test.mjs` enthält neue Node-Regressionen; **beide vollständigen Charakter-/Fell-Unit-Dateien bestanden im V8-Assert-kompatiblen Harness**. Der vollständige simulierte Pibo-Smoke-Test bestand mit **18 Checks und 436 Frames** (inklusive Raumwechsel, Pflege, Spiele, Spielstand). **Ein echter Node-CI-/Chromium-/WebGL-/E2E-Lauf konnte hier nicht ausgeführt werden**. GitHub-Actions-Push-Runs und Pages-Deployment sind nicht bestätigt.
- **Referenzvergleich:** Offizielle My-Talking-Tom-2-Produktseite sowie Outfit7-Veröffentlichungen vom 19.03.2026 (Bad) und 04.06.2026 (freie Gartenwelt) erneut betrachtet. Diese Korrektur erreicht **keine** professionelle Charakterqualität; ein eigenes Skelett-GLB mit Gesichtsanimationen und echten Mobiltests fehlt weiterhin.
- **Nächste Lücke:** Das ausgerichtete Fell in echtem WebGL auf Desktop und Handy visuell prüfen und anschließend einen professionell riggbaren, eigenständigen Pibo-Charakter entwickeln.
