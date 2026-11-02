# SD Code-Studio – automatische lokale Codeprüfung

Die KI-Werkstatt prüft ab jetzt ausgewählte Code-Dateien automatisch, nachdem aus einer
ChatGPT- oder Gemini-Antwort ein Dateipaket erkannt wurde.

Inspiriert von [Sourcery AI](https://docs.sourcery.ai/), insbesondere:
- zeilenbezogene Befunde und Verbesserungsratschläge;
- Schwerpunkt auf geänderten Zeilen;
- Priorisierung von Sicherheitsrisiken;
- Prüfung vor der Übernahme statt stiller automatischer Änderungen.

**Dies ist eine eigenständige regelbasierte Funktion, keine Sourcery-Installation,
kein Sourcery-Modell und kein vollständiger KI-Code-Review.** Sourcery wird nicht
aufgerufen und dessen proprietäre Regeln werden nicht kopiert.

## Verhalten

- Statische Prüfung ohne Netzwerk, ohne Ausführen und ohne Schreiben von Projektdateien.
- Mehrere Regeln für JavaScript/TypeScript, HTML und Python (u. a. eval, dynamisches
  innerHTML, Shell-Aufrufe, unsichere Deserialisierung, fehlende alt-Texte).
- Warnungen und Hinweise beziehen sich auf den geänderten Zeilenbereich.
  Einfache Zeilenvergleiche können bei Umordnungen zu ungenauen Bereichen führen.
- Potenzielle echte Zugangsschlüssel und vertrauliche Dateinamen werden in den gesamten
  ausgewählten Dateien gesucht; Werte werden im Bericht **nicht** angezeigt.
- Bei eindeutig erkannten Geheimnissen oder unvollständiger Datei-Prüfung sind sowohl
  Direkt-Import als auch Projektkopie-Import gesperrt.
- Bei anderen Warnungen können die Nutzer den Bericht prüfen und den bestehenden,
  bestätigungspflichtigen Import verwenden.
- Neue Analyse erfolgt bei Änderung der Dateiauswahl sowie vor jeder Übernahme.
- Vorhandene Versionssicherung, Projektkopien und Dateivergleich bleiben bestehen.

## Grenzen

Die statische Prüfung ist weder eine Sicherheitsgarantie noch ein Ersatz für
echte Builds, Laufzeit-/Browser-Tests, menschlichen Review oder eine SAST-Engine.
Sie erkennt nicht jedes Geheimnis und nicht jeden Fehler. Die Prioritäten spiegeln
lokale Regelheuristiken wider, nicht die KI-Bewertung von Sourcery.
Auch die übrigen vorhandenen Studio-Sicherheitsmechanismen sind weiterhin erforderlich.

## Tests

`node --test tests/studio/ki-code-review.test.cjs`

GitHub Actions: `.github/workflows/studio-tests.yml` führt diese Unit-Tests zusammen mit der bisherigen
JavaScript-Syntax- und Browserprüfung aus.
