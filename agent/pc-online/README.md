# SD Lotze Online für den PC

Diese Desktop-App für Windows, macOS und Linux lädt die aktuelle Webversion von https://www.thesdhub.com/agent/index.html. Beim Start wird der Webcache geleert. Über **Ansicht → Online-Änderungen aktualisieren** kann man nach Bestätigung neu laden.

Im Verzeichnis `agent/pc-online` funktionieren `npm install`, `npm start`, `npm test` und `npm run dist`. Der Workflow `agent-pc-online.yml` erstellt herunterladbare Installer für alle drei Betriebssysteme.

**Wichtig:** Dies ist die aktuelle **Online-Version im Desktop-Fenster**, nicht der Ersatz für den bislang verschlüsselten, fortgeschrittenen lokalen PC-Agenten. Dessen zusätzliche lokale Funktionen erfordern weiterhin dessen Quellcode, einen neuen Build und die dafür vorgesehene Freigabe. Ein bestehender SD-Lotze-Zugang bleibt erforderlich. Internetzugang ist notwendig. Die App installiert keine Updates ohne Zustimmung; neu veröffentlichte Webfunktionen werden beim Neustart sichtbar.

Zum Aktualisieren der verschlüsselten Original-PC-Version müssen ein neues Online-Paket und ein tatsächlich neu gebautes PC-ZIP gemeinsam freigegeben werden. Der zugehörige Verwaltungsprozess liegt in `tools/agent_zugang.cjs`.
