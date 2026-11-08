/* SD Hub – Arbeit finden (thesdhub.com/jobsuche/)
   Stellen kommen über den SD-Server (/hub/jobs) aus der Jobbörse der Bundesagentur für Arbeit.
   Gemerkte Stellen landen im Bewerbungs-Tracker (localStorage „sdBewerbungen“). */
(function () {
  'use strict';
  const { $, t, esc } = SD;
  const SERVER = (() => { try { return localStorage.getItem('sdLearnServer') || ''; } catch (e) { return ''; } })() || 'https://sd-maschinen-kenner.onrender.com';
  const KEY = 'sdJobsuche', TRACKER = 'sdBewerbungen';
  const FELDER = ['was', 'wo', 'umkreis', 'art', 'zeit', 'land'];
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
  const FILTER = { tage: 'fTage', unbef: 'fUnbef', ohneZa: 'fOhneZa', ohnePav: 'fOhnePav' };
  const fWert = (k) => { const el = $(FILTER[k]); return el.type === 'checkbox' ? el.checked : el.value; };
  if (d.filter) Object.keys(FILTER).forEach(k => { const el = $(FILTER[k]); if (d.filter[k] != null) { if (el.type === 'checkbox') el.checked = !!d.filter[k]; else el.value = d.filter[k]; } });
  if (d.filter && Object.values(d.filter).some(Boolean)) $('filterBox').open = true;
  const suche = () => ({ land: $('land').value || 'de', was: $('was').value.trim(), wo: $('wo').value.trim(), umkreis: $('umkreis').value, art: $('art').value, zeit: $('zeit').value,
    tage: fWert('tage'), unbef: fWert('unbef'), ohneZa: fWert('ohneZa'), ohnePav: fWert('ohnePav') });
  const ANGEBOT = { arbeit: '1', minijob: '1', ausbildung: '4', praktikum: '34' };
  const azeit = (s) => (s.art === 'minijob' ? 'mj' : s.zeit);
  const slug = (s) => String(s || '').trim().toLowerCase().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const qs = (o) => Object.entries(o).filter(e => e[1]).map(e => e[0] + '=' + encodeURIComponent(e[1])).join('&');
  const zusatz = (s) => [s.was, { minijob: 'Minijob', ausbildung: 'Ausbildung', praktikum: 'Praktikum' }[s.art] || '', { tz: 'Teilzeit', ho: 'Homeoffice' }[s.zeit] || ''].filter(Boolean).join(' ');
  const baUrl = (s) => 'https://www.arbeitsagentur.de/jobsuche/suche?' + qs({ angebotsart: ANGEBOT[s.art], was: s.was, wo: s.wo, umkreis: s.wo ? s.umkreis : '', arbeitszeit: azeit(s) });
  const detailUrl = (refnr) => 'https://www.arbeitsagentur.de/jobsuche/jobdetail/' + encodeURIComponent(refnr);

  function portale(s) {
    const text = zusatz(s), st = slug(text);
    if (s.land && s.land !== 'de') {
      const ort = [s.wo, landName(s.land)].filter(Boolean).join(', ');
      const l = [];
      if (INDEED.includes(s.land)) l.push(['indeed', 'https://' + s.land + '.indeed.com/jobs?' + qs({ q: s.was, l: s.wo })]);
      l.push(['linkedin', 'https://www.linkedin.com/jobs/search/?' + qs({ keywords: s.was, location: ort })], ['eures', 'https://eures.europa.eu/']);
      return l;
    }
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
  function speichernFelder() { const s = suche(); FELDER.forEach(k => { d[k] = s[k]; }); d.filter = { tage: s.tage, unbef: s.unbef, ohneZa: s.ohneZa, ohnePav: s.ohnePav }; merke(); }
  Object.values(FILTER).forEach(id => $(id).addEventListener('change', speichernFelder));
  FELDER.forEach(k => $(k).addEventListener('input', () => { speichernFelder(); zeigePortale(); }));

  async function jobsHolen(s, seite) {
    if ((s.land || 'de') !== 'de') return jobsHolenEU(s, seite);
    const ctrl = new AbortController();
    const zeit = setTimeout(() => ctrl.abort(), 75000);   // der kostenlose Server braucht beim Aufwachen bis ~1 Minute
    try {
      const r = await fetch(SERVER + '/hub/jobs', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: ctrl.signal,
        body: JSON.stringify({ was: s.was, wo: s.wo, umkreis: s.umkreis, angebotsart: ANGEBOT[s.art], arbeitszeit: azeit(s), seite: seite || 1,
          tage: s.tage || '', befristung: s.unbef ? '2' : '', ohneZeitarbeit: !!s.ohneZa, ohneVermittler: !!s.ohnePav })
      });
      let j = {};
      try { j = await r.json(); } catch (e) { j = {}; }
      if (!r.ok || !j.ok) throw new Error(j.error || ('HTTP ' + r.status));
      return j;
    } finally { clearTimeout(zeit); }
  }

  // ---------- Europa (EURES) ----------
  const EU = ['at', 'be', 'bg', 'hr', 'cy', 'cz', 'dk', 'ee', 'fi', 'fr', 'gr', 'hu', 'ie', 'it', 'lv', 'lt', 'lu', 'mt', 'nl', 'pl', 'pt', 'ro', 'sk', 'si', 'es', 'se', 'is', 'li', 'no', 'ch'];
  // Sprachen, in denen Stellenanzeigen im Land meist geschrieben sind (für die Übersetzung des Suchworts)
  const LANDSPRACHE = { at: [], li: [], be: ['Niederländisch', 'Französisch'], bg: ['Bulgarisch'], hr: ['Kroatisch'], cy: ['Griechisch', 'Englisch'], cz: ['Tschechisch'],
    dk: ['Dänisch'], ee: ['Estnisch'], fi: ['Finnisch'], fr: ['Französisch'], gr: ['Griechisch'], hu: ['Ungarisch'], ie: ['Englisch'], it: ['Italienisch'],
    lv: ['Lettisch'], lt: ['Litauisch'], lu: ['Französisch'], mt: ['Englisch'], nl: ['Niederländisch'], pl: ['Polnisch'], pt: ['Portugiesisch'], ro: ['Rumänisch'],
    sk: ['Slowakisch'], si: ['Slowenisch'], es: ['Spanisch'], se: ['Schwedisch'], is: ['Isländisch'], no: ['Norwegisch'], ch: ['Französisch', 'Italienisch'] };
  const INDEED = ['at', 'be', 'ch', 'cz', 'dk', 'es', 'fi', 'fr', 'gr', 'hu', 'ie', 'it', 'lu', 'nl', 'no', 'pl', 'pt', 'ro', 'se'];
  const landName = (cc) => { try { return new Intl.DisplayNames([window.SD_LANG || 'de', 'de'], { type: 'region' }).of(cc.toUpperCase()); } catch (e) { return cc.toUpperCase(); } };
  function zeigeLaender() {
    const wert = $('land').value || d.land || 'de';
    const andere = EU.map(cc => [cc, landName(cc)]).sort((a, b) => a[1].localeCompare(b[1]));
    $('land').innerHTML = '<option value="de">' + esc(landName('de')) + ' – ' + esc(t('land_ba')) + '</option>' +
      '<optgroup label="' + esc(t('land_eu')) + '">' + andere.map(([cc, n]) => '<option value="' + cc + '">' + esc(n) + '</option>').join('') + '</optgroup>';
    $('land').value = wert;
    landAnsicht();
  }
  function landAnsicht() {
    const eu = ($('land').value || 'de') !== 'de';
    $('filterBox').hidden = eu;
    $('euHinweis').hidden = !eu;
    $('euHinweis').textContent = eu ? t('eu_info') : '';
  }
  $('land').addEventListener('change', () => { landAnsicht(); speichernFelder(); zeigePortale(); });
  const uebersetzungen = {};
  async function suchwoerter(s) {
    const sprachen = LANDSPRACHE[s.land] || [];
    if (!s.was || !sprachen.length) return [s.was];
    const k = s.land + '|' + s.was.toLowerCase();
    if (uebersetzungen[k]) return uebersetzungen[k];
    let liste2 = [s.was];
    try {
      const j = await post('/hub/ki', { system: 'Du übersetzt Berufsbezeichnungen für eine Jobsuche. Antworte nur mit den Begriffen.',
        prompt: 'Übersetze die Berufsbezeichnung bzw. das Suchwort „' + s.was + '“ in diese Sprache(n): ' + sprachen.join(', ') +
          '. Nimm die übliche Bezeichnung aus Stellenanzeigen in ' + landName(s.land) + '. Antworte NUR mit den Begriffen, getrennt durch |, ohne Erklärung, höchstens ' + sprachen.length + ' Begriffe.' });
      const neu = String(j.text || '').split(/[|\n]/).map(x => x.replace(/^[\s\-*•"„“]+|[\s"“”.]+$/g, '')).filter(x => x && x.length <= 60 && !/[:]/.test(x)).slice(0, 2);
      liste2 = [s.was].concat(neu.filter(x => x.toLowerCase() !== s.was.toLowerCase()));
    } catch (e) { /* ohne Übersetzung weitersuchen */ }
    return (uebersetzungen[k] = liste2);
  }
  async function jobsHolenEU(s, seite) {
    const begriffe = await suchwoerter(s);
    if (begriffe.length > 1) $('euHinweis').textContent = t('eu_begriffe', { b: begriffe.join(' · ') });
    const lang = ['de', 'en', 'uk', 'ar'].includes(window.SD_LANG) ? window.SD_LANG : 'de';
    return post('/hub/jobs-eu', { land: s.land, begriffe, seite: seite || 1, sprache: lang });
  }

  let liste = [], seite = 1, gesamt = 0, aktuelleSuche = null, laeuft = false;
  function stelleHtml(j, neu) {
    const eu = j.quelle === 'eures';
    const link = eu ? j.link : detailUrl(j.refnr);
    const ortText = j.quelle === 'eures' ? (j.ort || '').split(',').filter(Boolean).map(c => landName(c.trim().toLowerCase())).join(', ') : j.ort;
    const meta = [j.firma, [ortText, j.entfernung && j.entfernung !== '0' ? j.entfernung + ' km' : ''].filter(Boolean).join(' · '),
      j.datum ? t('r_seit', { d: SD.fmt(j.datum) }) : ''].filter(Boolean);
    const geh = gehaltText(j.gehalt);
    const marken = [geh ? '<span class="marke' + (geh.unter ? ' warn' : '') + '" lang="' + esc(window.SD_LANG || 'de') + '">💶 ' + esc(geh.text) + (geh.unter ? ' · ⚠️ ' + esc(t('geh_unter')) : '') + '</span>' : '',
      j.homeoffice ? '<span class="marke" lang="' + esc(window.SD_LANG || 'de') + '">🏠 ' + esc(t('ho_badge')) + '</span>' : ''].filter(Boolean).join(' ');
    return '<div class="stelle' + (neu ? ' neu' : '') + '" lang="de"><h3>' + (neu ? '🆕 ' : '') + esc(j.titel || j.beruf) + '</h3>' +
      '<div class="meta">' + esc(meta.join(' · ')) + '</div>' +
      (marken ? '<div class="reihe">' + marken + '</div>' : '') +
      '<div class="knoepfe">' +
      '<a class="btn klein prim" target="_blank" rel="noopener" href="' + esc(link) + '">' + esc(t('r_oeffnen')) + ' ↗</a>' +
      '<button type="button" class="btn klein" data-merk="' + esc(j.refnr) + '">' + esc(t('r_merken')) + '</button>' +
      '<button type="button" class="btn klein" data-bew="' + esc(j.refnr) + '">' + esc(t('r_bewerben')) + '</button>' +
      (eu ? '' : '<button type="button" class="btn klein" data-erkl="' + esc(j.refnr) + '">' + esc(t('r_erklaeren')) + '</button>' +
      '<button type="button" class="btn klein" data-pass="' + esc(j.refnr) + '">' + esc(t('r_passt')) + '</button>') +
      (j.ort && !eu ? '<a class="btn klein" target="_blank" rel="noopener" href="' + esc(wegUrl(j)) + '">' + esc(t('r_weg')) + ' ↗</a>' : '') +
      '</div><div class="ki-box" data-box="' + esc(j.refnr) + '" hidden></div></div>';
  }
  // Gehalt nur anzeigen, wenn die Anzeige es nennt; Hinweis bei Stundenlohn unter dem Mindestlohn (13,90 € seit 2026)
  const MINDESTLOHN = 13.90;
  function gehaltText(g) {
    if (!g || !g.art) return null;
    const einheit = { STUNDENLOHN: 'geh_std', MONATSGEHALT: 'geh_monat', JAHRESGEHALT: 'geh_jahr' }[g.art];
    if (!einheit) return null;
    const f = (x) => x.toLocaleString('de-DE', { minimumFractionDigits: x % 1 ? 2 : 0, maximumFractionDigits: 2 }) + ' €';
    const von = g.fest || g.von, bis = g.fest ? null : g.bis;
    if (!von && !bis) return null;
    const betrag = von && bis && bis !== von ? f(von) + ' – ' + f(bis) : f(von || bis);
    // Azubis und Pflichtpraktika fallen nicht unter den Mindestlohn – dort keinen Hinweis zeigen
    const niedrig = g.art === 'STUNDENLOHN' && (von || bis) < MINDESTLOHN && !(aktuelleSuche && ['ausbildung', 'praktikum'].includes(aktuelleSuche.art));
    return { text: betrag + ' ' + t(einheit), unter: niedrig };
  }
  function zeigeListe(neueRefs) {
    $('ergebnis').innerHTML = liste.map(j => stelleHtml(j, neueRefs && neueRefs.has(j.refnr))).join('');
    $('karteBtn').hidden = !liste.some(j => j.lat != null && j.lon != null);
    if ($('karteBtn').hidden) $('karte').hidden = true;
    else if (!$('karte').hidden) karteZeichnen();
    $('mehr').hidden = !(liste.length < gesamt && liste.length < 1000);
  }
  async function suchen(mehr, neueRefs) {
    if (laeuft) return false;
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
      $('status').textContent = gesamt ? t('r_anzahl', { n: gesamt.toLocaleString('de-DE') }) : (t('r_keine') + (s.land === 'de' && s.wo ? ' ' + t('r_ausland') : ''));
      zeigeListe(neueRefs);
      gesehenMerken(s, j.stellen);
      return true;
    } catch (e) {
      $('status').textContent = t('r_fehler', { f: (e && e.name === 'AbortError') ? t('r_zeit') : ((e && e.message) || String(e)) });
      return false;
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
  const gleich = (a, b) => FELDER.concat(Object.keys(FILTER)).every(k => String(a[k] || '') === String(b[k] || ''));
  const name = (s) => [s.was || '…', s.wo, s.land && s.land !== 'de' ? landName(s.land) : t('a_' + s.art)].filter(Boolean).join(' · ');
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
    if (!s.land) $('land').value = 'de';
    landAnsicht();
    Object.keys(FILTER).forEach(k => { const el = $(FILTER[k]); if (el.type === 'checkbox') el.checked = !!s[k]; else el.value = s[k] || ''; });
    speichernFelder(); zeigePortale();
    const alt = new Set(s.gesehen || []);
    suchen(false, null).then((ok) => { if (ok) zeigeListe(new Set(liste.map(x => x.refnr).filter(r => !alt.has(r)))); });
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
    return { firma: j.firma || '–', position: j.titel || j.beruf, ort: j.quelle === 'eures' ? landName(j.ort.split(',')[0] || 'de') : j.ort, link: j.quelle === 'eures' ? j.link : detailUrl(j.refnr), notizen: j.beruf && j.beruf !== j.titel ? 'Beruf: ' + j.beruf : '' };
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
    const k = e.target.closest('[data-erkl],[data-pass],[data-vor]');
    if (k) { kiAktion(k); return; }
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

  // ---------- Weg, Karte ----------
  const wegUrl = (j) => 'https://www.google.com/maps/dir/?api=1&travelmode=transit&destination=' + encodeURIComponent([j.firma, j.ort].filter(Boolean).join(', '));
  let karte = null, ebene = null;
  function ladeCss(href) { if (!document.querySelector('link[href="' + href + '"]')) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l); } }
  function ladeSkript(src) { return new Promise((ok, f) => { if (window.L && window.L.map) return ok(); const s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = f; document.head.appendChild(s); }); }
  async function karteZeichnen() {
    ladeCss('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css');
    try { await ladeSkript('https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'); } catch (e) { $('karte').hidden = true; SD.toast(t('karte_fehler')); return; }
    if (!karte) {
      karte = L.map('karte');
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>' }).addTo(karte);
    }
    if (ebene) ebene.remove();
    const punkte = liste.filter(j => j.lat != null && j.lon != null);
    ebene = L.layerGroup(punkte.map(j => L.marker([j.lat, j.lon]).bindPopup('<b>' + esc(j.titel) + '</b><br>' + esc(j.firma) + '<br>' + esc(j.ort) +
      '<br><a target="_blank" rel="noopener" href="' + esc(detailUrl(j.refnr)) + '">' + esc(t('r_oeffnen')) + ' ↗</a>'))).addTo(karte);
    if (punkte.length) karte.fitBounds(L.latLngBounds(punkte.map(j => [j.lat, j.lon])).pad(0.2), { maxZoom: 13 });
    setTimeout(() => karte.invalidateSize(), 50);
  }
  $('karteBtn').addEventListener('click', () => { $('karte').hidden = !$('karte').hidden; if (!$('karte').hidden) karteZeichnen(); });

  // ---------- KI: Anzeige erklären / Passt das zu mir? (KI des SD-Servers, ohne Schlüssel) ----------
  const SPRACHNAME = { de: 'Deutsch', en: 'Englisch', fa: 'Dari (afghanisches Persisch)', ar: 'Arabisch', ur: 'Urdu', uk: 'Ukrainisch', ti: 'Tigrinya' };
  const BCP = { de: 'de-DE', en: 'en-GB', fa: 'fa-AF', ar: 'ar', ur: 'ur-PK', uk: 'uk-UA', ti: 'ti-ER' };
  const details = {};
  async function post(pfad, body) {
    const r = await fetch(SERVER + pfad, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    let j = {}; try { j = await r.json(); } catch (e) { j = {}; }
    if (!r.ok || !j.ok) throw new Error(j.error || ('HTTP ' + r.status));
    return j;
  }
  async function anzeigeHolen(refnr) {
    if (details[refnr]) return details[refnr];
    const j = await post('/hub/jobdetail', { refnr });
    const teile = [j.titel && 'Titel: ' + j.titel, j.firma && 'Arbeitgeber: ' + j.firma, j.arbeitszeit && 'Arbeitszeit: ' + j.arbeitszeit,
      j.befristung && 'Befristung: ' + j.befristung, j.verguetung && 'Vergütung: ' + j.verguetung, j.eintritt && 'Eintritt: ' + j.eintritt, '', j.beschreibung];
    return (details[refnr] = teile.filter(x => x != null).join('\n').slice(0, 9000));
  }
  function cvText() {
    const c = SD.lebenslauf() || {};
    const z = [['Wunschposition', c.position], ['Berufserfahrung', c.erfahrung], ['Ausbildung', c.ausbildung], ['Kenntnisse', c.kenntnisse],
      ['Sprachen', c.sprachen], ['Führerschein', c.fuehrerschein]].filter(x => x[1] && String(x[1]).trim());
    return z.map(x => x[0] + ': ' + String(x[1]).trim()).join('\n').slice(0, 3500);
  }
  async function kiAktion(k) {
    const refnr = k.dataset.erkl || k.dataset.pass || k.dataset.vor;
    const box = $('ergebnis').querySelector('[data-box="' + CSS.escape(refnr) + '"]');
    if (!box) return;
    if (k.dataset.vor) { vorlesen(box.querySelector('.ki-text').textContent, k); return; }
    const lang = SPRACHNAME[window.SD_LANG] ? window.SD_LANG : 'de';
    box.hidden = false; box.setAttribute('lang', lang); box.dir = ['fa', 'ar', 'ur'].includes(lang) ? 'rtl' : 'ltr';
    box.innerHTML = '<p class="info">' + esc(t('ki_laedt')) + '</p>';
    try {
      let cv = '';
      if (k.dataset.pass) {
        cv = cvText();
        if (!cv) { box.innerHTML = '<p class="hinweis">' + esc(t('ki_kein_cv')) + '</p><a class="btn klein" href="../Lebenslauf_app.html">' + esc(t('w_cv')) + '</a>'; return; }
      }
      const anzeige = await anzeigeHolen(refnr);
      const sprache = SPRACHNAME[lang];
      const regeln = 'Erfinde nichts. Was nicht in der Anzeige steht, nennst du nicht oder sagst ehrlich, dass es nicht drinsteht. Kurze, einfache Sätze. Kein Markdown außer Spiegelstrichen. Antworte nur auf ' + sprache + '.';
      const prompt = k.dataset.erkl
        ? 'Erkläre diese deutsche Stellenanzeige einfach und verständlich auf ' + sprache + ' (höchstens 180 Wörter), mit diesen Teilen:\n1. Was ist die Arbeit?\n2. Was musst du mitbringen?\n3. Arbeitszeit und Vertrag\n4. Bezahlung (nur wenn genannt)\n5. Wie bewirbst du dich?\nWichtige deutsche Fachwörter darfst du in Klammern dazuschreiben.\n\n=== STELLENANZEIGE ===\n' + anzeige
        : 'Vergleiche die Stellenanzeige mit dem Lebenslauf. Antworte auf ' + sprache + ' (höchstens 160 Wörter) mit genau drei Teilen:\n✅ Was passt (nur Dinge, die wirklich im Lebenslauf stehen)\n⚠️ Was fehlt oder unklar ist\n💡 Ein ehrlicher Tipp für die Bewerbung\nBehaupte keine Kenntnisse, die nicht im Lebenslauf stehen.\n\n=== LEBENSLAUF ===\n' + cv + '\n\n=== STELLENANZEIGE ===\n' + anzeige;
      const j = await post('/hub/ki', { prompt, system: regeln });
      box.innerHTML = '<div class="ki-text" style="white-space:pre-wrap;font-size:.9rem;line-height:1.5;border-inline-start:3px solid var(--accent);padding-inline-start:10px"></div>' +
        '<div class="knoepfe" style="margin-top:6px"><button type="button" class="btn klein" data-vor="' + esc(refnr) + '">' + esc(t('ki_vorlesen')) + '</button></div>' +
        '<p class="quelle">' + esc(t('ki_hinweis')) + (k.dataset.pass ? ' ' + esc(t('ki_daten')) : '') + '</p>';
      box.querySelector('.ki-text').textContent = String(j.text || '').replace(/\*\*/g, '');
    } catch (e) {
      box.innerHTML = '<p class="hinweis">' + esc(t('ki_fehler', { f: (e && e.message) || String(e) })) + '</p>';
    }
  }
  function vorlesen(text, knopf) {
    const ss = window.speechSynthesis;
    if (!ss) { SD.toast(t('vor_fehlt')); return; }
    if (ss.speaking) { ss.cancel(); return; }
    const lang = BCP[window.SD_LANG] || 'de-DE';
    const stimme = ss.getVoices().find(v => v.lang && v.lang.toLowerCase().startsWith(lang.slice(0, 2)));
    if (!stimme) { SD.toast(t('vor_keine_stimme')); return; }
    const u = new SpeechSynthesisUtterance(text); u.voice = stimme; u.lang = stimme.lang; u.rate = 0.95;
    ss.speak(u);
  }

  // ---------- Arbeitserlaubnis ----------
  function zeigeErlaubnis() {
    const v = $('erDoc').value;
    $('erText').hidden = !v;
    $('erText').textContent = v ? t('er_t_' + v) : '';
  }
  $('erDoc').addEventListener('change', () => { d.erDoc = $('erDoc').value; merke(); zeigeErlaubnis(); });
  if (d.erDoc) $('erDoc').value = d.erDoc;

  // ---------- Lohn ----------
  function zeigeLohn() {
    const std = Math.max(0, Number(String($('lStd').value).replace(',', '.')) || 0), euro = Math.max(0, Number(String($('lEuro').value).replace(',', '.')) || 0);
    const monat = std * euro * 4.33;
    $('lErg').textContent = monat ? monat.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }) : '–';
    const h = euro && euro < 13.9 ? t('lohn_unter') : (monat && monat <= 603 ? t('lohn_minijob') : '');
    $('lHinweis').hidden = !h; $('lHinweis').textContent = h;
  }
  ['lStd', 'lEuro'].forEach(id => $(id).addEventListener('input', zeigeLohn));

  // ---------- Hilfe vor Ort (Kartensuche) ----------
  const HILFE = [['h_aa', 'Agentur für Arbeit'], ['h_jc', 'Jobcenter'], ['h_mbe', 'Migrationsberatung für erwachsene Zuwanderer'], ['h_jmd', 'Jugendmigrationsdienst']];
  function zeigeHilfe() {
    const ort = $('hOrt').value.trim() || $('wo').value.trim();
    $('hilfe').innerHTML = HILFE.map(([k, q]) => '<a class="portal" target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q + (ort ? ' ' + ort : '')) + '"><b>' + esc(t(k)) + ' ↗</b><small>' + esc(t(k + '_t')) + '</small></a>').join('');
  }
  $('hOrt').addEventListener('input', zeigeHilfe);

  // ---------- Start ----------
  function alles() { spracheZeigen(); zeigeLaender(); zeigeFaehig(); zeigePortale(); zeigeSuchen(); zeigeGemerkt(); zeigeErlaubnis(); zeigeLohn(); zeigeHilfe(); if (liste.length) zeigeListe(); }
  document.addEventListener('sd-lang-changed', alles);
  alles();
  if (d.suchen.length) neueStellenPruefen();
})();
