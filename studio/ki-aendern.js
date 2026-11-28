/* SD Code-Studio · „Ändern mit KI“ unten im Studio.
   1. Wunsch eintippen → Anfrage (mit den Projektdateien) kopieren → bei Gemini/ChatGPT/Claude einfügen.
   2. Antwort der KI hier einfügen → nur die zurückgegebenen Dateien werden übernommen.
   Vorher wird ein Stand unter „Versionen“ gesichert; „Rückgängig“ stellt die betroffenen Dateien wieder her.
   Dateien, in denen die KI offensichtlich Code weggelassen hat („… Rest unverändert“), werden zurückgehalten. */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const MAX_DATEIEN = 12, MAX_GESAMT = 95000, MAX_EINZELN = 55000;
  let RUECK = null;      // { projekt, vorher: {pfad: inhalt|undefined} }
  let ZURUECK = [];      // zurückgehaltene Dateien [{path, content, grund}]

  let ANTWORT = null, HALT = null, LAEUFT = false;
  function stand() {
    if (!S.p) return null;
    const files = {...S.p.dateien};
    for (const [name, doc] of Object.entries(S.docs || {})) {
      if (typeof doc?.getValue === 'function') files[name] = doc.getValue();
      else if (typeof doc?.wert === 'string') files[name] = doc.wert;
    }
    return {projekt:S.p, aktiv:S.aktiv, files};
  }
  function aktuell(a) {
    const b = stand();
    return !!(a && b && a.projekt === b.projekt && a.aktiv === b.aktiv &&
      Object.keys(a.files).length === Object.keys(b.files).length &&
      Object.keys(a.files).every(k => Object.prototype.hasOwnProperty.call(b.files,k) && a.files[k] === b.files[k]));
  }
  function antwortGeaendert() {
    ZURUECK = []; HALT = null; zurueckZeigen();
    ANTWORT = stand();
    status('Antwort bearbeitet. Bitte prüfen und bewusst auf Übernehmen klicken.', '');
  }
  const istText = v => typeof v === 'string' && !v.startsWith('data:');

  function dateienWaehlen(p, aktiv) {
    const K = window.SDKICoding, d = p.dateien || {};
    const reihenfolge = [], gesehen = new Set(), weg = { gross: [], geheim: [], mehr: [] };
    const nimm = pfad => { if (!gesehen.has(pfad)) { gesehen.add(pfad); reihenfolge.push(pfad); } };
    (K.suggestChangeFiles(p, aktiv) || []).forEach(nimm);
    Object.keys(d).filter(x => istText(d[x])).sort((a, b) => d[a].length - d[b].length).forEach(nimm);
    const gewaehlt = []; let summe = 0;
    for (const pfad of reihenfolge) {
      const v = d[pfad];
      if (!istText(v)) continue;
      if (!K.changeFileAllowed(pfad, v)) { weg.geheim.push(pfad); continue; }
      if (v.length > MAX_EINZELN || summe + v.length > MAX_GESAMT) { weg.gross.push(pfad); continue; }
      if (gewaehlt.length >= MAX_DATEIEN) { weg.mehr.push(pfad); continue; }
      gewaehlt.push(pfad); summe += v.length;
    }
    return { gewaehlt, weg };
  }

  function anfrageBauen(wunsch) {
    const p = S.p, K = window.SDKICoding;
    const { gewaehlt, weg } = dateienWaehlen(p, S.aktiv);
    if (!gewaehlt.length) throw Error('Im Projekt gibt es keine Textdatei, die mitgeschickt werden kann.');
    const text = K.buildChangePrompt(wunsch, p, gewaehlt) + '\n\n' +
      'Antworte so kurz wie möglich: nur die geänderten oder neuen Dateien im genannten Format, jede Datei vollständig. Keine Erklärung nötig.';
    const hinweise = [];
    if (weg.geheim.length) hinweise.push('nicht mitgeschickt (mögliche Zugangsdaten): ' + weg.geheim.join(', '));
    if (weg.gross.length) hinweise.push('zu groß, nicht mitgeschickt: ' + weg.gross.join(', '));
    if (weg.mehr.length) hinweise.push('über ' + MAX_DATEIEN + ' Dateien, nicht mitgeschickt: ' + weg.mehr.join(', '));
    return { text, gewaehlt, hinweise };
  }

  // Erkennt Antworten, in denen die KI Code weggelassen hat.
  function luecke(pfad, neu, alt) {
    const komm = /^\s*(?:\/\/|#|<!--|\/\*+|\*|--|;)\s*(?:\.{3}|…)/m;
    const worte = /^\s*(?:\/\/|#|<!--|\/\*+|\*|--)[^\n]*\b(?:rest(?:licher)?(?: code| der datei)?|unverändert|bleibt (?:gleich|unverändert|wie)|wie (?:bisher|vorher)|bisherige[rn]? code|existing code|unchanged|same as before|keep (?:the )?existing|previous code|other code|code here|remaining code)\b/im;
    if (komm.test(neu) || worte.test(neu)) return 'enthält einen Platzhalter statt Code (z. B. „… Rest unverändert“)';
    if (typeof alt === 'string' && alt.length > 1500) {
      if (/^\s*(?:\.{3}|…)\s*$/m.test(neu) && neu.length < alt.length * 0.7) return 'enthält „…“ statt Code';
      if (neu.length < alt.length * 0.35) return 'ist viel kürzer als vorher (' + Math.round(neu.length / 1000) + ' statt ' + Math.round(alt.length / 1000) + ' KB) – vermutlich fehlt Code';
    }
    return '';
  }

  function status(text, art) {
    const o = $('kaStatus'); if (!o) return;
    o.textContent = text; o.dataset.art = art || '';
  }

  async function anwenden(liste, quelle) {
    const p = S.p, d = p.dateien;
    const basis = stand();
    const echt = liste.filter(f => d[f.path] !== f.content);
    if (!echt.length) return { geaendert: [], neu: [] };
    if (typeof versionNeu === 'function') await versionNeu('Vor KI-Änderung (' + quelle + ')', true);
    if (!aktuell(basis)) throw Error('Projekt wurde inzwischen geändert. Bitte neue KI-Anfrage erstellen.');
    const vorher = {};
    const geaendert = [], neu = [];
    for (const f of echt) {
      vorher[f.path] = Object.prototype.hasOwnProperty.call(d, f.path) ? d[f.path] : undefined;
      (vorher[f.path] === undefined ? neu : geaendert).push(f.path);
      d[f.path] = f.content;
      if (S.docs && S.docs[f.path] && S.docs[f.path].setValue && S.docs[f.path].getValue() !== f.content) S.docs[f.path].setValue(f.content);
    }
    RUECK = RUECK && RUECK.projekt === p ? { projekt: p, vorher: Object.assign({}, vorher, RUECK.vorher) } : { projekt: p, vorher };
    await projSchreiben(p);
    nachher();
    return { geaendert, neu };
  }

  function nachher() {
    if (typeof baum === 'function') baum();
    if (typeof tabsZeigen === 'function') tabsZeigen();
    try {
      if (typeof istWebProjekt === 'function' && istWebProjekt() && $('vorschau') && !$('vorschau').hidden && typeof vorschau === 'function') vorschau(false);
    } catch (e) { /* Vorschau ist optional */ }
    if ($('kaRueck')) $('kaRueck').hidden = !RUECK;
  }

  function zurueckZeigen() {
    const box = $('kaZurueck'); if (!box) return;
    box.hidden = !ZURUECK.length;
    if (!ZURUECK.length) { box.innerHTML = ''; return; }
    box.innerHTML = '';
    const t = document.createElement('div');
    t.textContent = '⚠ Nicht übernommen: ' + ZURUECK.map(f => f.path + ' – ' + f.grund).join(' · ') +
      '. Am besten bei der KI nachfragen: „Bitte ' + ZURUECK.map(f => f.path).join(', ') + ' vollständig ohne Auslassungen ausgeben.“';
    const b = document.createElement('button'); b.type = 'button'; b.textContent = 'Trotzdem übernehmen';
    b.onclick = async () => {
      if (LAEUFT) return;
      if (!aktuell(HALT)) { ZURUECK = []; HALT = null; zurueckZeigen(); status('Projekt geändert. Bitte neue KI-Anfrage erstellen.', 'fehler'); return; }
      LAEUFT = true;
      try { const l = ZURUECK; ZURUECK = []; HALT = null; zurueckZeigen(); const r = await anwenden(l, 'trotzdem'); status('✓ Übernommen: ' + r.geaendert.concat(r.neu).join(', ') + '. „Rückgängig“ holt den alten Stand zurück.', 'ok'); }
      catch(e) { status(e.message, 'fehler'); }
      finally { LAEUFT = false; }
    };
    box.append(t, b);
  }

  async function einfuegen(text) {
    if (!S.p) { status('Bitte zuerst ein Projekt öffnen.', 'fehler'); return; }
    text = String(text || '');
    if (!text.trim()) { status('Das Feld ist leer – bitte die ganze Antwort der KI einfügen.', 'fehler'); return; }
    const K = window.SDKICoding;
    const r = K.parse(text, S.aktiv, S.p.dateien);
    if (!r.files.length) { status('Nichts übernommen: ' + (r.errors[0] || 'kein Code erkannt.') + ' Tipp: In Gemini unter der Antwort auf „Kopieren“ klicken, nicht nur einen Codeblock.', 'fehler'); return; }
    const ok = [], halt = [];
    for (const f of r.files) {
      const grund = luecke(f.path, f.content, S.p.dateien[f.path]);
      (grund ? halt : ok).push(grund ? Object.assign({ grund }, f) : f);
    }
    ZURUECK = []; HALT = null; zurueckZeigen();
    const erg = ok.length ? await anwenden(ok, 'eingefügt') : { geaendert: [], neu: [] };
    ZURUECK = halt; HALT = stand();
    zurueckZeigen();
    const teile = [];
    if (erg.geaendert.length) teile.push('geändert: ' + erg.geaendert.join(', '));
    if (erg.neu.length) teile.push('neu: ' + erg.neu.join(', '));
    const gleich = ok.length - erg.geaendert.length - erg.neu.length;
    if (gleich > 0) teile.push(gleich + ' Datei' + (gleich === 1 ? '' : 'en') + ' schon identisch');
    const warn = r.errors.concat(r.warnings.filter(w => !/Erklärungs|Shell-Befehl/.test(w)));
    if (teile.length && (erg.geaendert.length || erg.neu.length)) {
      $('kaAntwort').value = '';
      status('✓ ' + teile.join(' · ') + '. Vorheriger Stand liegt unter Versionen; „Rückgängig“ holt ihn sofort zurück.' + (warn.length ? ' Hinweis: ' + warn.join(' ') : ''), 'ok');
      if (erg.geaendert.concat(erg.neu).length && typeof dateiOeffnen === 'function') { const erste = erg.geaendert[0] || erg.neu[0]; if (erste !== S.aktiv) dateiOeffnen(erste); }
    } else if (halt.length) status('Nichts übernommen – siehe Hinweis unten.', 'fehler');
    else status((teile.join(' · ') || 'Keine Änderung erkannt.') + (warn.length ? ' ' + warn.join(' ') : ''), warn.length ? 'fehler' : '');
  }

  async function rueckgaengig() {
    if (!RUECK || RUECK.projekt !== S.p) { RUECK = null; nachher(); return; }
    const d = S.p.dateien, namen = [];
    for (const [pfad, alt] of Object.entries(RUECK.vorher)) {
      if (alt === undefined) delete d[pfad]; else d[pfad] = alt;
      if (alt !== undefined && S.docs && S.docs[pfad] && S.docs[pfad].setValue) S.docs[pfad].setValue(alt);
      namen.push(pfad);
    }
    if (S.aktiv && d[S.aktiv] == null) S.aktiv = Object.keys(d)[0] || null;
    RUECK = null;
    await projSchreiben(S.p);
    nachher();
    if (S.aktiv && typeof dateiOeffnen === 'function') dateiOeffnen(S.aktiv);
    status('↶ Zurückgesetzt: ' + namen.join(', '), 'ok');
  }

  async function kopieren() {
    if (!S.p) { status('Bitte zuerst ein Projekt öffnen.', 'fehler'); return; }
    const wunsch = $('kaWunsch').value.trim();
    if (!wunsch) { status('Bitte zuerst aufschreiben, was geändert werden soll.', 'fehler'); $('kaWunsch').focus(); return; }
    if (typeof speichernJetzt === 'function') await speichernJetzt();
    let a;
    try { a = anfrageBauen(wunsch); } catch (e) { status(e.message, 'fehler'); return; }
    const info = 'Mitgeschickt: ' + a.gewaehlt.join(', ') + (a.hinweise.length ? ' · ' + a.hinweise.join(' · ') : '');
    const box = $('kaKopie');
    try {
      await navigator.clipboard.writeText(a.text);
      box.hidden = true;
      status('✓ Anfrage kopiert. Jetzt bei Gemini (oder ChatGPT/Claude) einfügen, die Antwort kopieren und rechts einfügen. ' + info, 'ok');
    } catch (e) {
      box.hidden = false; box.value = a.text; box.focus(); box.select();
      status('Der Browser hat das Kopieren blockiert. Der Text ist markiert – bitte mit Strg+C kopieren. ' + info, 'fehler');
    }
  }

  function bauen() {
    const feld = document.querySelector('#unten [data-feld="kiaendern"]');
    if (!feld || feld.dataset.bereit) return;
    feld.dataset.bereit = '1';
    $('kaKopieren').onclick = kopieren;
    $('kaUebernehmen').onclick = async () => {
      if (LAEUFT) return;
      if (!aktuell(ANTWORT)) { status('Projekt oder Dateien geändert. Bitte neue KI-Anfrage erstellen und Antwort erneut einfügen.', 'fehler'); return; }
      LAEUFT = true;
      try { await einfuegen($('kaAntwort').value); ANTWORT = null; }
      catch(e) { status(e.message, 'fehler'); }
      finally { LAEUFT = false; }
    };
    $('kaRueck').onclick = rueckgaengig;
    $('kaAntwort').addEventListener('input', antwortGeaendert);
    $('kaWunsch').addEventListener('keydown', e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); kopieren(); } });
  }

  function zeigen() {
    if (typeof istHandy === 'function' && istHandy() && typeof ansicht === 'function') ansicht('ausgabe');
    if (typeof unten === 'function') unten('kiaendern');
    setTimeout(() => $('kaWunsch') && $('kaWunsch').focus(), 30);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bauen); else bauen();
  window.SDKIAendern = { zeigen, einfuegen, rueckgaengig, anfrageBauen, _luecke: luecke };
})();
