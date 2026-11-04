# SD Engine (Etappe 1)

Echte 3D-Spiel-Engine im SD Game-Studio, aufgebaut auf **Babylon.js 9.31.3** (Grafik) und **Havok 1.3.14** (Physik).
Beide sind kostenlos (Apache-2.0 / MIT) und werden über cdn.jsdelivr.net mit fester Version geladen.

- `index.html` – Spielseite mit Menü, HUD, Minikarte, Pause, Touch-Steuerung und **Skript-Editor**
- `sd-engine.js` – die Engine und die deutsche SD-API (`sd.gelaende`, `sd.haus`, `sd.gegner`, …)
- `spiele/inselsturm.js` – Beispielspiel „Inselsturm“ (Third-Person-Shooter, Battle-Royale-Modus), komplett als SD-Skript

## Was in Etappe 1 drin ist

| Bereich | Umsetzung |
|---|---|
| Grafik | PBR-Materialien, Himmel mit Farbverlauf, Umgebungslicht, Kaskaden-Schatten, ACES-Tonemapping, Bloom, FXAA, SSAO (Qualität „Hoch“) |
| Welt | Gelände 640 × 640 m mit Rauschen, Wasser, flache Dorfflächen, Wald als Instanzen, Felsen, begehbare Häuser (Tür, Fenster, Dachaufgang) |
| Physik | Havok: Spielfigur-Controller (Kollision, Steigungen, Springen), umschießbare Objekte, umfallende Gegner |
| Gameplay | 4 Waffen (Streuung, Rückstoß, Nachladen, Kopftreffer, Zielfernrohr), Beutekisten, Leben und Schutzweste, schrumpfende Zone, Sieg und Niederlage |
| Gegner-KI | Sichtprüfung per Strahl, Verfolgen, seitliches Ausweichen, Trefferchance je nach Entfernung und Bewegung, gehen in die Zone |
| Skript | SD-Skript = JavaScript + SD-API, im Spiel bearbeitbar, Fehler mit Zeilennummer, voller Babylon-Zugriff (`sd.BABYLON`) |

## Ehrliche Grenzen (noch nicht vorhanden)

- Figuren sind aus Grundformen gebaut. Eigene Modelle (.glb mit Animationen, z. B. von Mixamo) lassen sich mit `sd.modell()` laden, sind im Beispiel aber nicht eingebaut.
- Gegner haben keine Wegfindung (Navmesh) und kein Deckungsverhalten.
- Es gibt noch keine Fahrzeuge, keinen Mehrspieler-Modus und keinen visuellen Szenen-Editor für die Engine.
- Ein Spiel in der Größe von GTA oder PUBG entsteht damit nicht per Knopfdruck. Die Engine ist das Fundament für die nächsten Etappen.
- Getestet wurde in Chromium mit Software-Grafik (SwiftShader). Wie flüssig es auf einer echten Grafikkarte läuft, muss am Gerät geprüft werden.
