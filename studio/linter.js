/* SD Code-Studio · Echte Prüfer im Browser
   JavaScript: ESLint (OpenJS Foundation, MIT) – findet Tippfehler bei Namen, ungenutzte Variablen, Syntaxfehler …
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

  /* ---------- JavaScript: ESLint (MIT) im Browser ---------- */
  const ESLINT_URLS = [
    'https://cdn.jsdelivr.net/npm/eslint-linter-browserify@9/linter.min.js',
    'https://cdn.jsdelivr.net/npm/eslint-linter-browserify/linter.min.js'
  ];
  const ESL_DE = {
    'no-undef': 'Name ist nicht definiert (Tippfehler oder fehlende Deklaration?)', 'no-unused-vars': 'Wird deklariert, aber nie benutzt',
    'no-unreachable': 'Code wird nie erreicht', 'no-dupe-keys': 'Schlüssel kommt im Objekt doppelt vor', 'no-redeclare': 'Wird doppelt deklariert',
    'no-const-assign': 'Konstante (const) wird neu zugewiesen', 'no-func-assign': 'Funktion wird überschrieben', 'no-dupe-args': 'Parameter doppelt',
    'no-self-assign': 'Variable wird sich selbst zugewiesen', 'no-cond-assign': 'Zuweisung (=) in einer Bedingung – meintest du == oder ===?',
    'no-empty': 'Leerer Block', 'eqeqeq': '== statt === (kann überraschende Ergebnisse geben)', 'use-isnan': 'Vergleich mit NaN geht so nicht – Number.isNaN() benutzen',
    'valid-typeof': 'Ungültiger typeof-Vergleich', 'no-dupe-else-if': 'Gleiche Bedingung doppelt in else if', 'no-duplicate-case': 'Gleicher case doppelt',
    'no-unsafe-finally': 'return/throw in finally', 'getter-return': 'Getter gibt nichts zurück', 'no-loss-of-precision': 'Zahl verliert Genauigkeit',
    'no-unused-labels': 'Label wird nicht benutzt', 'no-sparse-arrays': 'Lücke im Array ([1,,2])', 'no-compare-neg-zero': 'Vergleich mit -0'
  };
  const ESL_FEHLER = new Set(['no-undef', 'no-const-assign', 'no-func-assign', 'no-dupe-keys', 'no-dupe-args', 'no-redeclare', 'use-isnan', 'valid-typeof', 'no-unreachable']);
  const NODE_GLOBALS = ['require', 'module', 'exports', 'process', '__dirname', '__filename', 'Buffer', 'global', 'setImmediate', 'clearImmediate'];
  let eslint = null, eslintLaedt = null, eslintFehler = '';

  function skriptLaden(url) {
    return new Promise((ok, nein) => { const sc = document.createElement('script'); sc.src = url; sc.onload = ok; sc.onerror = () => nein(new Error('Laden fehlgeschlagen: ' + url)); document.head.appendChild(sc); });
  }
  async function eslintLaden() {
    if (eslint) return eslint;
    if (eslintLaedt) return eslintLaedt;
    eslintLaedt = (async () => {
      let letzter = null;
      for (const url of ESLINT_URLS) {
        try {
          await skriptLaden(url);
          const L = (window.eslint && window.eslint.Linter) || (window.Linter);
          if (!L) throw new Error('ESLint-Linter nicht gefunden');
          eslint = { linter: new L({ configType: 'flat' }), version: L.version || '' };
          return eslint;
        } catch (e) { letzter = e; }
      }
      eslintFehler = String((letzter && letzter.message) || letzter); eslintLaedt = null; throw letzter;
    })();
    return eslintLaedt;
  }

  let browserGlobals = null;
  function globalsFuer(pfad, text, projektNamen) {
    if (!browserGlobals) { browserGlobals = {}; try { for (let o = window; o && o !== Object.prototype; o = Object.getPrototypeOf(o)) Object.getOwnPropertyNames(o).forEach(n => { if (/^[A-Za-z_$][\w$]*$/.test(n)) browserGlobals[n] = 'readonly'; }); } catch (e) { /* egal */ } }
    const g = Object.assign({}, browserGlobals);
    for (const n of projektNamen) g[n] = 'writable';
    if (/\.cjs$/.test(pfad) || /\brequire\s*\(|module\.exports|process\.(env|argv)/.test(text)) NODE_GLOBALS.forEach(n => { g[n] = 'readonly'; });
    return g;
  }
  // Namen, die Skripte im Projekt auf oberster Ebene anlegen (Skripte teilen sich im Browser diese Namen)
  function projektNamen(dateien) {
    const namen = new Set();
    for (const [p, t] of Object.entries(dateien)) {
      if (!/\.(m?js|cjs|jsx)$/i.test(p) || typeof t !== 'string') continue;
      for (const m of t.matchAll(/^(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)|^(?:const|let|var|class)\s+([A-Za-z_$][\w$]*)/gm)) namen.add(m[1] || m[2]);
      for (const m of t.matchAll(/\bwindow\.([A-Za-z_$][\w$]*)\s*=/g)) namen.add(m[1]);
    }
    return namen;
  }
  function eslintPruefen(pfad, text, namen) {
    const modul = /\.mjs$/i.test(pfad) || /^\s*(import\s[\s\S]*?from\s|import\s*['"]|export\s)/m.test(text);
    const cfg = [{
      files: ['**/*'],
      languageOptions: { ecmaVersion: 'latest', sourceType: modul ? 'module' : (/\.cjs$/i.test(pfad) ? 'commonjs' : 'script'),
        globals: globalsFuer(pfad, text, namen), parserOptions: { ecmaFeatures: { jsx: /\.jsx$/i.test(pfad) } } },
      rules: {
        'no-undef': 'error', 'no-unused-vars': ['warn', { vars: modul ? 'all' : 'local', args: 'none', caughtErrors: 'none' }], 'no-unreachable': 'error',
        'no-dupe-keys': 'error', 'no-redeclare': 'error', 'no-const-assign': 'error', 'no-func-assign': 'error', 'no-dupe-args': 'error',
        'no-self-assign': 'warn', 'no-cond-assign': 'warn', 'no-empty': ['warn', { allowEmptyCatch: true }], 'eqeqeq': ['warn', 'smart'],
        'use-isnan': 'error', 'valid-typeof': 'error', 'no-dupe-else-if': 'warn', 'no-duplicate-case': 'warn', 'no-unsafe-finally': 'warn',
        'getter-return': 'warn', 'no-loss-of-precision': 'warn', 'no-unused-labels': 'warn', 'no-sparse-arrays': 'warn', 'no-compare-neg-zero': 'warn'
      }
    }];
    const roh = eslint.linter.verify(text, cfg, { filename: pfad.split('/').pop() }) || [];
    return roh.slice(0, 200).map(d => {
      const regel = d.ruleId || '';
      const syntax = d.fatal || !regel;
      return {
        file: pfad, line: d.line || 1, col: d.column || 1, endLine: d.endLine || d.line || 1, endCol: d.endColumn || (d.column || 1) + 1,
        severity: syntax || ESL_FEHLER.has(regel) || d.severity === 2 ? 'error' : 'warning',
        text: 'ESLint ' + (syntax ? 'Syntax' : regel) + ': ' + (syntax ? 'Syntaxfehler – ' : (ESL_DE[regel] ? ESL_DE[regel] + ' – ' : '')) + String(d.message || '').trim(),
        suggestion: '', lint: true
      };
    });
  }

  const pyDateien = () => S.p ? Object.keys(S.p.dateien).filter(p => /\.pyw?$/i.test(p) && typeof S.p.dateien[p] === 'string') : [];
  const jsDateien = () => S.p ? Object.keys(S.p.dateien).filter(p => /\.(m?js|cjs|jsx)$/i.test(p) && !/\.min\.js$/i.test(p) && !/(^|\/)(node_modules|vendor|dist|build)\//.test(p) && typeof S.p.dateien[p] === 'string' && S.p.dateien[p].length < 400000) : [];
  const aktuellerText = p => (S.docs[p] && typeof S.docs[p].getValue === 'function') ? S.docs[p].getValue() : S.p.dateien[p];

  function ergebnisseEinfuegen() {
    if (!S.p) return;
    const alle = [];
    for (const p of pyDateien().concat(jsDateien())) { const c = cache.get(p); if (c && c.text === aktuellerText(p)) alle.push(...c.funde); }
    S.problemeAnalyse = (S.problemeAnalyse || []).filter(x => !x.lint).concat(alle);
  }

  async function lintenJetzt() {
    const py = pyDateien(), js = jsDateien();
    let neu = false;
    if (py.length) {
      try {
        await ruffLaden();
        for (const p of py) {
          const text = aktuellerText(p), c = cache.get(p);
          if (c && c.text === text) continue;
          try { cache.set(p, { text, funde: ruffPruefen(p, text) }); neu = true; } catch (e) { cache.set(p, { text, funde: [] }); }
        }
      } catch (e) { /* Ruff nicht verfügbar */ }
    }
    if (js.length) {
      try {
        await eslintLaden();
        const alle = {}; for (const p of js) alle[p] = aktuellerText(p);
        const namen = projektNamen(alle), schluessel = [...namen].sort().join(',');
        for (const p of js) {
          const text = alle[p], c = cache.get(p);
          if (c && c.text === text && c.namen === schluessel) continue;
          try { cache.set(p, { text, namen: schluessel, funde: eslintPruefen(p, text, namen) }); neu = true; } catch (e) { cache.set(p, { text, namen: schluessel, funde: [] }); }
        }
      } catch (e) { /* ESLint nicht verfügbar */ }
    }
    if (neu) { ergebnisseEinfuegen(); if (typeof probleme === 'function') probleme(); }
    markieren();
  }

  function markieren() {
    marken.forEach(m => { try { m.clear(); } catch (e) { /* egal */ } }); marken = [];
    if (!S.cm || !S.aktiv || !/\.(pyw?|m?js|cjs|jsx)$/i.test(S.aktiv)) return;
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

  window.SDLinter = { lintenJetzt, ruffLaden, eslintLaden, nachDiagnose, get eslintStatus() { return eslint ? 'bereit ' + eslint.version : (eslintFehler ? 'Fehler: ' + eslintFehler : 'nicht geladen'); }, formatieren: formatierenPy, get ruffStatus() { return ruff ? 'bereit ' + ruff.version : (ruffFehler ? 'Fehler: ' + ruffFehler : 'nicht geladen'); }, _cache: cache };
})();
