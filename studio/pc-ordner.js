/* SD Code-Studio · PC-Ordner (z. B. Unreal-Projekt) direkt bearbeiten.
   Der SD KI-Agent auf dem PC gibt einen Ordner frei, den der Nutzer DORT selbst gewählt und erlaubt hat.
   Das Studio zeigt den Ordner als Baum (lädt nur, was aufgeklappt wird), öffnet Textdateien (Code, .ini, .uproject …)
   und schreibt Änderungen zurück. Änderungen auf dem PC (z. B. von Gemini) kommen automatisch ins Studio,
   vorher wird eine Version gesichert. Binärdateien (.uasset, .umap …) bleiben im Unreal Editor. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const TAKT = 2000;
  const agentUrl = () => (window.SD_PC && window.SD_PC.agent) || 'http://localhost:8765';
  let V = null;   // { projekt, id, basis:{}, mt:{}, offen:Set, timer, laeuft, fehler, gesichertUm }

  async function hub(daten, ms) {
    const c = new AbortController(); const t = setTimeout(() => c.abort(), ms || 10000);
    try {
      const r = await fetch(agentUrl() + '/__vom_hub', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(daten), signal: c.signal });
      return await r.json();
    } finally { clearTimeout(t); }
  }
  const warte = ms => new Promise(r => setTimeout(r, ms));
  const istText = v => typeof v === 'string' && !/^data:(?!text\/)[^,]*;base64,/.test(v);
  const meldung = t => { if (typeof toast === 'function') toast(t); };
  const aktiv = () => !!(V && S.p && S.p === V.projekt && V.fehler < 3);

  /* ---------- Verbinden / Ordner wählen lassen ---------- */
  async function anfragen(hinweis) {
    let ping = null;
    try { ping = await hub({ aktion: 'ping' }, 2500); } catch (e) { ping = null; }
    if (!ping || !ping.ok) { meldung('Der SD KI-Agent auf deinem PC ist nicht erreichbar. Bitte starten (Desktop-Symbol) und noch einmal versuchen.'); return null; }
    if (!ping.pc_ordner) { meldung('Dein SD KI-Agent ist zu alt. Öffne ihn und klick auf „Nach Updates suchen“.'); return null; }
    const a = await hub({ aktion: 'ordner_anfragen', hinweis: hinweis || '' });
    if (!a || !a.ok) { meldung('Anfrage ging nicht: ' + ((a && a.error) || '?')); return null; }
    window.open(agentUrl() + '/?ordner_wahl=1', 'sdagent');
    infoZeigen('Bitte im Fenster des SD KI-Agenten den Ordner wählen und auf „Erlauben“ klicken …');
    for (let i = 0; i < 150; i++) {
      await warte(2000);
      let st; try { st = await hub({ aktion: 'ordner_status', token: a.token }); } catch (e) { continue; }
      if (!st || st.error) { infoZeigen('Anfrage abgelaufen – bitte noch einmal.'); return null; }
      if (st.abgelehnt) { infoZeigen('Abgelehnt.'); return null; }
      if (st.id) return st;
    }
    infoZeigen('Keine Antwort vom Agenten – bitte noch einmal versuchen.');
    return null;
  }

  async function oeffnen() {
    if (typeof speichernJetzt === 'function' && S.p) await speichernJetzt();
    const st = await anfragen('');
    if (!st) return;
    const basisName = 'PC-' + (typeof slug === 'function' ? slug(st.name) : st.name.replace(/[^\w-]+/g, '-'));
    let name = basisName, p = await projLesen(name), i = 2;
    while (p && !(p.pc && p.pc.pfad === st.pfad)) { name = basisName + '-' + i++; p = await projLesen(name); }
    if (!p) p = { name, dateien: {}, versionen: [], erstellt: Date.now() };
    p.pc = { id: st.id, name: st.name, pfad: st.pfad };
    await projSchreiben(p);
    await projektOeffnen(name);
    starten(true);
  }

  async function neuVerbinden() {
    if (!S.p || !S.p.pc) return;
    const st = await anfragen(S.p.pc.pfad);
    if (!st) return;
    S.p.pc = { id: st.id, name: st.name, pfad: st.pfad };
    await projSchreiben(S.p);
    starten(true);
  }

  /* ---------- Abgleich ---------- */
  function starten(neu) {
    stoppen();
    if (!S.p || !S.p.pc) return;
    V = { projekt: S.p, id: S.p.pc.id, basis: {}, mt: {}, offen: new Set(['']), laeuft: false, fehler: 0, gesichertUm: 0, erstAbgleich: true };
    for (const [pf, v] of Object.entries(S.p.dateien)) if (istText(v)) V.basis[pf] = v;
    V.timer = setInterval(takt, TAKT);
    panel(); baumLaden('');
    takt();
    if (neu) infoZeigen('');
  }
  function stoppen() { if (V) clearInterval(V.timer); V = null; }

  async function sichern(text) {
    if (Date.now() - V.gesichertUm < 60000 || typeof versionNeu !== 'function') return;
    V.gesichertUm = Date.now(); await versionNeu(text, true);
  }

  async function takt() {
    if (!V || V.laeuft) return;
    if (!S.p || S.p !== V.projekt) { stoppen(); panel(); return; }
    V.laeuft = true;
    try {
      const d = S.p.dateien;
      // 1. Änderungen im Studio -> PC
      for (const pf of Object.keys(d)) {
        if (!istText(d[pf]) || d[pf] === V.basis[pf]) continue;
        const r = await hub({ aktion: 'ordner_datei', id: V.id, pfad: pf, inhalt: d[pf] });
        if (r && r.ok) { V.basis[pf] = d[pf]; V.mt[pf] = r.mt; }
        else if (r && r.freigabe === false) throw Object.assign(new Error(r.error), { freigabe: true });
        else if (r && r.error) { if (typeof ausgabe === 'function') ausgabe('⚠ ' + pf + ': ' + r.error); V.basis[pf] = d[pf]; }
      }
      // 2. Änderungen auf dem PC (z. B. Gemini) -> Studio, nur für geöffnete Dateien
      const pfade = Object.keys(d).filter(pf => istText(d[pf])).slice(0, 200);
      if (pfade.length) {
        const r = await hub({ aktion: 'ordner_lesen', id: V.id, pfade, stand: V.mt });
        if (!r || r.error) { if (r && r.freigabe === false) throw Object.assign(new Error(r.error), { freigabe: true }); throw new Error((r && r.error) || 'keine Antwort'); }
        const neu = [], konflikt = [];
        for (const [pf, info] of Object.entries(r.dateien || {})) {
          if (info.mt) V.mt[pf] = info.mt;
          if (typeof info.inhalt !== 'string' || info.inhalt === d[pf]) { if (typeof info.inhalt === 'string') V.basis[pf] = info.inhalt; continue; }
          if (!V.erstAbgleich && d[pf] !== V.basis[pf]) { konflikt.push(pf); continue; }
          neu.push([pf, info.inhalt]);
        }
        if (neu.length) {
          await sichern(V.erstAbgleich ? 'Vor Abgleich mit dem PC-Ordner' : 'Vor Änderungen auf dem PC');
          for (const [pf, inhalt] of neu) {
            d[pf] = V.basis[pf] = inhalt;
            if (S.docs && S.docs[pf] && S.docs[pf].setValue && S.docs[pf].getValue() !== inhalt) S.docs[pf].setValue(inhalt);
            else if (pf === S.aktiv && S.ta && S.ta.style.display !== 'none') S.ta.value = inhalt;
          }
          await projSchreiben(S.p);
          if (typeof baum === 'function') baum();
          if (typeof ausgabe === 'function') ausgabe('↓ Vom PC übernommen (' + new Date().toLocaleTimeString('de-DE') + '): ' + neu.map(x => x[0]).join(', ') + '\nEin Stand von vorher liegt unter Versionen.');
        }
        if (konflikt.length && typeof ausgabe === 'function') ausgabe('⚠ Gleichzeitig im Studio und auf dem PC geändert: ' + konflikt.join(', ') + '\nDeine Studio-Fassung bleibt und wird gleich auf den PC geschrieben.');
      }
      if (!pfade.length) {
        const r = await hub({ aktion: 'ordner_liste', id: V.id, pfad: '' });
        if (!r || !r.ok) throw Object.assign(new Error((r && r.error) || 'keine Antwort'), { freigabe: !!(r && r.freigabe === false) });
      }
      V.erstAbgleich = false;
      V.fehler = 0;
    } catch (e) {
      if (V) { V.fehler = e.freigabe ? 3 : V.fehler + 1; }
    } finally {
      if (V) { V.laeuft = false; kopfZeigen(); }
    }
  }

  /* ---------- Baum ---------- */
  const KINDER = {};   // pfad -> Einträge
  async function baumLaden(pfad) {
    if (!V) return;
    const r = await hub({ aktion: 'ordner_liste', id: V.id, pfad }).catch(() => null);
    if (!r || !r.ok) { if (r && r.freigabe === false && V) V.fehler = 3; kopfZeigen(); return; }
    KINDER[pfad] = r.eintraege; baumZeigen();
  }

  function panel() {
    let box = $('pcBaumBox');
    if (!S.p || !S.p.pc) { if (box) box.hidden = true; return; }
    if (!box) {
      const ex = document.querySelector('#seite [data-panel="explorer"]'); if (!ex) return;
      box = document.createElement('div'); box.id = 'pcBaumBox';
      box.innerHTML = '<div class="sk"><span id="pcKopf">PC</span><button id="pcNeu" title="Neu verbinden">🔌</button><button id="pcAkt" title="Baum neu laden">↻</button></div><div id="pcInfo" class="hinweis" hidden></div><div id="pcBaum"></div><div class="sk pcOffenKopf"><span>GEÖFFNETE DATEIEN</span></div>';
      ex.insertBefore(box, $('baum'));
      $('pcNeu').onclick = neuVerbinden;
      $('pcAkt').onclick = () => { if (!V) return; Object.keys(KINDER).forEach(k => delete KINDER[k]); [...V.offen].forEach(baumLaden); };
    }
    box.hidden = false; kopfZeigen(); baumZeigen();
  }

  function kopfZeigen() {
    if (!$('pcKopf') || !S.p || !S.p.pc) return;
    $('pcKopf').textContent = (aktiv() ? '🖥 ' : '○ ') + 'AUF DEM PC: ' + S.p.pc.name.toUpperCase();
    $('pcKopf').title = S.p.pc.pfad + (aktiv() ? '' : ' – nicht verbunden');
    $('pcNeu').classList.toggle('an', !aktiv());
    if (!aktiv()) infoZeigen('Nicht verbunden. Klick auf 🔌, dann im SD KI-Agenten „Erlauben“. (Nach einem Neustart des Agenten nötig.)');
    else if ($('pcInfo') && /Nicht verbunden/.test($('pcInfo').textContent)) infoZeigen('');
  }
  function infoZeigen(t) { const o = $('pcInfo'); if (o) { o.textContent = t; o.hidden = !t; } else if (t) meldung(t); }

  function baumZeigen() {
    const box = $('pcBaum'); if (!box || !V) return;
    box.innerHTML = '';
    const zeichne = (pfad, tiefe) => {
      for (const e of KINDER[pfad] || []) {
        const voll = pfad ? pfad + '/' + e.n : e.n;
        const z = document.createElement('div'); z.className = 'pcZ' + (e.ordner ? ' pcO' : e.text ? ' pcT' : ' pcB');
        z.style.paddingLeft = (8 + tiefe * 12) + 'px';
        z.textContent = (e.ordner ? (V.offen.has(voll) ? '▾ 📁 ' : '▸ 📁 ') : e.text ? '📄 ' : '▫ ') + e.n;
        z.title = e.ordner ? voll : e.text ? voll + ' – öffnen' : voll + ' – nur im Unreal Editor bzw. passenden Programm';
        if (S.p.dateien[voll] != null) z.classList.add('pcGeladen');
        z.onclick = () => klick(voll, e);
        box.appendChild(z);
        if (e.ordner && V.offen.has(voll)) zeichne(voll, tiefe + 1);
      }
    };
    zeichne('', 0);
  }

  async function klick(voll, e) {
    if (e.ordner) {
      if (V.offen.has(voll)) V.offen.delete(voll); else { V.offen.add(voll); if (!KINDER[voll]) await baumLaden(voll); }
      baumZeigen(); return;
    }
    if (!e.text) { meldung('„' + e.n + '“ ist keine Textdatei – bitte im Unreal Editor bzw. passenden Programm öffnen.'); return; }
    if (S.p.dateien[voll] != null) { dateiOeffnen(voll); return; }
    const r = await hub({ aktion: 'ordner_lesen', id: V.id, pfade: [voll], stand: {} }).catch(() => null);
    const info = r && r.dateien && r.dateien[voll];
    if (!info || typeof info.inhalt !== 'string') { meldung('Öffnen ging nicht: ' + ((info && (info.fehler || (info.fehlt && 'Datei fehlt'))) || (r && r.error) || '?')); return; }
    S.p.dateien[voll] = V.basis[voll] = info.inhalt; V.mt[voll] = info.mt;
    await projSchreiben(S.p);
    if (typeof baum === 'function') baum();
    dateiOeffnen(voll); baumZeigen();
  }

  // Projektwechsel beobachten
  let letztes = null;
  setInterval(() => {
    if (S && S.p !== letztes) {
      letztes = S.p;
      if (S.p && S.p.pc) { if (!V || V.projekt !== S.p) starten(false); }
      else { stoppen(); panel(); }
    }
  }, 1000);

  window.SDPcOrdner = { oeffnen, neuVerbinden, jetzt: async () => { while (V && V.laeuft) await warte(200); if (!V) return; await takt(); if (V) [...V.offen].forEach(baumLaden); }, get aktiv() { return aktiv(); }, get id() { return V && V.id; } };
})();
