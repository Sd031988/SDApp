/* ==========================================================
   SD Suite – einfacher Sprachumschalter (Deutsch/Englisch)
   ==========================================================
   Jede Seite definiert VOR diesem Script ein Wörterbuch:
     window.SD_I18N = { de: { schluessel: 'Text', ... }, en: { schluessel: 'Text', ... } };
   und markiert Textstellen mit data-i18n="schluessel" (Text) bzw.
   data-i18n-placeholder="schluessel" (Platzhalter von Eingabefeldern).
   Die gewaehlte Sprache wird in localStorage gemerkt (App-uebergreifend,
   gilt fuer alle SD-Suite-Seiten auf thesdhub.com) und bei jedem neuen
   Besuch automatisch wieder angewendet.
   ========================================================== */
(function () {
  'use strict';

  function dict(lang) {
    return (window.SD_I18N && window.SD_I18N[lang]) || {};
  }

  // de/en gibt es überall; weitere Sprachen nur, wenn die Seite ein Wörterbuch dafür hat (z. B. fa, ps)
  const RTL = ['fa', 'ps', 'ar', 'ur'];
  function verfuegbar(lang) {
    return lang === 'de' || lang === 'en' || !!(lang && window.SD_I18N && window.SD_I18N[lang]);
  }

  function sdApplyLang(lang, nichtMerken) {
    if (!verfuegbar(lang)) lang = 'de';
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL.includes(lang) ? 'rtl' : 'ltr';
    const d = dict(lang);

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (d[key] == null) return;
      if (el.hasAttribute('data-i18n-html')) el.innerHTML = d[key];
      else el.textContent = d[key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (d[key] != null) el.setAttribute('placeholder', d[key]);
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      if (d[key] != null) el.setAttribute('title', d[key]);
    });
    document.querySelectorAll('.sd-lang-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.lang === lang);
    });

    if (!nichtMerken) { try { localStorage.setItem('sdSprache', lang); } catch (e) { /* ok */ } }
    window.SD_LANG = lang;
    document.dispatchEvent(new CustomEvent('sd-lang-changed', { detail: { lang } }));
  }

  function sdInitLang() {
    let stored = null;
    try { stored = localStorage.getItem('sdSprache'); } catch (e) { /* ok */ }
    let lang = stored;
    if (!verfuegbar(lang)) {
      // Gewählte Sprache gibt es auf dieser Seite (noch) nicht: Ersatz anzeigen, aber die Wahl nicht überschreiben
      lang = (navigator.language || '').toLowerCase().indexOf('en') === 0 ? 'en' : 'de';
      sdApplyLang(lang, !!stored);
      return;
    }
    sdApplyLang(lang);
  }

  window.sdApplyLang = sdApplyLang;
  window.sdInitLang = sdInitLang;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', sdInitLang);
  } else {
    sdInitLang();
  }
})();
