/* SD Akademie – Übungs-Terminal: ein simuliertes Linux-Terminal im Browser.
   Es führt nichts auf deinem Gerät aus; Dateisystem, Benutzer und Befehle sind nachgebildet.
   Unterstützt: pwd cd ls cat head tail wc grep find chmod sudo whoami id mkdir touch rm cp mv echo sort uniq history clear help man
   sowie Weiterleitung mit | > >> . Aufgaben werden nach jedem Befehl geprüft. */
(function (root) {
  "use strict";
  const HILFE = {
    pwd: "pwd – zeigt den aktuellen Ordner (print working directory).",
    cd: "cd ORDNER – wechselt den Ordner. cd .. geht eine Ebene hoch, cd ~ in dein Home-Verzeichnis, cd - zurück.",
    ls: "ls [-l] [-a] [PFAD] – listet Inhalte. -l zeigt Rechte und Besitzer, -a auch versteckte Dateien (Punkt am Anfang).",
    cat: "cat DATEI – zeigt den Inhalt einer Datei.",
    head: "head [-n ZAHL] DATEI – zeigt die ersten Zeilen (Standard 10).",
    tail: "tail [-n ZAHL] DATEI – zeigt die letzten Zeilen (Standard 10).",
    wc: "wc -l [DATEI] – zählt Zeilen.",
    grep: "grep [-i] [-n] [-r] [-c] [-v] MUSTER [DATEI|ORDNER] – sucht Zeilen mit dem Muster. -i ohne Groß/Klein, -n mit Zeilennummer, -r in Ordnern, -c nur Anzahl, -v Zeilen ohne Muster.",
    find: "find PFAD [-name \"MUSTER\"] [-type f|d] – findet Dateien und Ordner. * steht für beliebige Zeichen.",
    chmod: "chmod RECHTE DATEI – ändert Rechte, z. B. chmod 600 datei oder chmod u+x skript.sh.",
    sudo: "sudo BEFEHL – führt einen Befehl mit Administratorrechten (als root) aus. Nur nutzen, wenn es nötig ist.",
    whoami: "whoami – zeigt deinen Benutzernamen.",
    id: "id – zeigt Benutzer, Gruppe und Gruppenmitgliedschaften.",
    mkdir: "mkdir ORDNER – legt einen Ordner an.",
    touch: "touch DATEI – legt eine leere Datei an.",
    rm: "rm DATEI – löscht eine Datei endgültig (kein Papierkorb!).",
    cp: "cp QUELLE ZIEL – kopiert eine Datei.",
    mv: "mv QUELLE ZIEL – verschiebt oder benennt um.",
    echo: "echo TEXT [> DATEI | >> DATEI] – gibt Text aus; > überschreibt eine Datei, >> hängt an.",
    sort: "sort – sortiert Zeilen (meist hinter einem |).",
    uniq: "uniq [-c] – fasst gleiche aufeinanderfolgende Zeilen zusammen; -c zählt sie. Vorher sortieren!",
    history: "history – zeigt deine bisherigen Befehle.",
    clear: "clear – leert den Bildschirm.",
    man: "man BEFEHL – kurze Hilfe zu einem Befehl."
  };
  const norm = p => { const out = []; for (const t of p.split("/")) { if (!t || t === ".") continue; if (t === "..") out.pop(); else out.push(t); } return "/" + out.join("/"); };
  const elt = (tag, cls, text, parent) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; if (parent) parent.appendChild(e); return e; };
  const muster = s => new RegExp("^" + s.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\?/g, ".") + "$");
  function teile(zeile) { // einfache Wortzerlegung mit Anführungszeichen
    const w = []; let cur = "", q = null, hat = false;
    for (const ch of zeile) {
      if (q) { if (ch === q) q = null; else cur += ch; continue; }
      if (ch === '"' || ch === "'") { q = ch; hat = true; continue; }
      if (/\s/.test(ch)) { if (cur || hat) w.push(cur); cur = ""; hat = false; continue; }
      cur += ch;
    }
    if (cur || hat) w.push(cur); return w;
  }

  function erstellen(container, cfg, fertig) {
    const fs = {}; // pfad -> {d:true,m,o} | {t:"inhalt",m,o}
    const user = cfg.user || "lena", home = "/home/" + user;
    fs["/"] = {d: true, m: "755", o: "root"};
    for (const [p, v] of Object.entries(cfg.fs || {})) {
      const pfad = norm(p), teileP = pfad.split("/").filter(Boolean);
      for (let i = 1; i < teileP.length; i++) { const d = "/" + teileP.slice(0, i).join("/"); if (!fs[d]) fs[d] = {d: true, m: "755", o: "root"}; }
      fs[pfad] = typeof v === "string" ? {t: v, m: "644", o: user} : Object.assign({m: v.d ? "755" : "644", o: user}, v);
    }
    fs[home] = Object.assign({}, fs[home] || {}, {d: true, m: (fs[home] && fs[home].o === user && fs[home].m) || "755", o: user});
    fs["/tmp"] = {d: true, m: "777", o: "root"};
    let cwd = cfg.cwd || home, alt = cwd, alsRoot = false;
    const verlauf = [], aufgaben = (cfg.aufgaben || []).map(a => Object.assign({ok: false}, a));
    let aktiv = 0;

    const box = elt("div", "ak-term", null, container);
    const liste = elt("ol", "ak-term-aufgaben", null, box);
    const fenster = elt("div", "ak-term-fenster", null, box);
    fenster.setAttribute("role", "log"); fenster.setAttribute("aria-live", "polite"); fenster.setAttribute("aria-label", "Ausgabe des Übungs-Terminals");
    const zeileBox = elt("form", "ak-term-zeile", null, box);
    const prompt = elt("span", "ak-term-prompt", null, zeileBox);
    const eingabe = elt("input", null, null, zeileBox);
    eingabe.type = "text"; eingabe.autocomplete = "off"; eingabe.spellcheck = false; eingabe.setAttribute("autocapitalize", "off"); eingabe.setAttribute("aria-label", "Befehl eingeben");
    const los = elt("button", "btn primary small", "↵", zeileBox); los.type = "submit"; los.setAttribute("aria-label", "Befehl ausführen");
    elt("p", "ak-term-hinweis", "Übungs-Terminal (Simulation): Es läuft im Browser und verändert nichts auf deinem Gerät. Tippe help für alle Befehle.", box);

    const kurz = p => p === home ? "~" : p.startsWith(home + "/") ? "~" + p.slice(home.length) : p;
    const zeigePrompt = () => { prompt.textContent = user + "@sd-lab:" + kurz(cwd) + "$"; };
    const pfad = p => norm(!p || p === "~" ? home : p.startsWith("~/") ? home + p.slice(1) : p.startsWith("/") ? p : cwd + "/" + p);
    const kinder = d => Object.keys(fs).filter(p => p !== d && p.startsWith(d === "/" ? "/" : d + "/") && !p.slice(d === "/" ? 1 : d.length + 1).includes("/")).sort();
    const darf = (e, art) => { if (alsRoot || !e) return true; const m = e.o === user ? e.m[0] : e.m[2]; const n = parseInt(m, 8); return art === "r" ? (n & 4) > 0 : art === "w" ? (n & 2) > 0 : (n & 1) > 0; };
    const rechteText = e => (e.d ? "d" : "-") + e.m.split("").map(z => { const n = parseInt(z, 8); return (n & 4 ? "r" : "-") + (n & 2 ? "w" : "-") + (n & 1 ? "x" : "-"); }).join("");
    function lies(p, fehlerName) {
      const e = fs[p]; if (!e) throw new Error(fehlerName + ": " + kurz(p) + ": Datei oder Verzeichnis nicht gefunden");
      if (e.d) throw new Error(fehlerName + ": " + kurz(p) + ": Ist ein Verzeichnis");
      if (!darf(e, "r")) throw new Error(fehlerName + ": " + kurz(p) + ": Keine Berechtigung");
      return e.t;
    }
    function schreib(p, text, anh) {
      const e = fs[p], d = p.slice(0, p.lastIndexOf("/")) || "/";
      if (!fs[d] || !fs[d].d) throw new Error("Verzeichnis nicht gefunden: " + kurz(d));
      if (e && e.d) throw new Error(kurz(p) + ": Ist ein Verzeichnis");
      if (e && !darf(e, "w")) throw new Error(kurz(p) + ": Keine Berechtigung");
      if (!e && !darf(fs[d], "w")) throw new Error(kurz(d) + ": Keine Berechtigung");
      if (e) e.t = anh ? e.t + text : text; else fs[p] = {t: text, m: "644", o: alsRoot ? "root" : user};
    }
    const zeilen = t => t.replace(/\n$/, "").split("\n");

    function befehl(w, stdin) {
      const [cmd, ...a] = w; const opt = a.filter(x => /^-[a-zA-Z]+$/.test(x)).join(""), arg = a.filter(x => !/^-[a-zA-Z]+$/.test(x));
      const hatOpt = c => opt.includes(c);
      const nZahl = () => { const i = a.indexOf("-n"); return i >= 0 ? parseInt(a[i + 1], 10) || 10 : 10; };
      switch (cmd) {
        case "help": return "Verfügbare Befehle: " + Object.keys(HILFE).join(", ") + "\nMehr zu einem Befehl: man BEFEHL";
        case "man": return HILFE[arg[0]] || "Keine Hilfe für „" + (arg[0] || "") + "“. Tippe help.";
        case "pwd": return cwd;
        case "whoami": return alsRoot ? "root" : user;
        case "id": return alsRoot ? "uid=0(root) gid=0(root) Gruppen=0(root)" : "uid=1000(" + user + ") gid=1000(" + user + ") Gruppen=1000(" + user + ")" + (cfg.sudoGruppe === false ? "" : ",27(sudo)");
        case "cd": {
          const ziel = arg[0] === "-" ? alt : pfad(arg[0]); const e = fs[ziel];
          if (!e) throw new Error("cd: " + (arg[0] || "") + ": Datei oder Verzeichnis nicht gefunden");
          if (!e.d) throw new Error("cd: " + arg[0] + ": Ist kein Verzeichnis");
          if (!darf(e, "x")) throw new Error("cd: " + arg[0] + ": Keine Berechtigung");
          alt = cwd; cwd = ziel; return "";
        }
        case "ls": {
          const ziel = pfad(arg[0] || "."), e = fs[ziel];
          if (!e) throw new Error("ls: Zugriff auf '" + (arg[0] || ".") + "' nicht möglich: Datei oder Verzeichnis nicht gefunden");
          if (e.d && !darf(e, "r")) throw new Error("ls: Öffnen von Verzeichnis '" + (arg[0] || ".") + "' nicht möglich: Keine Berechtigung");
          let n = e.d ? kinder(ziel) : [ziel];
          if (!hatOpt("a")) n = n.filter(p => !p.split("/").pop().startsWith("."));
          const name = p => p.split("/").pop() + (fs[p].d ? "/" : "");
          if (hatOpt("l")) return n.map(p => rechteText(fs[p]) + " " + fs[p].o.padEnd(5) + " " + String(fs[p].d ? 4096 : fs[p].t.length).padStart(5) + " " + name(p)).join("\n");
          return n.map(name).join("  ");
        }
        case "cat": return stdin !== null && !arg.length ? stdin : arg.map(f => lies(pfad(f), "cat")).join("");
        case "head": case "tail": { const ni = a.indexOf("-n"), dat = a.filter((x, i) => !x.startsWith("-") && !(ni >= 0 && i === ni + 1)); const t = dat.length ? lies(pfad(dat[dat.length - 1]), cmd) : stdin || ""; const z = zeilen(t), n = nZahl(); return (cmd === "head" ? z.slice(0, n) : z.slice(-n)).join("\n"); }
        case "wc": { const t = arg.length ? lies(pfad(arg[0]), "wc") : stdin || ""; const n = t ? zeilen(t).length : 0; return hatOpt("l") ? String(n) + (arg[0] ? " " + arg[0] : "") : n + " Zeilen"; }
        case "sort": { const t = arg.length ? lies(pfad(arg[0]), "sort") : stdin || ""; let z = zeilen(t).sort(); if (hatOpt("r")) z.reverse(); if (hatOpt("n")) z = zeilen(t).sort((x, y) => parseFloat(x) - parseFloat(y)); return z.join("\n"); }
        case "uniq": { const z = zeilen(stdin || ""), out = []; for (const x of z) { const l = out[out.length - 1]; if (l && l.t === x) l.n++; else out.push({t: x, n: 1}); } return out.map(o => hatOpt("c") ? String(o.n).padStart(7) + " " + o.t : o.t).join("\n"); }
        case "grep": {
          if (!arg.length) throw new Error("grep: Muster fehlt. Beispiel: grep Fehler datei.txt");
          const [m, ...dateien] = arg; const re = new RegExp(m.replace(/[.+^${}()|[\]\\*?]/g, "\\$&"), hatOpt("i") ? "i" : "");
          const pruefe = (text, vor) => zeilen(text).map((z, i) => ({z, i})).filter(x => re.test(x.z) !== hatOpt("v")).map(x => vor + (hatOpt("n") ? (x.i + 1) + ":" : "") + x.z);
          let treffer = [];
          if (!dateien.length) treffer = pruefe(stdin || "", "");
          for (const f of dateien) {
            const p = pfad(f), e = fs[p];
            if (e && e.d) { if (!hatOpt("r")) throw new Error("grep: " + f + ": Ist ein Verzeichnis (tipp: grep -r)"); for (const q of Object.keys(fs).filter(x => x.startsWith(p + "/") && !fs[x].d).sort()) { if (darf(fs[q], "r")) treffer.push(...pruefe(fs[q].t, kurz(q) + ":")); else treffer.push("grep: " + kurz(q) + ": Keine Berechtigung"); } }
            else treffer.push(...pruefe(lies(p, "grep"), dateien.length > 1 ? f + ":" : ""));
          }
          return hatOpt("c") ? String(treffer.filter(t => !t.startsWith("grep:")).length) : treffer.join("\n");
        }
        case "find": {
          const sp = a[0] && !a[0].startsWith("-") ? a[0] : "."; const start = pfad(sp); if (!fs[start]) throw new Error("find: '" + sp + "': Datei oder Verzeichnis nicht gefunden");
          const ni = a.indexOf("-name"), ti = a.indexOf("-type"), re = ni >= 0 ? muster(a[ni + 1] || "*") : null, typ = ti >= 0 ? a[ti + 1] : null;
          return Object.keys(fs).filter(p => (p === start || p.startsWith(start === "/" ? "/" : start + "/")) && (!re || re.test(p.split("/").pop())) && (!typ || (typ === "d") === !!fs[p].d)).sort().map(p => sp.startsWith("/") ? p : (p === start ? "." : "." + p.slice(start === "/" ? 0 : start.length))).join("\n");
        }
        case "chmod": {
          const [r, f] = arg; const p = pfad(f), e = fs[p];
          if (!r || !f) throw new Error("chmod: Beispiel: chmod 600 datei.txt");
          if (!e) throw new Error("chmod: Zugriff auf '" + f + "' nicht möglich: Datei oder Verzeichnis nicht gefunden");
          if (!alsRoot && e.o !== user) throw new Error("chmod: Ändern der Zugriffsrechte von '" + f + "': Operation nicht erlaubt");
          if (/^[0-7]{3}$/.test(r)) { e.m = r; return ""; }
          const m = /^([ugoa]*)([+-=])([rwx]+)$/.exec(r); if (!m) throw new Error("chmod: ungültiger Modus: '" + r + "'");
          const wer = (m[1] || "a").replace("a", "ugo"), bits = (m[3].includes("r") ? 4 : 0) | (m[3].includes("w") ? 2 : 0) | (m[3].includes("x") ? 1 : 0);
          e.m = e.m.split("").map((z, i) => { if (!wer.includes("ugo"[i])) return z; let n = parseInt(z, 8); n = m[2] === "+" ? n | bits : m[2] === "-" ? n & ~bits : bits; return String(n); }).join("");
          return "";
        }
        case "mkdir": { for (const f of arg) { const p = pfad(f); if (fs[p]) throw new Error("mkdir: '" + f + "' kann nicht angelegt werden: Die Datei existiert bereits"); const d = p.slice(0, p.lastIndexOf("/")) || "/"; if (!darf(fs[d], "w")) throw new Error("mkdir: '" + f + "': Keine Berechtigung"); fs[p] = {d: true, m: "755", o: alsRoot ? "root" : user}; } return ""; }
        case "touch": { for (const f of arg) { const p = pfad(f); if (!fs[p]) schreib(p, "", false); } return ""; }
        case "rm": { for (const f of arg) { const p = pfad(f), e = fs[p]; if (!e) throw new Error("rm: '" + f + "' kann nicht entfernt werden: Datei oder Verzeichnis nicht gefunden"); if (e.d) throw new Error("rm: '" + f + "' kann nicht entfernt werden: Ist ein Verzeichnis"); const d = p.slice(0, p.lastIndexOf("/")) || "/"; if (!darf(fs[d], "w")) throw new Error("rm: '" + f + "': Keine Berechtigung"); delete fs[p]; } return ""; }
        case "cp": case "mv": {
          const [q, z] = arg; if (!q || !z) throw new Error(cmd + ": Quelle und Ziel angeben");
          const pq = pfad(q); let pz = pfad(z); const inhalt = lies(pq, cmd); if (fs[pz] && fs[pz].d) pz = norm(pz + "/" + pq.split("/").pop());
          schreib(pz, inhalt, false); if (cmd === "mv") delete fs[pq]; return "";
        }
        case "echo": return arg.join(" ");
        case "history": return verlauf.map((v, i) => String(i + 1).padStart(4) + "  " + v).join("\n");
        case "sudo": {
          if (!arg.length) throw new Error("sudo: Befehl fehlt. Beispiel: sudo cat /etc/shadow");
          if (cfg.sudoGruppe === false) throw new Error(user + " ist nicht in der sudoers-Datei. Dieser Vorfall wird gemeldet.");
          const vorher = alsRoot; alsRoot = true;
          try { return "[sudo] Passwort für " + user + ": (in der Übung nicht nötig)\n" + befehl(w.slice(1), stdin); } finally { alsRoot = vorher; }
        }
        case "": return "";
        default: throw new Error(cmd + ": Befehl nicht gefunden. Tippe help für alle Befehle.");
      }
    }

    function ausfuehren(zeile) {
      let umleit = null; const m = /^(.*?)\s*(>>|>)\s*(\S+)\s*$/.exec(zeile);
      if (m && !/^\s*echo\s+["'][^"']*$/.test(m[1])) { umleit = {anh: m[2] === ">>", ziel: m[3]}; zeile = m[1]; }
      let text = null;
      for (const teil of zeile.split("|")) text = befehl(teile(teil.trim()), text);
      if (umleit) { schreib(pfad(umleit.ziel), text + (text ? "\n" : ""), umleit.anh); return ""; }
      return text;
    }

    function zeichneAufgaben() {
      liste.replaceChildren();
      aufgaben.forEach((a, i) => {
        const li = elt("li", a.ok ? "ok" : i === aktiv ? "aktiv" : "", null, liste);
        elt("span", "ak-term-status", a.ok ? "✓" : String(i + 1), li);
        const t = elt("span", null, null, li); t.innerHTML = ""; // Text mit `Code`
        String(a.text).split("`").forEach((s, j) => { if (!s) return; if (j % 2) elt("code", null, s, t); else t.appendChild(document.createTextNode(s)); });
        if (!a.ok && i === aktiv && a.tipp) { const b = elt("button", "ak-term-tipp", "Tipp", li); b.type = "button"; b.onclick = () => { b.replaceWith(Object.assign(document.createElement("small"), {textContent: "Tipp: " + a.tipp, className: "ak-term-tipptext"})); }; }
      });
    }
    function pruefe(zeile, ausgabe, fehler) {
      const a = aufgaben[aktiv]; if (!a) return; const p = a.pruefe || {};
      let ok = p.fehlerErwartet ? fehler : !fehler;
      if (ok && p.befehl) ok = new RegExp(p.befehl).test(zeile.trim());
      if (ok && p.ausgabe) ok = ausgabe.includes(p.ausgabe);
      if (ok && p.cwd) ok = cwd === p.cwd;
      if (ok && p.rechte) ok = !!fs[norm(p.rechte.datei)] && fs[norm(p.rechte.datei)].m === p.rechte.m;
      if (ok && p.datei) { const e = fs[norm(p.datei.pfad)]; ok = !!e && !e.d && (!p.datei.inhalt || new RegExp(p.datei.inhalt).test(e.t)); }
      if (ok && p.fehlt) ok = !fs[norm(p.fehlt)];
      if (!ok) return;
      a.ok = true; aktiv++;
      elt("div", "ak-term-erfolg", "✓ Aufgabe " + aktiv + " geschafft" + (a.erklaerung ? ": " + a.erklaerung : "."), fenster);
      zeichneAufgaben();
      if (aktiv >= aufgaben.length) { elt("div", "ak-term-erfolg", "🎉 Alle Aufgaben im Terminal gelöst.", fenster); if (fertig) fertig(); }
    }
    let hIndex = -1;
    zeileBox.addEventListener("submit", e => {
      e.preventDefault(); const zeile = eingabe.value; eingabe.value = ""; hIndex = -1;
      const z = elt("div", "ak-term-befehl", null, fenster); elt("span", "ak-term-prompt", prompt.textContent + " ", z); z.appendChild(document.createTextNode(zeile));
      if (zeile.trim()) verlauf.push(zeile.trim());
      if (zeile.trim() === "clear") { fenster.replaceChildren(); zeigePrompt(); return; }
      let ausgabe = "", fehler = false;
      try { ausgabe = ausfuehren(zeile) || ""; } catch (err) { ausgabe = err.message; fehler = true; }
      if (ausgabe) elt("pre", fehler ? "ak-term-fehler" : "ak-term-ausgabe", ausgabe, fenster);
      zeigePrompt(); pruefe(zeile, ausgabe, fehler); fenster.scrollTop = fenster.scrollHeight;
    });
    eingabe.addEventListener("keydown", e => {
      if (e.key === "ArrowUp" && verlauf.length) { e.preventDefault(); hIndex = hIndex < 0 ? verlauf.length - 1 : Math.max(0, hIndex - 1); eingabe.value = verlauf[hIndex]; }
      if (e.key === "ArrowDown" && hIndex >= 0) { e.preventDefault(); hIndex++; eingabe.value = hIndex < verlauf.length ? verlauf[hIndex] : ""; if (hIndex >= verlauf.length) hIndex = -1; }
    });
    zeigePrompt(); zeichneAufgaben();
    if (cfg.begruessung) elt("pre", "ak-term-ausgabe", cfg.begruessung, fenster);
    return {ausfuehren: z => { eingabe.value = z; zeileBox.requestSubmit ? zeileBox.requestSubmit() : zeileBox.dispatchEvent(new Event("submit")); }, fertig: () => aktiv >= aufgaben.length, fs};
  }
  root.SDTerminal = {erstellen, HILFE};
})(typeof window !== "undefined" ? window : globalThis);
