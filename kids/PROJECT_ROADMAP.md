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
- Node-/DOM-Mock-Smoke-Tests sowie Unit-Tests für Gesicht, Körper und lokale Sterne laufen in CI. Desktop- und mobile Chromium-Emulation mit echtem WebGL wurde über Playwright geprüft. Tests auf realer iOS-/Android-Hardware, physische GPU-Profilierung und Audioqualität sind offen.

## Umsetzungspakete
### P0 – Qualitätsbasis
- [x] Bestand von fünf Räumen, Pflegeaktionen, Geschenken, Kleidung und Minispielen sowie automatisierte Smoke-/E2E-Abdeckung angelegt
- [ ] Browser-Tests auf Android, iOS und Desktop; WebGL- und Performanceprüfung
- [ ] Fehlerfälle (CDN nicht erreichbar, Audio/Mikrofon verweigert, Save beschädigt) absichern
- [ ] Kinderfreundliche Datenschutzprüfung; kein unnötiges Tracking

### P1 – Pibo-Charakter
- [ ] Originales, rechtlich nutzbares rigged glTF-Modell
- [x] Prozedurale Gesichtsanimationen: Blinzeln, Blick, Freude, Müdigkeit, Mundformen
- [x] Prozedurales Kauen: sichtbares Mund-/Kopf-Biss-Timing und synthetischer Kausound
- [x] Prozedurale Körperbewegungen: Gehen, Springen, Atmen, Sitzen, Liegen, Pfoten, Schwanz, Ohren
- [ ] Zustandsautomat für Unterbrechungen und Animationsübergänge

### P2 – Spielmechaniken
- [x] Futter mit Desktop-/Touch-/Stift-Drag-and-drop und sichtbarem Schrumpfen beim Fressen
- [ ] Baden und Toilette als echte Touch-Interaktionen
- [ ] Minispiele mit klaren Schwierigkeitsstufen
- [x] Große Touch-Ziele, reduzierte Grundbewegung und abschaltbarer Sound (vollständiges Accessibility-Audit offen)

### P3 – Sterne / Token-Konzept
- Bestehende Sterne bleiben zunächst **ausschließlich virtuelle Spielpunkte**, kein handelbarer Crypto-Token.
- [ ] Gemeinsame Reward-API mit nachvollziehbaren Ereignissen
- [ ] Schutz vor doppelter täglicher Vergabe / beliebigem Hochzählen
- [ ] Elterninformation und klare Regeln für Einlösen/Zurücksetzen
- [ ] Falls ein echter Token gemeint ist: Token-Typ, rechtliche Fragen, Wallets, Minderjährigenschutz und Sicherheitsarchitektur vor einer Implementierung gesondert festlegen; keine Wallets oder Käufe für Kinder voreilig integrieren.

### P4 – Release
- [x] Node-Unit-/Smoketests und Playwright-Browsertests (Desktop und mobile Chromium-Emulation) in GitHub Actions
- [ ] Reale Gerätetests protokolliert
- [ ] Launch-Checkliste und Rollback dokumentiert
- [ ] Erst dann Veröffentlichung als fertig bezeichnen

## Definition of Done
Funktion getestet + ohne Konsolenfehler auf Zielgeräten + sauber versioniert + barrierearme Bedienung + keine unlizenzierte Assets + nachvollziehbare Freigabe. Derzeit **nicht erfüllt**.

## Nächster konkreter Entwicklungsschritt
Nächste offene Bausteine: professionell geriggtes Original-glTF-Modell, echte Geräteabnahme (Android/iOS), Audio- und GPU-Profiling, Offline-Hosting und Kinderdatenschutz-/Barrierefreiheits-Audit. Interne Sterne sind nicht in Blockchain-Token zu überführen ohne gesonderte Definition und Prüfung.
