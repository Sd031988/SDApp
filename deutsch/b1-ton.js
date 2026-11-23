/* SD Hub · Ton für die B1-Prüfung (Hören)
   1) Natürliche Stimme vom SD-Server als Audio-Datei – klingt auf dem iPhone auch im Lautlos-Modus.
   2) Sonst die Stimme des Geräts (Web Speech). Lange Texte werden in Sätze geteilt, Dialoge mit
      zwei Stimmen nacheinander gesprochen. Wichtig fürs iPhone: Der erste Ton startet direkt im Antippen. */
(function () {
  "use strict";
  const STIMMEN = ["de-DE-KatjaNeural", "de-DE-ConradNeural", "de-DE-AmalaNeural", "de-DE-KillianNeural"];
  const server = () => (window.SDLernAPI && window.SDLernAPI.SERVER) ||
    (function () { try { return localStorage.getItem("sdLearnServer") || ""; } catch (e) { return ""; } })() || "https://sd-maschinen-kenner.onrender.com";
  let audio = null, lauf = 0, serverFehler = 0, letzterFehler = 0, geraetGenutzt = false;
  const el = () => { if (!audio) { audio = new Audio(); audio.preload = "auto"; audio.setAttribute("playsinline", ""); } return audio; };

  // Text in Stücke von höchstens ~350 Zeichen an Satzgrenzen teilen
  function stuecke(text) {
    const saetze = String(text || "").replace(/\s+/g, " ").trim().match(/[^.!?…]+[.!?…]*["“”»«]?\s*/g) || [];
    const out = []; let cur = "";
    for (const s of saetze) { if ((cur + s).length > 350 && cur) { out.push(cur.trim()); cur = ""; } cur += s; }
    if (cur.trim()) out.push(cur.trim());
    return out.length ? out : [String(text || "")];
  }

  function geraetSprich(t, stimme, langsam, nr) {
    return new Promise(fertig => {
      if (!("speechSynthesis" in window)) { fertig(); return; }
      geraetGenutzt = true;
      const ss = window.speechSynthesis, u = new SpeechSynthesisUtterance(t);
      u.lang = "de-DE"; u.rate = langsam ? 0.8 : 0.9;
      const de = ss.getVoices().filter(v => (v.lang || "").toLowerCase().startsWith("de"));
      if (de.length > 1) u.voice = de[stimme % de.length]; else u.pitch = stimme % 2 ? 0.88 : 1.06;
      let ende = false; const fin = () => { if (!ende) { ende = true; clearTimeout(wd); fertig(); } };
      u.onend = fin; u.onerror = fin;
      const wd = setTimeout(fin, 5000 + t.length * 110);
      // Safari verschluckt ein speak() direkt nach cancel() manchmal – darum kurz warten
      const los = () => { if (nr !== lauf) { fin(); return; } try { if (ss.paused) ss.resume(); } catch (e) {} ss.speak(u); };
      if (ss.speaking || ss.pending) { ss.cancel(); setTimeout(los, 120); } else los();
    });
  }

  function serverSprich(t, stimme, langsam, nr) {
    return new Promise(fertig => {
      if (serverFehler >= 2 && Date.now() - letzterFehler < 120000) { geraetSprich(t, stimme, langsam, nr).then(fertig); return; }
      const a = el(); let ende = false;
      const fin = () => { if (!ende) { ende = true; clearTimeout(wd); a.onended = a.onerror = a.onplaying = null; fertig(); } };
      const fehler = () => { if (ende) return; ende = true; clearTimeout(wd); serverFehler++; letzterFehler = Date.now(); geraetSprich(t, stimme, langsam, nr).then(fertig); };
      let wd = setTimeout(fehler, 9000);
      a.onended = fin; a.onerror = fehler;
      a.onplaying = () => { serverFehler = 0; clearTimeout(wd); wd = setTimeout(fin, (isFinite(a.duration) && a.duration > 0 ? a.duration * 1000 : 4000 + t.length * 110) + 2000); };
      a.src = server() + "/hub/tts?text=" + encodeURIComponent(t) + "&voice=" + encodeURIComponent(STIMMEN[stimme % STIMMEN.length]) + "&rate=" + encodeURIComponent(langsam ? "-20%" : "-8%");
      const p = a.play(); if (p && p.catch) p.catch(fehler);
    });
  }

  // teile: [[sprecherIndex, text], …]; muss im Antippen aufgerufen werden
  async function abspielen(teile, opt) {
    stopp(); const nr = ++lauf; geraetGenutzt = false;
    const langsam = !!(opt && opt.langsam);
    for (const [stimme, text] of teile) for (const s of stuecke(text)) {
      if (nr !== lauf) return;
      await serverSprich(s, stimme, langsam, nr);
    }
    if (nr === lauf && opt && opt.fertig) opt.fertig({geraet: geraetGenutzt});
  }
  function sprich(text, opt) { return abspielen([[0, text]], opt); }
  function dialog(turns, opt) {
    const rollen = [...new Set(turns.map(t => t[0]))];
    return abspielen(turns.map(t => [rollen.indexOf(t[0]), t[1]]), opt);
  }
  function stopp() {
    lauf++;
    try { if (audio) { audio.pause(); audio.removeAttribute("src"); audio.load(); } } catch (e) {}
    try { if ("speechSynthesis" in window) window.speechSynthesis.cancel(); } catch (e) {}
  }
  const IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  window.SDB1Ton = {sprich, dialog, stopp, IOS, _stuecke: stuecke};
})();
