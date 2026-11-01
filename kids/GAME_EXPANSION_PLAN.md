# SD Hub Kids – Spielekatalog & Ausbauplan

Stand: 2026-11-01. **Status aktualisiert:** Die Spielezentrale mit zehn spielbaren Titeln ist nun programmiert. Die acht neu hinzugekommenen Spielkonzepte sind derzeit **kleinere 2D-Minispiele**; die größeren 3D-/Multiplayer-Ausbaustufen sind weiterhin offen.

## Ausgangslage

Bereits vorhanden: Pibo (virtuelles 3D-Haustier) und SD BlockWorld (3D-Sandbox).
Gemeinsame, kurzlebige Online-Räume nutzen den bestehenden Render-Dienst des Projekts `Sd031988/agents`, nicht einen eigenen Spiele-Server. Dort laufen auch die separaten Deutschlern-Endpunkte. Aktuelle BlockWorld-Synchronisation erfolgt per HTTP-Polling und eignet sich eher für gemeinsame Bau-/Erkundungsaktionen als für schnelle Echtzeit-Rennen.

## Kandidaten und Umsetzung

| Priorität | Neues Spiel | Kern-Gameplay | Gemeinsames Spiel | Wiederverwendung | Aufwand |
| --- | --- | --- | --- | --- | --- |
| 1 | **SD Obby Tower** | Hindernis-Türme, Checkpoints, neue Levels, Bestzeiten, Sterne | Gemeinsam Parcours erkunden, ohne Chat | BlockWorld-3D, Spielfigur, Sprungmechanik | mittel |
| 2 | **SD Pet Island** | Verschiedene eigenständige virtuelle Haustiere pflegen, bewegen und trainieren; Insel verschönern | Mit virtuellen Tieren in gemeinsamen Bereichen herumlaufen | Pibo-Pflege, BlockWorld-Welt | hoch |
| 3 | **SD Garden World** | Beet anlegen, gießen, wachsen lassen, ernten, Deko freischalten | Gemeinsam gärtnern; Server validiert Aktionen | Blöcke/Assets, Render-Räume, Sterne | mittel |
| 4 | **SD City Life** | Kleine Spielstadt, vorgefertigte Beruf- und Rollenspielaktionen, Sammelaufgaben | Nonverbale gemeinsame Aktivitäten ohne freien Chat | BlockWorld-3D und Online-Räume | hoch |
| 5 | **SD Kart Rush** | Niedliche Fahrzeuge, Strecken, Checkpoints, Zeitfahren | Zunächst Solo/Geisterfahrten; erst später echte Rennen | Three.js, Welten/Steuerung | hoch |
| 6 | **SD Treasure Quest** | Inseln erkunden, Rätsel, Höhlen und Schätze | Gemeinsam Schatzsuche mit vorgegebenen Emotes | BlockWorld-Physik und Sterne | mittel |
| 7 | **SD Fashion Studio** | Avatare gestalten, Outfits, Laufsteg, Fotos | Nur kuratierte Inhalte, keine offenen Nutzernamen | Vorhandene Avatar-/Outfitmechanik | mittel |
| 8 | **SD Lern-Abenteuer** | Bewegung + Deutsch-/Rechen-/Logik-Rätsel, Level | Optional gemeinsame Rätsel, kein öffentlicher Chat | Deutschlern-Inhalte nur mit passender Altersstufe | mittel |
| 9 | **SD Fluglabor** | Kreative Fluggeräte bauen, Physik testen und Zielinseln erreichen | Später geteilte Blaupausen nach Validierung | BlockWorld-Bau-Editor | hoch |

## Bereits ausgelieferte erste Version

Die [SD Kids Spielezentrale](https://thesdhub.com/kids/games/) enthält **Pibo 3D**, **BlockWorld 3D** und acht einzeln spielbare 2D-Minispiele (Obby, Pet, Garden, City, Kart, Treasure, Fashion, Lern-Abenteuer). Die Minispiele haben konkrete Regeln, mobile/Tastatur-Steuerung und lokal gespeicherte Fortschritte. Sie sind keine fertigen dreidimensionalen Großspiele oder Roblox-Server. Die acht neuen Spielpunkte werden derzeit nur **innerhalb der Minispiele** geteilt und nicht mit Pibo/BlockWorld synchronisiert.

**Nachgewiesene Grundlagen:** Quellcode in `kids/games/`, automatisierte Node-Tests der Minispielregeln und Browser-E2E-Tests in GitHub Actions.

## Ausbau der Minispiele zu großen 3D-Welten



**Phase A: SD Kids Spielezentrale.** Zentralen Startbildschirm mit Kacheln für bereits vorhandene und neue Spiele, klarer Kennzeichnung von „Spielbar“ versus „In Entwicklung“. Gemeinsames Designsystem, Tastatur-/Touchsteuerung, Alters-/Elternhinweise; keine personenbezogenen Online-Profile.

**Phase B: SD Obby Tower.** Eigenes Levelpaket mit mindestens drei Themen, Checkpoints, Levelabschluss, Wiederholbarkeit, niedrigem Einstiegshindernis. Auf bestehende BlockWorld-Kamera, Spielfigur und Kollisionslogik aufbauen. Erst als Solo-Spiel abnehmen; optional mit geteilten Bewegungsdaten.

**Phase C: SD Garden World.** Kooperative, langsame Spiellogik als technisch passender erster Ausbau des vorhandenen Render-Servers. Serverautoritative Pflanz-/Gieß-/Ernteaktionen, strenge Ratenlimits und begrenzte Raumgröße. Keine Echtgeldkäufe und keine offenen Nachrichten.

**Phase D: SD Pet Island.** Pibos originale Pflege- und Animationsfunktionen wiederverwenden, aber eigene Tierarten und Modelle erzeugen, keine fremden Figuren oder geschützten Assets.

**Phase E: City Life, Treasure Quest, Kart Rush, Fashion Studio und Lern-Abenteuer** anhand echter Tests und Nachfrage priorisieren. Für echte Echtzeit-Rennen muss die aktuelle HTTP-Polling-Architektur erst durch dafür geeignete, validierte Echtzeitübertragung erweitert werden.

## Gemeinsame technische Plattform (vor mehreren neuen Spielen)

- Einheitlicher Katalog mit Links, Status, Kurzbeschreibung, Tastatur-/Touch-Hinweisen.
- Gemeinsame Module für Avatar, Audio-Lautstärke, barrierearme Steuerung, lokale Einstellungen und Spielstände; bestehende Spielstände migrationssicher erhalten.
- Sterne zunächst als **nur lokale, nicht handelbare Spielpunkte**. Kein Blockchain-Token, keine Wallets, keine Käufe für Kinder.
- Standardmäßig Einzelspieler. Online-Funktionen nur nach expliziter Auswahl, serverseitiger Validierung, Rate-Limits und Prüfung von Sicherheit und Jugendschutz.
- Kein offener Chat, kein Upload ausführbaren Spielcodes, keine ungeprüften Nutzerinhalte und kein Nutzer-zu-Nutzer-Handel.
- Datenschutz: so wenige Daten wie möglich, zeitlich begrenzte Sitzungen, keine sichtbaren personenbezogenen Daten oder Standortangaben, nachvollziehbare Elterninformationen.
- Bei neuen Render-Diensten Ressourcenverbrauch und Zuverlässigkeit prüfen; den Deutschlernen-Dienst weder überlasten noch beeinträchtigen.
- Qualität: Node-Unit-Tests, Playwright-Browser-Tests und echte Gerätetests (Android, iOS) vor Produktionsfreigabe.

## Nächste konkrete Umsetzung

1. **Bereits erledigt:** `kids/games/` enthält jetzt die Spielezentrale mit zehn spielbaren Titeln, Filtern und lokalen Erfolgsanzeigen.
2. **SD Obby Tower** als nächstes eigenständiges Spiel beginnen, ohne vorhandenes BlockWorld/Pibo zu beschädigen.
3. Gemeinsame Sterne/Inventar-/Profilarchitektur konzipieren und erst nach Datenschutz-/Sicherheitsprüfung serverseitig einführen.
4. Für jedes weitere Spiel eigene Abnahmetests, Kinder-Sicherheit, Touch-Performance und Offline-Fallbacks bereitstellen.

**Definition of Done:** Nicht „fertig“ oder „auf Render live“ behaupten, solange nicht Code, tatsächlich erfolgreiche Tests und Deployment nachgewiesen sind.
