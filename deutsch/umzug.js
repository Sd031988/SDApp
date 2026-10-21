/* SD Hub – Deutsch lernen: Lernstand aus „SD Maschinen Kenner“ übernehmen.
   Der alte Lernbereich öffnet  …/deutsch/#umzug=z.<Base64url>  (deflate-raw) oder  #umzug=j.<Base64url>  (JSON).
   Die Daten stehen nur im #-Teil der Adresse – der wird nie an einen Server geschickt. */
(function () {
  'use strict';
  const KEY = 'sdLearn';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

  function b64url(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    const bin = atob(s), u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    return u;
  }
  async function lesen(teil) {
    const art = teil.slice(0, 2), bytes = b64url(teil.slice(2));
    let text;
    if (art === 'z.') {
      const st = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      text = await new Response(st).text();
    } else if (art === 'j.') text = new TextDecoder().decode(bytes);
    else throw new Error('Unbekanntes Format');
    const d = JSON.parse(text);
    if (!d || typeof d.profiles !== 'object') throw new Error('Keine Lernprofile gefunden');
    return d;
  }
  // Zusammenführen: neue Profile dazu; gibt es das Profil schon, gewinnt der neuere Stand
  function zusammen(alt, neu) {
    const out = alt && alt.profiles ? alt : {profiles: {}, active: null, deleted: {}};
    let n = 0;
    Object.entries(neu.profiles).forEach(([id, p]) => {
      if (!p || typeof p !== 'object' || !p.name) return;
      const da = out.profiles[id];
      if (!da || (p.updated || 0) > (da.updated || 0)) { out.profiles[id] = p; n++; }
    });
    if (!out.active || !out.profiles[out.active]) out.active = neu.active && out.profiles[neu.active] ? neu.active : (Object.keys(out.profiles)[0] || null);
    return [out, n];
  }
  function hashWeg() { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { location.hash = ''; } }

  async function pruefen() {
    const m = location.hash.match(/[#&]umzug=([^&]+)/);
    if (!m) return;
    let d;
    try { d = await lesen(m[1]); } catch (e) {
      hashWeg();
      zeige('<h2 class="l-h">⚠️ Umzug hat nicht geklappt</h2><p>Der Lernstand konnte nicht gelesen werden (' + esc(e.message) + '). Öffne den Lernbereich in SD Maschinen Kenner und tippe nochmal auf „Mitnehmen“.</p>', [['OK', () => location.reload()]]);
      return;
    }
    const namen = Object.values(d.profiles).filter(p => p && p.name).map(p => '👤 <b>' + esc(p.name) + '</b> · ' + esc(p.level || '') + ' · ⭐ ' + (p.xp || 0));
    zeige('<h2 class="l-h">📦 Lernstand übernehmen</h2><p>Aus <b>SD Maschinen Kenner</b> kommen ' + namen.length + ' Profil(e):</p><p>' + namen.join('<br>') + '</p>' +
      '<p class="l-note">Profile, die es hier schon gibt, werden nur ersetzt, wenn der mitgebrachte Stand neuer ist.</p>',
    [['✓ Übernehmen', () => {
      let alt = null; try { alt = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { alt = null; }
      const [neu, n] = zusammen(alt, d);
      try { localStorage.setItem(KEY, JSON.stringify(neu)); } catch (e) { alert('Speichern ging nicht: ' + e.message); return; }
      try { sessionStorage.setItem('sdUmzugOk', String(n)); } catch (e) {}
      hashWeg(); location.reload();
    }], ['Abbrechen', () => { hashWeg(); location.reload(); }]]);
  }
  function zeige(html, knoepfe) {
    const b = document.getElementById('lBody');
    if (!b) return;
    b.innerHTML = '<div class="l-wrap"><div class="l-card l-umzug">' + html + '<div class="l-grid" id="lUmzugK"></div></div></div>';
    const k = document.getElementById('lUmzugK');
    knoepfe.forEach(([t, f], i) => { const x = document.createElement('button'); x.type = 'button'; x.className = 'l-btn' + (i ? '' : ' l-primary'); x.textContent = t; x.onclick = f; k.appendChild(x); });
  }
  window.SDUmzug = {pruefen, _lesen: lesen, _zusammen: zusammen};
  window.addEventListener('hashchange', () => { if (/umzug=/.test(location.hash)) pruefen(); });
  // Erfolgsmeldung nach dem Neuladen
  window.addEventListener('load', () => {
    let n = null; try { n = sessionStorage.getItem('sdUmzugOk'); sessionStorage.removeItem('sdUmzugOk'); } catch (e) {}
    if (n == null) return;
    const d = document.createElement('div');
    d.className = 'sd-sync-info'; d.style.cssText = 'position:fixed;left:50%;transform:translateX(-50%);bottom:20px;z-index:9999;background:#172a3a;color:#fff;padding:10px 14px;border-radius:10px';
    d.textContent = '✅ Lernstand übernommen (' + n + ' Profil(e)).';
    document.body.appendChild(d); setTimeout(() => d.remove(), 5000);
  });
})();
