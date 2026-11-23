/* SD Akademie · Lerninhalte automatisch übersetzen
   Die Lektionen sind auf Deutsch geschrieben. Wählt jemand eine andere Sprache, übersetzt dieses Skript die geöffnete
   Lektion, die Lektionsliste und die Lernziele mit der eingebauten KI des Browsers (Translator API: Chrome ab 138 am PC,
   läuft auf dem Gerät, ohne Server). Code, Eingabefelder und bereits übersetzte Bedienelemente bleiben unverändert.
   Kann der Browser die Sprache nicht (z. B. Farsi, Urdu, Tigrinya), erklärt ein Hinweis die Seitenübersetzung von Edge/Chrome.
   Übersetzungen werden im Browser zwischengespeichert, damit sie beim nächsten Öffnen sofort da sind.
   Für manche Kurse gibt es feste Übersetzungen (kurse-uebersetzt/<sprache>/<kurs>.js). Sie gelten auf jedem Gerät,
   auch auf dem iPhone, und werden vor der Browser-Übersetzung angewendet. */
(function () {
  "use strict";
  const NAMEN = { en: "Englisch", fa: "Dari", ar: "Arabisch", ur: "Urdu", uk: "Ukrainisch", ti: "Tigrinya" };
  const RTL = ["ar", "fa", "ur"];
  const AUSLASSEN = "pre,code,textarea,input,select,script,style,.ak-ue-hinweis,.code-example,[data-ak-fest]";
  // Kurse mit fester Übersetzung je Sprache
  const FEST = { fa: ["python-start"] };
  const FEST_VERSION = "20261123";
  const BEREICHE = ["lessonDetail", "lessonList", "akKurskopf"];
  const uebersetzer = {};
  let laeuft = false, nochmal = false, zustand = {};
  const I18N = () => window.SDAkademieI18n;
  const sprache = () => (I18N() ? I18N().lang() : "de");
  const T = s => (I18N() ? I18N().t(s) : s);

  // ---- Zwischenspeicher (pro Sprache, begrenzt)
  const speicher = {};
  function cache(l) {
    if (!speicher[l]) { try { speicher[l] = JSON.parse(localStorage.getItem("sdAkUe:" + l) || "{}"); } catch (e) { speicher[l] = {}; } }
    return speicher[l];
  }
  let speichernTimer = null;
  function merken(l) {
    clearTimeout(speichernTimer);
    speichernTimer = setTimeout(() => {
      try {
        const c = cache(l), keys = Object.keys(c);
        if (keys.length > 4000) keys.slice(0, keys.length - 4000).forEach(k => delete c[k]);
        localStorage.setItem("sdAkUe:" + l, JSON.stringify(c));
      } catch (e) { /* Speicher voll oder gesperrt: dann eben ohne Zwischenspeicher */ }
    }, 800);
  }

  function textKnoten() {
    const liste = [];
    for (const id of BEREICHE) {
      const root = document.getElementById(id); if (!root) continue;
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode(n) {
          const p = n.parentElement;
          if (!p || p.closest(AUSLASSEN)) return NodeFilter.FILTER_REJECT;
          if (p.dataset && p.dataset.akSource && n.__akOrig === undefined) return NodeFilter.FILTER_REJECT; // Bedienung: schon übersetzt
          const t = (n.__akOrig !== undefined ? n.__akOrig : n.nodeValue);
          return /[A-Za-zÄÖÜäöüß]{2}/.test(t) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      });
      for (let n = w.nextNode(); n; n = w.nextNode()) liste.push(n);
    }
    return liste;
  }

  function wiederherstellen() {
    for (const n of textKnoten()) if (n.__akOrig !== undefined) { n.nodeValue = n.__akOrig; n.__akLang = "de"; }
    document.querySelectorAll("[data-ak-ue]").forEach(el => el.removeAttribute("data-ak-ue"));
    hinweis(null);
  }

  // ---- Hinweis oben in der Lektion
  function hinweis(art, info) {
    const ziel = document.getElementById("lessonDetail");
    let box = document.getElementById("akUeHinweis");
    if (!art || !ziel) { if (box) box.remove(); return; }
    if (!box) { box = document.createElement("div"); box.id = "akUeHinweis"; box.className = "ak-ue-hinweis"; box.setAttribute("role", "status"); }
    if (box.parentNode !== ziel || ziel.firstChild !== box) ziel.prepend(box);
    box.replaceChildren();
    const p = document.createElement("p");
    ziel.querySelectorAll(".ak-content-language").forEach(el => { el.hidden = art === "fertig" || art === "fest" || sprache() === "de"; });
    if (art === "fertig") {
      p.textContent = T("🌐 Diese Lektion wurde automatisch übersetzt (im Browser, ohne Server). Maschinelle Übersetzungen können Fehler enthalten.");
      const b = document.createElement("button"); b.type = "button"; b.className = "btn outline small"; b.textContent = T("Original (Deutsch) zeigen");
      b.onclick = () => { zustand.original = true; festZurueck(); wiederherstellen(); hinweis("original"); };
      box.append(p, b);
    } else if (art === "fest") {
      p.textContent = T("🌐 Diese Lektion ist fest übersetzt (maschinell erstellt, nicht von Muttersprachlern geprüft). Code bleibt auf Englisch.");
      const b = document.createElement("button"); b.type = "button"; b.className = "btn outline small"; b.textContent = T("Original (Deutsch) zeigen");
      b.onclick = () => { zustand.original = true; festZurueck(); wiederherstellen(); hinweis("original"); };
      box.append(p, b);
    } else if (art === "original") {
      p.textContent = T("Du siehst den deutschen Originaltext.");
      const b = document.createElement("button"); b.type = "button"; b.className = "btn outline small"; b.textContent = T("Wieder übersetzen");
      b.onclick = () => { zustand.original = false; planen(); };
      box.append(p, b);
    } else if (art === "laden") {
      p.textContent = T("Für die Übersetzung lädt dein Browser einmalig ein kleines Sprachmodell herunter. Danach geht es auch offline.");
      const b = document.createElement("button"); b.type = "button"; b.className = "btn primary small"; b.textContent = T("Übersetzung laden");
      b.onclick = () => { zustand.erlaubt = true; planen(); };
      box.append(p, b);
    } else if (art === "fortschritt") {
      p.textContent = "⏳ " + (info || T("Übersetze …"));
      box.append(p);
    } else if (art === "browser") {
      p.textContent = T("Die Lerninhalte sind auf Deutsch geschrieben, und dein Browser kann sie hier nicht selbst in diese Sprache übersetzen. So geht es trotzdem: In Microsoft Edge oder Google Chrome mit der rechten Maustaste auf die Lektion klicken und „Übersetzen“ wählen (oder das Übersetzen-Symbol in der Adressleiste). Die Zielsprache stellst du in den Browser-Einstellungen ein.");
      box.append(p);
    }
  }


  // ---- Feste Übersetzungen: ganze Sätze samt `Code`-Stellen werden ersetzt, Code bleibt unverändert
  const festGeladen = {};
  let festListe = [], festSprache = null;
  function festLaden(l, kurs) {
    if (!kurs || !(FEST[l] || []).includes(kurs)) return Promise.resolve(null);
    const k = l + "/" + kurs;
    if (!festGeladen[k]) festGeladen[k] = new Promise(res => {
      const vorhanden = window.SDAkademieFest?.[l]?.[kurs]; if (vorhanden) return res(vorhanden);
      const s = document.createElement("script");
      s.src = "./kurse-uebersetzt/" + l + "/" + encodeURIComponent(kurs) + ".js?v=" + FEST_VERSION;
      s.onload = () => res(window.SDAkademieFest?.[l]?.[kurs] || null);
      s.onerror = () => { delete festGeladen[k]; res(null); };
      document.head.append(s);
    });
    return festGeladen[k];
  }
  function festSuchen(d, key) {
    const genau = k => {
      if (Object.prototype.hasOwnProperty.call(d, k)) return d[k];
      const m = k.match(/^([\s\S]+?)(\s*(?::|↗|→))$/);                  // „Titel:“, „Link ↗“, „Weiter →“
      return m && d[m[1]] !== undefined ? d[m[1]] + m[2] : undefined;
    };
    let treffer = genau(key); if (treffer !== undefined) return treffer;
    let vor = "", rest = key;
    for (let i = 0; i < 3; i++) {                                         // „1. “, „✓ “, „← “, „Tipp: “ usw. davor
      const m = rest.match(/^(\d+\.\s+|[✓✗←]\s+|[^.:!?`]{1,40}?[.:!?]\s+)([\s\S]+)$/); if (!m) break;
      const p = m[1].trim(), pt = d[p] !== undefined ? d[p] : T(p);
      vor += pt + " "; rest = m[2];
      treffer = genau(rest); if (treffer !== undefined) return vor + treffer;
    }
    return undefined;
  }
  function mitCodeSpan(text) {
    const span = document.createElement("span"); span.setAttribute("data-ak-fest", "");
    String(text).split("`").forEach((teil, i) => {
      if (!teil) return;
      if (i % 2) { const c = document.createElement("code"); c.textContent = teil; c.dir = "ltr"; span.append(c); } else span.append(document.createTextNode(teil));
    });
    return span;
  }
  function festMarkieren(el, l) {
    const block = el.closest("p,li,h4,h5,h6,button,small,b,label,span,a,div") || el;
    block.setAttribute("data-ak-ue", RTL.includes(l) ? "rtl" : "ltr"); block.lang = l;
  }
  function festAnwenden(d, l) {
    let n = 0;
    for (const id of BEREICHE) {
      const root = document.getElementById(id); if (!root) continue;
      for (const el of [root, ...root.querySelectorAll("*")]) {
        if (el.closest(AUSLASSEN)) continue;
        let lauf = [];
        const pruefen = () => {
          if (!lauf.length) return;
          const teile = lauf; lauf = [];
          const roh = teile.map(x => x.nodeType === 3 ? x.nodeValue : "`" + x.textContent + "`").join("");
          const key = roh.trim(); if (!/[A-Za-zÄÖÜäöüß]{2}/.test(key)) return;
          const neu = festSuchen(d, key); if (neu === undefined) return;
          const vorne = roh.match(/^\s*/)[0], hinten = roh.match(/\s*$/)[0];
          if (teile.length === 1 && teile[0].nodeType === 3) {
            const t = teile[0]; t.__festOrig = t.nodeValue; t.nodeValue = vorne + neu + hinten; t.__festSet = t.nodeValue; t.__akLang = l;
            festListe.push({ text: t });
          } else {
            const span = mitCodeSpan(vorne + neu + hinten);
            teile[0].before(span); teile.forEach(x => x.remove()); festListe.push({ span, orig: teile });
          }
          festMarkieren(el, l); n++;
        };
        for (const k of [...el.childNodes]) {
          if (k.nodeType === 3 && k.__festSet !== undefined && k.nodeValue === k.__festSet) { pruefen(); continue; } // schon fest übersetzt
          if (k.nodeType === 3 || (k.nodeType === 1 && k.tagName === "CODE")) lauf.push(k); else pruefen();
        }
        pruefen();
      }
    }
    if (n) festSprache = l;
    return n;
  }
  function festZurueck() {
    for (const e of festListe) {
      if (e.text) { if (e.text.isConnected && e.text.nodeValue === e.text.__festSet) { e.text.nodeValue = e.text.__festOrig; } delete e.text.__festSet; e.text.__akLang = "de"; }
      else if (e.span.isConnected) { e.span.replaceWith(...e.orig); }
    }
    festListe = []; festSprache = null;
    document.querySelectorAll("[data-ak-ue]").forEach(el => { el.removeAttribute("data-ak-ue"); });
  }

  async function holeUebersetzer(l) {
    if (uebersetzer[l]) return uebersetzer[l];
    if (!self.Translator || typeof self.Translator.availability !== "function") return { fehlt: "browser" };
    let st;
    try {
      st = await Promise.race([self.Translator.availability({ sourceLanguage: "de", targetLanguage: l }),
        new Promise(r => setTimeout(() => r("unavailable"), 6000))]);   // manche Browser antworten nie
    } catch (e) { st = "unavailable"; }
    if (st === "unavailable") return { fehlt: "browser" };
    if (st !== "available" && !zustand.erlaubt) return { fehlt: "laden" };
    const t = await self.Translator.create({
      sourceLanguage: "de", targetLanguage: l,
      monitor(m) { m.addEventListener("downloadprogress", e => hinweis("fortschritt", T("Sprachmodell wird geladen …") + " " + Math.round((e.loaded || 0) * 100) + " %")); }
    });
    uebersetzer[l] = t; return t;
  }

  async function uebersetzen() {
    const l = sprache();
    if (festSprache && festSprache !== l) festZurueck();
    if (l === "de" || !NAMEN[l]) { festZurueck(); wiederherstellen(); return; }
    if (zustand.lang !== l) zustand = { lang: l };
    if (zustand.original) { hinweis("original"); return; }
    const kurs = document.getElementById("lessonList")?.dataset.kurs;
    const fest = await festLaden(l, kurs);
    if (sprache() !== l || zustand.original) return;
    if (fest) festAnwenden(fest, l);
    const detailDa = !!document.getElementById("lessonDetail")?.children.length;
    const knoten = textKnoten().filter(n => n.__akLang !== l);
    if (!knoten.length) { if (detailDa) hinweis(fest ? "fest" : document.querySelector("[data-ak-ue]") ? "fertig" : null); return; }
    const c = cache(l);
    let tr = null, offen = [];
    for (const n of knoten) {
      if (n.__akOrig === undefined) n.__akOrig = n.nodeValue;
      const orig = n.__akOrig, kern = orig.trim();
      if (c[kern] !== undefined) setzen(n, orig, c[kern], l); else offen.push(n);
    }
    if (offen.length) {
      try { tr = await holeUebersetzer(l); } catch (e) { tr = { fehlt: "browser" }; }
      if (tr.fehlt) { if (detailDa) hinweis(fest ? "fest" : tr.fehlt); return; }
      let i = 0;
      for (const n of offen) {
        if (sprache() !== l || zustand.original) return;
        const orig = n.__akOrig, kern = orig.trim();
        if (++i % 8 === 1) hinweis("fortschritt", T("Übersetze …") + " " + Math.round(i / offen.length * 100) + " %");
        let neu;
        try { neu = c[kern] !== undefined ? c[kern] : await tr.translate(kern); } catch (e) { continue; }
        c[kern] = neu; setzen(n, orig, neu, l);
      }
      merken(l);
    }
    hinweis(fest ? "fest" : "fertig");
  }

  function setzen(n, orig, neu, l) {
    if (!n.isConnected) return;
    const vorne = orig.match(/^\s*/)[0], hinten = orig.match(/\s*$/)[0];
    n.nodeValue = vorne + neu + hinten; n.__akLang = l;
    const block = n.parentElement.closest("p,li,h4,h5,h6,button,small,b,label,span,a,div") || n.parentElement;
    block.setAttribute("data-ak-ue", RTL.includes(l) ? "rtl" : "ltr");
    block.lang = l;
  }

  function planen() {
    if (laeuft) { nochmal = true; return; }
    laeuft = true;
    setTimeout(async () => {
      try { await uebersetzen(); } finally { laeuft = false; if (nochmal) { nochmal = false; planen(); } }
    }, 120);
  }

  function start() {
    const beob = new MutationObserver(muts => {
      if (sprache() === "de") return;
      if (muts.every(m => [...m.addedNodes, ...m.removedNodes].every(x => x.id === "akUeHinweis" || (x.closest && x.closest("#akUeHinweis"))))) return;
      planen();
    });
    for (const id of ["lessonDetail", "lessonList", "coursePanel"]) { const el = document.getElementById(id); if (el) beob.observe(el, { childList: true, subtree: true }); }
    document.addEventListener("sd-lang-changed", () => { zustand = {}; planen(); });
    planen();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
  window.SDAkademieUebersetzen = { jetzt: planen, _cache: cache, FEST };
})();
