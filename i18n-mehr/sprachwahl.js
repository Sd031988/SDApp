/* Ersetzt die DE/EN-Knöpfe (.sd-lang-switch) durch eine Sprachauswahl mit allen Sprachen, die diese Seite hat. */
(function () {
  const NAMEN = { de: 'Deutsch', en: 'English', fa: 'دری', ps: 'پښتو', ar: 'العربية', ur: 'اردو', uk: 'Українська', ti: 'ትግርኛ' };
  function bauen() {
    const sprachen = Object.keys(window.SD_I18N || {});
    if (sprachen.length <= 2) return;
    document.querySelectorAll('.sd-lang-switch').forEach(box => {
      if (box.querySelector('select')) return;
      const sel = document.createElement('select');
      sel.className = 'sd-lang-select';
      sel.setAttribute('aria-label', 'Sprache / Language');
      sel.innerHTML = sprachen.map(l => '<option value="' + l + '">' + (NAMEN[l] || l) + '</option>').join('');
      sel.value = window.SD_LANG || 'de';
      sel.addEventListener('change', () => window.sdApplyLang && window.sdApplyLang(sel.value));
      box.replaceChildren(sel);
    });
  }
  const st = document.createElement('style');
  st.textContent = '.sd-lang-select{font:inherit;font-size:.85rem;font-weight:700;min-height:36px;padding:4px 8px;border-radius:999px;border:1px solid var(--line,#cfd8dc);background:var(--paper,#fff);color:var(--ink,#1b2b2a);max-width:140px}';
  document.head.appendChild(st);
  document.addEventListener('sd-lang-changed', () => document.querySelectorAll('.sd-lang-select').forEach(s => { s.value = window.SD_LANG || 'de'; }));
  // Eingabefelder richten sich nach dem eingetippten Text (z. B. Deutsch links, Dari rechts) – auch auf RTL-Seiten
  function eingabeRichtung() {
    document.querySelectorAll('input[type=text]:not([dir]),input[type=email]:not([dir]),input[type=search]:not([dir]),input:not([type]):not([dir]),textarea:not([dir])').forEach(e => e.setAttribute('dir', 'auto'));
  }
  function start() { bauen(); eingabeRichtung(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
