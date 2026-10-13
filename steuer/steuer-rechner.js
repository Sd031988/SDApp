/* SD Hub – Steuer-Helfer: Schätzung der Einkommensteuer für Arbeitnehmer.
   Rechnet wie das Finanzamt in vereinfachter Form: Einkünfte aus
   nichtselbständiger Arbeit (auch Ehepaar), Werbungskosten, Vorsorge,
   Sonderausgaben, außergewöhnliche Belastungen, Entlastungsbetrag für
   Alleinerziehende, Günstigerprüfung Kindergeld/Kinderfreibeträge,
   Progressionsvorbehalt (Lohnersatzleistungen), § 35a, Soli, Kirchensteuer.
   Nicht enthalten: andere Einkunftsarten (Rente, Vermietung, Selbstständigkeit,
   Kapitalerträge), Verlustvorträge, Sonderfälle. Ergebnis = Schätzung.

   Quellen der Jahreswerte (geprüft am 13.10.2026):
   - § 32a EStG Tarifformeln 2024/2025/2026 (Steuerfortentwicklungsgesetz, BGBl. 2024 I Nr. 449)
   - Soli-Freigrenzen 2024: 18.130 / 2025: 19.950 / 2026: 20.350 € (Zusammen: doppelt)
   - Höchstbetrag Altersvorsorge § 10 Abs. 3 EStG: 27.566 / 29.344 / 30.826 €
   - Kinderfreibetrag 6.612 / 6.672 / 6.828 € + BEA 2.928 € (beide Eltern)
   - Kindergeld 250 / 255 / 259 € im Monat */
(function (g) {
  'use strict';

  const JAHR = {
    2024: { gfb: 11784, z2: 17005, z3: 66760, z4: 277825, a2: 954.80, a3: 181.19, c3: 991.21, d4: 10636.31, d5: 18971.06,
      soliFrei: 18130, avHoechst: 27566, kfb: 6612, bea: 2928, kg: 250, ap: 1230 },
    2025: { gfb: 12096, z2: 17443, z3: 68480, z4: 277825, a2: 932.30, a3: 176.64, c3: 1015.13, d4: 10911.92, d5: 19246.67,
      soliFrei: 19950, avHoechst: 29344, kfb: 6672, bea: 2928, kg: 255, ap: 1230 },
    2026: { gfb: 12348, z2: 17799, z3: 69878, z4: 277825, a2: 914.51, a3: 173.10, c3: 1034.87, d4: 11135.63, d5: 19470.38,
      soliFrei: 20350, avHoechst: 30826, kfb: 6828, bea: 2928, kg: 259, ap: 1230 }
  };
  const FEST = {
    saPausch: 36,             // Sonderausgaben-Pauschbetrag (§ 10c EStG), Zusammen 72
    sonstVorsorge: 1900,      // Höchstbetrag sonstige Vorsorge für Arbeitnehmer (§ 10 Abs. 4 EStG)
    krankengeldAbschlag: 0.04,// Basis-KV: 4 % weniger bei Anspruch auf Krankengeld (§ 10 Abs. 1 Nr. 3 a EStG)
    alleinerziehend: 4260, alleinerziehendJeWeiteres: 240, // § 24b EStG (seit 2023)
    spendenQuote: 0.20,       // § 10b EStG: bis 20 % des Gesamtbetrags der Einkünfte
    soliSatz: 0.055, soliMilderung: 0.119,
    pflichtLohnersatz: 410    // § 46 Abs. 2 Nr. 1 EStG: Pflichtveranlagung über 410 € Lohnersatz
  };
  // Kirchensteuer: 8 % in Bayern und Baden-Württemberg, sonst 9 %
  const LAENDER = { BW: 'Baden-Württemberg', BY: 'Bayern', BE: 'Berlin', BB: 'Brandenburg', HB: 'Bremen', HH: 'Hamburg', HE: 'Hessen', MV: 'Mecklenburg-Vorpommern',
    NI: 'Niedersachsen', NW: 'Nordrhein-Westfalen', RP: 'Rheinland-Pfalz', SL: 'Saarland', SN: 'Sachsen', ST: 'Sachsen-Anhalt', SH: 'Schleswig-Holstein', TH: 'Thüringen' };
  const kistSatz = (land) => (land === 'BY' || land === 'BW') ? 0.08 : 0.09;

  const n = (v) => { const x = Number(v); return isFinite(x) ? x : 0; };
  const cent = (x) => Math.floor(x * 100 + 1e-7) / 100;

  // Grundtarif § 32a Abs. 1 EStG
  function tarif(zvE, j) {
    const P = JAHR[j];
    const x = Math.floor(Math.max(0, zvE));
    let est;
    if (x <= P.gfb) est = 0;
    else if (x <= P.z2) { const y = (x - P.gfb) / 10000; est = (P.a2 * y + 1400) * y; }
    else if (x <= P.z3) { const z = (x - P.z2) / 10000; est = (P.a3 * z + 2397) * z + P.c3; }
    else if (x <= P.z4) est = 0.42 * x - P.d4;
    else est = 0.45 * x - P.d5;
    return Math.floor(est + 1e-7);
  }
  // Splitting (§ 32a Abs. 5 EStG)
  function tarifVeranlagung(zvE, j, zusammen) {
    return zusammen ? 2 * tarif(Math.floor(Math.max(0, zvE) / 2), j) : tarif(zvE, j);
  }
  // Mit Progressionsvorbehalt (§ 32b EStG): besonderer Steuersatz aus zvE + Lohnersatz
  function steuer(zvE, j, zusammen, lohnersatz) {
    zvE = Math.max(0, Math.floor(zvE));
    if (!lohnersatz || lohnersatz <= 0) return tarifVeranlagung(zvE, j, zusammen);
    const basis = zvE + lohnersatz;
    if (basis <= 0) return 0;
    const satz = tarifVeranlagung(basis, j, zusammen) / basis;
    return Math.floor(zvE * satz + 1e-7);
  }

  // Zumutbare Belastung (§ 33 Abs. 3 EStG), stufenweise (BFH VI R 75/14)
  function zumutbar(gde, zusammen, kinder) {
    const saetze = kinder >= 3 ? [1, 1, 2] : kinder >= 1 ? [2, 3, 4] : zusammen ? [4, 5, 6] : [5, 6, 7];
    const grenzen = [15340, 51130, Infinity];
    let rest = Math.max(0, gde), unten = 0, summe = 0;
    for (let i = 0; i < 3 && rest > 0; i++) {
      const teil = Math.min(rest, grenzen[i] - unten);
      summe += teil * saetze[i] / 100;
      rest -= teil; unten = grenzen[i];
    }
    return Math.floor(summe);
  }

  function soliAus(est, j, zusammen) {
    const frei = JAHR[j].soliFrei * (zusammen ? 2 : 1);
    if (est <= frei) return 0;
    return cent(Math.min(est * FEST.soliSatz, (est - frei) * FEST.soliMilderung));
  }

  function person(p, j) {
    p = p || {};
    const brutto = n(p.brutto);
    const wkTat = n(p.wk);
    const ap = JAHR[j].ap;
    // Pauschbetrag höchstens bis zur Höhe der Einnahmen; höhere tatsächliche Kosten auch mit Verlust
    const wk = wkTat > ap ? wkTat : Math.min(ap, brutto);
    return {
      brutto, wk, wkPausch: !(wkTat > ap), einkuenfte: brutto - wk,
      lst: n(p.lst), soli: n(p.soli), kist: n(p.kist),
      rvAN: n(p.rvAN), rvAG: n(p.rvAG), kv: n(p.kv), pv: n(p.pv), av: n(p.av), ruerup: n(p.ruerup),
      krankengeld: p.krankengeld !== false,
      lohnersatz: n(p.lohnersatzZ15) + n(p.lohnersatz),
      kirche: !!p.kirche
    };
  }

  /**
   * e: { jahr, zusammen, land, alleinerziehend, p1, p2,
   *      sonstVersicherung (Haftpflicht, Unfall, BU, Risiko-LV …), spenden, kinderbetreuung (abziehbar),
   *      krankheit, ermaessigung35a, kinder: [{ faktor: 1|0.5, kgMonate }] }
   */
  function berechne(e) {
    const j = JAHR[e.jahr] ? e.jahr : 2025;
    const P = JAHR[j];
    const zus = !!e.zusammen;
    const a = person(e.p1, j);
    const b = zus ? person(e.p2, j) : null;
    const leute = b ? [a, b] : [a];
    const r = { jahr: j, zusammen: zus, hinweise: [] };

    // 1. Einkünfte und Gesamtbetrag der Einkünfte
    r.einkuenfte = leute.reduce((s, x) => s + x.einkuenfte, 0);
    const kinder = (e.kinder || []).filter(k => k && n(k.faktor) > 0);
    const anzKinder = kinder.length;
    r.entlastungAE = (!zus && e.alleinerziehend && anzKinder > 0) ? FEST.alleinerziehend + FEST.alleinerziehendJeWeiteres * (anzKinder - 1) : 0;
    r.gde = r.einkuenfte - r.entlastungAE;

    // 2. Sonderausgaben – Vorsorge
    const rvGes = leute.reduce((s, x) => s + x.rvAN + x.rvAG + x.ruerup, 0);
    const rvAG = leute.reduce((s, x) => s + x.rvAG, 0);
    r.altersvorsorge = Math.max(0, Math.min(rvGes, P.avHoechst * (zus ? 2 : 1)) - rvAG);
    const basisKV = leute.reduce((s, x) => s + x.kv * (x.krankengeld ? 1 - FEST.krankengeldAbschlag : 1) + x.pv, 0);
    const alleSonst = leute.reduce((s, x) => s + x.kv + x.pv + x.av, 0) + n(e.sonstVersicherung);
    r.basisKV = basisKV;
    r.sonstigeVorsorge = Math.max(basisKV, Math.min(alleSonst, FEST.sonstVorsorge * (zus ? 2 : 1)));
    r.vorsorge = Math.floor(r.altersvorsorge + r.sonstigeVorsorge);

    // 3. Weitere Sonderausgaben: gezahlte Kirchensteuer, Spenden (bis 20 %), Kinderbetreuung
    r.kistGezahlt = leute.reduce((s, x) => s + x.kist, 0);
    r.spenden = Math.min(n(e.spenden), Math.max(0, r.gde) * FEST.spendenQuote);
    r.kinderbetreuung = n(e.kinderbetreuung);
    const weitere = r.kistGezahlt + r.spenden + r.kinderbetreuung;
    r.saPausch = weitere < FEST.saPausch * (zus ? 2 : 1);
    r.sonderWeitere = r.saPausch ? FEST.saPausch * (zus ? 2 : 1) : weitere;
    r.sonderausgaben = r.vorsorge + r.sonderWeitere;

    // 4. Außergewöhnliche Belastungen (Krankheitskosten abzüglich zumutbarer Belastung)
    r.zumutbar = zumutbar(r.gde, zus, anzKinder);
    r.krankheit = n(e.krankheit);
    r.agb = Math.max(0, r.krankheit - r.zumutbar);

    // 5. Einkommen und zu versteuerndes Einkommen
    r.einkommen = r.gde - r.sonderausgaben - r.agb;
    r.lohnersatz = leute.reduce((s, x) => s + x.lohnersatz, 0);
    const zvEOhne = Math.max(0, Math.floor(r.einkommen));
    r.kfbSumme = kinder.reduce((s, k) => s + (P.kfb + P.bea) * Math.min(1, n(k.faktor)), 0);
    r.kindergeld = kinder.reduce((s, k) => s + P.kg * Math.max(0, Math.min(12, n(k.kgMonate == null ? 12 : k.kgMonate))) * Math.min(1, n(k.faktor)), 0);
    const zvEMit = Math.max(0, Math.floor(r.einkommen - r.kfbSumme));
    const estOhne = steuer(zvEOhne, j, zus, r.lohnersatz);
    const estMit = steuer(zvEMit, j, zus, r.lohnersatz);

    // 6. Günstigerprüfung: Kinderfreibeträge nur, wenn die Steuerersparnis höher ist als das Kindergeld
    r.kfbErsparnis = estOhne - estMit;
    r.kfbGuenstiger = anzKinder > 0 && r.kfbErsparnis > r.kindergeld;
    r.zvE = r.kfbGuenstiger ? zvEMit : zvEOhne;
    r.estTariflich = r.kfbGuenstiger ? estMit : estOhne;

    // 7. Steuerermäßigung § 35a (haushaltsnahe Dienstleistungen, Handwerker) – höchstens bis 0
    r.erm35a = Math.min(n(e.ermaessigung35a), r.estTariflich);
    r.est = r.estTariflich - r.erm35a;
    // Kindergeld wird hinzugerechnet, wenn die Freibeträge angesetzt wurden
    r.estFestzusetzen = r.est + (r.kfbGuenstiger ? r.kindergeld : 0);

    // 8. Soli und Kirchensteuer: Bemessung immer mit Kinderfreibeträgen (§ 51a EStG)
    const basisZuschlag = Math.max(0, estMit - Math.min(n(e.ermaessigung35a), estMit));
    r.soli = soliAus(basisZuschlag, j, zus);
    const satz = kistSatz(e.land);
    const kirchenAnteil = (() => {
      if (!b) return a.kirche ? 1 : 0;
      if (a.kirche && b.kirche) return 1;
      if (!a.kirche && !b.kirche) return 0;
      // Nur eine Person in der Kirche: Anteil nach Einkünften (vereinfacht)
      const summe = Math.max(1, a.einkuenfte + b.einkuenfte);
      return Math.max(0, (a.kirche ? a.einkuenfte : b.einkuenfte) / summe);
    })();
    r.kist = cent(basisZuschlag * satz * kirchenAnteil);
    r.kistSatz = satz;

    // 9. Vergleich mit dem bereits Gezahlten (Lohnsteuerbescheinigung)
    r.gezahlt = { est: leute.reduce((s, x) => s + x.lst, 0), soli: leute.reduce((s, x) => s + x.soli, 0), kist: r.kistGezahlt };
    // Werden die Kinderfreibeträge angesetzt, rechnet das Finanzamt das Kindergeld zur Steuer
    // hinzu (§ 31 Satz 4 EStG) – das bereits ausgezahlte Kindergeld bleibt bei dir.
    r.festgesetzt = { est: r.estFestzusetzen, soli: r.soli, kist: r.kist };
    r.differenz = {
      est: cent(r.gezahlt.est - r.estFestzusetzen),
      soli: cent(r.gezahlt.soli - r.soli),
      kist: cent(r.gezahlt.kist - r.kist)
    };
    r.ergebnis = cent(r.differenz.est + r.differenz.soli + r.differenz.kist);

    // Hinweise
    if (r.lohnersatz > FEST.pflichtLohnersatz) r.hinweise.push('pflicht_lohnersatz');
    if (r.lohnersatz > 0) r.hinweise.push('progression');
    if (anzKinder && !r.kfbGuenstiger) r.hinweise.push('kindergeld_besser');
    if (r.kfbGuenstiger) r.hinweise.push('kfb_besser');
    if (zus) r.hinweise.push('zusammen');
    if (a.brutto === 0 && (!b || b.brutto === 0)) r.hinweise.push('kein_lohn');
    return r;
  }

  // Lohnsteuerbescheinigung: Text (PDF oder Texterkennung) -> Felder.
  // Arbeitet mit den Zeilennummern (3, 4, 5, 6, 15, 22a, 23a, 25, 26, 27) und
  // Stichwörtern; der Betrag steht jeweils am Zeilenende.
  function leseLohnsteuerbescheinigung(text) {
    const BETRAG = /(\d{1,3}(?:[.\s]\d{3})+,\d{2}|\d+,\d{2})\s*(?:€|EUR)?\s*$/;
    const zahl = (s) => Number(String(s).replace(/[.\s]/g, '').replace(',', '.'));
    const out = {}, gefunden = [];
    let ctx = 0;
    const setze = (feld, wert, zeile) => { if (out[feld] == null && isFinite(wert)) { out[feld] = wert; gefunden.push({ feld, zeile: zeile.trim().slice(0, 80) }); } };
    String(text || '').replace(/\r/g, '').split('\n').forEach(z0 => {
      const z = z0.replace(/\s+/g, ' ').trim();
      if (!z) return;
      const nr = z.match(/^(\d{1,2})\s*[.,]?\s*(?=[A-Za-zÄÖÜäöü(]|[a-c]\))/);
      if (nr && Number(nr[1]) >= 1 && Number(nr[1]) <= 34) ctx = Number(nr[1]);
      const m = z.match(BETRAG);
      if (!m) return;
      const w = zahl(m[1]);
      const t = z.toLowerCase();
      if (/zuschu/.test(t) || ctx === 24) return;               // Zeile 24: steuerfreie Arbeitgeberzuschüsse
      if (/bruttoarbeitslohn/.test(t) || (ctx === 3 && !out.brutto)) setze('brutto', w, z);
      else if (/einbehaltene\s+lohnsteuer|^4\.?\s/.test(t) && ctx === 4) setze('lst', w, z);
      else if (/solidarit/.test(t) && ctx === 5) setze('soli', w, z);
      else if (/kirchensteuer/.test(t) && ctx === 6) setze('kist', w, z);
      else if (ctx === 15 || /kurzarbeitergeld/.test(t)) setze('lohnersatzZ15', w, z);
      else if (ctx === 22 && /rentenversicherung/.test(t) && !/berufsst/.test(t)) setze('rvAG', w, z);
      else if (ctx === 23 && /rentenversicherung/.test(t) && !/berufsst/.test(t)) setze('rvAN', w, z);
      else if (ctx === 25 || /arbeitnehmerbeitr.*krankenvers/.test(t)) setze('kv', w, z);
      else if (ctx === 26 || /arbeitnehmerbeitr.*pflegevers/.test(t)) setze('pv', w, z);
      else if (ctx === 27 || /arbeitnehmerbeitr.*arbeitslosenvers/.test(t)) setze('av', w, z);
    });
    return { felder: out, gefunden };
  }

  const api = { leseLohnsteuerbescheinigung, JAHR, FEST, LAENDER, tarif, tarifVeranlagung, steuer, zumutbar, soliAus, berechne, kistSatz };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  g.SDSteuer = api;
})(typeof window !== 'undefined' ? window : globalThis);
