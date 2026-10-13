/* SD Hub – Steuer-Helfer: amtliche Vordrucke (als PDF) ausfüllen.
   Die Vordrucke haben keine Formularfelder; die Positionen der Kästchen
   stehen in formulare-<jahr>.json (aus den PDFs vermessen). Vor dem Ausfüllen
   wird geprüft, ob die gewählte PDF genau diese Formularversion ist
   (Formularkennung im Fuß jeder Seite + Lage einiger Kennzahlen) – sonst
   wird nichts ausgefüllt. Alles passiert im Browser; nichts wird gesendet. */
(function (g) {
  'use strict';

  const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.min.mjs';
  const PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';
  let pdfjsVersprechen = null;
  function ladePdfJs() {
    if (!pdfjsVersprechen) {
      pdfjsVersprechen = import(PDFJS).then(lib => { lib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER; return lib; })
        .catch(e => { pdfjsVersprechen = null; throw e; });
    }
    return pdfjsVersprechen;
  }

  // Text jeder Seite (Wort + Position) lesen
  async function seitenText(bytes, pdfjs) {
    const pdf = await pdfjs.getDocument({ data: bytes.slice(0) }).promise;
    const seiten = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const s = await pdf.getPage(i);
      const vp = s.getViewport({ scale: 1 });
      const inhalt = await s.getTextContent();
      seiten.push({ h: vp.height, items: inhalt.items.filter(it => typeof it.str === 'string').map(it => ({ str: it.str.trim(), x: it.transform[4], y: it.transform[5] })) });
    }
    return seiten;
  }

  // Welches Formular ist das – und passt es genau?
  function erkenne(seiten, spec) {
    for (const [name, f] of Object.entries(spec.formulare)) {
      const ok = f.seiten.every((s, i) => seiten[s] && seiten[s].items.some(it => it.str.includes(f.kennung[i])));
      if (!ok) continue;
      // Lage der Anker-Kennzahlen prüfen (Toleranz 2 pt waagerecht, 14 pt senkrecht)
      const lageOk = f.anker.every(a => {
        const s = seiten[a.s];
        return s && s.items.some(it => it.str === a.text && Math.abs(it.x - a.x0) < 2 && Math.abs((s.h - it.y) - a.top) < 14);
      });
      return { name, ok: lageOk };
    }
    return null;
  }

  // ----- Werte in Zellen schreiben -----
  function zeichenFuerFeld(art, wert, anzahl) {
    if (wert == null || wert === '' || wert === false) return null;
    if (art === 'x') return wert ? ['X'] : null;
    if (art === 'zahl') {
      const s = String(Math.round(Number(wert)));
      if (!/^\d+$/.test(s) || Number(s) === 0) return null;
      if (s.length > anzahl) throw new Error('zu_gross');
      return Array(anzahl - s.length).fill('').concat(s.split(''));
    }
    if (art === 'ct') {
      const c = Math.round(Number(wert) * 100);
      if (!isFinite(c) || c <= 0) return null;
      const euro = String(Math.floor(c / 100)), cent = String(c % 100).padStart(2, '0');
      if (euro.length > anzahl - 2) throw new Error('zu_gross');
      return Array(anzahl - 2 - euro.length).fill('').concat(euro.split(''), cent.split(''));
    }
    const t = String(wert).replace(/\s+/g, ' ').trim();
    if (!t) return null;
    return t.slice(0, anzahl).split('');
  }

  /**
   * dateien: [{ name, bytes: Uint8Array }]
   * werte: { ESt1A: {feld: wert}, N: [ {feld: wert} (Person A), {…} (Person B) ] }
   * Rückgabe: { pdf: Uint8Array, bericht: [{ datei, formular, status }], gekuerzt: [feld] }
   */
  async function fuelle(dateien, werte, spec, optionen) {
    const opt = optionen || {};
    const PDFLib = opt.PDFLib || g.PDFLib;
    const pdfjs = opt.pdfjs || await ladePdfJs();
    const ziel = await PDFLib.PDFDocument.create();
    const schrift = await ziel.embedFont(PDFLib.StandardFonts.Helvetica);
    const bericht = [], gekuerzt = [];
    const erkannt = {};
    for (const d of dateien) {
      let e = null;
      try { e = erkenne(await seitenText(d.bytes, pdfjs), spec); } catch (err) { e = null; }
      if (!e) { bericht.push({ datei: d.name, status: 'unbekannt' }); continue; }
      if (!e.ok) { bericht.push({ datei: d.name, formular: e.name, status: 'andere_version' }); continue; }
      erkannt[e.name] = d;
      bericht.push({ datei: d.name, formular: e.name, status: 'ok' });
    }
    // Reihenfolge: Hauptvordruck zuerst, dann Anlagen; mehrere Datensätze (Person A/B) = Formular mehrfach
    const reihenfolge = ['ESt1A', 'N'];
    for (const name of reihenfolge) {
      if (!erkannt[name] || !werte[name]) continue;
      const f = spec.formulare[name];
      const quelle = await PDFLib.PDFDocument.load(erkannt[name].bytes);
      const saetze = Array.isArray(werte[name]) ? werte[name] : [werte[name]];
      for (const satz of saetze) {
        if (!satz) continue;
        const kopien = await ziel.copyPages(quelle, f.seiten);
        const seitenMap = {};
        f.seiten.forEach((s, i) => { seitenMap[s] = kopien[i]; ziel.addPage(kopien[i]); });
        Object.entries(f.felder).forEach(([feld, def]) => {
          let zeichen;
          try { zeichen = zeichenFuerFeld(def.art, satz[feld], def.z.length); }
          catch (err) { gekuerzt.push(name + '.' + feld); return; }
          if (!zeichen) return;
          const seite = seitenMap[def.s];
          const h = seite.getHeight();
          const voll = String(satz[feld]).replace(/\s+/g, ' ').trim();
          // Zu langer Text: nicht abschneiden, sondern verkleinert über die ganze Feldbreite schreiben
          if (def.art === 'text' && voll.length > def.z.length) {
            const [x0, top] = def.z[0], [, , x1, bottom] = def.z[def.z.length - 1];
            let groesse = 10;
            while (groesse > 6 && schrift.widthOfTextAtSize(voll, groesse) > x1 - x0 - 4) groesse -= 0.5;
            let text = voll;
            while (text.length > 1 && schrift.widthOfTextAtSize(text, groesse) > x1 - x0 - 4) text = text.slice(0, -1);
            if (text !== voll) gekuerzt.push(name + '.' + feld);
            seite.drawText(text, { x: x0 + 2, y: h - bottom + (bottom - top - groesse * 0.72) / 2, size: groesse, font: schrift, color: PDFLib.rgb(0, 0, 0) });
            return;
          }
          zeichen.forEach((z, i) => {
            if (!z) return;
            const [x0, top, x1, bottom] = def.z[i];
            const groesse = 10.5;
            const breite = schrift.widthOfTextAtSize(z, groesse);
            seite.drawText(z, {
              x: x0 + (x1 - x0 - breite) / 2,
              y: h - bottom + (bottom - top - groesse * 0.72) / 2,
              size: groesse, font: schrift, color: PDFLib.rgb(0, 0, 0)
            });
          });
        });
      }
    }
    if (!ziel.getPageCount()) return { pdf: null, bericht, gekuerzt };
    return { pdf: await ziel.save(), bericht, gekuerzt };
  }

  const api = { fuelle, erkenne, seitenText, zeichenFuerFeld };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  g.SDFormularDruck = api;
})(typeof window !== 'undefined' ? window : globalThis);
