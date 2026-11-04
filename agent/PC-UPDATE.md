# SD Lotze PC-Agent und Online-Werkzeuge

## Neu (04.11.2026): Online-Werkzeuge kommen automatisch auf den PC

Der PC-Agent (localhost:8765) hat den Knopf **„🧩 Online-Werkzeuge“**. Er öffnet `http://localhost:8766/studio/`.
Dort liefert der Agent die **aktuellen Dateien von thesdhub.com** aus (`studio/`, `design/`, `agent/zugang-krypto.js`,
`icon.svg`, `fonts/`) und speichert sie in `~/.ollama_launcher/web-cache` (offline nutzbar, neu geholt alle 10 Minuten).

**Für Änderungen am Online-Code-Studio heißt das:** Ein Push nach `studio/` oder `design/` erreicht die PC-Nutzer
**ohne neues PC-Paket**. Das verschlüsselte PC-Paket muss dafür nicht angefasst werden.

Regeln, damit das so bleibt:
- Port 8766 ist absichtlich ein **eigener Ursprung**: Code von der Webseite kann die Agent-Werkzeuge (`/__tool`) NICHT benutzen.
  Nur `POST http://localhost:8765/__vom_hub` (Projekt übergeben, nichts ausführen) ist erlaubt. Bitte nicht aufweichen.
- Im PC läuft dasselbe `studio/index.html`; der Agent setzt `window.SD_PC = {agent: 'http://localhost:8765'}`.
  `studio.js` nutzt das für: kein 10×-Limit, Übergabe-Adresse. Diese Prüfungen bitte erhalten.
- Nur relative Pfade innerhalb von `studio/` und `design/` funktionieren am PC; andere Hub-Seiten öffnen online.
- Der genaue Einfügen-Parser (`anleitungParsen`: Ordnerbaum, Dateinamen wie `app/main.py`, `requirements.txt`)
  hat Vorrang, wenn er mehr findet als der KI-Parser – bitte beide erhalten (Test: `tests/studio/browser.test.cjs`).

Hinweis: Das echte PC-Paket enthält nur `SD-KI-Agent/SD_KI_Agent.py` (+ Startdateien); das PC-Code-Studio ist darin eingebaut.
`tools/pc_studio_sync.py` erwartet einzelne Studio-Dateien im ZIP und passt deshalb nicht zum echten Paket.

# SD Lotze: bestehende PC-Agent-Version und Online-Code-Studio synchronisieren

Der bestehende SD-Agent auf `http://localhost:8765` hat **„Nach Updates suchen“** und darin ein **Code-Studio**. Das ist die native PC-Version, nicht die zusätzliche Web-Desktop-Hülle in `agent/pc-online`.

## Warum PC- und Online-Code-Studio auseinanderlaufen können

Das Online-Code-Studio ist unter `studio/` abgelegt. Der verschlüsselte lokale PC-Agent wird dagegen als `agent/pc-agent/pc-<version>.enc` verteilt. Ein Online-GitHub-Pages-Update aktualisiert **nicht automatisch** die bereits ausgelieferte PC-ZIP-Datei. Nur ein **neues, freigegebenes PC-Paket** kann der bestehende PC-Updater installieren.

Der verwaltete Web-Agent `agent/app-<version>.enc` und die native PC-ZIP verwenden laut `agent/zugang.json` dieselbe Release-Version. Bitte die bestehenden Zugangs- und Update-Regeln des lokalen Agents beibehalten.

## Geschütztes PC-Update in zwei Schritten

Der neue Update-Helfer ist für den **ursprünglichen lokalen Agenten** gedacht,
nicht für die separate PC-Online-Version.

Der Administratorschlüssel darf **nur über eine lokale Umgebungsvariable**
namens `ADMIN_CODE` übergeben werden. Niemals Schlüssel in GitHub, Dateien,
Workflow-Logs oder Issues speichern. Im Chat geteilte Schlüssel nach der
Verwendung erneuern.

1. Mit einem **privaten Ordner außerhalb des Repositories** vorbereiten:
   `node tools/agent_pc_update.cjs prepare /privater/ordner`
   (unter Windows beispielsweise `C:\SD-Lotze-Privat\pc-update`).
   Der Befehl entschlüsselt die Originaldateien nur lokal, gleicht die
   Studio-Dateien ab und stoppt bei unbekannter PC-ZIP-Struktur.
2. Die vorbereitete PC-ZIP in einer Testumgebung vollständig prüfen:
   ▶ Ausführen, Projekte, Chats, Design-Studio, lokale Agent-Funktionen und
   den alten Knopf „Nach Updates suchen“.
3. Nur **nach erfolgreich abgeschlossenem PC-Test** freigeben:
   `node tools/agent_pc_update.cjs release /privater/ordner --tested`.
   Der Helfer überprüft Datei-Prüfsummen und die Studio-Version und schreibt
   die neuen verschlüsselten Pakete in den lokalen Repository-Ordner.
4. **Anschließend über den autorisierten GitHub-Zugriff committen und pushen.**
   Erst dann kann der bisherige lokale Agent ein neues Update erhalten.
5. Den privaten Ordner mit entschlüsselten Dateien anschließend sicher löschen.

**Noch nicht durchgeführt:** Der neue Ablauf wurde in CI getestet, aber nicht
gegen das echte verschlüsselte PC-Originalpaket ausgeführt. Das Teilen des
Administratorschlüssels allein veröffentlicht keine PC-Aktualisierung.
## Sichere Aktualisierung

1. **Nur autorisierte Verwaltung:** Mit der vorhandenen Administrationsfunktion und einem nicht im Repository gespeicherten Admin-Schlüssel den aktuellen verschlüsselten Agenten **außerhalb des Repositories** entschlüsseln. Der geschützte PC-Quellcode ist hier nicht offen verfügbar.
2. **Lokale Dateistruktur prüfen:** Enthält das entschlüsselte `pc.zip` genau ein `studio/index.html` (ggf. unter einem Unterordner), kann der gezielte Abgleich genutzt werden. Falls der lokale Agent stattdessen ein eingebautes Studio ohne diese Ordnerstruktur hat: **Abbrechen und den Original-PC-Quellcode anpassen**.
3. Aktualisierte Studio-Dateien in **eine neue PC-ZIP** übernehmen:
   ```bash
   python3 tools/pc_studio_sync.py --zip /sicher/pc.zip --out /sicher/pc-aktualisiert.zip --studio studio
   ```
   Der Abgleich ersetzt nur vorhandene Studio-Dateien und ergänzt neue Studio-Assets im selben Ordner. Er erhält andere Agent-Dateien; die Original-ZIP wird nicht verändert. Prüfsumme und Zahl der aktualisierten Dateien werden ausgegeben.
4. Native PC-Anwendung und ihre Update-Funktion unter `localhost:8765` auf Windows testen; insbesondere Projekte, Chats, Code-Studio, Design-Studio, vorhandene Backups, Dateirechte und Online-Abgleich.
5. Erst nach erfolgreichem Test **Online- und neues PC-Paket zusammen freigeben**, mit dem vorhandenen `tools/agent_zugang.cjs verschluesseln`-Verfahren. Der Veröffentlichungsbefehl verlangt beide Dateien und verhindert ein unverändertes PC-Paket.
6. Auf dem bestehenden PC-Agenten **„Nach Updates suchen“** testen. Ob und wo der bestehende Updater neue Pakete lädt, muss anhand des geschützten Original-PC-Quellcodes verifiziert werden. Der neue Abgleich allein programmiert den bereits installierten Update-Mechanismus nicht um.

## Wichtige Grenzen

- **Kein Live-Update des bestehenden PC-Agenten wurde ausgeführt.** Für die endgültige Änderung sind die zugangsgeschützten PC-Quelltexte und eine autorisierte neue Veröffentlichung erforderlich.
- Kein neuer ChatGPT-, Gemini- oder GitHub-Login für den Nutzer allein wegen des Studio-Abgleichs.
- Keine vertraulichen Zugangsschlüssel, Passwörter, persönlichen Chat-Verläufe oder entschlüsselten Pakete in GitHub committen.
- Der synchronisierte Code kann eine andere Browser-/Serverumgebung erwarten. Daher müssen Vorschau, Service Worker, Pfade und Laufzeitrechte vor Freigabe im **bestehenden** PC-Agenten geprüft werden.
- Die gesonderte `pc-online`-Desktop-Hülle ist **nicht** der Ersatz für den fortgeschrittenen PC-Agenten.
