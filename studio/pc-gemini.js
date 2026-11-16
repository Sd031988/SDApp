/* SD Code-Studio · Gemini (PC): Chat unten im Studio, Gemini CLI arbeitet im Hintergrund auf dem PC.
   Ablauf: Projekt an den SD KI-Agenten übergeben, Live-Abgleich starten (pc-terminal.js), einmalige Freigabe im
   Agenten-Fenster, dann Nachrichten an Gemini. Geänderte Dateien kommen über den Live-Abgleich ins Studio
   (vorher wird dort eine Version gesichert). Die Webseite kann nur Gemini im freigegebenen Projekt anstoßen. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const agentUrl = () => (window.SD_PC && window.SD_PC.agent) || 'http://localhost:8765';
  let ZUSTAND = { name: null, frei: false, job: null, verlauf: [] };

  async function hub(daten, ms) {
    const c = new AbortController(); const t = setTimeout(() => c.abort(), ms || 8000);
    try {
      const r = await fetch(agentUrl() + '/__vom_hub', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(daten), signal: c.signal });
      return await r.json();
    } finally { clearTimeout(t); }
  }
  const warte = ms => new Promise(r => setTimeout(r, ms));

  function status(text, art) { const o = $('gmStatus'); if (o) { o.textContent = text; o.dataset.art = art || ''; } }

  function blase(wer, text, extra) {
    const box = $('gmVerlauf'); if (!box) return null;
    const d = document.createElement('div'); d.className = 'gmMsg gm-' + wer;
    const k = document.createElement('div'); k.className = 'gmWer'; k.textContent = wer === 'du' ? 'Du' : wer === 'ki' ? 'Gemini' : 'Hinweis';
    const t = document.createElement('div'); t.className = 'gmText'; t.textContent = text;
    d.append(k, t); if (extra) { const e = document.createElement('div'); e.className = 'gmExtra'; e.textContent = extra; d.appendChild(e); }
    box.appendChild(d); box.scrollTop = box.scrollHeight; return t;
  }

  function knoepfe() {
    const verbunden = !!(ZUSTAND.name && ZUSTAND.frei && window.SDPcTerminal && SDPcTerminal.aktiv && S.p && S.p === ZUSTAND.projekt);
    $('gmVerbinden').hidden = verbunden;
    $('gmSenden').disabled = !verbunden || !!ZUSTAND.job;
    $('gmNeu').hidden = !verbunden;
    $('gmEingabe').disabled = !verbunden;
  }

  async function verbinden() {
    if (!S.p) { status('Bitte zuerst ein Projekt öffnen.', 'fehler'); return; }
    status('Verbinde mit dem SD KI-Agenten auf deinem PC …');
    let ping = null;
    try { ping = await hub({ aktion: 'ping' }, 2500); } catch (e) { ping = null; }
    if (!ping || !ping.ok) { status('Der SD KI-Agent ist nicht erreichbar. Starte ihn auf deinem PC (Desktop-Symbol) und klick dann noch einmal auf „Verbinden“. Fragt der Browser nach Zugriff aufs lokale Netzwerk: „Zulassen“.', 'fehler'); return; }
    if (!ping.gemini_chat) { status('Dein SD KI-Agent ist zu alt für den Gemini-Chat. Öffne ihn und klick auf „Nach Updates suchen“.', 'fehler'); return; }
    if (typeof speichernJetzt === 'function') await speichernJetzt();
    let j;
    try { j = await hub({ name: S.p.name, dateien: S.p.dateien }, 20000); } catch (e) { j = { error: String(e.message || e) }; }
    if (!j || !j.ok) { status('Übertragen ging nicht: ' + ((j && j.error) || '?'), 'fehler'); return; }
    ZUSTAND = { name: j.name, projekt: S.p, frei: false, job: null, verlauf: ZUSTAND.name === j.name ? ZUSTAND.verlauf : [] };
    if (window.SDPcTerminal) SDPcTerminal.starten(j.name);
    let st = await hub({ aktion: 'gemini_status', name: j.name });
    if (!st.installiert) { status('Gemini CLI ist auf deinem PC noch nicht installiert. Im SD KI-Agenten: „🖥 KI im Terminal“ → bei Gemini CLI „Installieren und starten“. Danach hier noch einmal „Verbinden“.', 'fehler'); knoepfe(); return; }
    if (!st.frei) {
      await hub({ aktion: 'gemini_anfragen', name: j.name });
      window.open(agentUrl() + '/?gemini_freigabe=1', 'sdagent');
      status('Bitte im Fenster des SD KI-Agenten auf „Erlauben“ klicken …');
      for (let i = 0; i < 120 && !st.frei; i++) {
        await warte(2000);
        try { st = await hub({ aktion: 'gemini_status', name: j.name }); } catch (e) { /* weiter warten */ }
        if (!st.angefragt && !st.frei) break;
      }
      if (!st.frei) { status('Nicht freigegeben. Mit „Verbinden“ kannst du es noch einmal versuchen.', 'fehler'); knoepfe(); return; }
    }
    ZUSTAND.frei = true;
    status('✓ Verbunden mit Gemini auf deinem PC – Projekt „' + j.name + '“.' + (st.schluessel ? '' : ' Hinweis: Kein Gemini-Schlüssel im Agenten gespeichert; dann nutzt Gemini deine Google-Anmeldung aus dem Terminal.'), 'ok');
    knoepfe(); $('gmEingabe').focus();
  }

  async function senden() {
    const text = $('gmEingabe').value.trim();
    if (!text || ZUSTAND.job) return;
    if (!S.p || S.p !== ZUSTAND.projekt) { ZUSTAND.frei = false; knoepfe(); status('Projekt gewechselt – bitte neu verbinden.', 'fehler'); return; }
    $('gmEingabe').value = '';
    blase('du', text);
    // Eigene Änderungen zuerst auf den PC bringen
    if (typeof speichernJetzt === 'function') await speichernJetzt();
    if (window.SDPcTerminal && SDPcTerminal._takt) { await SDPcTerminal._takt(); }
    let r;
    try { r = await hub({ aktion: 'gemini_frage', name: ZUSTAND.name, text }, 15000); } catch (e) { r = { error: String(e.message || e) }; }
    if (!r || !r.ok) {
      if (r && r.freigabe === false) { ZUSTAND.frei = false; knoepfe(); }
      blase('info', (r && r.error) || 'Senden ging nicht.'); return;
    }
    ZUSTAND.job = r.job; knoepfe();
    const warteText = blase('ki', 'Gemini arbeitet …');
    let e = null;
    while (ZUSTAND.job === r.job) {
      await warte(1500);
      try { e = await hub({ aktion: 'gemini_ergebnis', name: ZUSTAND.name, job: r.job }); } catch (x) { e = null; continue; }
      if (!e || e.error) { e = { status: 'fehler', fehler: (e && e.error) || 'Verbindung zum Agenten verloren.' }; break; }
      if (e.status !== 'läuft') break;
      if (warteText) warteText.textContent = 'Gemini arbeitet … ' + e.sekunden + ' s';
    }
    ZUSTAND.job = null;
    if (warteText) warteText.parentNode.remove();
    if (e && e.status === 'fertig') {
      const d = e.dateien || {};
      const extra = (d.plus || d.minus) ? 'Dateien geändert: +' + d.plus + ' / −' + d.minus + ' Zeilen – kommt gleich automatisch ins Studio (vorher wird eine Version gesichert).' : '';
      blase('ki', e.antwort || '(keine Textantwort)', extra);
      if (window.SDPcTerminal && SDPcTerminal._takt) setTimeout(() => SDPcTerminal._takt(), 300);
    } else blase('info', 'Fehler: ' + ((e && e.fehler) || 'unbekannt'));
    knoepfe(); $('gmEingabe').focus();
  }

  async function neu() {
    if (!ZUSTAND.name) return;
    try { await hub({ aktion: 'gemini_neu', name: ZUSTAND.name }); } catch (e) { /* egal */ }
    $('gmVerlauf').innerHTML = '';
    status('Neues Gespräch – Gemini hat das bisherige vergessen.', 'ok');
  }

  function bauen() {
    if (!$('gmVerbinden') || $('gmVerbinden').dataset.bereit) return;
    $('gmVerbinden').dataset.bereit = '1';
    $('gmVerbinden').onclick = verbinden;
    $('gmSenden').onclick = senden;
    $('gmNeu').onclick = neu;
    $('gmEingabe').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); senden(); } });
    setInterval(() => { if (ZUSTAND.frei && (!S.p || S.p !== ZUSTAND.projekt || !(window.SDPcTerminal && SDPcTerminal.aktiv))) { ZUSTAND.frei = false; knoepfe(); status('Verbindung getrennt – „Verbinden“ startet sie neu.'); } }, 2000);
    knoepfe();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bauen); else bauen();
  window.SDPcGemini = { verbinden, senden, neu, get zustand() { return ZUSTAND; } };
})();
