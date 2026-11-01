# SD Kids Spielewelt

## Direkt spielen

**Spielezentrale:** [https://thesdhub.com/kids/games/](https://thesdhub.com/kids/games/)

Der Hub enthält **10 spielbare Spiele**, davon die beiden bestehenden eigenständigen 3D-Spiele **Pibo** und **SD BlockWorld** sowie acht neu entwickelte, unabhängige **2D-Minispiele**. Die Minispiele sind bewusst nicht als Roblox-artige 3D-Welten oder vollwertige Multiplayer-Titel beschrieben.

| Spiel | Format | Spielmechanik |
| --- | --- | --- |
| Pibo 3D | 3D | virtuelle Katze pflegen und dekorieren |
| SD BlockWorld | 3D, freiwillig online | bauen, erkunden, Kristalle, Parcours |
| SD Obby Tower | 2D | Jump-and-run mit drei Levels, Sprüngen, Checkpoints |
| SD Pet Island | 2D | vier Haustiere auswählen, pflegen und Fortschritt sammeln |
| SD Garden World | 2D | neun Beete, säen, gießen, ernten |
| SD City Life | 2D | vier Berufe mit je vier Aufgaben, Missionen lösen |
| SD Kart Rush | 2D | frei steuerbares Kart, vier Checkpoints, Rennrunden |
| SD Treasure Quest | 2D | Inselkarte, drei Schätze, zwei Schlüssel, Endziel |
| SD Fashion Studio | 2D | Avatar-Mode mit variablen Hut-/Shirt-/Schuhfarben, Looks |
| SD Lern-Abenteuer | 2D | 16 Aufgaben zu Deutsch, Rechnen, Wissen und Logik |

## Professionelle Plattformfunktionen (Ausbaustufe 2)

- Durchsuchbare Spielebibliothek mit Genre-Filtern, Favoriten und Sortierung („Empfohlen“, „Favoriten zuerst“, „Zuletzt gespielt“, alphabetisch).
- Acht sichtbar freischaltbare Spielerfolge, gesammelt aus den **tatsächlichen, lokal gespeicherten Minispiel-Fortschritten**. Die beiden 3D-Spiele bleiben eigenständige Produkte.
- Lokale Sicherung per JSON-Export und validierter Import. Zum Überschreiben ist eine ausdrückliche Bestätigung erforderlich. Es werden keine Pibo-/BlockWorld-Speicherstände in dieses Minispiel-Backup kopiert.
- Einheitliches Spiel-Fenster mit **Pause/Fortsetzen**, Vollbildtaste (falls vom Browser unterstützt), großen Bildschirmsteuerungen und **Ton-/Bewegungseinstellungen**, die im Browser lokal gespeichert werden.
- **Leichtere Offline-Nutzung der acht 2D-Minispiele**: Der installierbare Spielebereich registriert einen auf `/kids/games/` begrenzten Service Worker. Nach einem erfolgreichen ersten Laden werden nur die Mini-Spiel-Oberflächen/-Module für späteres Spielen offline vorgehalten. Die 3D-Bereiche Pibo und BlockWorld sind nicht im Offline-Cache und können weiterhin Internet benötigen.
- Wiederholung von Minispielen löscht nicht die bereits ausgezahlten erstmaligen Sternmeilensteine (kein leichtes Verdoppeln der Belohnung durch „Neu starten“).
- Sanft animierte, selbst gezeichnete Canvas-Dekoration und besseres Kart-Fahrgefühl; abgeschwächte Bewegung auf Wunsch.
- Zusätzlich Browser-Regressionstests für Suche, Favoriten, Import/Export, Pause, Ton, reduzierte Bewegung, Offline-Minispiele, BlockWorld-Pause und mobile Ansichten.

## Original-Sounds in allen zehn Spielen

- **Gemeinsames Audio-Panel:** In der Spielezentrale kannst du Klänge an-/ausschalten und die Lautstärke wählen. Diese beiden Einstellungen gelten auch in BlockWorld, Pibo und den acht Minispielen (`sd-kids-audio-v1`, lokal im Browser).
- **Eigene prozedural erzeugte Geräusche:** Das Modul `../sd-sound.mjs` erzeugt mehr als 30 unterschiedliche Signale ausschließlich im Browser (Web Audio) – ohne nachzuladende Sounddateien, externe Samples, Streams oder Musik mit fremden Rechten.
- **Obby Tower:** Sprung, Schritte, Landung, Checkpoint, Ziel und Fall.
- **Pet Island:** Füttern, Schnurren und Schlafen, dazu dezente Vogelstimmen.
- **Garden World:** Samen in die Erde, Gießwasser, Ernte, Vogelstimmen.
- **City Life:** Aufgaben und Missionsabschlüsse.
- **Kart Rush:** Motorimpulse, Kontrolltore und Rundenabschluss; Motorsounds werden zeitlich begrenzt, um Überlastung zu vermeiden.
- **Treasure Quest:** Schritte, Schlüssel, Schätze und Sieg.
- **Fashion Studio:** Farbauswahl, neue Outfits und Laufsteg.
- **Lern-Abenteuer:** Richtige/falsche Antwort, neue Aufgabe und Erfolg.
- **BlockWorld:** Schritte, Sprung/Landung, Bauen/Löschen, Kristalle, Parkour, Teleport, Tiere/Natur und Online-Spielraum.
- **Pibo:** Bereits vorhandene separate `pibo-audio.js`-Geräusche (Miauen, Schnurren, Kauen, Schritte, Wasser, Spülen, Schnarchen, Geschenk) wurden um gemeinsamen Lautstärkespeicher, Zimmer- und Fotoklang ergänzt. Lautstärke wirkt auch auf die lokale Sprachwiedergabe.
- **Handy-Schutz:** Browser erlauben Audio meist erst nach einer aktiven Berührung oder einem Tastendruck. Sound ist in der Spielezentrale und den acht Minispielen standardmäßig ausgeschaltet, bis er bewusst aktiviert wird. Pibos vorhandenes Standardverhalten bleibt auf Geräten ohne gemeinsame gespeicherte Einstellungen erhalten.
- **Kontrolle:** Jederzeit stumm stellen und Lautstärke auf 0 setzen; Sounds sind auf kurze, moderate Töne und begrenzte Raten ausgelegt. Keine Tonaufnahmen werden für Effekte verwendet.
- **Offline:** Der isolierte Service Worker der Minispiele speichert auch das Soundmodul. Die acht 2D-Spiele bleiben nach dem ersten erfolgreichen Laden inklusive der Geräusche offline nutzbar.

Validierung: `node kids/sd-sound.test.mjs` testet sämtliche Geräuschnamen auf einem simulierten Web-Audio-Kontext, Speichern, Lautstärke, zeitliche Begrenzung und Stummschaltung. Playwright prüft Web-Audio-Starts im Browser und die gemeinsamen Einstellungen über mehrere Spiele hinweg. Die akustische Qualität auf physischen iOS-/Android-Geräten muss zusätzlich mit Menschen abgenommen werden.

## Technik

- `index.html`: responsive Startseite mit Filter, Spiellinks, Datenschutzinformationen.
- `catalog.mjs`: zentraler Katalog und Spielkennzeichnung, ohne veraltete Platzhalter.
- `play.html` + `play.mjs`: Canvas-Spieloberfläche und die individuellen Steuerungen/Zeichnungen von acht Minispielen.
- `rules.mjs`: testbare Regeln für jedes Minispiel, begrenzte Sternvergaben, gespeicherte Fortschritte.
- `rules.test.mjs`: Unit-Tests zu allen acht Spielen, Speicherschutz und Belohnungen.
- `../sd-sound.mjs` / `../sd-sound.test.mjs`: originales Sounddesign für die Spielewelt und BlockWorld.
- `profile.mjs` / `profile.test.mjs`: private Favoriten, Einstellungen, acht Erfolge, Backup-Sanitizing und sichere Wiederholung.
- `manifest.webmanifest`, `icon.svg`, `sw.js`: eigenständiger Mini-Spiele-Bereich mit Cache ausschließlich innerhalb dieses Pfades.
- `../e2e/games-platform.spec.mjs`: Playwright-E2E-Prüfung des Spielekatalogs sowie aller Minispiel-Starts und wichtiger Interaktionen.
- `../../.github/workflows/pibo-smoke.yml`: Node-Syntax-/Unit-Tests; `../../.github/workflows/kids-browser.yml`: Chromium-Tests für Desktop und Mobile-Emulation.

## Steuerung

Die Aktionen sind im Spiel sichtbar. Plattformen/Kart: WASD bzw. Pfeile, Jump-and-run mit Leertaste oder Springen. Schatzinsel: Pfeile oder Bildschirmtasten. Garten: Werkzeug auswählen und ein Beet antippen. Haustiere, Stadt, Fashion, Lernen: große Aktionsbuttons oder interaktive Spielfeldbereiche.

Minispiele benutzen nur `localStorage` auf dem aktuellen Gerät. Die dort verdienten Sterne werden **zwischen den acht Minispielen geteilt**, derzeit **nicht mit Pibos Sternen oder BlockWorld-Sternen synchronisiert**. Sie haben keinen Geldwert, können nicht ausgezahlt werden und sind keine Blockchain-Token. Das gemeinsame Anmeldungs- und Inventarsystem ist **nicht** implementiert.

## Datenschutz und Sicherheit

Die neuen acht Minispiele sind standardmäßig Einzelspieler ohne Server, Chat, Anmeldung, Werbung, Käufe oder Standortzugriff. BlockWorld ist ein separates existierendes 3D-Spiel mit freiwillig zuschaltbaren, temporären Online-Räumen auf dem vorhandenen Render-Dienst. Eltern sollten den Online-Modus begleiten.

## Grenzen

Dies ist eine erste zusammenhängende **Browser-Spieleplattform** mit acht kleineren 2D-Spielen und zwei bestehenden 3D-Spielen, **keine vollständige Roblox-Plattform**. Professionell geriggte 3D-Welten für alle weiteren acht Spiele, dauerhafte Multiplayer-Welten, nutzergenerierte Spiele und Marktplätze sind nicht vorhanden. Für eine Kinder-Produktionsfreigabe sind weiterhin reale Gerätetests (Android/iOS), Barrierefreiheit, Performance und Datenschutz-/Jugendschutz-Abnahme erforderlich.

## Testen

```sh
node --check kids/games/play.mjs
node kids/games/rules.test.mjs
node kids/games/profile.test.mjs
node kids/sd-sound.test.mjs
node --check kids/games/sw.js
cd kids
npm install
npx playwright install chromium
npm run test:e2e
```

Neuere Versionen der GitHub-CI prüfen dasselbe automatisch.
