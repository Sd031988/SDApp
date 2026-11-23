/* SD Akademie · Lerninhalte automatisch übersetzen
   Die Lektionen sind auf Deutsch geschrieben. Wählt jemand eine andere Sprache, übersetzt dieses Skript die geöffnete
   Lektion, die Lektionsliste und die Lernziele mit der eingebauten KI des Browsers (Translator API: Chrome ab 138 am PC,
   läuft auf dem Gerät, ohne Server). Code, Eingabefelder und bereits übersetzte Bedienelemente bleiben unverändert.
   Kann der Browser die Sprache nicht (z. B. Farsi, Urdu, Tigrinya), erklärt ein Hinweis die Seitenübersetzung von Edge/Chrome.
   Übersetzungen werden im Browser zwischengespeichert, damit sie beim nächsten Öffnen sofort da sind. */
(function () {
  "use strict";
  const NAMEN = { en: "Englisch", fa: "Farsi", ar: "Arabisch", ur: "Urdu", uk: "Ukrainisch", ti: "Tigrinya" };
  const RTL = ["ar", "fa", "ur"];
  const AUSLASSEN = "pre,code,textarea,input,select,script,style,.ak-ue-hinweis,.code-example";
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
    ziel.querySelectorAll(".ak-content-language").forEach(el => { el.hidden = art === "fertig" || sprache() === "de"; });
    if (art === "fertig") {
      p.textContent = T("🌐 Diese Lektion wurde automatisch übersetzt (im Browser, ohne Server). Maschinelle Übersetzungen können Fehler enthalten.");
      const b = document.createElement("button"); b.type = "button"; b.className = "btn outline small"; b.textContent = T("Original (Deutsch) zeigen");
      b.onclick = () => { zustand.original = true; wiederherstellen(); hinweis("original"); };
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
    if (l === "de" || !NAMEN[l]) { wiederherstellen(); return; }
    if (zustand.lang !== l) zustand = { lang: l };
    if (zustand.original) { hinweis("original"); return; }
    const knoten = textKnoten().filter(n => n.__akLang !== l);
    if (!knoten.length) { if (document.getElementById("lessonDetail")?.children.length) hinweis(document.querySelector("[data-ak-ue]") ? "fertig" : null); return; }
    const c = cache(l);
    let tr = null, offen = [];
    for (const n of knoten) {
      if (n.__akOrig === undefined) n.__akOrig = n.nodeValue;
      const orig = n.__akOrig, kern = orig.trim();
      if (c[kern] !== undefined) setzen(n, orig, c[kern], l); else offen.push(n);
    }
    if (offen.length) {
      try { tr = await holeUebersetzer(l); } catch (e) { tr = { fehlt: "browser" }; }
      if (tr.fehlt) { hinweis(tr.fehlt); return; }
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
    hinweis("fertig");
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
  window.SDAkademieUebersetzen = { jetzt: planen, _cache: cache };
})();
