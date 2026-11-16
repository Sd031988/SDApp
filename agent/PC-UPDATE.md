# SD Lotze PC-Agent und Online-Werkzeuge

## Neu (17.11.2026): PC-Ordner im Code-Studio (z. B. Unreal-Projekt)

Studio: Menü **„🖥 PC-Ordner öffnen (z. B. Unreal-Projekt)“** (`studio/pc-ordner.js`). Projekt „PC-<name>“ mit `pc:{id,name,pfad}`.
- `/__vom_hub`: `ordner_anfragen` (merkt nur eine Bitte vor, Token), `ordner_status`, `ordner_liste`, `ordner_lesen`, `ordner_datei`.
- Freigabe **nur in der Agent-Oberfläche**: Nutzer wählt den Ordner dort selbst (`ordner_waehlen`/Pfad) und klickt „Erlauben“
  (`ordner_freigeben` über `/__tool`). Gilt bis zum Neustart. Laufwerk-Wurzel und Benutzerordner werden abgelehnt.
- Lesen/Schreiben nur Textdateien (`ORDNER_TEXT_EXT`), max. 2 MB, Pfad-Prüfung per `realpath`, kein Löschen,
  keine ausführbaren Endungen beim Schreiben (`VOM_HUB_VERBOTEN`). Gemini darf im freigegebenen Ordner arbeiten (`name = "ordner:<id>"`).

## Neu (16.11.2026, nachts): Gemini im Hintergrund – Chat im Code-Studio

Im Studio unten Reiter **„✦ GEMINI (PC)“** (`studio/pc-gemini.js`): Projekt übergeben, Live-Abgleich starten, dann Chat.
- `/__vom_hub` kennt `gemini_status`, `gemini_anfragen`, `gemini_frage`, `gemini_ergebnis`, `gemini_neu`; `ping` meldet `gemini_chat: true`.
- **Ausnahme von „Webseite startet nichts“, eng begrenzt:** `gemini_frage` startet NUR `gemini` mit festen Argumenten
  (`-p "Bearbeite die Aufgabe aus der Eingabe." --approval-mode auto_edit -o json [-r latest]`) im Projektordner;
  der Nutzertext geht über **stdin**, nie über die Kommandozeile. Nur für Projekte, die der Nutzer **in der Agent-Oberfläche**
  per Klick freigegeben hat (`gemini_freigabe` über `/__tool`, gilt bis zum Neustart). `gemini_anfragen` merkt die Bitte nur vor.
- Modellwahl (17.11.): `modell` nur aus `GEMINI_MODELLE` (auto, hydrogen → `-m gemini-4-hydrogen`, flash, pro); alles andere wird abgelehnt.
- Ein Auftrag pro Projekt gleichzeitig, max. 20.000 Zeichen, 15 Minuten Zeitlimit. Schlüssel aus `gemini_schluessel` als `GEMINI_API_KEY`.

## Neu (16.11.2026, später): KI im Terminal in jedem Ordner + Gemini-Schlüssel

- Knopf **„🖥 KI im Terminal“** links in der Agent-Oberfläche (`kiTerminalWahl(null)`): Ordner frei wählen
  (`ordner_waehlen` öffnet einen tkinter-Dialog in eigenem Prozess) oder Pfad einfügen. `ki_terminal_oeffnen(..., ordner=)`
  prüft nur, dass der Ordner existiert; eigene Ordner haben **keinen** Live-Abgleich mit dem Studio.
- `gemini_schluessel(aktion=status|setzen|entfernen)`: speichert den Schlüssel in `~/.sd_ki_agent/gemini_api_key` (0600).
  Er wird beim Start nur als Umgebungsvariable `GEMINI_API_KEY` an Gemini CLI übergeben – **nie** in die .cmd-Datei,
  nie an die Webseite; `status` liefert nur die letzten 4 Zeichen; das `/__tool`-Protokoll zeigt `schluessel` als `***`.
- Beide Werkzeuge nur über `/__tool` (gleicher Ursprung), nicht über `/__vom_hub`.

## Neu (16.11.2026): KI im Terminal (Gemini CLI, Claude Code, Codex) mit Live-Abgleich

Im Code-Studio: Menü → **„🖥 KI im Terminal (Gemini, Claude, Codex – PC)“** (`studio/pc-terminal.js`).
1. Das Studio übergibt das Projekt wie bisher über `POST /__vom_hub` und öffnet `http://localhost:8765/?studio=<name>&terminal=1`.
2. In der **eigenen Oberfläche des Agenten** wählt der Nutzer Gemini CLI, Claude Code, Codex oder die Eingabeaufforderung.
   Die Werkzeuge `ki_terminal_status` und `ki_terminal_oeffnen` laufen nur über `/__tool` (gleicher Ursprung, `allowed()`).
   Es öffnet sich ein echtes Terminal-Fenster im Projektordner (`~/Ollama_Projekte/<name>`); fehlt das Programm, installiert
   der Knopf es mit `npm install -g` (braucht Node.js).
3. Live-Abgleich alle 2 s: `POST /__vom_hub` mit `{"aktion":"lesen","name","stand"}` (Textdateien lesen, ohne `.venv`,
   `node_modules`, `.alt` …) und `{"aktion":"datei","name","pfad","inhalt"|"loeschen"}` (eine Textdatei schreiben/löschen).

Regeln (bitte nicht aufweichen):
- Die Webseite darf über `/__vom_hub` nur **Dateien im übergebenen Projektordner** lesen und schreiben – **nie etwas starten**.
  Das Terminal öffnet ausschließlich die Agent-Oberfläche auf Nutzerklick.
- `aktion: datei` blockiert Pfade mit `..`, außerhalb des Projekts, in `.venv`/`node_modules`/`.alt` und ausführbare Endungen
  (`VOM_HUB_VERBOTEN`). Erlaubte Ursprünge bleiben `HUB_ORIGINS` + lokales Web-Studio.
- `ping` meldet `"sync": true`; ältere Agenten erkennt das Studio daran und bittet um „Nach Updates suchen“.

## Neu (04.11.2026): Online-Werkzeuge kommen automatisch auf den PC

Der PC-Agent (localhost:8765): Der Knopf **„💻 Code-Studio“** öffnet `http://localhost:8766/studio/` (dasselbe Studio wie online).
Das alte eingebaute Studio heißt jetzt **„🖥 Klassisches PC-Studio“** (auch über `http://localhost:8765/?studio=1`).
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
