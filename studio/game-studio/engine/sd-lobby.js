/* SD Lobby – Konto im Browser (Level, BP), Belohnungen nach jeder Runde, Kisten öffnen und Garderobe.
   Alles nur zum Spaß: BP verdient man ausschließlich durch Spielen, es gibt nichts zu kaufen und kein echtes Geld. */
'use strict';
(function () {
  const SELTEN = { g: ['Gewöhnlich', '#9aa4ae'], s: ['Selten', '#3a8ae8'], e: ['Episch', '#a54ae8'], l: ['Legendär', '#f0b43a'] };
  // Sachen, die man bekommen kann: Kleidung (Oberteil/Hose), Fallschirm, Waffenfarbe
  const SACHEN = [
    ['o_wald', 'outfit', 'Waldtarn', 'g', { oberteil: '#4a5a3a', hose: '#3a4030' }], ['o_stadt', 'outfit', 'Stadtgrau', 'g', { oberteil: '#6a6e74', hose: '#3a3e44' }], ['o_sand', 'outfit', 'Wüstensand', 'g', { oberteil: '#b8a070', hose: '#8a7450' }],
    ['o_marine', 'outfit', 'Marineblau', 's', { oberteil: '#1f3a6a', hose: '#1a2236' }], ['o_rot', 'outfit', 'Feuerrot', 's', { oberteil: '#b8302a', hose: '#2a2a2a' }], ['o_weiss', 'outfit', 'Schneeweiß', 'e', { oberteil: '#e8eaee', hose: '#c8ccd2' }],
    ['o_nacht', 'outfit', 'Nachtschwarz', 'e', { oberteil: '#16181c', hose: '#0e1013', weste: true, westeFarbe: '#22262c' }], ['o_gold', 'outfit', 'Goldlegende', 'l', { oberteil: '#c89a2a', hose: '#2a2218', weste: true, westeFarbe: '#e0b84a' }],
    ['s_rot', 'schirm', 'Fallschirm Rot', 'g', '#d8402a'], ['s_gruen', 'schirm', 'Fallschirm Grün', 'g', '#3a8a4a'], ['s_blau', 'schirm', 'Fallschirm Blau', 's', '#2a6ad8'], ['s_lila', 'schirm', 'Fallschirm Lila', 'e', '#8a3ad8'], ['s_gold', 'schirm', 'Fallschirm Gold', 'l', '#f0c040'],
    ['w_schwarz', 'skin', 'Alle Waffen: Mattschwarz', 'g', { fuer: 'alle', farbe: '#1a1c20' }], ['w_tarn', 'skin', 'Alle Waffen: Waldtarn', 's', { fuer: 'alle', muster: 'tarn', farbe: '#4a5a30', akzent: '#2a3020' }],
    ['w_blau', 'skin', 'Alle Waffen: Eisblau', 'e', { fuer: 'alle', farbe: '#5ab8e8', metall: 0.8, rau: 0.25 }], ['w_gold', 'skin', 'Alle Waffen: Gold', 'l', { fuer: 'alle', farbe: '#e8b830', metall: 1, rau: 0.2 }],
  ];
  // Skins für einzelne Waffen (Muster: tarn, wueste, digital, streifen, karbon)
  const WAFFEN_SKINS = { gewehr: 'M-4', ak: 'K-47', bullpup: 'AU-9', mp: 'MP-9', vektor: 'V-45', dmr: 'SK-14', scharfschuetze: 'K-98', magnum: 'AM-3', schrotflinte: 'S-6', mg: 'M-249', pistole: 'Pistole', revolver: 'R-6' };
  const VARIANTEN = [['wueste', 'Wüste', 'g', { muster: 'wueste', farbe: '#c8b080', akzent: '#9a7a50' }], ['digital', 'Digital', 's', { muster: 'digital', farbe: '#5a6a70', akzent: '#2a3238' }], ['streifen', 'Tigerstreifen', 'e', { muster: 'streifen', farbe: '#e89a2a', akzent: '#1a1410' }], ['karbon', 'Karbon', 'e', { muster: 'karbon', farbe: '#2a2c30', akzent: '#16171a', metall: 0.4 }], ['drache', 'Drachenrot', 'l', { farbe: '#b8201a', metall: 0.7, rau: 0.25, leuchten: '#ff5020' }]];
  for (const [w, n] of Object.entries(WAFFEN_SKINS)) for (const [vid, vn, sel, sk] of VARIANTEN) SACHEN.push(['k_' + w + '_' + vid, 'skin', n + ' ' + vn, sel, Object.assign({ fuer: w }, sk)]);
  const KISTEN = { normal: { name: 'Normale Kiste', preis: 700, chance: { g: 0.62, s: 0.28, e: 0.08, l: 0.02 } }, selten: { name: 'Elite-Kiste', preis: 1800, chance: { g: 0.2, s: 0.45, e: 0.27, l: 0.08 } } };
  const lies = () => { try { return JSON.parse(localStorage.getItem('sdEngineKonto') || 'null'); } catch (e) { return null; } };
  const K = Object.assign({ bp: 1000, xp: 0, level: 1, besitz: ['o_wald', 's_rot'], an: { outfit: null, schirm: null, skins: {} }, runden: 0, siege: 0, kills: 0 }, lies() || {});
  const speichern = () => { try { localStorage.setItem('sdEngineKonto', JSON.stringify(K)); } catch (e) { /* egal */ } anzeigen(); };
  const sache = id => SACHEN.find(x => x[0] === id);
  K.an.skins = K.an.skins || {};
  function kosmetik() { const o = K.an.outfit && sache(K.an.outfit), s = K.an.schirm && sache(K.an.schirm), ws = {}; for (const [w, id] of Object.entries(K.an.skins)) { const z = sache(id); if (z) ws[w] = z[4]; }
    return { mensch: o ? o[4] : undefined, schirmFarbe: s ? s[4] : undefined, waffenSkins: ws }; }
  const $ = id => document.getElementById(id), esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function anzeigen() { const e = $('lobbyLeiste'); if (e) e.textContent = '⭐ Level ' + K.level + ' · 💠 ' + K.bp + ' BP'; }
  /** nach der Runde: BP und Erfahrung */
  function rundeVorbei(r) {
    const bp = Math.round(r.kills * 40 + (r.sieg ? 500 : Math.max(0, 260 - (r.platz || 10) * 12)) + Math.min(240, r.zeit * 0.6)), xp = bp; K.bp += bp; K.xp += xp; K.runden++; K.kills += r.kills; if (r.sieg) K.siege++;
    let neu = 0; while (K.xp >= K.level * 1000) { K.xp -= K.level * 1000; K.level++; neu++; }
    if (neu) K.bp += neu * 700;   // je Levelaufstieg eine Kiste geschenkt (als BP)
    speichern(); return { bp, level: neu ? K.level : null };
  }
  /** Kiste öffnen mit Walze */
  function oeffnen(art) {
    const k = KISTEN[art]; if (K.bp < k.preis) return { fehler: 'Nicht genug BP – spiel ein paar Runden' }; K.bp -= k.preis;
    const zufall = () => { let x = Math.random(), sel = 'g'; for (const [s, c] of Object.entries(k.chance)) { if (x < c) { sel = s; break; } x -= c; } const liste = SACHEN.filter(z => z[3] === sel); return liste[Math.floor(Math.random() * liste.length)]; };
    const gewinn = zufall(), doppelt = K.besitz.includes(gewinn[0]); let ersatz = 0; if (doppelt) { ersatz = Math.round(k.preis * 0.3); K.bp += ersatz; } else K.besitz.push(gewinn[0]); speichern();
    const walze = []; for (let i = 0; i < 44; i++) walze.push(i === 38 ? gewinn : zufall()); return { gewinn, walze, doppelt, ersatz };
  }
  function vorschau(z) { const c = z[1] === 'outfit' ? z[4].oberteil : z[1] === 'skin' ? z[4].farbe : z[4]; const ic = z[1] === 'outfit' ? '👕' : z[1] === 'schirm' ? '🪂' : '🔫'; return '<div style="width:96px;flex:0 0 96px;height:96px;border-radius:10px;background:#141b24;border:2px solid ' + SELTEN[z[3]][1] + ';display:grid;place-items:center;text-align:center;font:600 11px system-ui"><div style="font-size:30px;filter:drop-shadow(0 0 6px ' + c + ')">' + ic + '</div><span style="display:block;width:22px;height:8px;border-radius:3px;background:' + c + ';margin:auto"></span>' + esc(z[2]) + '</div>'; }
  function dialog() {
    const box = $('lobbyInhalt'); if (!box) return; const tab = dialog.tab || 'kisten';
    let h = '<div style="display:flex;gap:6px;margin-bottom:10px"><button data-t="kisten" class="' + (tab === 'kisten' ? 'los' : '') + '">🎁 Kisten</button><button data-t="garderobe" class="' + (tab === 'garderobe' ? 'los' : '') + '">👕 Garderobe</button><button data-t="stats" class="' + (tab === 'stats' ? 'los' : '') + '">📊 Statistik</button></div>';
    if (tab === 'kisten') { h += '<p style="margin:0 0 8px;color:#cfd8e2">BP verdienst du in jeder Runde (Abschüsse, Platzierung, Überleben). Bei jedem Levelaufstieg gibt es 700 BP dazu. Kein echtes Geld.</p><div id="walzeRahmen" style="position:relative;overflow:hidden;height:104px;border-radius:10px;background:#0b1017;margin-bottom:10px"><div id="walze" style="display:flex;gap:8px;padding:4px;will-change:transform"></div><div style="position:absolute;left:50%;top:0;bottom:0;width:3px;background:#ffb547;box-shadow:0 0 10px #ffb547"></div></div><div id="walzeText" style="min-height:1.4em;font-weight:700;margin-bottom:8px"></div>';
      h += Object.entries(KISTEN).map(([id, k]) => '<button data-kiste="' + id + '" style="margin-right:6px">🎁 ' + k.name + ' – ' + k.preis + ' BP</button>').join('') + '<p class="ehrlich">Inhalt: Kleidung, Fallschirme und ' + SACHEN.filter(z => z[1] === 'skin').length + ' Waffen-Skins. Chancen Normale Kiste: Gewöhnlich 62 %, Selten 28 %, Episch 8 %, Legendär 2 % · Elite: 20 / 45 / 27 / 8 %. Doppeltes gibt 30 % BP zurück.</p>'; }
    if (tab === 'garderobe') { h += '<div style="max-height:52vh;overflow:auto">';
      const reihe = (name, liste, aktiv, key) => '<b>' + esc(name) + '</b><div style="display:flex;gap:6px;flex-wrap:wrap;margin:6px 0 10px"><button data-an="' + key + ':" class="' + (!aktiv ? 'los' : '') + '">Standard</button>' + liste.map(z => K.besitz.includes(z[0]) ? '<button data-an="' + key + ':' + z[0] + '" class="' + (aktiv === z[0] ? 'los' : '') + '" style="border-color:' + SELTEN[z[3]][1] + '">' + esc(z[2]) + '</button>' : '<button disabled style="opacity:.35;border-color:' + SELTEN[z[3]][1] + '">🔒 ' + esc(z[2]) + '</button>').join('') + '</div>';
      h += reihe('👕 Kleidung', SACHEN.filter(z => z[1] === 'outfit'), K.an.outfit, 'outfit') + reihe('🪂 Fallschirm', SACHEN.filter(z => z[1] === 'schirm'), K.an.schirm, 'schirm');
      h += reihe('🔫 Alle Waffen', SACHEN.filter(z => z[1] === 'skin' && z[4].fuer === 'alle'), K.an.skins.alle, 'skin.alle');
      for (const [w, n] of Object.entries(WAFFEN_SKINS)) h += reihe('🔫 ' + n, SACHEN.filter(z => z[1] === 'skin' && z[4].fuer === w), K.an.skins[w], 'skin.' + w);
      h += '</div>'; }
    if (tab === 'stats') h += '<p>⭐ Level ' + K.level + ' (' + K.xp + ' / ' + K.level * 1000 + ' EP)<br>💠 ' + K.bp + ' BP<br>🎮 Runden: ' + K.runden + ' · 🏆 Siege: ' + K.siege + ' · ☠ Abschüsse: ' + K.kills + '<br>👕 Gesammelt: ' + K.besitz.length + ' / ' + SACHEN.length + '</p><p class="ehrlich">Gespeichert nur in diesem Browser.</p>';
    box.innerHTML = h;
    box.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { dialog.tab = b.dataset.t; dialog(); });
    box.querySelectorAll('[data-an]').forEach(b => b.onclick = () => { const [kat, id] = b.dataset.an.split(':'); if (kat.startsWith('skin.')) { const w = kat.slice(5); if (id) K.an.skins[w] = id; else delete K.an.skins[w]; } else K.an[kat] = id || null; speichern(); dialog(); });
    box.querySelectorAll('[data-kiste]').forEach(b => b.onclick = () => { const r = oeffnen(b.dataset.kiste); if (r.fehler) { $('walzeText').textContent = '⨯ ' + r.fehler; return; } box.querySelectorAll('[data-kiste]').forEach(x => x.disabled = true);
      const w = $('walze'); w.innerHTML = r.walze.map(vorschau).join(''); w.style.transition = 'none'; w.style.transform = 'translateX(0)'; $('walzeText').textContent = '🎰 …';
      const rahmen = $('walzeRahmen').clientWidth, ziel = 4 + 38 * 104 + 48 - rahmen / 2 + (Math.random() - 0.5) * 60;
      requestAnimationFrame(() => requestAnimationFrame(() => { w.style.transition = 'transform 4.2s cubic-bezier(.12,.75,.15,1)'; w.style.transform = 'translateX(' + (-ziel) + 'px)'; }));
      setTimeout(() => { const g = r.gewinn; $('walzeText').innerHTML = '<span style="color:' + SELTEN[g[3]][1] + '">' + SELTEN[g[3]][0] + ': ' + esc(g[2]) + '</span>' + (r.doppelt ? ' – schon vorhanden, +' + r.ersatz + ' BP' : ' – neu! In der Garderobe anlegen'); box.querySelectorAll('[data-kiste]').forEach(x => x.disabled = false); anzeigen(); }, 4400); });
  }
  window.SDLobby = { konto: K, kosmetik, rundeVorbei, oeffnen, dialog, anzeigen, SACHEN };
  document.addEventListener('DOMContentLoaded', anzeigen); anzeigen();
})();
