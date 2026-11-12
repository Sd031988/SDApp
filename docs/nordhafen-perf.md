# Nordhafen Ops – FPS-Messungen

Messskript: `tests/studio/nordhafen-ops-perf.cjs` (läuft in CI im Job `nordhafen-browser`, Ergebnis als Artefakt `nordhafen-ops-perf`).

## Wichtig zur Einordnung

- Gemessen wird in Headless-Chromium mit **SwiftShader** (Software-Rendering, keine Grafikkarte). Die absoluten Werte sagen **nichts** über echte Geräte aus. Sie taugen nur für den Vergleich vorher/nachher auf derselben Maschine.
- „Mobil" ist eine **Emulation** (393 × 852, DPR 3, iPhone-User-Agent, Touch). Das ist kein Test auf einem echten iPhone mit Safari.
- Ablauf je Gerät: Freie Stadt starten, SUV, einsteigen → 10 s geparkt im Auto (immer dieselbe Kameraansicht, bester Vergleichswert) → 30 s Fahrt mit Vollgas und abwechselndem Lenken.
- Die Fahrt-Werte hängen vom gefahrenen Weg ab (was im Bild ist). Ändert sich die Fahrphysik, ändert sich der Weg – die Fahrt-Werte sind deshalb nur grob vergleichbar.

## Phase 1 – Havok-Fahrphysik (12.11.2026, Sandbox, SwiftShader)

| Szenario | vorher (main `ceb98d2`) Ø / 1%-Low | nachher Ø / 1%-Low | Änderung Ø |
|---|---|---|---|
| Desktop 1920 × 1080, geparkt | 1,7 / 1,6 | 1,7 / 1,6 | 0 % |
| Desktop 1920 × 1080, Fahrt | 1,7 / 1,4 | 1,6 / 1,5 | −6 % |
| Mobil-Emulation, geparkt | 8,6 / 5,5 | 8,1 / 4,6 | −6 % |
| Mobil-Emulation, Fahrt | 7,5 / 5,7 | 6,2 / 4,3 | −17 % |

Bewertung: Im festen Szenario (geparkt) liegt der Unterschied bei 0–6 %. Bei der mobilen Fahrt sinkt der Wert um 17 %; dort fuhr das Auto aber einen anderen Weg (neue Physik, Kollisionen mit KI-Autos). Ob die Fahrphysik selbst auf echten Geräten messbar Leistung kostet, ist **nicht nachgewiesen** und muss auf einem echten iPhone und einem echten PC geprüft werden.
