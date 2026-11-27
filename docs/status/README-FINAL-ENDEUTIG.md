# SD Suite – Bewerbungsstudio + PDF Studio

**Hinweis (Stand 27.11.2026):** Dieses Dokument ist eine ältere Paketbeschreibung und liegt nur noch als Archiv unter `docs/status/`. Die Größenangabe „~51 KB“ war falsch. Im Repository liegen genau drei Download-Archive, jeweils etwa **4,8 MB**:

| Datei | Im Repository | Größe |
| --- | --- | --- |
| `SD-Bewerbungsstudio-Windows.zip` | ja, verlinkt von `index.html` und `online-upload/index.html` | 4.821.765 Bytes (ca. 4,8 MB) |
| `SD-Bewerbungsstudio-macOS.zip` | ja, ebenso verlinkt | 4.820.792 Bytes (ca. 4,8 MB) |
| `SD-Bewerbungsstudio-Linux.zip` | ja, ebenso verlinkt | 4.820.865 Bytes (ca. 4,8 MB) |
| `SD-Bewerbungsstudio-Final-Windows.zip` | nein | – |
| `SD-Bewerbungsstudio-USB-portabel.zip` | nein | – |
| `SD-Bewerbungsstudio-alle-Plattformen.zip` | nein | – |
| `SD-Bewerbungsstudio-Setup.exe` | nein | – |

Die drei vorhandenen Archive sind ein älterer Schnappschuss der Web-App plus ein Startskript. Einen großen Teil der Größe macht `app/android-assets/` aus (Play-Store-Grafiken und eine `.aab`-Datei), nicht ein 51-KB-Startskript. Die Schritte weiter unten zu EXE, Setup und USB-Stick beschreiben Pakete, die in diesem Repository nicht liegen.

**Version:** ältere Paketnotiz, kein aktueller Release-Stand  
**Plattformen der vorhandenen ZIPs:** Windows · macOS · Linux

---

## Was ist die SD Suite?

Die SD Suite besteht aus zwei vollständigen Web-Apps:

| App | Beschreibung |
|-----|-------------|
| **📋 SD Bewerbungsstudio** | Professionelle Bewerbungsunterlagen erstellen (Lebenslauf, Anschreiben, Deckblatt) |
| **📑 PDF & Anlagen Studio** | PDFs bearbeiten, annotieren, konvertieren und zusammenstellen |

---

## Pakete im Überblick

Die frühere Tabelle mit „~51 KB“ und zusätzlichen Final-/USB-/Vollpaketen gilt nicht mehr. Maßgeblich ist die korrigierte Tabelle am Anfang dieses Dokuments. Im Repository sind nur die drei ZIP-Dateien Windows, macOS und Linux, jeweils ca. 4,8 MB.

---

## Windows – So startest du die App

Diese beiden Optionen gehören zu Paketen, die **nicht** im Repository liegen (`SD-Bewerbungsstudio-Final-Windows.zip`, `SD-Bewerbungsstudio.exe`, `SD-Bewerbungsstudio-Setup.exe`). Das vorhandene Windows-Archiv heißt `SD-Bewerbungsstudio-Windows.zip`, enthält `SD-Bewerbungsstudio-Starten.bat` und `start-windows.ps1` und startet die mitgelieferte Web-App lokal im Browser.

### Option A: Direkt starten (keine Installation)
1. `SD-Bewerbungsstudio-Final-Windows.zip` entpacken
2. `SD-Bewerbungsstudio.exe` doppelklicken
3. Die App öffnet sich automatisch im Browser

### Option B: Installieren
1. `SD-Bewerbungsstudio-Setup.exe` ausführen
2. App wird in AppData installiert
3. Desktop-Verknüpfungen werden automatisch erstellt (Bewerbungsstudio + PDF Studio)

> **Hinweis:** Falls Windows eine Sicherheitswarnung zeigt → „Trotzdem ausführen" klicken.

---

## USB-Stick – Alle Plattformen

`SD-Bewerbungsstudio-USB-portabel.zip` liegt nicht in diesem Repository. Die folgenden Schritte sind eine alte Anleitung und lassen sich mit den Dateien hier nicht ausführen.

1. `SD-Bewerbungsstudio-USB-portabel.zip` entpacken → auf USB-Stick kopieren
2. Je nach Betriebssystem:
   - **Windows:** `USB-Starten-Windows.bat` doppelklicken
   - **macOS:** `USB-Starten-macOS.command` öffnen (Terminal-Berechtigung erforderlich)
   - **Linux:** `USB-Starten-Linux.sh` im Terminal ausführen
3. `STARTEN-HIER.html` öffnet sich im Browser mit Zugang zu beiden Apps

---

## PDF Studio – Funktionen

- ✏️ **Stift-Tool** – Freihand zeichnen in 5 Farben (Blau, Schwarz, Rot, Grün, Gelb + freie Auswahl)
- 📏 Strichstärken: Fein · Mittel · Dick
- 🔤 Text-Overlays mit Schriftart, Größe, Farbe, Fettdruck
- 🖊️ Signatur-Pad (direkt zeichnen und einfügen)
- 🔦 Markierung in 5 Farben
- ⬛ Schwärzen (Redaktionierung)
- 🔍 OCR (Texterkennung) mit Fortschrittsbalken (DE/EN)
- ↩️ Undo-Funktion (25 Schritte, Strg+Z)
- 📄 Seitenverwaltung: Drehen, Spiegeln, Duplizieren, Neu, Reihenfolge ändern
- 🔄 **Konvertierung:**
  - PDF → Word (.docx)
  - PDF → Excel (.xlsx)
  - PDF → PowerPoint (.pptx)
  - PDF → Bilder (JPG, PNG, ZIP)
  - Fotos / Word / Excel / PowerPoint → PDF
- 💾 Export: Druckqualität / Web / Kompakt

---

## Systemvoraussetzungen

- **Windows:** Windows 10 oder höher
- **macOS:** macOS 11 oder höher
- **Linux:** Aktuelle Distribution mit Browser
- **Browser:** Chrome, Firefox, Edge oder Safari (aktuell)
- Internet: Nur beim ersten Start für CDN-Bibliotheken (danach offline nutzbar)

---

## Kontakt / Support

Für Fragen oder Anpassungen bitte das Projekt entsprechend weiterentwickeln.
