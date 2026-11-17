/* SD Code-Studio · Python direkt im Browser (Pyodide, MPL-2.0)
   Python-Programme laufen auf dem eigenen Gerät statt auf einem fremden Server. Pyodide wird beim ersten
   Start einmalig geladen (etwa 10 MB von jsDelivr, danach aus dem Browser-Cache). Viele Pakete
   (numpy, pandas, matplotlib …) werden bei Bedarf automatisch nachgeladen. Läuft in einem Web Worker,
   damit die Seite nicht einfriert; nach 2 Minuten oder mit „Stopp“ wird das Programm beendet.
   Klappt das Laden nicht (z. B. offline), nimmt das Studio wie bisher den Online-Dienst. */
(function () {
  'use strict';
  const PYODIDE = 'https://cdn.jsdelivr.net/pyodide/v0.29.5/full/';   // feste Version (in CI geprüft), Pakete liegen daneben
  const ZEITLIMIT = 120000;
  let worker = null, bereit = null, laufNr = 0, aktuell = null;

  const WORKER_CODE = `
    let py = null, lauf = 0;
    self.onmessage = async (e) => {
      const m = e.data;
      if (m.typ === 'laden') {
        try {
          importScripts(m.basis + 'pyodide.js');
          py = await loadPyodide({ indexURL: m.basis });
          postMessage({ typ: 'bereit', version: py.version });
        } catch (err) { postMessage({ typ: 'ladefehler', text: String(err && err.message || err) }); }
        return;
      }
      if (m.typ !== 'start' || !py) return;
      lauf++;
      const dir = '/home/pyodide/lauf' + lauf;
      const zeilen = String(m.stdin || '').split('\\n'); if (zeilen.length && zeilen[zeilen.length - 1] === '') zeilen.pop();
      py.setStdout({ batched: s => postMessage({ typ: 'out', text: s + '\\n' }) });
      py.setStderr({ batched: s => postMessage({ typ: 'err', text: s + '\\n' }) });
      py.setStdin({ stdin: () => zeilen.length ? zeilen.shift() : undefined });
      try {
        postMessage({ typ: 'phase', text: 'Dateien' });
        for (const [pfad, inhalt] of Object.entries(m.dateien)) {
          const voll = dir + '/' + pfad; const ord = voll.slice(0, voll.lastIndexOf('/'));
          py.FS.mkdirTree(ord); py.FS.writeFile(voll, inhalt);
        }
        const haupt = dir + '/' + m.haupt; const hauptDir = haupt.slice(0, haupt.lastIndexOf('/'));
        postMessage({ typ: 'phase', text: 'Pakete' });
        try { await py.loadPackagesFromImports(Object.values(m.dateien).filter(t => typeof t === 'string').join('\\n'), { messageCallback: t => postMessage({ typ: 'info', text: t }) }); }
        catch (err) { postMessage({ typ: 'info', text: 'Pakete: ' + String(err && err.message || err) }); }
        postMessage({ typ: 'phase', text: 'Start' });
        py.globals.set('_sd_haupt', haupt); py.globals.set('_sd_dir', hauptDir);
        await py.runPythonAsync([
          'import sys, os, runpy',
          'for _k in [k for k, v in list(sys.modules.items()) if getattr(v, "__file__", "") and str(getattr(v, "__file__", "")).startswith("/home/pyodide/lauf")]:',
          '    del sys.modules[_k]',
          'sys.path = [p for p in sys.path if not str(p).startswith("/home/pyodide/lauf")]',
          'sys.path.insert(0, _sd_dir); os.chdir(_sd_dir); sys.argv = [_sd_haupt]',
          'runpy.run_path(_sd_haupt, run_name="__main__")'
        ].join('\\n'));
        postMessage({ typ: 'fertig' });
      } catch (err) {
        let t = String(err && err.message || err);
        if (/SystemExit/.test(t) && /SystemExit: (0|None)?\\s*$/.test(t.trim())) { postMessage({ typ: 'fertig' }); return; }
        postMessage({ typ: 'fehler', text: t.split(dir + '/').join('') });
      }
    };`;

  function laden() {
    if (bereit) return bereit;
    bereit = new Promise((ok, nein) => {
      const url = URL.createObjectURL(new Blob([WORKER_CODE], { type: 'text/javascript' }));
      worker = new Worker(url);
      const t = setTimeout(() => { nein(new Error('Pyodide hat nach 90 s nicht geladen.')); }, 90000);
      worker.onmessage = e => {
        if (e.data.typ === 'bereit') { clearTimeout(t); ok(e.data.version); }
        else if (e.data.typ === 'ladefehler') { clearTimeout(t); nein(new Error(e.data.text)); }
        else if (aktuell) aktuell(e.data);
      };
      worker.onerror = e => { clearTimeout(t); nein(new Error(e.message || 'Worker-Fehler')); };
      worker.postMessage({ typ: 'laden', basis: PYODIDE });
    }).catch(e => { beenden(); throw e; });
    return bereit;
  }

  function beenden() { if (worker) { try { worker.terminate(); } catch (e) { /* egal */ } } worker = null; bereit = null; aktuell = null; }

  // Gibt 'fallback' zurück, wenn Pyodide nicht geladen werden konnte (dann nimmt das Studio den Online-Dienst).
  async function starten(o) {
    const nr = ++laufNr, t0 = Date.now();
    const zeigen = (kopf, text) => { if (typeof ausgabe === 'function') ausgabe(kopf + (text ? '\n\n' + text : '')); };
    zeigen('⏳ Starte ' + o.haupt + ' (Python, direkt im Browser) …' + (bereit ? '' : '\nBeim ersten Mal wird Python einmalig geladen (etwa 10 MB) – das dauert ein paar Sekunden.'));
    let version;
    try { version = await laden(); } catch (e) {
      zeigen('ℹ Python im Browser ließ sich nicht laden (' + e.message + ').\nDas Studio nimmt stattdessen den Online-Dienst.');
      return 'fallback';
    }
    let out = '', info = '', phase = '';
    const ergebnis = await new Promise(ok => {
      const uhr = setInterval(() => zeigen('⏳ Läuft (Python im Browser) … ' + Math.round((Date.now() - t0) / 1000) + ' s' + (info ? '\n' + info : ''), out), 1000);
      const stopp = setTimeout(() => { clearInterval(uhr); beenden(); ok({ typ: 'zeit' }); }, o.zeitlimit || ZEITLIMIT);
      aktuell = d => {
        if (nr !== laufNr) return;
        if (d.typ === 'out' || d.typ === 'err') out += d.text;
        else if (d.typ === 'info') info = d.text;
        else if (d.typ === 'phase') phase = d.text;
        else if (d.typ === 'fertig' || d.typ === 'fehler') { clearInterval(uhr); clearTimeout(stopp); aktuell = null; ok(d); }
      };
      SDPython._stopp = () => { clearInterval(uhr); clearTimeout(stopp); beenden(); ok({ typ: 'gestoppt' }); };
      worker.postMessage({ typ: 'start', dateien: o.dateien, haupt: o.haupt, stdin: o.stdin || '' });
    });
    SDPython._stopp = null;
    const kopfInfo = 'Python im Browser · Pyodide ' + version + ' · ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s';
    if (ergebnis.typ === 'fertig') { zeigen('✅ Ausgeführt (' + kopfInfo + ')', out || '(keine Ausgabe)'); return 'ok'; }
    if (ergebnis.typ === 'zeit') { zeigen('⏹ Nach ' + Math.round((o.zeitlimit || ZEITLIMIT) / 1000) + ' s beendet (Endlosschleife oder wartet auf Eingabe?) [Schritt: ' + (phase || '?') + (info ? ' · ' + info : '') + ']', out); return 'fehler'; }
    if (ergebnis.typ === 'gestoppt') { zeigen('⏹ Gestoppt.', out); return 'fehler'; }
    const tb = aufraeumen(String(ergebnis.text || ''));
    const fehlt = (tb.match(/No module named '([\w.]+)'/) || [])[1];
    const tipp = fehlt ? '\n\n💡 Das Modul „' + fehlt + '“ gibt es im Browser nicht' + (/^(tkinter|turtle|pygame|_tkinter)/.test(fehlt) ? ' (Fenster-Programme laufen nur auf dem PC).' : '.') + ' Nimm „💻 Auf meinem PC ausführen“ (SD KI-Agent) oder lade das Startpaket herunter.' : '';
    zeigen('❌ LAUFZEITFEHLER (' + kopfInfo + ')', (out ? 'Ausgabe:\n' + out + '\n' : '') + tb.trim() + tipp);
    if (typeof fehlerSammeln === 'function') fehlerSammeln(tb, o.haupt);
    return 'fehler';
  }

  // Interne Pyodide-/runpy-Zeilen aus dem Traceback entfernen – übrig bleiben nur die Zeilen aus deinen Dateien
  function aufraeumen(tb) {
    const z = tb.split('\n'), aus = [];
    for (let i = 0; i < z.length; i++) {
      if (/^\s*File "(\/lib\/|<exec>|<frozen )/.test(z[i])) { while (i + 1 < z.length && /^\s{4,}/.test(z[i + 1]) && !/^\s*File "/.test(z[i + 1])) i++; continue; }
      aus.push(z[i]);
    }
    return aus.join('\n');
  }

  window.SDPython = { starten, laden, beenden, _stopp: null, get geladen() { return !!bereit; } };
})();
