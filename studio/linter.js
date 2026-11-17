/* SD Code-Studio · Echte Prüfer im Browser
   Python: Ruff (astral-sh, MIT) als WebAssembly – prüft Python-Dateien (Syntaxfehler, nicht definierte Namen,
   ungenutzte Imports …) und formatiert sie. Wird erst geladen, wenn das Projekt Python-Dateien hat
   (einmalig ein paar MB vom CDN jsDelivr, danach aus dem Browser-Cache).
   Ergebnisse erscheinen unter „Probleme“ und als Markierung im Editor. */
(function () {
  'use strict';
  const RUFF_URLS = [
    'https://cdn.jsdelivr.net/npm/@astral-sh/ruff-wasm-web@0/ruff_wasm.js',
    'https://cdn.jsdelivr.net/npm/@astral-sh/ruff-wasm-web/ruff_wasm.js'
  ];
  const DEUTSCH = {
    F401: 'Import wird nicht benutzt', F811: 'Name wird neu definiert, ohne benutzt zu werden', F821: 'Name ist nicht definiert',
    F841: 'Variable wird zugewiesen, aber nie benutzt', F541: 'f-String ohne Platzhalter', F632: 'Vergleich mit „is“ statt „==“',
    E711: 'Vergleich mit None bitte mit „is None“', E712: 'Vergleich mit True/False vereinfachen', E701: 'Mehrere Anweisungen in einer Zeile',
    E702: 'Mehrere Anweisungen mit Semikolon', E721: 'Typvergleich bitte mit isinstance()', E722: 'Nacktes „except:“ fängt jeden Fehler',
    E731: 'Lambda einer Variable zuweisen – lieber def benutzen', E741: 'Missverständlicher Name (l, O oder I)', E902: 'Datei kann nicht gelesen werden'
  };
  const FEHLER = /^(E9|F821|F822|F823|F63|F7|invalid-syntax|syntax)/i;
  let ruff = null, ruffLaedt = null, ruffFehler = '';
  const cache = new Map();   // pfad -> { text, funde }
  let lintTimer = null, marken = [];

  async function ruffLaden() {
    if (ruff) return ruff;
    if (ruffLaedt) return ruffLaedt;
    ruffLaedt = (async () => {
      let letzter = null;
      for (const url of RUFF_URLS) {
        try {
          const mod = await import(url);
          await (mod.default ? mod.default() : Promise.resolve());
          const W = mod.Workspace;
          const basis = typeof W.defaultSettings === 'function' ? W.defaultSettings() : {};
          const einst = Object.assign({}, basis, { lint: Object.assign({}, basis.lint || {}, { select: ['E4', 'E7', 'E9', 'F'] }) });
          let ws = null;
          const enc = mod.PositionEncoding ? (mod.PositionEncoding.Utf16 ?? mod.PositionEncoding.UTF16 ?? mod.PositionEncoding.utf16) : undefined;
          try { ws = enc !== undefined ? new W(einst, enc) : new W(einst); } catch (e) { ws = new W(einst); }
          ruff = { ws, version: typeof mod.version === 'function' ? mod.version() : '' };
          return ruff;
        } catch (e) { letzter = e; }
      }
      ruffFehler = String((letzter && letzter.message) || letzter || 'unbekannt');
      ruffLaedt = null;
      throw letzter;
    })();
    return ruffLaedt;
  }

  function ort(d, a, b) {
    const s = d[a] || d[b] || {};
    return { zeile: s.row || s.line || 1, spalte: s.column || s.col || 1 };
  }

  function ruffPruefen(pfad, text) {
    const roh = ruff.ws.check(text) || [];
    return roh.slice(0, 200).map(d => {
      const code = d.code || (d.kind && d.kind.name) || '';
      const st = ort(d, 'start_location', 'location'), en = ort(d, 'end_location', 'end');
      const msg = String(d.message || d.body || '').trim();
      const de = DEUTSCH[code];
      return {
        file: pfad, line: st.zeile, col: st.spalte, endLine: en.zeile, endCol: en.spalte,
        severity: FEHLER.test(code || msg) ? 'error' : 'warning',
        text: 'Ruff ' + (code || 'Syntax') + ': ' + (de ? de + ' (' + msg + ')' : msg),
        suggestion: d.fix && d.fix.message ? 'Vorschlag: ' + d.fix.message : '', lint: true
      };
    });
  }

  const pyDateien = () => S.p ? Object.keys(S.p.dateien).filter(p => /\.pyw?$/i.test(p) && typeof S.p.dateien[p] === 'string') : [];
  const aktuellerText = p => (S.docs[p] && typeof S.docs[p].getValue === 'function') ? S.docs[p].getValue() : S.p.dateien[p];

  function ergebnisseEinfuegen() {
    if (!S.p) return;
    const alle = [];
    for (const p of pyDateien()) { const c = cache.get(p); if (c && c.text === aktuellerText(p)) alle.push(...c.funde); }
    S.problemeAnalyse = (S.problemeAnalyse || []).filter(x => !x.lint).concat(alle);
  }

  async function lintenJetzt() {
    const dateien = pyDateien();
    if (!dateien.length) { markieren(); return; }
    try { await ruffLaden(); } catch (e) { return; }
    let neu = false;
    for (const p of dateien) {
      const text = aktuellerText(p), c = cache.get(p);
      if (c && c.text === text) continue;
      try { cache.set(p, { text, funde: ruffPruefen(p, text) }); neu = true; } catch (e) { cache.set(p, { text, funde: [] }); }
    }
    if (neu) { ergebnisseEinfuegen(); if (typeof probleme === 'function') probleme(); }
    markieren();
  }

  function markieren() {
    marken.forEach(m => { try { m.clear(); } catch (e) { /* egal */ } }); marken = [];
    if (!S.cm || !S.aktiv || !/\.pyw?$/i.test(S.aktiv)) return;
    const c = cache.get(S.aktiv); if (!c || c.text !== aktuellerText(S.aktiv)) return;
    const doc = S.cm.getDoc();
    for (const f of c.funde.slice(0, 100)) {
      const von = { line: f.line - 1, ch: Math.max(0, f.col - 1) };
      let bis = { line: f.endLine - 1, ch: Math.max(0, f.endCol - 1) };
      if (bis.line < von.line || (bis.line === von.line && bis.ch <= von.ch)) bis = { line: von.line, ch: von.ch + 1 };
      try { marken.push(doc.markText(von, bis, { className: f.severity === 'error' ? 'lintFehler' : 'lintWarnung', attributes: { title: f.text } })); } catch (e) { /* egal */ }
    }
  }

  // Wird von diagnoseAktualisieren() in studio.js aufgerufen: Ruff-Funde ergänzen und bald neu prüfen
  function nachDiagnose() {
    ergebnisseEinfuegen();
    clearTimeout(lintTimer); lintTimer = setTimeout(lintenJetzt, 700);
  }
  async function formatierenPy() {
    if (!S.cm || !S.aktiv) return;
    try {
      toast('✨ Formatiere mit Ruff …');
      await ruffLaden();
      const alt = S.cm.getValue(), neu = ruff.ws.format(alt);
      if (typeof neu === 'string' && neu !== alt) { const pos = S.cm.getCursor(); S.cm.setValue(neu); S.cm.setCursor(pos); S.p.dateien[S.aktiv] = neu; if (typeof speichernBald === 'function') speichernBald(); toast('✨ Mit Ruff formatiert'); }
      else toast('✓ Schon ordentlich formatiert');
    } catch (e) { toast('Formatieren ging nicht: ' + String(ruffFehler || (e && e.message) || e).split('\n')[0].slice(0, 140)); }
  }

  window.SDLinter = { lintenJetzt, ruffLaden, nachDiagnose, formatieren: formatierenPy, get ruffStatus() { return ruff ? 'bereit ' + ruff.version : (ruffFehler ? 'Fehler: ' + ruffFehler : 'nicht geladen'); }, _cache: cache };
})();
