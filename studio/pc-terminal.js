/* SD Code-Studio · KI im Terminal (Gemini CLI, Claude Code, Codex) über den SD KI-Agenten auf dem PC.
   Ablauf: Projekt an den Agenten übergeben (/__vom_hub), Agent-Fenster mit Terminal-Auswahl öffnen,
   dann Live-Abgleich: Änderungen im Studio gehen in den Projektordner, Änderungen der KI kommen ins Studio.
   Die Webseite startet dabei nichts auf dem PC – das Terminal öffnet der Nutzer in der Agent-Oberfläche selbst. */
(function () {
  'use strict';
  const TAKT = 2000;
  let SYNC = null;   // { name, projekt, basis, stand, timer, fehler, gesichert, laeuft }

  const agentUrl = () => (window.SD_PC && window.SD_PC.agent) || 'http://localhost:8765';
  const istText = v => typeof v === 'string' && !/^data:(?!text\/)[^,]*;base64,/.test(v);
  async function hub(daten, ms) {
    const c = new AbortController(); const t = setTimeout(() => c.abort(), ms || 8000);
    try {
      const r = await fetch(agentUrl() + '/__vom_hub', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(daten), signal: c.signal });
      return await r.json();
    } finally { clearTimeout(t); }
  }

  function anzeige() {
    let o = document.getElementById('pcSyncPill');
    if (!SYNC) { if (o) o.remove(); return; }
    if (!o) {
      o = document.createElement('div'); o.id = 'pcSyncPill';
      o.style.cssText = 'position:fixed;right:14px;bottom:14px;z-index:9000;display:flex;align-items:center;gap:10px;padding:8px 10px 8px 14px;border-radius:999px;background:#1b1730;color:#ece8ff;border:1px solid #3b3463;font:13px/1.3 system-ui;box-shadow:0 6px 20px #0006;max-width:calc(100vw - 28px)';
      o.innerHTML = '<span class="pt"></span><button type="button" style="border:1px solid #3b3463;background:transparent;color:inherit;border-radius:999px;padding:5px 10px;cursor:pointer;font:inherit">Trennen</button>';
      o.querySelector('button').onclick = () => stoppen('Live-Abgleich mit dem PC beendet.');
      document.body.appendChild(o);
    }
    const ok = SYNC.fehler < 3;
    o.querySelector('.pt').textContent = (ok ? '● Live mit PC: ' : '○ PC nicht erreichbar: ') + SYNC.name;
    o.querySelector('.pt').style.color = ok ? '#8ee6a8' : '#f2c46d';
  }

  function stoppen(text) {
    if (!SYNC) return;
    clearInterval(SYNC.timer); SYNC = null; anzeige();
    if (text && typeof toast === 'function') toast(text);
  }

  async function takt() {
    if (!SYNC || SYNC.laeuft) return;
    if (!S.p || S.p !== SYNC.projekt) return stoppen('Projekt gewechselt – Live-Abgleich mit dem PC beendet.');
    SYNC.laeuft = true;
    try {
      const d = S.p.dateien, basis = SYNC.basis;
      // 1. Eigene Änderungen im Studio -> PC
      for (const pfad of Object.keys(d)) {
        if (!istText(d[pfad]) || d[pfad] === basis[pfad]) continue;
        const r = await hub({ aktion: 'datei', name: SYNC.name, pfad, inhalt: d[pfad] });
        if (r && r.ok) basis[pfad] = d[pfad];
      }
      for (const pfad of Object.keys(basis)) {
        if (d[pfad] == null) { const r = await hub({ aktion: 'datei', name: SYNC.name, pfad, loeschen: true }); if (r && r.ok) delete basis[pfad]; }
      }
      // 2. Änderungen auf dem PC (z. B. von Gemini/Claude/Codex) -> Studio
      const r = await hub({ aktion: 'lesen', name: SYNC.name, stand: SYNC.stand });
      if (!r || r.error) throw new Error((r && r.error) || 'keine Antwort');
      SYNC.fehler = 0;
      if (!r.gleich && r.dateien) {
        SYNC.stand = r.stand;
        const geaendert = [], neu = [], weg = [];
        for (const [pfad, inhalt] of Object.entries(r.dateien)) {
          if (basis[pfad] === inhalt) continue;
          if (d[pfad] != null && !istText(d[pfad])) continue;
          (d[pfad] == null ? neu : geaendert).push(pfad);
        }
        for (const pfad of Object.keys(basis)) if (r.dateien[pfad] == null && istText(d[pfad])) weg.push(pfad);
        if (geaendert.length || neu.length || weg.length) {
          if (!SYNC.gesichert && typeof versionNeu === 'function') { SYNC.gesichert = true; await versionNeu('Vor Änderungen aus dem PC-Terminal', true); }
          for (const pfad of geaendert.concat(neu)) {
            d[pfad] = basis[pfad] = r.dateien[pfad];
            if (S.docs && S.docs[pfad] && S.docs[pfad].setValue && S.docs[pfad].getValue() !== d[pfad]) S.docs[pfad].setValue(d[pfad]);
          }
          for (const pfad of weg) { delete d[pfad]; delete basis[pfad]; }
          if (weg.includes(S.aktiv)) S.aktiv = Object.keys(d)[0] || null;
          await projSchreiben(S.p);
          if (typeof baum === 'function') baum();
          if (typeof istWebProjekt === 'function' && istWebProjekt() && document.getElementById('vorschau') && !document.getElementById('vorschau').hidden && typeof vorschau === 'function') vorschau(false);
          const teile = [];
          if (geaendert.length) teile.push('geändert: ' + geaendert.join(', '));
          if (neu.length) teile.push('neu: ' + neu.join(', '));
          if (weg.length) teile.push('gelöscht: ' + weg.join(', '));
          if (typeof ausgabe === 'function') ausgabe('↓ Vom PC übernommen (' + new Date().toLocaleTimeString('de-DE') + ') – ' + teile.join(' · ') + '\nEin Stand von vorher liegt unter Versionen.');
        }
      }
    } catch (e) {
      SYNC && (SYNC.fehler++);
    } finally {
      if (SYNC) { SYNC.laeuft = false; anzeige(); }
    }
  }

  function starten(name) {
    stoppen();
    const basis = {};
    for (const [p, v] of Object.entries(S.p.dateien)) if (istText(v)) basis[p] = v;
    SYNC = { name, projekt: S.p, basis, stand: null, fehler: 0, gesichert: false, laeuft: false };
    SYNC.timer = setInterval(takt, TAKT);
    anzeige(); takt();
  }

  async function kiImTerminal() {
    if (!S.p) { if (typeof vorlagenWaehlen === 'function') vorlagenWaehlen(); return; }
    if (typeof speichernJetzt === 'function') await speichernJetzt();
    const fenster = window.open('', '_blank');
    if (fenster) fenster.document.write('<body style="font-family:system-ui;background:#1a1530;color:#e6e1ff;padding:30px"><h2>Verbinde mit dem SD KI-Agenten auf deinem PC …</h2></body>');
    const zu = () => { try { fenster && fenster.close(); } catch (e) { /* egal */ } };
    let ping = null;
    try { ping = await hub({ aktion: 'ping' }, 2500); } catch (e) { ping = null; }
    if (!ping || !ping.ok) {
      zu();
      return pcHinweis('Der SD KI-Agent auf deinem PC ist gerade nicht erreichbar.',
        'So geht es:\n1. Starte den „SD KI-Agent“ auf deinem PC (Desktop-Symbol).\n2. Klick hier noch einmal auf „KI im Terminal“.\n\nFragt der Browser, ob thesdhub.com auf Geräte im lokalen Netzwerk zugreifen darf: „Zulassen“.\n\nOhne Agent: Lade das Projekt als Startpaket herunter.');
    }
    if (!ping.sync) {
      zu();
      return pcHinweis('Dein SD KI-Agent ist zu alt für „KI im Terminal“.', 'Öffne den SD KI-Agenten auf deinem PC und klicke auf „Nach Updates suchen“. Danach hier noch einmal „KI im Terminal“ wählen.');
    }
    let j;
    try { j = await hub({ name: S.p.name, dateien: S.p.dateien }, 20000); } catch (e) { j = { error: String(e.message || e) }; }
    if (!j || !j.ok) { zu(); return pcHinweis('Übertragen ging nicht', (j && j.error) || '?'); }
    const url = agentUrl() + '/?studio=' + encodeURIComponent(j.name) + '&terminal=1';
    if (fenster) fenster.location.href = url; else window.open(url, '_blank');
    starten(j.name);
    if (typeof ausgabe === 'function') ausgabe('🖥 Projekt „' + j.name + '“ liegt jetzt auch auf deinem PC.\n' +
      'Im Fenster des SD KI-Agenten wählst du Gemini CLI, Claude Code, Codex oder die Eingabeaufforderung – das Terminal öffnet sich im Projektordner.\n' +
      'Live-Abgleich läuft: Was die KI dort ändert, erscheint hier automatisch; was du hier änderst, landet im Ordner.\nUnten rechts: „Trennen“ beendet den Abgleich.');
  }

  window.SDPcTerminal = { kiImTerminal, starten, stoppen, get aktiv() { return !!SYNC; }, _takt: takt };
})();
