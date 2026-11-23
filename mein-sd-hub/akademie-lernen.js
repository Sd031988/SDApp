/* SD Akademie – Lernlogik auf dem Gerät: Wiederholen mit wachsenden Abständen, Stufen pro Lektion,
   Hilfe-Stufen, Lernserie und Tagesziel. Alles bleibt im Browser (localStorage), nichts wird gesendet.
   Grundlage: Wiederholen mit Abstand und aktives Erinnern (Weinstein u. a. 2018), Stufen nach dem Vorbild
   der Mastery-Stufen von Khan Academy. */
(function (root) {
  "use strict";
  const KEY = "sdhub.akademie.lernen.v1";
  const ABSTAND = [1, 3, 7, 21, 60];      // Tage bis zur nächsten Wiederholung je Box
  const ZIEL = 50;                         // Tagesziel in XP
  const XP_LEKTION = 100, XP_FRAGE = 10;
  let speicherOk = true;

  const tag = d => { d = d || new Date(); return Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 86400000); };
  const woche = t => Math.floor((t + 3) / 7); // Wochen beginnen am Montag
  const leer = () => ({v: 1, k: {}, p: {}, l: {}, t: {}, z: null});
  const zahl = (x, max) => Number.isInteger(x) && x >= 0 && x <= max ? x : null;
  const id = s => typeof s === "string" && /^[\w-]{1,40}$/.test(s);

  function pruefen(x) {
    const d = leer(); if (!x || typeof x !== "object") return d;
    for (const [s, c] of Object.entries(x.k || {})) {
      const m = /^([\w-]{1,40}):(\d{1,2})$/.exec(s);
      if (m && c && id(c.k) && zahl(c.b, ABSTAND.length) !== null && zahl(c.d, 1e6) !== null) d.k[s] = {k: c.k, b: c.b, d: c.d};
    }
    for (const [l, k] of Object.entries(x.p || {})) if (id(l) && id(k)) d.p[l] = k;
    for (const [l, e] of Object.entries(x.l || {})) if (id(l) && e && typeof e === "object") d.l[l] = {h: zahl(e.h, 3) || 0, g: e.g === 1 ? 1 : 0};
    const heute = tag();
    for (const [t, xp] of Object.entries(x.t || {})) { const n = +t; if (n > heute - 70 && n <= heute && zahl(xp, 1e5) !== null) d.t[n] = xp; }
    if (x.z && id(x.z.kurs) && id(x.z.lektion)) d.z = {kurs: x.z.kurs, lektion: x.z.lektion};
    return d;
  }
  let daten = (() => { try { return pruefen(JSON.parse(localStorage.getItem(KEY) || "null")); } catch (e) { speicherOk = false; return leer(); } })();
  function sichern() { try { localStorage.setItem(KEY, JSON.stringify(daten)); speicherOk = true; } catch (e) { speicherOk = false; } }
  function xpDazu(n) { const h = tag(); daten.t[h] = (daten.t[h] || 0) + n; }

  // Lektionen, die schon vor dieser Funktion geschafft wurden, kommen einmal in die Wiederholung
  function abgleichen(geschafft, kursVon) {
    let neu = false;
    for (const l of geschafft) {
      if ((daten.l[l] && daten.l[l].g) || daten.p[l]) continue;
      const k = kursVon(l); if (!k) continue;
      daten.p[l] = k; daten.l[l] = Object.assign(daten.l[l] || {h: 0}, {g: 1}); neu = true;
    }
    if (neu) sichern();
  }

  // Quiz einer Lektion bestanden: Fragen kommen morgen zum ersten Mal wieder
  function geschafft(kurs, lektion) {
    if (!id(kurs) || !lektion || !id(lektion.id)) return {neu: false, xp: 0};
    const e = daten.l[lektion.id] || (daten.l[lektion.id] = {h: 0, g: 0});
    const erst = !e.g; e.g = 1;
    delete daten.p[lektion.id];
    (lektion.quiz || []).forEach((q, i) => { const s = lektion.id + ":" + i; if (!daten.k[s]) daten.k[s] = {k: kurs, b: 0, d: tag() + 1}; });
    let xp = 0;
    if (erst) { xp = e.h >= 3 ? XP_LEKTION / 2 : XP_LEKTION; xpDazu(xp); }
    sichern(); return {neu: !!erst, xp};
  }
  function hilfe(lektion, stufe) { if (!id(lektion)) return; const e = daten.l[lektion] || (daten.l[lektion] = {h: 0, g: 0}); if (stufe > e.h) { e.h = Math.min(3, stufe); sichern(); } }
  const hilfeStufe = lektion => (daten.l[lektion] || {}).h || 0;

  // 0 = offen, 1 = geschafft, 2 = sicher (zweimal richtig wiederholt), 3 = gemeistert (dreimal, über gut eine Woche)
  function stufe(lektion, istGeschafft) {
    if (!istGeschafft) return 0;
    const boxen = Object.entries(daten.k).filter(([s]) => s.startsWith(lektion + ":")).map(([, c]) => c.b);
    if (!boxen.length) return 1;
    const min = Math.min(...boxen);
    return min >= 3 ? 3 : min >= 2 ? 2 : 1;
  }

  // fällige Karten, Kurse gemischt (verschachteltes Üben); offene Alt-Lektionen zählen als fällig
  function faellig() {
    const h = tag();
    return Object.entries(daten.k).filter(([, c]) => c.d <= h).map(([s, c]) => ({s, kurs: c.k, lektion: s.split(":")[0], qi: +s.split(":")[1], b: c.b}));
  }
  const anzahlFaellig = () => faellig().length;
  const wartet = k => Object.values(daten.p).includes(k);
  // Kursdatei nicht ladbar: offene Alt-Lektionen dieses Kurses verwerfen, damit nichts hängen bleibt
  function verwerfen(k) { for (const [l, x] of Object.entries(daten.p)) if (x === k) delete daten.p[l]; sichern(); }
  function naechste() { const d = Object.values(daten.k).map(c => c.d).filter(d => d > tag()); return d.length ? Math.min(...d) : null; }
  // Alt-Lektionen in echte Karten umwandeln, sobald ihr Kurs geladen ist
  function ausklappen(kurs, lektionen) {
    let neu = false;
    for (const [l, k] of Object.entries(daten.p)) {
      if (k !== kurs) continue; const lek = lektionen.find(x => x.id === l);
      if (lek) (lek.quiz || []).forEach((q, i) => { const s = l + ":" + i; if (!daten.k[s]) daten.k[s] = {k: kurs, b: 0, d: tag()}; });
      delete daten.p[l]; neu = true;
    }
    if (neu) sichern();
  }
  const offeneKurse = () => [...new Set([...Object.values(daten.p), ...faellig().map(f => f.kurs)])];
  // ein Durchgang: höchstens 5 Fragen, aus möglichst verschiedenen Lektionen
  function auswahl(max) {
    max = max || 5; const alle = faellig().sort((a, b) => a.b - b.b || a.s.localeCompare(b.s)), wahl = [], lek = new Set();
    for (const f of alle) if (wahl.length < max && !lek.has(f.lektion)) { wahl.push(f); lek.add(f.lektion); }
    for (const f of alle) if (wahl.length < max && !wahl.includes(f)) wahl.push(f);
    for (let i = wahl.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [wahl[i], wahl[j]] = [wahl[j], wahl[i]]; }
    return wahl;
  }
  function antwort(s, richtig) {
    const c = daten.k[s]; if (!c) return 0;
    if (richtig) { c.b = Math.min(ABSTAND.length, c.b + 1); c.d = tag() + ABSTAND[Math.min(c.b, ABSTAND.length - 1)]; xpDazu(XP_FRAGE); }
    else { c.b = 0; c.d = tag() + 1; }
    sichern(); return richtig ? XP_FRAGE : 0;
  }
  const entfernen = s => { if (daten.k[s]) { delete daten.k[s]; sichern(); } };

  // Lernserie: Tage mit Lernen in Folge; ein verpasster Tag pro Woche wird verziehen; heute zählt noch nicht als verpasst
  function serie() {
    const h = tag(); let n = 0, schutz = new Set(), genutzt = false;
    for (let t = h; t > h - 70; t--) {
      if (daten.t[t]) { n++; continue; }
      if (t === h) continue;
      const w = woche(t);
      if (!schutz.has(w) && daten.t[t - 1]) { schutz.add(w); genutzt = true; continue; }
      break;
    }
    return {tage: n, heute: !!daten.t[h], schutz: genutzt};
  }
  const heuteXp = () => daten.t[tag()] || 0;
  function zuletzt(kurs, lektion) {
    if (kurs === undefined) return daten.z;
    if (id(kurs) && id(lektion) && (!daten.z || daten.z.kurs !== kurs || daten.z.lektion !== lektion)) { daten.z = {kurs, lektion}; sichern(); }
  }
  const datumVon = t => new Date(t * 86400000 + new Date().getTimezoneOffset() * 60000);

  root.SDAkLernen = {abgleichen, wartet, verwerfen, geschafft, hilfe, hilfeStufe, stufe, faellig, anzahlFaellig, naechste, ausklappen, offeneKurse, auswahl, antwort, entfernen,
    serie, heuteXp, zuletzt, datumVon, ZIEL, XP_LEKTION, XP_FRAGE, speicherOk: () => speicherOk,
    _test: {tag, setzen: x => { daten = pruefen(x); }, roh: () => daten}};
})(typeof window !== "undefined" ? window : globalThis);
