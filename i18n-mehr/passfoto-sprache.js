/* Passfoto Studio: Sprachwahl (gemeinsame Einstellung "sdSprache" wie im übrigen SD Hub) und Schreibrichtung. */
(function () {
  const LANGS = ['de', 'en'].concat(Object.keys(window.SD_PASSFOTO_MEHR || {}));
  const RTL = ['fa', 'ar', 'ur', 'ps'];
  function richtung(l) { document.documentElement.lang = l; document.documentElement.dir = RTL.includes(l) ? 'rtl' : 'ltr'; }
  window.SDPF_LANGS = LANGS;
  window.SDPF_NAMEN = { de: 'Deutsch', en: 'English', fa: 'دری', ar: 'العربية', ur: 'اردو', uk: 'Українська', ti: 'ትግርኛ' };
  window.SDPF_L0 = function () {
    let l = 'de';
    try { l = localStorage.getItem('sdSprache') || 'de'; } catch (e) { /* ohne Speicher */ }
    if (!LANGS.includes(l)) l = 'de';
    richtung(l);
    return l;
  };
  window.SDPF_SET = function (l) {
    try { localStorage.setItem('sdSprache', l); } catch (e) { /* ohne Speicher */ }
    richtung(l);
  };
})();
