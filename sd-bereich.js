/* Gemeinsame Helfer der kleinen Bereiche. Erwartet window.SD_I18N (de/en) und ../i18n.js. */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const L = () => window.SD_I18N[window.SD_LANG === 'en' ? 'en' : 'de'] || {};
  function t(k, v) {
    let s = L()[k] != null ? L()[k] : ((window.SD_I18N.de || {})[k] != null ? window.SD_I18N.de[k] : k);
    if (v) Object.keys(v).forEach((x) => { s = String(s).split('{' + x + '}').join(v[x]); });
    return s;
  }
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const neueId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  // Daten (localStorage), immer mit Ausweichwert
  function lesen(key, ersatz) {
    try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : ersatz; } catch (e) { return ersatz; }
  }
  function schreiben(key, wert) {
    try { localStorage.setItem(key, JSON.stringify(wert)); return true; } catch (e) { return false; }
  }

  // Datum (ISO yyyy-mm-dd, lokale Zeit)
  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function heute() { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function heuteIso() { return iso(heute()); }
  function datum(s) { return s ? new Date(s + 'T00:00:00') : null; }
  function tageBis(s) { const d = datum(s); return d ? Math.round((d - heute()) / 86400000) : null; }
  function fmt(s) {
    const d = datum(s);
    return d ? d.toLocaleDateString(window.SD_LANG === 'en' ? 'en-GB' : 'de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
  }
  function plusMonate(s, n) {
    const d = datum(s);
    const tag = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + n);
    const letzter = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(tag, letzter));
    return iso(d);
  }
  function plusTage(s, n) { const d = datum(s); d.setDate(d.getDate() + n); return iso(d); }
  function euro(n) {
    return (Number(n) || 0).toLocaleString(window.SD_LANG === 'en' ? 'en-GB' : 'de-DE', { style: 'currency', currency: 'EUR' });
  }
  function zahl(s) {
    if (typeof s === 'number') return s;
    const x = String(s || '').trim().replace(/\s/g, '');
    if (!x) return 0;
    // 1.234,56 oder 1234,56 oder 1234.56
    const n = /,\d{1,2}$/.test(x) ? x.replace(/\./g, '').replace(',', '.') : x.replace(/,/g, '');
    const v = parseFloat(n);
    return isFinite(v) ? v : 0;
  }

  function herunterladen(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }
  function dateiname(s, ext) { return String(s || 'datei').replace(/[^\wäöüÄÖÜß.-]+/g, '-').replace(/-+/g, '-').slice(0, 60) + (ext || ''); }

  // Kalender (.ics): ganztaegig, Erinnerung x Tage vorher (9 Uhr) und am Tag (8 Uhr)
  function icsText(s) { return String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n'); }
  function icsEreignis(e) {
    const tag = e.datum.replace(/-/g, '');
    const ende = plusTage(e.datum, 1).replace(/-/g, '');
    const z = ['BEGIN:VEVENT', 'UID:' + (e.uid || neueId()) + '-' + tag + '@thesdhub.com',
      'DTSTAMP:' + new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z',
      'DTSTART;VALUE=DATE:' + tag, 'DTEND;VALUE=DATE:' + ende, 'SUMMARY:' + icsText(e.titel)];
    if (e.text) z.push('DESCRIPTION:' + icsText(e.text));
    const vorher = Math.max(0, Number(e.vorher) || 0);
    if (vorher > 0) z.push('BEGIN:VALARM', 'TRIGGER:-PT' + (vorher * 24 - 9) + 'H', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsText(e.titel), 'END:VALARM');
    z.push('BEGIN:VALARM', 'TRIGGER:PT8H', 'ACTION:DISPLAY', 'DESCRIPTION:' + icsText(e.titel), 'END:VALARM', 'END:VEVENT');
    return z;
  }
  function icsDatei(ereignisse, name) {
    const z = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SD Hub//DE'];
    ereignisse.forEach((e) => z.push.apply(z, icsEreignis(e)));
    z.push('END:VCALENDAR');
    herunterladen(new Blob([z.join('\r\n')], { type: 'text/calendar' }), name);
  }

  // CSV mit Semikolon (Excel in Deutschland)
  function csv(zeilen, name) {
    const zelle = (v) => { const s = String(v == null ? '' : v); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    herunterladen(new Blob(['\ufeff' + zeilen.map((r) => r.map(zelle).join(';')).join('\r\n')], { type: 'text/csv;charset=utf-8' }), name);
  }

  let toastTimer = null;
  function toast(text, ms) {
    let el = $('toast');
    if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; document.body.appendChild(el); }
    // Bei offenem Dialog den Hinweis im Dialog zeigen, sonst liegt er dahinter
    const offen = document.querySelector('dialog[open]');
    if (offen && el.parentNode !== offen) offen.appendChild(el);
    else if (!offen && el.parentNode !== document.body) document.body.appendChild(el);
    el.textContent = text;
    el.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.hidden = true; }, ms || 2600);
  }

  // Zweistufiges Loeschen ohne confirm(): erster Tipp fragt, zweiter loescht
  function sicherFragen(knopf, fragetext, aktion) {
    if (knopf.dataset.sicher) { delete knopf.dataset.sicher; knopf.textContent = knopf.dataset.alt; aktion(); return; }
    knopf.dataset.alt = knopf.textContent;
    knopf.dataset.sicher = '1';
    knopf.textContent = fragetext;
    setTimeout(() => { if (knopf.dataset.sicher) { delete knopf.dataset.sicher; knopf.textContent = knopf.dataset.alt; } }, 4000);
  }

  // Lebenslauf-Daten (Name, Anschrift …) – falls vorhanden
  function lebenslauf() {
    for (const ort of [sessionStorage, localStorage]) {
      try { const r = ort.getItem('lebenslaufDaten'); if (r) return JSON.parse(r) || {}; } catch (e) { /* weiter */ }
    }
    return {};
  }

  // Brief an das Schreibstudio uebergeben (gleicher Weg wie der Post-Assistent)
  function anSchreibstudio(brief) {
    try { sessionStorage.setItem('sdPostAntwort', JSON.stringify(brief)); } catch (e) { return false; }
    location.href = '../schreibstudio/index.html';
    return true;
  }

  // ---- Vertraege: Kuendigungstermin berechnen (auch fuer Fristen-Uebersicht) ----
  // Datum minus Kuendigungsfrist
  function minusFrist(isoDatum, v) {
      const n = Number(v.fristZahl) || 0;
      if (v.fristEinheit === 'tage') return plusTage(isoDatum, -n);
      if (v.fristEinheit === 'wochen') return plusTage(isoDatum, -7 * n);
      return plusMonate(isoDatum, -n);
  }
  function plusFrist(isoDatum, v) {
      const n = Number(v.fristZahl) || 0;
      if (v.fristEinheit === 'tage') return plusTage(isoDatum, n);
      if (v.fristEinheit === 'wochen') return plusTage(isoDatum, 7 * n);
      return plusMonate(isoDatum, n);
  }
  // Wann muss gekuendigt werden, wann endet der Vertrag dann?
  // Laufzeitende = Beginn + Mindestlaufzeit - 1 Tag; danach unbefristet (jederzeit mit Frist)
  // oder Verlaengerung um n Monate.
  function vertragTermin(v) {
      const heute = heuteIso();
      if (v.gekuendigt) return { art: 'gekuendigt', ende: v.gekuendigt };
      if (!v.beginn) return { art: 'ohne' };
      const mindest = Number(v.mindest) || 0;
      const danach = Number(v.danach) || 0;
      let ende = mindest > 0 ? plusTage(plusMonate(v.beginn, mindest), -1) : null;
      if (ende && minusFrist(ende, v) >= heute) return { art: 'bis', bis: minusFrist(ende, v), ende };
      if (danach === 0) {
          // unbefristet: Kuendigung heute -> Ende nach Ablauf der Frist (nicht vor Laufzeitende)
          let frueh = plusFrist(heute, v);
          if (ende && frueh < ende) frueh = ende;
          return { art: 'jederzeit', ende: frueh };
      }
      if (!ende) ende = plusTage(v.beginn, -1);
      let i = 0;
      while (minusFrist(ende, v) < heute && i < 400) { ende = plusTage(plusMonate(plusTage(ende, 1), danach), -1); i++; }
      return { art: 'bis', bis: minusFrist(ende, v), ende };
  }

  document.addEventListener('click', (e) => {
    const b = e.target.closest('dialog [data-zu]');
    if (b) b.closest('dialog').close();
  });

  window.SD = { $, t, esc, neueId, lesen, schreiben, iso, heute, heuteIso, datum, tageBis, fmt, plusMonate, plusTage, euro, zahl, herunterladen, dateiname, icsDatei, csv, toast, sicherFragen, lebenslauf, anSchreibstudio, vertragTermin };
})();
