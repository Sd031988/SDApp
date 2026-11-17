# SD Lotze PC-Agent und Online-Werkzeuge

## Neu (17.11.2026, abends): Gemini/Antigravity im Studio abbrechbar

- `_prozess()` startet gemini/agy abbrechbar (`job["proc"]`); `gemini_stopp` und `gemini_neu` beenden laufende Aufträge
  (Windows: `taskkill /F /T`). Studio: Knopf „⏹ Stopp“, „Neues Gespräch“ bricht eine hängende Antwort ab.
- „Live mit PC“ sitzt jetzt klein in der Statusleiste unten statt als schwebende Pille.

## Neu (17.11.2026, abends): Gemini-Modellliste aufgeräumt, 503-Überlastung

- `anbieter_modelle("gemini")` zeigt nur Chat-Modelle (`gemini-*`, ohne Live/Übersetzen/Computer-Use/Customtools/Antigravity-intern/
  Bild/Audio/Gemma/datierte Vorschauen); Cache im Fenster neu (v2).
- 503 „high demand“: bis zu 6 Gratis-Modelle von Gemini nacheinander (Reihenfolge 2.5-flash, flash-latest, x.y-flash, flash-lite, …);
  klare Meldung, dass es Andrang bei Google ist und nicht der Schlüssel. Fehlversuche (`c.versucht`) werden nach 10 Min. vergessen.

## Neu (17.11.2026, abends): Antigravity CLI / Google AI Pro (Version 20261117183755)

- „🖥 KI im Terminal“: **Antigravity CLI** (`agy`). Installation unter Windows mit dem offiziellen Google-Skript
  (`irm https://antigravity.google/cli/install.ps1 | iex`, landet in `%LOCALAPPDATA%\agy\bin\agy.exe`), erster Start meldet im Browser mit dem Google-Konto an (AI Pro).
  `_agy_befehl()` sucht PATH und übliche Orte (`~/.local/bin` …).
- Code-Studio, Tab „✦ GEMINI (PC)“: Auswahl **Gemini CLI / Antigravity (AI Pro)** (`motor` in `gemini_status`/`gemini_frage`).
  Antigravity läuft headless: `agy --output-format json --mode accept-edits [--conversation id] -p=<Text>` (agy.exe direkt, ohne Shell),
  agy nimmt den Text nur an -p (stdin geht nicht). Freigegebene Ordner kommen in `trustedWorkspaces` von `~/.gemini/antigravity-cli/settings.json`
  (nur wenn die Datei fehlt oder gültiges JSON ist). Befehle bleiben gesperrt (soft-deny), Hinweis im Chat. Geänderte Dateien per mtime.
- Agent-Einstellung „✦ Gemini-Hilfe“: Option **Antigravity (dein Google-AI-Pro-Abo)** – `gemini_hilfe` lässt dann agy die Dateien direkt ändern.
- Nicht mit echtem agy getestet (nur Attrappe): Flags laut antigravity.google/docs/cli/headless.

## Neu (17.11.2026, abends): Gemini-Hilfe für das lokale Modell (Version 20261117181812)

- Werkzeug `gemini_hilfe(auftrag, dateien, ordner, fehler)`: **eine** API-Anfrage pro Runde (`generateContent`, Schlüssel aus
  `~/.sd_ki_agent/gemini_api_key`, Header `x-goog-api-key`), Modell `gemini-flash-latest` (Ersatz `gemini-2.5-flash`), Pro nur per Einstellung.
- Gemini gibt vollständige Dateien im Format `=== DATEI: pfad === … === ENDE ===` zurück; geschrieben wird nur innerhalb des Projektordners
  (kein `..`, keine absoluten Pfade, nichts aus `VOM_HUB_VERBOTEN`, nichts mit „… rest unverändert“), mit Sicherung/Rückgängig.
- Das lokale Modell testet (build_run/check_preview) und ruft bei Fehlern erneut mit `fehler` auf; höchstens 5 Runden pro Auftrag.
- 429 → `GEMINI_LEER`: Hinweis im Chat, das lokale Modell macht allein weiter. Tageszähler `~/.sd_ki_agent/gemini_zaehler.json`,
  sichtbar in den Einstellungen („✦ Gemini-Hilfe für den Agenten: Flash/Pro/Aus“). Test-Schalter: `OLLAMA_LAUNCHER_GEMINI_API`.

## Neu (17.11.2026, abends): Agent-Browser live (Version 20261117180508)

- **Mauszeiger:** lila Pfeil (`#sd-agent-cursor`) gleitet zum Element, Klick-Welle vor dem Klick; Feld rot umrandet.
  Tippen Buchstabe für Buchstabe (`press_sequentially`, bis 200 Zeichen, sonst `fill`).
- **Live-Ansicht im Agent-Fenster** (`browserLive`, rechts, verkleinerbar zu „🌐 Agent-Browser live ansehen“): Auftrag, Adresse, Bild
  (JPEG, ca. jede Sekunde über `browser_live`, startet nie einen Browser), Schrittliste mit Uhrzeit. Öffnet sich bei Browser-Werkzeugen
  und bei `web_search`/`fetch_url`, wenn „Alles sichtbar machen“ an ist.
- **Pause – ich übernehme** (`browser_pause`): Browser-Werkzeuge warten (bis 15 Min.), bis der Nutzer „Weiter“ klickt; das nächste
  Ergebnis bekommt den Hinweis, dass der Nutzer die Seite selbst bedient hat. `browser_live`/`browser_pause` nur über `/__tool`.

## Neu (17.11.2026, spät): Agent-Browser zeigt alles (Version 20261117175641)

- Schalter im Dialog „🌐 Agent-Browser“: **„Alles sichtbar machen“** (Standard an, gespeichert als Fehlen von
  `~/.sd_ki_agent/browser_sichtbar_aus`; Werkzeug `browser_sichtbar` nur für die Oberfläche).
- Ist Playwright installiert und der Schalter an, laufen `web_search` (DuckDuckGo-HTML) und `fetch_url` (nur Webseiten, keine PDF/JSON/Dateien)
  im sichtbaren Agent-Browser statt unsichtbar per urllib; klappt das nicht, wird wie bisher im Hintergrund geladen.
- Jede Browser-Aktion holt den Tab nach vorn und blendet oben ein lila Band ein („🤖 SD KI-Agent: sucht nach …/klickt hier ↓/tippt …“);
  Felder und Knöpfe werden vor Klick/Eingabe kurz rot umrandet. Das Band wird beim Lesen ausgeblendet und landet nicht im Seitentext.

## Neu (17.11.2026, spät): Hilfe für kleine lokale Modelle (Version 20261117174953)

Damit kleine Modelle (bis 14B, z. B. Qwen 3.5 4B; Größe aus dem Namen, unbekannt = klein) im Agent-Modus zuverlässiger arbeiten:
- **Passende Werkzeuge:** `werkzeugAuswahl()` schickt nur Kern-Werkzeuge (Dateien, Befehle, Plan, Websuche) plus Gruppen, die zum Auftrag
  passen (Browser, GitHub, Hugging Face, Programme bauen/starten, Vorschau bei Bau-Aufträgen) und schon benutzte. Etwa 13–16 statt 33.
  Schalter in den Einstellungen: „Kleine Modelle: nur passende Werkzeuge mitschicken“ (an).
- **Aufrufe reparieren:** falsche Werkzeugnamen (`readfile`, `functions.read-file`) und Feldnamen (`file_path`, `old_str` …) werden
  zugeordnet, Typen angeglichen (Zahl/Wahrheitswert/Liste aus Text). Fehlen Pflichtfelder: nicht ausführen, sondern genaue Meldung mit Beispiel.
  Nach Fehlern ein kurzer „Korrigieren und erneut versuchen“-Hinweis; derselbe gescheiterte Aufruf ab dem 2. Mal: „anderen Weg nehmen“.
- **Nicht aufgeben:** Antwortet ein kleines Modell „Ich kann das nicht / kein Zugriff“, wird einmal mit der Werkzeugliste nachgehakt.
- **Pfade:** `run_tool` sucht bei „nicht gefunden“ ähnliche Pfade (Projektordner + nächster vorhandener Ordner). Lesen/Auflisten nimmt einen
  eindeutigen Treffer gleichen Namens direkt (mit Hinweis), `edit_file` schlägt nur vor. `edit_file` findet eine Stelle auch bei
  abweichenden Leerzeichen/Einrückung, wenn sie eindeutig ist, sonst zeigt es die ähnlichste Stelle.
- **Empfohlene Einstellungen je Modell** (nur ohne eigene Temperatur, Schalter in den Einstellungen): Qwen3/3.5 0.7/0.8/20 (mit Nachdenken
  0.6/0.95/20), Gemma 1.0/64/0.95, DeepSeek-R1 0.6/0.95, Llama 3 0.6/0.9, Mistral 0.15.
- Gilt für den Agenten im Fenster; die Hintergrund-Schleife in Python nutzt davon die Pfad-/Feld-Reparatur.

## Neu (17.11.2026, abends): Agent-Browser (Playwright)

- Knopf **„🌐 Agent-Browser“**: Status, **Installation mit einem Klick** (`browser_installieren` → `pip install --user playwright`, ohne Admin;
  unter Windows wird das vorhandene **Edge** gesteuert, kein Browser-Download; sonst Chrome bzw. `playwright install chromium`), Test.
- Werkzeuge für das Modell: `browser_oeffnen`, `browser_lesen`, `browser_klicken`, `browser_tippen`, `browser_taste`, `browser_scrollen`,
  `browser_zurueck`, `browser_schliessen`. Eigenes Profil `~/.sd_ki_agent/browser-profil` (getrennt von den Anmeldungen des Nutzers).
- **Regeln:** Passwort-/Zahlungs-/IBAN-Felder und Kartennummern lehnt `browser_tippen` ab. `browser_pruefen` erkennt Absenden/Kaufen/
  Löschen/Anmelden/Formular-Submit → die Oberfläche fragt dann **immer**, auch bei „Immer erlauben“. Seitentext wird als Information
  markiert, die Systemanweisung verbietet, Anweisungen von Webseiten zu folgen. Nur über `/__tool` (gleicher Ursprung), nie über `/__vom_hub`.
- Test-Schalter (nur Entwicklung): `SD_AGENT_BROWSER_HEADLESS=1`.

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
- Vertrauen (17.11.): Headless-Läufe setzen `GEMINI_CLI_TRUST_WORKSPACE=true` (sonst bricht Gemini in nicht vertrauten Ordnern ab). Deshalb darf die Webseite **keine** `.gemini/`, `.claude/`, `.codex/`, `.vscode/`-Dateien schreiben (`VOM_HUB_VERBOTEN`), sonst könnte ein Projekt Hooks/MCP-Server einschleusen.
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
