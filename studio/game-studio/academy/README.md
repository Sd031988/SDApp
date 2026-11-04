# SD Game-Studio Academy — Kurse

Die Academy ist unter `studio/game-studio/academy/index.html` erreichbar und im linken Bereich des Level-Editors verlinkt. Sie funktioniert vollständig statisch, ohne Anmeldung oder Backend.

## Lernpfad

| Kurs | Lektionen | Praxisziel |
| --- | ---: | --- |
| 01 Einstieg | 4 | Erste Szene, Kamera, Inspector, JSON-Sicherung |
| 02 Level-Design | 4 | Gelände, Naturgruppen, Licht, Spielfigur und Spieltest |
| 03 3D-Assets | 4 | GLB-Vorschau, Modellplatzierung, Projektversionen, Qualitätssicherung |
| 04 Große Games | 4 | Experimentelle Großwelt, Zellen, Performance-Kennzahlen, Produktionsplanung |
| 05 JPEG XL | 4 | Bildformate, libjxl-Konvertierung, Web-Fallbacks, GPU-Textur-Pipeline |

Jede der 20 Lektionen enthält konkrete Bedienungsschritte, ein Lernziel, drei Praxisaufgaben und einen Wissenscheck mit vier Antworten. Der Abschluss wird nur freigeschaltet, wenn alle Aufgaben manuell bestätigt und die Frage richtig beantwortet wurden. Fortschritt, Aufgaben und letzte Antworten werden separat in `localStorage` mit dem Schlüssel `sd-game-academy-progress-v1` gespeichert. Bei blockiertem Storage bleibt die Academy benutzbar, ohne dauerhaften Fortschritt.

## Funktionsgrenzen transparent erklären

- Einzelszene (v1/v2): bis 70 Objekte, Boden-/Licht-/Avatar-Einstellungen, lokale JSON-Dateien.
- GLB-Vorschau: Geometrie und Basisfarben, bis 8 MiB; keine Texturen, Skinning oder Animationen. v2 erlaubt maximal vier unterschiedliche GLB-Assets innerhalb des Gesamtbudgets.
- Separate Großwelt (v3, experimentell): Beispielwelt 640 × 640 Einheiten, 256 Szenenzellen und 2.048 Startobjekte. In-Memory-Cell-Culling ist **kein** echtes Disk-Streaming.
- Multiplayer-Server, kommerzieller Build-Export und umfassende AAA-Spielsysteme sind keine fertigen Funktionen; die Abschlusslektion kennzeichnet sie als geplante Architekturthemen.
- JPEG XL: Der neue Lernpfad nutzt das vorhandene statische Werkzeug `studio/jpeg-xl.html`, das bereits vorhandene Bilddateien zu `<picture>`-HTML kombiniert. Es konvertiert keine Bilder. Die Game-Engine besitzt derzeit keinen eigenen JXL-Texturdecoder; für GPU-komprimierte Laufzeittexturen werden stattdessen KTX2/Basis Universal behandelt.

## Sicherheit und Datenschutz

Die Academy verwendet keine externen Bibliotheken, keine Tracker und keine Netzwerkanfragen. Sie importiert keine Nutzerprojekte und greift nicht in die vorhandenen Game-Studio-Szenen ein. Der Reset löscht ausschließlich den eigenen Academy-Fortschritt.

## Qualitätsprüfung

- `node --check studio/game-studio/academy/academy.js`
- `node --test tests/studio/game-studio-academy.test.cjs`
- `node tests/studio/game-studio-academy-browser.test.cjs` (Playwright Chromium)

Die Tests prüfen Einbindung, 20 Lektionen in fünf Kursreihen, korrekte Quiz-Sperre, Fortschritts-Persistenz, Navigation in die Großwelt, den JPEG-XL-Werkzeuglink und grundlegende Mobilansicht.

### Quellen zum JXL-Kurs

- [libjxl: Referenzencoder und -decoder](https://github.com/libjxl/libjxl)
- [MDN: Bildformate und JPEG-XL-Fallbacks](https://developer.mozilla.org/de/docs/Web/Media/Guides/Formats/Image_types)
- [Khronos: KTX2 als GPU-Texturcontainer](https://www.khronos.org/ktx/)

Die native JPEG-XL-Unterstützung ist je nach Gerät und Browserversion unterschiedlich. Der Kurs zeigt ein Workflow-Konzept, nicht einen bereits fertig integrierten 3D-Texturimport.

## Weitere Kursentwicklung

Nächste Stufe: bebilderte Schrittfolgen, sprachgesteuerte Erklärungen, projektbasierte Abschlussaufgaben sowie weiterführende Kurse nur dann, wenn die zugehörigen Engine-Funktionen tatsächlich nutzbar sind.
