/* SD Code-Studio · KI-Vervollständigung direkt im Browser (wie Copilot, aber lokal)
   Ein kleines Code-Modell (Qwen2.5-Coder über WebLLM, Apache-2.0) läuft mit WebGPU auf dem eigenen Gerät.
   Beim Tippen erscheint grauer Vorschlagstext: Tab übernimmt, Esc verwirft. Kein Schlüssel, keine Kosten,
   der Code verlässt das Gerät nicht. Standardmäßig AUS – das Modell (0,4–2 GB) wird nur auf Wunsch geladen.
   Die Systemprüfung empfiehlt, welches Modell auf diesem Gerät am besten läuft. */
(function () {
  'use strict';
  const WEBLLM = 'https://esm.run/@mlc-ai/web-llm@0.2.83';
  const MODELLE = {
    '05': { name: 'Qwen2.5-Coder 0.5B', mb: 450, f16: 'Qwen2.5-Coder-0.5B-Instruct-q4f16_1-MLC', f32: 'Qwen2.5-Coder-0.5B-Instruct-q4f32_1-MLC', info: 'klein & schnell' },
    '15': { name: 'Qwen2.5-Coder 1.5B', mb: 1100, f16: 'Qwen2.5-Coder-1.5B-Instruct-q4f16_1-MLC', f32: 'Qwen2.5-Coder-1.5B-Instruct-q4f32_1-MLC', info: 'deutlich bessere Vorschläge' },
    '3':  { name: 'Qwen2.5-Coder 3B', mb: 2100, f16: 'Qwen2.5-Coder-3B-Instruct-q4f16_1-MLC', f32: 'Qwen2.5-Coder-3B-Instruct-q4f32_1-MLC', info: 'am besten, braucht starke Grafik' }
  };
  const $ = id => document.getElementById(id);
  let SYS = null, engine = null, engineId = '', laedt = null, timer = null, geist = null, anfrageNr = 0, laeuft = false;

  const einstellung = () => Object.assign({ an: false, modell: 'auto' }, (typeof einst === 'function' && einst().kiVervoll) || {});
  const speichern = e => { if (typeof einstSetzen === 'function') einstSetzen('kiVervoll', e); };
  const istHandy = () => /Android|Mobi|iPhone|iPad|iPod/i.test(navigator.userAgent || '') || (/Macintosh/.test(navigator.userAgent || '') && navigator.maxTouchPoints > 1);

  /* ---------- Systemprüfung + Empfehlung ---------- */
  async function systemPruefen() {
    if (SYS) return SYS;
    const s = { webgpu: false, f16: false, ram: navigator.deviceMemory || 0, handy: istHandy(), grafik: '', maxPuffer: 0, gruende: [], empfehlung: null };
    try {
      if (navigator.gpu) {
        const a = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
        if (a) {
          s.webgpu = !a.isFallbackAdapter && !(a.info && a.info.isFallbackAdapter);
          s.f16 = a.features.has('shader-f16');
          s.maxPuffer = Math.min(a.limits.maxBufferSize || 0, a.limits.maxStorageBufferBindingSize || 0);
          const i = a.info || (a.requestAdapterInfo ? await a.requestAdapterInfo().catch(() => null) : null) || {};
          s.grafik = [i.vendor, i.architecture || i.device || i.description].filter(Boolean).join(' ');
        }
      }
    } catch (e) { /* kein WebGPU */ }
    const GB = 1024 * 1024 * 1024;
    if (!s.webgpu) { s.gruende.push('Dieser Browser hat kein WebGPU (am besten Chrome oder Edge am PC/Laptop).'); }
    else {
      s.gruende.push('WebGPU ✓' + (s.grafik ? ' – Grafik: ' + s.grafik : ''));
      s.gruende.push(s.f16 ? 'Schnelle Rechenart (f16) ✓' : 'Ohne f16 – es wird die etwas größere f32-Variante genommen');
      s.gruende.push(s.ram ? 'Arbeitsspeicher laut Browser: ' + (s.ram >= 8 ? 'mindestens 8 GB' : s.ram + ' GB') : 'Arbeitsspeicher: vom Browser nicht verraten');
      if (s.maxPuffer) s.gruende.push('Größter Grafik-Speicherblock: ' + (s.maxPuffer / GB).toFixed(1) + ' GB');
      if (s.handy) s.empfehlung = (s.ram >= 6 && s.maxPuffer >= GB) ? '05' : null;
      else if ((s.ram === 0 || s.ram >= 8) && s.maxPuffer >= 2 * GB && s.f16) s.empfehlung = '15';
      else if (s.ram >= 4 || s.ram === 0) s.empfehlung = '05';
      else s.empfehlung = null;
      if (!s.empfehlung) s.gruende.push(s.handy ? 'Auf diesem Handy wäre es zu langsam oder würde abstürzen.' : 'Zu wenig Speicher für ein Code-Modell.');
    }
    SYS = s; return s;
  }

  function modellId(key) { const m = MODELLE[key]; return (SYS && SYS.f16) ? m.f16 : m.f32; }
  function gewaehlt() { const e = einstellung(); return (e.modell !== 'auto' && MODELLE[e.modell]) ? e.modell : (SYS && SYS.empfehlung) || '05'; }

  /* ---------- Modell laden ---------- */
  async function laden(fortschritt) {
    if (window.SDKIVervoll._testEngine) { engine = window.SDKIVervoll._testEngine; engineId = 'test'; return engine; }
    await systemPruefen();
    if (!SYS.webgpu) throw new Error('Kein WebGPU in diesem Browser.');
    const id = modellId(gewaehlt());
    if (engine && engineId === id) return engine;
    if (laedt) return laedt;
    laedt = (async () => {
      const lib = await import(WEBLLM);
      const liste = (lib.prebuiltAppConfig && lib.prebuiltAppConfig.model_list) || [];
      if (liste.length && !liste.some(m => m.model_id === id)) throw new Error('Modell ' + id + ' gibt es in dieser WebLLM-Version nicht.');
      if (engine && engine.unload) { try { await engine.unload(); } catch (e) { /* egal */ } }
      const worker = new Worker(new URL('webllm-worker.js', location.href), { type: 'module' });
      engine = await lib.CreateWebWorkerMLCEngine(worker, id, { initProgressCallback: p => fortschritt && fortschritt(p) });
      engineId = id; return engine;
    })();
    try { return await laedt; } finally { laedt = null; }
  }

  /* ---------- Geistertext im Editor ---------- */
  function geistWeg() { if (geist) { try { geist.mark.clear(); } catch (e) { /* egal */ } geist = null; } }
  function geistZeigen(cm, pos, text) {
    geistWeg();
    const el = document.createElement('span'); el.className = 'kiGeist'; el.textContent = text;
    geist = { pos, text, mark: cm.setBookmark(pos, { widget: el, insertLeft: true }) };
  }
  function annehmen(cm) {
    if (!geist) return false;
    const { pos, text } = geist; geistWeg();
    if (cm.getCursor().line !== pos.line || cm.getCursor().ch !== pos.ch) return false;
    cm.replaceRange(text, pos); return true;
  }

  function bereinigen(t, suffix) {
    t = String(t || '').replace(/<\|[^|]*\|>/g, '').replace(/\r/g, '');
    t = t.replace(/^```\w*\n?/, '').replace(/\n?```[\s\S]*$/, '');
    const zeilen = t.split('\n'); if (zeilen.length > 6) t = zeilen.slice(0, 6).join('\n');
    const s = (suffix || '').split('\n')[0].trim();
    if (s && t.endsWith(s)) t = t.slice(0, -s.length);    // nichts doppeln, was rechts schon steht
    return t.replace(/\s+$/, '');
  }

  async function vorschlagHolen(cm) {
    if (!engine || laeuft || !einstellung().an) return;
    const nr = ++anfrageNr, pos = cm.getCursor(), doc = cm.getDoc();
    const vor = doc.getRange({ line: Math.max(0, pos.line - 60), ch: 0 }, pos).slice(-2000);
    const nach = doc.getRange(pos, { line: pos.line + 30, ch: 0 }).slice(0, 600);
    const rest = doc.getLine(pos.line).slice(pos.ch);
    if (!vor.trim() || !/^[\s)\]};,'"`]*$/.test(rest)) return;   // nur am Zeilenende bzw. vor schließenden Zeichen
    const datei = (S && S.aktiv) || '';
    laeuft = true;
    try {
      const r = await engine.completions.create({ prompt: '<|fim_prefix|>' + (datei ? '# ' + datei + '\n' : '') + vor + '<|fim_suffix|>' + nach + '<|fim_middle|>', max_tokens: 64, temperature: 0.2, stop: ['<|endoftext|>', '<|fim_pad|>', '\n\n\n'] });
      if (nr !== anfrageNr) return;
      const text = bereinigen(r && r.choices && r.choices[0] && (r.choices[0].text || (r.choices[0].message && r.choices[0].message.content)), nach);
      const jetzt = cm.getCursor();
      if (text && jetzt.line === pos.line && jetzt.ch === pos.ch) geistZeigen(cm, pos, text);
    } catch (e) { /* Vorschlag ist optional */ }
    finally { laeuft = false; }
  }

  function anbinden() {
    const cm = S && S.cm; if (!cm || cm._sdKiVervoll) return;
    cm._sdKiVervoll = true;
    cm.on('changes', (c, aenderungen) => {
      geistWeg(); clearTimeout(timer);
      if (!engine || !einstellung().an) return;
      if (!aenderungen.some(a => a.origin === '+input' || a.origin === '+delete')) return;
      timer = setTimeout(() => vorschlagHolen(cm), 550);
    });
    cm.on('cursorActivity', c => { if (geist) { const p = c.getCursor(); if (p.line !== geist.pos.line || p.ch !== geist.pos.ch) geistWeg(); } });
    cm.on('blur', () => geistWeg());
    cm.addKeyMap({
      Tab: c => { if (geist && annehmen(c)) return; return CodeMirror.Pass; },
      Esc: c => { if (geist) { geistWeg(); return; } return CodeMirror.Pass; }
    });
  }

  /* ---------- Einstellungen ---------- */
  async function panelBauen() {
    const sl = document.querySelector('[data-panel="einst"] .sl'); if (!sl || $('kvBox')) return;
    const box = document.createElement('div'); box.id = 'kvBox';
    box.innerHTML = '<b>🤖 KI-Vervollständigung (lokal, wie Copilot)</b>' +
      '<div id="kvSys" class="hinweis">Prüfe dein Gerät …</div>' +
      '<label class="kl">Modell <select id="kvModell"></select></label>' +
      '<div class="reihe"><button id="kvAn" class="primary">⬇ Laden & einschalten</button><button id="kvAus" hidden>Ausschalten</button></div>' +
      '<div id="kvStatus" class="hinweis"></div>';
    sl.appendChild(box);
    const s = await systemPruefen();
    $('kvSys').textContent = s.gruende.join(' · ') + (s.empfehlung ? ' → Empfehlung für dieses Gerät: ' + MODELLE[s.empfehlung].name + ' (' + MODELLE[s.empfehlung].info + ', ca. ' + MODELLE[s.empfehlung].mb + ' MB)' : ' → Auf diesem Gerät nicht empfohlen.');
    const sel = $('kvModell');
    sel.innerHTML = '<option value="auto">Empfohlen' + (s.empfehlung ? ' (' + MODELLE[s.empfehlung].name + ')' : '') + '</option>' +
      Object.entries(MODELLE).map(([k, m]) => '<option value="' + k + '">' + m.name + ' – ' + m.info + ' (ca. ' + m.mb + ' MB)</option>').join('');
    sel.value = einstellung().modell;
    sel.onchange = () => { const e = einstellung(); e.modell = sel.value; speichern(e); if (e.an) einschalten(); };
    $('kvAn').disabled = !s.webgpu;
    $('kvAn').onclick = einschalten;
    $('kvAus').onclick = () => { const e = einstellung(); e.an = false; speichern(e); geistWeg(); knoepfe(); status('Ausgeschaltet. Das Modell bleibt im Browser gespeichert.'); };
    knoepfe();
    if (einstellung().an) einschalten(true);
  }
  function status(t) { if ($('kvStatus')) $('kvStatus').textContent = t; }
  function knoepfe() { const an = einstellung().an && !!engine; if ($('kvAn')) $('kvAn').hidden = an; if ($('kvAus')) $('kvAus').hidden = !an; }

  async function einschalten(still) {
    const e = einstellung(); e.an = true; speichern(e);
    status('Lade ' + (MODELLE[gewaehlt()] || {}).name + ' … (beim ersten Mal einmaliger Download, danach aus dem Browser-Speicher)');
    try {
      await laden(p => status('Lade Modell … ' + Math.round((p.progress || 0) * 100) + ' % ' + (p.text ? '· ' + String(p.text).slice(0, 80) : '')));
      anbinden(); knoepfe();
      status('✓ Bereit – tippe im Editor, nach einer kurzen Pause erscheint ein grauer Vorschlag. Tab = übernehmen, Esc = verwerfen.');
      if (!still && typeof toast === 'function') toast('🤖 KI-Vervollständigung ist an');
    } catch (err) {
      const e2 = einstellung(); e2.an = false; speichern(e2); knoepfe();
      status('Ging nicht: ' + String(err && err.message || err).slice(0, 200) + (/memory|Device|lost|OOM/i.test(String(err)) ? ' – nimm das kleinere Modell.' : ''));
    }
  }

  function start() { panelBauen(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else setTimeout(start, 0);
  window.SDKIVervoll = { systemPruefen, einschalten, laden, anbinden, vorschlagHolen, annehmen, MODELLE, _testEngine: null, get aktiv() { return !!(engine && einstellung().an); }, _bereinigen: bereinigen };
})();
