# SD Hub – Qualitätsstand und nächste Ausbauschritte (1. November 2026)

> Transparenter Arbeitsstand: Vorhandene Funktionen sind nicht automatisch auf jedem Gerät erprobt, fachlich zertifiziert oder sicher für Cloud-Verarbeitung freigegeben.

## Was jetzt umgesetzt wurde

- Die bestehende 3D-Startseite heißt weiterhin SD Hub. Acht animierte, anklickbare Themenordner, darunter Deutsch & Lernen sowie Kids & Spiele.
- Interaktion per Tastatur, vollständige DE/EN-Texte für die neuen Ordner, Suchfilter und korrigierte Navigation.
- Neue Querlinks zwischen Deutschlernen, Code-Studio, Pibo und Mein SD Hub, ohne die laufenden Anwendungen beim Öffnen des Links zu schließen.
- Code-Studio: stabilere JSON-Fehler-Zeilenangaben und korrigierte Ladereihenfolge für CodeMirror-Modi.
- Mein SD Hub: Favoriten, Fortschritt, lokale Sicherung/Import, klare Hinweise zur manuellen Übertragung zwischen Geräten.

## Automatische Qualitätssicherung

| Bereich | Workflow | Abdeckung |
| --- | --- | --- |
| Homepage & Mein SD Hub | .github/workflows/mein-sd-hub-quality.yml | Links, acht Ordner, Suchfilter, DE/EN, Tastatur, 1300/390/320 px, persönliche Daten |
| Deutsch | .github/workflows/deutsch-quality.yml | Alphabetisierung, A1, A2, B1, JSON-Bücher, Prüfungsstruktur Goethe/telc/DTZ, Syntax |
| Studio | .github/workflows/studio-tests.yml | Projekte, Imports/Exports, Lernmodus, JSON-Diagnose, CodeMirror-Browserprüfung |
| Pibo | .github/workflows/pibo-smoke.yml und .github/workflows/kids-browser.yml | Spielmechanik, Audio, Animationsmodule, Browserläufe |

## Noch offene Qualitätsziele – keine Abschlussbehauptung

### P0: Bedienung und Sicherheit
- Reale iPhone-Safari-, VoiceOver-, Android- und TalkBack-Prüfungen.
- Kontinuierliche Qualitätskontrolle mit Nutzenden unterschiedlicher Computererfahrung.
- Sichere Projekt- und Datenmigration ohne Überschreiben bestehender Arbeiten.

### P1: Alphabetisierung bis B1
- Fachlicher Abgleich mit GER-Kompetenzen: Grammatik, Wortschatz, Hör-/Lesetexte, Fehlerfreiheit.
- Prüfungen durch fachkundige Redaktion nach offiziellen Aufgaben- und Bewertungsformaten überprüfen; Browser-Sprachausgabe ist kein Ersatz für geprüfte Audios.
- Schriftliche und mündliche Leistungen nach transparenten Bewertungsrastern prüfen. Keine Zertifikats- oder Bestehensgarantie.

### P2: Code-Studio
- Echte Windows/macOS/Linux-Installer automatisiert bauen und auf Zielsystemen installieren/testen.
- Große ZIP-/Ordnerprojekte und Sicherheitsgrenzen auf Traversal, Größenlimits, Datenverlust und Importfehler testen.
- Lernmodus mit weiteren ausführbaren Aufgaben, Gegenbeispielen und End-to-End-Tests ausbauen.

### P3: Pibo und Kinderbereich
- Lange Sitzungen und reale Mobilgeräte mit Ton, Akku, Touch und Speicher beobachten.
- Kindgerechte Bedienung, keine versteckten Kosten und datensparsame Einwilligung für etwaige Online- und Mikrofonfunktionen.

### P4: Geräteübergreifende Daten
- Für Mein SD Hub ist bisher lokaler JSON-Export/Import verfügbar, keine automatische Cloud-Synchronisierung.
- Vor einer optionalen Cloudfreigabe: nachweisliche Firestore-Zugriffsregeln pro Benutzer, Kontoanmeldung, Konfliktlösung, Löschkonzept, Datenminimierung, Einwilligung und Datenschutzprüfung.
- Keine automatische Synchronisierung einschalten, bevor die Sicherheitsprüfungen nachweisbar erfolgreich sind.

## Freigaberegel
Eine Komponente wird erst nach fachlicher Prüfung, Sicherheitskontrolle, grünen automatischen Tests und geeigneten echten Geräte-Tests als vollständig abgeschlossen bezeichnet.
