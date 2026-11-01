# Pibo 3D – Entwicklungsstand

Pibo ist ein **eigenständiges** virtuelles Katzenspiel innerhalb von SD Hub. My Talking Tom 2 dient als Referenz für die Art der Interaktionen, nicht als Quelle für geschützte Modelle, Figuren, Grafiken, Musik oder Originalgeräusche.

## Architektur

- `index.html`: UI, fünf 3D-Zimmer, Pibo-Modell, Pflegewerte, Kleiderschrank, Tagesgeschenk, Ball- und Mausspiel, Mikrofonaufnahme, lokaler Spielstand.
- `pibo-care.js`: eigenständiger Animationsablauf für Füttern, Baden, Schlafen und Toilette; 3D-Lebensmittel, Schaum, Bettdecke und Spüleffekt.
- `pibo-audio.js`: selbst programmierte **synthetische** Geräusche für Miauen, Schnurren, Schritte, Kauen, Wasser, Spülen, Pupsen, Schlafen und Belohnungen. **Keine echten Katzenaufnahmen.**
- `pibo-smoke.js` / `pibo-smoke-test.mjs`: Browser-Logik-Smoketest mit Three.js-/DOM-Mocks.
- `.github/workflows/pibo-smoke.yml`: CI-Workflow für Syntax und Smoketest.

## Testen

Aus dem Repository-Stammverzeichnis:

```sh
node --check kids/pibo-care.js
node --check kids/pibo-audio.js
node --check kids/pibo-smoke.js
node kids/pibo-smoke-test.mjs
```

Der Headless-Test deckt Initialisierung, Navigation durch alle fünf Zimmer, Futterauswahl, Animationsabläufe, Toilettenspülung, zwölf Outfits, Geschenke, Ball- und Mausspiel mit Touch-Ereignissen und Punkten sowie das Speichern ab. Er **prüft keine echte WebGL-Grafik, echte Audioausgabe oder Touchscreen-Hardware**.

Manuelle Prüfung in aktuellen Chrome-/Safari-Versionen (Desktop und Mobilgerät): Seite laden, jedes Zimmer betreten, Futter auswählen und füttern, Bad/Toilette/Bett mit komplettem Ablauf, Outfitwahl, zwei Minispiele mit Timer, Mikrofon erlauben/ablehnen, Ton an/aus, Tagesgeschenk nur einmal, Spielstand nach Neuladen, Foto und verschiedene Displaygrößen. Bei der Live-Version zusätzlich den Abruf der CDN-3D-Bibliothek prüfen.

## Noch nicht Premium-Niveau

Das aktuelle Katzenmodell und die Möbel bestehen überwiegend aus einfachen 3D-Grundformen. Die Pflegeanimationen sind programmierte Bewegungssequenzen, **keine professionell geriggten Charakteranimationen**. Die Geräusche sind verbessert und unterscheiden sich nach Handlung, aber sie sind synthetisch und nicht mit hochwertigen Tier- und Foley-Aufnahmen vergleichbar. Die Speisen sind nicht per Drag-and-drop greifbar. Die Toilette, die Badewanne und das Bett benötigen detailliertere Interaktionen. Echte WebGL-, iOS- und Android-End-to-End-Tests stehen noch aus.

## Nächste Entwicklungsprioritäten

1. Eigenes hochwertiges, lizenziertes glTF-Katzenmodell mit Skelett, Gesichtsmorphs, Pfoten, Augenlidern und maßgeschneiderten Animationen.
2. Detaillierte 3D-Umgebungen und präzise Positionierung der Katze an Toilette, Wanne, Esstisch und Bett.
3. Eigene oder einzeln lizenzgeprüfte Tier-, Wasser-, Schritt- und Essensaufnahmen, inklusive Lautstärkeabgleich und Kinderlautstärkeschutz.
4. Drag-and-drop-Füttern, echtes Seifen-/Abspülspiel, Toilettenspülung per Tap, Kleidungsvorschau und umfangreichere Minispiele.
5. Echte Browser- und Touchscreen-Tests, Performanceprofiling, Barrierefreiheit und Offlinefähigkeit.

**Nicht als fertig bezeichnen**, bevor die visuelle und akustische Qualität sowie die Interaktionen auf echten Geräten nachgewiesen wurden.
