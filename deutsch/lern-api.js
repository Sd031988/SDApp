/* SD Hub – Deutsch lernen: ersetzt den früheren Server.
   Kursbuch, Training, Wörterbuch, Grammatik, Artikel-Tricks: aus daten/*.json (ohne Internet-Dienst, ohne KI).
   KI-Lehrer, Gespräch, Übersetzen, Schreib-Korrektur: über sdKi (eigener Gemini-Schlüssel, ChatGPT, Claude oder SD Lotse).
   Aussprache: mit Gemini-Schlüssel wird die Aufnahme von Gemini erkannt, sonst über die Spracherkennung des Browsers.
   Öffentliche Schnittstelle: window.SDLernAPI.fetch(url, optionen) -> Promise<Response> (wie fetch). */
(function () {
  'use strict';
  const BASIS = new URL('.', document.currentScript ? document.currentScript.src : location.href).href;
  // SD-Server (SD Maschinen Kenner auf Render): KI mit dem Schlüssel des Servers, natürliche Stimme, Aussprache-Erkennung
  const SERVER = (() => { try { return localStorage.getItem('sdLearnServer') || ''; } catch (e) { return ''; } })() || 'https://sd-maschinen-kenner.onrender.com';
  const quelle = () => { try { return localStorage.getItem('sdLearnKiQuelle') || 'server'; } catch (e) { return 'server'; } };
  // Render schläft nach 15 Minuten ohne Nutzung – schon beim Öffnen wecken
  try { fetch(SERVER + '/hub/ping', {mode: 'cors'}).catch(() => {}); } catch (e) {}
  async function serverPost(pfad, daten, sekunden) {
    const ctrl = new AbortController(), to = setTimeout(() => ctrl.abort(), (sekunden || 80) * 1000);
    try {
      const r = await fetch(SERVER + pfad, {method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(daten), signal: ctrl.signal});
      let d = {}; try { d = await r.json(); } catch (_) {}
      if (!r.ok || !d.ok) throw new Error(d.error || ('SD-Server: Status ' + r.status));
      return d;
    } catch (e) {
      if (e && e.name === 'AbortError') throw new Error('Der SD-Server hat zu lange nicht geantwortet (er wacht nach einer Pause bis zu einer Minute auf).');
      if (e instanceof TypeError) throw new Error('Keine Verbindung zum SD-Server.');
      throw e;
    } finally { clearTimeout(to); }
  }
  const V = '3';
  const cache = {};
  function json(url) {
    if (!cache[url]) cache[url] = fetch(new URL(url + '?v=' + V, BASIS).href).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
    cache[url].catch(() => { delete cache[url]; });
    return cache[url];
  }
  const lehrplan = () => json('daten/lehrplan.json');
  const buch = lang => json('daten/buch-' + (lang === 'fa' ? 'fa' : 'en') + '.json');
  const antwort = (obj, status) => new Response(JSON.stringify(obj), {status: status || 200, headers: {'Content-Type': 'application/json'}});

  // ---------- Kursbuch-Daten ----------
  async function pool(level, unitIdx, lang) {
    const b = await buch(lang);
    const order = b.order, lv = order.includes(level) ? level : 'A1';
    const words = [], sentences = [];
    for (const l of order.slice(0, order.indexOf(lv) + 1)) {
      const us = b.units[l], last = l === lv ? Math.min(unitIdx, us.length - 1) : us.length - 1;
      for (let i = 0; i <= last; i++) { words.push(...us[i].poolWords); sentences.push(...us[i].poolSents); }
    }
    return {words, sentences};
  }
  async function grammarAll(lang) {
    const b = await buch(lang), out = [];
    b.order.forEach(l => b.units[l].forEach((u, i) => (u.grammars || []).forEach(g => out.push(Object.assign({}, g, {level: l, unit: i, unit_title: u.title})))));
    return out;
  }

  // ---------- KI ----------
  function jsonAus(text) {
    let t = String(text || '').trim().replace(/^```(?:json)?\s*|\s*```$/g, '');
    const m = t.match(/\{[\s\S]*\}/);
    return JSON.parse(m ? m[0] : t);
  }
  // Gemini direkt (mit Wiederholung bei Verbindungsfehlern und genauer Fehlermeldung); andere KIs über sdKi
  const MODELLE = ['gemini-flash-latest', 'gemini-flash-lite-latest'];
  async function geminiDirekt(key, prompt, system) {
    const body = {contents: [{role: 'user', parts: [{text: String(prompt)}]}], generationConfig: {temperature: 0.4}};
    if (system) body.system_instruction = {parts: [{text: system}]};
    let letzter = '';
    for (let versuch = 0; versuch < 3; versuch++) {
      const modell = MODELLE[Math.min(versuch, MODELLE.length - 1)];
      const ctrl = new AbortController(), to = setTimeout(() => ctrl.abort(), 60000);
      let r;
      try {
        r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + modell + ':generateContent', {
          method: 'POST', headers: {'Content-Type': 'application/json', 'x-goog-api-key': key}, body: JSON.stringify(body), signal: ctrl.signal});
      } catch (e) {
        clearTimeout(to);
        letzter = e && e.name === 'AbortError' ? 'Google hat 60 Sekunden nicht geantwortet' : 'keine Verbindung zu Google (' + ((e && (e.message || e.name)) || 'Netzwerk') + ')';
        await new Promise(res => setTimeout(res, 800));
        continue;
      }
      clearTimeout(to);
      if (r.status === 429 || r.status === 404 || r.status >= 500) { letzter = 'Gemini ' + modell + ': Status ' + r.status + (r.status === 429 ? ' (Kontingent/zu viele Anfragen)' : ''); continue; }
      if (!r.ok) {
        let m = ''; try { m = ((await r.json()).error || {}).message || ''; } catch (_) {}
        throw new Error(r.status === 400 || r.status === 401 || r.status === 403 ? 'Gemini hat den Schlüssel abgelehnt (' + r.status + (m ? ': ' + m.slice(0, 120) : '') + ')' : 'Gemini-Fehler ' + r.status + (m ? ': ' + m.slice(0, 120) : ''));
      }
      const d = await r.json();
      const t = ((((d.candidates || [])[0] || {}).content || {}).parts || []).filter(x => !x.thought).map(x => x.text || '').join('').trim();
      if (t) return t;
      letzter = 'Gemini hat keinen Text geliefert';
    }
    throw new Error(letzter + '. Bitte Internet prüfen und nochmal versuchen – oder unter ⚙️ KI einrichten eine andere KI wählen.');
  }
  function eigeneKiDa() {
    const a = window.sdKi ? window.sdKi.anbieter() : 'gemini';
    if (a === 'lotse') return true;
    if (a === 'gemini') return !!geminiKey();
    try { return !!(localStorage.getItem(a === 'openai' ? 'sdOpenAiApiKey' : 'sdClaudeApiKey') || sessionStorage.getItem(a === 'openai' ? 'sdOpenAiApiKey' : 'sdClaudeApiKey')); } catch (e) { return false; }
  }
  async function ki(prompt, system) {
    if (quelle() !== 'eigen') {
      try { return (await serverPost('/hub/ki', {prompt: String(prompt), system: system || ''})).text; }
      catch (e) {
        if (!eigeneKiDa()) throw e;   // ohne eigene KI: Meldung des Servers zeigen
        // sonst: eigene KI springt ein
      }
    }
    return kiEigen(prompt, system);
  }
  async function kiEigen(prompt, system) {
    const anbieter = window.sdKi ? window.sdKi.anbieter() : 'gemini', key = geminiKey();
    if (anbieter === 'gemini') {
      if (!key) throw new Error('Kein Gemini-Schlüssel eingetragen – bitte unter ⚙️ KI einrichten den kostenlosen Schlüssel eintragen.');
      return geminiDirekt(key, prompt, system);
    }
    if (!window.sdKi) throw new Error('KI-Baustein fehlt (sd-ki.js).');
    const max = anbieter === 'lotse' ? 1500 : 2500;   // SD Lotse hat wenig Platz (Text + Antwort zusammen)
    return window.sdKi.schreibe(prompt, system ? {system, maxTokens: max} : {maxTokens: max});
  }
  async function kiTest() {
    const t0 = Date.now();
    try { const t = await ki('Antworte nur mit dem Wort: OK'); return {ok: true, text: t.slice(0, 60), ms: Date.now() - t0}; }
    catch (e) { return {ok: false, error: (e && e.message) || String(e), ms: Date.now() - t0}; }
  }
  const kiFehler = (vor, e) => ({ok: false, error: vor + ((e && e.message) || String(e)).slice(0, 220), ki: true});
  function unitInfo(cur, level, idx) {
    const lv = cur.levels.find(l => l.id === level);
    if (!lv || idx < 0 || idx >= lv.units.length) return [null, null];
    return [lv, {title: lv.units[idx], goals: lv.goals[idx]}];
  }

  function cleanLesson(d) {
    const allowed = new Set(['word', 'say', 'choice', 'write', 'letter', 'rule']), items = [];
    (d.items || []).forEach(it => {
      if (!it || typeof it !== 'object' || !allowed.has(it.type)) return;
      if (it.type === 'choice') {
        const opts = (it.options || []).map(String).slice(0, 4), ans = parseInt(it.answer, 10);
        if (opts.length < 2 || !(ans >= 0 && ans < opts.length)) return;
        it.options = opts; it.answer = ans;
      }
      if ((it.type === 'word' || it.type === 'say') && !String(it.de || '').trim()) return;
      if (it.type === 'write' && !String(it.answer || '').trim()) return;
      if (it.type === 'letter' && !String(it.letter || '').trim()) return;
      const c = {}; Object.keys(it).forEach(k => { c[k] = typeof it[k] === 'string' ? it[k].trim() : it[k]; });
      items.push(c);
    });
    if (!items.length) throw new Error('Lektion ohne gültige Aufgaben');
    return {title: String(d.title || '').slice(0, 120), intro: String(d.intro || '').slice(0, 400), intro_l1: String(d.intro_l1 || '').slice(0, 400), items: items.slice(0, 14)};
  }

  const ITEM_RULES = `ERLAUBTE ITEMS (Felder genau so):
{"type":"word","de":"der Apfel","l1":"<Uebersetzung>","example":"Ich esse einen Apfel.","example_l1":"<Uebersetzung>"}
{"type":"say","de":"<Satz oder Wort zum Nachsprechen>","l1":"<Uebersetzung>"}
{"type":"choice","q":"<Frage auf Deutsch>","q_l1":"<Frage uebersetzt>","options":["...","...","..."],"answer":<Index 0-2>,"audio":"<optional: deutscher Text zum Vorlesen, wenn es eine Hoeraufgabe ist>","explain_l1":"<kurze Erklaerung>"}
{"type":"write","q":"<Aufgabe auf Deutsch, z. B. Luecke: Ich ___ aus Syrien.>","q_l1":"<Aufgabe uebersetzt>","answer":"<richtige Loesung, nur das einzusetzende Wort/Wortgruppe>","audio":"<optional: Text zum Vorlesen (Diktat)>","explain_l1":"<kurze Erklaerung>"}
{"type":"letter","letter":"M m","sound":"<wie er klingt, z. B. mmm>","words":["Mama","Milch","Mund"],"l1":"<kurzer Hinweis>"}
{"type":"rule","title":"<Regel kurz>","text":"<1-3 einfache deutsche Saetze mit Beispielen>","l1":"<Erklaerung in der Erklaersprache>"}`;

  async function lesson(d) {
    const cur = await lehrplan(), level = String(d.level || 'A1'), idx = parseInt(d.unit, 10) || 0;
    const lang = d.lang === 'fa' ? 'fa' : 'en', [lv, unit] = unitInfo(cur, level, idx);
    if (!unit) return {ok: false, error: 'Einheit nicht gefunden'};
    const alpha = level === 'alpha', specs = alpha ? cur.lessons.alpha : cur.lessons.default;
    const spec = specs[Math.max(0, Math.min(4, (parseInt(d.lesson, 10) || 1) - 1))];
    const b = await buch(lang), u = (b.units[level] || [])[idx];
    const core = u ? u.words.filter(w => w.grp === 'Grundwortschatz').map(w => w.de)
      .concat(u.words.filter(w => w.grp !== 'Grundwortschatz').map(w => w.de).slice(0, 40)) : [];
    const weak = (d.weak || []).map(w => String(w).slice(0, 60)).slice(0, 10);
    const prompt = 'Du bist eine erfahrene DaZ-Lehrkraft (Deutsch als Zweitsprache, Integrationskurs) und erstellst EINE Lektion als JSON.\n' +
      `NIVEAU: ${lv.name} – ${lv.desc}\nEINHEIT: ${unit.title} – Lernziele: ${unit.goals}\nLEKTION ${spec.id}: ${spec.name} – Inhalt: ${spec.spec}\n` +
      `ERKLAERSPRACHE fuer alle Felder *_l1 und l1: ${cur.langs[lang]}.\n` +
      (core.length ? `KERNWORTSCHATZ DIESER EINHEIT aus dem Kursbuch (benutze vor allem diese Woerter, genau so geschrieben): ${core.join(', ')}\n` : '') +
      (weak.length ? `Baue diese Woerter, die der Lernende oft falsch hatte, zur Wiederholung ein: ${weak.join(', ')}\n` : '') +
      'WICHTIG: Deutsch muss 100 % korrekt sein (Rechtschreibung, Artikel, Grammatik). Nur Wortschatz und Grammatik passend zum Niveau. ' +
      'Alltagsnah fuer Erwachsene, die in Deutschland leben. Respektvoll und neutral. Bei choice genau eine eindeutig richtige Antwort. ' +
      "Bei write ist 'answer' kurz und eindeutig.\n" +
      (alpha ? 'Alphabetisierung: sehr kurze Woerter (2-6 Buchstaben), keine langen Anweisungen, keine Fachbegriffe.\n' : '') + ITEM_RULES +
      '\n\nAntworte NUR mit JSON: {"title":"...","intro":"1-2 einfache deutsche Saetze","intro_l1":"...","items":[...]}';
    try {
      const l = cleanLesson(jsonAus(await ki(prompt)));
      Object.assign(l, {level, unit: idx, lesson: spec.id, lesson_name: spec.name, unit_title: unit.title});
      return {ok: true, lesson: l};
    } catch (e) { return kiFehler('Lektion konnte nicht erstellt werden: ', e); }
  }

  async function chat(d) {
    const cur = await lehrplan(), level = String(d.level || 'A1'), idx = parseInt(d.unit, 10) || 0;
    const lang = d.lang === 'fa' ? 'fa' : 'en', [lv, unit] = unitInfo(cur, level, idx);
    const msgs = (d.messages || []).filter(m => m && (m.role === 'user' || m.role === 'assistant')).slice(-12);
    const system = 'Du bist ein geduldiger, freundlicher Deutschlehrer und fuehrst ein kurzes ROLLENSPIEL mit einem Lernenden.\n' +
      `NIVEAU: ${lv ? lv.name : 'A1'} – ${lv ? lv.desc : ''}\nTHEMA: ${unit ? unit.title : 'Alltag'} (${unit ? unit.goals : 'freies Gespraech im Alltag'})\n` +
      `Der Lernende heisst ${String(d.name || '').slice(0, 40) || 'unbekannt'}. Erklaersprache: ${cur.langs[lang]}.\n` +
      'Regeln: Sprich in kurzen, einfachen deutschen Saetzen passend zum Niveau (Alphabetisierung/A1: 3-8 Woerter). ' +
      'Bleib in der Rolle (z. B. Verkaeuferin, Aerztin, Vermieter) und stell immer genau EINE Frage, damit es weitergeht. ' +
      'Wenn der Lernende einen Fehler macht, gib die korrigierte Version freundlich an. Der Text kommt teils aus der ' +
      'Spracherkennung – ignoriere fehlende Satzzeichen und Grossschreibung.\n' +
      'Antworte NUR mit JSON: {"reply":"<deine Antwort im Rollenspiel, Deutsch>","correction":"<korrigierter Satz des Lernenden oder leer, wenn alles richtig war>",' +
      '"explain_l1":"<sehr kurze Erklaerung des Fehlers in der Erklaersprache oder leer>","reply_l1":"<Uebersetzung deiner Antwort in die Erklaersprache>"}';
    const verlauf = msgs.length ? msgs.map(m => (m.role === 'user' ? 'LERNENDER: ' : 'LEHRER: ') + String(m.content || '')).join('\n')
      : '(Start: Beginne das Rollenspiel mit einer kurzen Begruessung und einer ersten Frage.)';
    try {
      const j = jsonAus(await ki('BISHERIGES GESPRAECH:\n' + verlauf + '\n\nAntworte jetzt als LEHRER (nur JSON).', system));
      const out = {}; ['reply', 'correction', 'explain_l1', 'reply_l1'].forEach(k => { out[k] = String(j[k] || '').trim().slice(0, 600); });
      if (!out.reply) throw new Error('leere Antwort');
      return Object.assign({ok: true}, out);
    } catch (e) { return kiFehler('Lehrer antwortet nicht: ', e); }
  }

  const trCache = {};
  async function translate(d) {
    const cur = await lehrplan(), text = String(d.text || '').trim().slice(0, 2500), lang = d.lang === 'fa' ? 'fa' : 'en';
    if (!text) return {ok: false, error: 'Kein Text'};
    const k = lang + '|' + text;
    if (trCache[k]) return {ok: true, text: trCache[k]};
    try {
      const t = String(await ki(`Uebersetze den folgenden deutschen Lerntext in ${cur.langs[lang]}. Einfach und natuerlich, Namen und Zahlen unveraendert, ` +
        'Zeilen- und Sprecherstruktur beibehalten. Antworte NUR mit der Uebersetzung.\n\n' + text)).trim();
      if (!t) throw new Error('leer');
      trCache[k] = t;
      return {ok: true, text: t};
    } catch (e) { return kiFehler('Übersetzung fehlgeschlagen: ', e); }
  }

  async function write(d) {
    const cur = await lehrplan(), level = String(d.level || 'A1'), idx = parseInt(d.unit, 10) || 0, lang = d.lang === 'fa' ? 'fa' : 'en';
    const [lv] = unitInfo(cur, level, idx), b = await buch(lang), u = (b.units[level] || [])[idx];
    const text = String(d.text || '').trim().slice(0, 3000);
    if (!lv || !u) return {ok: false, error: 'Einheit nicht gefunden'};
    if (text.length < 2) return {ok: false, error: 'Bitte zuerst etwas schreiben.'};
    const task = u.writes[Math.max(0, Math.min(u.writes.length - 1, parseInt(d.task, 10) || 0))];
    const prompt = 'Du bist eine freundliche DaZ-Lehrkraft und korrigierst einen Text eines Lernenden.\n' +
      `NIVEAU: ${lv.name} – ${lv.desc}\nAUFGABE: ${task.task}\nERKLAERSPRACHE: ${cur.langs[lang]}\n` +
      'Korrigiere nur echte Fehler (Rechtschreibung, Grammatik, Wortstellung, Gross/Kleinschreibung) und lass den Stil des Lernenden. ' +
      'Bewerte, ob die Aufgabe erfuellt ist (alle Punkte). Sei ermutigend und konkret. Maximal 4 Fehler-Hinweise, die wichtigsten zuerst.\n' +
      'Antworte NUR mit JSON: {"corrected":"<korrigierter Text>","score":<0-100>,"praise":"<1 Satz Lob auf Deutsch, einfach>",' +
      '"tips":[{"wrong":"<falsch>","right":"<richtig>","why_l1":"<kurze Erklaerung in der Erklaersprache>"}],' +
      '"task_ok":<true|false>,"missing_l1":"<was in der Aufgabe fehlt, in der Erklaersprache, oder leer>"}\n\nTEXT DES LERNENDEN:\n' + text;
    try {
      const j = jsonAus(await ki(prompt));
      const tips = (j.tips || []).slice(0, 4).filter(t => t && (t.wrong || t.right))
        .map(t => ({wrong: String(t.wrong || '').slice(0, 300), right: String(t.right || '').slice(0, 300), why_l1: String(t.why_l1 || '').slice(0, 300)}));
      const score = Math.max(0, Math.min(100, parseInt(j.score, 10) || 0));
      const out = {ok: true, corrected: String(j.corrected || '').slice(0, 3500), score, praise: String(j.praise || '').slice(0, 300),
        tips, task_ok: !!j.task_ok, missing_l1: String(j.missing_l1 || '').slice(0, 400)};
      if (!out.corrected) throw new Error('leere Korrektur');
      return out;
    } catch (e) { return kiFehler('Korrektur fehlgeschlagen: ', e); }
  }

  // ---------- Aussprache (Aufnahme -> Text) ----------
  function geminiKey() {
    try { return sessionStorage.getItem('biGeminiApiKey') || localStorage.getItem('biGeminiApiKey') || ''; } catch (e) { return ''; }
  }
  async function stt(d) {
    try { return Object.assign({ok: true}, await serverPost('/hub/stt', {audio: d.audio, mime: d.mime || 'audio/wav', mode: 'learn'}, 60)); }
    catch (e) { if (!geminiKey()) return {ok: false, error: e.message, server: true}; }
    const key = geminiKey();
    if (!key || !window.sdGemini) return {ok: false, error: 'Für die Aussprache-Prüfung mit Aufnahme fehlt ein Gemini-Schlüssel.', nokey: true};
    const prompt = 'Schreibe GENAU auf, was in dieser Aufnahme gesagt wird – Wort fuer Wort, auch wenn es falsches Deutsch ist. ' +
      'Korrigiere NICHTS (keine Grammatik, keine Aussprache), ergaenze nichts. Es spricht ein Deutschlernender. ' +
      'Antworte nur mit dem gesprochenen Text. Wenn nichts Verstaendliches gesagt wird: (nichts)';
    try {
      const {antwort: r} = await window.sdGemini.anfrage(key, {contents: [{role: 'user', parts: [{text: prompt}, {inlineData: {mimeType: d.mime || 'audio/wav', data: d.audio}}]}]});
      if (!r.ok) return {ok: false, error: r.status === 429 ? 'Das Gemini-Tageskontingent ist aufgebraucht.' : (r.status === 400 || r.status === 403 ? 'Gemini hat den Schlüssel abgelehnt.' : 'Gemini-Fehler ' + r.status)};
      const j = await r.json();
      let t = ((((j.candidates || [])[0] || {}).content || {}).parts || []).filter(p => !p.thought).map(p => p.text || '').join('').trim();
      t = t.replace(/^["„“”]+|["„“”]+$/g, '').trim();
      if (/^\(?nichts\)?\.?$/i.test(t)) t = '';
      return {ok: true, text: t};
    } catch (e) { return {ok: false, error: 'Keine Verbindung zu Gemini'}; }
  }

  async function route(url, opt) {
    const u = new URL(url, location.href), p = u.pathname, q = u.searchParams;
    const body = opt && opt.body ? JSON.parse(opt.body) : {};
    const lang = q.get('lang') === 'fa' ? 'fa' : 'en';
    if (p.endsWith('/learn/curriculum')) {
      const c = await lehrplan();
      return {levels: c.levels.map(l => ({id: l.id, name: l.name, units: l.units})),
        lessons: {default: c.lessons.default.map(l => ({id: l.id, name: l.name})), alpha: c.lessons.alpha.map(l => ({id: l.id, name: l.name}))}};
    }
    let m = p.match(/\/learn\/book\/([^/]+)\/(\d+)$/);
    if (m) {
      const b = await buch(lang), un = (b.units[decodeURIComponent(m[1])] || [])[+m[2]];
      if (!un) return [{ok: false, error: 'Einheit nicht gefunden'}, 404];
      const c = Object.assign({}, un); delete c.poolWords; delete c.poolSents;
      return {ok: true, unit: c};
    }
    if (p.endsWith('/learn/pool')) return Object.assign({ok: true}, await pool(q.get('level') || 'A1', parseInt(q.get('unit'), 10) || 0, lang));
    if (p.endsWith('/learn/dictionary')) {
      const w = (await pool('B1', 99, lang)).words.map(x => ({de: x.de, pl: x.pl, art: x.art, pic: x.pic, ph: x.ph, l1: x.l1, level: x.level, unit: x.unit}));
      return {ok: true, words: w};
    }
    if (p.endsWith('/learn/grammar')) return {ok: true, grammar: await grammarAll(lang), channels: (await buch(lang)).channels};
    if (p.endsWith('/learn/articles')) return Object.assign({ok: true}, (await buch(lang)).articles);
    if (p.endsWith('/learn/lesson')) return lesson(body);
    if (p.endsWith('/learn/chat')) return chat(body);
    if (p.endsWith('/learn/translate')) return translate(body);
    if (p.endsWith('/learn/write')) return write(body);
    if (p.endsWith('/stt')) return stt(body);
    return null;
  }

  async function lernFetch(url, opt) {
    const s = String(url);
    if (!/^\/(learn\/|stt$)/.test(s)) return fetch(url, opt);
    let r = await route(s, opt);
    if (r === null) return antwort({ok: false, error: 'Unbekannt: ' + s}, 404);
    if (Array.isArray(r)) return antwort(r[0], r[1]);
    return antwort(r);
  }

  window.SDLernAPI = {fetch: lernFetch, kiTest, SERVER, quelle, pool, grammarAll, geminiKey, _jsonAus: jsonAus, _cleanLesson: cleanLesson};
})();
