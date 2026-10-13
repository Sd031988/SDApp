/* SD Hub – Steuer-Helfer: Schätzung der Einkommensteuer für Arbeitnehmer.
   Rechnet wie das Finanzamt in vereinfachter Form: Einkünfte aus
   nichtselbständiger Arbeit (auch Ehepaar), Werbungskosten, Vorsorge,
   Sonderausgaben, außergewöhnliche Belastungen, Entlastungsbetrag für
   Alleinerziehende, Günstigerprüfung Kindergeld/Kinderfreibeträge,
   Progressionsvorbehalt (Lohnersatzleistungen), § 35a, Soli, Kirchensteuer.
   Dazu: Renten (Anlage R), Vermietung (V), Selbstständige/Gewerbe (S/G mit
   Gewerbesteuer und § 35), Kapitalerträge (KAP mit Günstigerprüfung),
   Verlustvortrag (§ 10d), Kirchensteuer bei nur einem Kirchenmitglied inkl.
   besonderem Kirchgeld. Ergebnis = Schätzung.

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
    if (!lohnersatz) return tarifVeranlagung(zvE, j, zusammen);
    const basis = zvE + lohnersatz;
    if (basis <= 0 || zvE <= 0) return 0;
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

  // Besteuerungsanteil gesetzliche Rente nach Jahr des Rentenbeginns (§ 22 Nr. 1 S. 3 a aa EStG,
  // ab 2023 +0,5 Prozentpunkte je Jahr – Wachstumschancengesetz)
  function besteuerungsanteil(beginn) {
    const b = Math.round(n(beginn));
    if (!b || b <= 2005) return 0.50;
    if (b <= 2020) return 0.50 + (b - 2005) * 0.02;
    if (b <= 2022) return 0.80 + (b - 2020) * 0.01;
    return Math.min(1, 0.82 + (b - 2022) * 0.005);
  }
  // Ertragsanteil private Leibrente nach Alter bei Rentenbeginn (§ 22 Nr. 1 S. 3 a bb EStG)
  // Geprüft (Tabelle lohnsteuer-kompakt.de) für 50 bis 75 Jahre; andere Alter: Prozentsatz selbst eintragen
  function ertragsanteil(alter) {
    const t = { 50: 30, 51: 29, 52: 29, 53: 28, 54: 27, 55: 26, 56: 26, 57: 25, 58: 24, 59: 23, 60: 22, 61: 22, 62: 21, 63: 20, 64: 19, 65: 18, 66: 18,
      67: 17, 68: 16, 69: 15, 70: 15, 71: 14, 72: 13, 73: 13, 74: 12, 75: 11 };
    const x = Math.round(n(alter));
    return t[x] != null ? t[x] / 100 : null;
  }
  // AfA-Satz Gebäude (§ 7 Abs. 4 EStG): vor 1925 2,5 %, 1925–2022 2 %, ab 2023 fertiggestellt 3 %
  function afaSatz(baujahr) {
    const b = Math.round(n(baujahr));
    if (b && b < 1925) return 0.025;
    if (b >= 2023) return 0.03;
    return 0.02;
  }
  // Besonderes Kirchgeld in glaubensverschiedener Ehe (Stufen nach gemeinsamem zvE)
  const KIRCHGELD_BIS_2024 = [[40000, 96], [47500, 156], [60000, 276], [72500, 396], [85000, 540], [97500, 696], [110000, 840], [135000, 1200], [160000, 1560], [185000, 1860], [210000, 2220], [260000, 2940], [310000, 3600]];
  const KIRCHGELD_AB_2025 = [[50000, 96], [57500, 156], [70000, 276], [82500, 396], [95000, 540], [107500, 696], [120000, 840], [145000, 1200], [170000, 1560], [195000, 1860], [220000, 2220], [270000, 2940], [320000, 3600]];
  function kirchgeld(zvE, j) {
    const t = j >= 2025 ? KIRCHGELD_AB_2025 : KIRCHGELD_BIS_2024;
    let w = 0;
    t.forEach(([ab, betrag]) => { if (zvE >= ab) w = betrag; });
    return w;
  }

  // Versorgungsfreibetrag (§ 19 Abs. 2 EStG) nach Jahr des Versorgungsbeginns; ab 2023 -0,4 Punkte/Jahr
  function versorgungsTabelle(jahr) {
    const y = Math.max(2005, Math.round(n(jahr)) || 2005);
    if (y <= 2020) return { satz: 0.40 - (y - 2005) * 0.016, hoechst: 3000 - (y - 2005) * 120, zuschlag: 900 - (y - 2005) * 36 };
    if (y === 2021) return { satz: 0.152, hoechst: 1140, zuschlag: 342 };
    if (y === 2022) return { satz: 0.144, hoechst: 1080, zuschlag: 324 };
    const k = y - 2023;
    return { satz: Math.max(0, 0.14 - k * 0.004), hoechst: Math.max(0, 1050 - k * 30), zuschlag: Math.max(0, 315 - k * 9) };
  }
  // Altersentlastungsbetrag (§ 24a EStG) nach dem Jahr, das auf den 64. Geburtstag folgt
  function altersTabelle(jahr) {
    const y = Math.max(2005, Math.round(n(jahr)));
    if (y <= 2020) return { satz: 0.40 - (y - 2005) * 0.016, hoechst: 1900 - (y - 2005) * 76 };
    if (y === 2021) return { satz: 0.152, hoechst: 722 };
    if (y === 2022) return { satz: 0.144, hoechst: 684 };
    const k = y - 2023;
    return { satz: Math.max(0, 0.14 - k * 0.004), hoechst: Math.max(0, 665 - k * 19) };
  }

  function person(p, j) {
    p = p || {};
    const brutto = n(p.brutto);
    const wkTat = n(p.wk);
    const ap = JAHR[j].ap;
    // Versorgungsbezüge (Beamtenpension, Werkspension): Z. 8 ist in Z. 3 enthalten
    const versorgung = Math.min(brutto, n(p.versorgung));
    const aktiv = brutto - versorgung;
    let vfb = 0, wkVers = 0;
    if (versorgung > 0) {
      const t = versorgungsTabelle(p.vJahr);
      const monate = Math.max(1, Math.min(12, n(p.vMonate) || 12));
      const bmg = n(p.vBmg) > 0 ? n(p.vBmg) : versorgung * 12 / monate;
      vfb = Math.min(versorgung, Math.ceil((Math.min(bmg * t.satz, t.hoechst) + t.zuschlag) * monate / 12));
      wkVers = Math.min(102, versorgung - vfb);   // Werbungskosten-Pauschbetrag für Versorgungsbezüge
    }
    // Arbeitnehmer-Pauschbetrag nur auf aktiven Lohn, höchstens bis zur Höhe der Einnahmen
    const wk = aktiv > 0 || wkTat > 0 ? (wkTat > ap ? wkTat : Math.min(ap, aktiv)) : 0;
    // Private Veräußerungsgeschäfte (§ 23 EStG): Freigrenze 1.000 € je Person (ab 2024)
    const v23 = n(p.gewinn23) - n(p.vortrag23);
    const veraeusserung = v23 >= 1000 ? v23 : 0;
    return {
      brutto, aktiv, versorgung, vfb, wkVers, wk, wkPausch: !(wkTat > ap), arbeit: aktiv - wk + versorgung - vfb - wkVers,
      geburtsjahr: Math.round(n(p.geburtsjahr)), veraeusserung, rest23: v23 < 0 ? -v23 : 0, renteNr5: 0, aeb: 0,
      rente: 0, vermietung: 0, betrieb: 0, gewerbe: 0, renteGesetzlich: false,
      lst: n(p.lst), soli: n(p.soli), kist: n(p.kist),
      rvAN: n(p.rvAN), rvAG: n(p.rvAG), kv: n(p.kv), pv: n(p.pv), av: n(p.av), ruerup: n(p.ruerup), kvSelbst: n(p.kvSelbst),
      krankengeld: p.krankengeld !== false,
      lohnersatz: n(p.lohnersatzZ15) + n(p.lohnersatz),
      kirche: !!p.kirche,
      ausland: n(p.auslandPflichtig),
      get summe() { return this.arbeit + this.rente + this.vermietung + this.betrieb + this.gewerbe + this.veraeusserung + this.ausland; }
    };
  }

  /**
   * e: { jahr, zusammen, land, alleinerziehend, p1, p2,
   *      sonstVersicherung, spenden, kinderbetreuung (abziehbar), krankheit, ermaessigung35a,
   *      kinder: [{ faktor, kgMonate }],
   *      renten: [{ wer: 1|2, art: 'gesetzlich'|'privat'|'betrieb', betrag, beginn, alter, freibetrag, kvpv }],
   *      kap: { ertraege, kapest, soli, kist },
   *      vermietung: [{ wer, miete, gebaeude, baujahr, afa, zinsen, erhaltung, sonstige }],
   *      betriebe: [{ wer, art: 'frei'|'gewerbe', einnahmen, ausgaben, hebesatz }],
   *      verlustvortrag, vorauszahlung: { est, soli, kist } }
   */
  function berechne(e) {
    const j = JAHR[e.jahr] ? e.jahr : 2025;
    const P = JAHR[j];
    const zus = !!e.zusammen;
    const a = person(e.p1, j);
    const b = zus ? person(e.p2, j) : null;
    const leute = b ? [a, b] : [a];
    const wer = (w) => (zus && Number(w) === 2) ? b : a;
    const r = { jahr: j, zusammen: zus, hinweise: [], renten: [], vermietung: [], betriebe: [] };

    // 1a. Renten (Anlage R): gesetzlich mit Besteuerungsanteil, privat mit Ertragsanteil, Betriebsrente/Riester voll
    const mitSonstigen = new Set();
    (e.renten || []).forEach(x => {
      const p = wer(x.wer);
      const betrag = n(x.betrag);
      if (!betrag) return;
      let pflichtig, info;
      if (x.art === 'privat') {
        // eigener Prozentsatz (z. B. aus der Mitteilung der Versicherung) hat Vorrang
        const ea = n(x.anteil) > 0 ? n(x.anteil) / 100 : ertragsanteil(x.alter);
        if (ea == null) { r.hinweise.push('ertragsanteil_fehlt'); return; }
        pflichtig = betrag * ea;
        info = { anteil: ea };
      } else if (x.art === 'betrieb') {
        pflichtig = betrag; info = { anteil: 1 };
        p.renteNr5 += betrag;
      } else {
        const anteil = besteuerungsanteil(x.beginn);
        const frei = n(x.freibetrag) > 0 ? n(x.freibetrag) : betrag * (1 - anteil);
        pflichtig = Math.max(0, betrag - frei);
        info = { anteil, freibetrag: frei, geschaetzt: !(n(x.freibetrag) > 0) && Math.round(n(x.beginn)) < j };
        p.renteGesetzlich = true;
      }
      p.rente += pflichtig;
      p.kvSelbst += n(x.kvpv);
      mitSonstigen.add(p);
      r.renten.push(Object.assign({ art: x.art || 'gesetzlich', betrag, pflichtig }, info));
    });
    // Werbungskosten-Pauschbetrag 102 € für sonstige Einkünfte (§ 9a Nr. 3 EStG), je Person
    mitSonstigen.forEach(p => { p.rente = Math.max(0, p.rente - Math.min(102, p.rente)); });

    // 1b. Vermietung (Anlage V)
    (e.vermietung || []).forEach(x => {
      const p = wer(x.wer);
      const afa = n(x.afa) > 0 ? n(x.afa) : n(x.gebaeude) * afaSatz(x.baujahr);
      const ueberschuss = n(x.miete) - afa - n(x.zinsen) - n(x.erhaltung) - n(x.sonstige);
      p.vermietung += ueberschuss;
      r.vermietung.push({ afa, satz: n(x.afa) > 0 ? null : afaSatz(x.baujahr), ueberschuss });
    });

    // 1c. Selbstständige Arbeit (Anlage S) und Gewerbebetrieb (Anlage G) mit Gewerbesteuer
    r.gewerbesteuer = 0; r.messbetrag = 0;
    (e.betriebe || []).forEach(x => {
      const p = wer(x.wer);
      const gewinn = n(x.einnahmen) - n(x.ausgaben);
      if (x.art === 'gewerbe') {
        p.gewerbe += gewinn;
        // Gewerbeertrag vereinfacht = Gewinn; Freibetrag 24.500 €, auf volle 100 € abrunden, Messzahl 3,5 %
        const ertrag = Math.floor(Math.max(0, gewinn - 24500) / 100) * 100;
        const mess = Math.floor(ertrag * 0.035 * 100) / 100;
        const hebesatz = n(x.hebesatz) > 0 ? n(x.hebesatz) : 400;
        const gewst = Math.round(mess * hebesatz) / 100;
        r.messbetrag += mess; r.gewerbesteuer += gewst;
        r.betriebe.push({ art: 'gewerbe', gewinn, messbetrag: mess, hebesatz, gewerbesteuer: gewst });
      } else {
        p.betrieb += gewinn;
        r.betriebe.push({ art: 'frei', gewinn });
      }
    });

    // 2. Summe der Einkünfte, Entlastungsbetrag, Verlustvortrag (§ 10d EStG) -> Gesamtbetrag der Einkünfte
    r.arbeit = leute.reduce((s, x) => s + x.arbeit, 0);
    r.rente = leute.reduce((s, x) => s + x.rente, 0);
    r.vermietungSumme = leute.reduce((s, x) => s + x.vermietung, 0);
    r.betriebSumme = leute.reduce((s, x) => s + x.betrieb + x.gewerbe, 0);
    r.einkuenfte = leute.reduce((s, x) => s + x.summe, 0);
    r.veraeusserung = leute.reduce((s, x) => s + x.veraeusserung, 0);
    r.rest23 = leute.reduce((s, x) => s + x.rest23, 0);
    r.versorgungsfreibetrag = leute.reduce((s, x) => s + x.vfb, 0);
    r.auslandPflichtig = leute.reduce((s, x) => s + x.ausland, 0);
    // Altersentlastungsbetrag: wer vor Beginn des Jahres 64 geworden ist; Basis = Arbeitslohn ohne
    // Versorgungsbezüge + positive übrige Einkünfte (ohne Leibrenten, ohne Abgeltungsteuer-Erträge)
    leute.forEach(x => {
      if (!x.geburtsjahr || x.geburtsjahr > j - 65) return;
      const t = altersTabelle(x.geburtsjahr + 65);
      const uebrige = Math.max(0, x.vermietung + x.betrieb + x.gewerbe + x.veraeusserung + x.ausland + Math.max(0, x.renteNr5 - 0));
      const basis = Math.max(0, x.aktiv) + uebrige;
      x.aeb = Math.min(Math.round(basis * t.satz * 100) / 100, t.hoechst);
      x.aeb = Math.ceil(x.aeb);
    });
    r.altersentlastung = leute.reduce((s, x) => s + x.aeb, 0);
    const kinder = (e.kinder || []).filter(k => k && n(k.faktor) > 0);
    const anzKinder = kinder.length;
    r.entlastungAE = (!zus && e.alleinerziehend && anzKinder > 0) ? Math.min(Math.max(0, r.einkuenfte), FEST.alleinerziehend + FEST.alleinerziehendJeWeiteres * (anzKinder - 1)) : 0;
    const vorVerlust = r.einkuenfte - r.altersentlastung - r.entlastungAE;
    const vortrag = Math.max(0, n(e.verlustvortrag));
    const sockel = 1000000 * (zus ? 2 : 1);
    const maxAbzug = vorVerlust > 0 ? Math.min(vorVerlust, sockel) + Math.max(0, vorVerlust - sockel) * 0.7 : 0;
    r.verlustAbzug = Math.min(vortrag, maxAbzug);
    r.gde = vorVerlust - r.verlustAbzug;
    // Verbleibender bzw. neuer Verlust (Sonderausgaben gehen bei negativem Gesamtbetrag verloren)
    r.verlustRest = cent(vortrag - r.verlustAbzug + (r.gde < 0 ? -r.gde : 0));

    // 3. Vorsorge
    const rvGes = leute.reduce((s, x) => s + x.rvAN + x.rvAG + x.ruerup, 0);
    const rvAG = leute.reduce((s, x) => s + x.rvAG, 0);
    r.altersvorsorge = Math.max(0, Math.min(rvGes, P.avHoechst * (zus ? 2 : 1)) - rvAG);
    const basisKV = leute.reduce((s, x) => s + x.kv * (x.krankengeld ? 1 - FEST.krankengeldAbschlag : 1) + x.pv + x.kvSelbst, 0);
    const alleSonst = leute.reduce((s, x) => s + x.kv + x.pv + x.av + x.kvSelbst, 0) + n(e.sonstVersicherung);
    // 1.900 € mit Zuschuss (Arbeitnehmer, Rentner), sonst 2.800 € (z. B. Selbstständige)
    const grenze = leute.reduce((s, x) => s + ((x.brutto > 0 || x.renteGesetzlich) ? FEST.sonstVorsorge : 2800), 0);
    r.basisKV = basisKV;
    r.sonstigeVorsorge = Math.max(basisKV, Math.min(alleSonst, grenze));
    r.vorsorge = Math.floor(r.altersvorsorge + r.sonstigeVorsorge);

    // 4. Weitere Sonderausgaben
    r.kistGezahlt = leute.reduce((s, x) => s + x.kist, 0) + n((e.kap || {}).kist) + n((e.vorauszahlung || {}).kist);
    r.spenden = Math.min(n(e.spenden), Math.max(0, r.gde) * FEST.spendenQuote);
    r.kinderbetreuung = n(e.kinderbetreuung);
    const weitere = r.kistGezahlt + r.spenden + r.kinderbetreuung;
    r.saPausch = weitere < FEST.saPausch * (zus ? 2 : 1);
    r.sonderWeitere = r.saPausch ? FEST.saPausch * (zus ? 2 : 1) : weitere;
    r.sonderausgaben = r.vorsorge + r.sonderWeitere;

    // 5. Außergewöhnliche Belastungen
    r.zumutbar = zumutbar(r.gde, zus, anzKinder);
    r.krankheit = n(e.krankheit);
    r.agb = Math.max(0, r.krankheit - r.zumutbar);

    r.einkommen = r.gde - r.sonderausgaben - r.agb;
    r.leistungen = leute.reduce((s, x) => s + x.lohnersatz, 0);
    r.auslandFrei = n(e.auslandFrei);
    r.lohnersatz = r.leistungen + r.auslandFrei;   // alles, was dem Progressionsvorbehalt unterliegt
    r.kfbSumme = kinder.reduce((s, k) => s + (P.kfb + P.bea) * Math.min(1, n(k.faktor)), 0);
    r.kindergeld = kinder.reduce((s, k) => s + P.kg * Math.max(0, Math.min(12, n(k.kgMonate == null ? 12 : k.kgMonate))) * Math.min(1, n(k.faktor)), 0);

    // 6. Kapitalerträge: Abgeltungsteuer 25 % oder – wenn günstiger – persönlicher Steuersatz (§ 32d Abs. 6 EStG)
    const kap = e.kap || {};
    // Verlusttöpfe: Aktienverluste nur mit Aktiengewinnen, sonstige Verluste mit allen Erträgen
    const aktienSaldo = n(kap.aktienGewinne) - n(kap.aktienVerluste) - n(kap.vortragAktien);
    r.kapRestAktien = aktienSaldo < 0 ? -aktienSaldo : 0;
    const allgemein = n(kap.ertraege) + Math.max(0, aktienSaldo) - n(kap.sonstVerluste) - n(kap.vortragSonst);
    r.kapRestSonst = allgemein < 0 ? -allgemein : 0;
    r.kapErtraege = Math.max(0, allgemein);
    r.kapBrutto = n(kap.ertraege) + n(kap.aktienGewinne);
    r.sparerPausch = 1000 * (zus ? 2 : 1);
    r.kapPflichtig = Math.max(0, r.kapErtraege - r.sparerPausch);
    const quelle = n(kap.quellensteuer);
    const satz = kistSatz(e.land);
    const kirchenAnteilKap = leute.some(x => x.kirche) ? 1 : 0;

    const ermWunsch = n(e.ermaessigung35a);
    // Ein kompletter Rechenfall; kapImTarif = Kapitalerträge mit dem persönlichen Steuersatz
    const fall = (kapImTarif) => {
      const f = {};
      const extra = kapImTarif ? r.kapPflichtig : 0;
      const zvEOhne = Math.max(0, Math.floor(r.einkommen + extra));
      const zvEMit = Math.max(0, Math.floor(r.einkommen + extra - r.kfbSumme));
      const estOhne = steuer(zvEOhne, j, zus, r.lohnersatz);
      const estMit = steuer(zvEMit, j, zus, r.lohnersatz);
      f.kfbErsparnis = estOhne - estMit;
      f.kfbGuenstiger = anzKinder > 0 && f.kfbErsparnis > r.kindergeld;
      f.zvE = f.kfbGuenstiger ? zvEMit : zvEOhne;
      f.zvEMitKfb = zvEMit;
      f.estTariflich = f.kfbGuenstiger ? estMit : estOhne;
      // § 35 EStG: Ermäßigung für gewerbliche Einkünfte (4,0 × Messbetrag, höchstens Gewerbesteuer und anteilige ESt)
      const gewerbeAnteil = r.einkuenfte > 0 ? Math.max(0, leute.reduce((s, x) => s + x.gewerbe, 0)) / Math.max(1, leute.reduce((s, x) => s + Math.max(0, x.summe), 0)) : 0;
      f.erm35 = Math.floor(Math.min(4 * r.messbetrag, r.gewerbesteuer, f.estTariflich * Math.min(1, gewerbeAnteil)) * 100) / 100;
      f.erm35a = Math.min(ermWunsch, Math.max(0, f.estTariflich - f.erm35));
      // § 34c: ausländische Steuer höchstens bis zur deutschen Steuer auf diese Einkünfte (vereinfacht anteilig)
      const posSumme = Math.max(1, leute.reduce((s, x) => s + Math.max(0, x.summe), 0) + (kapImTarif ? r.kapPflichtig : 0));
      f.anrechnung = Math.min(n(e.auslandSteuer) + (kapImTarif ? quelle : 0), Math.max(0, f.estTariflich - f.erm35 - f.erm35a) * Math.min(1, (r.auslandPflichtig + (kapImTarif ? r.kapPflichtig : 0)) / posSumme));
      f.anrechnung = Math.floor(f.anrechnung * 100) / 100;
      f.est = Math.max(0, f.estTariflich - f.erm35 - f.erm35a - f.anrechnung);
      f.estFestzusetzen = f.est + (f.kfbGuenstiger ? r.kindergeld : 0);
      // Soli/Kirchensteuer immer mit Kinderfreibeträgen gerechnet (§ 51a EStG)
      const basis = Math.max(0, estMit - Math.min(4 * r.messbetrag, r.gewerbesteuer, estMit * Math.min(1, gewerbeAnteil)) - Math.min(ermWunsch, estMit) - f.anrechnung);
      f.soli = soliAus(basis, j, zus);
      // Kirchensteuer: beide Mitglied (auch verschiedene Kirchen, Halbteilung) = voll;
      // nur eine Person: Anteil im Verhältnis der Grundtabellen-Steuer auf die eigene Summe der Einkünfte
      if (!b) f.kistAnteil = a.kirche ? 1 : 0;
      else if (a.kirche && b.kirche) f.kistAnteil = 1;
      else if (!a.kirche && !b.kirche) f.kistAnteil = 0;
      else {
        const sa = tarif(Math.max(0, a.summe), j), sb = tarif(Math.max(0, b.summe), j);
        const mitglied = a.kirche ? sa : sb;
        f.kistAnteil = (sa + sb) > 0 ? mitglied / (sa + sb) : ((a.kirche ? a.summe : b.summe) / Math.max(1, a.summe + b.summe));
      }
      f.kist = cent(basis * satz * f.kistAnteil);
      f.kirchgeld = 0;
      if (b && (a.kirche !== b.kirche)) {
        const kg = kirchgeld(zvEMit, j);
        if (kg > f.kist) { f.kirchgeld = kg; f.kist = kg; }
      }
      // Kapitalerträge getrennt mit Abgeltungsteuer (bei Kirchenmitgliedschaft: e / (4 + k))
      if (kapImTarif || !r.kapPflichtig) { f.kapESt = 0; f.kapSoli = 0; f.kapKist = 0; }
      else {
        const k = kirchenAnteilKap ? satz * 100 : 0;
        // § 32d Abs. 1 EStG: (e − 4q) / (4 + k), q = anrechenbare ausländische Steuer
        f.kapESt = Math.max(0, Math.floor((r.kapPflichtig - 4 * quelle) / (4 + k / 100) * 100) / 100);
        f.kapSoli = cent(f.kapESt * FEST.soliSatz);
        f.kapKist = cent(f.kapESt * (kirchenAnteilKap ? satz : 0));
      }
      f.summe = f.estFestzusetzen + f.soli + f.kist + f.kapESt + f.kapSoli + f.kapKist;
      return f;
    };
    const getrennt = fall(false);
    const imTarif = r.kapPflichtig > 0 ? fall(true) : null;
    // Nur wenn auch die Summe (inkl. Kindergeld-Verrechnung) niedriger ist
    r.kapGuenstiger = !!(imTarif && imTarif.summe < getrennt.summe);
    const f = r.kapGuenstiger ? imTarif : getrennt;
    Object.assign(r, {
      zvE: f.zvE, estTariflich: f.estTariflich, kfbErsparnis: f.kfbErsparnis, kfbGuenstiger: f.kfbGuenstiger,
      erm35: f.erm35, erm35a: f.erm35a, anrechnung: f.anrechnung, est: f.est, estFestzusetzen: f.estFestzusetzen,
      soli: f.soli, kist: f.kist, kistAnteil: f.kistAnteil, kirchgeld: f.kirchgeld, kistSatz: satz,
      kapESt: f.kapESt, kapSoli: f.kapSoli, kapKist: f.kapKist
    });

    // 7. Vergleich mit dem Gezahlten (Lohnsteuer, Kapitalertragsteuer, Vorauszahlungen)
    const vz = e.vorauszahlung || {};
    r.gezahlt = {
      est: leute.reduce((s, x) => s + x.lst, 0) + n(kap.kapest) + n(vz.est),
      soli: leute.reduce((s, x) => s + x.soli, 0) + n(kap.soli) + n(vz.soli),
      kist: r.kistGezahlt
    };
    r.festgesetzt = { est: r.estFestzusetzen + r.kapESt, soli: r.soli + r.kapSoli, kist: r.kist + r.kapKist };
    r.differenz = {
      est: cent(r.gezahlt.est - r.festgesetzt.est),
      soli: cent(r.gezahlt.soli - r.festgesetzt.soli),
      kist: cent(r.gezahlt.kist - r.festgesetzt.kist)
    };
    r.ergebnis = cent(r.differenz.est + r.differenz.soli + r.differenz.kist);

    // Hinweise
    if (r.leistungen > FEST.pflichtLohnersatz) r.hinweise.push('pflicht_lohnersatz');
    if (r.leistungen > 0) r.hinweise.push('progression');
    if (anzKinder && !r.kfbGuenstiger) r.hinweise.push('kindergeld_besser');
    if (r.kfbGuenstiger) r.hinweise.push('kfb_besser');
    if (zus) r.hinweise.push('zusammen');
    if (r.kapGuenstiger) r.hinweise.push('kap_tarif');
    if (r.kapErtraege > 0 && !r.kapGuenstiger && n(kap.kapest) > r.kapESt + 0.01) r.hinweise.push('kap_erstattung');
    if (r.verlustRest > 0) r.hinweise.push('verlust_rest');
    if (r.gewerbesteuer > 0) r.hinweise.push('gewerbesteuer');
    if (r.renten.some(x => x.geschaetzt)) r.hinweise.push('rente_freibetrag');
    if (r.kirchgeld) r.hinweise.push('kirchgeld');
    if (r.altersentlastung) r.hinweise.push('altersentlastung');
    if (r.versorgungsfreibetrag) r.hinweise.push('versorgung');
    if (r.rest23 > 0) r.hinweise.push('verlust23');
    if (r.kapRestAktien > 0 || r.kapRestSonst > 0) r.hinweise.push('verlust_kap');
    if (n(e.auslandFrei) || r.auslandPflichtig) r.hinweise.push('ausland');
    if (leute.some(x => !x.veraeusserung && x.rest23 === 0) && [e.p1, e.p2].some(p => p && n(p.gewinn23) > 0 && n(p.gewinn23) - n(p.vortrag23) < 1000 && n(p.gewinn23) - n(p.vortrag23) > 0)) r.hinweise.push('freigrenze23');
    if (r.betriebSumme !== 0 || r.vermietungSumme !== 0 || r.rente > 0) r.hinweise.push('pflicht_weitere');
    const nurLohn = leute.every(x => x.brutto === 0) && r.rente === 0 && r.vermietungSumme === 0 && r.betriebSumme === 0 && r.kapBrutto === 0 && r.veraeusserung === 0 && r.auslandPflichtig === 0 && !n(e.auslandFrei);
    if (nurLohn) r.hinweise.push('kein_lohn');
    r.hatEinkuenfte = !nurLohn;
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
      else if (ctx === 8 || /versorgungsbez.*enthalten|in 3\. enthaltene versorgungsbez/.test(t)) setze('versorgung', w, z);
      else if (ctx === 29 || /bemessungsgrundlage.*versorgungsfreibetrag/.test(t)) setze('vBmg', w, z);
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

  const api = { versorgungsTabelle, altersTabelle, besteuerungsanteil, ertragsanteil, afaSatz, kirchgeld, leseLohnsteuerbescheinigung, JAHR, FEST, LAENDER, tarif, tarifVeranlagung, steuer, zumutbar, soliAus, berechne, kistSatz };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  g.SDSteuer = api;
})(typeof window !== 'undefined' ? window : globalThis);
