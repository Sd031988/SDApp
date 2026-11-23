/* Videos zu den Kursen: nur echte YouTube-Videos, deren Adresse per Websuche geprüft wurde (Stand 2026-11-23).
   YouTube wird erst beim Klick geladen (youtube-nocookie.com); vorher geht keine Anfrage an YouTube. */
(function (root) {
  "use strict";
  const V = (id, t) => ({id, t});
  const NICO_A1 = V("4-eDoThe6qo", "Deutsch lernen (A1): Ganzer Film auf Deutsch – „Nicos Weg“ (DW)");
  const NICO_B1 = V("LkufozluseI", "Deutsch lernen (B1): Ganzer Film auf Deutsch – „Nicos Weg“ (DW)");
  const WEIL = V("iyO7B-m0I1I", "Deutsch lernen: A2, weil, deshalb, obwohl, trotzdem – Beispiele, Erklärung");
  const OB = V("i9wlNPVlvDU", "Nebensätze mit weil, wenn, dass, ob – Deutsch lernen B1/B2");
  const HTML_CSS = V("dOgFkZiVC8w", "HTML und CSS Tutorial für Anfänger");
  const JS90 = V("cAiSbkWvBQU", "Lerne JavaScript in 90 Minuten // JavaScript Tutorial Deutsch");
  const MFR = V("PSCZP-pxqTw", "Map, Filter, Reduce – JavaScript Tutorial for Beginners (Englisch)");
  const PY60 = V("FFrrShS7LZw", "Python Tutorial für Anfänger: Lerne Python in 60 Minuten (deutsch)");
  const CS50P = V("JP7ITIXGpHk", "CS50P – Lecture 0 – Functions, Variables (Harvard, Englisch)");
  const KI = V("DkoWeNUQJzs", "Künstliche Intelligenz einfach erklärt – Wie KI wirklich funktioniert!");
  const PHISH = V("Qpk47M-sx6E", "Phishing erkennen und vermeiden");
  const ZWEIF = V("Dz90G0p6Vn8", "2FA Zwei-Faktor-Authentisierung leicht gemacht + Tipps für sichere Passwörter");
  const PC = V("QkdNNLMIyR0", "Computer Basiswissen für Anfänger – Was ist ein Computer?");
  const STELLE = V("YhSWTrMi9sU", "Stellenanzeigen analysieren, richtig lesen und verstehen");
  const PROBEZEIT = V("qpKwPR4B1ZA", "Kündigung und Kündigungsschutz in der Probezeit");
  const ANERK = V("UEbBqV8ksOU", "Erklärvideo berufliche Anerkennung");
  const GIT = V("1rjNmOr8Q-E", "Git + GitHub Tutorial Deutsch");

  // je Kurs: _kurs = Video zum ganzen Kurs (wenn eine Lektion kein eigenes hat), sonst Lektions-ID → Videos
  const DATEN = {
    "german": {_kurs: [NICO_A1],
      "g-1": [V("h1YIcXjQx8k", "Deutsch lernen A1: Begrüßung und sich vorstellen (Dialoge für Anfänger)")],
      "g-2": [V("7cP9dSC5-WQ", "Im Supermarkt (Deutsch A1 – German lesson for beginners)")],
      "g-3": [V("4xRNy6WZMNk", "Dialog 40: Termin vereinbaren, verschieben oder absagen")]},
    "deutsch-a2": {
      "d2-1": [V("O-H5X4KkWeE", "Perfekt mit „haben“ oder „sein“?")],
      "d2-2": [V("pp6-awlhL04", "Wo? oder Wohin? Wechselpräpositionen mit Dativ und Akkusativ (A2)")],
      "d2-3": [V("O2qjJlmy7uQ", "Deutsch beim Arzt: Realistischer Praxis-Dialog (A2–B1)")],
      "d2-4": [WEIL],
      "d2-6": [V("ajlgvNH_uIM", "Am Bahnhof – Dialog")],
      "d2-7": [V("O13S_NZQuuU", "Beschwerdebrief Deutsch: Brief & E-Mail schreiben – „Reklamation“"), WEIL],
      "d2-8": [V("K01F-1Oc5Lk", "Finalsätze mit damit oder um zu + Infinitiv (A2)")]},
    "deutsch-b1": {_kurs: [NICO_B1],
      "d3-1": [V("ubkkWiO_1nQ", "Redemittel Meinung äußern, B1/B2 (Diskussion)")],
      "d3-2": [V("4GqZbVUdeCI", "Konjunktiv 2 für Wunsch und höfliche Bitte")],
      "d3-3": [OB],
      "d3-4": [V("DlylZJJEZ24", "Relativsätze einfach erklärt (A2–B1)")],
      "d3-5": [V("qT3rFwKSPxQ", "WENN oder ALS – einfach erklärt + Test")],
      "d3-6": [V("wQwRiChxPM8", "DTZ: Brief/E-Mail schreiben (B1) – Beschwerde an den Vermieter")]},
    "deutsch-beruf": {
      "d4-1": [OB],
      "d4-3": [V("dx6Zmm3aORk", "Konjunktiv 2: Höfliche Bitte / Aufforderung")],
      "d4-4": [V("cfgyHIV_IQA", "Deutsch lernen A1–B1: Telefontermine vereinbaren")],
      "d4-5": [V("RyN0dkXgM2M", "Vorgangspassiv einfach erklärt")]},
    "code": {_kurs: [HTML_CSS],
      "p-1": [V("3Djmh7V70NE", "Lerne HTML in 60 Minuten // HTML Tutorial Deutsch für Anfänger")],
      "p-2": [V("3Djmh7V70NE", "Lerne HTML in 60 Minuten // HTML Tutorial Deutsch für Anfänger")],
      "p-9": [V("K0PIQ7hispI", "JavaScript Tutorial für Anfänger #21 – Events: Auf Klick JavaScript ausführen")],
      "p-10": [JS90], "p-11": [JS90]},
    "webdesign": {_kurs: [HTML_CSS],
      "p2-3": [V("TX0g5NmsKig", "CSS Flexbox Tutorial Deutsch für Anfänger")],
      "p2-4": [V("ZfQWG5wF1yY", "CSS Grid vs Flexbox")]},
    "javascript": {_kurs: [JS90],
      "p3-1": [V("GBPNwxCKRe8", "JavaScript Einführung – JavaScript Tutorial deutsch Teil 1")],
      "p3-6": [V("7UdKpJ8BOn0", "Document Object Model (DOM) – JavaScript Tutorial deutsch Teil 15")],
      "p3-7": [V("oKudLT7iLik", "addEventListener – JavaScript Tutorial deutsch Teil 18")],
      "p3-9": [V("a55AgrbGDao", "HTML-Elemente erstellen – JavaScript Tutorial deutsch Teil 25")]},
    "javascript-aufbau": {_kurs: [JS90],
      "p4-1": [MFR], "p4-2": [MFR],
      "p4-3": [V("pYVV_HyzWy8", "JavaScript Reduce Funktion"), MFR],
      "p4-7": [V("Fa54vhDSsxs", "JavaScript Async Await in 8 Minuten – Deutsches Tutorial"), V("nkv1_zyeKow", "async und await – JavaScript Advanced Tutorial deutsch Teil 39")]},
    "saubere-webapps": {
      "p5-5": [GIT],
      "p5-6": [V("_VPpFU3Jyq4", "Lerne Git Branch und Merge in 30 Minuten"), V("N-vFTYEqguU", "Lerne GitHub in 30 Minuten // GitHub Tutorial Deutsch")]},
    "python-start": {_kurs: [PY60],
      "ps-1": [PY60, CS50P],
      "ps-2": [V("NrtQdg6u0oE", "Python lernen für Anfänger – Teil 1: Variablen und Listen")],
      "ps-6": [V("NrtQdg6u0oE", "Python lernen für Anfänger – Teil 1: Variablen und Listen")]},
    "python-aufbau": {_kurs: [V("a-AYmpqBcio", "Python Grundlagen Komplettkurs (25 Teile + Übungen)")],
      "pa-6": [V("8oHa_Nr2sa8", "Python Tutorial #22: Objektorientiert programmieren mit Python (deutsch)")]},
    "ki-python": {_kurs: [KI],
      "ki-3": [V("rPS6m2iFjHo", "Einfache lineare Regression – einfach erklärt")],
      "ki-6": [V("LOJzAF06ikE", "Neuronale Netze (Deep Learning) verstehen! – Folge 1")],
      "ki-8": [V("wEV-fxURMIE", "KI, ChatGPT … und was sind überhaupt neuronale Netze? Einfach erklärt.")]},
    "cpp-start": {_kurs: [V("Y7SYP0fv4mc", "C++ Tutorial deutsch 1: „Hallo Welt“")]},
    "rust-start": {_kurs: [V("VBdgdhhb3OE", "RUST Tutorial für Anfänger – Lerne Rust in 60 Minuten (deutsch)")],
      "rs-5": [V("GwVXof81rdM", "Rust Tutorial: Ownership & Borrowing (Englisch)")]},
    "uni-kurse": {"uk-1": [CS50P]},
    "buero-programme": {
      "c4-3": [V("hGe2e8cK7XM", "Geschäftsbrief-Vorlage nach DIN 5008 in Word erstellen")],
      "c4-4": [V("_4w00eWEEbg", "Excel lernen für Anfänger – Grundlagen, erste Formel erstellen")]},
    "digital": {_kurs: [PC], "d-1": [ZWEIF], "d-2": [PHISH]},
    "internet-email": {_kurs: [V("27FBP3XlAhs", "Mein Computerkurs – ideal für Einsteiger und Senioren")]},
    "sicher-im-netz": {
      "c3-1": [PHISH, V("wtXwct7Emow", "Achtung Abzocke! Wie du Phishing-Mails erkennen kannst")],
      "c3-2": [ZWEIF],
      "c3-3": [V("f69eAZfh_2I", "IT-Sicherheit verständlich erklärt: Zwei-Faktor-Authentisierung"), ZWEIF]},
    "digitale-profiwerkzeuge": {
      "c5-1": [V("3D2-DJqiJ30", "Die 3-2-1-Regel – so sicherst du deine Daten richtig")],
      "c5-3": [KI]},
    "career": {
      "c-1": [STELLE],
      "c-2": [V("S8fWkKT48ww", "Lebenslauf schreiben: Die wichtigsten Infos & Tipps")],
      "c-3": [V("YvKSS4Eq4OY", "Anschreiben Aufbau – das gehört in dein Bewerbungsschreiben")]},
    "arbeit-finden": {"b1-3": [STELLE, V("0EyGCpEL_a8", "Erfolgreicher bewerben: „Wie lese ich eine Stellenanzeige?“")]},
    "gespraech-arbeitsstart": {_kurs: [V("T0MCNIPkihA", "Vorstellungsgespräch: 6 unverzichtbare Tipps")],
      "b3-5": [V("QOjS5kWzTYU", "10 Fragen, die du im Vorstellungsgespräch stellen solltest")]},
    "arbeitsvertrag-rechte": {
      "b4-2": [V("zS1UIweo5O8", "Lohnabrechnung: Alle Abgaben erklärt (Brutto zu Netto)")],
      "b4-6": [PROBEZEIT], "b4-7": [PROBEZEIT]},
    "weiterkommen": {
      "b5-2": [ANERK],
      "b5-3": [V("3G1zEggZEeQ", "Wie ausländische Berufsabschlüsse anerkannt werden können"), ANERK]}
  };

  const RECHT = /^(arbeitsvertrag-rechte|weiterkommen)$/;
  // liefert {videos, ganzerKurs} für eine Lektion oder null
  function fuer(kurs, lektion) {
    const k = DATEN[kurs]; if (!k) return null;
    if (k[lektion] && k[lektion].length) return {videos: k[lektion], ganzerKurs: false, recht: RECHT.test(kurs)};
    if (k._kurs && k._kurs.length) return {videos: k._kurs, ganzerKurs: true, recht: RECHT.test(kurs)};
    return null;
  }
  const el = (tag, cls, text, parent) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; if (parent) parent.appendChild(e); return e; };

  // baut den Videobereich; t = Übersetzungsfunktion für die Beschriftungen (optional)
  function bauen(parent, kurs, lektion, t) {
    const f = fuer(kurs, lektion); if (!f) return null;
    t = t || (x => x);
    const box = el("section", "kv-box", null, parent);
    el("h5", "kv-titel", t(f.ganzerKurs ? "Video zum ganzen Kurs" : "Video zu dieser Lektion"), box);
    el("p", "kv-hinweis", t("Videos von anderen Anbietern auf YouTube. YouTube wird erst geladen, wenn du auf ein Video tippst."), box);
    if (f.recht) el("p", "kv-hinweis", t("Rechtliche Regeln können sich ändern. Verbindlich ist eine Beratung, z. B. bei Gewerkschaft, Beratungsstelle oder Anwalt."), box);
    f.videos.forEach(v => {
      const karte = el("div", "kv-karte", null, box);
      const knopf = el("button", "kv-start", null, karte); knopf.type = "button"; knopf.dataset.video = v.id;
      el("span", "kv-play", "▶", knopf); el("span", "kv-name", v.t, knopf);
      const link = el("a", "kv-link", t("Auf YouTube öffnen ↗"), karte);
      link.href = "https://www.youtube.com/watch?v=" + encodeURIComponent(v.id); link.target = "_blank"; link.rel = "noopener noreferrer";
      knopf.addEventListener("click", () => {
        const rahmen = el("div", "kv-rahmen");
        const f2 = el("iframe", null, null, rahmen);
        f2.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(v.id) + "?autoplay=1&rel=0";
        f2.title = v.t; f2.loading = "lazy"; f2.allowFullscreen = true;
        f2.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture; fullscreen");
        f2.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
        knopf.replaceWith(rahmen);
      });
    });
    return box;
  }
  root.SDKursVideos = {daten: DATEN, fuer, bauen};
})(typeof window !== "undefined" ? window : globalThis);
