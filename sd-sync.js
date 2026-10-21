/* SD Hub – Konto für die Bereiche (Rechnungen, Fristen, Verträge, Haushalt …)
   Freiwillig: Ohne Anmeldung bleibt alles nur auf dem Gerät (wie bisher).
   Mit Anmeldung werden die Daten der Bereiche im eigenen Konto gespeichert
   (Firebase Firestore, Pfad users/<uid>/bereiche/<schluessel>) und auf anderen
   Geräten nach der Anmeldung wiederhergestellt.

   Ablauf je Datenschlüssel:
   - lokale Änderung -> nach kurzer Pause hochladen
   - beim Anmelden / Öffnen: Konto-Stand neuer und hier nichts geändert -> übernehmen (Seite lädt neu)
   - beide geändert -> Hinweis mit Wahl „Konto-Daten nehmen“ / „Daten dieses Geräts behalten“ */
(function () {
    'use strict';
    const KEYS = ['sdRechnungen', 'sdFristenEigene', 'sdVertraege', 'sdHaushalt', 'sdStunden', 'sdWohnung', 'sdAnerkennung',
        'sdBewerbungen', 'sdSteuerHelfer', 'sdSteuerFormularAngaben', 'sdMessen', 'sdArbeitenDE', 'sdPost', 'sdOrdnen', 'sdLearn'];
    const NAMEN = {
        sdRechnungen: ['Rechnungen', 'Invoices'], sdFristenEigene: ['Fristen', 'Deadlines'], sdVertraege: ['Verträge', 'Contracts'],
        sdHaushalt: ['Haushaltsbuch', 'Household budget'], sdStunden: ['Stundenzettel', 'Timesheet'], sdWohnung: ['Wohnungsbewerbung', 'Flat application'],
        sdAnerkennung: ['Anerkennung', 'Recognition'], sdBewerbungen: ['Bewerbungs-Tracker', 'Application tracker'], sdSteuerHelfer: ['Steuer-Helfer', 'Tax helper'],
        sdSteuerFormularAngaben: ['Steuer-Formulare', 'Tax forms'], sdMessen: ['Messen', 'Measuring'], sdArbeitenDE: ['Arbeiten in DE', 'Working in DE'],
        sdPost: ['Post-Assistent', 'Letter assistant'], sdOrdnen: ['Ordner aufräumen', 'Tidy up folders'],
        sdLearn: ['Deutsch lernen', 'Learn German']
    };
    const AUTH_URL = document.currentScript ? new URL('sd-auth.js?v=1', document.currentScript.src).href : '../sd-auth.js?v=1';
    const META = 'sdSyncMeta';
    const MAX_ZEICHEN = 900000;   // Firestore: max. 1 MB pro Eintrag
    const en = () => (window.SD_LANG || document.documentElement.lang || 'de') === 'en';
    const T = (de, enT) => en() ? enT : de;
    const name = (k) => (NAMEN[k] || [k, k])[en() ? 1 : 0];

    const roh = { get: Storage.prototype.getItem, set: Storage.prototype.setItem, del: Storage.prototype.removeItem };
    let meta;
    try { meta = JSON.parse(roh.get.call(localStorage, META) || '{}') || {}; } catch (e) { meta = {}; }
    if (!meta.k) meta.k = {};
    const metaSpeichern = () => { try { roh.set.call(localStorage, META, JSON.stringify(meta)); } catch (e) { /* voll */ } };
    const m = (k) => meta.k[k] || (meta.k[k] = { ts: 0, geaendert: false });

    let nutzer = null, uebernehme = false, timer = 0, status = '', fehler = '';
    const offen = new Set();

    // Alle Schreibzugriffe auf die Bereichs-Daten mitbekommen
    Storage.prototype.setItem = function (k, v) {
        roh.set.call(this, k, v);
        if (this === localStorage && KEYS.includes(k) && !uebernehme) merke(k);
    };
    Storage.prototype.removeItem = function (k) {
        roh.del.call(this, k);
        if (this === localStorage && KEYS.includes(k) && !uebernehme) merke(k);
    };
    function merke(k) {
        m(k).geaendert = true; metaSpeichern();
        if (!nutzer) return;
        offen.add(k);
        clearTimeout(timer);
        timer = setTimeout(hochladen, 1500);
        zeige(T('☁️ wird gespeichert …', '☁️ saving …'));
    }

    async function hochladen() {
        if (!nutzer || !window.SD_AUTH) return;
        const liste = [...offen]; offen.clear();
        try {
            for (const k of liste) {
                const wert = localStorage.getItem(k);
                const json = wert == null ? '' : wert;
                if (json.length > MAX_ZEICHEN) { fehler = T(name(k) + ': zu groß für das Konto (über 900 KB) – bleibt nur auf dem Gerät.', name(k) + ': too large for the account (over 900 KB) – stays on this device only.'); continue; }
                const ts = Date.now();
                await window.SD_AUTH.saveJSON('bereiche/' + k, { json, ts });
                Object.assign(m(k), { ts, geaendert: false });
            }
            metaSpeichern();
            zeige(fehler ? '⚠️' : T('☁️ im Konto gespeichert', '☁️ saved to account'));
            driveAutomatisch();
        } catch (e) {
            liste.forEach(k => offen.add(k));
            zeige('⚠️ ' + T('Speichern im Konto fehlgeschlagen', 'Saving to account failed'), fehlerText(e));
        }
    }

    function fehlerText(e) {
        try { return window.SD_AUTH.friendlyError(e); } catch (x) { return (e && e.message) || String(e); }
    }

    async function abgleichen() {
        if (!nutzer || !window.SD_AUTH) return;
        zeige(T('☁️ Abgleich …', '☁️ syncing …'));
        // anderes Konto als beim letzten Mal: alles hier gilt als „neu auf diesem Gerät“
        if (meta.uid !== nutzer.uid) {
            meta.uid = nutzer.uid;
            KEYS.forEach(k => { meta.k[k] = { ts: 0, geaendert: localStorage.getItem(k) != null }; });
            metaSpeichern();
        }
        const uebernehmen = [], konflikte = [];
        try {
            const alle = await Promise.all(KEYS.map(k => window.SD_AUTH.loadJSON('bereiche/' + k)));
            for (let i = 0; i < KEYS.length; i++) {
                const k = KEYS[i], wolke = alle[i];
                const lokal = localStorage.getItem(k);
                const mk = m(k);
                if (!wolke || !wolke.ts) { if (lokal != null) offen.add(k); continue; }
                if (wolke.ts === mk.ts) { if (mk.geaendert) offen.add(k); continue; }
                // Konto ist neuer als der letzte Abgleich dieses Geräts
                if (lokal === wolke.json) { Object.assign(mk, { ts: wolke.ts, geaendert: false }); continue; }
                if (!mk.geaendert || lokal == null) uebernehmen.push([k, wolke]);
                else konflikte.push([k, wolke]);
            }
        } catch (e) {
            zeige('⚠️ ' + T('Abgleich fehlgeschlagen', 'Sync failed'), fehlerText(e));
            return;
        }
        metaSpeichern();
        if (uebernehmen.length) setzeAusKonto(uebernehmen, !konflikte.length);
        if (konflikte.length) frageKonflikt(konflikte);
        if (offen.size) await hochladen(); else if (!konflikte.length) zeige(T('☁️ im Konto gespeichert', '☁️ saved to account'));
    }

    function setzeAusKonto(liste, neuLaden) {
        uebernehme = true;
        try {
            liste.forEach(([k, w]) => {
                if (w.json === '') localStorage.removeItem(k); else localStorage.setItem(k, w.json);
                Object.assign(m(k), { ts: w.ts, geaendert: false });
                offen.delete(k);
            });
        } finally { uebernehme = false; }
        metaSpeichern();
        if (neuLaden) {
            try { sessionStorage.setItem('sdSyncHinweis', liste.map(([k]) => name(k)).join(', ')); } catch (e) { /* egal */ }
            location.reload();
        }
    }

    function frageKonflikt(liste) {
        let box = document.getElementById('sdSyncKonflikt');
        if (box) box.remove();
        box = document.createElement('div');
        box.id = 'sdSyncKonflikt';
        box.innerHTML = '<b>' + T('Unterschiedliche Daten gefunden', 'Different data found') + '</b><p>' +
            T('Auf diesem Gerät und in deinem Konto sind verschiedene Stände für: ', 'This device and your account have different versions of: ') +
            '<b>' + liste.map(([k]) => name(k)).join(', ') + '</b>. ' + T('Welche sollen gelten?', 'Which should be kept?') + '</p>' +
            '<div><button type="button" data-w="konto">☁️ ' + T('Konto-Daten nehmen', 'Use account data') + '</button>' +
            '<button type="button" data-w="geraet">💻 ' + T('Daten dieses Geräts behalten', 'Keep this device’s data') + '</button></div>' +
            '<small>' + T('Die andere Version wird dabei ersetzt.', 'The other version will be replaced.') + '</small>';
        document.body.appendChild(box);
        box.addEventListener('click', async (e) => {
            const b = e.target.closest('[data-w]');
            if (!b) return;
            box.remove();
            if (b.dataset.w === 'konto') setzeAusKonto(liste, true);
            else { liste.forEach(([k]) => offen.add(k)); await hochladen(); }
        });
    }

    // ---------- Google Drive: Sicherung in der eigenen Drive ----------
    const DRIVE_PFAD = 'sicherung/sd-hub-daten.json';
    let driveStatus = '';
    async function driveVerbinden() {
        if (!window.SD_AUTH.hasDriveAccess) await window.SD_AUTH.connectGoogleDrive();
    }
    async function inDriveSichern(still) {
        const daten = {};
        KEYS.forEach(k => { const v = localStorage.getItem(k); if (v != null) daten[k] = v; });
        const inhalt = JSON.stringify({ app: 'SD Hub', version: 1, zeit: new Date().toISOString(), daten });
        await window.SD_AUTH.saveFile(DRIVE_PFAD, new Blob([inhalt], { type: 'application/json' }));
        meta.driveZeit = Date.now(); metaSpeichern();
        if (!still) driveStatus = '<span class="sd-ok">✓ ' + T('In Google Drive gesichert (Ordner „SD Suite Dateien“).', 'Saved to Google Drive (folder “SD Suite Dateien”).') + '</span>';
    }
    async function ausDriveLesen() {
        const url = await window.SD_AUTH.loadFileAsDataUrl(DRIVE_PFAD);
        const b64 = url.slice(url.indexOf(',') + 1);
        const text = new TextDecoder().decode(Uint8Array.from(atob(b64), c => c.charCodeAt(0)));
        const j = JSON.parse(text);
        if (!j || !j.daten) throw new Error(T('Keine SD-Hub-Sicherung gefunden.', 'No SD Hub backup found.'));
        return j;
    }
    // nach jedem Speichern im Konto auch in die Drive (wenn eingeschaltet und verbunden)
    let driveTimer = 0;
    function driveAutomatisch() {
        if (!meta.driveAuto || !nutzer || !window.SD_AUTH || !window.SD_AUTH.hasDriveAccess) return;
        clearTimeout(driveTimer);
        driveTimer = setTimeout(() => inDriveSichern(true).then(zeichnePanel).catch(() => {}), 4000);
    }
    const zeitText = (ms) => ms ? new Date(ms).toLocaleString(en() ? 'en-GB' : 'de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '–';
    function zeichnePanel() {
        const p = document.getElementById('sdSyncPanel');
        if (!p || !nutzer) return;
        const verbunden = window.SD_AUTH && window.SD_AUTH.hasDriveAccess;
        p.innerHTML = '<h4>☁️ ' + T('Deine Daten sichern', 'Back up your data') + '</h4>' +
            '<p><b>' + T('1. Im SD-Hub-Konto', '1. In your SD Hub account') + '</b> (Google Firebase): ' + (status ? status.replace(/^☁️\s*/, '') : '–') + '<br>' +
            T('Automatisch bei jeder Änderung – auf allen Geräten nach dem Anmelden verfügbar.', 'Automatic on every change – available on all devices after signing in.') + '</p>' +
            '<p><b>' + T('2. In deiner eigenen Google Drive', '2. In your own Google Drive') + '</b> – ' + T('eine Kopie aller Bereiche als Datei, die dir gehört.', 'a copy of all areas as a file that belongs to you.') +
            '<br>' + T('Letzte Sicherung: ', 'Last backup: ') + zeitText(meta.driveZeit) + (verbunden ? '' : ' · ' + T('Drive nicht verbunden', 'Drive not connected')) + '</p>' +
            '<div class="zeile"><button type="button" class="prim" data-d="sichern">⬆ ' + T('In Google Drive sichern', 'Save to Google Drive') + '</button><button type="button" data-d="laden">⬇ ' + T('Aus Google Drive laden', 'Load from Google Drive') + '</button></div>' +
            '<label><input type="checkbox" data-d="auto"' + (meta.driveAuto ? ' checked' : '') + '> <span>' + T('Nach jeder Änderung auch in Google Drive sichern (solange Drive verbunden ist – nach einem Neustart einmal auf „In Google Drive sichern“ tippen)', 'Also save to Google Drive after every change (while Drive is connected – after a restart tap “Save to Google Drive” once)') + '</span></label>' +
            (driveStatus ? '<p>' + driveStatus + '</p>' : '') +
            '<p>' + T('Dateien aus der Dokumenten-Mappe und Anhänge sind nicht enthalten.', 'Files from the document folder and attachments are not included.') + '</p>';
    }
    function panelUmschalten() {
        let p = document.getElementById('sdSyncPanel');
        if (p) { p.remove(); return; }
        p = document.createElement('div');
        p.id = 'sdSyncPanel';
        document.body.appendChild(p);
        const r = document.getElementById('sdSyncStatus').getBoundingClientRect();
        p.style.top = Math.round(r.bottom + 8) + 'px';
        driveStatus = '';
        zeichnePanel();
        p.addEventListener('change', (e) => { if (e.target.dataset.d === 'auto') { meta.driveAuto = e.target.checked; metaSpeichern(); } });
        p.addEventListener('click', async (e) => {
            const b = e.target.closest('button[data-d]');
            if (!b) return;
            try {
                if (b.dataset.d === 'sichern') {
                    driveStatus = T('Verbinde mit Google Drive …', 'Connecting to Google Drive …'); zeichnePanel();
                    await driveVerbinden(); driveStatus = T('Sichere …', 'Saving …'); zeichnePanel();
                    await inDriveSichern(false);
                } else if (b.dataset.d === 'laden') {
                    driveStatus = T('Verbinde mit Google Drive …', 'Connecting to Google Drive …'); zeichnePanel();
                    await driveVerbinden();
                    const j = await ausDriveLesen();
                    const keys = Object.keys(j.daten).filter(k => KEYS.includes(k));
                    driveStatus = T('Sicherung vom ', 'Backup from ') + zeitText(Date.parse(j.zeit)) + ': <b>' + keys.map(name).join(', ') + '</b>.<br>' +
                        T('Damit werden diese Bereiche auf diesem Gerät (und im Konto) ersetzt.', 'This replaces these areas on this device (and in the account).') +
                        '<br><button type="button" class="prim" data-d="uebernehmen">✓ ' + T('Sicherung übernehmen', 'Restore backup') + '</button>';
                    panelUmschalten.wartend = j;
                } else if (b.dataset.d === 'uebernehmen') {
                    const j = panelUmschalten.wartend; if (!j) return;
                    Object.keys(j.daten).filter(k => KEYS.includes(k)).forEach(k => localStorage.setItem(k, j.daten[k]));
                    if (offen.size) await hochladen();
                    try { sessionStorage.setItem('sdSyncHinweis', T('Google-Drive-Sicherung', 'Google Drive backup')); } catch (x) { /* egal */ }
                    location.reload(); return;
                }
            } catch (err) {
                driveStatus = '<span class="fehl">⚠️ ' + String(fehlerText(err)).replace(/[<>&]/g, '') + '</span>';
            }
            zeichnePanel();
        });
    }
    document.addEventListener('click', (e) => {
        const p = document.getElementById('sdSyncPanel');
        if (p && !p.contains(e.target) && e.target.id !== 'sdSyncStatus' && document.body.contains(e.target)) p.remove();
    });

    // ---------- Anzeige neben dem Anmelde-Knopf ----------
    function zeige(text, fehlerDetail) {
        status = text;
        const el = document.getElementById('sdSyncStatus');
        if (!el) return;
        el.textContent = nutzer ? text : '';
        el.setAttribute('aria-label', T('Speicherung: ', 'Storage: ') + text);
        el.title = fehlerDetail || fehler || '';
        el.hidden = !nutzer || !text;
    }

    function einbauen() {
        const st = document.createElement('style');
        st.textContent = '#sdAuthHost{display:flex;align-items:center;gap:6px;min-width:0}' +
            '#sdAuthHost #sdAuthBtn{padding:6px 10px;font-size:.8rem;white-space:nowrap;max-width:150px;overflow:hidden;text-overflow:ellipsis}' +
            '#sdSyncStatus{font:inherit;font-size:.72rem;color:#647482;white-space:nowrap;background:none;border:1px solid transparent;border-radius:8px;padding:4px 6px;cursor:pointer;max-width:170px;overflow:hidden;text-overflow:ellipsis}#sdSyncStatus:hover{border-color:#d8e0dc}' +
            '@media (max-width:560px){#sdSyncStatus{max-width:30px;padding:4px 2px}#sdAuthHost #sdAuthBtn{max-width:110px;padding:6px 8px}}' +
            '#sdSyncPanel{position:fixed;z-index:9998;right:12px;top:64px;width:min(360px,calc(100vw - 24px));background:#fff;border:1px solid #d8e0dc;border-radius:14px;box-shadow:0 12px 30px rgba(0,0,0,.18);padding:14px;font:14px/1.45 "Trebuchet MS",Verdana,sans-serif;color:#172a3a;display:grid;gap:10px}' +
            '#sdSyncPanel h4{margin:0;font-size:1rem}#sdSyncPanel p{margin:0;font-size:.82rem;color:#647482}#sdSyncPanel .zeile{display:flex;gap:6px;flex-wrap:wrap}' +
            '#sdSyncPanel button{border:1px solid #2f7d72;background:#fff;color:#1c4a42;border-radius:10px;padding:8px 10px;font:inherit;font-size:.85rem;font-weight:bold;cursor:pointer}#sdSyncPanel button.prim{background:#2f7d72;color:#fff}' +
            '#sdSyncPanel label{display:flex;gap:8px;align-items:flex-start;font-size:.84rem}#sdSyncPanel .sd-ok{color:#1f7a4d}#sdSyncPanel .fehl{color:#b42318}' +
            '#sdSyncKonflikt{position:fixed;left:12px;right:12px;bottom:calc(14px + env(safe-area-inset-bottom,0px));z-index:9999;max-width:520px;margin:0 auto;background:#fff;border:2px solid #2f7d72;border-radius:14px;padding:14px;box-shadow:0 10px 30px rgba(0,0,0,.2);font:14px/1.45 "Trebuchet MS",Verdana,sans-serif;color:#172a3a;display:grid;gap:8px}' +
            '#sdSyncKonflikt p{margin:0}#sdSyncKonflikt div{display:flex;gap:8px;flex-wrap:wrap}' +
            '#sdSyncKonflikt button{border:1px solid #2f7d72;background:#fff;color:#1c4a42;border-radius:10px;padding:9px 12px;font:inherit;font-weight:bold;cursor:pointer}' +
            '#sdSyncKonflikt button[data-w=konto]{background:#2f7d72;color:#fff}#sdSyncKonflikt small{color:#647482}' +
            '.sd-sync-info{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:9999;background:#172a3a;color:#fff;padding:10px 14px;border-radius:10px;font:13px "Trebuchet MS",Verdana,sans-serif;max-width:90vw}';
        document.head.appendChild(st);
        if (!document.getElementById('sdAuthHost')) {
            const host = document.createElement('div');
            host.id = 'sdAuthHost';
            const status = document.createElement('button');
            status.type = 'button';
            status.id = 'sdSyncStatus'; status.hidden = true;
            status.addEventListener('click', panelUmschalten);
            host.appendChild(status);
            const bar = document.querySelector('.topbar');
            const sprache = bar && bar.querySelector('.sd-lang-switch');
            if (bar) { bar.style.position = 'sticky'; bar.insertBefore(host, sprache || null); } else document.body.prepend(host);
        }
        // Hinweis nach dem Übernehmen aus dem Konto
        try {
            const h = sessionStorage.getItem('sdSyncHinweis');
            if (h) {
                sessionStorage.removeItem('sdSyncHinweis');
                const d = document.createElement('div');
                d.className = 'sd-sync-info';
                d.textContent = '☁️ ' + T('Aus deinem Konto geladen: ', 'Loaded from your account: ') + h;
                document.body.appendChild(d);
                setTimeout(() => d.remove(), 5000);
            }
        } catch (e) { /* egal */ }
        // Konto-Modul (Firebase) laden
        const s = document.createElement('script');
        s.type = 'module';
        s.src = AUTH_URL;
        document.head.appendChild(s);
    }

    function bereit() {
        window.SD_AUTH.onChange((u) => {
            const vorher = nutzer;
            nutzer = u || null;
            zeige(status);
            if (!nutzer) { const p = document.getElementById('sdSyncPanel'); if (p) p.remove(); }
            if (nutzer && (!vorher || vorher.uid !== nutzer.uid)) abgleichen();
        });
    }
    if (window.SD_AUTH) bereit(); else window.addEventListener('sd-auth-ready', bereit, { once: true });
    window.addEventListener('pagehide', () => { if (offen.size) hochladen(); });

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', einbauen); else einbauen();
    window.SDSync = { KEYS, jetzt: hochladen, abgleichen };
})();
