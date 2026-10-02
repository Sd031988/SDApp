/* ==========================================================
   SD Suite – gemeinsame KI-Bausteine fuer alle Apps
   ==========================================================
   - SD Lotse: eigene KI, laeuft lokal im Browser (WebLLM, WebGPU),
     ohne Schluessel und ohne dass Texte das Geraet verlassen. Basiert auf
     Llama 3.2 von Meta ("Built with Llama"). Das Modell wird nur EINMAL
     heruntergeladen und steht dann allen SD-Apps auf thesdhub.com zur
     Verfuegung (gleicher Browser-Speicher).
   - Gemini: ueber gemini-modelle.js mit dem eigenen Gratis-Schluessel.
   - Gemeinsame Auswahl "Gemini / SD Lotse" (localStorage sdKiAnbieter).
   - Dialog "KI-Hilfe zum Dokument" (PDF-Studio, Scanner).

   Oeffentliche Schnittstelle: window.sdKi
   ========================================================== */
(function () {
  'use strict';

  const SKRIPT_URL = (document.currentScript && document.currentScript.src) || location.href;
  const WORKER_URL = new URL('sd-lotse-worker.js', SKRIPT_URL).href;
  const WEBLLM_URL = 'https://esm.run/@mlc-ai/web-llm@0.2.83';
  // Gleiche Modelle wie im KI-Assistenten -> derselbe Download fuer alle Apps.
  const MODELLE = {
    '1b': { f16: 'Llama-3.2-1B-Instruct-q4f16_1-MLC', f32: 'Llama-3.2-1B-Instruct-q4f32_1-MLC', groesse: '1 GB' },
    '3b': { f16: 'Llama-3.2-3B-Instruct-q4f16_1-MLC', f32: 'Llama-3.2-3B-Instruct-q4f32_1-MLC', groesse: '2 GB' }
  };
  const ANBIETER_STORAGE = 'sdKiAnbieter';
  const GEMINI_KEY_STORAGE = 'biGeminiApiKey';
  const LOTSE_MAX_ZEICHEN = 6000;   // ca. 2.000 Token - Llama 3.2 im Browser hat ~4.000 Token Kontext
  const GEMINI_MAX_ZEICHEN = 60000;

  const TEXTE = {
    de: {
      anbieter_titel: 'KI wählen',
      gemini: '☁️ Gemini', gemini_sub: 'online · Gemini-Schlüssel nötig · Texte gehen an Google',
      lotse: '🔒 SD Lotse', lotse_sub: 'eigene KI · lokal auf diesem Gerät · ohne Schlüssel',
      lotse_hinweis: 'SD Lotse läuft komplett auf deinem Gerät (am besten PC/Laptop mit Chrome oder Edge). Er ist kleiner als Gemini – für kurze Texte gut, für lange Texte schwächer.',
      credit: 'SD Lotse basiert auf Llama 3.2 von Meta · Built with Llama',
      lizenz: 'Lizenz',
      dl_titel: '🔒 SD Lotse einmalig herunterladen?',
      dl_text: 'Damit die eigene KI lokal auf deinem Gerät arbeiten kann, wird sie einmalig heruntergeladen (ca. {groesse}) und im Browser gespeichert. Danach steht sie in allen SD-Apps bereit – ohne Schlüssel, und deine Texte verlassen das Gerät nicht. Tipp: am besten im WLAN.',
      dl_ok: '⬇️ Herunterladen & starten', abbrechen: 'Abbrechen',
      laden_titel: '🔒 SD Lotse wird gestartet …', laden: 'Wird geladen …',
      abgebrochen: 'Abgebrochen.',
      unsupported: 'Dein Browser oder Gerät kann SD Lotse leider nicht lokal ausführen (WebGPU fehlt oder ist zu schwach). Am besten klappt es mit Chrome oder Edge am PC/Laptop – oder wähle ☁️ Gemini.',
      tech: 'Technischer Grund',
      laden_fehler: 'SD Lotse konnte nicht geladen werden: {msg}',
      kein_text: 'SD Lotse hat keinen Text geliefert. Bitte nochmal versuchen.',
      kein_key: 'Für ☁️ Gemini ist ein Gemini-Schlüssel nötig (z. B. im KI-Assistenten unter ⚙️ eintragen) – oder wähle 🔒 SD Lotse.',
      gemini_fehler: 'Google-Anfrage fehlgeschlagen (Status {status}).',
      gemini_key_falsch: 'Google hat den Gemini-Schlüssel abgelehnt.',
      gemini_kontingent: 'Das kostenlose Gemini-Kontingent ist gerade aufgebraucht – später nochmal versuchen oder 🔒 SD Lotse wählen.',
      netz: 'Keine Verbindung zu Google. Bitte Internetverbindung prüfen – oder 🔒 SD Lotse wählen.',
      dlg_titel: '🤖 KI-Hilfe zum Dokument',
      dlg_quelle: 'Erkannter Text: {n} Zeichen',
      dlg_gekuerzt: ' (für SD Lotse auf den Anfang gekürzt)',
      dlg_leer: 'Kein Text gefunden. Bei gescannten Dokumenten bitte zuerst die Texterkennung (OCR) ausführen.',
      dlg_schliessen: 'Schließen', dlg_kopieren: '📋 Kopieren', dlg_kopiert: 'Kopiert ✓', dlg_uebernehmen: '↩️ In den Text übernehmen',
      dlg_stopp: '■ Stopp', dlg_privat_lotse: '🔒 Läuft lokal – der Text verlässt dein Gerät nicht.',
      dlg_privat_gemini: '☁️ Der Text wird zur Bearbeitung an Google Gemini gesendet.',
      dlg_hinweis_recht: 'Hinweis: Die KI kann sich irren und ersetzt keine Rechts-, Steuer- oder Finanzberatung.',
      act_zusammenfassen: '📋 Zusammenfassen', act_erklaeren: '❓ Was will das Schreiben von mir?', act_antwort: '✍️ Antwort entwerfen', act_korrigieren: '🔤 Erkennungsfehler korrigieren',
      p_zusammenfassen: 'Fasse dieses Dokument kurz und verständlich in Stichpunkten zusammen: Worum geht es, wer schreibt an wen, was wird verlangt, wichtige Fristen, Beträge und Aktenzeichen (nur falls im Text vorhanden). Erfinde nichts dazu.',
      p_erklaeren: 'Erkläre in einfacher Sprache, was dieses Schreiben von mir möchte und was ich jetzt konkret tun sollte (mit Frist, falls im Text genannt). Wenn etwas unklar ist oder im Text fehlt, sag das ehrlich.',
      p_antwort: 'Entwirf eine höfliche, kurze Antwort auf dieses Schreiben (nur den Brieftext, ohne Briefkopf). Lass Angaben, die du nicht kennst, als [Lücke] in eckigen Klammern.',
      p_korrigieren: 'Dieser Text stammt aus einer automatischen Texterkennung (OCR). Korrigiere nur offensichtliche Erkennungs- und Rechtschreibfehler, ohne Inhalt, Zahlen oder Namen zu verändern. Gib ausschließlich den korrigierten Text aus.'
    },
    en: {
      anbieter_titel: 'Choose AI',
      gemini: '☁️ Gemini', gemini_sub: 'online · Gemini key needed · text is sent to Google',
      lotse: '🔒 SD Lotse', lotse_sub: 'own AI · local on this device · no key',
      lotse_hinweis: 'SD Lotse runs entirely on your device (best on a PC/laptop with Chrome or Edge). It is smaller than Gemini – good for short texts, weaker for long ones.',
      credit: 'SD Lotse is based on Llama 3.2 by Meta · Built with Llama',
      lizenz: 'License',
      dl_titel: '🔒 Download SD Lotse once?',
      dl_text: 'To work locally on your device, our own AI is downloaded once (approx. {groesse}) and stored in the browser. After that it is available in all SD apps – no key needed, and your texts never leave the device. Tip: best over Wi-Fi.',
      dl_ok: '⬇️ Download & start', abbrechen: 'Cancel',
      laden_titel: '🔒 Starting SD Lotse …', laden: 'Loading …',
      abgebrochen: 'Cancelled.',
      unsupported: 'Your browser or device cannot run SD Lotse locally (WebGPU missing or too weak). It works best with Chrome or Edge on a PC/laptop – or choose ☁️ Gemini.',
      tech: 'Technical reason',
      laden_fehler: 'SD Lotse could not be loaded: {msg}',
      kein_text: 'SD Lotse returned no text. Please try again.',
      kein_key: '☁️ Gemini needs a Gemini key (e.g. enter it in the AI assistant under ⚙️) – or choose 🔒 SD Lotse.',
      gemini_fehler: 'Google request failed (status {status}).',
      gemini_key_falsch: 'Google rejected the Gemini key.',
      gemini_kontingent: 'The free Gemini quota is used up for now – try again later or choose 🔒 SD Lotse.',
      netz: 'No connection to Google. Please check your internet connection – or choose 🔒 SD Lotse.',
      dlg_titel: '🤖 AI help for this document',
      dlg_quelle: 'Recognized text: {n} characters',
      dlg_gekuerzt: ' (shortened to the beginning for SD Lotse)',
      dlg_leer: 'No text found. For scanned documents please run text recognition (OCR) first.',
      dlg_schliessen: 'Close', dlg_kopieren: '📋 Copy', dlg_kopiert: 'Copied ✓', dlg_uebernehmen: '↩️ Use in text',
      dlg_stopp: '■ Stop', dlg_privat_lotse: '🔒 Runs locally – the text never leaves your device.',
      dlg_privat_gemini: '☁️ The text is sent to Google Gemini for processing.',
      dlg_hinweis_recht: 'Note: the AI can be wrong and does not replace legal, tax or financial advice.',
      act_zusammenfassen: '📋 Summarize', act_erklaeren: '❓ What does this letter want from me?', act_antwort: '✍️ Draft a reply', act_korrigieren: '🔤 Fix recognition errors',
      p_zusammenfassen: 'Summarize this document briefly and clearly in bullet points: what it is about, who writes to whom, what is requested, important deadlines, amounts and reference numbers (only if present in the text). Do not invent anything.',
      p_erklaeren: 'Explain in plain language what this letter wants from me and what I should do now (with the deadline, if stated in the text). If something is unclear or missing in the text, say so honestly.',
      p_antwort: 'Draft a short, polite reply to this letter (letter body only, no letterhead). Leave details you do not know as a [gap] in square brackets.',
      p_korrigieren: 'This text comes from automatic text recognition (OCR). Fix only obvious recognition and spelling errors without changing content, numbers or names. Output only the corrected text.'
    }
  };

  function sprache() { return window.SD_LANG === 'en' ? 'en' : 'de'; }
  function tx(key, vars) {
    let s = (TEXTE[sprache()] || TEXTE.de)[key];
    if (s == null) s = TEXTE.de[key] || key;
    if (vars) Object.keys(vars).forEach(k => { s = s.split('{' + k + '}').join(vars[k]); });
    return s;
  }
  function lesen(store, key) { try { return store.getItem(key); } catch (e) { return null; } }
  function schreiben(store, key, wert) { try { store.setItem(key, wert); } catch (e) { /* optional */ } }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // ------------------------------------------------------------
  // Anbieter-Auswahl
  // ------------------------------------------------------------
  function anbieter() { return lesen(localStorage, ANBIETER_STORAGE) === 'lotse' ? 'lotse' : 'gemini'; }
  function setzeAnbieter(wert) {
    schreiben(localStorage, ANBIETER_STORAGE, wert === 'lotse' ? 'lotse' : 'gemini');
    document.dispatchEvent(new CustomEvent('sd-ki-anbieter', { detail: { anbieter: anbieter() } }));
  }

  // ------------------------------------------------------------
  // Styles (einmalig, mit eigenem Praefix, damit nichts kollidiert)
  // ------------------------------------------------------------
  function stylesEinfuegen() {
    if (document.getElementById('sdki-styles')) return;
    const st = document.createElement('style');
    st.id = 'sdki-styles';
    st.textContent = `
.sdki-wahl{border:1px solid #d8e0dc;border-radius:12px;padding:10px;background:#fbfdfc;margin:0 0 12px;font-family:inherit}
.sdki-wahl-titel{font-size:.72rem;font-weight:bold;text-transform:uppercase;letter-spacing:.04em;color:#647482;margin-bottom:6px}
.sdki-optionen{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.sdki-opt{display:flex;flex-direction:column;gap:2px;border:1px solid #d8e0dc;border-radius:10px;padding:8px 10px;background:#fff;cursor:pointer;text-align:left;font-family:inherit;color:#172a3a;min-height:44px}
.sdki-opt strong{font-size:.9rem}
.sdki-opt small{font-size:.7rem;color:#647482;line-height:1.3}
.sdki-opt.aktiv{border-color:#2f7d72;background:#dcece7;box-shadow:inset 0 0 0 1px #2f7d72}
.sdki-hinweis,.sdki-box .sdki-hinweis{font-size:.75rem;color:#647482;margin:6px 2px 0;line-height:1.45}
.sdki-hinweis a{color:#2f7d72}
@media (max-width:420px){.sdki-optionen{grid-template-columns:1fr}}
.sdki-overlay{position:fixed;inset:0;background:rgba(23,42,58,.45);z-index:100000;display:flex;align-items:center;justify-content:center;padding:16px;font-family:'Trebuchet MS',Verdana,sans-serif}
.sdki-box{background:#fff;color:#172a3a;border-radius:16px;max-width:620px;width:100%;max-height:calc(100dvh - 32px);overflow:auto;padding:18px;box-shadow:0 20px 50px rgba(0,0,0,.25);display:grid;gap:10px}
.sdki-box h2{font-family:Georgia,serif;font-size:1.15rem;margin:0}
.sdki-box p{margin:0;line-height:1.55;font-size:.92rem}
.sdki-klein{font-size:.78rem!important;color:#647482}
.sdki-knoepfe{display:flex;flex-wrap:wrap;gap:8px}
.sdki-btn{border:1px solid #d8e0dc;background:#fff;color:#172a3a;border-radius:10px;padding:9px 14px;min-height:42px;font-family:inherit;font-weight:bold;font-size:.88rem;cursor:pointer}
.sdki-btn.prim{background:#2f7d72;border-color:#2f7d72;color:#fff}
.sdki-btn.akt{background:#dcece7;border-color:#2f7d72;color:#1c4a42}
.sdki-btn:disabled{opacity:.5;cursor:default}
.sdki-balken{height:10px;background:#dcece7;border-radius:999px;overflow:hidden}
.sdki-balken>div{height:100%;width:0;background:#2f7d72;transition:width .3s}
.sdki-ausgabe{white-space:pre-wrap;background:#fffdf8;border:1px solid #d8e0dc;border-radius:10px;padding:12px;min-height:80px;max-height:45dvh;overflow:auto;font-size:.92rem;line-height:1.55;overflow-wrap:anywhere}
.sdki-fehler{background:#fdf0ee;border:1px solid #f1c4bf;color:#b42318;border-radius:10px;padding:10px 12px;font-size:.88rem;white-space:pre-line}`;
    document.head.appendChild(st);
  }

  // ------------------------------------------------------------
  // Auswahl-Baustein (fuer die KI-Bereiche der Apps)
  // ------------------------------------------------------------
  function baueAuswahl(container) {
    if (!container) return;
    stylesEinfuegen();
    const box = document.createElement('div');
    box.className = 'sdki-wahl';
    container.prepend(box);
    const zeichnen = () => {
      const a = anbieter();
      box.innerHTML =
        '<div class="sdki-wahl-titel">' + esc(tx('anbieter_titel')) + '</div>' +
        '<div class="sdki-optionen" role="radiogroup">' +
        '<button type="button" class="sdki-opt' + (a === 'gemini' ? ' aktiv' : '') + '" data-a="gemini" role="radio" aria-checked="' + (a === 'gemini') + '"><strong>' + esc(tx('gemini')) + '</strong><small>' + esc(tx('gemini_sub')) + '</small></button>' +
        '<button type="button" class="sdki-opt' + (a === 'lotse' ? ' aktiv' : '') + '" data-a="lotse" role="radio" aria-checked="' + (a === 'lotse') + '"><strong>' + esc(tx('lotse')) + '</strong><small>' + esc(tx('lotse_sub')) + '</small></button>' +
        '</div>' +
        (a === 'lotse'
          ? '<p class="sdki-hinweis">' + esc(tx('lotse_hinweis')) + '<br>' + esc(tx('credit')) + ' · <a href="https://www.llama.com/llama3_2/license/" target="_blank" rel="noopener">' + esc(tx('lizenz')) + '</a></p>'
          : '');
      box.querySelectorAll('.sdki-opt').forEach(b => { b.onclick = () => setzeAnbieter(b.dataset.a); });
    };
    zeichnen();
    document.addEventListener('sd-ki-anbieter', zeichnen);
    document.addEventListener('sd-lang-changed', zeichnen);
    return box;
  }

  // ------------------------------------------------------------
  // SD Lotse (lokal)
  // ------------------------------------------------------------
  const lotse = { lib: null, engine: null, modellId: null, gpu: null, ladeVersprechen: null, aktuellerStream: null };

  function variante() {
    try {
      const o = JSON.parse(lesen(localStorage, 'sdAssistentOptionen') || '{}');
      return MODELLE[o.llamaModell] ? o.llamaModell : '1b';
    } catch (e) { return '1b'; }
  }

  function geraeteInfo() {
    const ua = navigator.userAgent || '';
    const kandidaten = [['SamsungBrowser', 'Samsung Internet'], ['EdgA', 'Edge'], ['Edg', 'Edge'], ['OPR', 'Opera'],
      ['Firefox', 'Firefox'], ['CriOS', 'Chrome (iOS)'], ['Chrome', 'Chrome'], ['Version', 'Safari']];
    let browser = 'Browser';
    for (const [kennung, name] of kandidaten) {
      const m = ua.match(new RegExp(kennung + '\\/(\\d+)'));
      if (m) { browser = name + ' ' + m[1]; break; }
    }
    const android = ua.match(/Android ([\d.]+)/);
    const ios = ua.match(/(?:iPhone|iPad).*? OS (\d+)[_.](\d+)/);
    const system = android ? 'Android ' + android[1] : ios ? 'iOS ' + ios[1] + '.' + ios[2] :
      /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : '';
    return browser + (system ? ' · ' + system : '') + (/; wv\)/.test(ua) ? ' · WebView' : '');
  }

  async function pruefeGeraet() {
    if (lotse.gpu) return lotse.gpu;
    try {
      if (!('gpu' in navigator) || !navigator.gpu) return (lotse.gpu = { ok: false, grund: 'WebGPU fehlt im Browser' });
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter) return (lotse.gpu = { ok: false, grund: 'WebGPU vorhanden, aber keine passende Grafikeinheit' });
      return (lotse.gpu = { ok: true, f16: adapter.features.has('shader-f16') });
    } catch (e) {
      return (lotse.gpu = { ok: false, grund: 'WebGPU-Fehler: ' + ((e && e.message) || e) });
    }
  }

  function modellId() {
    const m = MODELLE[variante()];
    return (lotse.gpu && lotse.gpu.f16) ? m.f16 : m.f32;
  }

  async function ladeBibliothek() {
    if (!lotse.lib) lotse.lib = await import(WEBLLM_URL);
    return lotse.lib;
  }

  function overlay(innerHtml) {
    stylesEinfuegen();
    const o = document.createElement('div');
    o.className = 'sdki-overlay';
    o.innerHTML = '<div class="sdki-box" role="dialog" aria-modal="true">' + innerHtml + '</div>';
    document.body.appendChild(o);
    return o;
  }

  function frageDownload() {
    return new Promise(resolve => {
      const o = overlay(
        '<h2>' + esc(tx('dl_titel')) + '</h2>' +
        '<p>' + esc(tx('dl_text', { groesse: MODELLE[variante()].groesse })) + '</p>' +
        '<p class="sdki-klein">' + esc(tx('credit')) + ' · <a href="https://www.llama.com/llama3_2/license/" target="_blank" rel="noopener">' + esc(tx('lizenz')) + '</a></p>' +
        '<div class="sdki-knoepfe"><button type="button" class="sdki-btn prim" data-ok>' + esc(tx('dl_ok')) + '</button>' +
        '<button type="button" class="sdki-btn" data-nein>' + esc(tx('abbrechen')) + '</button></div>');
      o.querySelector('[data-ok]').onclick = () => { o.remove(); resolve(true); };
      o.querySelector('[data-nein]').onclick = () => { o.remove(); resolve(false); };
    });
  }

  // Stellt sicher, dass SD Lotse geladen ist (fragt vor dem ersten
  // Download, zeigt Fortschritt). Wirft verstaendliche Fehler.
  async function bereitmachen() {
    if (lotse.engine && lotse.modellId === modellId()) return lotse.engine;
    if (lotse.ladeVersprechen) return lotse.ladeVersprechen;
    const gpu = await pruefeGeraet();
    if (!gpu.ok) throw new Error(tx('unsupported') + '\n\n' + tx('tech') + ': ' + (gpu.grund || '?') + ' · ' + geraeteInfo());
    lotse.ladeVersprechen = (async () => {
      const lib = await ladeBibliothek();
      const id = modellId();
      let imSpeicher = false;
      try { imSpeicher = await lib.hasModelInCache(id); } catch (e) { imSpeicher = false; }
      if (!imSpeicher && !(await frageDownload())) throw new Error(tx('abgebrochen'));
      const o = overlay('<h2>' + esc(tx('laden_titel')) + '</h2><div class="sdki-balken"><div></div></div><p class="sdki-klein" data-text>' + esc(tx('laden')) + '</p>');
      const balken = o.querySelector('.sdki-balken > div');
      const text = o.querySelector('[data-text]');
      const fortschritt = (r) => {
        balken.style.width = Math.round((r.progress || 0) * 100) + '%';
        text.textContent = tx('laden') + ' ' + Math.round((r.progress || 0) * 100) + ' %';
      };
      try {
        if (lotse.engine) { try { await lotse.engine.unload(); } catch (e) { /* egal */ } lotse.engine = null; }
        let engine;
        try {
          const worker = new Worker(WORKER_URL, { type: 'module' });
          engine = await lib.CreateWebWorkerMLCEngine(worker, id, { initProgressCallback: fortschritt });
        } catch (workerFehler) {
          engine = await lib.CreateMLCEngine(id, { initProgressCallback: fortschritt });
        }
        lotse.engine = engine;
        lotse.modellId = id;
        return engine;
      } catch (err) {
        throw new Error(tx('laden_fehler', { msg: (err && err.message) || String(err) }) + ' · ' + geraeteInfo());
      } finally {
        o.remove();
      }
    })();
    try {
      return await lotse.ladeVersprechen;
    } finally {
      lotse.ladeVersprechen = null;
    }
  }

  const LOTSE_SYSTEM =
    'You are "SD Lotse", the built-in AI of the web app "SD Bewerbungsstudio" (job applications, ' +
    'CVs, cover letters, letters, documents). Follow the user\'s instructions exactly. Output only the ' +
    'requested text, without explanations or introductions. Never invent facts, numbers, names, degrees ' +
    'or experience; if information is missing, leave a gap in [square brackets]. If asked which model ' +
    'you are based on, say honestly: Llama 3.2 by Meta, running locally in the browser.';

  /**
   * Text mit SD Lotse erzeugen.
   * optionen: { system (Zusatz), maxTokens, onToken(teiltext, gesamt) }
   */
  async function lotseSchreibe(prompt, optionen) {
    const opt = optionen || {};
    const engine = await bereitmachen();
    const spracheHinweis = sprache() === 'en' ? ' Write in English unless the task says otherwise.' : ' Write in German (Deutsch) unless the task says otherwise.';
    const stream = await engine.chat.completions.create({
      messages: [
        { role: 'system', content: LOTSE_SYSTEM + spracheHinweis + (opt.system ? '\n\n' + opt.system : '') },
        { role: 'user', content: String(prompt) }
      ],
      stream: true,
      temperature: 0.6,
      max_tokens: opt.maxTokens || 900
    });
    lotse.aktuellerStream = engine;
    let text = '';
    try {
      for await (const teil of stream) {
        const neu = (teil.choices && teil.choices[0] && teil.choices[0].delta && teil.choices[0].delta.content) || '';
        if (!neu) continue;
        text += neu;
        if (opt.onToken) opt.onToken(neu, text);
      }
    } finally {
      lotse.aktuellerStream = null;
    }
    if (!text.trim()) throw new Error(tx('kein_text'));
    return text.trim();
  }

  function lotseStopp() {
    if (lotse.aktuellerStream) { try { lotse.aktuellerStream.interruptGenerate(); } catch (e) { /* egal */ } }
  }

  // ------------------------------------------------------------
  // Gemini (einfacher Text-Aufruf, Gratis-Flash-Modelle)
  // ------------------------------------------------------------
  function geminiKey() {
    return lesen(sessionStorage, GEMINI_KEY_STORAGE) || lesen(localStorage, GEMINI_KEY_STORAGE) || '';
  }

  async function geminiSchreibe(prompt, optionen) {
    const opt = optionen || {};
    const key = geminiKey();
    if (!key) throw new Error(tx('kein_key'));
    if (!window.sdGemini) throw new Error(tx('gemini_fehler', { status: 'gemini-modelle.js fehlt' }));
    const body = { contents: [{ role: 'user', parts: [{ text: String(prompt) }] }] };
    if (opt.system) body.system_instruction = { parts: [{ text: opt.system }] };
    let antwort;
    try {
      ({ antwort } = await window.sdGemini.anfrage(key, body));
    } catch (e) {
      throw new Error(tx('netz'));
    }
    if (!antwort.ok) {
      if (antwort.status === 429) throw new Error(tx('gemini_kontingent'));
      if (antwort.status === 400 || antwort.status === 401 || antwort.status === 403) throw new Error(tx('gemini_key_falsch'));
      throw new Error(tx('gemini_fehler', { status: antwort.status }));
    }
    const daten = await antwort.json();
    const text = (((daten.candidates || [])[0] || {}).content || {}).parts;
    const ergebnis = (text || []).filter(p => !p.thought).map(p => p.text || '').join('').trim();
    if (!ergebnis) throw new Error(tx('gemini_fehler', { status: 'leer' }));
    return ergebnis;
  }

  async function schreibe(prompt, optionen) {
    return anbieter() === 'lotse' ? lotseSchreibe(prompt, optionen) : geminiSchreibe(prompt, optionen);
  }

  // ------------------------------------------------------------
  // Dialog "KI-Hilfe zum Dokument" (PDF-Studio, Scanner)
  // ------------------------------------------------------------
  // optionen: { text, ocr (bool: Korrektur-Aktion anbieten), uebernehmen(text) }
  function dokumentDialog(optionen) {
    const opt = optionen || {};
    const voll = String(opt.text || '').replace(/[ \t]+\n/g, '\n').trim();
    const o = overlay(
      '<h2>' + esc(tx('dlg_titel')) + '</h2>' +
      '<div data-wahl></div>' +
      '<p class="sdki-klein" data-quelle></p>' +
      '<div class="sdki-knoepfe" data-aktionen></div>' +
      '<div class="sdki-ausgabe" data-ausgabe hidden></div>' +
      '<div class="sdki-fehler" data-fehler hidden></div>' +
      '<p class="sdki-klein" data-privat></p>' +
      '<p class="sdki-klein">' + esc(tx('dlg_hinweis_recht')) + '</p>' +
      '<div class="sdki-knoepfe" data-unten></div>');
    const $q = (sel) => o.querySelector(sel);
    baueAuswahl($q('[data-wahl]'));
    const ausgabe = $q('[data-ausgabe]');
    const fehler = $q('[data-fehler]');
    let laeuft = false;
    let ergebnis = '';

    const aktionen = [
      ['act_zusammenfassen', 'p_zusammenfassen'],
      ['act_erklaeren', 'p_erklaeren'],
      ['act_antwort', 'p_antwort']
    ];
    if (opt.ocr) aktionen.push(['act_korrigieren', 'p_korrigieren']);

    const unten = $q('[data-unten]');
    const kopieren = document.createElement('button');
    kopieren.type = 'button'; kopieren.className = 'sdki-btn'; kopieren.hidden = true;
    const uebernehmen = document.createElement('button');
    uebernehmen.type = 'button'; uebernehmen.className = 'sdki-btn'; uebernehmen.hidden = true;
    const stopp = document.createElement('button');
    stopp.type = 'button'; stopp.className = 'sdki-btn'; stopp.hidden = true;
    const schliessen = document.createElement('button');
    schliessen.type = 'button'; schliessen.className = 'sdki-btn';
    unten.append(kopieren, uebernehmen, stopp, schliessen);

    function textFuerAnbieter() {
      const grenze = anbieter() === 'lotse' ? LOTSE_MAX_ZEICHEN : GEMINI_MAX_ZEICHEN;
      return { text: voll.slice(0, grenze), gekuerzt: voll.length > grenze };
    }

    function zeichnen() {
      const { gekuerzt } = textFuerAnbieter();
      $q('[data-quelle]').textContent = voll ? tx('dlg_quelle', { n: voll.length.toLocaleString() }) + (gekuerzt ? tx('dlg_gekuerzt') : '') : '';
      $q('[data-privat]').textContent = anbieter() === 'lotse' ? tx('dlg_privat_lotse') : tx('dlg_privat_gemini');
      const box = $q('[data-aktionen]');
      box.innerHTML = '';
      if (!voll) {
        fehler.textContent = tx('dlg_leer');
        fehler.hidden = false;
      }
      aktionen.forEach(([label, prompt]) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'sdki-btn akt';
        b.textContent = tx(label);
        b.disabled = !voll || laeuft;
        b.onclick = () => ausfuehren(prompt, label === 'act_korrigieren');
        box.appendChild(b);
      });
      kopieren.textContent = tx('dlg_kopieren');
      uebernehmen.textContent = tx('dlg_uebernehmen');
      stopp.textContent = tx('dlg_stopp');
      schliessen.textContent = tx('dlg_schliessen');
    }

    async function ausfuehren(promptKey, istKorrektur) {
      if (laeuft) return;
      laeuft = true;
      ergebnis = '';
      fehler.hidden = true;
      ausgabe.hidden = false;
      ausgabe.textContent = '…';
      kopieren.hidden = true;
      uebernehmen.hidden = true;
      stopp.hidden = anbieter() !== 'lotse';
      zeichnen();
      const { text } = textFuerAnbieter();
      const prompt = tx(promptKey) + '\n\n---\n' + text + '\n---';
      try {
        ergebnis = await schreibe(prompt, {
          maxTokens: istKorrektur ? 1500 : 900,
          onToken: (_, gesamt) => { ausgabe.textContent = gesamt; ausgabe.scrollTop = ausgabe.scrollHeight; }
        });
        ausgabe.textContent = ergebnis;
        kopieren.hidden = false;
        uebernehmen.hidden = !(istKorrektur && typeof opt.uebernehmen === 'function');
      } catch (err) {
        if (ausgabe.textContent === '…') ausgabe.hidden = true;
        fehler.textContent = (err && err.message) || String(err);
        fehler.hidden = false;
      } finally {
        laeuft = false;
        stopp.hidden = true;
        zeichnen();
      }
    }

    kopieren.onclick = () => {
      const fertig = () => { kopieren.textContent = tx('dlg_kopiert'); setTimeout(() => { kopieren.textContent = tx('dlg_kopieren'); }, 1500); };
      const notfall = () => {
        const ta = document.createElement('textarea'); ta.value = ergebnis; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); fertig(); } catch (e) { /* egal */ }
        ta.remove();
      };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ergebnis).then(fertig, notfall);
      else notfall();
    };
    uebernehmen.onclick = () => { if (opt.uebernehmen) opt.uebernehmen(ergebnis); o.remove(); };
    stopp.onclick = () => lotseStopp();
    schliessen.onclick = () => { lotseStopp(); o.remove(); };
    const neuZeichnen = () => { if (document.body.contains(o)) zeichnen(); };
    document.addEventListener('sd-ki-anbieter', neuZeichnen);
    document.addEventListener('sd-lang-changed', neuZeichnen);
    zeichnen();
    return o;
  }

  window.sdKi = {
    anbieter, setzeAnbieter, baueAuswahl,
    pruefeGeraet, bereitmachen, lotseSchreibe, lotseStopp,
    geminiSchreibe, schreibe, dokumentDialog,
    _intern: { lotse, MODELLE }
  };
})();
