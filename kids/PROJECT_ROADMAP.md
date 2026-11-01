# SD Hub Kids – Projektübernahme und Entwicklungsplan

Stand: 2026-11-01 · Repository: `Sd031988/SDApp` · Einstieg: `/kids/`

## Ziel
Die bestehende Kids-Anwendung wird als eigenständiger, kindgerechter Bereich von SD Hub weiterentwickelt. Pibo ist das erste Spiel. Bereits vorhandener Code wird nicht ohne Prüfung ersetzt. Referenzen auf kommerzielle Spiele sind ausschließlich funktionale Inspiration; alle Modelle, Sounds und Grafiken müssen eigenständig oder eindeutig lizenziert sein.

## Gesicherter Ist-Stand (Quellcode und README)
- Five-room 3D game in `kids/index.html`.
- `pibo-care.js`: Füttern, Baden, Schlafen und Toiletteninteraktionen.
- `pibo-audio.js`: synthetisierte Soundeffekte.
- Gesichts-/Kaubewegungen existieren in einfacher, prozeduraler Form; professionelle Rigs, Morph-Targets und hochwertige Animationen fehlen.
- Sterne und tägliche Geschenke sind bereits vorhanden; es gibt derzeit keinen hier verifizierten Blockchain-Token.
- Ein Node-/DOM-Mock-Smoke-Test und CI-Workflow existieren. Echte Browser-, Audio-, GPU- und Touch-Tests sind offen.

## Umsetzungspakete
### P0 – Qualitätsbasis
- [ ] Bestandsaufnahme aller Spielaktionen mit Akzeptanzkriterien
- [ ] Browser-Tests auf Android, iOS und Desktop; WebGL- und Performanceprüfung
- [ ] Fehlerfälle (CDN nicht erreichbar, Audio/Mikrofon verweigert, Save beschädigt) absichern
- [ ] Kinderfreundliche Datenschutzprüfung; kein unnötiges Tracking

### P1 – Pibo-Charakter
- [ ] Originales, rechtlich nutzbares rigged glTF-Modell
- [ ] Gesichtsanimationen: Blinzeln, Blick, Freude, Müdigkeit, Mundformen
- [ ] Kauen: Biss-Timing, Kopf/Kiefer synchron zu Essen und Ton
- [ ] Körper: Gehen, Springen, Atmen, Sitzen, Liegen, Pfoten, Schwanz
- [ ] Zustandsautomat für Unterbrechungen und Animationsübergänge

### P2 – Spielmechaniken
- [ ] Greifbares Drag-and-drop-Futter und sichtbare Portionsabnahme
- [ ] Baden und Toilette als echte Touch-Interaktionen
- [ ] Minispiele mit klaren Schwierigkeitsstufen
- [ ] Zugänglichkeit: große Touch-Ziele, reduzierte Bewegung, Soundkontrolle

### P3 – Sterne / Token-Konzept
- Bestehende Sterne bleiben zunächst **ausschließlich virtuelle Spielpunkte**, kein handelbarer Crypto-Token.
- [ ] Gemeinsame Reward-API mit nachvollziehbaren Ereignissen
- [ ] Schutz vor doppelter täglicher Vergabe / beliebigem Hochzählen
- [ ] Elterninformation und klare Regeln für Einlösen/Zurücksetzen
- [ ] Falls ein echter Token gemeint ist: Token-Typ, rechtliche Fragen, Wallets, Minderjährigenschutz und Sicherheitsarchitektur vor einer Implementierung gesondert festlegen; keine Wallets oder Käufe für Kinder voreilig integrieren.

### P4 – Release
- [ ] Automatisierte CI-Checks erweitert
- [ ] Reale Gerätetests protokolliert
- [ ] Launch-Checkliste und Rollback dokumentiert
- [ ] Erst dann Veröffentlichung als fertig bezeichnen

## Definition of Done
Funktion getestet + ohne Konsolenfehler auf Zielgeräten + sauber versioniert + barrierearme Bedienung + keine unlizenzierte Assets + nachvollziehbare Freigabe. Derzeit **nicht erfüllt**.

## Nächster konkreter Entwicklungsschritt
Rewards/Stammwerte und Pibo-Animationssteuerung isolieren, gezielte Tests ergänzen, danach Implementierung unter `kids/` iterativ ausbauen.
