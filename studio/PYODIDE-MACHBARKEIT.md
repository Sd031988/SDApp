# Python im Browser: Machbarkeitsprüfung
Stand: 11. November 2026. Entscheidungsvorlage; Umsetzung wartet auf Freigabe.

## Empfehlung
Pyodide ist für Python-Grundlagen im Studio grundsätzlich geeignet. Empfehlung: eine fest versionierte, selbst gehostete Minimalinstallation in einem Module-Web-Worker. Erst beim ersten Python-Start laden; andere Programmiersprachen unverändert lassen. Noch keine Laufzeit und keinen Python-Kurs umbauen.

## Aktueller Code
In studio/studio.js sendet programmStarten Python über wbSenden an Wandbox. Der vorhandene Zustimmungsdialog weist auf die Code-Übertragung hin. Eingaben werden vorab gesammelt; Hauptdatei und weitere Dateien werden mitgeschickt. Ausgabe, Fehler und Dateizeilen erscheinen im Studio. Diese Funktionen müssen erhalten bleiben. Zusatzpakete und Fensterprogramme werden bereits gesondert behandelt.

## Größe und Handy-Ladezeit
Offizielle aktuelle Version: 314.0.7 (Release vom 14.09.2026). Das Core-Downloadarchiv hat 6.757.104 Bytes (ca. 6,44 MiB); die vollständige Distribution hat 337.536.678 Bytes (ca. 321,90 MiB). Die komplette Distribution soll nicht in die Website oder den normalen Service-Worker-Precache aufgenommen werden.

Archivgrößen sind keine Messung der vom Browser übertragenen Runtime-Dateien. HTTP-Kompression, benötigte Dateien, Cache, Pakete und Initialisierung verändern den tatsächlichen Aufwand. Selbst 6,76 MB würden bei 10 Mbit/s rechnerisch etwa 5,4 Sekunden reine Übertragungszeit benötigen; das ist keine gemessene Startzeit. Eine belastbare Handy-Ladezeit kann ich hier mangels Browser-/Gerätelaufzeit nicht angeben.

Vor Umsetzung/Abnahme messen: kalter und warmer Start auf Android Chrome und iPhone Safari, übertragenes Volumen, Initialisierungszeit, Speicher, schwache Verbindung und Verhalten bei Abbruch. Eine sichtbare Ladeanzeige, Wiederholen und Abbrechen sind erforderlich.

## Hosting und Offline
Selbsthosting ist technisch nicht zwingend: Die Dokumentation bietet einen CDN-Betrieb an. Für das Ziel ohne fremden Ausführungsdienst und für kontrollierbare Offline-Dateien empfehle ich Selbsthosting mit Versionsbindung und Lizenzhinweisen. WASM muss mit application/wasm ausgeliefert werden; Pfade und gegebenenfalls CORS müssen stimmen.

Die Basis benötigt unter anderem pyodide.mjs, pyodide.asm.mjs, pyodide.asm.wasm, python_stdlib.zip und pyodide-lock.json. Nur tatsächlich benötigte Pakete ergänzen. Offline funktioniert erst nach erfolgreichem Laden und Cachen sämtlicher benötigter Dateien. Beim ersten Besuch ohne Internet geht es nicht. Nachgeladenen Paketen, Browser-Speichergrenzen und Cache-Löschung muss die Oberfläche Rechnung tragen. Kein pauschales Offline-Versprechen.

## Umsetzung nach Freigabe
1. Python-Start separat verzweigen und Runtime lazy in einem Module-Web-Worker laden. Worker schützt die Oberfläche vor blockierenden Schleifen. Ein Stop-Knopf beendet den Worker; der nächste Start initialisiert neu.
2. Projektdateien in das virtuelle Dateisystem übertragen. stdout/stderr, vorab gesammelte Eingaben, Fehlerzeilen und relative Imports prüfen. Zwischen Läufen einen definierten, bereinigten Zustand herstellen.
3. Standardbibliothek zuerst unterstützen. Paketinstallation nur kontrolliert und nachvollziehbar ergänzen. Native Desktop-Pakete, Systemprozesse, beliebige lokale Dateien und tkinter-Fenster sind nicht allgemein kompatibel.
4. Wandbox nur als ausdrücklich gewählte Ausweichlösung anbieten. Bestehende Zustimmung zur Code-Übertragung erhalten; bei lokaler Ausführung niemals still an Wandbox senden.
5. Worker allein ist keine Sicherheitsgrenze gegen Zugriff auf Web-APIs oder JavaScript. Origin, CSP, Netzwerkzugriffe und gespeicherte Daten vor Freigabe der Ausführung untrusted Codes bewerten.
6. Tests: Ausgabe, Eingaben, Syntax-/Laufzeitfehler, mehrere Dateien, relative Imports, Endlosschleife stoppen, Neuinitialisierung, Ladefehler, Offline nach Cache, kein externer Ausführungsrequest bei lokalem Python und andere Sprachen unverändert.
7. Erst anschließend Python Grundlagen in Stufe 2 mit 8–10 eigenständig geschriebenen Lektionen, echten Aufgaben, plausiblen falschen Antworten und den bestehenden Qualitätsprüfungen ergänzen.

## Prüfstatus
Nur Code- und Quellenprüfung. Kein lokaler Browserstart, kein Pyodide-Prototyp und keine Handy-Messung. Dieser PR enthält ausschließlich den Bericht. Freigabe erforderlich, bevor Laufzeit oder Kurs geändert werden.

## Primärquellen
- [Deployment und notwendige Dateien](https://pyodide.org/en/stable/usage/downloading-and-deploying.html)
- [Web Worker und Module-Modus](https://pyodide.org/en/stable/usage/webworker.html)
- [FAQ: Dateisystem und Browsergrenzen](https://pyodide.org/en/stable/usage/faq.html)
- [Version 314.0.7 und Downloadgrößen](https://github.com/pyodide/pyodide/releases/tag/314.0.7)

## Freigegebene Umsetzung
Die Umsetzung wurde am 11.11.2026 freigegeben. Dieser PR enthält jetzt die selbst gehostete Minimalinstallation 314.0.7, einen frischen Module-Worker je Lauf, bytebasierten Downloadfortschritt bis 95 % und danach die Initialisierung bis 100 %. CacheStorage speichert die geprüften Runtime-Dateien für spätere Starts. Schlägt die Speicherung fehl oder wird der Cache gelöscht, ist Offline-Start nicht zugesichert.

Python läuft standardmäßig lokal. Nach einem Fehler kann die Person Wandbox ausdrücklich auswählen; vor der Übertragung von Code und Eingaben erscheint ein eigener Zustimmungsdialog. Andere Programmiersprachen behalten ihre bisherige Ausführung. Worker halten die Oberfläche bedienbar, sind aber keine Sicherheitsgrenze gegenüber Browser-Web-APIs: nur vertrauenswürdigen Quelltext ausführen. Python-Pakete werden nicht automatisch von fremden Servern installiert.

Der neue Kurs enthält acht Lektionen mit ausgearbeiteten Erklärungen, Testfällen für wechselnde Daten, Fehlbeispielen, je drei begründeten Quizfragen und einem Ausgabenplan mit JSON. Virtuelle Dateien sind pro Lauf flüchtig. Die Python-Prüfung verlangt tatsächliche Ausführung; Kommentare und bloß fest ausgegebene Beispielantworten reichen nicht.

Die lokale Shell ist inzwischen verfügbar: Akademie- und Studio-Node-Prüfungen wurden ausgeführt. Der lokale Chromium-Start scheitert an `socket() failed: Operation not permitted`; Browser-Messungen werden deshalb in GitHub Actions ermittelt und im PR berichtet. Ein Desktop-CI-Wert über lokalen HTTP ist keine Handy- oder Mobilfunkmessung.
