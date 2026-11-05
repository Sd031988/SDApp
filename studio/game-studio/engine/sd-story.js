/* SD Story – Gespräche, Personen und Zwischensequenzen. Engine-Modul.
   await sd.dialog([{ wer: 'Tony', text: 'Hallo!' }, { wer: 'Du', text: 'Was gibt’s?', wahl: ['Hilfe anbieten', 'Weggehen'] }])  → Nummer der gewählten Antwort (oder -1)
   sd.person({ pos: [x, null, z], name: 'Tony', text: ['Zeile 1', 'Zeile 2'], aussehen: 'mensch', mensch: {…}, beiEnde: wahl => … })  – mit E ansprechen
   await sd.zwischensequenz([{ von: [x, y, z], nach: [x, y, z], blick: [x, y, z], dauer: 4, text: 'Untertitel' }, …])  – Kamerafahrt mit Kinobalken, Esc/E überspringt */
'use strict';
(window.SDModule = window.SDModule || []).push(function (ctx) {
  const { BAB, V, klemme, kamera } = ctx, ebene = (ctx.hud && ctx.hud.feed ? ctx.hud.feed.parentNode : document.body);
  const el = (css, html) => { const d = document.createElement('div'); d.style.cssText = css; if (html) d.innerHTML = html; return d; };
  const box = el('position:absolute;left:50%;bottom:110px;transform:translateX(-50%);width:min(620px,92vw);background:rgba(10,14,20,.9);border:1px solid rgba(255,181,71,.5);border-radius:12px;padding:14px 18px;font:15px/1.5 system-ui;color:#eef;pointer-events:auto;z-index:30');
  box.hidden = true; ebene.appendChild(box);
  const balken = [el('position:absolute;left:0;right:0;top:0;height:0;background:#000;transition:height .5s;z-index:29;pointer-events:none'), el('position:absolute;left:0;right:0;bottom:0;height:0;background:#000;transition:height .5s;z-index:29;pointer-events:none;display:flex;align-items:center;justify-content:center;font:600 17px system-ui;color:#fff;text-shadow:0 1px 3px #000')];
  balken.forEach(b => ebene.appendChild(b)); ctx.aufraeumen.push(() => { box.remove(); balken.forEach(b => b.remove()); });
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let weiter = null; const druck = ['E', 'Space', 'Enter', 'NumpadEnter'];
  for (const k of druck.concat(['1', '2', '3', '4', 'Escape'])) ctx.sd.beiTaste(k, () => { if (weiter) weiter(k); });
  box.addEventListener('click', e => { if (weiter && !e.target.dataset.wahl) weiter('E'); });
  let anhalten = 0, alteUeb = null;
  function festhalten(an) { const sp = ctx.spieler; if (an) { if (anhalten++ === 0 && !ctx.uebernahme && sp) { alteUeb = null; ctx.uebernahme = { gespraech: true, update() {}, pos: () => sp.cc.getPosition() }; } }
    else if (--anhalten === 0 && ctx.uebernahme && ctx.uebernahme.gespraech) ctx.uebernahme = alteUeb; }

  /** Gespräch Zeile für Zeile; letzte Zeile kann eine Auswahl haben */
  async function dialog(zeilen) {
    zeilen = (Array.isArray(zeilen) ? zeilen : [zeilen]).map(z => typeof z === 'string' ? { text: z } : z); let gewaehlt = -1; festhalten(true); box.hidden = false;
    try { for (const z of zeilen) {
      const w = Array.isArray(z.wahl) ? z.wahl.slice(0, 4) : null;
      box.innerHTML = (z.wer ? '<b style="color:#ffb547">' + esc(z.wer) + '</b><br>' : '') + esc(z.text || '') + (w ? '<div style="display:grid;gap:6px;margin-top:10px">' + w.map((t, i) => '<button data-wahl="' + i + '" style="text-align:left;padding:7px 10px;background:#18212d;color:#fff;border:1px solid #3a4656;border-radius:8px;cursor:pointer">' + (i + 1) + ') ' + esc(t) + '</button>').join('') + '</div>' : '<div style="text-align:right;font-size:12px;opacity:.6;margin-top:4px">weiter: E / Leertaste / Klick</div>');
      if (z.ton !== false) ctx.ton('klick', 0.5);
      gewaehlt = await new Promise(ok => { const t0 = ctx.zeit; weiter = k => { if (ctx.zeit - t0 < 0.15) return; if (w) { const n = +k - 1; if (n >= 0 && n < w.length) ok(n); return; } if (druck.includes(k) || k === 'Escape') ok(-1); };
        if (w) box.querySelectorAll('[data-wahl]').forEach(b => b.onclick = e => { e.stopPropagation(); ok(+b.dataset.wahl); }); });
      weiter = null; } }
    finally { weiter = null; box.hidden = true; festhalten(false); }
    return gewaehlt;
  }
  /** Person, die man mit E ansprechen kann */
  const personen = [];
  function person(o) {
    o = o || {}; const x = o.pos[0], z = o.pos[2], y = o.pos[1] ?? ctx.hoehe(x, z);
    const k = ctx.figur({ besitzer: 'person' + personen.length, aussehen: o.aussehen || 'mensch', mensch: Object.assign({ oberteil: '#6a5a3a', seed: personen.length * 7 + 3 }, o.mensch || {}), modell: o.modell, roboter: o.roboter });
    k.position = V(x, y, z); k.rotation.y = (o.drehung || 0) * Math.PI / 180; k.getChildMeshes().forEach(m => { m.isPickable = true; });
    const p = { k, name: o.name || 'Person', text: Array.isArray(o.text) ? o.text : [o.text || 'Hallo!'], beiEnde: o.beiEnde, wahl: o.wahl, redet: false, pos: V(x, y, z) }; personen.push(p); return p;
  }
  ctx.sd.beiTaste('E', () => { if (weiter || ctx.uebernahme || !ctx.spieler) return; const sp = ctx.spieler.cc.getPosition();
    const p = personen.find(q => !q.redet && BAB.Vector3.Distance(q.pos, sp) < 2.8); if (!p) return; p.redet = true;
    p.k.rotation.y = Math.atan2(sp.x - p.pos.x, sp.z - p.pos.z); const zeilen = p.text.map(t => ({ wer: p.name, text: t })); if (p.wahl) zeilen[zeilen.length - 1].wahl = p.wahl;
    setTimeout(() => dialog(zeilen).then(w => { p.redet = false; p.beiEnde && p.beiEnde(w); }), 0); });
  /** Kamerafahrt mit Kinobalken */
  let sequenz = null;
  function zwischensequenz(schritte) {
    const vec = a => Array.isArray(a) ? V(a[0], a[1], a[2]) : a;
    return new Promise(ok => { const liste = (schritte || []).map(s => ({ von: vec(s.von || s.nach), nach: vec(s.nach || s.von), blick: vec(s.blick || [0, 0, 0]), blick2: vec(s.blickNach || s.blick || [0, 0, 0]), dauer: Math.max(0.3, s.dauer || 3), text: s.text || '' }));
      if (!liste.length) { ok(); return; } festhalten(true); const alt = ctx.uebernahme, sp = ctx.spieler;
      ctx.uebernahme = { gespraech: true, update() {}, pos: () => sp.cc.getPosition(), kamera() {} };
      balken[0].style.height = balken[1].style.height = '11vh'; let i = 0, t = 0;
      sequenz = { update(dt) { const s = liste[i]; t += dt; const u = klemme(t / s.dauer, 0, 1), e = u * u * (3 - 2 * u);
          kamera.position = BAB.Vector3.Lerp(s.von, s.nach, e); kamera.setTarget(BAB.Vector3.Lerp(s.blick, s.blick2, e)); balken[1].textContent = s.text;
          if (u >= 1) { i++; t = 0; if (i >= liste.length) ende(); } } };
      const ende = () => { sequenz = null; weiter = null; balken[0].style.height = balken[1].style.height = '0'; balken[1].textContent = ''; ctx.uebernahme = alt && !alt.gespraech ? alt : null; anhalten = Math.max(0, anhalten - 1); ok(); };
      weiter = k => { if (k === 'Escape' || k === 'E') ende(); };
    });
  }
  return {
    api: { dialog, person, zwischensequenz, get personen() { return personen; } },
    update(dt) { if (sequenz) sequenz.update(dt); for (const p of personen) if (p.k.animiere) p.k.animiere(0, dt, false); },
  };
});
