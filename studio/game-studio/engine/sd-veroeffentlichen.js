/* SD Veröffentlichen – macht aus einem SD-Engine-Spiel eine eigene Webseite (Spieler-Seite) und stellt sie online.
   Die Seite lädt die Engine von thesdhub.com, das Spiel-Skript und eigene Dateien (Modelle, Foto-Häuser) liegen daneben.
   Veröffentlichen geht nur mit Zugangsschlüssel vom KI-Agenten (Schutz vor Missbrauch), über /hub/seite/veroeffentlichen. */
'use strict';
(function () {
  const BASIS = 'https://thesdhub.com/studio/game-studio/engine/', HUB = 'https://sd-maschinen-kenner.onrender.com';
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const alsDataUrl = b => new Promise((ok, nein) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = () => nein(r.error); r.readAsDataURL(b); });
  const sicher = n => String(n).toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').slice(0, 40);

  /** Welche eigenen Dateien braucht das Skript? */
  function eigeneNamen(code) { const n = new Set(); for (const re of [/fotoHaus\(\s*'([^']+)'/g, /modell\(\s*'([^']+)'/g, /figurLaden\(\s*'([^']+)'/g, /'foto:([^']+)'/g, /modell:\s*'([^']+)'/g, /musik\(\s*'([^']+)'/g, /klang\(\s*'([^']+)'/g]) for (const m of code.matchAll(re)) n.add(m[1]); for (const k of ['ruhig', 'spannung', 'action', 'auto', 'schuss', 'pistole', 'schrot', 'explosion', 'treffer', 'kopf', 'aufheben', 'muenze', 'nachladen', 'schaden', 'tot', 'schritt', 'klick', 'tuer', 'alarm', 'sieg']) n.delete(k); return [...n]; }

  async function dateien(o) {
    const quelle = await (await fetch('./index.html', { cache: 'no-cache' })).text();
    const css = (quelle.match(/<style>([\s\S]*?)<\/style>/) || [, ''])[1], hud = quelle.split('<!--SD-HUD-START-->')[1].split('<!--SD-HUD-ENDE-->')[0], touch = quelle.split('/*SD-TOUCH-START*/')[1].split('/*SD-TOUCH-ENDE*/')[0];
    const libs = [...quelle.matchAll(/<script src="(https:\/\/cdn\.jsdelivr\.net\/npm\/[^"]+)"><\/script>/g)].map(m => m[1]), module = [...quelle.matchAll(/<script src="\.\/(sd-[\w-]+\.js(?:\?v=\d+)?)"><\/script>/g)].map(m => BASIS + m[1]).filter(u => !/veroeffentlichen|lobby/.test(u));
    const havok = (quelle.match(/const HAVOK_WASM = '([^']+)'/) || [, 'https://cdn.jsdelivr.net/npm/@babylonjs/havok@1.3.14/lib/umd/HavokPhysics.wasm'])[1];
    const out = { 'spiel.sd.js': o.code }, liste = []; let fehlend = [];
    for (const name of eigeneNamen(o.code)) {
      const a = window.SDAssets && await window.SDAssets.holen(name); if (!a) { fehlend.push(name); continue; }
      const e = { name: a.name, typ: a.typ, dateien: [] }; for (const [k, v] of Object.entries(a)) if (!(v instanceof Blob) && k !== 'bilder' && typeof v !== 'object') e[k] = v;
      const ablegen = async (feld, blob, endung) => { const pfad = 'eigene/' + sicher(a.name) + '-' + feld.replace('.', '-') + '.' + endung; out[pfad] = await alsDataUrl(blob); e.dateien.push([feld, pfad]); };
      if (a.typ === 'modell') await ablegen('datei', a.datei, 'glb');
      if (a.typ === 'ton') await ablegen('datei', a.datei, (a.endung || 'mp3').replace(/[^a-z0-9]/g, ''));
      if (a.typ === 'foto-material') { await ablegen('bild', a.bild, 'jpg'); if (a.normal) await ablegen('normal', a.normal, 'jpg'); }
      if (a.typ === 'foto-gebaeude') for (const [k, b] of Object.entries(a.bilder || {})) await ablegen('bilder.' + k, b, 'jpg');
      liste.push(e);
    }
    out['eigene/liste.json'] = JSON.stringify(liste);
    out['index.html'] = seite({ titel: o.titel, text: o.text, css, hud, touch, libs, module, havok });
    return { dateien: out, fehlend };
  }

  function seite({ titel, text, css, hud, touch, libs, module, havok }) {
    return `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<title>${esc(titel)} – ein SD-Engine-Spiel</title><meta name="description" content="${esc(text || titel)}">
<style>${css}
.marke{position:fixed;right:10px;bottom:6px;z-index:9;font:11px system-ui;color:rgba(255,255,255,.55)}.marke a{color:inherit}</style></head><body>
<canvas id="welt" tabindex="1"></canvas>
${hud}
<div class="ov" id="menue"><div class="karte"><h1 class="titel">${esc(titel)}</h1><div class="unter">Ein Spiel, gebaut mit der SD Engine</div><p style="margin:0;line-height:1.6;color:#cfd8e2">${esc(text || '')}</p>
<div class="knoepfe"><button class="los" id="spielen">▶ Spielen</button><select id="qualitaet"><option value="niedrig">Grafik: Niedrig</option><option value="mittel" selected>Grafik: Mittel</option><option value="hoch">Grafik: Hoch</option></select></div>
<div class="feld" style="margin-top:12px"><b>Steuerung</b><br><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> laufen · <kbd>Shift</kbd> sprinten · <kbd>Leertaste</kbd> springen · Maus schauen · Linke Maustaste schießen · Rechte zielen · <kbd>R</kbd> nachladen · <kbd>E</kbd> benutzen · <kbd>F</kbd> Auto · <kbd>G</kbd> Granate · <kbd>V</kbd> Nahkampf · <kbd>H</kbd> Medikit · <kbd>J</kbd> Missionen · <kbd>Esc</kbd> Pause</div>
<p class="ehrlich">Grafik und Physik werden beim ersten Start aus dem Internet geladen (Babylon.js, Havok).</p></div></div>
<div class="ov" id="pause" hidden><div class="karte" style="width:min(420px,100%);text-align:center"><h2 style="margin:0 0 14px">❚❚ Pause</h2><div class="knoepfe" style="justify-content:center"><button class="los" id="weiter">Weiter</button><button id="neu">↻ Neu starten</button></div></div></div>
<div class="ov" id="ende" hidden><div class="karte" style="width:min(460px,100%);text-align:center"><h1 class="titel" id="endeTitel" style="font-size:44px">SIEG</h1><p id="endeText" style="color:#cfd8e2"></p><div class="knoepfe" style="justify-content:center"><button class="los" id="nochmal">↻ Nochmal</button></div></div></div>
<div class="ov" id="laden" hidden><div style="text-align:center"><div class="titel" style="font-size:30px">Lade Welt …</div><p id="ladenText" style="color:var(--leise)">Grafik-Engine und Physik werden geladen</p></div></div>
<div class="marke">Erstellt mit dem <a href="https://thesdhub.com/studio/game-studio/" target="_blank" rel="noopener">SD Game-Studio</a></div>
${libs.map(u => '<script src="' + u + '"></script>').join('\n')}
${module.map(u => '<script src="' + u + '"></script>').join('\n')}
<script>
'use strict';
const $ = id => document.getElementById(id), handy = matchMedia('(pointer: coarse)').matches; if (handy) document.body.classList.add('handy');
let laeuft = null, pausiert = false;
const hudEl = {}; ['leben', 'lebenBalken', 'schutzBalken', 'munition', 'waffe', 'kills', 'uebrig', 'zone', 'fps', 'nachricht', 'feed', 'karte', 'fadenkreuz', 'treffer', 'blut', 'hinweis', 'zoneWarnung', 'zielfernrohr'].forEach(k => hudEl[k] = $(k));
async function eigeneLaden() { try { const liste = await (await fetch('./eigene/liste.json')).json(); const q = liste.filter(e => e.quelle).map(e => e.quelle); if (q.length) { const m = document.querySelector('.marke'); const t = document.createElement('div'); t.textContent = 'Modelle: ' + q.join(' · '); m.prepend(t); } for (const e of liste) { for (const [feld, pfad] of e.dateien) { const b = await (await fetch('./' + pfad)).blob(); const [a, c] = feld.split('.'); if (c) { e[a] = e[a] || {}; e[a][c] = b; } else e[a] = b; } delete e.dateien; } window.SD_EIGENE_EXTRA = liste; } catch (er) { window.SD_EIGENE_EXTRA = []; } }
async function starten() {
  if (laeuft) { laeuft.aufraeumen(); laeuft = null; } ['menue', 'pause', 'ende'].forEach(i => $(i).hidden = true); $('laden').hidden = false;
  if (!window.BABYLON || !window.HavokPhysics || !window.SDEngine) { $('ladenText').textContent = '⨯ Engine nicht geladen – Internetverbindung prüfen und neu laden.'; return; }
  const code = await (await fetch('./spiel.sd.js', { cache: 'no-cache' })).text(); if (!window.SD_EIGENE_EXTRA) await eigeneLaden();
  try { laeuft = await SDEngine.starten($('welt'), code, { qualitaet: $('qualitaet').value, havokWasm: '${havok}', hud: hudEl, keinPointerLock: handy, pause: () => pausiert,
      beiFehler: e => { console.error(e); $('ladenText').textContent = '⨯ ' + e.message; },
      beiSperre: an => { if (!an && laeuft && $('ende').hidden && !handy) { pausiert = true; $('pause').hidden = false; } if (an) { pausiert = false; $('pause').hidden = true; } },
      beiEnde: r => { $('ende').hidden = false; $('endeTitel').textContent = r.sieg ? '🏆 SIEG' : 'AUSGESCHIEDEN'; $('endeText').textContent = r.text; } });
    $('hud').hidden = false; $('laden').hidden = true; } catch (e) { $('ladenText').textContent = '⨯ ' + e.message; }
}
$('spielen').onclick = () => { if (!handy) $('welt').requestPointerLock && $('welt').requestPointerLock(); starten(); };
$('nochmal').onclick = $('neu').onclick = () => starten();
$('weiter').onclick = () => { pausiert = false; $('pause').hidden = true; if (!handy) $('welt').requestPointerLock(); };
document.addEventListener('keydown', e => { if (e.key === 'Escape' && laeuft && handy) { pausiert = !pausiert; $('pause').hidden = !pausiert; } });
${touch}
</script></body></html>`;
  }

  async function veroeffentlichen(o, schluessel, name) {
    const { dateien: d, fehlend } = await dateien(o); const groesse = Object.values(d).reduce((s, v) => s + v.length, 0);
    const ctrl = new AbortController(), t = setTimeout(() => ctrl.abort(), 100000);
    try { const r = await fetch((o.hub || HUB) + '/hub/seite/veroeffentlichen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: schluessel, name, dateien: d }), signal: ctrl.signal });
      const j = await r.json().catch(() => ({ error: 'Antwort unlesbar (' + r.status + ')' })); j.fehlend = fehlend; j.groesse = groesse; return j; }
    catch (e) { return { error: e.name === 'AbortError' ? 'Server antwortet nicht – bitte gleich nochmal.' : 'Server nicht erreichbar.' }; } finally { clearTimeout(t); }
  }
  window.SDVeroeffentlichen = { dateien, veroeffentlichen, eigeneNamen };
})();
