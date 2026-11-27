# SD Hub

SD Hub ist eine Progressive Web App aus HTML, CSS und JavaScript, ohne Build-Schritt. Sie bündelt Helfer für Alltag, Lernen, Bewerbungen und eigene Software an einem Ort. Die laufende Seite ist [https://thesdhub.com](https://thesdhub.com).

Die Startseite (`index.html`) ordnet die Helfer in sieben Bereiche. Dazu kommt [Mein SD Hub](mein-sd-hub/) mit Wegweiser, Akademie, persönlichem Plan, Projektwerkstatt und Sprachtrainer. Ein Konto ist nur nötig, wenn Daten in der Cloud liegen sollen. Vieles bleibt auf dem Gerät.

## Bereiche auf der Startseite

**Deutsch & Lernen**

- Deutsch lernen, von der Alphabetisierung bis B1 (`deutsch/`)
- B1-Prüfung üben, Prüfungsablauf und Übungen im Papierformat
- SD Akademie: Deutsch, Computer, Beruf und Code (`mein-sd-hub/#akademie`)

**Arbeit & Zukunft**

- Bewerbung schreiben: Lebenslauf, Anschreiben, Deckblatt (`Lebenslauf_app.html`)
- Arbeiten in Deutschland (Visum- und Job-Wegweiser)
- Anerkennung ausländischer Abschlüsse
- Arbeit finden, Bewerbungs-Tracker, Gesprächstraining

**Briefe & Ämter**

- Post-Assistent (Briefe verstehen)
- Schreibstudio (Kündigung und Briefe)
- Fristen-Übersicht

**Finanzen & Verträge**

- Stundenzettel und Lohn
- Steuer-Helfer
- Rechnungen und Angebote
- Haushaltsbuch
- Verträge (Kosten und Kündigungsfristen)

**Dokumente & Fotos**

- Scanner und Passfoto (auf dem Handy, mit Kamera)
- PDF-Studio
- Dokumenten-Mappe mit Ablauf-Erinnerung
- Ordner aufräumen

**Wohnen & Zuhause**

- Messen und Maße (Kamera, Lineal, Flächen)
- Wohnungsbewerbung

**KI, Code & Design**

- KI-Assistent
- KI-Agent (nur mit Zugangsschlüssel)
- Code-Studio, inklusive Game-Studio
- Design-Studio

Über Mein SD Hub sind zusätzlich Pibo 3D (`kids/`) und weitere Spiele (`kids/games/`, darunter SD BlockWorld) erreichbar.

## Rückmeldungen

Die Datenerhebung für Nutzer-Feedback ist **ausgeschaltet**. Es werden keine Rückmeldungen gesendet, gespeichert oder veröffentlicht. Stand, Tests, Aktivierungsschritte und offene rechtliche Fragen: [docs/feedback-aktivierung.md](docs/feedback-aktivierung.md).

## Deployment

Die Website kommt von **GitHub Pages** aus dem Repository-Wurzelverzeichnis (Branch `main`). `CNAME` setzt die Adresse auf `thesdhub.com`. `.nojekyll` sorgt dafür, dass GitHub die Dateien so ausliefert, wie sie im Repository liegen, ohne Jekyll-Verarbeitung. Es gibt keinen separaten Pages-Build: HTML, CSS und JavaScript sind die veröffentlichte App.

**Firebase** (Projekt `sd-suite-2de37`) übernimmt Anmeldung, Firestore und Storage. Die Regeln stehen in `firebase/firestore.rules` und `firebase/storage.rules`. `firebase.json` verweist nur auf diese Regeln. Die Website selbst wird nicht über Firebase Hosting ausgeliefert. Wer sich mit Google anmeldet, kann Dateien zusätzlich im eigenen Google Drive ablegen (`sd-auth.js`).

## Lokal starten

Node oder ein anderer Bundler ist nicht nötig. Im Repository-Wurzelverzeichnis:

```sh
python3 -m http.server 8080
```

Dann [http://localhost:8080/](http://localhost:8080/) öffnen. Kamera und Mikrofon (Scanner, Passfoto, Messen) funktionieren auf `localhost`. Auf einem anderen Rechner im Netz verlangen Browser dafür HTTPS.

Firebase-Anmeldung und Online-KI brauchen eine Netzwerkverbindung und die im Code hinterlegte öffentliche Firebase-Konfiguration. Geheimnisse (Dienstkonten, API-Schlüssel der Nutzer) gehören nicht ins Repository.

## Prüfungen

Die Workflows unter `.github/workflows/` nutzen Node 22. Ohne Browser, für Pfade, Kurse und den Service Worker:

```sh
node tests/mein-sd-hub.test.cjs
node --test tests/mein-sd-hub-i18n.test.cjs tests/mein-sd-hub-fest.test.cjs tests/kurs-videos.test.cjs tests/akademie-lernen.test.cjs
node --test tests/hub-homepage.test.cjs tests/play-separation.test.cjs
node --test tests/deutsch-quality.test.cjs
node --test tests/feedback-*.test.cjs
node --test tests/hub/app-workspace.test.cjs
```

`tests/hub-homepage.test.cjs` prüft, dass jeder lokale Link der Startseite auf eine vorhandene Datei zeigt, einschließlich der drei Download-ZIPs. `tests/feedback-sw-cache.test.cjs` prüft, dass `sw.js` private Feedback-Antworten nicht zwischenspeichert. `tests/mein-sd-hub.test.cjs` prüft, dass die in Mein SD Hub genannten Werkzeug-URLs existieren.

Browserläufe (Playwright, in den Workflows mit `playwright@1.56.1` und Chromium):

```sh
npm install --no-save --no-package-lock playwright@1.56.1
npx playwright install --with-deps chromium
node tests/hub-homepage.browser.cjs
node tests/feedback-pages.browser.cjs
node tests/hub/dashboard.browser.cjs
node tests/hub/app-workspace.browser.cjs
```

Weitere gezielte Läufe stehen in den Workflows, unter anderem `mein-sd-hub-quality.yml`, `deutsch-quality.yml`, `feedback-security.yml`, `studio-tests.yml`, `pibo-smoke.yml`, `kids-browser.yml`, `nordhafen-test.yml` und `game-creator-tests.yml`. Pibo-Browser-Tests: `cd kids && npm install && npx playwright install --with-deps chromium && npm run test:e2e`.

## Downloads für den Computer

Die Startseite (`#downloads`) und `online-upload/index.html` verlinken drei Archive im Wurzelverzeichnis. Sie bleiben dort, damit diese Links und direkte Adressen wie `https://thesdhub.com/SD-Bewerbungsstudio-Windows.zip` weiter funktionieren.

| Datei | Größe |
| --- | --- |
| `SD-Bewerbungsstudio-Windows.zip` | 4.821.765 Bytes (ca. 4,8 MB) |
| `SD-Bewerbungsstudio-macOS.zip` | 4.820.792 Bytes (ca. 4,8 MB) |
| `SD-Bewerbungsstudio-Linux.zip` | 4.820.865 Bytes (ca. 4,8 MB) |

Jedes Archiv ist ein älterer Schnappschuss der Web-App plus ein Startskript für das jeweilige System. Ein großer Teil der Größe kommt aus `app/android-assets/` (Grafiken und eine `.aab`-Datei). Die frühere Angabe „~51 KB“ in der Paketnotiz war falsch. `SD-Bewerbungsstudio-Final-Windows.zip`, `SD-Bewerbungsstudio-USB-portabel.zip`, `SD-Bewerbungsstudio-alle-Plattformen.zip` und `SD-Bewerbungsstudio-Setup.exe` liegen nicht in diesem Repository.

`.gitignore` enthält `*.zip`, damit neue Archive nicht versehentlich dazukommen. Die drei genannten Dateien sind schon versioniert; Git ignoriert bereits verfolgte Dateien nicht nachträglich.

## Ältere Arbeitsnotizen

Status- und Planungsdokumente aus dem Wurzelverzeichnis liegen unter [docs/status/](docs/status/). Die Website, der Service Worker, die Manifeste, `CNAME` und die Workflows verweisen nicht darauf. Die korrigierte Paketnotiz ist [docs/status/README-FINAL-ENDEUTIG.md](docs/status/README-FINAL-ENDEUTIG.md).

## English summary

SD Hub is a static HTML/CSS/JS PWA at [https://thesdhub.com](https://thesdhub.com). GitHub Pages serves the repository root (`CNAME`, `.nojekyll`). Firebase project `sd-suite-2de37` provides auth, Firestore and Storage; it does not host the site. Run it locally with `python3 -m http.server 8080`. User feedback collection is off ([docs/feedback-aktivierung.md](docs/feedback-aktivierung.md)). The three download ZIPs in the repo root are about 4.8 MB each and stay there because the live homepage links to them. Older notes that said ~51 KB, or that listed extra Windows/USB packages, are outdated; those extra packages are not in the repo. Historical status write-ups are in `docs/status/`.
