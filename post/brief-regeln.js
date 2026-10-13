/* SD Hub – Post-Assistent: Fakten aus dem Brieftext mit festen Regeln lesen.
   Ohne KI: Briefdatum, Fristen/Termine, Betraege, Aktenzeichen & Nummern,
   IBAN, Art des Briefs und Hinweise. Damit haengen diese Angaben nicht
   davon ab, ob ein (kleines) KI-Modell das Antwortformat einhaelt.
   Alles laeuft lokal; nichts wird gesendet. */
(function (g) {
  'use strict';

  const MONATE = { januar: 1, jan: 1, februar: 2, feb: 2, 'märz': 3, maerz: 3, mrz: 3, 'mär': 3, april: 4, apr: 4, mai: 5, juni: 6, jun: 6, juli: 7, jul: 7, august: 8, aug: 8, september: 9, sep: 9, sept: 9, oktober: 10, okt: 10, november: 11, nov: 11, dezember: 12, dez: 12 };
  const MONAT_RE = Object.keys(MONATE).sort((a, b) => b.length - a.length).join('|');
  // 12.03.2026 | 12.3.26 | 12. März 2026 | 12. Mrz. 2026
  const DATUM_RE = new RegExp('\\b(\\d{1,2})\\.\\s?(?:(\\d{1,2})\\.\\s?(\\d{4}|\\d{2})(?!\\d)|(' + MONAT_RE + ')\\.?\\s+(\\d{4}))', 'gi');

  function iso(j, m, d) {
    if (j < 100) j += 2000;
    const dt = new Date(j, m - 1, d);
    if (dt.getFullYear() !== j || dt.getMonth() !== m - 1 || dt.getDate() !== d) return '';
    if (j < 1990 || j > 2100) return '';
    return j + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
  }
  function alleDaten(text) {
    const erg = [];
    let m;
    DATUM_RE.lastIndex = 0;
    while ((m = DATUM_RE.exec(text)) !== null) {
      const d = Number(m[1]);
      const mon = m[2] ? Number(m[2]) : MONATE[String(m[4]).toLowerCase()];
      const j = Number(m[3] || m[5]);
      const i = iso(j, mon, d);
      if (i) erg.push({ iso: i, index: m.index, ende: DATUM_RE.lastIndex, roh: m[0] });
    }
    return erg;
  }
  const heute = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
  function tageBis(i, basis) { return Math.round((new Date(i + 'T00:00:00') - new Date((basis || heute()) + 'T00:00:00')) / 86400000); }

  // Satz bzw. Zeilenstueck rund um eine Stelle (fuer "Beleg" und Kontext)
  function umgebung(text, start, ende) {
    let a = start, b = ende;
    while (a > 0 && start - a < 220 && !/[\n.!?]/.test(text[a - 1])) a--;
    // Punkt in einem Datum ("12.03.") ist kein Satzende
    while (b < text.length && b - ende < 220 && !(/[\n!?]/.test(text[b]) || (text[b] === '.' && !/\d/.test(text[b + 1] || '') && !/\d/.test(text[b - 1] || '')))) b++;
    return text.slice(a, b + 1).replace(/\s+/g, ' ').trim();
  }
  function vorher(text, idx, n) { return text.slice(Math.max(0, idx - n), idx).toLowerCase(); }

  // ---------------- Briefdatum ----------------
  function briefdatum(text, daten) {
    const kopf = text.slice(0, Math.max(600, Math.floor(text.length * 0.45)));
    let best = null;
    for (const d of daten) {
      if (d.index > kopf.length) break;
      const v = vorher(text, d.index, 40);
      const zeile = text.slice(text.lastIndexOf('\n', d.index) + 1, d.index).trim();
      let p = 0;
      if (/datum\s*:?\s*$/.test(v)) p += 5;
      if (/^[A-ZÄÖÜa-zäöüß .\-]{2,40},?\s*(den\s*)?$/.test(zeile)) p += 3;            // "Berlin, 12.03.2026"
      if (zeile === '') p += 1;                                                       // Datum allein in einer Zeile
      if (/(geb\.|geboren|vom|seit|ab|bis|frist|zum|spätestens|zeitraum|leistungen für|am)\s*$/.test(v)) p -= 6;
      if (tageBis(d.iso) > 7) p -= 2;                                                  // Briefdatum liegt fast nie in der Zukunft
      if (p > 0 && (!best || p > best.p)) best = { iso: d.iso, p, beleg: umgebung(text, d.index, d.ende) };
    }
    return best;
  }

  // ---------------- Fristen und Termine ----------------
  const FRIST_STARK = /(bis\s+(zum|spätestens|spaetestens|einschließlich)|spätestens(\s+(bis|am|zum))?|frist|fällig(\s+am|\s+zum)?|faellig|zahlbar\s+(bis|zum)|einzureichen\s+bis|bis\s+einschließlich|vorlegen\s+bis|zurück\s+bis|eingang\s+bis|nicht\s+später\s+als)[^\n]{0,25}$/;
  const TERMIN = /(termin|einladung|laden\s+wir\s+sie|laden\s+sie|melden\s+sie\s+sich|erscheinen|vorsprache|gespräch|gespraech|untersuchung|besichtigung|ablesung)/;
  function fristen(text, daten, briefIso) {
    const erg = [];
    for (const d of daten) {
      if (briefIso && d.iso === briefIso) continue;
      const v = vorher(text, d.index, 60);
      const nach = text.slice(d.ende, d.ende + 40).toLowerCase();
      const satz = umgebung(text, d.index, d.ende);
      const s = satz.toLowerCase();
      if (/(vom|schreiben vom|bescheid vom|antrag vom|rechnung vom|geb\.|geboren am)\s*$/.test(v)) continue;
      // Zeitraum "01.11.2026 bis 30.04.2027" ist keine Frist
      if (/\d{1,2}\.\s?\d{1,2}\.\s?\d{2,4}\s*(bis|-|–)\s*$/.test(v) || /^\s*(bis|-|–)\s*\d{1,2}\./.test(nach)) continue;
      // Der Absender muss etwas tun (z. B. Guthaben erstatten): keine Frist fuer die Person
      if (/(wird|werden)\s+ihnen\s.{0,80}(erstattet|überwiesen|ueberwiesen|gutgeschrieben|ausgezahlt|zugesandt|zugeschickt)/.test(s)) continue;
      const uhr = (nach.match(/^\s*(?:,\s*)?(?:um\s*)?(\d{1,2})[:.](\d{2})\s*uhr/) || s.match(/(?:um\s*)(\d{1,2})[:.](\d{2})\s*uhr/));
      let art = '', p = 0;
      if (FRIST_STARK.test(v)) { art = 'frist'; p = 5; }
      else if (uhr || (TERMIN.test(s) && /\bam\s*$/.test(v))) { art = 'termin'; p = 4; }
      else if (/\b(bis|zum)\s*$/.test(v) && /(zahl|überweis|einreich|vorleg|zurück|nachweis|unterlag|melden|antwort|mitteil|widerspruch|stellungnahme)/.test(s)) { art = 'frist'; p = 3; }
      else continue;
      if (/(zeitraum|bewilligungszeitraum|leistungen\s+für|gültig\s+bis|gilt\s+bis|vertragslaufzeit|laufzeit)/.test(v + ' ' + s.slice(0, 60)) && art === 'frist' && p < 5) continue;
      erg.push({ iso: d.iso, art, p, uhrzeit: uhr ? String(uhr[1]).padStart(2, '0') + ':' + uhr[2] : '', beleg: satz });
    }
    // gleiche Daten zusammenfassen
    const map = new Map();
    erg.forEach(e => { const k = e.iso + e.art; if (!map.has(k) || map.get(k).p < e.p) map.set(k, e); });
    return Array.from(map.values()).sort((a, b) => a.iso.localeCompare(b.iso));
  }
  // "innerhalb eines Monats nach Bekanntgabe" usw.
  function fristRegeln(text) {
    const re = /(innerhalb\s+(?:von\s+)?(?:einer|eines|einem|zwei|drei|vier|sechs|acht|zehn|vierzehn|\d{1,2})\s+(?:woche|wochen|monat|monats|monaten|tag|tage|tagen|werktag|werktagen)[^.\n]{0,120})/gi;
    const out = []; let m;
    while ((m = re.exec(text)) !== null) {
      const satz = umgebung(text, m.index, re.lastIndex);
      if (!out.some(x => x === satz)) out.push(satz);
    }
    return out.slice(0, 3);
  }

  // ---------------- Betraege ----------------
  const BETRAG_RE = /(?:(?:€|EUR|Euro)\s*(-?\d{1,3}(?:\.\d{3})*,\d{2}|-?\d+,\d{2}|-?\d{1,3}(?:\.\d{3})+|-?\d+)(?![\d,])|(-?\d{1,3}(?:\.\d{3})*,\d{2}|-?\d+,\d{2}|-?\d{1,3}(?:\.\d{3})+(?:,-)?|-?\d+(?:,-)?)\s*(?:€|EUR\b|Euro\b))/g;
  function zahl(s) { return Number(String(s).replace(/,-$/, '').replace(/\./g, '').replace(',', '.')); }
  function betraege(text) {
    const erg = []; let m;
    BETRAG_RE.lastIndex = 0;
    while ((m = BETRAG_RE.exec(text)) !== null) {
      const roh = m[1] || m[2];
      const wert = zahl(roh);
      if (!isFinite(wert) || wert === 0) continue;
      const v = vorher(text, m.index, 70);
      const satz = umgebung(text, m.index, BETRAG_RE.lastIndex).toLowerCase();
      const nah = v.slice(-35);
      let p = 1;
      if (/(gesamt|zu zahlen|zahlbetrag|offen|forderung|rückforderung|rueckforderung|nachzahlung|erstattung|erstatten|guthaben|rechnungsbetrag|endbetrag|summe|überweisen|ueberweisen|zahlen sie|schulden|mahngebühr|säumniszuschlag|bußgeld|bussgeld)/.test(v + ' ' + satz)) p += 2;
      if (/(forderung|nachzahlung|guthaben|rechnungsbetrag|erstattungsbetrag|rückforderung|bußgeld|summe)[^\n]{0,25}$/.test(nah)) p += 4;
      if (/(gesamtbetrag|gesamt|insgesamt|zu zahlen|zahlbetrag|offener betrag|endbetrag|noch offen)[^\n]{0,25}$/.test(nah) || /insgesamt/.test(nah)) p += 6;
      if (/(monatlich|abschlag|abschläge|raten?\b)[^\n]{0,25}$/.test(nah)) p -= 1;
      if (/(mwst|ust|steuer\s*\d|netto)/.test(v.slice(-25))) p -= 2;
      erg.push({ wert, text: wert.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €', p, index: m.index, beleg: umgebung(text, m.index, BETRAG_RE.lastIndex) });
    }
    return erg;
  }
  function hauptbetrag(liste) {
    if (!liste.length) return null;
    // hoechste Punktzahl; bei Gleichstand der spaetere (Summen stehen meist unten)
    return liste.slice().sort((a, b) => (b.p - a.p) || (b.index - a.index))[0];
  }

  // ---------------- Zeichen und Nummern ----------------
  const NUMMERN = [
    ['Aktenzeichen', /(?:Aktenzeichen|Az\.|Gesch(?:ä|ae)ftszeichen|Unser Zeichen|Ihr Zeichen|Zeichen)\s*[:.]?\s*/i],
    ['BG-Nummer', /(?:BG-?Nummer|Nummer der Bedarfsgemeinschaft|BG-Nr\.?)\s*[:.]?\s*/i],
    ['Kassenzeichen', /Kassenzeichen\s*[:.]?\s*/i],
    ['Kundennummer', /Kunden-?\s?(?:nummer|nr\.?)\s*[:.]?\s*/i],
    ['Rechnungsnummer', /(?:Rechnungs-?\s?(?:nummer|nr\.?)|Rechnung\s+Nr\.?)\s*[:.]?\s*/i],
    ['Kindergeldnummer', /Kindergeld-?\s?(?:nummer|nr\.?)\s*[:.]?\s*/i],
    ['Vertragsnummer', /(?:Vertrags|Versicherungsschein|Police)-?\s?(?:nummer|nr\.?)\s*[:.]?\s*/i],
    ['Mitgliedsnummer', /Mitglieds-?\s?(?:nummer|nr\.?)\s*[:.]?\s*/i],
    ['Steuernummer', /(?:Steuernummer|St\.?-?Nr\.?)\s*[:.]?\s*/i],
    ['Vorgangsnummer', /(?:Vorgangs|Buchungs|Referenz|Fall)-?\s?(?:nummer|nr\.?|zeichen)\s*[:.]?\s*/i]
  ];
  function nummern(text) {
    const out = [];
    for (const [name, re] of NUMMERN) {
      const r = new RegExp(re.source, 'gi'); let m;
      while ((m = r.exec(text)) !== null) {
        const rest = text.slice(r.lastIndex, r.lastIndex + 40).split(/\n| {2,}| \| |\t/)[0];
        const wert = (rest.match(/^[A-Za-z0-9][A-Za-z0-9\/.\-]*(?: [A-Za-z0-9\/.\-]+){0,3}/) || [''])[0].replace(/[.,;:\-]+$/, '').trim();
        // muss eine Ziffer enthalten und darf kein normales Wort sein
        if (!/\d/.test(wert) || wert.length < 3) continue;
        if (!out.some(x => x.wert === wert)) out.push({ name, wert });
        break;
      }
    }
    return out;
  }

  // ---------------- IBAN ----------------
  function ibanOk(i) {
    const s = i.replace(/\s/g, '').toUpperCase();
    if (!/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(s)) return false;
    if (s.startsWith('DE') && s.length !== 22) return false;
    const r = (s.slice(4) + s.slice(0, 4)).replace(/[A-Z]/g, c => String(c.charCodeAt(0) - 55));
    let rest = 0;
    for (const ch of r) rest = (rest * 10 + Number(ch)) % 97;
    return rest === 1;
  }
  function ibans(text) {
    const out = []; let m;
    const re = /\b([A-Z]{2}\d{2}(?: ?[A-Z0-9]{4}){3,7}(?: ?[A-Z0-9]{1,3})?)\b/g;
    while ((m = re.exec(text.toUpperCase())) !== null) {
      const s = m[1].replace(/\s/g, '');
      // Laenge passend kuerzen (DE = 22 Zeichen)
      const kand = s.startsWith('DE') ? s.slice(0, 22) : s;
      if (ibanOk(kand)) { const f = kand.replace(/(.{4})/g, '$1 ').trim(); if (!out.includes(f)) out.push(f); }
    }
    return out;
  }
  function verwendungszweck(text) {
    const m = text.match(/(?:Verwendungszweck|Zahlungsgrund|Betreff der Überweisung)\s*[:.]?\s*([^\n]{3,80})/i);
    return m ? m[1].trim() : '';
  }

  // ---------------- Art des Briefs ----------------
  const ARTEN = [
    ['Mahnbescheid (Gericht)', /mahnbescheid/i],
    ['Vollstreckung', /vollstreckungsankündigung|vollstreckungsankuendigung|pfändung|pfaendung|zwangsvollstreckung|gerichtsvollzieher/i],
    ['Inkasso-Forderung', /inkasso/i],
    ['Bußgeldbescheid', /bußgeldbescheid|bussgeldbescheid/i],
    ['Anhörung', /anhörung|anhoerung|anhörungsbogen/i],
    ['Widerspruchsbescheid', /widerspruchsbescheid/i],
    ['Mahnung', /\bmahnung\b|zahlungserinnerung|letzte erinnerung|\d\.\s*mahnung/i],
    ['Aufforderung zur Mitwirkung', /mitwirkung|fehlende unterlagen|reichen sie (bitte )?(die )?folgende|benötigen (wir )?(noch )?folgende unterlagen/i],
    ['Bescheid', /\bbescheid\b|änderungsbescheid|bewilligungsbescheid|ablehnungsbescheid|steuerbescheid|aufhebungs-? und erstattungsbescheid/i],
    ['Termin / Einladung', /einladung|meldetermin|laden (wir )?sie .{0,40}ein|terminvereinbarung|ihr termin/i],
    ['Kündigung', /kündigung|kuendigung/i],
    ['Rechnung', /\brechnung\b|rechnungsnummer|abschlagsrechnung|jahresabrechnung|nebenkostenabrechnung|betriebskostenabrechnung/i],
    ['Vertrag', /\bvertrag\b|vertragsbestätigung|auftragsbestätigung/i]
  ];
  function art(text) {
    const kopf = text.slice(0, 2500);
    for (const [name, re] of ARTEN) if (re.test(kopf)) return name;
    for (const [name, re] of ARTEN) if (re.test(text)) return name;
    return '';
  }

  // ---------------- Hinweise ----------------
  function hinweise(text) {
    const t = text.toLowerCase();
    return {
      rechtsbehelf: /rechtsbehelfsbelehrung|widerspruch (einlegen|erheben)|einspruch (einlegen|erheben)|kann .{0,40}widerspruch|kann .{0,40}einspruch/.test(t),
      gericht: /amtsgericht|landgericht|sozialgericht|mahngericht/.test(t),
      vollstreckung: /vollstreckung|pfändung|pfaendung|gerichtsvollzieher/.test(t),
      unterschrift: /(unterschrieben|unterschrift)\s+(zurück|zurueck)/.test(t)
    };
  }

  // ---------------- Pruefen, ob ein Wert so im Brief steht ----------------
  const nurZiffern = (s) => String(s || '').replace(/\D/g, '');
  const kompakt = (s) => String(s || '').toLowerCase().replace(/[\s.,:;\-\/]/g, '');
  function stehtImBrief(wert, text, typ) {
    if (!wert || !text) return null;
    if (typ === 'datum') {
      const daten = alleDaten(String(wert));
      if (!daten.length) return null;
      return alleDaten(text).some(d => d.iso === daten[0].iso);
    }
    if (typ === 'betrag') {
      const b = betraege(String(wert) + (/[€]|eur/i.test(wert) ? '' : ' €'));
      if (!b.length) return null;
      return betraege(text).some(x => Math.abs(x.wert - b[0].wert) < 0.005);
    }
    const w = kompakt(String(wert).split('\n')[0]);
    if (w.length < 3) return null;
    if (typ === 'nummer' && nurZiffern(w).length >= 3) return kompakt(text).includes(w);
    return kompakt(text).includes(w);
  }

  // ---------------- Hauptfunktion ----------------
  function lies(textRoh, basisHeute) {
    const text = String(textRoh || '').replace(/\r\n?/g, '\n');
    const daten = alleDaten(text);
    const bd = briefdatum(text, daten);
    const fr = fristen(text, daten, bd && bd.iso);
    const zukunft = fr.filter(f => tageBis(f.iso, basisHeute) >= -60);
    const naechste = (zukunft.length ? zukunft : fr).slice().sort((a, b) => (b.art === 'frist') - (a.art === 'frist') || a.iso.localeCompare(b.iso))[0] || null;
    const bl = betraege(text);
    const nr = nummern(text);
    return {
      art: art(text),
      briefdatum: bd ? bd.iso : '',
      fristen: fr,
      frist: naechste,
      fristRegeln: fristRegeln(text),
      betraege: bl,
      betrag: hauptbetrag(bl),
      nummern: nr,
      ibans: ibans(text),
      verwendungszweck: verwendungszweck(text),
      hinweise: hinweise(text),
      zeichenzahl: text.length
    };
  }

  // Fuer kleine Modelle: den wichtigsten Teil des Briefs auswaehlen
  function kuerze(textRoh, max) {
    const text = String(textRoh || '').replace(/\r\n?/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
    if (text.length <= max) return text;
    const absaetze = text.split(/\n\s*\n/);
    const wichtig = /(frist|bis zum|spätestens|zahl|betrag|€|widerspruch|einspruch|bescheid|unterlagen|termin|bitte|müssen|muessen|aufgefordert|rechtsbehelf|mahnung|forderung|kündig|einladung)/i;
    const kopf = absaetze.slice(0, 3).join('\n\n').slice(0, Math.floor(max * 0.35));
    let rest = max - kopf.length;
    const teile = [];
    absaetze.slice(3).forEach((a, i) => { if (wichtig.test(a)) teile.push({ i, a }); });
    const gewaehlt = [];
    for (const t of teile) { if (t.a.length + 6 > rest) continue; gewaehlt.push(t); rest -= t.a.length + 6; }
    gewaehlt.sort((a, b) => a.i - b.i);
    return kopf + '\n\n[…]\n\n' + gewaehlt.map(x => x.a).join('\n\n');
  }

  const api = { lies, kuerze, stehtImBrief, alleDaten, betraege, nummern, ibans, ibanOk, art, fristRegeln, tageBis };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  g.SDBriefRegeln = api;
})(typeof window !== 'undefined' ? window : globalThis);
