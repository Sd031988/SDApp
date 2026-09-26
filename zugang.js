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

    const FREI_TAGE = 42; // 6 Wochen kostenlose Testphase
    const ERSTBESUCH_KEY = 'sdErstbesuch';
    const ZUGANG_BIS_KEY = 'sdZugangBis';
    const GERAETE_ID_KEY = 'sdGeraeteId';
    const KONTAKT_EMAIL = 'durrani.sulaiman@yahoo.de';

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
    async function sdCodeErstellen(geraeteId, gueltigTage) {
        const ablauf = Date.now() + gueltigTage * 24 * 60 * 60 * 1000;
        const sigVoll = await sdSigniere(geraeteId + '|' + String(ablauf));
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

    async function sdCodePruefen(code) {
        const teile = (code || '').trim().toUpperCase().replace(/\s+/g, '').split('-');
        if (teile.length !== 2) return null;
        const [ablaufB36, sigKurz] = teile;
        const ablauf = parseInt(ablaufB36, 36);
        if (!ablauf || isNaN(ablauf)) return null;
        const sigVoll = await sdSigniere(sdGeraeteId() + '|' + String(ablauf));
        const erwartet = sigVoll.slice(0, 10).toUpperCase();
        if (erwartet !== sigKurz) return null;
        if (ablauf < Date.now()) return 'abgelaufen';
        return ablauf;
    }

    let erstbesuch = parseInt(localStorage.getItem(ERSTBESUCH_KEY) || '0', 10);
    if (!erstbesuch) {
        erstbesuch = Date.now();
        localStorage.setItem(ERSTBESUCH_KEY, String(erstbesuch));
    }

    function hatZugang() {
        const inFreiPhase = (Date.now() - erstbesuch) < FREI_TAGE * 24 * 60 * 60 * 1000;
        if (inFreiPhase) return true;
        const zugangBis = parseInt(localStorage.getItem(ZUGANG_BIS_KEY) || '0', 10);
        return zugangBis > Date.now();
    }

    function zeigeSperre() {
        const overlay = document.createElement('div');
        overlay.id = 'sd-zugang-overlay';
        const resttageFrei = Math.max(0, FREI_TAGE - Math.floor((Date.now() - erstbesuch) / 86400000));
        const geraeteId = sdGeraeteId();
        overlay.innerHTML =
            '<div class="sd-zugang-box">' +
            '<h2>🔒 Zugang freischalten</h2>' +
            '<p>Die kostenlose Testphase ist abgelaufen. Bitte gib deinen Freischalt-Code ein, um weiterzumachen.</p>' +
            '<div class="sd-preise">' +
            '<strong>Preise:</strong>' +
            '<div class="sd-preis-zeile"><span>1 Monat</span><span>kostenlos</span></div>' +
            '<div class="sd-preis-zeile"><span>6 Monate</span><span>20 €</span></div>' +
            '<div class="sd-preis-zeile"><span>1 Jahr</span><span>30 €</span></div>' +
            '<small>Zahlungsabwicklung befindet sich aktuell noch in der Testphase – schreib uns einfach per E-Mail, wir sagen dir, wie die Zahlung im Moment abläuft.</small>' +
            '</div>' +
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
        /* Kopierschutz: Text nicht markierbar/kopierbar, ausser in echten
           Eingabefeldern - sonst koennte man ja nicht mehr in die eigenen
           Formulare tippen oder in der Vorschau editieren. */
        'body{-webkit-user-select:none;user-select:none;}' +
        'input,textarea,[contenteditable="true"]{-webkit-user-select:text;user-select:text;}';
    document.head.appendChild(style);

    if (!hatZugang()) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', zeigeSperre);
        } else {
            zeigeSperre();
        }
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
