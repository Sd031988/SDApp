/* SD Entwickler-Tools: reine Textwerkzeuge, ohne Projektzugriff oder Netzwerkanfragen. */
(function (root) {
  'use strict';
  const MAX = 250000;
  function limited(value) {
    const text = String(value == null ? '' : value);
    if (text.length > MAX) throw new Error('Eingabe zu groß (maximal 250.000 Zeichen).');
    return text;
  }
  function json(text, pretty) {
    const value = JSON.parse(limited(text));
    return JSON.stringify(value, null, pretty ? 2 : 0);
  }
  function encodeBase64(text) {
    const bytes = new TextEncoder().encode(limited(text));
    let binary = '';
    for (let i = 0; i < bytes.length; i += 8192) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
    }
    return btoa(binary);
  }
  function decodeBase64(text) {
    const value = limited(text).replace(/\s+/g, '');
    if (!value || value.length % 4 !== 0 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) {
      throw new Error('Keine gültige Base64-Eingabe.');
    }
    const binary = atob(value);
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  }
  function compare(left, right) {
    const a = limited(left).replace(/\r\n?/g, '\n').split('\n');
    const b = limited(right).replace(/\r\n?/g, '\n').split('\n');
    if (a.length * b.length > 160000) throw new Error('Zu viele Zeilen für den Vergleich (maximal 160.000 Zeilenpaare).');
    const dp = Array.from({ length: a.length + 1 }, () => new Uint32Array(b.length + 1));
    for (let i = a.length - 1; i >= 0; i--) {
      for (let j = b.length - 1; j >= 0; j--) {
        dp[i][j] = a[i] === b[j] ? 1 + dp[i + 1][j + 1] : Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
    let i = 0, j = 0;
    const lines = [];
    while (i < a.length || j < b.length) {
      if (i < a.length && j < b.length && a[i] === b[j]) {
        lines.push('  ' + a[i++]); j++;
      } else if (i < a.length && (j === b.length || dp[i + 1][j] >= dp[i][j + 1])) {
        lines.push('- ' + a[i++]);
      } else {
        lines.push('+ ' + b[j++]);
      }
    }
    return lines.join('\n');
  }
  const tools = Object.freeze({
    'json-pretty': { title: 'JSON formatieren', detail: 'Gültiges JSON lesbar einrücken.', run: s => json(s, true) },
    'json-min': { title: 'JSON komprimieren', detail: 'Leerzeichen außerhalb von Textwerten entfernen.', run: s => json(s, false) },
    'base64-encode': { title: 'Base64 kodieren', detail: 'Unicode-Text nach Base64 umwandeln.', run: s => encodeBase64(s) },
    'base64-decode': { title: 'Base64 dekodieren', detail: 'Base64 als UTF-8-Text anzeigen.', run: s => decodeBase64(s) },
    'url-encode': { title: 'URL kodieren', detail: 'Text als URL-Komponente kodieren.', run: s => encodeURIComponent(limited(s)) },
    'url-decode': { title: 'URL dekodieren', detail: 'Prozentkodierung als Text dekodieren.', run: s => decodeURIComponent(limited(s)) },
    'text-diff': { title: 'Texte vergleichen', detail: 'Entfernte (-) und neue (+) Zeilen ansehen.', run: (s, other) => compare(s, other) }
  });
  function detect(text) {
    const value = limited(text).trim();
    if (!value) return null;
    if ((value[0] === '{' || value[0] === '[')) {
      try { JSON.parse(value); return 'json-pretty'; } catch (_) { /* Keine automatische Auswahl bei fehlerhaftem JSON. */ }
    }
    if (/%[0-9a-f]{2}/i.test(value)) return 'url-decode';
    if (value.length >= 16 && value.length % 4 === 0 &&
        /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value) &&
        /[=+/]/.test(value)) return 'base64-decode';
    return null;
  }
  function run(id, source, other) {
    if (!Object.prototype.hasOwnProperty.call(tools, id)) throw new Error('Unbekanntes Werkzeug.');
    return tools[id].run(limited(source), limited(other || ''));
  }
  function init(doc) {
    const select = doc.getElementById('tool');
    if (!select) return;
    const source = doc.getElementById('source');
    const second = doc.getElementById('second');
    const compareArea = doc.getElementById('compareArea');
    const output = doc.getElementById('output');
    const description = doc.getElementById('description');
    const status = doc.getElementById('status');
    const picks = Array.from(doc.querySelectorAll('[data-tool]'));
    const setStatus = (message, error) => {
      status.textContent = message;
      status.dataset.state = error ? 'error' : 'ok';
    };
    function choose(id) {
      if (!Object.prototype.hasOwnProperty.call(tools, id)) return;
      select.value = id;
      description.textContent = tools[id].detail;
      compareArea.hidden = id !== 'text-diff';
      picks.forEach(button => {
        const active = button.dataset.tool === id;
        button.setAttribute('aria-pressed', String(active));
        button.classList.toggle('selected', active);
      });
      output.value = '';
      setStatus('Bereit. Inhalte bleiben auf diesem Gerät.', false);
    }
    picks.forEach(button => button.addEventListener('click', () => choose(button.dataset.tool)));
    select.addEventListener('change', () => choose(select.value));
    doc.getElementById('autoDetect').addEventListener('click', () => {
      const suggestion = detect(source.value);
      if (suggestion) {
        choose(suggestion);
        setStatus('Erkannt: ' + tools[suggestion].title + '. Bitte Ausführen wählen.', false);
      } else {
        setStatus('Kein eindeutiges Format erkannt. Werkzeug bitte selbst wählen.', false);
      }
    });
    doc.getElementById('execute').addEventListener('click', () => {
      try {
        output.value = run(select.value, source.value, second.value);
        setStatus('Fertig. Das Original bleibt unverändert.', false);
      } catch (error) {
        output.value = '';
        setStatus('Fehler: ' + (error instanceof Error ? error.message : 'Unbekannter Fehler'), true);
      }
    });
    doc.getElementById('clear').addEventListener('click', () => {
      source.value = ''; second.value = ''; output.value = '';
      setStatus('Eingaben geleert.', false); source.focus();
    });
    doc.getElementById('copy').addEventListener('click', async () => {
      if (!output.value) { setStatus('Es gibt noch kein Ergebnis zum Kopieren.', true); return; }
      try {
        if (!root.navigator || !root.navigator.clipboard || !root.navigator.clipboard.writeText) throw new Error('Zwischenablage nicht verfügbar');
        await root.navigator.clipboard.writeText(output.value);
        setStatus('Ergebnis kopiert.', false);
      } catch (_) {
        output.focus(); output.select();
        setStatus('Bitte das markierte Ergebnis manuell kopieren.', false);
      }
    });
    choose(select.value || 'json-pretty');
  }
  const api = Object.freeze({ tools, detect, run, compare, encodeBase64, decodeBase64 });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root.document) {
    root.SDDevTools = api;
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', () => init(root.document));
    else init(root.document);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
