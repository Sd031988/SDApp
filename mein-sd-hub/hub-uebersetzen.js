/* Mein SD Hub · feste Übersetzung der Hub-Seiten (außerhalb der Lektionen)
   Lädt für die gewählte Sprache ein Wörterbuch (seite-uebersetzt/<sprache>.js) und ersetzt deutsche Texte auf der Seite:
   - texte:       einzelne Textstücke (genauer Wortlaut, ohne Rand-Leerzeichen)
   - bloecke:     ganze Absätze mit Hervorhebungen; **fett** im Wörterbuch wird wieder fett dargestellt
   - platzhalter: placeholder-Texte von Eingabefeldern
   Lektionen, Code und Eingaben bleiben unberührt; beim Zurückschalten auf Deutsch wird das Original wiederhergestellt.
   Läuft komplett im Browser, auch auf dem iPhone, ohne Server und ohne Browser-KI. */
(function () {
  "use strict";
  const VORHANDEN = ["fa"];
  const VERSION = "20261123b";
  const AUSLASSEN = "script,style,textarea,input,pre,code,#lessonDetail,#lessonList,#akKurskopf,[data-ak-source],[data-hub-ue]";
  const RTL = ["fa", "ar", "ur"];
  const geladen = {};
  let aktiv = null, eintraege = [], laeuft = false, nochmal = false;
  const sprache = () => (window.SDAkademieI18n ? window.SDAkademieI18n.lang() : (window.SD_LANG || "de"));
  const norm = s => String(s).replace(/\s+/g, " ").trim();

  function laden(l) {
    if (!VORHANDEN.includes(l)) return Promise.resolve(null);
    if (!geladen[l]) geladen[l] = new Promise(res => {
      if (window.SDHubSeite?.[l]) return res(window.SDHubSeite[l]);
      const s = document.createElement("script");
      s.src = "./seite-uebersetzt/" + l + ".js?v=" + VERSION;
      s.onload = () => res(window.SDHubSeite?.[l] || null);
      s.onerror = () => { delete geladen[l]; res(null); };
      document.head.append(s);
    });
    return geladen[l];
  }

  function fettText(el, text) {
    String(text).split("**").forEach((teil, i) => {
      if (!teil) return;
      if (i % 2) { const b = document.createElement("strong"); b.textContent = teil; el.append(b); } else el.append(document.createTextNode(teil));
    });
  }

  function vorlage(d, t) {
    for (const [muster, ziel] of Object.entries(d.vorlagen || {})) {
      const m = t.match(new RegExp("^" + muster.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace("\\{x\\}", "(.+)") + "$"));
      if (m) return ziel.replace("{x}", d.texte?.[m[1]] !== undefined ? d.texte[m[1]] : m[1]);
    }
    return undefined;
  }

  function anwenden(d, l) {
    const rtl = RTL.includes(l) ? "rtl" : "ltr";
    // ganze Absätze zuerst
    for (const el of document.body.querySelectorAll("p,div,li,span,label,small")) {
      if (el.closest(AUSLASSEN) || !el.children.length) continue;
      const neu = d.bloecke?.[norm(el.textContent)];
      if (neu === undefined) continue;
      const orig = [...el.childNodes];
      el.replaceChildren(); fettText(el, neu);
      el.setAttribute("data-hub-ue", rtl); el.lang = l;
      eintraege.push({ el, orig });
    }
    // einzelne Textstücke
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(n) {
        const p = n.parentElement;
        if (!p || p.closest(AUSLASSEN) || n.__hubSet === n.nodeValue) return NodeFilter.FILTER_REJECT;
        return /[A-Za-zÄÖÜäöüß]{2}/.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    });
    const knoten = []; for (let n = w.nextNode(); n; n = w.nextNode()) knoten.push(n);
    for (const n of knoten) {
      const roh = n.nodeValue, kern = norm(roh);
      let neu = d.texte?.[kern]; if (neu === undefined) neu = vorlage(d, kern);
      if (neu === undefined) {                                   // „🧭 Titel“: Symbol davor, Titel aus dem Wörterbuch
        const m = kern.match(/^([^\p{L}\p{N}]+\s)(.+)$/u);
        if (m && d.texte?.[m[2]] !== undefined) neu = m[1] + d.texte[m[2]];
      }
      if (neu === undefined) continue;
      eintraege.push({ text: n, orig: roh });
      n.nodeValue = roh.match(/^\s*/)[0] + neu + roh.match(/\s*$/)[0]; n.__hubSet = n.nodeValue;
    }
    for (const el of document.querySelectorAll("input[placeholder]")) {
      if (el.hasAttribute("data-ak-placeholder")) continue;
      const neu = d.platzhalter?.[el.placeholder]; if (neu === undefined) continue;
      eintraege.push({ attr: el, orig: el.placeholder }); el.placeholder = neu;
    }
    aktiv = l;
  }

  function zurueck() {
    for (const e of eintraege.reverse()) {
      if (e.el) { if (e.el.isConnected) { e.el.replaceChildren(...e.orig); e.el.removeAttribute("data-hub-ue"); e.el.removeAttribute("lang"); } }
      else if (e.text) { if (e.text.nodeValue === e.text.__hubSet) e.text.nodeValue = e.orig; delete e.text.__hubSet; }
      else if (e.attr) e.attr.placeholder = e.orig;
    }
    eintraege = []; aktiv = null;
  }

  async function lauf() {
    const l = sprache();
    if (aktiv && aktiv !== l) zurueck();
    if (l === "de") { zurueck(); return; }
    const d = await laden(l);
    if (!d || sprache() !== l) return;
    eintraege = eintraege.filter(e => (e.el || e.text || e.attr).isConnected);
    anwenden(d, l);
  }
  function planen() {
    if (laeuft) { nochmal = true; return; }
    laeuft = true;
    setTimeout(async () => { try { await lauf(); } finally { laeuft = false; if (nochmal) { nochmal = false; planen(); } } }, 150);
  }
  function start() {
    new MutationObserver(m => { if (sprache() !== "de" && m.some(x => x.addedNodes.length)) planen(); })
      .observe(document.body, { childList: true, subtree: true });
    document.addEventListener("sd-lang-changed", () => { zurueck(); planen(); });
    planen();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
  window.SDHubUebersetzen = { jetzt: planen, VORHANDEN };
})();
