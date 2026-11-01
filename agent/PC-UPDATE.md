# SD Lotze: bestehende PC-Agent-Version und Online-Code-Studio synchronisieren

Der bestehende SD-Agent auf `http://localhost:8765` hat **„Nach Updates suchen“** und darin ein **Code-Studio**. Das ist die native PC-Version, nicht die zusätzliche Web-Desktop-Hülle in `agent/pc-online`.

## Warum PC- und Online-Code-Studio auseinanderlaufen können

Das Online-Code-Studio ist unter `studio/` abgelegt. Der verschlüsselte lokale PC-Agent wird dagegen als `agent/pc-agent/pc-<version>.enc` verteilt. Ein Online-GitHub-Pages-Update aktualisiert **nicht automatisch** die bereits ausgelieferte PC-ZIP-Datei. Nur ein **neues, freigegebenes PC-Paket** kann der bestehende PC-Updater installieren.

Der verwaltete Web-Agent `agent/app-<version>.enc` und die native PC-ZIP verwenden laut `agent/zugang.json` dieselbe Release-Version. Bitte die bestehenden Zugangs- und Update-Regeln des lokalen Agents beibehalten.

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
