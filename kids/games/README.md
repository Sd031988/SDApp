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

## Technik

- `index.html`: responsive Startseite mit Filter, Spiellinks, Datenschutzinformationen.
- `catalog.mjs`: zentraler Katalog und Spielkennzeichnung, ohne veraltete Platzhalter.
- `play.html` + `play.mjs`: Canvas-Spieloberfläche und die individuellen Steuerungen/Zeichnungen von acht Minispielen.
- `rules.mjs`: testbare Regeln für jedes Minispiel, begrenzte Sternvergaben, gespeicherte Fortschritte.
- `rules.test.mjs`: Unit-Tests zu allen acht Spielen, Speicherschutz und Belohnungen.
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
cd kids
npm install
npx playwright install chromium
npm run test:e2e
```

Neuere Versionen der GitHub-CI prüfen dasselbe automatisch.
