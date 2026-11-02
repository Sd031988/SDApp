SD CODE-STUDIO / CHATGPT-BRUECKE FUER WINDOWS 10/11
==================================================
Fehler 800A03EA: studio-bridge.js NICHT doppelklicken!
Die JS-Dateien sind Browser-Erweiterungsdateien.

1. ZIP vollstaendig entpacken.
2. Python 3.9+ installieren (falls nicht vorhanden).
3. START-WINDOWS.cmd doppelklicken.
4. "Erweiterung vorbereiten" anklicken.
5. Edge: edge://extensions oder Chrome: chrome://extensions.
6. Entwicklermodus -> Entpackte Erweiterung laden.
7. Den vom Assistenten angezeigten Erweiterungsordner waehlen.
8. Auf chatgpt.com Text markieren, rechtsklicken und ans Studio senden.
9. https://www.thesdhub.com/studio/ - Projekt starten und Code pruefen.

Ohne Python kann der entpackte Download-Ordner mit manifest.json direkt
als Browser-Erweiterung geladen werden. Python ist ein optionaler
Einrichtungsassistent mit lokalem Code-Export.

Keine API-Schluessel, keine automatische Anmeldung, keine Codeausfuehrung.
Dateien werden nur nach expliziter Bestaetigung gespeichert.
Diagnose: py -3 sd_bridge_windows.py --diagnose

Quellcode: https://github.com/Sd031988/SDApp/tree/main/studio/chatgpt-windows
Windows-/Browser-Ende-zu-Ende-Test muss noch am PC durchgefuehrt werden.
