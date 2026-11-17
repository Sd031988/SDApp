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
  const motor = () => ($('gmMotor') && $('gmMotor').value) || 'gemini';
  const motorName = () => motor() === 'antigravity' ? 'Antigravity' : 'Gemini';
  const fehltText = () => motor() === 'antigravity'
    ? 'Antigravity CLI ist auf deinem PC noch nicht installiert. Im SD KI-Agenten: „🖥 KI im Terminal“ → Antigravity CLI „Installieren und starten“ und im Browser mit deinem Google-Konto (AI Pro) anmelden.'
    : 'Gemini CLI ist auf deinem PC noch nicht installiert. Im SD KI-Agenten: „🖥 KI im Terminal“ → bei Gemini CLI „Installieren und starten“.';

  function status(text, art) { const o = $('gmStatus'); if (o) { o.textContent = text; o.dataset.art = art || ''; } befehleHinweis(); }

  // Hat der Nutzer im Agenten „Antigravity darf auch Befehle ausführen“ angekreuzt? -> sichtbar machen + Sperren-Knopf
  function befehleHinweis() {
    const o = $('gmStatus'); if (!o) return;
    let h = $('gmBefehle');
    let e = $('gmBefehleAn');
    const kannFragen = !ZUSTAND.befehle && ZUSTAND.frei && !ZUSTAND.pc && motor() === 'antigravity';
    if (kannFragen && !e) {
      e = document.createElement('button'); e.type = 'button'; e.id = 'gmBefehleAn'; e.textContent = 'Befehle erlauben …';
      e.title = 'Im SD KI-Agenten erlauben, dass Antigravity in diesem Projekt auch Befehle ausführt';
      e.style.cssText = 'font-size:11px;padding:0 8px;margin-left:8px;border-radius:999px;border:1px solid currentColor;background:transparent;color:inherit;cursor:pointer';
      e.onclick = befehleErlauben;
    }
    if (kannFragen) o.appendChild(e); else if (e) e.remove();
    if (!(ZUSTAND.befehle && motor() === 'antigravity')) { if (h) h.remove(); return; }
    if (!h) {
      h = document.createElement('span'); h.id = 'gmBefehle'; h.style.cssText = 'color:#f59e0b;margin-left:8px';
      h.innerHTML = '⚠ Antigravity darf hier auch Befehle ausführen. <button type="button" style="font-size:11px;padding:0 8px;border-radius:999px;border:1px solid currentColor;background:transparent;color:inherit;cursor:pointer">Befehle sperren</button>';
      h.querySelector('button').onclick = async () => { try { await hub({ aktion: 'gemini_befehle_aus', name: ZUSTAND.name }); } catch (e) { /* egal */ }
        ZUSTAND.befehle = false; befehleHinweis(); status('Befehle gesperrt – Antigravity darf hier wieder nur Dateien ändern.', 'ok'); };
    }
    o.appendChild(h);
  }

  function blase(wer, text, extra) {
    const box = $('gmVerlauf'); if (!box) return null;
    const d = document.createElement('div'); d.className = 'gmMsg gm-' + wer;
    const k = document.createElement('div'); k.className = 'gmWer'; k.textContent = wer === 'du' ? 'Du' : wer === 'ki' ? motorName() : 'Hinweis';
    const t = document.createElement('div'); t.className = 'gmText'; t.textContent = text;
    d.append(k, t); if (extra) { const e = document.createElement('div'); e.className = 'gmExtra'; e.textContent = extra; d.appendChild(e); }
    box.appendChild(d); box.scrollTop = box.scrollHeight; return t;
  }

  function knoepfe() {
    const abgleich = ZUSTAND.pc ? !!(window.SDPcOrdner && SDPcOrdner.aktiv) : !!(window.SDPcTerminal && SDPcTerminal.aktiv);
    const verbunden = !!(ZUSTAND.name && ZUSTAND.frei && abgleich && S.p && S.p === ZUSTAND.projekt);
    $('gmVerbinden').hidden = verbunden;
    $('gmSenden').disabled = !verbunden || !!ZUSTAND.job;
    const st = stoppKnopf(); if (st) st.hidden = !ZUSTAND.job && !ZUSTAND.haengt;
    $('gmNeu').hidden = !verbunden;
    $('gmEingabe').disabled = !verbunden;
  }

  function stoppKnopf() {
    let b = $('gmStopp');
    if (!b && $('gmSenden')) {
      b = document.createElement('button'); b.type = 'button'; b.id = 'gmStopp'; b.hidden = true; b.textContent = '⏹ Stopp';
      b.title = 'Laufende Antwort abbrechen'; b.onclick = stoppen;
      $('gmSenden').insertAdjacentElement('afterend', b);
    }
    return b;
  }

  async function stoppen() {
    if (!ZUSTAND.name) return;
    try { await hub({ aktion: 'gemini_stopp', name: ZUSTAND.name }); } catch (e) { /* egal */ }
    ZUSTAND.job = null; ZUSTAND.haengt = false; knoepfe();
    status('⏹ Gestoppt – du kannst eine neue Nachricht schreiben.', 'ok');
  }

  async function befehleErlauben() {
    const name = ZUSTAND.name; if (!name) return;
    await hub({ aktion: 'gemini_anfragen', name, erneut: true });
    window.open(agentUrl() + '/?gemini_freigabe=1', 'sdagent');
    status('Bitte im Fenster des SD KI-Agenten das Kästchen „Antigravity darf hier auch Befehle ausführen“ ankreuzen und „Erlauben“ klicken …');
    let st = null;
    for (let i = 0; i < 120; i++) {
      await warte(2000);
      try { st = await hub({ aktion: 'gemini_status', name, motor: motor() }); } catch (x) { continue; }
      if (!st.angefragt) break;
    }
    ZUSTAND.frei = !!(st && st.frei); ZUSTAND.befehle = !!(st && st.befehle); knoepfe();
    status(ZUSTAND.befehle ? '✓ Antigravity darf in diesem Projekt jetzt auch Befehle ausführen.' : (ZUSTAND.frei ? 'Befehle bleiben gesperrt – Antigravity darf nur Dateien ändern.' : 'Nicht freigegeben – bitte neu verbinden.'), ZUSTAND.frei ? 'ok' : 'fehler');
  }

  async function verbinden() {
    if (!S.p) { status('Bitte zuerst ein Projekt öffnen.', 'fehler'); return; }
    status('Verbinde mit dem SD KI-Agenten auf deinem PC …');
    let ping = null;
    try { ping = await hub({ aktion: 'ping' }, 2500); } catch (e) { ping = null; }
    if (!ping || !ping.ok) { status('Der SD KI-Agent ist nicht erreichbar. Starte ihn auf deinem PC (Desktop-Symbol) und klick dann noch einmal auf „Verbinden“. Fragt der Browser nach Zugriff aufs lokale Netzwerk: „Zulassen“.', 'fehler'); return; }
    if (!ping.gemini_chat || (motor() === 'antigravity' && !ping.antigravity)) { status('Dein SD KI-Agent ist zu alt dafür. Öffne ihn und klick auf „Nach Updates suchen“.', 'fehler'); return; }
    if (typeof speichernJetzt === 'function') await speichernJetzt();
    if (S.p.pc) {
      if (!(window.SDPcOrdner && SDPcOrdner.aktiv)) { status('Der PC-Ordner ist nicht verbunden. Links im Explorer auf 🔌 klicken und im SD KI-Agenten „Erlauben“, dann hier noch einmal „Verbinden“.', 'fehler'); return; }
      const name = 'ordner:' + SDPcOrdner.id;
      const st = await hub({ aktion: 'gemini_status', name, motor: motor() });
      if (!st.installiert) { status(fehltText(), 'fehler'); return; }
      ZUSTAND = { name, projekt: S.p, frei: !!st.frei, job: null, pc: true, verlauf: [], befehle: !!st.befehle };
      status(st.frei ? '✓ Verbunden – ' + motorName() + ' arbeitet im PC-Ordner „' + S.p.pc.name + '“.' + (st.schluessel || motor() === 'antigravity' ? '' : ' Hinweis: Kein Gemini-Schlüssel im Agenten gespeichert.') : 'Ordner nicht freigegeben – bitte neu verbinden.', st.frei ? 'ok' : 'fehler');
      knoepfe(); if (st.frei) $('gmEingabe').focus(); return;
    }
    let j;
    try { j = await hub({ name: S.p.name, dateien: S.p.dateien }, 20000); } catch (e) { j = { error: String(e.message || e) }; }
    if (!j || !j.ok) { status('Übertragen ging nicht: ' + ((j && j.error) || '?'), 'fehler'); return; }
    ZUSTAND = { name: j.name, projekt: S.p, frei: false, job: null, verlauf: ZUSTAND.name === j.name ? ZUSTAND.verlauf : [] };
    if (window.SDPcTerminal) SDPcTerminal.starten(j.name);
    let st = await hub({ aktion: 'gemini_status', name: j.name, motor: motor() });
    if (!st.installiert) { status(fehltText() + ' Danach hier noch einmal „Verbinden“.', 'fehler'); knoepfe(); return; }
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
    ZUSTAND.frei = true; ZUSTAND.befehle = !!st.befehle;
    status('✓ Verbunden mit ' + motorName() + ' auf deinem PC – Projekt „' + j.name + '“.' + (st.schluessel || motor() === 'antigravity' ? '' : ' Hinweis: Kein Gemini-Schlüssel im Agenten gespeichert; dann nutzt Gemini deine Google-Anmeldung aus dem Terminal.'), 'ok');
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
    if (ZUSTAND.pc) { if (window.SDPcOrdner) await SDPcOrdner.jetzt(); }
    else if (window.SDPcTerminal && SDPcTerminal._takt) { await SDPcTerminal._takt(); }
    let r;
    try { r = await hub({ aktion: 'gemini_frage', name: ZUSTAND.name, text, modell: ($('gmModell') && $('gmModell').value) || 'flash', motor: motor() }, 15000); } catch (e) { r = { error: String(e.message || e) }; }
    if (!r || !r.ok) {
      if (r && r.freigabe === false) { ZUSTAND.frei = false; knoepfe(); }
      if (r && r.laeuft) { ZUSTAND.haengt = true; knoepfe(); $('gmEingabe').value = text; }
      blase('info', (r && r.error) || 'Senden ging nicht.'); return;
    }
    ZUSTAND.job = r.job; ZUSTAND.haengt = false; knoepfe();
    const warteText = blase('ki', motorName() + ' arbeitet …');
    let e = null;
    while (ZUSTAND.job === r.job) {
      await warte(1500);
      try { e = await hub({ aktion: 'gemini_ergebnis', name: ZUSTAND.name, job: r.job }); } catch (x) { e = null; continue; }
      if (!e || e.error) { e = { status: 'fehler', fehler: (e && e.error) || 'Verbindung zum Agenten verloren.' }; break; }
      if (e.status !== 'läuft') break;
      if (warteText) warteText.textContent = motorName() + ' arbeitet … ' + e.sekunden + ' s';
    }
    const gestoppt = ZUSTAND.job !== r.job || (e && e.status === 'abgebrochen');
    if (ZUSTAND.job === r.job) ZUSTAND.job = null;
    if (warteText) warteText.parentNode.remove();
    if (gestoppt) { blase('info', '⏹ Abgebrochen.'); knoepfe(); return; }
    if (e && e.status === 'fertig') {
      const d = e.dateien || {};
      const extra = Array.isArray(d.liste) ? (d.liste.length ? 'Geänderte Dateien: ' + d.liste.join(', ') + (ZUSTAND.pc ? '' : ' – kommt gleich automatisch ins Studio.') : '') : (d.plus || d.minus) ? 'Dateien geändert: +' + d.plus + ' / −' + d.minus + ' Zeilen' + (ZUSTAND.pc ? ' – geöffnete Dateien werden gleich aktualisiert, neue Dateien siehst du im PC-Baum links.' : ' – kommt gleich automatisch ins Studio (vorher wird eine Version gesichert).') : '';
      blase('ki', e.antwort || '(keine Textantwort)', extra);
      if (ZUSTAND.pc) { if (window.SDPcOrdner) setTimeout(() => SDPcOrdner.jetzt(), 300); }
      else if (window.SDPcTerminal && SDPcTerminal._takt) setTimeout(() => SDPcTerminal._takt(), 300);
    } else {
      const f = (e && e.fehler) || 'unbekannt';
      const m = $('gmModell') ? $('gmModell').value : 'flash';
      blase('info', 'Fehler: ' + f + (motor() === 'antigravity' ? (/quota|limit|exhausted|rate/i.test(f) ? '\nTipp: Das Antigravity-Kontingent deines Abos ist gerade aufgebraucht – später wieder oder oben auf „Gemini CLI“ umstellen.' : '') : /model|modell|not found|404|permission|quota|429|billing/i.test(f) ? (m === 'hydrogen' || m === 'pro' ? '\nTipp: Hydrogen und Pro brauchen ein bezahltes Konto. Mit kostenlosem Schlüssel oben „Flash“ wählen.' : '\nTipp: Vielleicht sind die 250 kostenlosen Anfragen für heute aufgebraucht – morgen geht es wieder.') : ''));
    }
    knoepfe(); $('gmEingabe').focus();
  }

  async function neu() {
    if (!ZUSTAND.name) return;
    try { await hub({ aktion: 'gemini_neu', name: ZUSTAND.name }); } catch (e) { /* egal */ }
    ZUSTAND.job = null; ZUSTAND.haengt = false; knoepfe();
    $('gmVerlauf').innerHTML = '';
    status('Neues Gespräch – ' + motorName() + ' hat das bisherige vergessen (eine laufende Antwort wurde abgebrochen).', 'ok');
  }

  function bauen() {
    if (!$('gmVerbinden') || $('gmVerbinden').dataset.bereit) return;
    $('gmVerbinden').dataset.bereit = '1';
    $('gmVerbinden').onclick = verbinden;
    $('gmSenden').onclick = senden;
    $('gmNeu').onclick = neu;
    try { const m = localStorage.getItem('sdGeminiModell'); if (m && $('gmModell').querySelector('option[value="' + m + '"]')) $('gmModell').value = m; } catch (e) { /* egal */ }
    $('gmModell').onchange = () => { try { localStorage.setItem('sdGeminiModell', $('gmModell').value); } catch (e) { /* egal */ } };
    if ($('gmMotor')) {
      try { const m = localStorage.getItem('sdGeminiMotor'); if (m && $('gmMotor').querySelector('option[value="' + m + '"]')) $('gmMotor').value = m; } catch (e) { /* egal */ }
      const motorAnzeigen = () => { $('gmModell').hidden = motor() === 'antigravity'; };
      $('gmMotor').onchange = () => { try { localStorage.setItem('sdGeminiMotor', motor()); } catch (e) { /* egal */ } motorAnzeigen();
        if (ZUSTAND.frei) { ZUSTAND.frei = false; knoepfe(); status('Umgestellt auf ' + motorName() + ' – bitte „Verbinden“.'); } };
      motorAnzeigen();
    }
    // Chat-Bereich größer: unten mehr Platz, solange der Gemini-Tab offen ist (Wahl wird gemerkt, Standard: groß)
    let gross = true; try { gross = localStorage.getItem('sdGeminiGross') !== '0'; } catch (e) { /* egal */ }
    const feld = $('gmVerlauf').parentElement, haupt = $('haupt');
    const groesse = () => { const an = gross && !feld.hidden; if (haupt) haupt.classList.toggle('gmGross', an);
      $('gmGross').textContent = gross ? '⤡ Kleiner' : '⤢ Größer'; if (an) $('gmVerlauf').scrollTop = $('gmVerlauf').scrollHeight; };
    $('gmGross').onclick = () => { gross = !gross; try { localStorage.setItem('sdGeminiGross', gross ? '1' : '0'); } catch (e) { /* egal */ } groesse();
      if (typeof window.dispatchEvent === 'function') window.dispatchEvent(new Event('resize')); };
    new MutationObserver(() => { groesse(); window.dispatchEvent(new Event('resize')); }).observe(feld, { attributes: true, attributeFilter: ['hidden'] });
    groesse();
    $('gmEingabe').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); senden(); } });
    setInterval(() => { const ab = ZUSTAND.pc ? (window.SDPcOrdner && SDPcOrdner.aktiv) : (window.SDPcTerminal && SDPcTerminal.aktiv); if (ZUSTAND.frei && (!S.p || S.p !== ZUSTAND.projekt || !ab)) { ZUSTAND.frei = false; knoepfe(); status('Verbindung getrennt – „Verbinden“ startet sie neu.'); } }, 2000);
    knoepfe();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bauen); else bauen();
  window.SDPcGemini = { verbinden, senden, neu, get zustand() { return ZUSTAND; } };
})();
