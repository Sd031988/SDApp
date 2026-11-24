# Rückmeldungen (Feedback): Stand und Aktivierung

Stand: 24.11.2026. Die Datenerhebung ist **ausgeschaltet**. Es werden keine Rückmeldungen gesendet, gespeichert oder veröffentlicht.

## Was gebaut und getestet ist

| Teil | Datei | Test |
|---|---|---|
| Einwilligung, Freigabe, Widerruf, öffentliche Ansicht | `feedback-server/domain.cjs` | `tests/feedback-domain.test.cjs` |
| Speicherfrist (90 Tage für nicht veröffentlichte Rückmeldungen) | `domain.cjs` (`isExpired`), `service.cjs` (`purgeExpired`) | `tests/feedback-retention.test.cjs` |
| HTTP-Schnittstelle: Herkunft, Größe, Honeypot, Anfragelimit (ohne Limit keine Annahme), Admin nur per geprüftem Token | `feedback-server/http.cjs` | `tests/feedback-http.test.cjs` |
| Kein Zwischenspeichern privater Antworten im Browser | `sw.js` | `tests/feedback-sw-cache.test.cjs` |
| Browser haben keinen Zugriff auf `feedbackPrivate` | `firebase/firestore.rules` | Textprüfung in `tests/feedback-sw-cache.test.cjs` |
| Vorschau des Formulars (4 Sprachen, nichts sendbar) | `docs/feedback-preview.html` | `tests/feedback-pages.browser.cjs` |
| Verwaltung für Admins | `docs/feedback-admin.html`, `docs/feedback-admin.js` | `tests/feedback-pages.browser.cjs` (mit nachgebautem Server) |

## Was ausdrücklich NICHT getestet ist

- **Firebase-Regeln im Emulator:** Der Firebase-Emulator war in der Arbeitsumgebung nicht verfügbar. Die Regeln sind nur als Text geprüft.
- **Echte Datenbank und echter Server:** Es gibt noch keinen laufenden Feedback-Server. `service.cjs` ist nur mit nachgebauter Datenbank getestet.
- **iPhone:** Getestet mit Chromium in iPhone-Größe und iPhone-Kennung, nicht mit echtem Safari auf einem iPhone.

## Schritte zur Aktivierung (nur durch den Betreiber)

1. **Server festlegen**, auf dem `feedback-server/` läuft (z. B. der vorhandene Render-Server). Dort einbinden: HTTPS, Firebase Admin SDK mit Dienstkonto als Umgebungsvariable (nie ins Repository), ein echtes Anfragelimit (`rateLimit`), täglicher Aufruf von `purgeExpired()`.
2. **Admin-Recht vergeben:** Mit dem Admin SDK beim eigenen Konto das Custom Claim `feedbackAdmin: true` setzen.
3. **Firebase-Regeln einspielen** (`firebase/firestore.rules`, `firebase/storage.rules`) in der Firebase-Konsole oder mit `firebase deploy --only firestore:rules,storage`.
4. **Datenschutzerklärung ergänzen** (Entwurf unten) und von einer Fachperson prüfen lassen.
5. **Formular aktivieren:** Vorschau durch das echte Formular ersetzen, `enabled: true` und eine Einwilligungsversion (`consentVersion`) setzen, Server-Adresse in `docs/feedback-admin.html` (`data-api`) eintragen.
6. Erst danach Testlauf mit einer eigenen Rückmeldung: senden, in der Verwaltung sehen, veröffentlichen, mit dem Code widerrufen, prüfen, dass sie weg ist.

## Was eine Fachperson (Anwalt oder Datenschutzberatung) prüfen sollte

- Einwilligungstexte in allen vier Sprachen: freiwillig, verständlich, getrennt für interne Nutzung und Veröffentlichung.
- Rechtsgrundlage (Art. 6 Abs. 1 lit. a DSGVO) und Nachweis der Einwilligung (gespeicherte Einwilligungsversion).
- Altersgrenze: Bestätigung „18 Jahre oder älter“; ob das für die Zielgruppe ausreicht.
- Speicherdauer 90 Tage für nicht veröffentlichte Rückmeldungen; Dauer für veröffentlichte Stimmen.
- Auftragsverarbeitung und Drittlandübermittlung: Google (Firebase) und der Server-Hoster (z. B. Render): Verträge, Standardvertragsklauseln oder Angemessenheitsbeschluss.
- Ob IP-Adressen beim Hoster protokolliert werden und wie lange.
- Darstellung veröffentlichter Stimmen: kein Eindruck von Werbung mit erfundenen oder ausgewählten Bewertungen (UWG).

## Entwurf für die Datenschutzerklärung (noch nicht veröffentlicht)

> **Rückmeldungen und Nutzerstimmen**
>
> Du kannst uns freiwillig eine Rückmeldung zum SD Hub schicken. Wir speichern dabei deine Antworten auf bis zu fünf Fragen, die gewählte Sprache, den Zeitpunkt, die Version des Einwilligungstextes und, nur wenn du die Veröffentlichung mit Vornamen erlaubst, deinen Vornamen. Wir fragen nicht nach E-Mail-Adresse oder Telefonnummer.
>
> Zweck: Wir wollen den SD Hub verbessern. Wenn du es ausdrücklich erlaubst, zeigen wir einen von dir freigegebenen Satz auf der Website, anonym oder mit Vornamen, erst nach Prüfung durch uns.
>
> Rechtsgrundlage ist deine Einwilligung (Art. 6 Abs. 1 lit. a DSGVO). Du kannst sie jederzeit ohne Nachteile widerrufen: mit dem Widerrufscode, den du nach dem Absenden bekommst, oder per E-Mail an die im Impressum genannte Adresse. Dann löschen wir die Rückmeldung vollständig.
>
> Speicherdauer: Nicht veröffentlichte Rückmeldungen löschen wir automatisch nach 90 Tagen. Veröffentlichte Stimmen bleiben sichtbar, bis du widerrufst oder wir sie entfernen.
>
> Empfänger: Die Daten liegen bei Google Cloud (Firebase Firestore) und werden über unseren Server verarbeitet ([Anbieter eintragen]). [Angaben zu Auftragsverarbeitung und Drittlandübermittlung nach Prüfung eintragen.]
>
> Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Beschwerde bei einer Aufsichtsbehörde (für uns: Landesbeauftragter für den Datenschutz und die Informationsfreiheit Baden-Württemberg).
