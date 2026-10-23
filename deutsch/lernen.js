/* SD Hub – Deutsch lernen (Alphabetisierung bis B1)
   Fortschritt + Profile: localStorage „sdLearn“ (mit SD-Konto auch geräteübergreifend über sd-sync.js).
   Kursbuch und Training: feste Daten (daten/*.json). KI-Lehrer, Gespräch, Korrektur: über sdKi (lern-api.js).
   Stimme: Sprachausgabe des Browsers. Aussprache: Aufnahme -> Gemini (mit Schlüssel) oder Spracherkennung des Browsers. */
(function () {
  'use strict';
  // Alle /learn/…-Abfragen beantwortet lern-api.js im Browser (kein Server nötig)
  const fetch = (u, o) => window.SDLernAPI.fetch(u, o);

  function escapeHtml(t) {
    return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  // ---------- Ton-Helfer (früher im Hauptprogramm) ----------
  let _ctx = null;
  function _jAudioCtx() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!_ctx) { try { _ctx = new AC(); } catch (e) { return null; } }
    if (_ctx.state !== 'running') { try { _ctx.resume(); } catch (e) {} }
    return _ctx;
  }
  let _unlocked = false;
  // iPhone/iPad: Die Sprachausgabe muss einmal durch ein Antippen freigeschaltet werden
  // Natürliche Stimme vom SD-Server kommt als Audio-Datei (klingt am iPhone auch im Lautlos-Modus)
  let _tts = null, _serverStimmeAus = 0, _serverStimmeZeit = 0;
  function _ttsEl() { if (!_tts) { _tts = new Audio(); _tts.preload = 'auto'; _tts.setAttribute('playsinline', ''); } return _tts; }
  function _silentWav() {
    const n = 800, buf = new ArrayBuffer(44 + n), v = new DataView(buf);
    const w = (o, t) => { for (let i = 0; i < t.length; i++) v.setUint8(o + i, t.charCodeAt(i)); };
    w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true);
    v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, 8000, true); v.setUint32(28, 8000, true);
    v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, 'data'); v.setUint32(40, n, true);
    for (let i = 0; i < n; i++) v.setUint8(44 + i, 128);
    let bin = ''; new Uint8Array(buf).forEach(b => bin += String.fromCharCode(b));
    return 'data:audio/wav;base64,' + btoa(bin);
  }
  function unlockAudio(ev) {
    if (_unlocked) return;
    const imTipp = !!ev || (navigator.userActivation ? navigator.userActivation.isActive : false);
    if (!imTipp) return;
    _unlocked = true;
    try { const a = _ttsEl(); a.src = _silentWav(); const p = a.play(); if (p && p.catch) p.catch(() => { _unlocked = false; }); } catch (e) {}
    try { if ('speechSynthesis' in window) { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; u.lang = 'de-DE'; window.speechSynthesis.speak(u); } } catch (e) {}
  }
  ['touchend', 'click', 'keydown'].forEach(n => document.addEventListener(n, unlockAudio, {capture: true, passive: true}));
  const IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  // Gute deutsche Stimmen (iPhone, Android, Windows, Mac) – für den zweiten Sprecher im Hörtext
  const GUTE_STIMMEN = ['Anna', 'Markus', 'Helena', 'Yannick', 'Petra', 'Google Deutsch', 'Microsoft Katja', 'Microsoft Conrad', 'Microsoft Hedda', 'Microsoft Stefan'];
  function stimmeFuer(vi, ss) {
    if (!vi) return null;   // erster Sprecher: Standardstimme des Geräts (am zuverlässigsten)
    const de = (ss.getVoices() || []).filter(x => x.lang && x.lang.toLowerCase().startsWith('de'));
    const gut = de.filter(v => GUTE_STIMMEN.some(n => v.name.indexOf(n) === 0) && !v.default);
    return gut.length ? gut[(vi - 1) % gut.length] : null;
  }
  // Einmaliger Hinweis am iPhone: im Lautlos-Modus ist die Browser-Stimme stumm
  function tonHinweis() {
    if (!IOS) return;
    try { if (localStorage.getItem('sdLearnTonHinweis')) return; localStorage.setItem('sdLearnTonHinweis', '1'); } catch (e) { return; }
    const d = document.createElement('div');
    d.className = 'l-tonhinweis';
    d.innerHTML = '🔈 <b>Nichts zu hören?</b> Lautlos-Modus am iPhone ausschalten und Lautstärke hochdrehen – die Vorlese-Stimme ist im Lautlos-Modus stumm. <button type="button">OK</button>';
    d.querySelector('button').onclick = () => d.remove();
    document.body.appendChild(d); setTimeout(() => d.remove(), 12000);
  }
  function _jBeep(ctx) {
    try {
      const o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
      o.type = 'sine'; o.frequency.setValueAtTime(880, t); o.frequency.linearRampToValueAtTime(1320, t + 0.09);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
      o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.16);
    } catch (e) {}
  }
  function _jWavB64(chunks, inRate) {
    let len = 0; chunks.forEach(c => len += c.length);
    const data = new Float32Array(len); let o = 0; chunks.forEach(c => { data.set(c, o); o += c.length; });
    const outRate = 16000, ratio = inRate / outRate, n = Math.max(0, Math.floor(len / ratio));
    const buf = new ArrayBuffer(44 + n * 2), dv = new DataView(buf);
    const w = (p, t) => { for (let i = 0; i < t.length; i++) dv.setUint8(p + i, t.charCodeAt(i)); };
    w(0, 'RIFF'); dv.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt '); dv.setUint32(16, 16, true);
    dv.setUint16(20, 1, true); dv.setUint16(22, 1, true); dv.setUint32(24, outRate, true); dv.setUint32(28, outRate * 2, true);
    dv.setUint16(32, 2, true); dv.setUint16(34, 16, true); w(36, 'data'); dv.setUint32(40, n * 2, true);
    for (let i = 0; i < n; i++) {
      const s = Math.floor(i * ratio), e = Math.min(len, Math.floor((i + 1) * ratio));
      let sum = 0, c = 0; for (let j = s; j < e; j++) { sum += data[j]; c++; }
      let v = c ? sum / c : 0; v = Math.max(-1, Math.min(1, v));
      dv.setInt16(44 + i * 2, v < 0 ? v * 0x8000 : v * 0x7FFF, true);
    }
    const bytes = new Uint8Array(buf); let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(bin);
  }
  const LS_KEY = 'sdLearn', CACHE_KEY = 'sdLearnCache';
  // Geräte-Kennung (für das Zusammenzählen von Punkten über mehrere Geräte)
  const DEV = (() => { let d = null; try { d = localStorage.getItem('sdLearnDev'); } catch (e) {}
    if (!d) { d = 'd' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); try { localStorage.setItem('sdLearnDev', d); } catch (e) {} } return d; })();
  function migrate(p) {
    if (p.xd == null) { p.xp0 = p.xp || 0; p.xd = {}; p.dd = {}; p.dd[DEV] = p.days || {}; }
    if (p._xpSeen == null) p._xpSeen = p.xp || 0;
    p.updated = p.updated || p.created || 1;
  }
  const LEVEL_IDS = ['alpha', 'A1', 'A2', 'B1'];
  // Jedes Niveau hat eine eigene Farbe und einen kurzen Namen – damit man immer sieht, wo man ist
  const LV = {
    alpha: {kurz: 'Alpha', name: 'Alphabetisierung', stufe: 'Lesen und Schreiben lernen', was: 'Buchstaben, Laute, Silben und die ersten Wörter lesen und schreiben.'},
    A1: {kurz: 'A1', name: 'A1', stufe: 'Anfänger', was: 'Sich vorstellen, Uhrzeit, Familie, Einkaufen, Wohnen, Mein Tag, Arzt, Stadt, Arbeit, Freizeit, Kleidung und Wetter, Reparaturen, Kinder und Schule, Ämter, Feste – einfache Sätze im Präsens.'},
    A2: {kurz: 'A2', name: 'A2', stufe: 'Grundstufe', was: 'Ämter, Wohnungssuche, Arbeit suchen, Gesundheit, Kita und Schule, Reisen, Feste, Reklamieren, Sport, Handy und Internet, Bank, Lebensstationen, Ankommen, Essen und Trinken, Wochenende – Perfekt, weil, dass, Dativ.'},
    B1: {kurz: 'B1', name: 'B1', stufe: 'Mittelstufe', was: 'Bewerbung, Rechte und Pflichten, Beschwerden, Meinung sagen, Zusammenleben, Umwelt, Briefe, Medien, Datenschutz, Werbung, Heimat, Glück, Gesundheit, Sprachen, Dienstleistungen, Kollegen, Politik und Geschichte – Prüfung DTZ.'},
  };
  const lvInfo = id => LV[id] || LV.A1;
  const lvChip = (id, extra) => '<span class="l-lvchip lvc-' + esc(id) + '">' + esc(lvInfo(id).kurz) + (extra ? ' · ' + extra : '') + '</span>';
  const L = { view: 'profiles', lesson: null, idx: -1, results: [], chat: [], chatTurns: 0, rec: null, cur: null, place: null, busy: false };

  // ---------- Speicher ----------
  function load() {
    try {
      const d = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
      if (d && d.profiles) { Object.values(d.profiles).forEach(migrate); d.deleted = d.deleted || {}; return d; }
    } catch (e) {}
    return { profiles: {}, active: null, deleted: {} };
  }
  let DB = load();
  function save() {
    // neue Punkte dem heutigen Tag gutschreiben (für Tagesziel und Lern-Serie)
    const p = DB.profiles[DB.active];
    if (p) {
      const diff = (p.xp || 0) - (p._xpSeen == null ? (p.xp || 0) : p._xpSeen);
      if (diff > 0) { const d = new Date(), k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        migrate(p); p.xd[DEV] = (p.xd[DEV] || 0) + diff; p.dd[DEV] = p.dd[DEV] || {}; p.dd[DEV][k] = (p.dd[DEV][k] || 0) + diff; }
      p._xpSeen = p.xp || 0;
      p.updated = Date.now();
    }
    SYNC.rev++;
    try { localStorage.setItem(LS_KEY, JSON.stringify(DB)); } catch (e) {}
    schedulePush();
  }
  // Tagespunkte aller Geräte zusammen
  function daysOf(p) { const out = {}; Object.values((p && p.dd) || {}).forEach(m => Object.entries(m || {}).forEach(([k, v]) => { out[k] = (out[k] || 0) + v; })); return out; }

  // ---------- Abgleich mit dem Server (Handy <-> PC) ----------
  const SYNC = {rev: 0, timer: null, busy: false, info: null, ok: null, at: 0};
  function schedulePush() { /* im SD Hub: sd-sync.js */ }
  function applyRemote(data) {
    const remote = (data && data.profiles) || {};
    Object.keys(DB.profiles).forEach(id => { if (!remote[id]) delete DB.profiles[id]; });
    Object.entries(remote).forEach(([id, rp]) => {
      const lp = DB.profiles[id];
      if (lp) { Object.keys(lp).forEach(k => { if (!(k in rp)) delete lp[k]; }); Object.assign(lp, rp); } else DB.profiles[id] = rp;
      const p = DB.profiles[id]; migrate(p); p._xpSeen = p.xp || 0;
    });
    DB.deleted = (data && data.deleted) || DB.deleted || {};
    if (DB.active && !DB.profiles[DB.active]) DB.active = null;
    try { localStorage.setItem(LS_KEY, JSON.stringify(DB)); } catch (e) {}
  }
  async function syncNow(keepalive) {
    return;   // im SD Hub speichert sd-sync.js den Lernstand im Konto (wenn angemeldet)
    // eslint-disable-next-line no-unreachable
    if (SYNC.busy) { schedulePush(); return; }
    SYNC.busy = true; clearTimeout(SYNC.timer);
    const sentRev = SYNC.rev;
    try {
      const r = await fetch('/learn/sync', {method: 'POST', headers: {'Content-Type': 'application/json'}, keepalive: !!keepalive,
        body: JSON.stringify({data: {profiles: DB.profiles, deleted: DB.deleted || {}}})});
      const d = await r.json();
      SYNC.info = {store: d.store, durable: d.durable};
      if (!d.ok) throw new Error(d.error || 'Fehler');
      if (SYNC.rev === sentRev) {
        const had = !!prof(); applyRemote(d.data);
        // Profil wurde auf einem anderen Gerät gelöscht -> zur Profilauswahl
        if (had && !prof() && document.body.classList.contains('learn-open')) showProfiles();
      } else schedulePush();   // in der Zwischenzeit geändert -> nochmal senden
      SYNC.ok = true; SYNC.at = Date.now();
    } catch (e) { SYNC.ok = false; }
    SYNC.busy = false;
    syncBadge();
  }
  function syncText() {
    return window.SDSync ? '💾 Lernstand auf diesem Gerät gespeichert. Mit SD-Konto (oben anmelden) auch auf deinen anderen Geräten.' : '💾 Lernstand auf diesem Gerät gespeichert.';
    // eslint-disable-next-line no-unreachable
    if (SYNC.ok === null) return '';
    if (!SYNC.ok) return '⚠️ Gerade keine Verbindung – der Lernstand ist auf diesem Gerät gespeichert und wird später abgeglichen.';
    if (SYNC.info && SYNC.info.durable) return '☁️ Lernstand gesichert – auf Handy und PC gleich.';
    return '⚠️ Abgleich zwischen Geräten aktiv, aber der Server speichert nur vorübergehend (Gist-Schlüssel fehlt). Auf diesem Gerät bleibt alles gespeichert.';
  }
  function syncBadge() { const e = document.getElementById('lSync'); if (e) e.textContent = syncText(); }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && SYNC.timer) syncNow(true); });
  function cacheGet(k) { try { return (JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'))[k] || null; } catch (e) { return null; } }
  function cachePut(k, v) {
    try {
      const c = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); c[k] = v;
      const keys = Object.keys(c); if (keys.length > 40) delete c[keys[0]];
      localStorage.setItem(CACHE_KEY, JSON.stringify(c));
    } catch (e) {}
  }
  function cacheDel(k) { try { const c = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); delete c[k]; localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch (e) {} }
  const prof = () => DB.profiles[DB.active] || null;
  const $ = id => document.getElementById(id);
  const esc = s => escapeHtml(s == null ? '' : String(s));

  // ---------- kleine Texte in der Erklaersprache ----------
  const TX = {
    fa: { cont: 'ادامه', listen: 'گوش کنید', speak: 'صحبت کنید', check: 'بررسی', next: 'بعدی', again: 'دوباره', trans: 'ترجمه',
          right: 'درست است!', almost: 'تقریباً درست', wrong: 'متأسفانه غلط', chat: 'تمرین گفتگو', weak: 'کلمات دشوار',
          place: 'آزمون تعیین سطح', newp: 'شخص جدید', name: 'نام', lesson: 'درس', unit: 'واحد', done: 'تمام', start: 'شروع',
          book: 'واحد من', dict: 'فرهنگ لغت', gram: 'دستور زبان', words: 'لغات', phrases: 'عبارات مهم', read: 'خواندن', hear: 'شنیدن',
          write: 'نوشتن', cards: 'کارت‌های لغت', print: 'چاپ', know: 'بلدم', practice: 'باز هم تمرین', flip: 'برگرداندن',
          correct: 'اصلاح کن', model: 'جواب نمونه', play: 'پخش', showtext: 'نمایش متن', exercises: 'تمرین‌ها با معلم', search: 'جستجو',
          wotd: 'کلمهٔ روز', goal: 'هدف روزانه', review: 'تکرار روزانه', articles: 'حرف تعریف', order: 'ساختن جمله', dictation: 'املا', train: 'تمرین', pics: 'تمرین با عکس', tricks: 'ترفندهای حرف تعریف', trick: 'ترفند یادآوری', videos: 'ویدیو در یوتیوب',
          wquiz: 'آزمون لغت', plural: 'جمع', hquiz: 'تمرین شنیداری', mix: 'آزمون سطح', level: 'سطح', levels: 'انتخاب سطح', way: 'راه شما',
          lwords: 'لغات این درس', where: 'از کجا می‌خواهید شروع کنید؟', prep: 'معلم درس را آماده می‌کند …', expl: 'زبان توضیح' },
    en: { cont: 'Continue', listen: 'Listen', speak: 'Speak', check: 'Check', next: 'Next', again: 'Again', trans: 'Translation',
          right: 'Correct!', almost: 'Almost', wrong: 'Not quite', chat: 'Practice conversation', weak: 'Difficult words',
          place: 'Placement test', newp: 'New person', name: 'Name', lesson: 'Lesson', unit: 'Unit', done: 'Done', start: 'Start',
          book: 'My unit', dict: 'Dictionary', gram: 'Grammar', words: 'Vocabulary', phrases: 'Useful phrases', read: 'Reading', hear: 'Listening',
          write: 'Writing', cards: 'Flashcards', print: 'Print', know: 'I know it', practice: 'Practise again', flip: 'Turn over',
          correct: 'Correct it', model: 'Model answer', play: 'Play', showtext: 'Show text', exercises: 'Exercises with the teacher', search: 'Search',
          wotd: 'Word of the day', goal: 'Daily goal', review: 'Daily review', articles: 'Articles', order: 'Sentence building', dictation: 'Dictation', train: 'Training', pics: 'Picture quiz', tricks: 'Article tricks', trick: 'Memory trick', videos: 'Videos on YouTube',
          wquiz: 'Word quiz', plural: 'Plural', hquiz: 'Listening quiz', mix: 'Level check', level: 'Level', levels: 'Choose level', way: 'Your path',
          lwords: 'Words in this lesson', where: 'Where do you want to start?', prep: 'The teacher is preparing the lesson …', expl: 'Explanation language' },
    ur: { cont: 'جاری رکھیں', listen: 'سنیں', speak: 'بولیں', check: 'جانچیں', next: 'اگلا', again: 'دوبارہ', trans: 'ترجمہ',
          right: 'درست!', almost: 'تقریباً درست', wrong: 'افسوس، غلط', chat: 'گفتگو کی مشق', weak: 'مشکل الفاظ',
          place: 'سطح جانچنے کا ٹیسٹ', newp: 'نیا شخص', name: 'نام', lesson: 'سبق', unit: 'یونٹ', done: 'مکمل', start: 'شروع',
          book: 'میرا یونٹ', dict: 'لغت', gram: 'قواعد', words: 'الفاظ', phrases: 'اہم جملے', read: 'پڑھنا', hear: 'سننا',
          write: 'لکھنا', cards: 'یادداشتی کارڈ', print: 'پرنٹ', know: 'مجھے آتا ہے', practice: 'پھر سے مشق', flip: 'پلٹیں',
          correct: 'درست کریں', model: 'نمونہ جواب', play: 'چلائیں', showtext: 'متن دکھائیں', exercises: 'استاد کے ساتھ مشقیں', search: 'تلاش',
          wotd: 'آج کا لفظ', goal: 'روزانہ کا ہدف', review: 'روزانہ دہرائی', articles: 'حرفِ تعریف', order: 'جملہ بنانا', dictation: 'املا', train: 'مشق', pics: 'تصویری کوئز', tricks: 'حرفِ تعریف کے گُر', trick: 'یاد رکھنے کا گُر', videos: 'یوٹیوب پر ویڈیوز',
          wquiz: 'الفاظ کا کوئز', plural: 'جمع', hquiz: 'سننے کا کوئز', mix: 'سطح کا ٹیسٹ', level: 'سطح', levels: 'سطح منتخب کریں', way: 'آپ کا راستہ',
          lwords: 'اس سبق کے الفاظ', where: 'آپ کہاں سے شروع کرنا چاہتے ہیں؟', prep: 'استاد سبق تیار کر رہا ہے …', expl: 'وضاحت کی زبان' },
    ti: { cont: 'ቀጽል', listen: 'ስማዕ', speak: 'ተዛረብ', check: 'ፈትሽ', next: 'ዝቕጽል', again: 'ደጊም', trans: 'ትርጉም',
          right: 'ቅኑዕ!', almost: 'ዳርጋ ቅኑዕ', wrong: 'ጌጋ', chat: 'ልምምድ ዝርርብ', weak: 'ከቢድ ቃላት',
          place: 'ፈተና ደረጃ', newp: 'ሓድሽ ሰብ', name: 'ስም', lesson: 'ትምህርቲ', unit: 'ክፍሊ', done: 'ተወዲኡ', start: 'ጀምር',
          book: 'ክፍለይ', dict: 'መዝገበ ቃላት', gram: 'ሰዋስው', words: 'ቃላት', phrases: 'ኣገደስቲ ሓረጋት', read: 'ምንባብ', hear: 'ምስማዕ',
          write: 'ምጽሓፍ', cards: 'ካርድታት ቃላት', print: 'ሕተም', know: 'እፈልጦ እየ', practice: 'ደጊም ተለማመድ', flip: 'ገልብጥ',
          correct: 'ኣርም', model: 'ኣብነታዊ መልሲ', play: 'ኣጻውት', showtext: 'ጽሑፍ ኣርኢ', exercises: 'ልምምድ ምስ መምህር', search: 'ድለ',
          wotd: 'ቃል ናይ ሎሚ', goal: 'መዓልታዊ ዕላማ', review: 'መዓልታዊ ድግግም', articles: 'መስተዋድድ', order: 'ሓረግ ምህናጽ', dictation: 'ጽሑፍ ብምስማዕ', train: 'ልምምድ', pics: 'ፈተና ብስእሊ', tricks: 'ምኽርታት መስተዋድድ', trick: 'መዘኻኸሪ', videos: 'ቪድዮታት ኣብ ዩቱብ',
          wquiz: 'ፈተና ቃላት', plural: 'ብዙሕ', hquiz: 'ፈተና ምስማዕ', mix: 'ፈተና ደረጃ', level: 'ደረጃ', levels: 'ደረጃ ምረጽ', way: 'መገድኻ',
          lwords: 'ቃላት ናይዚ ትምህርቲ', where: 'ካበይ ክትጅምር ትደሊ?', prep: 'መምህር ነቲ ትምህርቲ የዳሉ ኣሎ …', expl: 'ቋንቋ መግለጺ' },
  };
  // Deutsche/lateinische Woerter in Dari-Text als eigene Laufrichtung isolieren (sonst springt die Reihenfolge)
  const LAT = /[\u200e\-]*[A-Za-zÄÖÜäöüß](?:[A-Za-zÄÖÜäöüß0-9\-\/+=.’'\u200e →←–,]*[A-Za-zÄÖÜäöüß0-9!?])?/g;
  // Erklärsprachen: Bedeutungen, Grammatik-Erklärungen und Hilfetexte kommen direkt in dieser Sprache
  const SPRACHEN = {fa: {name: 'دری / فارسی', rtl: true}, en: {name: 'English', rtl: false}, ur: {name: 'اردو', rtl: true},
    ti: {name: 'ትግርኛ (Tigrinya)', rtl: false, neu: true}};
  const spr = () => { const p = prof(); return (p && SPRACHEN[p.lang]) ? p.lang : 'en'; };
  const rtl = () => SPRACHEN[spr()].rtl;
  const l1h = txt => { const e = esc(txt); return rtl() ? e.replace(LAT, m => '<bdi dir="ltr">' + m + '</bdi>') : e; };
  const tx = k => (TX[spr()] || TX.en)[k] || '';
  const l1 = (txt, cls) => { if (!txt) return ''; const fa = rtl();
    return '<div class="l-l1 ' + (cls || '') + '"' + l1Attr() + '>' + l1h(txt) + '</div>'; };
  const bi = (de, k) => esc(de) + (tx(k) ? ' <span class="l-sub">· <bdi' + (rtl() ? ' dir="rtl" lang="' + spr() + '"' : '') + '>' + esc(tx(k)) + '</bdi></span>' : '');

  // ---------- Stimme ----------
  let _spFin = null;
  function lStopSpeak() {
    try { if (_tts) { _tts.onended = _tts.onerror = _tts.onplaying = null; _tts.pause(); } } catch (e) {}
    try { const ss = window.speechSynthesis; if (ss && (ss.speaking || ss.pending)) ss.cancel(); } catch (e) {}
    if (_spFin) { const f = _spFin; _spFin = null; f(); }
  }
  function lSpeak(text, slow, voice) {
    return new Promise(res => {
      lStopSpeak();
      let done = false, wd = null;
      const fin = () => { if (done) return; done = true; clearTimeout(wd); if (_spFin === fin) _spFin = null; res(); };
      _spFin = fin;
      const t = String(text || '').replace(/[*_#`]/g, '').slice(0, 500);
      if (!t.trim()) { fin(); return; }
      const est = 4000 + t.length * 110;
      const fb = () => {
        if (done) return; clearTimeout(wd);
        try {
          const ss = window.speechSynthesis;
          const u = new SpeechSynthesisUtterance(t); u.lang = 'de-DE'; u.rate = slow ? 0.75 : 0.95;
          const vi = Math.max(0, VOICES.indexOf(voice || VOICES[0]));
          const v = stimmeFuer(vi, ss);
          if (v) u.voice = v; else if (vi) u.pitch = [1, 0.75, 1.25, 0.9][vi % 4];
          u.onend = fin; u.onerror = fin;
          // nach cancel() verschluckt Safari ein sofortiges speak() manchmal – darum kurz warten
          const los = () => { if (done) return; try { if (ss.paused) ss.resume(); } catch (_) {} ss.speak(u); wd = setTimeout(fin, est); };
          if (ss.speaking || ss.pending) { ss.cancel(); setTimeout(los, 80); } else los();
          tonHinweis();   // nur wenn die Geräte-Stimme benutzt wird
        } catch (e) { fin(); }
      };
      // 1) natürliche Stimme vom SD-Server, 2) sonst Stimme des Geräts
      if (!window.SDLernAPI || (_serverStimmeAus >= 2 && Date.now() - _serverStimmeZeit < 120000)) { fb(); return; }   // nach 2 Fehlern 2 Minuten Geräte-Stimme
      try {
        const a = _ttsEl();
        const fehler = () => { _serverStimmeAus++; _serverStimmeZeit = Date.now(); fb(); };
        a.onended = fin; a.onerror = fehler;
        a.onplaying = () => { _serverStimmeAus = 0; clearTimeout(wd); wd = setTimeout(fin, (isFinite(a.duration) && a.duration > 0) ? a.duration * 1000 + 1500 : est); };
        wd = setTimeout(fehler, 9000);
        a.src = window.SDLernAPI.SERVER + '/hub/tts?text=' + encodeURIComponent(t) + '&voice=' + encodeURIComponent(voice || 'de-DE-KatjaNeural') + '&rate=' + encodeURIComponent(slow ? '-25%' : '-8%');
        const p = a.play(); if (p && p.catch) p.catch(fehler);
      } catch (e) { fb(); }
    });
  }
  const slowFor = () => { const p = prof(); return !p || p.level === 'alpha' || p.level === 'A1'; };

  // ---------- Aufnahme (wie Jarvis, aber woertlich erkannt) ----------
  async function lRecord(onState) {
    const ctx = _jAudioCtx();
    let stream;
    try { stream = await navigator.mediaDevices.getUserMedia({audio: {echoCancellation: true, noiseSuppression: true, autoGainControl: true}}); }
    catch (e) { return {error: (e && (e.name === 'NotAllowedError' || e.name === 'SecurityError')) ? 'Mikrofon ist blockiert – bitte im Browser erlauben.' : 'Das Mikrofon geht gerade nicht.'}; }
    if (!ctx || ctx.state !== 'running') { try { await Promise.race([ctx.resume(), new Promise(r => setTimeout(r, 800))]); } catch (_) {} }
    if (!ctx || ctx.state !== 'running') { stream.getTracks().forEach(t => t.stop()); return {error: 'Bitte nochmal auf 🎤 tippen.'}; }
    return await new Promise(resolve => {
      const src = ctx.createMediaStreamSource(stream), proc = ctx.createScriptProcessor(4096, 1, 1), mute = ctx.createGain();
      mute.gain.value = 0; src.connect(proc); proc.connect(mute); mute.connect(ctx.destination);
      const rate = ctx.sampleRate, fms = 4096 / rate * 1000, chunks = [], pre = [], all = [];
      let noise = 0.006, frames = 0, speech = false, loud = 0, quiet = 0, sp = 0, ended = false, peak = 0, loudMs = 0, t1, t2;
      const stop = () => {
        if (ended) return; ended = true; clearTimeout(t1); clearTimeout(t2);
        try { proc.onaudioprocess = null; proc.disconnect(); src.disconnect(); mute.disconnect(); } catch (_) {}
        stream.getTracks().forEach(t => t.stop());
        L.rec = null; onState && onState('done', 0);
        const use = speech ? chunks : ((peak > 0.02 && loudMs > 300) ? all : null);
        resolve(use && use.length ? {b64: _jWavB64(use, rate)} : {silent: true});
      };
      L.rec = {stop, speech: () => speech};
      proc.onaudioprocess = (ev) => {
        const d = ev.inputBuffer.getChannelData(0); frames++;
        let s = 0; for (let i = 0; i < d.length; i++) s += d[i] * d[i];
        const rms = Math.sqrt(s / d.length), c = new Float32Array(d);
        if (frames > 3) { all.push(c); if (all.length > 250) all.shift(); }
        peak = Math.max(peak, rms); if (rms > 0.015) loudMs += fms;
        if (!speech) noise = rms < noise ? noise * 0.6 + rms * 0.4 : Math.min(0.03, noise * 0.995 + rms * 0.005);
        const thr = Math.min(0.045, Math.max(0.011, noise * 2.5));
        onState && onState('level', rms);
        if (!speech) {
          if (frames <= 3) return;
          pre.push(c); if (pre.length > 4) pre.shift();
          loud = (rms > thr || rms > 0.04) ? loud + 1 : 0;
          if (loud >= 2) { speech = true; chunks.push(...pre); onState && onState('speech', 0); }
          return;
        }
        chunks.push(c); sp += fms;
        quiet = rms > thr * 0.8 ? 0 : quiet + fms;
        if (quiet >= 1500 || sp >= 15000) stop();
      };
      onState && onState('rec', 0);
      try { _jBeep(ctx); } catch (_) {}
      t1 = setTimeout(() => { if (!speech) stop(); }, 8000);
      t2 = setTimeout(stop, 22000);
    });
  }
  function srHear(onState) {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    return new Promise(resolve => {
      let rec, done = false, text = '';
      const ende = (r) => { if (done) return; done = true; L.rec = null; onState && onState('done', 0); resolve(r); };
      try { rec = new SR(); } catch (e) { resolve({error: 'Die Spracherkennung startet nicht.'}); return; }
      rec.lang = 'de-DE'; rec.interimResults = true; rec.continuous = false; rec.maxAlternatives = 1;
      rec.onresult = (e) => { let t = ''; for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; text = t; onState && onState('speech', 0); };
      rec.onerror = (e) => { if (e.error === 'not-allowed' || e.error === 'service-not-allowed') ende({error: 'Mikrofon ist blockiert – bitte im Browser erlauben.'}); };
      rec.onend = () => ende({text: text.trim()});
      L.rec = {stop: () => { try { rec.stop(); } catch (_) {} }, speech: () => true};
      onState && onState('rec', 0);
      try { rec.start(); } catch (e) { ende({error: 'Die Spracherkennung startet nicht.'}); return; }
      setTimeout(() => { try { rec.stop(); } catch (_) {} }, 15000);
    });
  }
  async function lHear(onState) {
    lStopSpeak();
    const hatSR = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
    if (L.nurBrowserSR && hatSR) return srHear(onState);
    const r = await lRecord(onState);
    if (r.error) return {error: r.error};
    if (r.silent) return {text: ''};
    onState && onState('stt', 0);
    try {
      const d = await (await fetch('/stt', {method: 'POST', headers: {'Content-Type': 'application/json'},
                                            body: JSON.stringify({audio: r.b64, mime: 'audio/wav', mode: 'learn'})})).json();
      if (!d.ok) {
        if (hatSR) { L.nurBrowserSR = true; return {error: (d.error || 'Spracherkennung fehlgeschlagen') + ' – tippe nochmal auf 🎤, dann nutze ich die Erkennung des Browsers.'}; }
        return {error: d.error || 'Spracherkennung fehlgeschlagen'};
      }
      return {text: (d.text || '').trim()};
    } catch (e) { return {error: 'Keine Verbindung zum Server'}; }
  }

  // ---------- Vergleichen ----------
  const norm = s => String(s || '').toLowerCase().replace(/ß/g, 'ss').replace(/[„“"'´`.,!?;:()\[\]\-–—…]/g, ' ').replace(/\s+/g, ' ').trim();
  function lev(a, b) {
    if (a === b) return 0; if (!a.length) return b.length; if (!b.length) return a.length;
    let prev = Array.from({length: b.length + 1}, (_, i) => i);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i];
      for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[b.length];
  }
  function sayScore(target, heard) {
    const toks = String(target || '').split(/\s+/).filter(t => norm(t));
    const H = norm(heard).split(' ').filter(Boolean), used = H.map(() => false);
    const marks = toks.map(tok => {
      const w = norm(tok).replace(/\s/g, ''); const tol = w.length > 6 ? 2 : (w.length > 3 ? 1 : 0);
      for (let i = 0; i < H.length; i++) { if (!used[i] && (H[i] === w || lev(H[i], w) <= tol)) { used[i] = true; return true; } }
      return false;
    });
    return {score: toks.length ? marks.filter(Boolean).length / toks.length : 0, toks, marks};
  }
  function writeCheck(answer, input) {
    const a = String(answer || '').trim(), i = String(input || '').trim();
    if (!i) return {score: 0, msg: ''};
    if (i === a || i.replace(/[.!?]$/, '') === a.replace(/[.!?]$/, '')) return {score: 1, msg: ''};
    if (norm(i) === norm(a)) return {score: 1, msg: 'Richtig – achte auf Groß- und Kleinschreibung: ' + a};
    if (norm(a).length >= 5 && lev(norm(i), norm(a)) <= 1) return {score: 0.5, msg: 'Fast richtig. Richtig ist: ' + a};
    return {score: 0, msg: 'Richtig ist: ' + a};
  }
  function addWeak(w, delta) {
    const p = prof(); if (!p || !w) return;
    p.weak = p.weak || {};
    const k = String(w).slice(0, 60);
    p.weak[k] = Math.max(0, (p.weak[k] || 0) + delta);
    if (!p.weak[k]) delete p.weak[k];
    save();
  }
  const weakList = () => { const p = prof(); return Object.entries((p && p.weak) || {}).sort((a, b) => b[1] - a[1]).map(x => x[0]); };

  // ---------- Lehrplan ----------
  async function curriculum() {
    if (L.cur) return L.cur;
    try { L.cur = await (await fetch('/learn/curriculum')).json(); } catch (e) { L.cur = null; }
    return L.cur;
  }
  const lessonsFor = lv => (lv === 'alpha' ? L.cur.lessons.alpha : L.cur.lessons.default);
  const levelObj = id => L.cur.levels.find(l => l.id === id);
  function posText(p) {
    const lv = levelObj(p.level); if (!lv) return '';
    if (p.finished) return 'B1 geschafft! 🎉';
    const ls = lessonsFor(p.level).find(x => x.id === p.lesson) || {};
    return lvInfo(p.level).kurz + ' · Einheit ' + (p.unit + 1) + ' von ' + lv.units.length + ': ' + lv.units[p.unit] + ' · Lektion ' + p.lesson + ' von 5: ' + (ls.name || '');
  }
  function progressPct(p) {
    let total = 0, done = 0;
    L.cur.levels.forEach(lv => lv.units.forEach((u, i) => { total++; if (p.done && p.done[lv.id + ':' + i + ':5']) done++; }));
    return total ? Math.round(done / total * 100) : 0;
  }
  function advance(p, passed) {
    if (p.lesson < 5) { p.lesson++; return; }
    if (!passed) return;                       // Test nicht bestanden -> Test bleibt offen
    const li = LEVEL_IDS.indexOf(p.level), lv = levelObj(p.level);
    if (p.unit + 1 < lv.units.length) { p.unit++; p.lesson = 1; return; }
    if (li + 1 < LEVEL_IDS.length) { p.level = LEVEL_IDS[li + 1]; p.unit = 0; p.lesson = 1; return; }
    p.finished = true;
  }

  // ---------- Oberflaeche ----------
  function ensureDom() {
    if ($('learn') && $('learn').dataset.wired) return;
    if ($('learn')) {
      $('learn').dataset.wired = '1';
      $('lClose').onclick = closeLearn;
      $('lBack').onclick = () => { stopAll(); if (L.view === 'home' || L.view === 'profiles') closeLearn(); else if (L.view.startsWith('book-') && L.bk) showUnit(L.bk.level, L.bk.unit); else showHome(); };
      $('lProfBtn').onclick = () => { stopAll(); showProfiles(); };
      if ($('lLvBtn')) $('lLvBtn').onclick = showLevels;
      return;
    }
    const d = document.createElement('div');
    d.id = 'learn';
    d.innerHTML = '<div class="l-top"><button type="button" class="l-btn-round" id="lBack" aria-label="Zurück">‹</button>' +
      '<span class="l-title">📚 Deutsch lernen</span><button type="button" class="l-lvbtn" id="lLvBtn" style="display:none" aria-label="Niveau wählen"></button><button type="button" class="l-prof" id="lProfBtn"></button>' +
      '<button type="button" class="l-btn-round" id="lClose" aria-label="Schließen">✕</button></div><div id="lBody" class="l-body"></div>';
    document.body.appendChild(d);
    $('lClose').onclick = closeLearn;
    $('lBack').onclick = () => { stopAll(); if (L.view === 'home' || L.view === 'profiles') closeLearn(); else if (L.view.startsWith('book-') && L.bk) showUnit(L.bk.level, L.bk.unit); else showHome(); };
    $('lProfBtn').onclick = () => { stopAll(); showProfiles(); };
    $('lLvBtn').onclick = showLevels;
  }
  function stopAll() { lStopSpeak(); if (L.rec) { try { L.rec.stop(); } catch (_) {} } }
  function body(html) { const b = $('lBody'); b.innerHTML = '<div class="l-wrap">' + html + '</div>'; b.scrollTop = 0; }
  function topbar() {
    const p = prof(); $('lProfBtn').textContent = p ? '👤 ' + p.name : ''; $('lProfBtn').style.display = p ? '' : 'none';
    const lb = $('lLvBtn');
    if (p && p.level) { $('learn').dataset.lv = p.level; if (lb) { lb.textContent = lvInfo(p.level).kurz + ' ▾'; lb.style.display = ''; lb.className = 'l-lvbtn lvc-' + p.level; } }
    else { delete $('learn').dataset.lv; if (lb) lb.style.display = 'none'; }
  }
  // Erklärsprache wechseln: Bedeutungen, Grammatik und Hilfetexte kommen dann direkt in dieser Sprache
  function showSprache() {
    stopAll(); L.view = 'sprache'; topbar();
    const p = prof();
    body('<h2 class="l-h">🌐 Erklärsprache <span class="l-sub">· ' + esc(tx('expl')) + '</span></h2>' +
      '<p class="l-note">In dieser Sprache kommen die Bedeutungen der Wörter, die Grammatik-Erklärungen, die Tipps und die Hilfe vom KI-Lehrer. Dein Lernstand bleibt gleich.</p>' +
      '<div class="l-list">' + Object.keys(SPRACHEN).map(k => '<button type="button" class="l-unit' + (k === p.lang ? ' cur' : '') + '" data-spr="' + k + '"><span>' + (k === p.lang ? '✔ ' : '') +
        '<bdi>' + esc(SPRACHEN[k].name) + '</bdi>' + (SPRACHEN[k].neu ? ' <small class="l-sub">· neu, noch nicht von Muttersprachlern geprüft</small>' : '') + '</span></button>').join('') + '</div>');
    document.querySelectorAll('[data-spr]').forEach(b => b.onclick = () => { p.lang = b.dataset.spr; save(); showHome(); });
  }
  // Niveau wechseln: die Stelle im alten Niveau merken, im neuen dort weitermachen, wo man war
  function setLevel(id) {
    const p = prof(); if (!p || !LEVEL_IDS.includes(id)) return;
    p.pos = p.pos || {};
    p.pos[p.level] = {unit: p.unit, lesson: p.lesson};
    const z = p.pos[id] || {unit: 0, lesson: 1};
    const max = levelObj(id).units.length - 1;
    p.level = id; p.unit = Math.min(z.unit || 0, max); p.lesson = z.lesson || 1; p.finished = false;
    save();
  }
  const lvDone = (p, id) => levelObj(id).units.filter((u, i) => p.done && p.done[id + ':' + i + ':5']).length;
  function levelCards(p, cur) {
    return '<div class="l-lvcards">' + LEVEL_IDS.map(id => {
      const o = levelObj(id), inf = lvInfo(id), dn = lvDone(p, id), n = o.units.length;
      return '<button type="button" class="l-lvcard lvc-' + id + (id === cur ? ' on' : '') + '" data-setlv="' + id + '">' +
        '<span class="l-lvbig">' + esc(inf.kurz) + '</span><span class="l-lvtxt"><b>' + esc(inf.name === inf.kurz ? inf.stufe : inf.name) + '</b>' +
        '<small>' + esc(inf.was) + '</small><small class="l-lvn">' + n + ' Einheiten · ' + dn + ' fertig' + (id === cur ? ' · ✔ gewählt' : '') + '</small></span></button>';
    }).join('') + '</div>';
  }
  function showLevels() {
    stopAll(); L.view = 'levels'; topbar();
    const p = prof();
    body('<h2 class="l-h">🎚️ ' + bi('Niveau wählen', 'levels') + '</h2>' +
      '<p class="l-note">Alles in der App – Lektionen, Training, Wörterbuch und Grammatik – zeigt dann <b>nur dieses Niveau</b>. Dein Stand in jedem Niveau bleibt gespeichert.</p>' +
      levelCards(p, p.level) +
      '<button type="button" class="l-btn" id="lPlace2">🎯 ' + bi('Einstufungstest', 'place') + ' – ich weiß nicht, welches Niveau</button>');
    document.querySelectorAll('[data-setlv]').forEach(b => b.onclick = () => { setLevel(b.dataset.setlv); showHome(); });
    $('lPlace2').onclick = startPlacement;
  }

  async function openLearn() {
    try { unlockAudio(); _jAudioCtx(); } catch (e) {}
    if (typeof J !== 'undefined' && J.open) closeJarvis();
    ensureDom();
    document.body.classList.add('learn-open');
    body('<div class="l-loading">Einen Moment …</div>');
    const c = await curriculum();
    await Promise.race([syncNow(), new Promise(r => setTimeout(r, 4000))]);
    if (!c) { body('<div class="l-card">❌ Der Lehrplan konnte nicht geladen werden. Bitte Internet prüfen und neu öffnen.</div>'); return; }
    if (prof()) showHome(); else showProfiles();
  }
  function closeLearn() { stopAll(); location.href = '../index.html#bereiche'; }

  // ----- Profile -----
  function showProfiles() {
    L.view = 'profiles'; topbar();
    const ps = Object.values(DB.profiles);
    let h = '<h2 class="l-h">Wer lernt? <span class="l-sub">· Who is learning? · چه کسی یاد می‌گیرد؟</span></h2>';
    if (ps.length) {
      h += '<div class="l-list">' + ps.map(p => '<div class="l-pcard"><button type="button" class="l-pmain" data-pid="' + esc(p.id) + '">' +
        '<span class="l-avatar">' + esc((p.name || '?').slice(0, 1).toUpperCase()) + '</span><span><b>' + esc(p.name) + '</b><br><small>' +
        esc(posShort(p)) + '</small></span></button><button type="button" class="l-del" data-del="' + esc(p.id) + '" aria-label="Löschen">🗑</button></div>').join('') + '</div>';
    }
    h += '<div class="l-card"><h3>➕ Neue Person <span class="l-sub">· New person · شخص جدید</span></h3>' +
      '<input id="lName" class="l-input" placeholder="Name" maxlength="30" autocomplete="off">' +
      '<div class="l-lang">' + Object.keys(SPRACHEN).map((k, i) => '<label><input type="radio" name="lLang" value="' + k + '"' + (i === 0 ? ' checked' : '') + '> ' + esc(SPRACHEN[k].name) + (SPRACHEN[k].neu ? ' <small>(neu)</small>' : '') + '</label>').join('') + '</div>' +
      '<p class="l-note">Erklärsprache: In dieser Sprache hilft der Lehrer, wenn etwas schwer ist.</p>' +
      '<button type="button" class="l-btn l-primary" id="lCreate">Profil anlegen</button></div>' +
      '<p class="l-note" id="lSync">' + esc(syncText()) + '</p>';
    body(h);
    document.querySelectorAll('[data-pid]').forEach(b => b.onclick = () => { DB.active = b.dataset.pid; save(); showHome(); });
    document.querySelectorAll('[data-del]').forEach(b => b.onclick = () => {
      const p = DB.profiles[b.dataset.del];
      if (p && confirm('Profil „' + p.name + '“ mit allem Fortschritt löschen?')) { DB.deleted = DB.deleted || {}; DB.deleted[b.dataset.del] = Date.now(); delete DB.profiles[b.dataset.del]; if (DB.active === b.dataset.del) DB.active = null; save(); showProfiles(); }
    });
    $('lCreate').onclick = () => {
      const name = ($('lName').value || '').trim();
      if (!name) { $('lName').focus(); return; }
      const lang = (document.querySelector('input[name="lLang"]:checked') || {}).value || 'fa';
      const id = 'p' + Date.now().toString(36);
      DB.profiles[id] = {id, name, lang, level: 'alpha', unit: 0, lesson: 1, done: {}, weak: {}, xp: 0, _xpSeen: 0, xp0: 0, xd: {}, dd: {}, goal: 30, created: Date.now(), updated: Date.now()};
      DB.active = id; save(); showStart();
    };
  }
  // ---------- KI einrichten (Gemini-Schlüssel, ChatGPT, Claude oder SD Lotse) ----------
  function showKi() {
    stopAll(); L.view = 'ki'; topbar();
    const q = window.SDLernAPI.quelle();
    body('<h2 class="l-h">⚙️ KI einrichten</h2>' +
      '<p class="l-note">Kursbuch, Training, Bilder, Artikel-Tricks, Grammatik und Wörterbuch gehen <b>ohne KI</b>. ' +
      'Der KI-Lehrer, das Gespräch, die Schreib-Korrektur und das Übersetzen nutzen eine KI:</p>' +
      '<div class="l-list l-kiq">' +
      '<label class="l-unit"><span><input type="radio" name="lKiQ" value="server"' + (q !== 'eigen' ? ' checked' : '') + '> 🌐 <b>SD-Server</b> (Standard) – ohne eigenen Schlüssel, mit natürlicher Stimme</span></label>' +
      '<label class="l-unit"><span><input type="radio" name="lKiQ" value="eigen"' + (q === 'eigen' ? ' checked' : '') + '> 🔑 <b>Eigene KI</b> – Gemini-Schlüssel, ChatGPT, Claude oder SD Lotse (Auswahl unten)</span></label></div>' +
      '<p class="l-note">Antwortet der SD-Server nicht, springt die eigene KI ein – wenn unten eine eingerichtet ist.</p>' +
      '<div class="l-kibox" id="lKiBox"></div>' +
      '<button type="button" class="l-btn" id="lKiTest">🧪 Verbindung testen</button><div class="l-note" id="lKiRes"></div>' +
      '<button type="button" class="l-btn l-primary" id="lKiOk">✓ Fertig</button>');
    document.querySelectorAll('input[name=lKiQ]').forEach(r => r.onchange = () => { try { localStorage.setItem('sdLearnKiQuelle', r.value); } catch (e) {} });
    if (window.sdKi) window.sdKi.baueAuswahl($('lKiBox'), {geminiKeyFeld: true});
    else $('lKiBox').textContent = 'Der KI-Baustein konnte nicht geladen werden.';
    $('lKiOk').onclick = () => { if (prof()) showHome(); else showProfiles(); };
    $('lKiTest').onclick = async () => {
      const r = $('lKiRes'); r.textContent = '⏳ Frage die KI …'; $('lKiTest').disabled = true;
      const d = await window.SDLernAPI.kiTest();
      r.textContent = d.ok ? '✅ Die KI antwortet (' + (d.ms / 1000).toFixed(1) + ' s): „' + d.text + '“' : '❌ ' + d.error;
      $('lKiTest').disabled = false;
    };
  }
  const kiAnbieter = () => { try { return window.sdKi ? window.sdKi.anbieter() : 'gemini'; } catch (e) { return 'gemini'; } };
  const kiKnopf = () => '<button type="button" class="l-btn" data-kiset="1">⚙️ KI einrichten</button>' +
    (kiAnbieter() !== 'lotse' && window.sdKi ? '<button type="button" class="l-btn" data-lotse="1">🔒 SD Lotse nehmen</button>' : '');
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-lotse]'); if (!b) return;
    e.preventDefault();
    window.sdKi.setzeAnbieter('lotse');
    try { localStorage.setItem('sdLearnKiQuelle', 'eigen'); } catch (_) {}
    b.outerHTML = '<p class="l-note l-lotseok">🔒 <b>SD Lotse ist gewählt.</b> Er läuft auf deinem Gerät, ohne Schlüssel und ohne Internet-KI. ' +
      'Beim ersten Mal wird das Modell einmal heruntergeladen (groß – am besten im WLAN, am besten PC/Laptop mit Chrome oder Edge). ' +
      'Tippe jetzt auf „Nochmal versuchen“ oder schick deine Nachricht nochmal. SD Lotse ist kleiner als Gemini – Lektionen und Korrekturen können schwächer sein.</p>';
  });
  document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-kiset]'); if (b) { e.preventDefault(); showKi(); } });
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('#lTonTest'); if (!b) return;
    try { localStorage.removeItem('sdLearnTonHinweis'); } catch (_) {}
    lSpeak('Hallo! Kannst du mich hören?', false);
    if (!IOS) { const d = document.createElement('div'); d.className = 'l-tonhinweis'; d.innerHTML = '🔈 <b>Nichts zu hören?</b> Lautstärke prüfen. Die Stimme kommt vom Gerät selbst (Sprachausgabe des Browsers). <button type="button">OK</button>'; d.querySelector('button').onclick = () => d.remove(); document.body.appendChild(d); setTimeout(() => d.remove(), 10000); }
  });
  window.addEventListener('pageshow', () => {});

  function posShort(p) {
    if (!L.cur) return '';
    const lv = levelObj(p.level); if (p.finished) return 'B1 geschafft 🎉';
    return lv ? lv.name + ' · Einheit ' + (p.unit + 1) + ' · ' + progressPct(p) + ' %' : '';
  }
  function showStart() {
    L.view = 'start'; topbar();
    body('<h2 class="l-h">Hallo ' + esc(prof().name) + '! 👋</h2>' +
      '<div class="l-card"><h3>Wo möchtest du anfangen?</h3>' + l1(tx('where')) +
      '<button type="button" class="l-btn l-primary" id="lPlace">🎯 Einstufungstest (12 Fragen) <span class="l-sub">· ' + esc(tx('place')) + '</span></button>' +
      '<p class="l-note">Oder such dir dein Niveau selbst aus:</p>' + levelCards(prof(), null) + '</div>');
    $('lPlace').onclick = startPlacement;
    document.querySelectorAll('[data-setlv]').forEach(b => b.onclick = () => { setLevel(b.dataset.setlv); showHome(); });
  }

  // ----- Startseite -----
  function showHome() {
    if (!prof()) { showProfiles(); return; }
    L.view = 'home'; topbar();
    const p = prof(), weak = weakList(), lv = levelObj(p.level), inf = lvInfo(p.level);
    const dn = lvDone(p, p.level), nU = lv.units.length, pctLv = Math.round(dn / nU * 100);
    let h = '<h2 class="l-h">Hallo ' + esc(p.name) + '! 👋</h2>' +
      // Niveau-Leiste: immer sichtbar, ein Tipp wechselt das Niveau
      '<div class="l-lvtabs" role="tablist" aria-label="Niveau">' + LEVEL_IDS.map(id => '<button type="button" role="tab" aria-selected="' + (id === p.level) + '" class="l-lvtab lvc-' + id + (id === p.level ? ' on' : '') + '" data-setlv="' + id + '">' + esc(lvInfo(id).kurz) + '</button>').join('') + '</div>' +
      '<div class="l-lvhero lvc-' + p.level + '"><div class="l-lvhero-top"><span class="l-lvbig">' + esc(inf.kurz) + '</span><div><small>Du lernst gerade</small><b>' + esc(inf.name === inf.kurz ? 'Niveau ' + inf.kurz + ' · ' + inf.stufe : inf.name) + '</b></div></div>' +
      '<p>' + esc(inf.was) + '</p><div class="l-progress"><div style="width:' + pctLv + '%"></div></div>' +
      '<small>' + dn + ' von ' + nU + ' Einheiten in ' + esc(inf.kurz) + ' fertig · ⭐ ' + (p.xp || 0) + '</small></div>' +
      '<p class="l-note l-sync" id="lSync">' + esc(syncText()) + '</p>';
    if (!p.finished) {
      h += '<button type="button" class="l-continue" id="lCont"><span class="l-big">▶ ' + bi('Weitermachen', 'cont') + '</span><small>' + esc(posText(p)) + '</small></button>';
    } else h += '<div class="l-card">🎉 Du hast alle Einheiten bis B1 geschafft! Übe weiter mit Gesprächen und Wiederholungen – oder wähle oben ein Niveau zum Wiederholen.</div>';
    h += '<h3 class="l-h3">🏋️ ' + bi('Training', 'train') + ' ' + lvChip(p.level, 'nur dieses Niveau') + '</h3><div id="lTrain" class="l-train"><div class="l-note">…</div></div>';
    h += '<div class="l-grid"><button type="button" class="l-btn" id="lChatBtn">💬 ' + bi('Gespräch üben', 'chat') + '</button>' +
      (weak.length ? '<button type="button" class="l-btn" id="lWeakBtn">🔁 ' + bi('Schwierige Wörter', 'weak') + ' (' + weak.length + ')</button>' : '') +
      '<button type="button" class="l-btn" id="lPlaceBtn">🎯 ' + bi('Einstufungstest', 'place') + '</button></div>' +
      '<h3 class="l-h3">📚 Kursbuch ' + lvChip(p.level) + '</h3><div class="l-grid">' +
      '<button type="button" class="l-btn" id="lBookBtn">📖 ' + bi('Meine Einheit', 'book') + '</button>' +
      '<button type="button" class="l-btn" id="lDictBtn">🔤 ' + bi('Wörterbuch', 'dict') + '</button>' +
      '<button type="button" class="l-btn" id="lGramBtn">📐 ' + bi('Grammatik', 'gram') + '</button>' + kiKnopf() +
      '<button type="button" class="l-btn" id="lTonTest">🔊 Ton testen</button>' +
      '<button type="button" class="l-btn" id="lSprBtn">🌐 Erklärsprache: <bdi>' + esc(SPRACHEN[spr()].name) + '</bdi></button></div>';
    h += '<h3 class="l-h3">' + bi('Dein Weg', 'way') + ' ' + lvChip(p.level, nU + ' Einheiten') + '</h3><div class="l-level l-way lvc-' + p.level + '">';
    lv.units.forEach((u, i) => {
      const d5 = !!p.done[p.level + ':' + i + ':5'], cur = i === p.unit;
      const dots = [1, 2, 3, 4, 5].map(n => '<i class="' + (p.done[p.level + ':' + i + ':' + n] != null ? 'ok' : (cur && n === p.lesson ? 'cur' : '')) + '"></i>').join('');
      h += '<button type="button" class="l-unit' + (cur ? ' cur' : '') + '" data-u="' + p.level + ':' + i + '"><span>' + (d5 ? '✅' : (cur ? '▶️' : '○')) + ' ' + (i + 1) + '. ' + esc(u) + (cur ? ' <em class="l-here">du bist hier</em>' : '') + '</span><span class="l-dots">' + dots + '</span></button>';
    });
    h += '</div><p class="l-note">Ganzer Weg bis B1: ' + progressPct(p) + ' % · Anderes Niveau: oben auf Alpha, A1, A2 oder B1 tippen.</p>';
    body(h);
    document.querySelectorAll('[data-setlv]').forEach(b => b.onclick = () => { if (b.dataset.setlv !== p.level) { setLevel(b.dataset.setlv); showHome(); } });
    if ($('lCont')) $('lCont').onclick = () => startLesson(p.level, p.unit, p.lesson);
    $('lChatBtn').onclick = () => startChat(p.level, p.unit, false);
    if ($('lWeakBtn')) $('lWeakBtn').onclick = startWeak;
    $('lPlaceBtn').onclick = startPlacement;
    $('lBookBtn').onclick = () => showUnit(p.level, p.unit);
    $('lDictBtn').onclick = showDict;
    $('lGramBtn').onclick = showGrammarAll;
    $('lSprBtn').onclick = showSprache;
    homeTraining();
    document.querySelectorAll('[data-u]').forEach(b => b.onclick = () => {
      const [lvId, ui] = b.dataset.u.split(':');
      showUnit(lvId, +ui);
    });
  }

  // ----- Lektion laden -----
  async function startLesson(level, unit, lesson) {
    const p = prof();
    if (lesson === 4) { startChat(level, unit, true); return; }
    L.view = 'lesson'; topbar();
    const ck = p.lang + '|' + level + '|' + unit + '|' + lesson;
    let les = cacheGet(ck);
    if (!les) {
      body('<div class="l-loading"><div class="l-spin"></div>Der Lehrer bereitet die Lektion vor …' + l1(tx('prep')) + '</div>');
      try {
        const d = await (await fetch('/learn/lesson', {method: 'POST', headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({level, unit, lesson, lang: p.lang, weak: weakList().slice(0, 8)})})).json();
        if (!d.ok) throw new Error(d.error || 'Fehler');
        les = d.lesson; cachePut(ck, les);
      } catch (e) {
        body('<div class="l-card">❌ Die Lektion konnte nicht erstellt werden.<br><small>' + esc(e.message) + '</small><br><br>' +
          '<button type="button" class="l-btn l-primary" id="lRetry">' + bi('Nochmal versuchen', 'again') + '</button>' + kiKnopf() + '</div>');
        $('lRetry').onclick = () => startLesson(level, unit, lesson);
        return;
      }
    }
    L.lesson = les; L.ck = ck; L.idx = -1; L.results = [];
    try { L.vocab = await lessonVocab(les); } catch (e) { L.vocab = []; }
    renderItem();
  }

  // ----- Wortschatz dieser Lektion: Kursbuch-Wörter der Lektion + Kursbuch-Wörter, die in der Lektion vorkommen -----
  // Bedeutungen kommen aus dem Kursbuch in der gewählten Erklärsprache (nicht von der KI).
  async function lessonVocab(les) {
    if (!les || les.unit < 0) return [];
    const u = await getBook(les.level, les.unit), ws = u.words || [];
    const fok = window.SDLernAPI.fokus(ws, les.lesson, les.level === 'alpha');
    const text = (les.items || []).map(it => [it.de, it.q, it.answer, it.text, it.example, it.audio].concat(it.options || [], it.words || []).filter(Boolean).join(' ')).join(' ');
    const toks = new Set(text.split(/[^A-Za-zÄÖÜäöüß-]+/).filter(Boolean));
    const lower = new Set([...toks].map(t => t.toLowerCase()));
    const drin = w => {
      const kern = w.de.replace(/^(der|die|das) /, '').replace(/\s*\(.*\)$/, '');
      if (/\s/.test(kern) || /[\/…|]/.test(kern)) return false;
      return w.art ? toks.has(kern) || (w.pl && toks.has(w.pl.replace(/^die /, ''))) : lower.has(kern.toLowerCase());
    };
    const out = [], seen = new Set();
    fok.concat(ws.filter(drin)).forEach(w => { if (!seen.has(w.de)) { seen.add(w.de); out.push(w); } });
    return out.slice(0, 30);
  }
  function vocabHtml(list, offen) {
    if (!list || !list.length) return '';
    return '<details class="l-level l-lvocab"' + (offen ? ' open' : '') + '><summary>📚 Wortschatz dieser Lektion <small>' + list.length + ' · ' + esc(tx('lwords')) + '</small></summary>' +
      '<div class="l-wlist">' + list.map(w => '<div class="l-wrow"><button type="button" class="l-btn l-icon l-sp" data-say="' + esc(w.de) + '" aria-label="Hören">🔊</button>' +
        '<div class="l-wtxt"><div>' + picEmo(w) + wordHtml(w) + (w.pl ? ' <span class="l-pl">· Pl. ' + esc(w.pl) + '</span>' : '') + '</div>' +
        '<div class="l-l1 l-wl1"' + l1Attr() + '>' + esc(w.l1) + '</div></div></div>').join('') + '</div></details>';
  }

  function head() {
    const les = L.lesson, n = les.items.length;
    return '<div class="l-lhead">' + lvChip(les.level) + '<small>' + esc(les.unit_title || '') + ' · Lektion ' + les.lesson + ' von 5: ' + esc(les.lesson_name || '') + '</small>' +
      '<div class="l-progress"><div style="width:' + Math.round(Math.max(0, L.idx) / n * 100) + '%"></div></div></div>';
  }
  const btnSpeak = (t, id, label) => '<button type="button" class="l-btn l-icon" id="' + (id || 'lSp') + '" data-say="' + esc(t) + '">🔊 ' + (label ? esc(label) : bi('Hören', 'listen')) + '</button>';
  const btnL1 = () => '<button type="button" class="l-btn l-icon" id="lTr">🌐 ' + bi('Übersetzung', 'trans') + '</button>';
  function wireCommon() {
    document.querySelectorAll('[data-say]').forEach(b => b.onclick = () => lSpeak(b.dataset.say, slowFor()));
    if ($('lTr')) $('lTr').onclick = () => document.querySelectorAll('.l-l1.hide').forEach(e => e.classList.toggle('show'));
    if ($('lNext')) $('lNext').onclick = nextItem;
  }
  function micUi(id) { return '<button type="button" class="l-mic" id="' + (id || 'lMic') + '"><span class="l-mic-ic">🎤</span><span>' + bi('Sprechen', 'speak') + '</span></button><div class="l-mstate" id="lMs"></div>'; }
  function attachMic(onText, id) {
    const btn = $(id || 'lMic'); if (!btn) return;
    btn.onclick = async () => {
      if (L.rec) { if (L.rec.speech()) L.rec.stop(); return; }
      try { unlockAudio(); _jAudioCtx(); } catch (e) {}
      const st = $('lMs');
      const r = await lHear((s, v) => {
        if (s === 'rec') { btn.classList.add('rec'); st.textContent = 'Sprich jetzt …'; }
        if (s === 'speech') st.textContent = 'Ich höre dich … mach eine kurze Pause, wenn du fertig bist.';
        if (s === 'level') btn.style.transform = 'scale(' + (1 + Math.min(0.2, v * 3)).toFixed(3) + ')';
        if (s === 'done') { btn.classList.remove('rec'); btn.style.transform = ''; }
        if (s === 'stt') st.textContent = 'Ich prüfe …';
      });
      if (r.error) { st.textContent = '⚠️ ' + r.error; return; }
      if (!r.text) { st.textContent = 'Ich habe nichts gehört. Tippe nochmal auf 🎤.'; return; }
      st.textContent = '';
      onText(r.text);
    };
  }

  // ----- Aufgaben -----
  function renderItem() {
    const les = L.lesson, p = prof();
    if (L.idx < 0) {
      body(head() + '<div class="l-card l-center"><h2>' + esc(les.title || les.lesson_name) + '</h2>' +
        '<p class="l-de">' + esc(les.intro) + '</p>' + l1(les.intro_l1) +
        '<div class="l-row">' + (les.intro ? btnSpeak(les.intro) : '') + '</div>' +
        '<button type="button" class="l-btn l-primary" id="lNext">' + bi('Los geht’s', 'start') + ' ➜</button></div>' + vocabHtml(L.vocab, true));
      wireCommon(); if (les.intro) lSpeak(les.intro, slowFor());
      return;
    }
    if (L.idx >= les.items.length) { finishLesson(); return; }
    const it = les.items[L.idx];
    let h = head() + '<div class="l-card l-center">';
    if (it.type === 'word') {
      h += '<div class="l-word">' + esc(it.de) + '</div>' + l1(it.l1) +
        (it.example ? '<p class="l-de">' + esc(it.example) + '</p>' + l1(it.example_l1, 'hide') : '') +
        '<div class="l-row">' + btnSpeak(it.de) + (it.example ? btnSpeak(it.example, 'lSp2', 'Beispielsatz') : '') + (it.example_l1 ? btnL1() : '') + '</div>' +
        micUi() + '<div id="lFb"></div><button type="button" class="l-btn l-primary" id="lNext">' + bi('Weiter', 'next') + ' ➜</button>';
      body(h + '</div>'); wireCommon(); lSpeak(it.de, slowFor());
      L.results[L.idx] = 1;
      attachMic(t => feedbackSay(it.de, t, true));
    } else if (it.type === 'letter') {
      h += '<div class="l-letter">' + esc(it.letter) + '</div>' + (it.sound ? '<p class="l-de">' + esc(it.sound) + '</p>' : '') + l1(it.l1) +
        '<div class="l-row l-wrapr">' + (it.words || []).slice(0, 4).map((w, i) => '<button type="button" class="l-btn l-wordbtn" data-say="' + esc(w) + '">🔊 ' + esc(w) + '</button>').join('') + '</div>' +
        micUi() + '<div id="lFb"></div><button type="button" class="l-btn l-primary" id="lNext">' + bi('Weiter', 'next') + ' ➜</button>';
      body(h + '</div>'); wireCommon(); lSpeak((it.letter || '').split(' ')[0] + '. ' + (it.words || []).slice(0, 3).join('. '), true);
      L.results[L.idx] = 1;
      attachMic(t => feedbackSay((it.words || [it.letter])[0], t, true));
    } else if (it.type === 'rule') {
      h += '<h3>💡 ' + esc(it.title) + '</h3><p class="l-de l-left">' + esc(it.text) + '</p>' + l1(it.l1) +
        '<div class="l-row">' + btnSpeak(it.text) + '</div><button type="button" class="l-btn l-primary" id="lNext">' + bi('Verstanden', 'next') + ' ➜</button>';
      body(h + '</div>'); wireCommon(); L.results[L.idx] = 1;
    } else if (it.type === 'say') {
      h += '<p class="l-hint">' + bi('Hör zu und sprich nach', 'speak') + '</p><div class="l-say" id="lSay">' + esc(it.de) + '</div>' + l1(it.l1, 'hide') +
        '<div class="l-row">' + btnSpeak(it.de) + (it.l1 ? btnL1() : '') + '</div>' + micUi() + '<div id="lFb"></div>' +
        '<button type="button" class="l-btn" id="lNext">' + bi('Überspringen', 'next') + ' ➜</button>';
      body(h + '</div>'); wireCommon(); lSpeak(it.de, slowFor());
      L.results[L.idx] = 0;
      attachMic(t => feedbackSay(it.de, t, false));
    } else if (it.type === 'choice') {
      const order = it.options.map((o, i) => i).sort(() => Math.random() - 0.5);
      h += (it.audio ? '<div class="l-row">' + btnSpeak(it.audio) + '</div>' : '') +
        '<p class="l-q">' + esc(it.q) + '</p>' + l1(it.q_l1) +
        '<div class="l-opts">' + order.map(i => '<button type="button" class="l-opt" data-o="' + i + '">' + esc(it.options[i]) + '</button>').join('') + '</div><div id="lFb"></div>';
      body(h + '</div>'); wireCommon(); if (it.audio) lSpeak(it.audio, slowFor());
      document.querySelectorAll('[data-o]').forEach(b => b.onclick = () => {
        if (L.results[L.idx] != null) return;
        const ok = +b.dataset.o === it.answer;
        L.results[L.idx] = ok ? 1 : 0;
        document.querySelectorAll('[data-o]').forEach(x => { x.disabled = true; if (+x.dataset.o === it.answer) x.classList.add('right'); });
        if (!ok) { b.classList.add('wrong'); addWeak(it.options[it.answer], 1); } else addWeak(it.options[it.answer], -1);
        showFb(ok ? 1 : 0, ok ? '' : 'Richtig ist: ' + it.options[it.answer], it.explain_l1);
      });
    } else if (it.type === 'write') {
      h += (it.audio ? '<div class="l-row">' + btnSpeak(it.audio) + '</div>' : '') + '<p class="l-q">' + esc(it.q) + '</p>' + l1(it.q_l1) +
        '<input id="lIn" class="l-input l-big-in" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="done">' +
        '<button type="button" class="l-btn l-primary" id="lChk">' + bi('Prüfen', 'check') + '</button><div id="lFb"></div>';
      body(h + '</div>'); wireCommon(); if (it.audio) lSpeak(it.audio, slowFor());
      const chk = () => {
        if (L.results[L.idx] != null) return;
        const r = writeCheck(it.answer, $('lIn').value);
        if (!$('lIn').value.trim()) { $('lIn').focus(); return; }
        L.results[L.idx] = r.score; $('lIn').disabled = true; $('lChk').style.display = 'none';
        addWeak(it.answer, r.score >= 1 ? -1 : 1);
        showFb(r.score, r.msg, it.explain_l1);
      };
      $('lChk').onclick = chk; $('lIn').addEventListener('keydown', e => { if (e.key === 'Enter') chk(); });
    } else { nextItem(); }
  }
  function showFb(score, msg, explain) {
    const cls = score >= 1 ? 'ok' : (score >= 0.5 ? 'mid' : 'bad');
    const head = score >= 1 ? '✅ ' + bi('Richtig!', 'right') : (score >= 0.5 ? '🟡 ' + bi('Fast richtig', 'almost') : '❌ ' + bi('Leider falsch', 'wrong'));
    $('lFb').innerHTML = '<div class="l-fb ' + cls + '"><b>' + head + '</b>' + (msg ? '<p>' + esc(msg) + '</p>' : '') + l1(explain) + '</div>' +
      '<button type="button" class="l-btn l-primary" id="lNext2">' + bi('Weiter', 'next') + ' ➜</button>';
    $('lNext2').onclick = nextItem;
    if (score >= 1) lSpeak('Richtig!', false);
  }
  function feedbackSay(target, heard, practice) {
    const r = sayScore(target, heard), sc = r.score;
    const marked = r.toks.map((t, i) => '<span class="' + (r.marks[i] ? 'w-ok' : 'w-bad') + '">' + esc(t) + '</span>').join(' ');
    const el = $('lSay'); if (el) el.innerHTML = marked;
    if (!practice) {
      L.results[L.idx] = Math.max(L.results[L.idx] || 0, sc >= 0.8 ? 1 : (sc >= 0.5 ? 0.5 : 0));
      if (sc < 0.6) addWeak(target, 1);
    }
    const cls = sc >= 0.8 ? 'ok' : (sc >= 0.5 ? 'mid' : 'bad');
    const msg = sc >= 0.8 ? '✅ ' + bi('Sehr gut!', 'right') : (sc >= 0.5 ? '🟡 ' + bi('Fast – rote Wörter nochmal üben', 'almost') : '❌ ' + bi('Nochmal versuchen', 'again'));
    $('lFb').innerHTML = '<div class="l-fb ' + cls + '"><b>' + msg + '</b><p>Ich habe verstanden: „' + esc(heard) + '“</p></div>';
    lSpeak(sc >= 0.8 ? 'Sehr gut!' : (sc >= 0.5 ? 'Fast. Hör noch einmal: ' + target : 'Hör noch einmal: ' + target), slowFor());
    const nb = $('lNext'); if (nb && !practice) { nb.classList.add('l-primary'); nb.innerHTML = bi('Weiter', 'next') + ' ➜'; }
  }
  function nextItem() { stopAll(); L.idx++; renderItem(); }

  function finishLesson() {
    const p = prof(), les = L.lesson;
    const scored = L.results.filter(x => x != null);
    const score = scored.length ? scored.reduce((a, b) => a + b, 0) / scored.length : 1;
    const isTest = les.lesson === 5, passed = !isTest || score >= 0.7;
    const k = les.level + ':' + les.unit + ':' + les.lesson;
    p.done[k] = Math.max(p.done[k] || 0, Math.round(score * 100));
    p.xp = (p.xp || 0) + Math.round(score * 10) + (passed && isTest ? 20 : 0);
    const isCurrent = p.level === les.level && p.unit === les.unit && p.lesson === les.lesson;
    const lvVorher = p.level;
    if (isCurrent) advance(p, passed);
    const aufgestiegen = p.level !== lvVorher;
    if (aufgestiegen) { p.pos = p.pos || {}; p.pos[lvVorher] = {unit: les.unit, lesson: 5}; }
    if (isTest && !passed) cacheDel(L.ck);   // neuer Test beim naechsten Versuch
    save(); topbar();
    const pct = Math.round(score * 100);
    let h = '<div class="l-card l-center"><div class="l-big-ic">' + (passed ? (isTest ? '🏆' : '🎉') : '💪') + '</div><h2>' +
      (isTest ? (passed ? 'Test bestanden! ' + pct + ' %' : 'Noch nicht bestanden: ' + pct + ' %') : 'Lektion geschafft! ' + pct + ' %') + '</h2>' +
      (isTest && !passed ? '<p>Für den nächsten Schritt brauchst du 70 %. Wiederhole die Einheit oder versuch den Test nochmal.</p>' : '') +
      '<p class="l-note">⭐ ' + p.xp + '</p>' +
      (aufgestiegen ? '<div class="l-lvup lvc-' + p.level + '">🎓 <b>' + esc(lvInfo(lvVorher).kurz) + ' geschafft!</b> Ab jetzt lernst du <b>' + esc(lvInfo(p.level).kurz) + '</b>. Die Farbe oben zeigt dir immer dein Niveau.</div>' : '');
    if (!p.finished) h += '<button type="button" class="l-btn l-primary" id="lGo">▶ ' + bi('Weitermachen', 'cont') + '</button><p class="l-note">' + esc(posText(p)) + '</p>';
    h += '<button type="button" class="l-btn" id="lHome">Zur Übersicht</button></div>';
    if (L.vocab && L.vocab.length) {
      L.vocab.forEach(w => srsAdd(w.de, 1));   // Wörter der Lektion kommen in die tägliche Wiederholung
      h += vocabHtml(L.vocab, false) + '<p class="l-note">✔ Diese Wörter sind jetzt in deiner 🧠 Wiederholung.</p>';
    }
    body(h); wireCommon();
    lSpeak(passed ? (isTest ? 'Super! Test bestanden.' : 'Super gemacht!') : 'Gut versucht. Wir üben das nochmal.', false);
    if ($('lGo')) $('lGo').onclick = () => startLesson(p.level, p.unit, p.lesson);
    $('lHome').onclick = () => showUnit(les.level, les.unit);
    $('lHome').innerHTML = '📖 Zur Einheit';
  }

  // ----- Schwierige Woerter -----
  function startWeak() {
    const w = weakList().slice(0, 10);
    if (!w.length) { showHome(); return; }
    L.view = 'lesson';
    L.lesson = {title: 'Schwierige Wörter', intro: 'Wir üben die Wörter, die noch schwer sind.', intro_l1: '', level: prof().level, unit: -1, lesson: 0,
                lesson_name: 'Wiederholung', unit_title: 'Wiederholung', items: w.map(x => ({type: 'say', de: x, l1: ''}))};
    L.ck = null; L.idx = -1; L.results = [];
    renderItem();
    L.onFinish = () => { L.results.forEach((r, i) => { if (r >= 1) addWeak(w[i], -2); }); };
  }

  // ----- Gespraech (Rollenspiel) -----
  async function startChat(level, unit, isLesson) {
    L.view = 'chat'; topbar();
    L.chat = []; L.chatTurns = 0; L.chatCtx = {level, unit, isLesson};
    const lv = levelObj(level);
    body('<div class="l-lhead">' + lvChip(level) + '<small>' + esc(lv ? lv.units[unit] : '') + ' · 💬 Gespräch</small></div>' +
      '<div class="l-chat" id="lChat"></div>' +
      '<div class="l-chatbar">' + micUi('lCMic') +
      '<form id="lCForm" class="l-cform"><input id="lCIn" class="l-input" placeholder="Oder schreiben …" autocomplete="off"><button type="submit" class="l-btn l-primary">➤</button></form>' +
      (isLesson ? '<button type="button" class="l-btn" id="lCDone" style="display:none">✅ ' + bi('Gespräch beenden', 'done') + '</button>' : '') + '</div>');
    attachMic(t => chatSend(t), 'lCMic');
    $('lCForm').onsubmit = e => { e.preventDefault(); const t = $('lCIn').value.trim(); if (t) { $('lCIn').value = ''; chatSend(t); } };
    if ($('lCDone')) $('lCDone').onclick = () => {
      stopAll();
      L.lesson = {level, unit, lesson: 4, lesson_name: 'Gespräch', unit_title: lv.units[unit], items: []};
      L.results = [1]; finishLesson();
    };
    await chatSend(null);
  }
  function chatBubble(role, html) { const c = $('lChat'); const d = document.createElement('div'); d.className = 'l-msg ' + role; d.innerHTML = html; c.appendChild(d); c.scrollTop = c.scrollHeight; return d; }
  async function chatSend(text) {
    const p = prof(), ctx = L.chatCtx;
    if (text) { chatBubble('me', esc(text)); L.chat.push({role: 'user', content: text}); L.chatTurns++; }
    const wait = chatBubble('t', '<div class="typing-indicator"><span></span><span></span><span></span></div>');
    let d;
    try {
      d = await (await fetch('/learn/chat', {method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({level: ctx.level, unit: ctx.unit, lang: p.lang, name: p.name, messages: L.chat})})).json();
    } catch (e) { d = {ok: false, error: 'Keine Verbindung'}; }
    if (!d.ok) { wait.innerHTML = '❌ ' + esc(d.error || 'Fehler') + '<br>' + kiKnopf(); return; }
    let h = '';
    if (d.correction && text) h += '<div class="l-corr">✏️ Besser: <b>' + esc(d.correction) + '</b>' + l1(d.explain_l1) + '</div>';
    h += '<div class="l-de">' + esc(d.reply) + '</div>' + l1(d.reply_l1, 'hide') +
      '<div class="l-row"><button type="button" class="l-btn l-icon" data-say="' + esc(d.reply) + '">🔊</button>' +
      (d.reply_l1 ? '<button type="button" class="l-btn l-icon" data-tr="1">🌐</button>' : '') + '</div>';
    wait.innerHTML = h;
    wait.querySelectorAll('[data-say]').forEach(b => b.onclick = () => lSpeak(b.dataset.say, slowFor()));
    wait.querySelectorAll('[data-tr]').forEach(b => b.onclick = () => wait.querySelectorAll('.l-l1.hide').forEach(e => e.classList.toggle('show')));
    L.chat.push({role: 'assistant', content: d.reply});
    if ($('lCDone') && L.chatTurns >= 4) $('lCDone').style.display = '';
    lSpeak((d.correction && text ? 'Besser: ' + d.correction + '. ' : '') + d.reply, slowFor());
  }

  // ----- Einstufungstest (feste Fragen, keine KI) -----
  const PLACE = [
    {lv: 'alpha', audio: 'Mama', q: 'Welches Wort hörst du?', o: ['Mama', 'Oma', 'Papa'], a: 0},
    {lv: 'alpha', audio: 'Brot', q: 'Welches Wort hörst du?', o: ['Bad', 'Brot', 'Boot'], a: 1},
    {lv: 'alpha', q: 'Welches Wort ist gleich wie: HUND', o: ['Hand', 'Hund', 'Mund'], a: 1},
    {lv: 'A1', q: 'Wie ___ du?', o: ['heißt', 'heiße', 'heißen'], a: 0},
    {lv: 'A1', q: 'Ich ___ aus Afghanistan.', o: ['komme', 'kommst', 'kommt'], a: 0},
    {lv: 'A1', q: 'Was kostet das Brot? – …', o: ['Zwei Euro.', 'Um zwei Uhr.', 'Zwei Tage.'], a: 0},
    {lv: 'A2', q: 'Gestern ___ ich beim Arzt.', o: ['war', 'bin', 'habe'], a: 0},
    {lv: 'A2', q: 'Ich lerne Deutsch, ___ ich hier arbeiten möchte.', o: ['weil', 'denn', 'aber'], a: 0},
    {lv: 'A2', q: 'Ich gebe ___ Kind einen Apfel.', o: ['dem', 'den', 'das'], a: 0},
    {lv: 'B1', q: 'Wenn ich mehr Zeit ___, würde ich einen Kurs machen.', o: ['hätte', 'habe', 'hatte'], a: 0},
    {lv: 'B1', q: 'Der Antrag muss bis Freitag ___ werden.', o: ['abgegeben', 'abgeben', 'abgab'], a: 0},
    {lv: 'B1', q: 'Ich beschwere mich ___ den Lärm.', o: ['über', 'auf', 'für'], a: 0},
  ];
  function startPlacement() { L.view = 'place'; L.place = {i: 0, right: {alpha: 0, A1: 0, A2: 0, B1: 0}}; topbar(); renderPlace(); }
  function renderPlace() {
    const P = L.place, q = PLACE[P.i];
    if (!q) { finishPlacement(); return; }
    const order = q.o.map((x, i) => i).sort(() => Math.random() - 0.5);
    body('<div class="l-lhead"><small>🎯 Einstufungstest · ' + (P.i + 1) + ' / ' + PLACE.length + '</small><div class="l-progress"><div style="width:' + Math.round(P.i / PLACE.length * 100) + '%"></div></div></div>' +
      '<div class="l-card l-center">' + (q.audio ? '<div class="l-row">' + btnSpeak(q.audio) + '</div>' : '') + '<p class="l-q">' + esc(q.q) + '</p>' +
      '<div class="l-opts">' + order.map(i => '<button type="button" class="l-opt" data-o="' + i + '">' + esc(q.o[i]) + '</button>').join('') + '</div>' +
      '<button type="button" class="l-btn" id="lPSkip">Weiß ich nicht</button></div>');
    wireCommon(); if (q.audio) lSpeak(q.audio, true);
    const go = ok => { if (ok) P.right[q.lv]++; P.i++; renderPlace(); };
    document.querySelectorAll('[data-o]').forEach(b => b.onclick = () => go(+b.dataset.o === q.a));
    $('lPSkip').onclick = () => go(false);
  }
  function finishPlacement() {
    const r = L.place.right;
    let start = 'B1';
    for (const id of LEVEL_IDS) { if (r[id] < 2) { start = id; break; } }
    setLevel(start); topbar();
    body('<div class="l-card l-center"><div class="l-big-ic">🎯</div>' + lvChip(start) + '<h2>Dein Start: ' + esc(levelObj(start).name) + '</h2>' +
      '<p class="l-note">Richtig: Alphabetisierung ' + r.alpha + '/3 · A1 ' + r.A1 + '/3 · A2 ' + r.A2 + '/3 · B1 ' + r.B1 + '/3</p>' +
      '<button type="button" class="l-btn l-primary" id="lGo">▶ ' + bi('Los geht’s', 'start') + '</button></div>');
    lSpeak('Dein Start: ' + levelObj(start).name, false);
    $('lGo').onclick = showHome;
  }

  // Wiederholung "Schwierige Woerter": Abschluss-Haken
  const _fin = finishLesson;
  finishLesson = function () {
    if (L.lesson && L.lesson.lesson === 0) {
      if (L.onFinish) { L.onFinish(); L.onFinish = null; }
      body('<div class="l-card l-center"><div class="l-big-ic">🔁</div><h2>Wiederholung fertig!</h2><button type="button" class="l-btn l-primary" id="lHome">Zur Übersicht</button></div>');
      $('lHome').onclick = showHome; return;
    }
    _fin();
  };

  // =================== KURSBUCH (feste Inhalte) ===================
  const BOOKC = {};
  const VOICES = ['de-DE-KatjaNeural', 'de-DE-ConradNeural', 'de-DE-AmalaNeural', 'de-DE-KillianNeural'];
  const isFa = () => rtl();   // rechts-nach-links (Dari/Farsi, Urdu)
  function l1Attr() { return (rtl() ? ' dir="rtl"' : '') + ' lang="' + spr() + '"'; }
  async function getBook(level, unit) {
    const p = prof(), k = p.lang + '|' + level + '|' + unit;
    if (BOOKC[k]) return BOOKC[k];
    const d = await (await fetch('/learn/book/' + encodeURIComponent(level) + '/' + unit + '?lang=' + encodeURIComponent(p.lang))).json();
    if (!d.ok) throw new Error(d.error || 'Fehler');
    BOOKC[k] = d.unit; return d.unit;
  }
  function bookMark(level, unit, part) {
    const p = prof(); p.book = p.book || {};
    const k = level + ':' + unit; p.book[k] = p.book[k] || {};
    if (!p.book[k][part]) { p.book[k][part] = 1; p.xp = (p.xp || 0) + 5; save(); }
  }
  const bookDone = (level, unit, part) => { const p = prof(); return !!(p.book && p.book[level + ':' + unit] && p.book[level + ':' + unit][part]); };
  const pk = (part, i) => i ? part + i : part;   // Teil-Schluessel: r, r1, r2 …
  const allDone = (level, unit, part, n) => { for (let i = 0; i < n; i++) if (!bookDone(level, unit, pk(part, i))) return false; return true; };
  function tabs(n, cur, label) {
    if (n < 2) return '';
    return '<div class="l-chips l-tabs">' + Array.from({length: n}, (_, i) => '<button type="button" class="l-chip' + (i === cur ? ' on' : '') + '" data-tab="' + i + '">' +
      label + ' ' + (i + 1) + (bookDone(L.bk.level, L.bk.unit, pk(L.bk.part, i)) ? ' ✅' : '') + '</button>').join('') + '</div>';
  }
  function wireTabs(fn) { document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { stopAll(); fn(+b.dataset.tab); }); }
  const artCls = a => a === 'der' ? 'a-der' : (a === 'die' ? 'a-die' : (a === 'das' ? 'a-das' : ''));
  function wordHtml(w) {
    const a = w.art, rest = a ? w.de.slice(a.length + 1) : w.de;
    return (a ? '<span class="' + artCls(a) + '">' + esc(a) + '</span> ' : '') + '<b>' + esc(rest) + '</b>';
  }
  function bookHead(title) {
    const b = L.bk, lv = levelObj(b.level);
    return '<div class="l-lhead">' + lvChip(b.level) + '<small>Einheit ' + (b.unit + 1) + ': ' + esc(b.u.title) + '</small></div>' +
      (title ? '<h2 class="l-h">' + title + '</h2>' : '');
  }
  async function translateBtn(btn, text, target) {
    if (target.dataset.done) { target.classList.toggle('show'); return; }
    btn.disabled = true; const old = btn.innerHTML; btn.innerHTML = '⏳';
    try {
      const d = await (await fetch('/learn/translate', {method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({text, lang: prof().lang})})).json();
      if (!d.ok) throw new Error(d.error);
      target.innerHTML = esc(d.text).replace(/\n/g, '<br>'); target.dataset.done = '1'; target.classList.add('show');
    } catch (e) { target.innerHTML = '⚠️ Übersetzung geht gerade nicht: ' + esc(e.message || '') + '<br>' + kiKnopf(); target.classList.add('show'); }
    btn.disabled = false; btn.innerHTML = old;
  }
  function quizHtml(qs, pre) {
    return qs.map((q, qi) => {
      const order = q[1].map((o, i) => i).sort(() => Math.random() - 0.5);
      return '<div class="l-bq" data-q="' + pre + qi + '"><p class="l-q l-qs">' + (qi + 1) + '. ' + esc(q[0]) + '</p><div class="l-opts">' +
        order.map(i => '<button type="button" class="l-opt" data-qo="' + i + '">' + esc(q[1][i]) + '</button>').join('') + '</div></div>';
    }).join('');
  }
  function wireQuiz(qs, pre, onAll) {
    let answered = 0, right = 0;
    document.querySelectorAll('[data-q^="' + pre + '"]').forEach(box => {
      const qi = +box.dataset.q.slice(pre.length);
      box.querySelectorAll('[data-qo]').forEach(b => b.onclick = () => {
        if (box.dataset.done) return; box.dataset.done = '1';
        const ok = +b.dataset.qo === qs[qi][2]; answered++; if (ok) right++;
        box.querySelectorAll('[data-qo]').forEach(x => { x.disabled = true; if (+x.dataset.qo === qs[qi][2]) x.classList.add('right'); });
        if (!ok) b.classList.add('wrong');
        if (answered === qs.length) onAll(right, qs.length);
      });
    });
  }
  function quizResult(el, right, n) {
    el.innerHTML = '<div class="l-fb ' + (right === n ? 'ok' : (right >= n / 2 ? 'mid' : 'bad')) + '"><b>' + right + ' / ' + n + ' richtig</b>' +
      (right < n ? '<p>Lies oder hör noch einmal und versuch es dann wieder.</p>' : '') + '</div>';
    if (right === n) lSpeak('Sehr gut!', false);
  }

  // ----- Einheitsseite (Inhaltsverzeichnis wie im Buch) -----
  async function showUnit(level, unit) {
    stopAll();
    L.view = 'unit'; topbar();
    body('<div class="l-loading"><div class="l-spin"></div>Einen Moment …</div>');
    let u;
    try { u = await getBook(level, unit); }
    catch (e) {
      body('<div class="l-card">❌ Die Einheit konnte nicht geladen werden.<br><small>' + esc(e.message) + '</small><br><br><button type="button" class="l-btn l-primary" id="lRetry">Nochmal</button></div>');
      $('lRetry').onclick = () => showUnit(level, unit); return;
    }
    L.bk = {level, unit, u};
    const p = prof(), lv = levelObj(level), cur = p.level === level && p.unit === unit;
    const sec = (id, ic, de, k, part, extra, n) => '<button type="button" class="l-sec" data-sec="' + id + '"><span class="l-sec-ic">' + ic + '</span><span class="l-sec-t">' +
      bi(de, k) + (extra ? '<small>' + esc(extra) + '</small>' : '') + '</span><span class="l-sec-ok">' + (part && allDone(level, unit, part, n || 1) ? '✅' : '') + '</span></button>';
    const ngrp = new Set(u.words.map(w => w.grp)).size, cnt = (n, one, many) => n + ' ' + (n === 1 ? one : many);
    const lessons = lessonsFor(level);
    const pp = prof(), fremd = pp && pp.level !== level;
    let h = '<div class="l-lhead">' + lvChip(level) + '<small>Einheit ' + (unit + 1) + ' von ' + lv.units.length + '</small></div>' +
      (fremd ? '<div class="l-lvwarn lvc-' + level + '"><p>Das ist eine Einheit aus <b>' + esc(lvInfo(level).kurz) + '</b> – du lernst gerade <b>' + esc(lvInfo(pp.level).kurz) + '</b>.</p><button type="button" class="l-btn" id="lToLv">Zu ' + esc(lvInfo(level).kurz) + ' wechseln</button></div>' : '') +
      '<h2 class="l-h">' + esc(u.title) + '</h2>' + (u.goals ? '<p class="l-note">🎯 ' + esc(u.goals) + '</p>' : '') +
      '<h3 class="l-h3">📖 Kursbuch</h3><div class="l-secs">' +
      sec('words', '🔤', 'Wortschatz', 'words', 'w', u.words.length + ' Wörter · ' + cnt(ngrp, 'Gruppe', 'Gruppen')) +
      sec('cards', '🃏', 'Karteikarten', 'cards', 'c', cnt(ngrp, 'Päckchen', 'Päckchen')) +
      sec('phrases', '💬', 'Redemittel', 'phrases', '', u.phrases.length + ' Sätze') +
      sec('grammar', '📐', 'Grammatik', 'gram', 'g', u.grammars.length > 1 ? cnt(u.grammars.length, 'Thema', 'Themen') : u.grammar.title) +
      sec('read', '📖', 'Lesen', 'read', 'r', u.reads.length > 1 ? cnt(u.reads.length, 'Text', 'Texte') : u.read.title, u.reads.length) +
      sec('hear', '🎧', 'Hören', 'hear', 'd', u.dialogs.length > 1 ? cnt(u.dialogs.length, 'Hörtext', 'Hörtexte') : u.dialog.title, u.dialogs.length) +
      sec('write', '✍️', 'Schreiben', 'write', 's', cnt(u.writes.length, 'Aufgabe', 'Aufgaben'), u.writes.length) +
      sec('print', '🖨️', 'Drucken / PDF', 'print', '') + '</div>' +
      '<h3 class="l-h3">🧑‍🏫 ' + bi('Übungen mit dem KI-Lehrer', 'exercises') + '</h3><div class="l-list">' +
      lessons.map(ls => {
        const done = p.done[level + ':' + unit + ':' + ls.id] != null, here = cur && p.lesson === ls.id;
        return '<button type="button" class="l-unit' + (here ? ' cur' : '') + '" data-les="' + ls.id + '"><span>' + (done ? '✅' : (here ? '▶️' : '○')) + ' ' +
          ls.id + '. ' + esc(ls.name) + (window.SDLernAPI.fokus(u.words, ls.id, level === 'alpha').length ? ' <small class="l-sub">· 📚 ' + window.SDLernAPI.fokus(u.words, ls.id, level === 'alpha').length + ' Wörter</small>' : '') + '</span><span class="l-sub">' + (done ? p.done[level + ':' + unit + ':' + ls.id] + ' %' : '') + '</span></button>';
      }).join('') + '</div>' +
      '<p class="l-note">Die Kursbuch-Inhalte sind fest geschrieben (nicht von der KI). Die Übungen erstellt der KI-Lehrer passend zur Einheit.</p>';
    body(h);
    if ($('lToLv')) $('lToLv').onclick = () => { setLevel(level); showHome(); };
    document.querySelectorAll('[data-sec]').forEach(b => b.onclick = () => ({words: showWords, cards: () => showCards(), phrases: showPhrases, grammar: showGrammar,
      read: () => showRead(0), hear: () => showHear(0), write: () => showWrite(0), print: printUnit})[b.dataset.sec]());
    document.querySelectorAll('[data-les]').forEach(b => b.onclick = () => {
      const n = +b.dataset.les, p2 = prof();
      if (!(p2.level === level && p2.unit === unit)) {
        if (!confirm('Mit „' + u.title + '“ weitermachen? Dein Platz auf dem Lernweg wird hierher verschoben.')) return;
        if (p2.level !== level) setLevel(level);
        p2.unit = unit; p2.finished = false; topbar();
      }
      p2.lesson = n; save(); startLesson(level, unit, n);
    });
  }

  // ----- Wortschatz -----
  function showWords() {
    const b = L.bk, u = b.u; L.view = 'book-words';
    let h = bookHead('🔤 ' + bi('Wortschatz', 'words')) +
      '<p class="l-note"><span class="a-der">der</span> = maskulin · <span class="a-die">die</span> = feminin · <span class="a-das">das</span> = neutral · Tippe auf 🔊 zum Hören.</p>' +
      '<div class="l-wlist">' + u.words.map((w, i) => (i === 0 || u.words[i - 1].grp !== w.grp ? '<h3 class="l-h3 l-grp">' + esc(w.grp) + ' <small>(' + u.words.filter(x => x.grp === w.grp).length + ')</small></h3>' : '') +
        '<div class="l-wrow"><button type="button" class="l-btn l-icon l-sp" data-say="' + esc(w.de) + '" aria-label="Hören">🔊</button>' +
        '<div class="l-wtxt"><div>' + picEmo(w) + wordHtml(w) + (w.pl ? ' <span class="l-pl">· Pl. ' + esc(w.pl) + '</span>' : '') + '</div>' +
        '<div class="l-l1 l-wl1"' + l1Attr() + '>' + esc(w.l1) + '</div></div></div>').join('') + '</div>' +
      '<button type="button" class="l-btn l-primary" id="lToCards">🃏 ' + bi('Mit Karteikarten üben', 'cards') + '</button>';
    body(h); wireCommon();
    bookMark(b.level, b.unit, 'w');
    $('lToCards').onclick = () => showCards();
  }

  // ----- Karteikarten -----
  function showCards(grp) {
    const b = L.bk; L.view = 'book-cards';
    const grps = [...new Set(b.u.words.map(w => w.grp))];
    if (grp === undefined && grps.length > 1) {
      body(bookHead('🃏 ' + bi('Karteikarten', 'cards')) + '<p class="l-note">Wähle ein Päckchen:</p><div class="l-list">' +
        grps.map((g, i) => '<button type="button" class="l-unit" data-pack="' + i + '"><span>' + (bookDone(b.level, b.unit, 'c:' + g) ? '✅' : '🃏') + ' ' + esc(g) +
          '</span><span class="l-sub">' + b.u.words.filter(w => w.grp === g).length + ' Karten</span></button>').join('') + '</div>');
      document.querySelectorAll('[data-pack]').forEach(x => x.onclick = () => showCards(grps[+x.dataset.pack]));
      return;
    }
    if (grp === undefined) grp = grps[0];
    const deck = b.u.words.map((w, i) => i).filter(i => b.u.words[i].grp === grp).sort(() => Math.random() - 0.5);
    const st = {deck, pos: 0, known: 0, again: []};
    const draw = () => {
      if (st.pos >= st.deck.length) {
        if (st.again.length) { st.deck = st.again.sort(() => Math.random() - 0.5); st.again = []; st.pos = 0; }
        else {
          bookMark(b.level, b.unit, 'c:' + grp);
          if (grps.every(g => bookDone(b.level, b.unit, 'c:' + g))) bookMark(b.level, b.unit, 'c');
          body(bookHead('') + '<div class="l-card l-center"><div class="l-big-ic">🃏</div><h2>Alle Karten gelernt!</h2><p class="l-note">' + esc(grp) + '</p>' +
            '<button type="button" class="l-btn l-primary" id="lAgainC">' + bi('Nochmal', 'again') + '</button>' +
            (grps.length > 1 ? '<button type="button" class="l-btn" id="lPacks">🃏 Anderes Päckchen</button>' : '') + '</div>');
          lSpeak('Super! Alle Karten gelernt.', false); $('lAgainC').onclick = () => showCards(grp);
          if ($('lPacks')) $('lPacks').onclick = () => showCards(); return;
        }
      }
      const w = b.u.words[st.deck[st.pos]];
      body(bookHead('🃏 ' + bi('Karteikarten', 'cards')) + '<p class="l-note">' + esc(grp) + ' · Karte ' + (st.pos + 1) + ' / ' + st.deck.length + (st.again.length ? ' · noch üben: ' + st.again.length : '') + '</p>' +
        '<button type="button" class="l-flash" id="lFlash">' + picBox(w) + '<div class="l-fl-front">' + wordHtml(w) + '</div>' +
        '<div class="l-fl-back"><div class="l-l1"' + l1Attr() + '>' + esc(w.l1) + '</div>' + (w.pl ? '<div class="l-pl">Plural: ' + esc(w.pl) + '</div>' : '') + '</div>' +
        '<small class="l-fl-hint">' + bi('Tippen zum Umdrehen', 'flip') + '</small></button>' +
        '<div class="l-row">' + btnSpeak(w.de) + '</div>' +
        '<div class="l-grid l-cardbtns"><button type="button" class="l-btn l-bad" id="lCAgain">↻ ' + bi('Noch üben', 'practice') + '</button>' +
        '<button type="button" class="l-btn l-good" id="lCKnow">✓ ' + bi('Weiß ich', 'know') + '</button></div>');
      wireCommon(); lSpeak(w.de, slowFor());
      $('lFlash').onclick = () => $('lFlash').classList.toggle('flipped');
      $('lCKnow').onclick = () => { addWeak(w.de, -1); srsAdd(w.de, 2); st.known++; st.pos++; draw(); };
      $('lCAgain').onclick = () => { addWeak(w.de, 1); srsAdd(w.de, 1); st.again.push(st.deck[st.pos]); st.pos++; draw(); };
    };
    draw();
  }

  // ----- Redemittel -----
  function showPhrases() {
    const b = L.bk; L.view = 'book-phrases';
    body(bookHead('💬 ' + bi('Redemittel', 'phrases')) + '<p class="l-note">Wichtige Sätze für diese Situation. Hör zu und sprich nach.</p>' +
      '<div class="l-wlist">' + b.u.phrases.map((ph, i) => '<div class="l-wrow"><button type="button" class="l-btn l-icon l-sp" data-say="' + esc(ph) + '" aria-label="Hören">🔊</button>' +
        '<div class="l-wtxt l-de">' + esc(ph) + '</div></div>').join('') + '</div>' +
      '<div class="l-card l-center"><p class="l-hint">' + bi('Sprich einen Satz – ich prüfe die Aussprache', 'speak') + '</p>' + micUi() + '<div id="lFb"></div></div>');
    wireCommon();
    attachMic(t => {
      let best = null;
      b.u.phrases.forEach(ph => { const r = sayScore(ph.replace(/…/g, ''), t); if (!best || r.score > best.score) best = Object.assign({ph}, r); });
      const marked = best.toks.map((tk, i) => '<span class="' + (best.marks[i] ? 'w-ok' : 'w-bad') + '">' + esc(tk) + '</span>').join(' ');
      $('lFb').innerHTML = '<div class="l-fb ' + (best.score >= 0.8 ? 'ok' : (best.score >= 0.5 ? 'mid' : 'bad')) + '"><b>' + marked + '</b><p>Ich habe verstanden: „' + esc(t) + '“</p></div>';
    });
  }

  // ----- Grammatik -----
  function grammarHtml(g) {
    return '<div class="l-tablewrap"><table class="l-table"><thead><tr>' + g.head.map(x => '<th>' + esc(x) + '</th>').join('') + '</tr></thead><tbody>' +
      g.rows.map(r => '<tr>' + r.map(c => '<td>' + esc(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>' +
      '<div class="l-gbox"><p class="l-de l-left">💡 ' + esc(g.de) + '</p><div class="l-l1"' + l1Attr() + '>' + l1h(g.l1) + '</div></div>' + gramTip(g);
  }
  // Merk-Trick + YouTube-Suche zum Thema
  function gramTip(g) {
    if (!g.tip) return '';
    return '<div class="l-gtip"><b>🧠 ' + bi('Merk-Trick', 'trick') + '</b><p>' + esc(g.tip.de) + '</p>' + l1(g.tip.l1) +
      '<a class="l-btn l-yt" href="https://www.youtube.com/results?search_query=' + encodeURIComponent(g.tip.q) + '" target="_blank" rel="noopener">🎬 ' + bi('Videos dazu auf YouTube', 'videos') + '</a></div>';
  }
  function channelsHtml(chs) {
    if (!chs || !chs.length) return '';
    return '<details class="l-level l-chans"><summary>🎬 Gute Deutsch-Kanäle auf YouTube</summary><p class="l-note">Diese Kanäle sind von anderen Anbietern und öffnen sich auf YouTube.</p>' +
      chs.map(c => '<a class="l-vid" href="' + esc(c.url) + '" target="_blank" rel="noopener"><span class="l-vid-play l-chan-ic">▶</span><span class="l-vid-t"><b>' + esc(c.name) + '</b><small>' + esc(c.lang) + ' · ' + esc(c.level) + '</small></span></a>').join('') + '</details>';
  }
  function showGrammar() {
    const b = L.bk, gs = b.u.grammars; L.view = 'book-grammar';
    body(bookHead(gs.length > 1 ? '📐 ' + bi('Grammatik', 'gram') : '📐 ' + esc(gs[0].title)) +
      (gs.length > 1 ? gs.map((g, i) => '<h3 class="l-gtitle">' + (i + 1) + '. ' + esc(g.title) + '</h3>' + grammarHtml(g)).join('') : grammarHtml(gs[0])) + '<div class="l-row"><button type="button" class="l-btn" id="lGAll">📐 ' + bi('Alle Grammatik-Themen', 'gram') + '</button></div>');
    bookMark(b.level, b.unit, 'g');
    $('lGAll').onclick = showGrammarAll;
  }

  // ----- Lesen -----
  function showRead(ix) {
    const b = L.bk, r = b.u.reads[ix || 0]; L.view = 'book-read'; b.part = 'r';
    body(bookHead('📖 ' + esc(r.title)) + tabs(b.u.reads.length, ix || 0, 'Text') +
      '<div class="l-card"><p class="l-text">' + esc(r.text) + '</p><div class="l-l1 hide" id="lRTr"' + l1Attr() + '></div>' +
      '<div class="l-row"><button type="button" class="l-btn l-icon" data-say="' + esc(r.text) + '">🔊 ' + bi('Vorlesen', 'listen') + '</button>' +
      '<button type="button" class="l-btn l-icon" id="lRTrB">🌐 ' + bi('Übersetzung', 'trans') + '</button></div></div>' +
      '<h3 class="l-h3">Fragen zum Text</h3>' + quizHtml(r.q, 'r') + '<div id="lQRes"></div>');
    wireCommon();
    $('lRTrB').onclick = () => translateBtn($('lRTrB'), r.text, $('lRTr'));
    wireTabs(showRead);
    wireQuiz(r.q, 'r', (right, n) => { quizResult($('lQRes'), right, n); if (right === n) bookMark(b.level, b.unit, pk('r', ix || 0)); });
  }

  // ----- Hoeren -----
  function showHear(ix) {
    const b = L.bk, d = b.u.dialogs[ix || 0]; L.view = 'book-hear'; b.part = 'd';
    const speakers = [...new Set(d.lines.map(x => x[0]))];
    const txt = d.lines.map(x => x[0] + ': ' + x[1]).join('\n');
    body(bookHead('🎧 ' + esc(d.title)) + tabs(b.u.dialogs.length, ix || 0, 'Hörtext') +
      '<div class="l-card l-center"><p class="l-hint">Hör zuerst gut zu. Dann beantworte die Fragen. Den Text kannst du danach lesen.</p>' +
      '<button type="button" class="l-mic l-play" id="lPlay"><span class="l-mic-ic">▶</span><span>' + bi('Abspielen', 'play') + '</span></button>' +
      '<div class="l-row"><button type="button" class="l-btn l-icon" id="lShowT">📄 ' + bi('Text zeigen', 'showtext') + '</button>' +
      '<button type="button" class="l-btn l-icon" id="lHTrB">🌐 ' + bi('Übersetzung', 'trans') + '</button></div></div>' +
      '<div class="l-card l-dialog" id="lDlg" style="display:none">' + d.lines.map((x, i) => '<p data-line="' + i + '"><b>' + esc(x[0]) + ':</b> ' + esc(x[1]) + '</p>').join('') +
      '<div class="l-l1 hide" id="lHTr"' + l1Attr() + '></div></div>' +
      '<h3 class="l-h3">Fragen zum Hörtext</h3>' + quizHtml(d.q, 'd') + '<div id="lQRes"></div>');
    let playing = false;
    $('lPlay').onclick = async () => {
      if (playing) { playing = false; lStopSpeak(); return; }
      playing = true; $('lPlay').classList.add('rec');
      for (let i = 0; i < d.lines.length && playing; i++) {
        document.querySelectorAll('[data-line]').forEach(e => e.classList.toggle('on', +e.dataset.line === i));
        await lSpeak(d.lines[i][1], slowFor(), VOICES[speakers.indexOf(d.lines[i][0]) % VOICES.length]);
        if (playing) await new Promise(r => setTimeout(r, 350));
      }
      playing = false; const pb = $('lPlay'); if (pb) pb.classList.remove('rec');
      document.querySelectorAll('[data-line]').forEach(e => e.classList.remove('on'));
    };
    $('lShowT').onclick = () => { const e = $('lDlg'); e.style.display = e.style.display === 'none' ? '' : 'none'; };
    $('lHTrB').onclick = () => { $('lDlg').style.display = ''; translateBtn($('lHTrB'), txt, $('lHTr')); };
    wireTabs(showHear);
    wireQuiz(d.q, 'd', (right, n) => { quizResult($('lQRes'), right, n); if (right === n) bookMark(b.level, b.unit, pk('d', ix || 0)); });
  }

  // ----- Schreiben -----
  function showWrite(ix) {
    ix = ix || 0;
    const b = L.bk, s = b.u.writes[ix]; L.view = 'book-write'; b.part = 's';
    const dk = 'sdLearnDraft|' + prof().id + '|' + b.level + '|' + b.unit + (ix ? '|' + ix : '');
    let draft = ''; try { draft = localStorage.getItem(dk) || ''; } catch (e) {}
    body(bookHead('✍️ ' + bi('Schreiben', 'write')) + tabs(b.u.writes.length, ix, 'Aufgabe') +
      '<div class="l-card"><p class="l-q l-qs">' + esc(s.task) + '</p><div class="l-l1 hide" id="lWTr"' + l1Attr() + '></div>' +
      '<div class="l-row l-rowl"><button type="button" class="l-btn l-icon" data-say="' + esc(s.task) + '">🔊</button>' +
      '<button type="button" class="l-btn l-icon" id="lWTrB">🌐 ' + bi('Übersetzung', 'trans') + '</button></div>' +
      '<textarea id="lWIn" class="l-input l-area" rows="7" placeholder="Hier schreiben …" spellcheck="false" autocapitalize="sentences">' + esc(draft) + '</textarea>' +
      '<button type="button" class="l-btn l-primary" id="lWChk">✅ ' + bi('Korrigieren lassen', 'correct') + '</button><div id="lWRes"></div>' +
      '<button type="button" class="l-btn" id="lWModel">💡 ' + bi('Musterlösung', 'model') + '</button>' +
      '<div class="l-model" id="lWM" style="display:none"><p class="l-de l-left">' + esc(s.model) + '</p><div class="l-row l-rowl">' +
      '<button type="button" class="l-btn l-icon" data-say="' + esc(s.model) + '">🔊</button></div></div></div>');
    wireCommon(); wireTabs(showWrite);
    $('lWIn').addEventListener('input', () => { try { localStorage.setItem(dk, $('lWIn').value); } catch (e) {} });
    $('lWTrB').onclick = () => translateBtn($('lWTrB'), s.task, $('lWTr'));
    $('lWModel').onclick = () => { const e = $('lWM'); e.style.display = e.style.display === 'none' ? '' : 'none'; };
    $('lWChk').onclick = async () => {
      const text = $('lWIn').value.trim();
      if (text.length < 2) { $('lWIn').focus(); return; }
      const btn = $('lWChk'); btn.disabled = true; $('lWRes').innerHTML = '<div class="l-loading" style="padding:14px"><div class="l-spin"></div>Der Lehrer liest deinen Text …</div>';
      let d;
      try {
        d = await (await fetch('/learn/write', {method: 'POST', headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({level: b.level, unit: b.unit, lang: prof().lang, text, task: ix})})).json();
      } catch (e) { d = {ok: false, error: 'Keine Verbindung zum Server'}; }
      btn.disabled = false;
      if (!d.ok) { $('lWRes').innerHTML = '<div class="l-fb bad">⚠️ ' + esc(d.error || 'Fehler') + '<br>' + kiKnopf() + '</div>'; return; }
      const cls = d.score >= 80 ? 'ok' : (d.score >= 50 ? 'mid' : 'bad');
      $('lWRes').innerHTML = '<div class="l-fb ' + cls + '"><b>' + d.score + ' / 100</b>' + (d.praise ? '<p>👍 ' + esc(d.praise) + '</p>' : '') +
        (d.missing_l1 ? '<div class="l-l1"' + l1Attr() + '>📝 ' + l1h(d.missing_l1) + '</div>' : '') + '</div>' +
        (d.tips.length ? '<div class="l-tips">' + d.tips.map(t => '<div class="l-tip"><span class="w-bad">' + esc(t.wrong) + '</span> → <span class="w-ok">' + esc(t.right) + '</span>' +
          (t.why_l1 ? '<div class="l-l1"' + l1Attr() + '>' + l1h(t.why_l1) + '</div>' : '') + '</div>').join('') + '</div>' : '') +
        '<div class="l-model"><small class="l-note">Korrigierter Text:</small><p class="l-de l-left">' + esc(d.corrected) + '</p></div>';
      d.tips.forEach(t => t.right && addWeak(t.right, 1));
      if (d.score >= 60) bookMark(b.level, b.unit, pk('s', ix));
      lSpeak(d.score >= 80 ? 'Sehr gut geschrieben!' : 'Schau dir die Verbesserungen an.', false);
    };
  }

  // ----- Drucken -----
  function printUnit() {
    const b = L.bk, u = b.u, lv = levelObj(b.level);
    let pr = document.getElementById('lPrint');
    if (!pr) { pr = document.createElement('div'); pr.id = 'lPrint'; document.body.appendChild(pr); }
    const fa = isFa();
    const qList = qs => '<ol>' + qs.map(q => '<li>' + esc(q[0]) + '<br>' + q[1].slice().sort().map(o => '☐ ' + esc(o)).join(' &nbsp; ') + '</li>').join('') + '</ol>';
    const tbl = g => '<table><thead><tr>' + g.head.map(x => '<th>' + esc(x) + '</th>').join('') + '</tr></thead><tbody>' +
      g.rows.map(r => '<tr>' + r.map(c => '<td>' + esc(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table><p>' + esc(g.de) + '</p><p' + (fa ? ' dir="rtl"' : '') + '>' + esc(g.l1) + '</p>';
    let wl = '', lastG = null;
    u.words.forEach(w => { if (w.grp !== lastG) { wl += '<tr><th colspan="3">' + esc(w.grp) + '</th></tr>'; lastG = w.grp; }
      wl += '<tr><td><b>' + esc(w.de) + '</b></td><td>' + esc(w.pl) + '</td><td' + (fa ? ' dir="rtl"' : '') + '>' + esc(w.l1) + '</td></tr>'; });
    pr.innerHTML = '<h1>' + esc(lv.name) + ' · Einheit ' + (b.unit + 1) + ': ' + esc(u.title) + '</h1>' +
      '<h2>Wortschatz</h2><table><tbody>' + wl + '</tbody></table>' +
      '<h2>Redemittel</h2><ul>' + u.phrases.map(x => '<li>' + esc(x) + '</li>').join('') + '</ul>' +
      u.grammars.map(g => '<h2>Grammatik: ' + esc(g.title) + '</h2>' + tbl(g)).join('') +
      u.reads.map(r => '<h2>Lesen: ' + esc(r.title) + '</h2><p>' + esc(r.text) + '</p>' + qList(r.q)).join('') +
      u.dialogs.map(d => '<h2>Hören / Dialog: ' + esc(d.title) + '</h2>' + d.lines.map(x => '<p><b>' + esc(x[0]) + ':</b> ' + esc(x[1]) + '</p>').join('') + qList(d.q)).join('') +
      u.writes.map((w, i) => '<h2>Schreiben ' + (u.writes.length > 1 ? i + 1 : '') + '</h2><p>' + esc(w.task) + '</p><div class="pr-lines"></div>').join('') +
      '<h2>Lösungen</h2>' + u.reads.map(r => '<p>' + esc(r.title) + ': ' + r.q.map((q, i) => (i + 1) + ') ' + esc(q[1][0])).join(' · ') + '</p>').join('') +
      u.dialogs.map(d => '<p>' + esc(d.title) + ': ' + d.q.map((q, i) => (i + 1) + ') ' + esc(q[1][0])).join(' · ') + '</p>').join('') +
      u.writes.map((w, i) => '<p><i>Musterlösung' + (u.writes.length > 1 ? ' ' + (i + 1) : '') + ':</i> ' + esc(w.model) + '</p>').join('') + '<p class="pr-foot">SD – Deutsch lernen</p>';
    document.body.classList.add('learn-print');
    const done = () => { document.body.classList.remove('learn-print'); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    setTimeout(() => { try { window.print(); } catch (e) {} setTimeout(done, 1500); }, 100);
  }

  // ----- Woerterbuch -----
  let DICT = null;
  async function showDict() {
    stopAll(); L.view = 'dict'; topbar();
    const p = prof();
    body('<div class="l-loading"><div class="l-spin"></div>Einen Moment …</div>');
    if (!DICT || DICT.lang !== p.lang) {
      try { const d = await (await fetch('/learn/dictionary?lang=' + encodeURIComponent(p.lang))).json(); DICT = {lang: p.lang, words: d.words || []}; }
      catch (e) { body('<div class="l-card">❌ Wörterbuch konnte nicht geladen werden.</div>'); return; }
    }
    let lvF = p.level;
    body('<h2 class="l-h">🔤 ' + bi('Wörterbuch', 'dict') + ' ' + lvChip(p.level) + '</h2><input id="lDQ" class="l-input" placeholder="Suchen … (Deutsch, ' + esc(SPRACHEN[spr()].name) + ')" autocomplete="off" spellcheck="false">' +
      '<div class="l-chips">' + ['', 'alpha', 'A1', 'A2', 'B1'].map(id => '<button type="button" class="l-chip' + (id === lvF ? ' on' : '') + '" data-lvf="' + id + '">' + (id ? esc(lvInfo(id).kurz) : 'Alle') + '</button>').join('') + '</div>' +
      '<p class="l-note" id="lDN"></p><div class="l-wlist" id="lDL"></div>');
    const render = () => {
      const q = norm($('lDQ').value), ql = ($('lDQ').value || '').trim().toLowerCase();
      const res = DICT.words.filter(w => (!lvF || w.level === lvF) && (!q || norm(w.de).includes(q) || (w.l1 || '').toLowerCase().includes(ql)));
      $('lDN').textContent = res.length + ' Wörter' + (res.length > 150 ? ' (die ersten 150 werden gezeigt)' : '');
      $('lDL').innerHTML = res.slice(0, 150).map(w => '<div class="l-wrow"><button type="button" class="l-btn l-icon l-sp" data-say="' + esc(w.de) + '" aria-label="Hören">🔊</button>' +
        '<div class="l-wtxt"><div>' + picEmo(w) + wordHtml(w) + (w.pl ? ' <span class="l-pl">· Pl. ' + esc(w.pl) + '</span>' : '') + '</div><div class="l-l1 l-wl1"' + l1Attr() + '>' + esc(w.l1) + '</div></div>' +
        '<button type="button" class="l-wu lvc-' + w.level + '" data-go="' + w.level + ':' + w.unit + '">' + esc(lvInfo(w.level).kurz) + ' · ' + (w.unit + 1) + '</button></div>').join('');
      $('lDL').querySelectorAll('[data-say]').forEach(b => b.onclick = () => lSpeak(b.dataset.say, slowFor()));
      $('lDL').querySelectorAll('[data-go]').forEach(b => b.onclick = () => { const [a, c] = b.dataset.go.split(':'); showUnit(a, +c); });
    };
    $('lDQ').addEventListener('input', render);
    document.querySelectorAll('[data-lvf]').forEach(b => b.onclick = () => {
      lvF = b.dataset.lvf; document.querySelectorAll('[data-lvf]').forEach(x => x.classList.toggle('on', x === b)); render();
    });
    render();
  }

  // ----- Grammatik-Uebersicht -----
  async function showGrammarAll() {
    stopAll(); L.view = 'gramall'; topbar();
    const p = prof();
    body('<div class="l-loading"><div class="l-spin"></div>Einen Moment …</div>');
    let gs;
    let chs = [];
    try { const gd = await (await fetch('/learn/grammar?lang=' + encodeURIComponent(p.lang))).json(); gs = gd.grammar || []; chs = gd.channels || []; }
    catch (e) { body('<div class="l-card">❌ Grammatik konnte nicht geladen werden.</div>'); return; }
    let gF = p.level;
    body('<h2 class="l-h">📐 ' + bi('Grammatik-Übersicht', 'gram') + '</h2><p class="l-note">Gezeigt wird dein Niveau. Tippe auf ein Thema – bei jedem gibt es einen 🧠 Merk-Trick und Videos.</p>' +
      '<div class="l-chips">' + LEVEL_IDS.map(id => '<button type="button" class="l-chip' + (id === gF ? ' on' : '') + '" data-gf="' + id + '">' + esc(lvInfo(id).kurz) + (id === p.level ? ' ✔' : '') + '</button>').join('') + '</div>' +
      '<div id="lGL"></div>' + channelsHtml(chs));
    const render = () => {
      let h = '<h3 class="l-h3">' + lvChip(gF) + ' ' + esc(levelObj(gF).name) + '</h3>';
      gs.filter(g => g.level === gF).forEach(g => {
        h += '<details class="l-level l-gram"><summary>' + esc(g.title) + ' <small>Einheit ' + (g.unit + 1) + '</small></summary>' + grammarHtml(g) +
          '<button type="button" class="l-btn" data-go="' + g.level + ':' + g.unit + '">📖 Zur Einheit „' + esc(g.unit_title) + '“</button></details>';
      });
      $('lGL').innerHTML = h;
      $('lGL').querySelectorAll('[data-go]').forEach(b => b.onclick = () => { const [a, c] = b.dataset.go.split(':'); showUnit(a, +c); });
      wireCommon();
    };
    document.querySelectorAll('[data-gf]').forEach(b => b.onclick = () => { gF = b.dataset.gf; document.querySelectorAll('[data-gf]').forEach(x => x.classList.toggle('on', x === b)); render(); });
    render();
  }

  window._sdLearnBook = {showUnit, showDict, showGrammarAll};
  window._sdSync = {now: syncNow, info: () => SYNC, daysOf: () => daysOf(prof()), DEV};
  window._sdPics = {wikiPhoto, cache: () => PICC};
  window._sdTrain = {streak: () => streak(prof()), srs: () => srs(), dayNum, dictMarks, qPlural};

  // =================== TRAINING (ohne KI) ===================
  const SRS_DAYS = [0, 0, 1, 2, 4, 7, 15, 30];          // Abstand in Tagen je Kasten 1..7
  const pad2 = n => (n < 10 ? '0' : '') + n;
  function todayStr(d) { d = d || new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  function dayNum(s) { const [y, m, d] = (s || todayStr()).split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / 86400000); }
  // ----- Bilder: Emoji zu jedem passenden Wort, bei greifbaren Dingen zusätzlich ein Foto aus Wikipedia -----
  const PIC_KEY = 'sdLearnPics';
  let PICC = {}; try { PICC = JSON.parse(localStorage.getItem(PIC_KEY) || '{}') || {}; } catch (e) {}
  const nounOf = w => (w.art ? w.de.slice(w.art.length + 1) : w.de).split(' / ')[0].replace(/ \(.*$/, '');
  function picEmo(w) { return w && w.pic ? '<span class="l-pic" aria-hidden="true">' + esc(w.pic) + '</span>' : ''; }
  function picBox(w, small) {
    if (!w || !w.pic) return '';
    return '<div class="l-picbox' + (small ? ' sm' : '') + '" data-emo="' + esc(w.pic) + '"' + (w.ph ? ' data-photo="' + esc(nounOf(w)) + '"' : '') + '><span class="l-pic-big" aria-hidden="true">' + esc(w.pic) + '</span></div>';
  }
  async function wikiPhoto(t) {
    if (Object.prototype.hasOwnProperty.call(PICC, t)) return PICC[t];
    try {
      const u = 'https://de.wikipedia.org/w/api.php?action=query&format=json&origin=*&redirects=1&prop=pageimages%7Cpageprops&piprop=thumbnail&pithumbsize=480&ppprop=disambiguation&titles=' + encodeURIComponent(t);
      const d = await (await fetch(u)).json();
      const pg = Object.values((d.query && d.query.pages) || {})[0] || {};
      const dis = pg.pageprops && Object.prototype.hasOwnProperty.call(pg.pageprops, 'disambiguation');
      const r = pg.thumbnail && pg.thumbnail.source && !dis ? {src: pg.thumbnail.source, page: 'https://de.wikipedia.org/wiki/' + encodeURIComponent((pg.title || t).replace(/ /g, '_'))} : null;
      PICC[t] = r; try { localStorage.setItem(PIC_KEY, JSON.stringify(PICC)); } catch (e) {}
      return r;
    } catch (e) { return null; }   // offline: Emoji bleibt, später nochmal versuchen
  }
  function photosOn() { const p = prof(); return !p || p.photos !== false; }
  function loadPhotos() {
    if (!photosOn()) return;
    document.querySelectorAll('.l-picbox[data-photo]:not([data-tried])').forEach(async el => {
      el.dataset.tried = '1';
      const r = await wikiPhoto(el.dataset.photo);
      if (!r || !el.isConnected) return;
      const img = new Image(); img.alt = el.dataset.photo; img.className = 'l-photo'; img.referrerPolicy = 'no-referrer';
      img.onload = () => { if (!el.isConnected) return; el.innerHTML = ''; el.appendChild(img);
        el.insertAdjacentHTML('beforeend', '<a class="l-credit" href="' + esc(r.page) + '" target="_blank" rel="noopener">📷 Wikipedia</a>' +
          '<span class="l-nophoto" role="button" tabindex="0" title="Foto passt nicht – ausblenden">✕</span>');
        el.classList.add('has-photo');
        const x = el.querySelector('.l-nophoto');
        x.onclick = ev => { ev.stopPropagation(); ev.preventDefault(); PICC[el.dataset.photo] = null; try { localStorage.setItem(PIC_KEY, JSON.stringify(PICC)); } catch (e) {}
          el.classList.remove('has-photo'); el.innerHTML = '<span class="l-pic-big" aria-hidden="true">' + esc(el.dataset.emo || '') + '</span>'; };
        el.querySelector('.l-credit').onclick = ev => ev.stopPropagation(); };
      img.src = r.src;
    });
  }
  new MutationObserver(() => { if (document.querySelector('.l-picbox[data-photo]:not([data-tried])')) loadPhotos(); })
    .observe(document.documentElement, {childList: true, subtree: true});

  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  function gain(n) { const p = prof(); if (!p || !n) return; p.xp = (p.xp || 0) + n; save(); }
  function streak(p) {
    const days = daysOf(p); let n = 0; let d = dayNum();
    if (!(days[todayStr()] > 0)) d -= 1;                  // heute noch nichts: Serie bis gestern zählt
    for (;;) {
      const dt = new Date(d * 86400000); const k = dt.getUTCFullYear() + '-' + pad2(dt.getUTCMonth() + 1) + '-' + pad2(dt.getUTCDate());
      if (days[k] > 0) { n++; d--; } else break;
    }
    return n;
  }

  // ----- Wörter- und Satz-Vorrat bis zum aktuellen Stand -----
  const POOLC = {};
  // Training übt NUR das gewählte Niveau (alle Einheiten davon) – die aktuelle Einheit kommt zuerst dran
  async function getPool() {
    const p = prof(), k = p.lang + '|' + p.level;
    if (POOLC[k]) return POOLC[k];
    const d = await (await fetch('/learn/pool?level=' + encodeURIComponent(p.level) + '&unit=99&lang=' + encodeURIComponent(p.lang))).json();
    if (!d.ok) throw new Error('Pool');
    const r = {ok: true, words: d.words.filter(w => w.level === p.level), sentences: d.sentences.filter(x => x.level === p.level)};
    POOLC[k] = r; return r;
  }
  const naehe = (w, p) => w.unit === p.unit ? 0 : (w.unit < p.unit ? 1 : 2);
  const simpleNoun = w => !!w.art && /^(der|die|das) [A-ZÄÖÜ][A-Za-zÄÖÜäöüß-]+$/.test(w.de);

  // ----- Karteikasten (SRS) -----
  function srs() { const p = prof(); p.srs = p.srs || {}; return p.srs; }
  function srsAdd(de, box) { const s = srs(); if (!s[de]) { s[de] = [box || 1, dayNum()]; save(); } }
  function srsGrade(de, ok) {
    const s = srs(), e = s[de] || [1, dayNum()];
    const box = ok ? Math.min(7, e[0] + 1) : 1;
    s[de] = [box, dayNum() + (ok ? SRS_DAYS[box] : 0)];
    addWeak(de, ok ? -1 : 1);
    save();
  }
  const srsDue = () => { const s = srs(), t = dayNum(); return Object.keys(s).filter(k => s[k][1] <= t); };

  function trainHead(title) { const p = prof(); return '<div class="l-lhead">' + lvChip(p.level, 'Training') + '<small>Nur Wörter und Sätze aus ' + esc(lvInfo(p.level).kurz) + '</small></div><h2 class="l-h">' + title + '</h2>'; }
  function trainLoading() { body('<div class="l-loading"><div class="l-spin"></div>Einen Moment …</div>'); }
  function trainError() { body('<div class="l-card">❌ Das Training konnte nicht geladen werden. Bitte Internet prüfen.</div>'); }
  function trainDone(icon, title, right, n, again) {
    const pct = n ? Math.round(right / n * 100) : 0;
    body('<div class="l-card l-center"><div class="l-big-ic">' + icon + '</div><h2>' + esc(title) + '</h2><p class="l-q">' + right + ' / ' + n + ' richtig (' + pct + ' %)</p>' +
      '<p class="l-note">⭐ ' + (prof().xp || 0) + ' · 🔥 ' + streak(prof()) + ' Tage</p>' +
      '<button type="button" class="l-btn l-primary" id="lTAgain">' + bi('Nochmal', 'again') + '</button>' +
      '<button type="button" class="l-btn" id="lTHome">Zur Übersicht</button></div>');
    lSpeak(pct >= 80 ? 'Sehr gut gemacht!' : 'Gut geübt! Weiter so.', false);
    $('lTAgain').onclick = again; $('lTHome').onclick = showHome;
  }

  // ----- Startseite: Serie, Tagesziel, Wort des Tages, Training -----
  async function homeTraining() {
    const box = $('lTrain'); if (!box) return;
    const p = prof(), goal = p.goal || 30, today = daysOf(p)[todayStr()] || 0, st = streak(p), due = srsDue().length;
    let wotd = '';
    try {
      const pool = await getPool(), ws = pool.words;
      const list = ws.length ? ws : pool.words;
      if (list.length) {
        const w = list[dayNum() % list.length];
        wotd = '<div class="l-wotd' + (w.pic ? ' has-pic' : '') + '"><small>✨ ' + bi('Wort des Tages', 'wotd') + '</small>' + picBox(w, true) + '<div class="l-wotd-w">' + wordHtml(w) +
          (w.pl ? ' <span class="l-pl">· Pl. ' + esc(w.pl) + '</span>' : '') + '</div><div class="l-l1"' + l1Attr() + '>' + esc(w.l1) + '</div>' +
          '<button type="button" class="l-btn l-icon" data-say="' + esc(w.de) + '">🔊</button></div>';
      }
    } catch (e) { /* ohne Wort des Tages weiter */ }
    if (!$('lTrain')) return;
    box.innerHTML =
      '<div class="l-streak"><div class="l-fire">🔥 <b>' + st + '</b> <small>' + (st === 1 ? 'Tag' : 'Tage') + '</small></div>' +
      '<div class="l-goal"><small>' + bi('Tagesziel', 'goal') + ': ' + Math.min(today, goal) + ' / ' + goal + ' ⭐</small>' +
      '<div class="l-progress"><div style="width:' + Math.min(100, Math.round(today / goal * 100)) + '%"></div></div></div>' +
      '<button type="button" class="l-btn l-icon" id="lGoalBtn" aria-label="Tagesziel ändern">🎯</button></div>' + wotd +
      '<div class="l-grid l-tgrid">' +
      '<button type="button" class="l-btn l-tbtn l-tpic" id="lTPic">📷 ' + bi('Bilder-Quiz', 'pics') + '</button>' +
      '<button type="button" class="l-btn l-tbtn" id="lTSrs">🧠 ' + bi('Wiederholung', 'review') + (due ? ' <span class="l-badge">' + due + '</span>' : '') + '</button>' +
      '<button type="button" class="l-btn l-tbtn" id="lTArt">🎨 ' + bi('der · die · das', 'articles') + '</button>' +
      '<button type="button" class="l-btn l-tbtn" id="lTSatz">🧩 ' + bi('Satzbau', 'order') + '</button>' +
      '<button type="button" class="l-btn l-tbtn" id="lTDik">✍️ ' + bi('Diktat', 'dictation') + '</button>' +
      '<button type="button" class="l-btn l-tbtn" id="lTWq">🔤 ' + bi('Wörter-Quiz', 'wquiz') + '</button>' +
      '<button type="button" class="l-btn l-tbtn" id="lTPl">👥 ' + bi('Plural', 'plural') + '</button>' +
      '<button type="button" class="l-btn l-tbtn" id="lTHq">🎧 ' + bi('Hör-Quiz', 'hquiz') + '</button>' +
      '<button type="button" class="l-btn l-tbtn l-tmix" id="lTMix">🏁 ' + bi('Niveau-Test', 'mix') + ' ' + esc(lvInfo(p.level).kurz) + '</button></div>' +
      '<button type="button" class="l-btn l-tipslink" id="lTTips">💡 ' + bi('Artikel-Tricks', 'tricks') + ' · Videos</button>' +
      '<label class="l-note l-phototgl"><input type="checkbox" id="lPhotos"' + (p.photos !== false ? ' checked' : '') + '> 📷 Echte Fotos zeigen (aus Wikipedia, braucht Internet)</label>';
    box.querySelectorAll('[data-say]').forEach(b => b.onclick = () => lSpeak(b.dataset.say, slowFor()));
    $('lTPic').onclick = startPics; $('lTTips').onclick = showArtTips; $('lPhotos').onchange = () => { p.photos = $('lPhotos').checked; save(); };
    $('lTSrs').onclick = startSrs; $('lTArt').onclick = startArticles; $('lTSatz').onclick = startOrder; $('lTDik').onclick = startDictation;
    $('lTWq').onclick = startWordQuiz; $('lTPl').onclick = startPlural; $('lTHq').onclick = startHearQuiz; $('lTMix').onclick = startMix;
    $('lGoalBtn').onclick = () => {
      const opts = [10, 30, 60, 100], i = (opts.indexOf(p.goal || 30) + 1) % opts.length;
      p.goal = opts[i]; save(); homeTraining();
    };
  }

  // ----- 1) Tägliche Wiederholung -----
  async function startSrs() {
    stopAll(); L.view = 'train-srs'; topbar(); trainLoading();
    let pool; try { pool = await getPool(); } catch (e) { trainError(); return; }
    const p = prof(), byDe = {}; pool.words.forEach(w => byDe[w.de] = w);
    const due = shuffle(srsDue().filter(k => byDe[k])).slice(0, 20);
    const fresh = pool.words.filter(w => !srs()[w.de]);
    // neue Wörter: zuerst aus der aktuellen Einheit, dann ältere
    fresh.sort((a, b) => naehe(a, p) - naehe(b, p) || (a.unit - b.unit));
    const nNew = Math.max(0, Math.min(p.newPerDay || 10, 25 - due.length));
    const items = due.map(k => ({w: byDe[k], fresh: false})).concat(fresh.slice(0, nNew).map(w => ({w, fresh: true})));
    if (!items.length) {
      body(trainHead('🧠 ' + bi('Wiederholung', 'review')) + '<div class="l-card l-center"><div class="l-big-ic">🎉</div><h2>Alles wiederholt!</h2>' +
        '<p>Für heute ist nichts mehr fällig. Morgen geht es weiter.</p><button type="button" class="l-btn" id="lTHome">Zur Übersicht</button></div>');
      $('lTHome').onclick = showHome; return;
    }
    const S = {items, i: 0, right: 0, n: 0, again: new Set()};
    const all = pool.words;
    const next = () => {
      if (S.i >= S.items.length) { trainDone('🧠', 'Wiederholung fertig!', S.right, S.n, startSrs); return; }
      const it = S.items[S.i];
      if (it.fresh && !it.shown) { it.shown = true; showNew(it); return; }
      ask(it);
    };
    const head = () => trainHead('🧠 ' + bi('Wiederholung', 'review')) + '<div class="l-progress"><div style="width:' + Math.round(S.i / S.items.length * 100) + '%"></div></div>' +
      '<p class="l-note">' + (S.i + 1) + ' / ' + S.items.length + '</p>';
    function showNew(it) {
      const w = it.w;
      body(head() + '<div class="l-card l-center"><small class="l-new">NEU</small>' + picBox(w) + '<div class="l-word">' + wordHtml(w) + '</div>' +
        (w.pl ? '<div class="l-pl">Plural: ' + esc(w.pl) + '</div>' : '') + '<div class="l-l1"' + l1Attr() + '>' + esc(w.l1) + '</div>' +
        '<div class="l-row">' + btnSpeak(w.de) + '</div><button type="button" class="l-btn l-primary" id="lTNext">' + bi('Weiter', 'next') + ' ➜</button></div>');
      wireCommon(); lSpeak(w.de, slowFor()); srsAdd(w.de, 1);
      $('lTNext').onclick = next;
    }
    function ask(it) {
      const w = it.w, box = (srs()[w.de] || [1])[0];
      const mode = box >= 4 && w.de.length < 30 ? 'type' : (S.i % 2 ? 'hear' : 'choose');
      let h = head() + '<div class="l-card l-center">';
      if (mode === 'type') {
        h += '<p class="l-hint">Schreib das deutsche Wort' + (w.art ? ' mit Artikel' : '') + ':</p><div class="l-l1 l-big-l1"' + l1Attr() + '>' + esc(w.l1) + '</div>' +
          '<input id="lTIn" class="l-input l-big-in" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="done">' +
          '<button type="button" class="l-btn l-primary" id="lTChk">' + bi('Prüfen', 'check') + '</button><div id="lFb"></div></div>';
        body(h);
        const chk = () => { if (!$('lTIn').value.trim() || $('lTIn').disabled) return; const r = writeCheck(w.de, $('lTIn').value); $('lTIn').disabled = true; $('lTChk').style.display = 'none'; done(r.score >= 1, r.score >= 1 ? '' : 'Richtig ist: ' + w.de); };
        $('lTChk').onclick = chk; $('lTIn').addEventListener('keydown', e => { if (e.key === 'Enter') chk(); }); $('lTIn').focus();
        return;
      }
      const others = shuffle(all.filter(x => x.de !== w.de && !!x.art === !!w.art && x.l1 !== w.l1)).slice(0, 3);
      const opts = shuffle([w].concat(others));
      if (mode === 'hear') {
        h += '<p class="l-hint">Hör zu: Was bedeutet das?</p><div class="l-row">' + btnSpeak(w.de) + '</div><div class="l-opts">' +
          opts.map(o => '<button type="button" class="l-opt" data-de="' + esc(o.de) + '"' + l1Attr() + '>' + esc(o.l1) + '</button>').join('') + '</div><div id="lFb"></div></div>';
        body(h); wireCommon(); lSpeak(w.de, slowFor());
      } else {
        h += '<p class="l-hint">Was heißt das auf Deutsch?</p>' + picBox(w, true) + '<div class="l-l1 l-big-l1"' + l1Attr() + '>' + esc(w.l1) + '</div><div class="l-opts">' +
          opts.map(o => '<button type="button" class="l-opt" data-de="' + esc(o.de) + '">' + esc(o.de) + '</button>').join('') + '</div><div id="lFb"></div></div>';
        body(h);
      }
      document.querySelectorAll('[data-de]').forEach(b => b.onclick = () => {
        if (b.disabled) return;
        const ok = b.dataset.de === w.de;
        document.querySelectorAll('[data-de]').forEach(x => { x.disabled = true; if (x.dataset.de === w.de) x.classList.add('right'); });
        if (!ok) b.classList.add('wrong');
        done(ok, ok ? '' : 'Richtig ist: ' + w.de + ' = ' + w.l1);
      });
    }
    function done(ok, msg) {
      const it = S.items[S.i];
      if (!S.again.has(it.w.de)) { S.n++; if (ok) S.right++; srsGrade(it.w.de, ok); if (ok) gain(2); }
      if (!ok && !S.again.has(it.w.de)) { S.again.add(it.w.de); S.items.push({w: it.w, fresh: false}); }   // in dieser Runde nochmal
      showFb(ok ? 1 : 0, msg, '');
      lSpeak(it.w.de, slowFor());
      $('lNext2').onclick = () => { stopAll(); S.i++; next(); };
    }
    next();
  }

  // ----- Bilder-Quiz: Bild -> Wort, oder Wort hören -> Bild antippen -----
  async function startPics() {
    stopAll(); L.view = 'train-pics'; topbar(); trainLoading();
    let pool; try { pool = await getPool(); } catch (e) { trainError(); return; }
    const p = prof(), seen = new Set();
    const ws = pool.words.filter(w => w.pic && !seen.has(w.pic) && seen.add(w.pic));   // jedes Bild nur einmal -> eindeutig
    if (ws.length < 4) { body(trainHead('📷 Bilder-Quiz') + '<div class="l-card">Auf diesem Stand gibt es noch zu wenige Wörter mit Bild. Lerne erst ein paar Einheiten.</div>'); return; }
    const weak = weakList();
    const pri = ws.filter(w => weak.includes(w.de) || (w.level === p.level && w.unit === p.unit));
    const deck = shuffle(pri).slice(0, 5).concat(shuffle(ws)).filter((w, i, a) => a.findIndex(x => x.de === w.de) === i).slice(0, 10);
    const S = {i: 0, right: 0};
    const next = () => {
      if (S.i >= deck.length) { trainDone('📷', 'Bilder-Quiz fertig!', S.right, deck.length, startPics); return; }
      const w = deck[S.i], hear = S.i % 2 === 1;
      const opts = shuffle([w].concat(shuffle(ws.filter(x => x.de !== w.de)).slice(0, 3)));
      let h = trainHead('📷 ' + bi('Bilder-Quiz', 'pics')) + '<div class="l-progress"><div style="width:' + Math.round(S.i / deck.length * 100) + '%"></div></div>' +
        '<div class="l-card l-center"><p class="l-note">' + (S.i + 1) + ' / ' + deck.length + ' · ✅ ' + S.right + '</p>';
      if (hear) {
        h += '<p class="l-hint">Hör zu und tippe das richtige Bild an.</p><div class="l-row">' + btnSpeak(w.de) + '</div><div class="l-picopts">' +
          opts.map(o => '<button type="button" class="l-picopt" data-de="' + esc(o.de) + '" aria-label="Bild">' + esc(o.pic) + '</button>').join('') + '</div><div id="lFb"></div></div>';
      } else {
        h += '<p class="l-hint">Was ist das?</p>' + picBox(w) + '<div class="l-opts">' +
          opts.map(o => '<button type="button" class="l-opt" data-de="' + esc(o.de) + '">' + esc(o.de) + '</button>').join('') + '</div><div id="lFb"></div></div>';
      }
      body(h); wireCommon(); if (hear) lSpeak(w.de, slowFor());
      document.querySelectorAll('[data-de]').forEach(b => b.onclick = () => {
        if (b.disabled) return;
        const ok = b.dataset.de === w.de;
        document.querySelectorAll('[data-de]').forEach(x => { x.disabled = true; if (x.dataset.de === w.de) x.classList.add('right'); });
        if (!ok) b.classList.add('wrong'); else { S.right++; gain(1); }
        addWeak(w.de, ok ? -1 : 1);
        srsAdd(w.de, 1); if (!ok) srsGrade(w.de, false);
        $('lFb').innerHTML = '<div class="l-fb ' + (ok ? 'ok' : 'bad') + '"><b>' + (ok ? '✅ ' : '❌ ') + esc(w.pic) + ' ' + wordHtml(w) + '</b><p' + l1Attr() + '>' + esc(w.l1) + '</p></div>' +
          '<button type="button" class="l-btn l-primary" id="lNext2">' + bi('Weiter', 'next') + ' ➜</button>';
        lSpeak(w.de, slowFor());
        $('lNext2').onclick = () => { stopAll(); S.i++; next(); };
      });
    };
    next();
  }

  // ----- Artikel-Tricks: einfache Regeln + Videos -----
  let ARTC = null;
  async function artRules() {
    const lang = prof().lang;
    if (ARTC && ARTC.lang === lang) return ARTC;
    const d = await (await fetch('/learn/articles?lang=' + encodeURIComponent(lang))).json();
    if (!d.ok) throw new Error('Artikel');
    d.lang = lang; d.byId = {}; d.rules.forEach(r => d.byId[r.id] = r); ARTC = d; return d;
  }
  function artWord(de) {   // „die Telefonnummer ← die Nummer“ -> farbig
    const [main, from] = de.split(' ← ');
    const one = t => { const m = t.match(/^(der|die|das) (.+)$/); return m ? '<span class="' + artCls(m[1]) + '">' + m[1] + '</span> ' + esc(m[2]) : esc(t); };
    return '<button type="button" class="l-chip l-exw" data-say="' + esc(main) + '">' + one(main) + (from ? ' <small>← ' + one(from) + '</small>' : '') + '</button>';
  }
  async function showArtTips(back) {
    stopAll(); L.view = 'train-tips'; topbar(); trainLoading();
    let d; try { d = await artRules(); } catch (e) { trainError(); return; }
    const grp = [['die', '🔴', 'Meistens „die“'], ['das', '🟢', 'Meistens „das“'], ['der', '🔵', 'Meistens „der“'], [null, '🧩', 'Das letzte Wort entscheidet']];
    const ruleCard = r => {
      const pct = r.n ? Math.round(r.ok / r.n * 100) : 0;
      return '<div class="l-card l-rule ' + (r.art ? artCls(r.art) + '-r' : 'a-comp-r') + '"><div class="l-rule-h"><b class="l-rule-t">' + esc(r.title) + '</b>' +
        (r.art ? '<span class="l-rule-a ' + artCls(r.art) + '">→ ' + r.art + '</span>' : '') + '</div>' +
        '<p>' + esc(r.de) + '</p>' + l1(r.l1) +
        (r.ex.length ? '<div class="l-exs">' + r.ex.slice(0, 5).map(artWord).join('') + '</div>' : '') +
        (r.n ? '<p class="l-note">✔ Stimmt bei <b>' + r.ok + ' von ' + r.n + '</b> passenden Wörtern in dieser App (' + pct + ' %).' +
          (r.exc.length ? ' Ausnahmen: ' + r.exc.slice(0, 8).map(x => esc(x)).join(', ') + (r.exc.length > 8 ? ' …' : '') : '') + '</p>' : '') + '</div>';
    };
    let h = trainHead('💡 ' + bi('Artikel-Tricks', 'tricks')) +
      '<div class="l-card l-arthero"><div class="l-arthero-a"><span class="a-der">der</span><span class="a-die">die</span><span class="a-das">das</span></div>' +
      '<p>Es gibt keine Regel für alle Wörter. Aber diese Tricks helfen bei sehr vielen Wörtern. Die Zahlen sind mit dem Wortschatz dieser App nachgezählt.</p></div>' +
      '<h3 class="l-h3">⭐ Die 5 wichtigsten Tipps</h3>' +
      d.general.map(g => '<div class="l-card l-tip"><span class="l-tip-ic">' + g.icon + '</span><div><p>' + esc(g.de) + '</p>' + l1(g.l1) + '</div></div>').join('');
    grp.forEach(([a, ic, t]) => {
      const rs = d.rules.filter(r => r.art === a && (r.n || r.id === 'comp'));
      if (rs.length) h += '<h3 class="l-h3">' + ic + ' ' + esc(t) + '</h3>' + rs.map(ruleCard).join('');
    });
    h += '<h3 class="l-h3">🎬 Videos zum Thema (YouTube)</h3><p class="l-note">Diese Videos sind von anderen Anbietern. Sie öffnen sich auf YouTube.</p><div class="l-vids">' +
      d.videos.map(v => '<a class="l-vid" href="https://www.youtube.com/watch?v=' + encodeURIComponent(v.id) + '" target="_blank" rel="noopener">' +
        '<span class="l-vid-img"><img alt="" src="https://i.ytimg.com/vi/' + encodeURIComponent(v.id) + '/mqdefault.jpg" onerror="this.remove()"><span class="l-vid-play">▶</span></span>' +
        '<span class="l-vid-t"><b>' + esc(v.title) + '</b><small>' + esc(v.channel) + ' · ' + esc(v.lang) + ' · ' + esc(v.note) + '</small></span></a>').join('') + '</div>' +
      '<button type="button" class="l-btn l-primary" id="lTipsGo">🎨 ' + bi('Jetzt üben', 'train') + '</button>';
    body(h); wireCommon();
    $('lTipsGo').onclick = startArticles;
  }
  // Tipp zu einem Nomen für die Rückmeldung im Artikel-Trainer
  function artHint(w) {
    if (!ARTC || !w.ar || !ARTC.byId[w.ar]) return '';
    const r = ARTC.byId[w.ar], exp = (w.ax || '').split(' ')[0];
    if (w.ar === 'comp') {
      return exp === w.art ? '<p class="l-hint2">💡 Das letzte Wort entscheidet: <b>' + esc(w.ax) + '</b> → <b>' + esc(w.de) + '</b></p>'
        : '<p class="l-hint2">⚠️ Ausnahme: Hier entscheidet das letzte Wort (' + esc(w.ax) + ') nicht.</p>';
    }
    return exp === w.art ? '<p class="l-hint2">💡 Trick: <b>' + esc(r.title) + '</b> → ' + esc(r.art) + '</p>'
      : '<p class="l-hint2">⚠️ Ausnahme! Nach dem Trick „' + esc(r.title) + ' → ' + esc(r.art) + '“ wäre es „' + esc(r.art) + '“ – aber es heißt <b>' + esc(w.de) + '</b>. Gut merken!</p>';
  }

  // ----- 2) Artikel-Trainer -----
  async function startArticles() {
    stopAll(); L.view = 'train-art'; topbar(); trainLoading();
    let pool; try { pool = await getPool(); } catch (e) { trainError(); return; }
    try { await artRules(); } catch (e) { /* ohne Tipps weiter */ }
    const p = prof(), nouns = pool.words.filter(simpleNoun);
    if (nouns.length < 4) { body(trainHead('🎨 der · die · das') + '<div class="l-card">Auf diesem Niveau gibt es noch zu wenige Nomen. Lerne erst ein paar Einheiten.</div>'); return; }
    const weak = weakList();
    const pri = nouns.filter(w => weak.includes(w.de) || (w.level === p.level && w.unit === p.unit));
    const deck = shuffle(pri).slice(0, 7).concat(shuffle(nouns)).filter((w, i, a) => a.findIndex(x => x.de === w.de) === i).slice(0, 15);
    const S = {i: 0, right: 0};
    const next = () => {
      if (S.i >= deck.length) { trainDone('🎨', 'Artikel-Training fertig!', S.right, deck.length, startArticles); return; }
      const w = deck[S.i], noun = w.de.slice(w.art.length + 1);
      body(trainHead('🎨 ' + bi('der · die · das', 'articles')) + '<div class="l-row l-tipsrow"><button type="button" class="l-btn l-icon l-tipsbtn" id="lArtTips">💡 ' + bi('Artikel-Tricks', 'tricks') + '</button></div><div class="l-progress"><div style="width:' + Math.round(S.i / deck.length * 100) + '%"></div></div>' +
        '<div class="l-card l-center"><p class="l-note">' + (S.i + 1) + ' / ' + deck.length + ' · ✅ ' + S.right + '</p>' + picBox(w) + '<div class="l-word">___ ' + esc(noun) + '</div>' +
        '<div class="l-l1"' + l1Attr() + '>' + esc(w.l1) + '</div><div class="l-arts">' +
        ['der', 'die', 'das'].map(a => '<button type="button" class="l-art ' + artCls(a) + '-b" data-a="' + a + '">' + a + '</button>').join('') + '</div><div id="lFb"></div></div>');
      $('lArtTips').onclick = showArtTips;
      document.querySelectorAll('[data-a]').forEach(b => b.onclick = () => {
        if (b.disabled) return;
        const ok = b.dataset.a === w.art;
        document.querySelectorAll('[data-a]').forEach(x => { x.disabled = true; if (x.dataset.a === w.art) x.classList.add('right'); });
        if (!ok) b.classList.add('wrong'); else { S.right++; gain(1); }
        addWeak(w.de, ok ? -1 : 1);
        if (!ok) { srsAdd(w.de, 1); srsGrade(w.de, false); }
        $('lFb').innerHTML = '<div class="l-fb ' + (ok ? 'ok' : 'bad') + '"><b>' + (ok ? '✅ ' : '❌ ') + wordHtml(w) + '</b>' + (w.pl ? '<p>Plural: ' + esc(w.pl) + '</p>' : '') +
          (artHint(w) || (ok ? '' : '<p class="l-note">Tipp: Lerne Nomen immer mit Artikel und Farbe.</p>')) + '</div><button type="button" class="l-btn l-primary" id="lNext2">' + bi('Weiter', 'next') + ' ➜</button>';
        lSpeak(w.de, slowFor());
        $('lNext2').onclick = () => { stopAll(); S.i++; next(); };
      });
    };
    next();
  }

  // ----- 3) Satzbau-Puzzle -----
  async function startOrder() {
    stopAll(); L.view = 'train-order'; topbar(); trainLoading();
    let pool; try { pool = await getPool(); } catch (e) { trainError(); return; }
    const p = prof();
    const sents = pool.sentences.filter(s => s.de.split(' ').length <= (p.level === 'alpha' || p.level === 'A1' ? 7 : 11));
    if (sents.length < 3) { body(trainHead('🧩 Satzbau') + '<div class="l-card">Auf diesem Niveau gibt es noch zu wenige Sätze. Lerne erst ein paar Einheiten weiter.</div>'); return; }
    const cur = sents.filter(s => s.level === p.level);
    const deck = shuffle(cur.length >= 8 ? cur : sents).slice(0, 8);
    const S = {i: 0, right: 0};
    const next = () => {
      if (S.i >= deck.length) { trainDone('🧩', 'Satzbau fertig!', S.right, deck.length, startOrder); return; }
      const sent = deck[S.i].de, toks = sent.split(' ');
      let order = shuffle(toks.map((t, i) => i)); let tries = 0;
      while (order.every((v, i) => v === i) && tries++ < 5) order = shuffle(order);
      const picked = [];
      const render = () => {
        $('lAns').innerHTML = picked.length ? picked.map((ti, k) => '<button type="button" class="l-chip l-tok on" data-back="' + k + '">' + esc(toks[ti]) + '</button>').join('') : '<span class="l-note">Tippe die Wörter in der richtigen Reihenfolge an.</span>';
        $('lPool').innerHTML = order.filter(ti => !picked.includes(ti)).map(ti => '<button type="button" class="l-chip l-tok" data-t="' + ti + '">' + esc(toks[ti]) + '</button>').join('');
        $('lAns').querySelectorAll('[data-back]').forEach(b => b.onclick = () => { if ($('lOChk').disabled) return; picked.splice(+b.dataset.back, 1); render(); });
        $('lPool').querySelectorAll('[data-t]').forEach(b => b.onclick = () => { picked.push(+b.dataset.t); render(); });
        if (!$('lOChk').disabled) $('lOChk').style.display = picked.length === toks.length ? '' : 'none';
      };
      body(trainHead('🧩 ' + bi('Satzbau', 'order')) + '<div class="l-progress"><div style="width:' + Math.round(S.i / deck.length * 100) + '%"></div></div>' +
        '<div class="l-card"><p class="l-note">' + (S.i + 1) + ' / ' + deck.length + ' · Bilde einen richtigen Satz.</p>' +
        '<div class="l-ans" id="lAns"></div><div class="l-pool" id="lPool"></div>' +
        '<div class="l-row"><button type="button" class="l-btn l-icon" id="lOTr">🌐 ' + bi('Übersetzung', 'trans') + '</button></div><div class="l-l1 hide" id="lOTrT"' + l1Attr() + '></div>' +
        '<button type="button" class="l-btn l-primary" id="lOChk" style="display:none">' + bi('Prüfen', 'check') + '</button><div id="lFb"></div></div>');
      $('lOTr').onclick = () => translateBtn($('lOTr'), sent, $('lOTrT'));
      render();
      $('lOChk').onclick = () => {
        $('lOChk').disabled = true; $('lOChk').style.display = 'none';
        const built = picked.map(i => toks[i]).join(' ');
        const ok = built === sent;
        if (ok) { S.right++; gain(2); }
        $('lAns').querySelectorAll('.l-tok').forEach((b, k) => b.classList.add(toks[picked[k]] === toks[k] ? 'right' : 'wrong'));
        showFb(ok ? 1 : 0, ok ? '' : 'Richtig ist: ' + sent, '');
        lSpeak(sent, slowFor());
        $('lNext2').onclick = () => { stopAll(); S.i++; next(); };
      };
    };
    next();
  }

  // ----- 4) Diktat -----
  function dictMarks(target, input) {
    const strip = s => s.replace(/[.,!?;:„“"]/g, '');
    const T = target.split(' '), I = input.trim().split(/\s+/);
    let right = 0;
    const marks = T.map((t, k) => {
      const a = strip(t), b = strip(I[k] || '');
      if (a === b) { right++; return 'w-ok'; }
      if (a.toLowerCase() === b.toLowerCase()) { right += 0.5; return 'w-case'; }
      return 'w-bad';
    });
    return {marks, score: T.length ? right / T.length : 0};
  }
  async function startDictation() {
    stopAll(); L.view = 'train-dict'; topbar(); trainLoading();
    let pool; try { pool = await getPool(); } catch (e) { trainError(); return; }
    const p = prof();
    const sents = pool.sentences.filter(s => s.de.split(' ').length <= (p.level === 'alpha' || p.level === 'A1' ? 6 : 10));
    if (sents.length < 3) { body(trainHead('✍️ Diktat') + '<div class="l-card">Auf diesem Niveau gibt es noch zu wenige Sätze. Lerne erst ein paar Einheiten weiter.</div>'); return; }
    const cur = sents.filter(s => s.level === p.level);
    const deck = shuffle(cur.length >= 6 ? cur : sents).slice(0, 6);
    const S = {i: 0, right: 0};
    const next = () => {
      if (S.i >= deck.length) { trainDone('✍️', 'Diktat fertig!', S.right, deck.length, startDictation); return; }
      const sent = deck[S.i].de;
      body(trainHead('✍️ ' + bi('Diktat', 'dictation')) + '<div class="l-progress"><div style="width:' + Math.round(S.i / deck.length * 100) + '%"></div></div>' +
        '<div class="l-card l-center"><p class="l-note">' + (S.i + 1) + ' / ' + deck.length + ' · Hör zu und schreib den Satz.</p>' +
        '<div class="l-row"><button type="button" class="l-btn l-primary" id="lDPlay">🔊 ' + bi('Hören', 'listen') + '</button>' +
        '<button type="button" class="l-btn" id="lDSlow">🐢 Langsam</button></div>' +
        '<textarea id="lDIn" class="l-input l-area l-dict" rows="3" autocomplete="off" autocapitalize="sentences" spellcheck="false" placeholder="Hier schreiben …"></textarea>' +
        '<button type="button" class="l-btn l-primary" id="lDChk">' + bi('Prüfen', 'check') + '</button><div id="lFb"></div></div>');
      $('lDPlay').onclick = () => lSpeak(sent, slowFor());
      $('lDSlow').onclick = () => lSpeak(sent, true);
      lSpeak(sent, slowFor());
      $('lDChk').onclick = () => {
        const v = $('lDIn').value.trim(); if (!v) { $('lDIn').focus(); return; }
        stopAll();
        const r = dictMarks(sent, v), ok = r.score >= 0.99;
        if (ok) { S.right++; gain(3); }
        $('lDIn').disabled = true; $('lDChk').style.display = 'none';
        const marked = sent.split(' ').map((t, k) => '<span class="' + r.marks[k] + '">' + esc(t) + '</span>').join(' ');
        showFb(ok ? 1 : (r.score >= 0.6 ? 0.5 : 0), '', '');
        $('lFb').querySelector('.l-fb').insertAdjacentHTML('beforeend', '<p class="l-dictres">' + marked + '</p>' +
          (r.marks.includes('w-case') ? '<p class="l-note">🟡 = Groß- und Kleinschreibung beachten</p>' : ''));
        $('lNext2').onclick = () => { stopAll(); S.i++; next(); };
      };
    };
    next();
  }


  // =================== Mehr Übungen (ohne KI, nur das gewählte Niveau) ===================
  // Fragen: {kind, hint, top (HTML), say, opts:[{v, html}], answer, w, fb (HTML)}
  function runMC(icon, title, key, deck, again, punkte) {
    const S = {i: 0, right: 0};
    const next = () => {
      if (S.i >= deck.length) { trainDone(icon, title + ' fertig!', S.right, deck.length, again); return; }
      const q = deck[S.i];
      body(trainHead(icon + ' ' + bi(title, key)) + '<div class="l-progress"><div style="width:' + Math.round(S.i / deck.length * 100) + '%"></div></div>' +
        '<div class="l-card l-center"><p class="l-note">' + (S.i + 1) + ' / ' + deck.length + ' · ✅ ' + S.right + (q.kind ? ' · ' + esc(q.kind) : '') + '</p>' +
        '<p class="l-hint">' + q.hint + '</p>' + (q.say ? '<div class="l-row">' + btnSpeak(q.say) + '</div>' : '') + (q.top || '') +
        '<div class="l-opts">' + q.opts.map((o, k) => '<button type="button" class="l-opt" data-k="' + k + '"' + (o.l1 ? l1Attr() : '') + '>' + o.html + '</button>').join('') + '</div><div id="lFb"></div></div>');
      wireCommon(); if (q.say) lSpeak(q.say, slowFor());
      document.querySelectorAll('[data-k]').forEach(b => b.onclick = () => {
        if (b.disabled) return;
        const ok = q.opts[+b.dataset.k].v === q.answer;
        document.querySelectorAll('[data-k]').forEach(x => { x.disabled = true; if (q.opts[+x.dataset.k].v === q.answer) x.classList.add('right'); });
        if (!ok) b.classList.add('wrong'); else { S.right++; gain(punkte || 1); }
        if (q.w) { addWeak(q.w.de, ok ? -1 : 1); if (!ok) { srsAdd(q.w.de, 1); srsGrade(q.w.de, false); } }
        $('lFb').innerHTML = '<div class="l-fb ' + (ok ? 'ok' : 'bad') + '"><b>' + (ok ? '✅ ' : '❌ ') + q.fb + '</b></div>' +
          '<button type="button" class="l-btn l-primary" id="lNext2">' + bi('Weiter', 'next') + ' ➜</button>';
        if (q.sayAfter) lSpeak(q.sayAfter, slowFor());
        $('lNext2').onclick = () => { stopAll(); S.i++; next(); };
      });
    };
    next();
  }
  // Wörter zuerst aus der aktuellen Einheit und schwierige Wörter, dann der Rest des Niveaus
  function deckOf(list, n, nPri) {
    const p = prof(), weak = weakList();
    const pri = list.filter(w => weak.includes(w.de) || w.unit === p.unit);
    return shuffle(pri).slice(0, nPri).concat(shuffle(list)).filter((w, i, a) => a.findIndex(x => x.de === w.de) === i).slice(0, n);
  }
  function qMeaning(w, all, rev) {
    const others = shuffle(all.filter(x => x.de !== w.de && x.l1 !== w.l1 && !!x.art === !!w.art)).slice(0, 3);
    const ws = shuffle([w].concat(others));
    if (rev) return {kind: 'Bedeutung → Deutsch', hint: 'Welches deutsche Wort passt?', top: picBox(w, true) + '<div class="l-l1 l-big-l1"' + l1Attr() + '>' + esc(w.l1) + '</div>',
      opts: ws.map(o => ({v: o.de, html: esc(o.de)})), answer: w.de, w, fb: wordHtml(w) + ' = ' + esc(w.l1), sayAfter: w.de};
    return {kind: 'Deutsch → Bedeutung', hint: 'Was bedeutet das?', say: w.de, top: '<div class="l-word">' + wordHtml(w) + '</div>',
      opts: ws.map(o => ({v: o.de, html: esc(o.l1), l1: true})), answer: w.de, w, fb: wordHtml(w) + ' = ' + esc(w.l1)};
  }
  // Plural: richtige Form + zwei typische falsche Endungen (nur Formen, die es bei diesem Wort NICHT gibt)
  const UML = {a: 'ä', o: 'ö', u: 'ü', A: 'Ä', O: 'Ö', U: 'Ü'};
  function umlaut(n) {   // nur der LETZTE Vokal: a/o/u/au bekommt Umlaut, sonst bleibt das Wort
    const m = n.match(/^(.*?)(au|Au|[aeiouäöüAEIOUÄÖÜ]+)([^aeiouäöüAEIOUÄÖÜ]*)$/);
    if (!m || !/^(au|Au|a|o|u|A|O|U)$/.test(m[2])) return n;
    return m[1] + (m[2].length === 2 ? (m[2][0] === 'A' ? 'Äu' : 'äu') : UML[m[2]]) + m[3];
  }
  const silben = n => (n.match(/[aeiouäöüy]+/gi) || []).length;
  const pluralOk = w => simpleNoun(w) && /^die [A-ZÄÖÜ][A-Za-zÄÖÜäöüß-]+$/.test(w.pl || '');
  function qPlural(w) {
    const n = w.de.slice(w.art.length + 1), right = w.pl.slice(4), low = n.toLowerCase();
    let cand;
    if (/(ung|heit|keit|schaft|ion|tät|ik|ur|ei)$/.test(low)) cand = [n + 's', n];
    else if (/[aiouy]$/.test(low)) cand = [n, n + 'en'];
    else if (/nis$/.test(low)) cand = [n + 'e', n + 's', n + 'sen'];
    else if (/us$/.test(low)) cand = [n + 'se', n + 'sse', n + 'en'];
    else if (/e$/.test(low)) cand = [n, n + 's', umlaut(n) + 'n'];
    else if (/(en|lein)$/.test(low)) cand = [n + 's', n + 'er'];
    else if (/(el|er)$/.test(low)) cand = [n + 'n', n + 's', umlaut(n)];
    else if (/(um|ma)$/.test(low)) cand = [n + 's', n + 'e', n];
    else if (/(al|ent|ant|ist|or|ar|at)$/.test(low)) cand = [n + 's', n + 'en', n + 'er', n];
    else { cand = [n + 'e', n + 'er', n + 's', n + 'en', n]; if (silben(n) <= 2) cand.push(umlaut(n) + 'e', umlaut(n) + 'er'); }
    const wrong = shuffle([...new Set(cand)].filter(x => x !== right)).slice(0, 2);
    const opts = shuffle([right].concat(wrong)).map(x => ({v: x, html: 'die ' + esc(x)}));
    return {kind: 'Plural', hint: 'Ein Wort – viele davon: Wie heißt der Plural?', top: picBox(w, true) + '<div class="l-word">' + wordHtml(w) + '</div><div class="l-l1"' + l1Attr() + '>' + esc(w.l1) + '</div>',
      opts, answer: right, w, fb: wordHtml(w) + ' → <b>' + esc(w.pl) + '</b><p class="l-note">Im Plural ist der Artikel immer „die“.</p>', sayAfter: w.de + ', ' + w.pl};
  }
  // Hör-Quiz: einen Satz hören und den richtigen geschriebenen Satz antippen
  function qHear(s, all) {
    const len = s.de.split(' ').length;
    const others = shuffle(all.filter(x => x.de !== s.de && Math.abs(x.de.split(' ').length - len) <= 2)).slice(0, 2);
    if (others.length < 2) return null;
    return {kind: 'Hören', hint: 'Hör zu: Welchen Satz hörst du?', say: s.de, opts: shuffle([s].concat(others)).map(o => ({v: o.de, html: esc(o.de)})), answer: s.de, fb: esc(s.de), sayAfter: s.de};
  }
  async function startWordQuiz() {
    stopAll(); L.view = 'train-wq'; topbar(); trainLoading();
    let pool; try { pool = await getPool(); } catch (e) { trainError(); return; }
    const ws = pool.words.filter(w => w.l1);
    if (ws.length < 5) { body(trainHead('🔤 Wörter-Quiz') + '<div class="l-card">In diesem Niveau gibt es noch zu wenige Wörter.</div>'); return; }
    runMC('🔤', 'Wörter-Quiz', 'wquiz', deckOf(ws, 12, 6).map((w, i) => qMeaning(w, ws, i % 2 === 1)), startWordQuiz, 1);
  }
  async function startPlural() {
    stopAll(); L.view = 'train-pl'; topbar(); trainLoading();
    let pool; try { pool = await getPool(); } catch (e) { trainError(); return; }
    const ns = pool.words.filter(pluralOk);
    if (ns.length < 4) { body(trainHead('👥 Plural') + '<div class="l-card">In diesem Niveau gibt es noch zu wenige Nomen mit Plural. Wähle oben ein anderes Niveau (ab A1).</div>'); return; }
    runMC('👥', 'Plural', 'plural', deckOf(ns, 12, 6).map(qPlural), startPlural, 2);
  }
  async function startHearQuiz() {
    stopAll(); L.view = 'train-hq'; topbar(); trainLoading();
    let pool; try { pool = await getPool(); } catch (e) { trainError(); return; }
    const p = prof(), ss = pool.sentences.filter(x => x.de.split(' ').length <= (p.level === 'alpha' || p.level === 'A1' ? 8 : 12));
    const deck = shuffle(ss.filter(x => x.unit === p.unit)).slice(0, 4).concat(shuffle(ss)).filter((x, i, a) => a.findIndex(y => y.de === x.de) === i).slice(0, 8).map(x => qHear(x, ss)).filter(Boolean);
    if (deck.length < 3) { body(trainHead('🎧 Hör-Quiz') + '<div class="l-card">In diesem Niveau gibt es noch zu wenige Sätze.</div>'); return; }
    runMC('🎧', 'Hör-Quiz', 'hquiz', deck, startHearQuiz, 2);
  }
  // Niveau-Test: gemischte Fragen aus dem ganzen Niveau (Bedeutung, Artikel, Plural, Hören)
  async function startMix() {
    stopAll(); L.view = 'train-mix'; topbar(); trainLoading();
    let pool; try { pool = await getPool(); } catch (e) { trainError(); return; }
    const p = prof(), ws = pool.words.filter(w => w.l1), ss = pool.sentences;
    if (ws.length < 6) { body(trainHead('🏁 Niveau-Test') + '<div class="l-card">In diesem Niveau gibt es noch zu wenige Wörter.</div>'); return; }
    const qs = [];
    shuffle(ws).slice(0, 6).forEach((w, i) => qs.push(qMeaning(w, ws, i % 2 === 0)));
    shuffle(ws.filter(simpleNoun)).slice(0, 3).forEach(w => qs.push({kind: 'Artikel', hint: 'der, die oder das?', top: picBox(w, true) + '<div class="l-word">___ ' + esc(w.de.slice(w.art.length + 1)) + '</div>',
      opts: ['der', 'die', 'das'].map(a => ({v: a, html: '<span class="' + artCls(a) + '">' + a + '</span>'})), answer: w.art, w, fb: wordHtml(w), sayAfter: w.de}));
    shuffle(ws.filter(pluralOk)).slice(0, 3).forEach(w => qs.push(qPlural(w)));
    shuffle(ss.filter(x => x.de.split(' ').length <= 10)).slice(0, 3).forEach(x => { const q = qHear(x, ss); if (q) qs.push(q); });
    runMC('🏁', 'Niveau-Test', 'mix', shuffle(qs), startMix, 2);
  }

  window.openLearn = openLearn;
  window._sdLernKi = showKi;
  window.closeLearn = closeLearn;
  window._sdLearn = {L, sayScore, writeCheck, DB: () => DB};   // fuer Tests
})();
