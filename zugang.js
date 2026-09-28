/* ==========================================================
   SD Bewerbungsstudio - Zugangskontrolle & Kopierschutz
   ==========================================================
   WICHTIG, EHRLICH GESAGT: Diese App laeuft komplett im Browser der
   Besucher, ohne eigenen Server dahinter. Eine wirklich unknackbare
   Absicherung ist dadurch technisch nicht moeglich - wer sich mit
   Webentwicklung auskennt, kann sich über die Entwicklertools des
   Browsers grundsaetzlich jeden Code ansehen, der im Browser laeuft.
   Was hier eingebaut ist, ist trotzdem eine ernsthafte, sinnvolle
   Huerde fuer den ganz normalen Besucher:
     - Der Freischalt-Code ist kryptographisch signiert (HMAC-SHA256
       ueber die eingebaute Web-Crypto-Funktion des Browsers). Ohne das
       Geheimwort unten kann NIEMAND einfach irgendeinen Code raten
       oder selbst basteln - nur echte, mit dem Code-Generator erstellte
       Codes werden akzeptiert.
     - Rechtsklick, "Seitenquelltext anzeigen" und die gaengigsten
       Tastenkombinationen fuer die Entwicklertools sind blockiert.
   Wer wirklich will, kommt trotzdem an den Code heran (z. B. ueber das
   Browser-Menu statt Tastenkombination) - das ist bei jeder rein
   client-seitigen Loesung ohne eigenen Server so und laesst sich nicht
   zu 100% verhindern.
   ========================================================== */
(function () {
    'use strict';

    // Dieses Geheimwort MUSS exakt mit dem im Code-Generator
    // uebereinstimmen. Es steht in KEINER oeffentlich verlinkten Seite,
    // nur hier und im privaten Code-Generator. Wer es aendern moechte,
    // muss es an BEIDEN Stellen gleichzeitig aendern - sonst passen
    // alte und neue Codes nicht mehr zusammen.
    const SD_GEHEIM = 'SD-Bewerbungsstudio-Silvi-2026-x7Q';

    // Jede App setzt VOR dem Einbinden von zugang.js einmal
    // window.SD_APP = '<kennung>' (z. B. 'lebenslauf', 'pdfstudio',
    // 'scanner', 'passfoto'). Ein Freischalt-Code wird an genau DIESE
    // Kennung gebunden (siehe sdSigniere-Aufrufe unten) - ein Code fuer
    // 'lebenslauf' funktioniert dadurch NICHT automatisch auch fuer
    // 'pdfstudio' & Co., obwohl alle Apps auf derselben Domain laufen und
    // sich sonst denselben Speicher (localStorage) teilen wuerden. Fehlt
    // die Kennung (versehentlich vergessen), wird 'app' als Fallback
    // verwendet - besser ein erkennbar falscher Code als ein versehentlich
    // fuer alle Apps gueltiger.
    const APP = window.SD_APP || 'app';
    const APP_NAMEN = {
        lebenslauf: 'Bewerbung (Lebenslauf, Anschreiben, Mappe, ...)',
        pdfstudio: 'PDF Studio',
        scanner: 'SD Scanner',
        passfoto: 'Passfoto Studio',
        schreibstudio: 'SD Schreibstudio'
    };
    const APP_NAME = APP_NAMEN[APP] || 'diese App';

    const VOLL_TAGE = 30; // 1 Monat voller, uneingeschraenkter Zugriff
    const EINGESCHRAENKT_TAGE = 180; // danach 6 Monate eingeschraenkter Zugriff (kein Export, weniger Vorlagen)
    // Erst nach VOLL_TAGE + EINGESCHRAENKT_TAGE (hier: 7 Monate insgesamt)
    // kommt die volle Sperre (zeigeSperre) mit Freischalt-Code-Pflicht.
    // Testphase-Zeitpunkt und Freischaltung sind PRO APP gespeichert (siehe
    // APP oben) - jede App zaehlt ihre eigene Testphase unabhaengig von den
    // anderen. Nur die Geraete-ID bleibt bewusst app-uebergreifend gleich,
    // damit ein Kunde beim Kauf mehrerer Apps nicht mehrfach verschiedene
    // IDs durchgeben muss.
    const ERSTBESUCH_KEY = 'sdErstbesuch_' + APP;
    const ZUGANG_BIS_KEY = 'sdZugangBis_' + APP;
    const GERAETE_ID_KEY = 'sdGeraeteId';
    const KONTAKT_EMAIL = 'durrani.sulaiman@yahoo.de';

    // ---- Android: voruebergehend komplett kostenlos ----
    // Solange die Bezahlung/der Play-Store-Eintrag noch nicht fertig
    // eingerichtet sind, ist die App auf Android-Geraeten komplett frei
    // nutzbar (kein Testphasen-Ablauf, keine Sperre). Sobald alles bereit
    // ist, hier NUR den Wert auf "false" stellen - mehr nicht. Ab dann
    // bekommt jedes Android-Geraet, das eigentlich schon gesperrt waere,
    // einmalig ANDROID_GNADENFRIST_TAGE Tage Zeit, um zu kaufen, mit einem
    // deutlichen Hinweisbanner, bevor die normale Sperre greift.
    const ANDROID_AKTION_AKTIV = true;
    const ANDROID_GNADENFRIST_TAGE = 15;
    const IST_ANDROID = /Android/i.test(navigator.userAgent || '');
    const ANDROID_GNADENFRIST_KEY = 'sdAndroidGnadenfristBis_' + APP;

    // Jeder Rechner/Browser bekommt beim allerersten Besuch eine eigene,
    // zufaellige Geraete-ID, die dauerhaft lokal gespeichert bleibt. Ein
    // Freischalt-Code wird beim Erstellen an genau diese ID gebunden (siehe
    // sdCodePruefen unten) - kopiert man denselben Code auf einen anderen
    // Rechner, hat der eine andere Geraete-ID und der Code passt nicht mehr.
    function sdGeraeteId() {
        let id = localStorage.getItem(GERAETE_ID_KEY);
        if (!id) {
            id = Array.from(crypto.getRandomValues(new Uint8Array(8)))
                .map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
            localStorage.setItem(GERAETE_ID_KEY, id);
        }
        return id;
    }

    async function sdHmacKey() {
        const enc = new TextEncoder();
        return crypto.subtle.importKey(
            'raw', enc.encode(SD_GEHEIM),
            { name: 'HMAC', hash: 'SHA-256' },
            false, ['sign', 'verify']
        );
    }

    async function sdSigniere(nachricht) {
        const key = await sdHmacKey();
        const enc = new TextEncoder();
        const sig = await crypto.subtle.sign('HMAC', key, enc.encode(nachricht));
        return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // Wird auch vom privaten Code-Generator genutzt (dort als Kopie). Die
    // Geraete-ID des Zielrechners muss beim Erstellen bekannt sein (der
    // Kunde schickt sie einmalig) - der Code ist danach nur auf genau
    // diesem Rechner gueltig.
    async function sdCodeErstellen(geraeteId, gueltigTage, appKennung) {
        const ablauf = Date.now() + gueltigTage * 24 * 60 * 60 * 1000;
        const sigVoll = await sdSigniere(geraeteId + '|' + (appKennung || APP) + '|' + String(ablauf));
        const sigKurz = sigVoll.slice(0, 10).toUpperCase();
        return ablauf.toString(36).toUpperCase() + '-' + sigKurz;
    }
    window.sdCodeErstellen = sdCodeErstellen;
    window.sdGeraeteId = sdGeraeteId;

    // Jederzeit aufrufbar (auch waehrend der kostenlosen Testphase, nicht
    // erst wenn der Sperrbildschirm sowieso schon offen ist) - z. B. ueber
    // einen Button in der App, um die eigene Geraete-ID vorab herauszufinden
    // und weiterzugeben, bevor die Testphase ueberhaupt ablaeuft.
    function sdZeigeGeraeteId() {
        const vorhanden = document.getElementById('sd-geraete-info-overlay');
        if (vorhanden) return;
        const geraeteId = sdGeraeteId();
        const box = document.createElement('div');
        box.id = 'sd-geraete-info-overlay';
        box.innerHTML =
            '<div class="sd-zugang-box">' +
            '<h2>🔑 Deine Geräte-ID</h2>' +
            '<p>Schicke diese ID per E-Mail an <a href="mailto:' + KONTAKT_EMAIL +
            '?subject=Freischalt-Code%20SD%20Bewerbungsstudio&body=Meine%20Ger%C3%A4te-ID%3A%20' + geraeteId + '">' +
            KONTAKT_EMAIL + '</a>, damit dir ein passender Freischalt-Code erstellt werden kann.</p>' +
            '<code id="sd-geraete-id-info" style="display:block;font-size:1.1rem;font-weight:bold;' +
            'letter-spacing:1px;background:#f1f5f9;padding:10px;border-radius:6px;text-align:center;' +
            'margin:14px 0;color:#172a3a;">' + geraeteId + '</code>' +
            '<button id="sd-geraete-info-kopieren" type="button">📋 Kopieren</button>' +
            '<button id="sd-geraete-info-schliessen" type="button" style="background:#94a3b8;margin-top:8px;">Schließen</button>' +
            '</div>';
        document.body.appendChild(box);
        document.getElementById('sd-geraete-info-kopieren').addEventListener('click', function () {
            navigator.clipboard.writeText(geraeteId).then(() => {
                const alt = this.textContent;
                this.textContent = '✅ Kopiert!';
                setTimeout(() => this.textContent = alt, 1500);
            });
        });
        document.getElementById('sd-geraete-info-schliessen').addEventListener('click', () => box.remove());
    }
    window.sdZeigeGeraeteId = sdZeigeGeraeteId;

    // Ein Code passt entweder, wenn er speziell fuer DIESE App erstellt
    // wurde, oder wenn er ein Komplettpaket-Code ist (im Generator mit
    // "ALLE" statt einer einzelnen App-Kennung signiert - schaltet dadurch
    // jede einzelne App frei, die denselben Code bekommt).
    async function sdCodePruefen(code) {
        const teile = (code || '').trim().toUpperCase().replace(/\s+/g, '').split('-');
        if (teile.length !== 2) return null;
        const [ablaufB36, sigKurz] = teile;
        const ablauf = parseInt(ablaufB36, 36);
        if (!ablauf || isNaN(ablauf)) return null;
        const geraeteId = sdGeraeteId();
        for (const kennung of [APP, 'ALLE']) {
            const sigVoll = await sdSigniere(geraeteId + '|' + kennung + '|' + String(ablauf));
            if (sigVoll.slice(0, 10).toUpperCase() === sigKurz) {
                return ablauf < Date.now() ? 'abgelaufen' : ablauf;
            }
        }
        return null;
    }

    let erstbesuch = parseInt(localStorage.getItem(ERSTBESUCH_KEY) || '0', 10);
    if (!erstbesuch) {
        erstbesuch = Date.now();
        localStorage.setItem(ERSTBESUCH_KEY, String(erstbesuch));
    }

    // Liefert den aktuellen Status als Text: 'voll' (Testphase oder
    // gueltiger Freischalt-Code - alles nutzbar), 'eingeschraenkt' (Testphase
    // vorbei, aber die 6 Monate danach noch nicht - App bleibt nutzbar, aber
    // jede einzelne App entscheidet selbst, was sie in diesem Zustand sperrt,
    // z. B. Export/Download oder bestimmte Vorlagen), oder 'gesperrt' (auch
    // die 6 Monate vorbei, kompletter Sperrbildschirm bis zur Freischaltung).
    function sdStatus() {
        const zugangBis = parseInt(localStorage.getItem(ZUGANG_BIS_KEY) || '0', 10);
        if (zugangBis > Date.now()) return 'voll';

        const tageSeitErstbesuch = (Date.now() - erstbesuch) / 86400000;
        let regulaererStatus;
        if (tageSeitErstbesuch < VOLL_TAGE) regulaererStatus = 'voll';
        else if (tageSeitErstbesuch < VOLL_TAGE + EINGESCHRAENKT_TAGE) regulaererStatus = 'eingeschraenkt';
        else regulaererStatus = 'gesperrt';

        // Waehrend der Android-Gratis-Aktion zaehlt die Testphase im
        // Hintergrund zwar weiter (fuer den Tag, an dem die Aktion endet),
        // wirkt sich aber nicht aus - alles bleibt "voll".
        if (IST_ANDROID && ANDROID_AKTION_AKTIV) return 'voll';

        // Aktion vorbei, und die App waere jetzt eigentlich gesperrt:
        // einmalige Gnadenfrist statt sofortiger Sperre.
        if (IST_ANDROID && regulaererStatus === 'gesperrt') {
            let gnadenfristBis = parseInt(localStorage.getItem(ANDROID_GNADENFRIST_KEY) || '0', 10);
            if (!gnadenfristBis) {
                gnadenfristBis = Date.now() + ANDROID_GNADENFRIST_TAGE * 24 * 60 * 60 * 1000;
                localStorage.setItem(ANDROID_GNADENFRIST_KEY, String(gnadenfristBis));
            }
            return gnadenfristBis > Date.now() ? 'gnadenfrist' : 'gesperrt';
        }

        return regulaererStatus;
    }
    window.sdStatus = sdStatus;

    function hatZugang() {
        return sdStatus() !== 'gesperrt';
    }

    // Dezenter, nicht blockierender Hinweis fuer den 'eingeschraenkt'-Status -
    // im Gegensatz zu zeigeSperre() unten haelt das die App weiter benutzbar,
    // erinnert aber daran, dass man gerade im eingeschraenkten Modus ist.
    function sdZeigeEinschraenkungsHinweis() {
        if (document.getElementById('sd-einschraenkung-banner')) return;
        const geraeteId = sdGeraeteId();
        const banner = document.createElement('div');
        banner.id = 'sd-einschraenkung-banner';
        banner.innerHTML =
            '<span>🔓 Eingeschränkter Modus: Die volle Testphase ist vorbei. Manche Funktionen (z. B. Export/Download, weitere Vorlagen) sind erst mit Freischalt-Code wieder verfügbar.</span>' +
            '<button id="sd-einschraenkung-code-btn" type="button">Code eingeben</button>' +
            '<button id="sd-einschraenkung-schliessen" type="button" aria-label="Schließen">✕</button>';
        document.body.prepend(banner);
        document.getElementById('sd-einschraenkung-schliessen').addEventListener('click', () => banner.remove());
        document.getElementById('sd-einschraenkung-code-btn').addEventListener('click', zeigeSperre);
    }
    window.sdZeigeEinschraenkungsHinweis = sdZeigeEinschraenkungsHinweis;

    // Dezenter "gute Nachricht"-Hinweis, solange die Android-Gratis-Aktion
    // laeuft - schliessbar, blockiert nichts.
    function sdZeigeAndroidAktionsHinweis() {
        if (document.getElementById('sd-android-aktion-banner')) return;
        const banner = document.createElement('div');
        banner.id = 'sd-android-aktion-banner';
        banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:999998;background:#1c4a42;' +
            'color:#eafff5;padding:10px 14px;font-family:"Trebuchet MS",Verdana,sans-serif;font-size:0.85rem;' +
            'display:flex;align-items:center;gap:10px;flex-wrap:wrap;box-shadow:0 2px 10px rgba(0,0,0,.3);';
        banner.innerHTML =
            '<span style="flex:1 1 240px;">🎉 Aktuell für Android komplett kostenlos, solange wir die Bezahlung ' +
            'für den Play Store einrichten. Du wirst rechtzeitig informiert, bevor sich das ändert (dann mit ' +
            ANDROID_GNADENFRIST_TAGE + ' Tagen Zeit zum Kauf).</span>' +
            '<button id="sd-android-aktion-schliessen" type="button" aria-label="Schließen" ' +
            'style="width:auto;background:transparent;color:#eafff5;font-size:1rem;padding:2px 8px;border:0;cursor:pointer;">✕</button>';
        document.body.prepend(banner);
        document.getElementById('sd-android-aktion-schliessen').addEventListener('click', () => banner.remove());
    }
    window.sdZeigeAndroidAktionsHinweis = sdZeigeAndroidAktionsHinweis;

    // Deutlicher Hinweis waehrend der einmaligen Gnadenfrist, nachdem die
    // Android-Aktion beendet wurde - zeigt die verbleibenden Tage und einen
    // direkten Weg zur Freischaltung, sperrt aber noch nichts.
    function sdZeigeGnadenfristHinweis() {
        if (document.getElementById('sd-gnadenfrist-banner')) return;
        const gnadenfristBis = parseInt(localStorage.getItem(ANDROID_GNADENFRIST_KEY) || '0', 10);
        const tageUebrig = Math.max(1, Math.ceil((gnadenfristBis - Date.now()) / 86400000));
        const banner = document.createElement('div');
        banner.id = 'sd-gnadenfrist-banner';
        banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:999998;background:#5c1a1a;' +
            'color:#ffe9e9;padding:10px 14px;font-family:"Trebuchet MS",Verdana,sans-serif;font-size:0.85rem;' +
            'display:flex;align-items:center;gap:10px;flex-wrap:wrap;box-shadow:0 2px 10px rgba(0,0,0,.3);';
        banner.innerHTML =
            '<span style="flex:1 1 240px;">⏳ Die kostenlose Android-Aktion ist beendet. Du hast noch ' + tageUebrig +
            ' Tag(e) Zeit, ' + APP_NAME + ' zu kaufen - danach wird die App gesperrt.</span>' +
            '<button id="sd-gnadenfrist-code-btn" type="button" ' +
            'style="width:auto;padding:6px 12px;border-radius:6px;border:0;font-weight:bold;cursor:pointer;' +
            'font-size:0.8rem;background:#2f7d72;color:#fff;">Jetzt freischalten</button>';
        document.body.prepend(banner);
        document.getElementById('sd-gnadenfrist-code-btn').addEventListener('click', zeigeSperre);
    }
    window.sdZeigeGnadenfristHinweis = sdZeigeGnadenfristHinweis;

    function zeigeSperre() {
        if (document.getElementById('sd-zugang-overlay')) return;
        const overlay = document.createElement('div');
        overlay.id = 'sd-zugang-overlay';
        const geraeteId = sdGeraeteId();
        overlay.innerHTML =
            '<div class="sd-zugang-box">' +
            '<h2>🔒 Zugang freischalten</h2>' +
            '<p>Die kostenlose Testphase ist abgelaufen. Bitte gib deinen Freischalt-Code ein, um weiterzumachen.</p>' +
            '<div class="sd-preise">' +
            '<strong>Nur ' + APP_NAME + ':</strong>' +
            '<div class="sd-preis-zeile"><span>6 Monate</span><span>30 €</span></div>' +
            '<div class="sd-preis-zeile"><span>1 Jahr</span><span>50 €</span></div>' +
            '</div>' +
            '<div class="sd-preise sd-preise-paket">' +
            '<strong>🎁 Komplettpaket – alle Apps zusammen:</strong>' +
            '<div class="sd-preis-zeile"><span>6 Monate, alle Apps</span><span>50 €</span></div>' +
            '<div class="sd-preis-zeile"><span>1 Jahr, alle Apps</span><span>80 €</span></div>' +
            '<small>Spart gegenüber Einzelkauf aller Apps deutlich – ein Code schaltet dann Bewerbung, PDF Studio, Scanner und Passfoto Studio zusammen frei.</small>' +
            '</div>' +
            '<small style="display:block;margin:8px 0 -4px;color:#64748b;">Zahlungsabwicklung befindet sich aktuell noch in der Testphase – schreib uns einfach per E-Mail, wir sagen dir, wie die Zahlung im Moment abläuft.</small>' +
            '<input type="text" id="sd-zugang-code" placeholder="z. B. K3F8A2-9B1C4D0E2A" autocomplete="off">' +
            '<button id="sd-zugang-btn" type="button">Freischalten</button>' +
            '<div id="sd-zugang-status"></div>' +
            '<div class="sd-geraete-box">' +
            '<small>Noch keinen Code? Schicke diese Geräte-ID per E-Mail an ' +
            '<a href="mailto:' + KONTAKT_EMAIL + '?subject=Freischalt-Code%20SD%20Bewerbungsstudio&body=Meine%20Ger%C3%A4te-ID%3A%20' + geraeteId + '">' + KONTAKT_EMAIL + '</a>:</small>' +
            '<code id="sd-geraete-id">' + geraeteId + '</code>' +
            '<button id="sd-geraete-kopieren" type="button">📋 Geräte-ID kopieren</button>' +
            '</div>' +
            '</div>';
        document.body.appendChild(overlay);
        document.getElementById('sd-zugang-btn').addEventListener('click', pruefeEingabe);
        document.getElementById('sd-zugang-code').addEventListener('keydown', e => {
            if (e.key === 'Enter') pruefeEingabe();
        });
        document.getElementById('sd-geraete-kopieren').addEventListener('click', function () {
            navigator.clipboard.writeText(geraeteId).then(() => {
                const alt = this.textContent;
                this.textContent = '✅ Kopiert!';
                setTimeout(() => this.textContent = alt, 1500);
            });
        });
        async function pruefeEingabe() {
            const code = document.getElementById('sd-zugang-code').value;
            const status = document.getElementById('sd-zugang-status');
            status.textContent = 'Prüfe ...';
            const ergebnis = await sdCodePruefen(code);
            if (ergebnis === null) { status.textContent = '❌ Ungültiger Code.'; return; }
            if (ergebnis === 'abgelaufen') { status.textContent = '❌ Dieser Code ist abgelaufen.'; return; }
            localStorage.setItem(ZUGANG_BIS_KEY, String(ergebnis));
            overlay.remove();
        }
    }

    const style = document.createElement('style');
    style.textContent =
        '#sd-zugang-overlay,#sd-geraete-info-overlay{position:fixed;inset:0;z-index:999999;background:rgba(15,23,42,.94);' +
        'display:flex;align-items:center;justify-content:center;padding:20px;}' +
        '.sd-zugang-box{background:#fffdf8;border-radius:14px;padding:28px;max-width:380px;width:100%;' +
        'box-shadow:0 20px 60px rgba(0,0,0,.4);font-family:"Trebuchet MS",Verdana,sans-serif;color:#172a3a;}' +
        '.sd-zugang-box h2{margin-top:0;}' +
        '.sd-zugang-box a{color:#2f7d72;font-weight:bold;word-break:break-all;}' +
        '.sd-preise{background:#f1f5f9;border-radius:8px;padding:12px;margin:12px 0;font-size:0.85rem;}' +
        '.sd-preise strong{display:block;margin-bottom:6px;font-size:0.8rem;text-transform:uppercase;color:#475569;}' +
        '.sd-preis-zeile{display:flex;justify-content:space-between;padding:3px 0;font-weight:bold;}' +
        '.sd-preise small{display:block;margin-top:8px;color:#64748b;font-weight:normal;}' +
        '.sd-preise-paket{background:#fff7e6;border:1px solid #e9c46a;}' +
        '.sd-preise-paket strong{color:#8a5a00;}' +
        '.sd-zugang-box input{width:100%;box-sizing:border-box;padding:10px;border:1px solid #d8e0dc;' +
        'border-radius:7px;margin:10px 0;font-size:1rem;text-transform:uppercase;}' +
        '.sd-zugang-box button{width:100%;padding:11px;background:#2f7d72;color:#fff;border:0;' +
        'border-radius:8px;font-weight:bold;cursor:pointer;font-size:0.95rem;}' +
        '#sd-zugang-status{margin-top:8px;font-size:.85rem;color:#b3261e;min-height:1.2em;}' +
        '.sd-geraete-box{margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;}' +
        '.sd-geraete-box small{color:#64748b;display:block;margin-bottom:8px;}' +
        '.sd-geraete-box code{display:block;font-size:1.05rem;font-weight:bold;letter-spacing:1px;' +
        'background:#f1f5f9;padding:8px;border-radius:6px;text-align:center;margin-bottom:8px;}' +
        '.sd-geraete-box button{background:#eef2ef;color:#172a3a;font-size:.8rem;padding:8px;}' +
        '#sd-einschraenkung-banner{position:fixed;top:0;left:0;right:0;z-index:999998;background:#3a2416;' +
        'color:#fdeecb;padding:10px 14px;font-family:"Trebuchet MS",Verdana,sans-serif;font-size:0.85rem;' +
        'display:flex;align-items:center;gap:10px;flex-wrap:wrap;box-shadow:0 2px 10px rgba(0,0,0,.3);}' +
        '#sd-einschraenkung-banner span{flex:1 1 240px;}' +
        '#sd-einschraenkung-banner button{width:auto;padding:6px 12px;border-radius:6px;border:0;' +
        'font-weight:bold;cursor:pointer;font-size:0.8rem;}' +
        '#sd-einschraenkung-code-btn{background:#2f7d72;color:#fff;}' +
        '#sd-einschraenkung-schliessen{background:transparent;color:#fdeecb;font-size:1rem;padding:2px 8px;}' +
        /* Kopierschutz: Text nicht markierbar/kopierbar, ausser in echten
           Eingabefeldern - sonst koennte man ja nicht mehr in die eigenen
           Formulare tippen oder in der Vorschau editieren. */
        'body{-webkit-user-select:none;user-select:none;}' +
        'input,textarea,[contenteditable="true"]{-webkit-user-select:text;user-select:text;}';
    document.head.appendChild(style);

    function sdPruefeUndZeigeStatus() {
        const status = sdStatus();
        if (status === 'gesperrt') zeigeSperre();
        else if (status === 'gnadenfrist') sdZeigeGnadenfristHinweis();
        else if (status === 'eingeschraenkt') sdZeigeEinschraenkungsHinweis();
        else if (IST_ANDROID && ANDROID_AKTION_AKTIV) sdZeigeAndroidAktionsHinweis();
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', sdPruefeUndZeigeStatus);
    } else {
        sdPruefeUndZeigeStatus();
    }

    // Einfache Kopierschutz-Massnahmen (siehe Hinweis ganz oben: das ist
    // eine Huerde fuer normale Besucher, keine absolute Sicherheit).
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('keydown', e => {
        const taste = e.key ? e.key.toUpperCase() : '';
        if (taste === 'F12') { e.preventDefault(); return; }
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (taste === 'I' || taste === 'J' || taste === 'C')) { e.preventDefault(); return; }
        if ((e.ctrlKey || e.metaKey) && taste === 'U') { e.preventDefault(); return; }
    });
})();
