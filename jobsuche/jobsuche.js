/* SD Hub – Arbeit finden (thesdhub.com/jobsuche/)
   Stellen kommen über den SD-Server (/hub/jobs) aus der Jobbörse der Bundesagentur für Arbeit.
   Gemerkte Stellen landen im Bewerbungs-Tracker (localStorage „sdBewerbungen“). */
(function () {
  'use strict';
  const { $, t, esc } = SD;
  const SERVER = (() => { try { return localStorage.getItem('sdLearnServer') || ''; } catch (e) { return ''; } })() || 'https://sd-maschinen-kenner.onrender.com';
  const KEY = 'sdJobsuche', TRACKER = 'sdBewerbungen';
  const FELDER = ['was', 'wo', 'umkreis', 'art', 'zeit'];
  const d = SD.lesen(KEY, {});
  if (!Array.isArray(d.suchen)) d.suchen = [];
  FELDER.forEach(k => { if (d[k] != null && $(k)) $(k).value = d[k]; });
  const merke = () => SD.schreiben(KEY, d);

  // ---------- Sprache ----------
  const SPR = ['de', 'en', 'fa', 'ar', 'ur', 'uk', 'ti'];
  function spracheZeigen() {
    const l = SPR.includes(window.SD_LANG) ? window.SD_LANG : 'de';
    $('langWahl').value = l;
    const h = $('spracheHinweis');
    h.hidden = l === 'de';
    h.textContent = l === 'de' ? '' : t('hinweis_sprache');
  }
  $('langWahl').addEventListener('change', () => sdApplyLang($('langWahl').value));

  // ---------- Fähigkeiten -> deutsche Berufsnamen ----------
  const FAEHIG = [
    ['kochen', '🍳', ['Koch', 'Küchenhilfe', 'Beikoch']],
    ['fahren', '🚚', ['Berufskraftfahrer', 'Kurierfahrer', 'Auslieferungsfahrer', 'Busfahrer']],
    ['pflegen', '🩺', ['Pflegehelfer', 'Pflegefachkraft', 'Altenpfleger', 'Betreuungskraft']],
    ['bauen', '🧱', ['Bauhelfer', 'Maurer', 'Trockenbauer', 'Maler und Lackierer']],
    ['putzen', '🧽', ['Reinigungskraft', 'Gebäudereiniger', 'Zimmermädchen']],
    ['lager', '📦', ['Lagerhelfer', 'Kommissionierer', 'Fachkraft für Lagerlogistik', 'Staplerfahrer']],
    ['verkaufen', '🛒', ['Verkäufer', 'Kassierer', 'Verkaufshilfe']],
    ['kinder', '🧸', ['Erzieher', 'Kinderpfleger', 'Sozialassistent']],
    ['strom', '⚡', ['Elektriker', 'Elektroniker', 'Elektrohelfer']],
    ['auto', '🔧', ['Kfz-Mechatroniker', 'Kfz-Helfer', 'Reifenmonteur']],
    ['haare', '💇', ['Friseur', 'Kosmetiker']],
    ['buero', '🗂️', ['Bürokaufmann', 'Sachbearbeiter', 'Bürohilfe']],
    ['computer', '💻', ['Fachinformatiker', 'IT-Support', 'Softwareentwickler']],
    ['garten', '🌳', ['Gärtner', 'Garten- und Landschaftsbau', 'Erntehelfer']],
    ['gastro', '🍽️', ['Servicekraft', 'Kellner', 'Barista', 'Hotelfachmann']],
    ['metall', '🔩', ['Schweißer', 'Industriemechaniker', 'Produktionshelfer', 'Metallbauer']],
    ['naehen', '🧵', ['Schneider', 'Näher', 'Textilreinigung']],
    ['sicher', '🛡️', ['Sicherheitsmitarbeiter', 'Pförtner']],
    ['sprachen', '🗣️', ['Dolmetscher', 'Sprachmittler', 'Integrationshelfer']],
    ['post', '✉️', ['Zusteller', 'Paketzusteller', 'Postbote']]
  ];
  function zeigeFaehig() {
    $('faehig').innerHTML = FAEHIG.map((f, i) => '<button type="button" class="chip" data-f="' + i + '">' + f[1] + ' ' + esc(t('fk_' + f[0])) + '</button>').join('');
  }
  $('faehig').addEventListener('click', (e) => {
    const b = e.target.closest('[data-f]'); if (!b) return;
    const f = FAEHIG[+b.dataset.f];
    $('faehig').querySelectorAll('.chip').forEach(c => c.classList.toggle('an', c === b));
    $('begriffe').innerHTML = '<span class="info" style="margin:0">' + esc(t('f_begriffe')) + '</span>' +
      f[2].map(w => '<button type="button" class="chip" data-w="' + esc(w) + '" lang="de">' + esc(w) + '</button>').join('');
  });
  $('begriffe').addEventListener('click', (e) => {
    const b = e.target.closest('[data-w]'); if (!b) return;
    $('was').value = b.dataset.w;
    speichernFelder(); zeigePortale();
    $('was').scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  // ---------- Suche ----------
  const suche = () => ({ was: $('was').value.trim(), wo: $('wo').value.trim(), umkreis: $('umkreis').value, art: $('art').value, zeit: $('zeit').value });
  const ANGEBOT = { arbeit: '1', minijob: '1', ausbildung: '4', praktikum: '34' };
  const azeit = (s) => (s.art === 'minijob' ? 'mj' : s.zeit);
  const slug = (s) => String(s || '').trim().toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const qs = (o) => Object.entries(o).filter(e => e[1]).map(e => e[0] + '=' + encodeURIComponent(e[1])).join('&');
  const zusatz = (s) => [s.was, { minijob: 'Minijob', ausbildung: 'Ausbildung', praktikum: 'Praktikum' }[s.art] || '', { tz: 'Teilzeit', ho: 'Homeoffice' }[s.zeit] || ''].filter(Boolean).join(' ');
  const baUrl = (s) => 'https://www.arbeitsagentur.de/jobsuche/suche?' + qs({ angebotsart: ANGEBOT[s.art], was: s.was, wo: s.wo, umkreis: s.wo ? s.umkreis : '', arbeitszeit: azeit(s) });
  const detailUrl = (refnr) => 'https://www.arbeitsagentur.de/jobsuche/jobdetail/' + encodeURIComponent(refnr);

  function portale(s) {
    const text = zusatz(s), st = slug(text);
    const l = [
      ['ba', baUrl(s)],
      ['indeed', 'https://de.indeed.com/jobs?' + qs({ q: text, l: s.wo, radius: s.wo ? s.umkreis : '' })],
      ['stepstone', st ? 'https://www.stepstone.de/jobs/' + st + (s.wo ? '/in-' + slug(s.wo) + '?' + qs({ radius: s.umkreis }) : '') : ''],
      ['linkedin', 'https://www.linkedin.com/jobs/search/?' + qs({ keywords: text, location: s.wo })]
    ];
    // feste Seiten ohne Suchparameter (Adresse geprüft)
    if (s.art === 'ausbildung') l.push(['ihk', 'https://www.ihk.de/themen/ausbildung/ihk-lehrstellenboerse'], ['miig_a', 'https://www.make-it-in-germany.com/de/arbeiten-in-deutschland/jobboerse/ausbildung']);
    else l.push(['miig', 'https://www.make-it-in-germany.com/de/arbeiten-in-deutschland/jobboerse']);
    return l;
  }
  function zeigePortale() {
    $('portale').innerHTML = portale(suche()).map(([id, url]) =>
      '<a class="portal" target="_blank" rel="noopener" data-p="' + id + '"' + (url ? ' href="' + esc(url) + '"' : ' aria-disabled="true"') + '>' +
      '<b>' + esc(t('p_' + id)) + ' ↗</b><small>' + esc(url ? t('p_' + id + '_t') : t('p_leer')) + '</small></a>').join('');
  }
  function speichernFelder() { Object.assign(d, suche()); merke(); }
  FELDER.forEach(k => $(k).addEventListener('input', () => { speichernFelder(); zeigePortale(); }));

  async function jobsHolen(s, seite) {
    const ctrl = new AbortController();
    const zeit = setTimeout(() => ctrl.abort(), 75000);   // der kostenlose Server braucht beim Aufwachen bis ~1 Minute
    try {
      const r = await fetch(SERVER + '/hub/jobs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctrl.signal,
        body: JSON.stringify({ was: s.was, wo: s.wo, umkreis: s.umkreis, angebotsart: ANGEBOT[s.art], arbeitszeit: azeit(s), seite: seite || 1 })
      });
      let j = {};
      try { j = await r.json(); } catch (e) { j = {}; }
      if (!r.ok || !j.ok) throw new Error(j.error || ('HTTP ' + r.status));
      return j;
    } finally { clearTimeout(zeit); }
  }

  let liste = [], seite = 1, gesamt = 0, aktuelleSuche = null, laeuft = false;
  function stelleHtml(j, neu) {
    const link = detailUrl(j.refnr);
    const meta = [j.firma, [j.ort, j.entfernung && j.entfernung !== '0' ? j.entfernung + ' km' : ''].filter(Boolean).join(' · '),
      j.datum ? t('r_seit', { d: SD.fmt(j.datum) }) : ''].filter(Boolean);
    return '<div class="stelle' + (neu ? ' neu' : '') + '" lang="de"><h3>' + (neu ? '🆕 ' : '') + esc(j.titel || j.beruf) + '</h3>' +
      '<div class="meta">' + esc(meta.join(' · ')) + '</div>' +
      '<div class="knoepfe">' +
      '<a class="btn klein prim" target="_blank" rel="noopener" href="' + esc(link) + '">' + esc(t('r_oeffnen')) + ' ↗</a>' +
      '<button type="button" class="btn klein" data-merk="' + esc(j.refnr) + '">' + esc(t('r_merken')) + '</button>' +
      '<button type="button" class="btn klein" data-bew="' + esc(j.refnr) + '">' + esc(t('r_bewerben')) + '</button>' +
      '</div></div>';
  }
  function zeigeListe(neueRefs) {
    $('ergebnis').innerHTML = liste.map(j => stelleHtml(j, neueRefs && neueRefs.has(j.refnr))).join('');
    $('mehr').hidden = !(liste.length < gesamt && liste.length < 1000);
  }
  async function suchen(mehr, neueRefs) {
    if (laeuft) return;
    const s = mehr ? aktuelleSuche : suche();
    if (!s.was && !s.wo) { $('status').textContent = t('r_eingeben'); return; }
    laeuft = true;
    $('suchen').disabled = true; $('mehr').disabled = true;
    const wach = setTimeout(() => { $('status').textContent = t('r_aufwachen'); }, 6000);
    $('status').textContent = t('r_laedt');
    try {
      const j = await jobsHolen(s, mehr ? seite + 1 : 1);
      if (mehr) { seite++; liste = liste.concat(j.stellen.filter(x => !liste.some(y => y.refnr === x.refnr))); }
      else { seite = 1; liste = j.stellen; aktuelleSuche = s; }
      gesamt = j.gesamt;
      $('status').textContent = gesamt ? t('r_anzahl', { n: gesamt.toLocaleString('de-DE') }) : t('r_keine');
      zeigeListe(neueRefs);
      gesehenMerken(s, j.stellen);
    } catch (e) {
      $('status').textContent = t('r_fehler', { f: (e && e.name === 'AbortError') ? t('r_zeit') : ((e && e.message) || String(e)) });
    } finally {
      clearTimeout(wach); laeuft = false;
      $('suchen').disabled = false; $('mehr').disabled = false;
    }
  }
  $('suchen').addEventListener('click', () => suchen(false));
  $('mehr').addEventListener('click', () => suchen(true));
  $('was').addEventListener('keydown', (e) => { if (e.key === 'Enter') suchen(false); });
  $('wo').addEventListener('keydown', (e) => { if (e.key === 'Enter') suchen(false); });

  // ---------- Gespeicherte Suchen ----------
  const gleich = (a, b) => FELDER.every(k => String(a[k] || '') === String(b[k] || ''));
  const name = (s) => [s.was || '…', s.wo, t('a_' + s.art)].filter(Boolean).join(' · ');
  function gesehenMerken(s, stellen) {
    const g = d.suchen.find(x => gleich(x, s));
    if (!g) return;
    g.gesehen = Array.from(new Set((stellen || []).map(x => x.refnr).concat(g.gesehen || []))).slice(0, 300);
    g.neu = 0; merke(); zeigeSuchen();
  }
  function zeigeSuchen() {
    $('suchenKarte').hidden = !d.suchen.length;
    $('suchListe').innerHTML = d.suchen.map((s, i) => '<div class="eintrag"><div class="oben"><b lang="de">' + esc(name(s)) + '</b>' +
      (s.neu ? '<span class="marke">' + esc(t('g_neu', { n: s.neu })) + '</span>' : s.neu === 0 ? '<span class="marke grau">' + esc(t('g_keine_neu')) + '</span>' : '') + '</div>' +
      '<div class="knoepfe"><button type="button" class="btn klein prim" data-g="' + i + '">' + esc(t('g_zeigen')) + '</button>' +
      '<button type="button" class="btn klein" data-gk="' + i + '" title="' + esc(t('g_kal')) + '">📅 ' + esc(t('g_kal')) + '</button>' +
      '<button type="button" class="btn klein" data-gx="' + i + '" aria-label="' + esc(t('g_loeschen')) + '">✕</button></div></div>').join('');
  }
  $('speichernSuche').addEventListener('click', () => {
    const s = suche();
    if (!s.was && !s.wo) { $('status').textContent = t('r_eingeben'); return; }
    if (!d.suchen.some(x => gleich(x, s))) d.suchen.unshift(Object.assign({ gesehen: liste.map(x => x.refnr) }, s));
    d.suchen = d.suchen.slice(0, 5); merke(); zeigeSuchen();
    SD.toast(t('g_gespeichert'));
  });
  $('suchListe').addEventListener('click', (e) => {
    const b = e.target.closest('[data-g],[data-gk],[data-gx]'); if (!b) return;
    if (b.dataset.gx != null) { d.suchen.splice(+b.dataset.gx, 1); merke(); zeigeSuchen(); return; }
    const s = d.suchen[+(b.dataset.g || b.dataset.gk)]; if (!s) return;
    if (b.dataset.gk != null) {
      const montag = new Date(); montag.setDate(montag.getDate() + ((8 - montag.getDay()) % 7 || 7));
      SD.icsDatei([{ uid: 'jobsuche-' + slug(name(s)), datum: SD.iso(montag), rrule: 'FREQ=WEEKLY',
        titel: 'Neue Stellen ansehen: ' + name(s), text: 'https://thesdhub.com/jobsuche/  ·  ' + baUrl(s) }], SD.dateiname('jobsuche-' + (s.was || 'suche'), '.ics'));
      return;
    }
    FELDER.forEach(k => { if (s[k] != null) $(k).value = s[k]; });
    speichernFelder(); zeigePortale();
    const alt = new Set(s.gesehen || []);
    suchen(false, null).then(() => { zeigeListe(new Set(liste.map(x => x.refnr).filter(r => !alt.has(r)))); });
    $('ergebnis').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
  async function neueStellenPruefen() {
    for (const s of d.suchen.slice(0, 5)) {
      try {
        const j = await jobsHolen(s, 1);
        const alt = new Set(s.gesehen || []);
        s.neu = (j.stellen || []).filter(x => !alt.has(x.refnr)).length;
      } catch (e) { s.neu = undefined; break; }   // Server schläft oder ist weg: nicht weiter versuchen
      merke(); zeigeSuchen();
    }
  }

  // ---------- Merken (Bewerbungs-Tracker) ----------
  function trackerLesen() { try { const l = JSON.parse(localStorage.getItem(TRACKER) || '[]'); return Array.isArray(l) ? l : []; } catch (e) { return []; } }
  function trackerSchreiben(l) { try { localStorage.setItem(TRACKER, JSON.stringify(l)); return true; } catch (e) { return false; } }
  function inTracker(e) {
    const l = trackerLesen();
    const da = e.link && l.find(b => b.link === e.link);
    if (da) return da;
    const b = Object.assign({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), erstellt: Date.now(), status: 'gemerkt',
      verlauf: [{ datum: SD.heuteIso(), status: 'gemerkt' }] }, e);
    l.push(b); trackerSchreiben(l); zeigeGemerkt();
    return b;
  }
  function ausStelle(refnr) {
    const j = liste.find(x => x.refnr === refnr); if (!j) return null;
    return { firma: j.firma || '–', position: j.titel || j.beruf, ort: j.ort, link: detailUrl(j.refnr), notizen: j.beruf && j.beruf !== j.titel ? 'Beruf: ' + j.beruf : '' };
  }
  // Bewerbung: Firma/Stelle in die Lebenslauf-App, Anzeige (Text oder Link) in „Anschreiben zur Stellenanzeige“
  function bewerben(b) {
    const sitzung = localStorage.getItem('speicherModusEinstellung') === 'sitzung';
    const ort = sitzung ? sessionStorage : localStorage;
    let daten = {};
    try { daten = JSON.parse(ort.getItem('lebenslaufDaten') || localStorage.getItem('lebenslaufDaten') || '{}') || {}; } catch (e) { daten = {}; }
    daten.unternehmen = b.firma || '';
    if (b.position) daten.position = b.position;
    if (b.kontakt) daten.ansprechperson = b.kontakt;
    const anzeige = b.anzeige || [b.position, b.firma, b.ort, b.notizen, b.link].filter(Boolean).join('\n');
    try {
      ort.setItem('lebenslaufDaten', JSON.stringify(daten));
      localStorage.setItem('pdfstudioBereinigtV2', '1');
      if (anzeige) sessionStorage.setItem('sdStellenLink', anzeige);
    } catch (e) { /* egal */ }
    location.href = '../Lebenslauf_app.html#anschreiben';
  }
  $('ergebnis').addEventListener('click', (e) => {
    const m = e.target.closest('[data-merk]'), w = e.target.closest('[data-bew]');
    if (!m && !w) return;
    const s = ausStelle((m || w).dataset.merk || (m || w).dataset.bew); if (!s) return;
    const b = inTracker(s);
    if (m) { SD.toast(t('m_ok', { x: s.firma })); m.disabled = true; m.textContent = '⭐ ✓'; }
    else bewerben(b);
  });

  let anzeigeText = '';
  $('merkForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const firma = $('mFirma').value.trim(); if (!firma) return;
    const link = $('mLink').value.trim();
    inTracker({ firma, position: $('mStelle').value.trim(), ort: $('mOrt').value.trim(), link: /^https?:\/\//i.test(link) ? link : '',
      frist: $('mFrist').value || '', kontakt: $('mKontakt').value.trim(), notizen: $('mAnf').value.trim(), anzeige: anzeigeText.slice(0, 8000) });
    SD.toast(t('m_ok', { x: firma }));
    $('merkForm').reset(); anzeigeText = '';
  });
  function zeigeGemerkt() {
    const alle = trackerLesen().filter(b => b.status === 'gemerkt');
    const l = alle.slice(-5).reverse();
    $('gemerkt').innerHTML = !l.length ? '' : '<h3 style="margin:6px 0 0;font-size:.95rem">' + esc(t('m_gemerkt', { n: alle.length })) + '</h3>' +
      l.map(b => '<div class="eintrag" lang="de"><div class="oben"><b>' + esc(b.firma || '–') + '</b>' + (b.frist ? '<span class="marke">' + esc(t('m_bis', { d: SD.fmt(b.frist) })) + '</span>' : '') + '</div>' +
        '<div class="meta">' + esc([b.position, b.ort].filter(Boolean).join(' · ')) + '</div>' +
        '<div class="knoepfe">' + (/^https?:\/\//i.test(b.link || '') ? '<a class="btn klein" target="_blank" rel="noopener" href="' + esc(b.link) + '">' + esc(t('r_oeffnen')) + ' ↗</a>' : '') +
        '<button type="button" class="btn klein prim" data-tb="' + esc(b.id) + '">' + esc(t('r_bewerben')) + '</button></div></div>').join('');
  }
  $('gemerkt').addEventListener('click', (e) => {
    const k = e.target.closest('[data-tb]'); if (!k) return;
    const b = trackerLesen().find(x => x.id === k.dataset.tb); if (b) bewerben(b);
  });

  // ---------- Anzeige mit KI einlesen ----------
  $('kiAnzeige').addEventListener('click', () => {
    if (!window.sdKi || !window.sdKi.einleseDialog) { SD.toast(t('ki_fehlt')); return; }
    const felder = [
      { id: 'firma', label: t('m_firma') }, { id: 'stelle', label: t('m_stelle') }, { id: 'ort', label: t('m_ort') },
      { id: 'frist', label: t('m_frist') }, { id: 'kontakt', label: t('m_kontakt') }, { id: 'link', label: t('m_link') },
      { id: 'anforderungen', label: t('m_anf'), mehrzeilig: true }
    ];
    let letzterText = '';
    window.sdKi.einleseDialog({
      modus: 'beides', ohneVerbessern: true, titel: t('ki_titel'), beschreibung: t('ki_text'),
      platzhalter: t('ki_ph'), startText: t('ki_start'), dokumentArt: 'eine Stellenanzeige', felder,
      promptBauer: (text, info) => {
        letzterText = text || '';
        return 'Lies die Stellenanzeige unten und trage die Angaben ein. Erfinde nichts: Was nicht in der Anzeige steht, lässt du leer (nur "-").\n' +
          '- frist: Bewerbungsfrist im Format JJJJ-MM-TT, nur wenn ein Datum genannt ist.\n' +
          '- link: nur eine Internetadresse, die in der Anzeige steht.\n' +
          '- anforderungen: 3-8 kurze Stichpunkte auf Deutsch, was verlangt wird (Ausbildung, Erfahrung, Sprache, Führerschein …).\n' +
          (info.datei ? '- Die Anzeige ist zusätzlich als Datei/Foto angehängt.\n' : '') +
          '- Antworte NUR in diesem Format, jede Überschrift genau so (### feldname), darunter der Inhalt:\n\n' +
          '### firma\n### stelle\n### ort\n### frist\n### kontakt\n### link\n### anforderungen\n\n=== STELLENANZEIGE ===\n' + (text || '(siehe angehängte Datei)');
      },
      uebernehmen: (w) => {
        const leer = (v) => !v || /^-+$/.test(String(v).trim());
        const setz = (id, v) => { if (!leer(v)) $(id).value = String(v).trim(); };
        setz('mFirma', w.firma); setz('mStelle', w.stelle); setz('mOrt', w.ort); setz('mKontakt', w.kontakt); setz('mAnf', w.anforderungen);
        if (!leer(w.link) && /^https?:\/\/\S+$/i.test(String(w.link).trim())) $('mLink').value = String(w.link).trim();
        if (!leer(w.frist) && /^\d{4}-\d{2}-\d{2}$/.test(String(w.frist).trim())) $('mFrist').value = String(w.frist).trim();
        anzeigeText = letzterText;
        $('merkForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
        return Object.keys(w).length;
      }
    });
  });

  // ---------- Start ----------
  function alles() { spracheZeigen(); zeigeFaehig(); zeigePortale(); zeigeSuchen(); zeigeGemerkt(); if (liste.length) zeigeListe(); }
  document.addEventListener('sd-lang-changed', alles);
  alles();
  if (d.suchen.length) neueStellenPruefen();
})();
