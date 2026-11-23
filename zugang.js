/* SD Hub – Zugang
   Alle SD-Apps sind dauerhaft kostenlos: keine Testphase, keine Einschränkung,
   keine Sperre, kein Freischalt-Code. Diese Datei bleibt nur, damit ältere Seiten,
   die die Funktionen noch aufrufen, weiter funktionieren. */
(function () {
    'use strict';
    // Reste der alten Testphase im Browser aufräumen
    try {
        ['sdErstbesuch', 'sdZugangBis', 'sdAndroidGnadenfristBis'].forEach(function (k) { localStorage.removeItem(k); });
        Object.keys(localStorage).forEach(function (k) {
            if (/^sd(Erstbesuch|ZugangBis|AndroidGnadenfrist)/.test(k)) localStorage.removeItem(k);
        });
    } catch (e) { /* egal */ }
    function nichts() {}
    window.sdStatus = function () { return 'voll'; };
    window.sdGeraeteId = function () { return ''; };
    window.sdZeigeGeraeteId = nichts;
    window.sdCodeErstellen = function () { return Promise.resolve(''); };
    window.sdZeigeEinschraenkungsHinweis = nichts;
    window.sdZeigeAndroidAktionsHinweis = nichts;
    window.sdZeigeGnadenfristHinweis = nichts;
})();
