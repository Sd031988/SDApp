/* SD Hub – Chat-Liste fuer KI-Assistent und KI-Agent.
   Mehrere Gespraeche ("Chats") lokal im Browser: neuen Chat beginnen,
   zwischen alten Chats wechseln, einzelne oder alle loeschen.
   Speicher: localStorage
     <praefix>Index      = { aktiv: id|null, chats: [{ id, titel, erstellt, geaendert }] }
     <praefix>:<id>      = Daten des Chats (Format bestimmt die Seite)
   Nichts wird gesendet. */
(function () {
  'use strict';

  const MAX_CHATS = 60;
  const TEXTE = {
    de: { chats: 'Chats', neu: '＋ Neuer Chat', leer: 'Noch keine gespeicherten Chats.', loeschen: 'Löschen', sicher: 'Wirklich löschen?',
      alle: 'Alle Chats löschen', alle_sicher: 'Alle wirklich löschen?', schliessen: 'Schließen', ohne_titel: 'Neuer Chat',
      heute: 'Heute', gestern: 'Gestern', frueher: 'Früher', lokal: 'Gespeichert nur in diesem Browser.', aktiv: 'aktuell' },
    en: { chats: 'Chats', neu: '＋ New chat', leer: 'No saved chats yet.', loeschen: 'Delete', sicher: 'Really delete?',
      alle: 'Delete all chats', alle_sicher: 'Really delete all?', schliessen: 'Close', ohne_titel: 'New chat',
      heute: 'Today', gestern: 'Yesterday', frueher: 'Earlier', lokal: 'Saved only in this browser.', aktiv: 'current' }
  };
  const tx = (k) => (TEXTE[window.SD_LANG === 'en' ? 'en' : 'de'][k]);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function lies(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function schreib(k, v) {
    try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); return true; } catch (e) { return false; }
  }

  let stilDa = false;
  function stil() {
    if (stilDa) return; stilDa = true;
    const s = document.createElement('style');
    s.textContent = `
      .sdc-hinter { position: fixed; inset: 0; z-index: 9990; background: rgba(15, 23, 42, .42); opacity: 0; transition: opacity .2s ease; }
      .sdc-hinter.offen { opacity: 1; }
      .sdc-panel { position: fixed; z-index: 9991; top: 0; bottom: 0; left: 0; width: min(340px, 88vw); background: #fff; color: #172a3a;
        box-shadow: 8px 0 30px rgba(0, 0, 0, .22); display: flex; flex-direction: column; transform: translateX(-104%); transition: transform .25s cubic-bezier(.2, .8, .2, 1);
        padding-top: env(safe-area-inset-top, 0px); padding-bottom: env(safe-area-inset-bottom, 0px); font-family: inherit; }
      .sdc-panel.offen { transform: none; }
      .sdc-kopf { display: flex; align-items: center; gap: 8px; padding: 14px 14px 10px; border-bottom: 1px solid #e3e8ec; }
      .sdc-kopf h2 { margin: 0; font-size: 1.1rem; flex: 1; }
      .sdc-x { border: 0; background: #f1f4f6; border-radius: 10px; width: 38px; height: 38px; font-size: 1.1rem; cursor: pointer; color: inherit; }
      .sdc-neu { margin: 12px 14px 6px; border: 0; border-radius: 12px; padding: 12px 14px; font: inherit; font-weight: 700; font-size: .95rem; cursor: pointer;
        background: linear-gradient(135deg, #2f7d72, #1c4a42); color: #fff; text-align: left; box-shadow: 0 3px 10px rgba(28, 74, 66, .25); }
      .sdc-liste { flex: 1; overflow-y: auto; padding: 4px 8px 10px; -webkit-overflow-scrolling: touch; }
      .sdc-gruppe { font-size: .72rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: #6b7a86; margin: 12px 8px 4px; }
      .sdc-eintrag { display: flex; align-items: center; gap: 4px; border-radius: 10px; }
      .sdc-eintrag:hover { background: #f3f6f7; }
      .sdc-eintrag.an { background: #e4f1ee; }
      .sdc-oeffnen { flex: 1; min-width: 0; border: 0; background: none; text-align: left; padding: 10px 8px; font: inherit; color: inherit; cursor: pointer; }
      .sdc-oeffnen b { display: block; font-size: .92rem; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .sdc-oeffnen small { color: #6b7a86; font-size: .75rem; }
      .sdc-weg { border: 0; background: none; border-radius: 8px; min-width: 36px; height: 36px; cursor: pointer; font-size: .95rem; color: #8a96a0; padding: 0 6px; font-family: inherit; }
      .sdc-weg:hover { background: #fdecea; color: #b42318; }
      .sdc-weg.sicher { background: #b42318; color: #fff; font-size: .78rem; font-weight: 700; }
      .sdc-leer { color: #6b7a86; font-size: .88rem; padding: 14px 10px; }
      .sdc-fuss { border-top: 1px solid #e3e8ec; padding: 10px 14px 12px; display: grid; gap: 6px; }
      .sdc-fuss small { color: #6b7a86; font-size: .75rem; }
      .sdc-alle { border: 1px solid #f1c4bf; background: #fff; color: #b42318; border-radius: 10px; padding: 8px 10px; font: inherit; font-size: .85rem; font-weight: 600; cursor: pointer; }
      .sdc-alle.sicher { background: #b42318; color: #fff; }
      @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) .sdc-panel { background: #17212b; color: #e6edf3; }
        :root:not([data-theme="light"]) .sdc-eintrag:hover { background: #1f2c38; } :root:not([data-theme="light"]) .sdc-eintrag.an { background: #1d3a35; }
        :root:not([data-theme="light"]) .sdc-x { background: #24313d; } :root:not([data-theme="light"]) .sdc-alle { background: transparent; }
        :root:not([data-theme="light"]) .sdc-kopf, :root:not([data-theme="light"]) .sdc-fuss { border-color: #2a3845; } }
      @media (prefers-reduced-motion: reduce) { .sdc-panel, .sdc-hinter { transition: none; } }
    `;
    document.head.appendChild(s);
  }

  /**
   * opt: { praefix, beimWechsel(id, daten), beimNeu(), darfWechseln() -> bool }
   */
  function erstelle(opt) {
    const IDX = opt.praefix + 'Index';
    function index() {
      try { const i = JSON.parse(lies(IDX) || 'null'); if (i && Array.isArray(i.chats)) return i; } catch (e) { /* kaputt */ }
      return { aktiv: null, chats: [] };
    }
    function speichereIndex(i) { return schreib(IDX, JSON.stringify(i)); }
    const neueId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

    const api = {
      liste() { return index().chats.slice().sort((a, b) => b.geaendert - a.geaendert); },
      aktiv() { return index().aktiv; },
      lade(id) {
        if (!id) return null;
        try { return JSON.parse(lies(opt.praefix + ':' + id) || 'null'); } catch (e) { return null; }
      },
      // Speichert die Daten des aktiven Chats; legt ihn beim ersten Mal an.
      speichere(daten, titel) {
        const i = index();
        let id = i.aktiv;
        let e = id && i.chats.find(c => c.id === id);
        if (!e) { id = neueId(); e = { id, titel: '', erstellt: Date.now(), geaendert: Date.now() }; i.chats.push(e); i.aktiv = id; }
        if (titel && !e.titel) e.titel = String(titel).replace(/\s+/g, ' ').trim().slice(0, 70);
        e.geaendert = Date.now();
        // Zu viele Chats: die aeltesten (nicht den aktiven) entfernen
        while (i.chats.length > MAX_CHATS) {
          const alt = i.chats.filter(c => c.id !== id).sort((a, b) => a.geaendert - b.geaendert)[0];
          if (!alt) break;
          schreib(opt.praefix + ':' + alt.id, null);
          i.chats = i.chats.filter(c => c.id !== alt.id);
        }
        let ok = schreib(opt.praefix + ':' + id, JSON.stringify(daten));
        // Speicher voll: aelteste andere Chats loeschen, bis es passt
        while (!ok) {
          const alt = i.chats.filter(c => c.id !== id).sort((a, b) => a.geaendert - b.geaendert)[0];
          if (!alt) break;
          schreib(opt.praefix + ':' + alt.id, null);
          i.chats = i.chats.filter(c => c.id !== alt.id);
          ok = schreib(opt.praefix + ':' + id, JSON.stringify(daten));
        }
        speichereIndex(i);
        if (panel && panel.classList.contains('offen')) zeichne();
        return ok;
      },
      titel(t) {
        const i = index(); const e = i.chats.find(c => c.id === i.aktiv);
        if (e && t) { e.titel = String(t).replace(/\s+/g, ' ').trim().slice(0, 70); speichereIndex(i); }
      },
      neu() { const i = index(); i.aktiv = null; speichereIndex(i); },
      setzeAktiv(id) { const i = index(); i.aktiv = id; speichereIndex(i); },
      loesche(id) {
        const i = index();
        schreib(opt.praefix + ':' + id, null);
        i.chats = i.chats.filter(c => c.id !== id);
        const warAktiv = i.aktiv === id;
        if (warAktiv) i.aktiv = null;
        speichereIndex(i);
        return warAktiv;
      },
      loescheAlle() {
        index().chats.forEach(c => schreib(opt.praefix + ':' + c.id, null));
        speichereIndex({ aktiv: null, chats: [] });
      },
      // Alten Einzel-Verlauf einmalig als ersten Chat uebernehmen
      uebernimm(daten, titel) {
        if (index().chats.length || !daten) return false;
        api.speichere(daten, titel);
        return true;
      },
      oeffne() { stil(); baue(); zeichne(); hinter.hidden = false; requestAnimationFrame(() => { hinter.classList.add('offen'); panel.classList.add('offen'); }); setTimeout(() => { const f = panel.querySelector('.sdc-neu'); if (f) f.focus(); }, 60); },
      schliesse() { if (!panel) return; panel.classList.remove('offen'); hinter.classList.remove('offen'); setTimeout(() => { hinter.hidden = true; }, 220); }
    };

    let panel = null, hinter = null;
    function baue() {
      if (panel) return;
      hinter = document.createElement('div'); hinter.className = 'sdc-hinter'; hinter.hidden = true;
      hinter.addEventListener('click', api.schliesse);
      panel = document.createElement('aside'); panel.className = 'sdc-panel'; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true');
      document.body.appendChild(hinter); document.body.appendChild(panel);
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && panel.classList.contains('offen')) api.schliesse(); });
      panel.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.classList.contains('sdc-x')) { api.schliesse(); return; }
        if (opt.darfWechseln && !opt.darfWechseln()) return;
        if (b.classList.contains('sdc-neu')) { api.neu(); opt.beimNeu(); api.schliesse(); return; }
        if (b.classList.contains('sdc-oeffnen')) {
          const id = b.dataset.id;
          if (id !== api.aktiv()) { api.setzeAktiv(id); opt.beimWechsel(id, api.lade(id)); }
          api.schliesse(); return;
        }
        if (b.classList.contains('sdc-weg')) {
          // Kein confirm(): zweimal tippen
          if (!b.classList.contains('sicher')) {
            panel.querySelectorAll('.sicher').forEach(x => { x.classList.remove('sicher'); if (x.classList.contains('sdc-weg')) x.textContent = '🗑️'; });
            b.classList.add('sicher'); b.textContent = tx('sicher');
            setTimeout(() => { if (b.isConnected) { b.classList.remove('sicher'); b.textContent = '🗑️'; } }, 4000);
            return;
          }
          if (api.loesche(b.dataset.id)) opt.beimNeu();
          zeichne(); return;
        }
        if (b.classList.contains('sdc-alle')) {
          if (!b.classList.contains('sicher')) { b.classList.add('sicher'); b.textContent = tx('alle_sicher'); setTimeout(() => { if (b.isConnected) { b.classList.remove('sicher'); b.textContent = tx('alle'); } }, 4000); return; }
          api.loescheAlle(); opt.beimNeu(); zeichne();
        }
      });
    }
    function gruppe(ts) {
      const tag = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const h = tag(new Date()), t = tag(new Date(ts));
      return t === h ? tx('heute') : (h - t === 86400000 ? tx('gestern') : tx('frueher'));
    }
    function zeichne() {
      if (!panel) return;
      const l = api.liste(), aktiv = api.aktiv();
      let html = '<div class="sdc-kopf"><h2>💬 ' + esc(tx('chats')) + '</h2><button type="button" class="sdc-x" aria-label="' + esc(tx('schliessen')) + '">✕</button></div>' +
        '<button type="button" class="sdc-neu">' + esc(tx('neu')) + '</button><div class="sdc-liste">';
      if (!l.length) html += '<p class="sdc-leer">' + esc(tx('leer')) + '</p>';
      let letzte = '';
      l.forEach(c => {
        const g = gruppe(c.geaendert);
        if (g !== letzte) { html += '<div class="sdc-gruppe">' + esc(g) + '</div>'; letzte = g; }
        const zeit = new Date(c.geaendert);
        const wann = g === tx('frueher') ? zeit.toLocaleDateString(window.SD_LANG === 'en' ? 'en-GB' : 'de-DE') : zeit.toLocaleTimeString(window.SD_LANG === 'en' ? 'en-GB' : 'de-DE', { hour: '2-digit', minute: '2-digit' });
        html += '<div class="sdc-eintrag' + (c.id === aktiv ? ' an' : '') + '"><button type="button" class="sdc-oeffnen" data-id="' + esc(c.id) + '"><b>' + esc(c.titel || tx('ohne_titel')) + '</b><small>' + esc(wann) + (c.id === aktiv ? ' · ' + esc(tx('aktiv')) : '') + '</small></button>' +
          '<button type="button" class="sdc-weg" data-id="' + esc(c.id) + '" aria-label="' + esc(tx('loeschen')) + '" title="' + esc(tx('loeschen')) + '">🗑️</button></div>';
      });
      html += '</div><div class="sdc-fuss"><small>🔒 ' + esc(tx('lokal')) + '</small>' + (l.length ? '<button type="button" class="sdc-alle">' + esc(tx('alle')) + '</button>' : '') + '</div>';
      panel.innerHTML = html;
      panel.setAttribute('aria-label', tx('chats'));
    }
    return api;
  }

  window.SDChats = { erstelle };
})();
