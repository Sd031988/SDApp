/* ==========================================================
   SD Suite – gemeinsame Gemini-Anfrage mit Gratis-Modellen
   ==========================================================
   Genutzt werden NUR die Flash-Modelle, die im kostenlosen Kontingent
   von Google enthalten sind (Pro ist dort nicht mehr enthalten):

     1. gemini-flash-latest       – bessere Qualitaet
     2. gemini-flash-lite-latest  – Ausweichmodell

   Beide Namen zeigen laut Google immer auf das neueste Modell der
   jeweiligen Reihe (Wechsel werden 2 Wochen vorher per E-Mail
   angekuendigt). Jedes Modell hat sein eigenes Tageskontingent: ist
   Flash fuer heute aufgebraucht (Fehler 429), wird automatisch
   Flash-Lite gefragt. Die App merkt sich das bis zum Tageswechsel bei
   Google (Mitternacht kalifornischer Zeit = 9 Uhr bzw. im Winter 10 Uhr
   in Deutschland) und fragt bis dahin gleich Flash-Lite - fuer alle
   SD-Apps gemeinsam, weil sie denselben Schluessel nutzen.

   Ein Gratis-Schluessel aus einem Google-Projekt ohne hinterlegte
   Zahlungsart kann keine Kosten verursachen; bei aufgebrauchtem
   Kontingent lehnt Google nur weitere Anfragen ab.
   ========================================================== */
(function () {
  'use strict';

  const MODELLE = ['gemini-flash-latest', 'gemini-flash-lite-latest'];
  const SPEICHER = 'sdGeminiKontingentLeer';

  function googleTag() {
    try {
      return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(new Date());
    } catch (e) {
      return new Date().toISOString().slice(0, 10);
    }
  }

  function leereModelle() {
    try {
      const d = JSON.parse(localStorage.getItem(SPEICHER) || '{}');
      if (d.tag !== googleTag()) return [];
      return Array.isArray(d.modelle) ? d.modelle : [];
    } catch (e) { return []; }
  }

  function merkeLeer(modell) {
    try {
      const leer = leereModelle();
      if (!leer.includes(modell)) leer.push(modell);
      localStorage.setItem(SPEICHER, JSON.stringify({ tag: googleTag(), modelle: leer }));
    } catch (e) { /* Speichern optional */ }
  }

  function reihenfolge() {
    const leer = leereModelle();
    const frei = MODELLE.filter(m => !leer.includes(m));
    // Sind laut Merkliste alle leer, trotzdem nochmal versuchen - vielleicht
    // hat Google das Kontingent inzwischen erneuert oder erhoeht.
    return frei.length ? frei : MODELLE.slice();
  }

  /**
   * Schickt eine generateContent-Anfrage an das erste verfuegbare
   * Gratis-Modell. Liefert { antwort, modell } - antwort ist die letzte
   * fetch-Response (bei Erfolg ok, sonst der letzte Fehlerstatus). Wirft
   * nur bei Netzwerkfehlern (TypeError von fetch).
   *
   * body: das JSON-Objekt der Anfrage.
   * optionen.ohneToolsWiederholen: wenn ein Modell die Werkzeuge (z. B.
   *   Code-Ausfuehrung) mit 400 ablehnt, dasselbe Modell ohne Werkzeuge
   *   erneut fragen.
   */
  async function anfrage(key, body, optionen) {
    const opt = optionen || {};
    let letzte = null;
    let letztesModell = null;
    for (const modell of reihenfolge()) {
      const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + modell + ':generateContent';
      const senden = (b) => fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify(b)
      });
      let antwort = await senden(body);
      if (antwort.status === 400 && opt.ohneToolsWiederholen && body.tools) {
        let meldung = '';
        try { meldung = ((await antwort.clone().json()).error || {}).message || ''; } catch (e) { /* egal */ }
        if (!/api key|API_KEY/i.test(meldung)) {
          const ohne = Object.assign({}, body);
          delete ohne.tools;
          antwort = await senden(ohne);
        }
      }
      letzte = antwort;
      letztesModell = modell;
      if (antwort.status === 429) {
        // 429 kommt bei leerem TAGES-Kontingent, aber auch bei zu vielen
        // Fragen pro MINUTE. Nur das Tageslimit wird bis morgen gemerkt;
        // Google nennt es in den Fehlerdetails (z. B.
        // "GenerateRequestsPerDayPerProjectPerModel-FreeTier").
        let details = '';
        try { details = JSON.stringify(await antwort.clone().json()); } catch (e) { /* egal */ }
        if (/PerDay/i.test(details)) merkeLeer(modell);
        continue;
      }
      // Modellname bei Google (noch) nicht verfuegbar -> naechstes probieren
      if (antwort.status === 404) continue;
      return { antwort, modell };
    }
    return { antwort: letzte, modell: letztesModell };
  }

  window.sdGemini = { MODELLE, anfrage, reihenfolge, googleTag };
})();
