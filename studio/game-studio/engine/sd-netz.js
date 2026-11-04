/* SD Netz – Mehrspieler für die SD Engine über den SD-Hub-Server.
   Bis zu 8 Spieler pro Raum (5-stelliger Code). Ca. 8 Aktualisierungen pro Sekunde, weich dazwischen gerechnet.
   Kein Chat, keine Namen (Spieler 1–8), nichts wird dauerhaft gespeichert. Engine-Modul (aktiv nur mit opt.netz). */
'use strict';
(function () {
  (window.SDModule = window.SDModule || []).push(function (ctx) {
    const n = ctx.opt && ctx.opt.netz; if (!n) return {};
    const { BAB, V, szene, kamera } = ctx; ctx.mehrspieler = true;
    const fremde = new Map(), treffer = [], hud = ctx.hud; let schuss = false, unterwegs = false, warte = 0, verbunden = true, punkte = [], start = null, tot = false;
    const FB = window.SDFahrzeug && window.SDFahrzeug.bauer(BAB, szene, ctx.BK), TYPEN = window.SDFahrzeug ? window.SDFahrzeug.TYPEN : {};
    const ebene = document.createElement('div'); ebene.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden'; (hud.feed ? hud.feed.parentNode : document.body).appendChild(ebene);
    const kopf = document.createElement('div'); kopf.style.cssText = 'position:absolute;top:58px;left:50%;transform:translateX(-50%);background:rgba(12,18,26,.72);border:1px solid rgba(255,255,255,.12);border-radius:6px;padding:5px 12px;font:600 13px system-ui'; ebene.appendChild(kopf);
    const tafel = document.createElement('div'); tafel.style.cssText = 'position:absolute;top:22%;left:50%;transform:translateX(-50%);background:rgba(10,14,20,.88);border:1px solid rgba(255,255,255,.15);border-radius:10px;padding:14px 20px;font:14px system-ui;min-width:280px'; tafel.hidden = true; ebene.appendChild(tafel);
    ctx.aufraeumen.push(() => { try { fetch(n.server + '/hub/spiel/verlassen', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: n.token }), keepalive: true }); } catch (e) { /* egal */ } ebene.remove(); });
    ctx.beiSchuss.push((pos, wer) => { if (wer === 'spieler') schuss = true; });
    ctx.fremdTreffer = (figurId, schaden, kopfTreffer) => { if (!/^netz:/.test(figurId || '')) return false; const id = figurId.slice(5), f = fremde.get(id); if (!f || f.l <= 0) return true; treffer.push({ id, schaden: Math.round(schaden), kopf: !!kopfTreffer }); return true; };
    ctx.beimTod = quelle => { if (tot) return true; tot = true; ctx.nachricht('☠ ' + (quelle || 'Ausgeschaltet') + ' – du kommst in 4 Sekunden zurück', 4);
      if (ctx.uebernahme && ctx.sd.aussteigen) ctx.sd.aussteigen(); setTimeout(wiederbeleben, 4000); return true; };
    function wiederbeleben() { const sp = ctx.spieler; if (!sp) return; const r = Math.random() * 6.28, d = 8 + Math.random() * 25, x = start.x + Math.cos(r) * d, z = start.z + Math.sin(r) * d;
      sp.cc.setPosition(V(x, ctx.hoehe(x, z) + 1.5, z)); sp.leben = sp.maxLeben; sp.ruestung = 0; tot = false; ctx.nachricht('Zurück im Spiel', 1.5); }
    function figurFuer(f, d) { if (f.k) f.k.dispose(false, true); f.k = ctx.figur({ besitzer: 'netz:' + d.id, aussehen: 'mensch', mensch: { oberteil: d.farbe, hose: '#22262c', weste: true, westeFarbe: '#3d4433', seed: d.id.length } }); f.tot = false; }
    function autoFuer(f, fz) { if (f.auto && f.autoTyp === fz.typ + fz.farbe) return; if (f.auto) f.auto.dispose(false, true); const g = FB.auto({ typ: fz.typ, farbe: fz.farbe }), T = g.typ, yb = T.rad + 0.39, yt = Math.max(yb + 0.3, T.H * 0.85);
      const h = new BAB.TransformNode('netzAuto', szene); g.wurzel.parent = h; g.wurzel.position = V(0, -(yb + yt) / 2, 0); g.karosse.concat(...g.raeder.map(r => r.meshes)).forEach(m => { ctx.schatten.addShadowCaster(m); m.isPickable = true; }); h.rotationQuaternion = new BAB.Quaternion(); f.auto = h; f.autoTyp = fz.typ + fz.farbe; }
    function empfangen(j) {
      const jetzt = performance.now() / 1000, gesehen = new Set();
      for (const d of j.spieler) { gesehen.add(d.id); let f = fremde.get(d.id);
        if (!f) { f = { puffer: [], name: d.name, farbe: d.farbe }; fremde.set(d.id, f); figurFuer(f, d); f.schild = document.createElement('div'); f.schild.style.cssText = 'position:absolute;transform:translate(-50%,-100%);font:700 12px system-ui;text-shadow:0 1px 3px #000;white-space:nowrap;text-align:center'; ebene.appendChild(f.schild); ctx.meldung('👥 ' + d.name + ' ist da'); }
        f.puffer.push({ t: jetzt, p: d.p, g: d.g, tt: d.t, fz: d.f }); if (f.puffer.length > 8) f.puffer.shift(); f.l = d.l; f.name = d.name;
        if (d.schuss) { const p = V(d.p[0], d.p[1] + 0.4, d.p[2]); ctx.ton('schuss', 0.8, p); }
        if (d.l <= 0 && !f.tot && f.k && f.k.sterben) { f.k.sterben(); f.tot = true; } else if (d.l > 0 && f.tot) figurFuer(f, d);
        f.schild.innerHTML = ''; f.schild.textContent = d.name; const bar = document.createElement('div'); bar.style.cssText = 'height:4px;margin-top:2px;background:rgba(0,0,0,.5);border-radius:2px;overflow:hidden'; bar.innerHTML = '<i style="display:block;height:100%;width:' + Math.max(0, Math.min(100, d.l)) + '%;background:' + d.farbe + '"></i>'; f.schild.appendChild(bar); }
      for (const [id, f] of fremde) if (!gesehen.has(id)) { if (f.k) f.k.dispose(false, true); if (f.auto) f.auto.dispose(false, true); f.schild.remove(); fremde.delete(id); ctx.meldung('👋 ' + f.name + ' hat das Spiel verlassen'); }
      for (const e of j.ereignisse || []) { if (e.art === 'treffer' && ctx.spieler && !tot) ctx.schaden(ctx.spieler, e.schaden, e.von); else if (e.art === 'kill') { ctx.nachricht('☠ +1 – ' + e.opfer + ' ausgeschaltet', 2); ctx.spieler.kills++; } else if (e.art === 'meldung') ctx.meldung(e.text); }
      punkte = j.punkte || []; kopf.textContent = '👥 Raum ' + n.code + ' · ' + (fremde.size + 1) + ' Spieler · du bist ' + j.name;
    }
    async function senden() {
      const sp = ctx.spieler; if (!sp || unterwegs || !verbunden) return; unterwegs = true;
      const a = ctx.uebernahme && ctx.uebernahme.auto, p = ctx.spielerPos(); let f = null;
      if (a) { const q = a.chassis.rotationQuaternion || BAB.Quaternion.Identity(), c = a.chassis.getAbsolutePosition(); f = { typ: a.typName || 'limousine', farbe: a.farbe || '#888888', p: [c.x, c.y, c.z].map(v => +v.toFixed(2)), q: [q.x, q.y, q.z, q.w].map(v => +v.toFixed(4)) }; }
      const body = { token: n.token, zustand: { p: [p.x, a ? p.y : p.y - 0.9, p.z].map(v => +v.toFixed(2)), g: +(sp.k.rotation.y || 0).toFixed(3), t: +Math.min(50, sp.tempo || 0).toFixed(2), l: Math.round(sp.leben), schuss, f }, treffer: treffer.splice(0) }; schuss = false;
      try { const r = await fetch(n.server + '/hub/spiel/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); const j = await r.json();
        if (j.ok) empfangen(j); else if (r.status === 401) { verbunden = false; ctx.nachricht('⨯ Verbindung zum Raum verloren: ' + j.error, 6); } }
      catch (e) { kopf.textContent = '👥 Raum ' + n.code + ' · ⚠ Verbindung wackelt …'; }
      unterwegs = false;
    }
    function zeichnen() {
      const jetzt = performance.now() / 1000 - 0.18, w = ctx.engine.getRenderWidth(), h = ctx.engine.getRenderHeight(), mat = szene.getTransformMatrix(), vp = kamera.viewport.toGlobal(w, h), skal = ebene.clientWidth / w;
      for (const f of fremde.values()) { const b = f.puffer; if (!b.length) continue; let i = b.length - 1; while (i > 0 && b[i - 1].t > jetzt) i--; const s1 = b[Math.max(0, i - 1)], s2 = b[i], u = s2.t > s1.t ? Math.max(0, Math.min(1, (jetzt - s1.t) / (s2.t - s1.t))) : 1;
        const L = (a, c) => a + (c - a) * u, p = V(L(s1.p[0], s2.p[0]), L(s1.p[1], s2.p[1]), L(s1.p[2], s2.p[2]));
        if (s2.fz && FB) { autoFuer(f, s2.fz); f.auto.setEnabled(true); f.k && f.k.setEnabled(false); const a1 = s1.fz || s2.fz; f.auto.position = V(L(a1.p[0], s2.fz.p[0]), L(a1.p[1], s2.fz.p[1]), L(a1.p[2], s2.fz.p[2]));
          BAB.Quaternion.SlerpToRef(new BAB.Quaternion(...a1.q), new BAB.Quaternion(...s2.fz.q), u, f.auto.rotationQuaternion); }
        else { if (f.auto) f.auto.setEnabled(false); if (f.k) { f.k.setEnabled(true); f.k.position = p; f.k.rotation.y += ctx.winkel(f.k.rotation.y, s2.g) * 0.3; f.k.animiere(s2.tt, 1 / 60, false); } }
        const kp = BAB.Vector3.Project(p.add(V(0, 2.2, 0)), BAB.Matrix.Identity(), mat, vp), sichtbar = kp.z > 0 && kp.z < 1 && BAB.Vector3.Distance(p, kamera.position) < 160;
        f.schild.style.display = sichtbar ? '' : 'none'; if (sichtbar) { f.schild.style.left = kp.x * skal + 'px'; f.schild.style.top = kp.y * skal + 'px'; } }
      tafel.hidden = !ctx.tasten.Tab; if (!tafel.hidden) tafel.innerHTML = '<b>Punkte · Raum ' + n.code + '</b><table style="width:100%;margin-top:8px;border-collapse:collapse">' + punkte.map(x => '<tr style="' + (x.ich ? 'color:#ffb547' : '') + '"><td><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:' + x.farbe + '"></span> ' + x.name + '</td><td style="text-align:right">☠ ' + x.kills + '</td><td style="text-align:right;opacity:.7">✝ ' + x.tode + '</td></tr>').join('') + '</table><p style="margin:8px 0 0;font-size:12px;opacity:.7">Tab gedrückt halten</p>';
    }
    function update(dt) { if (!start && ctx.spieler) start = ctx.spieler.cc.getPosition().clone(); warte -= dt; if (warte <= 0) { warte = 0.12; senden(); } zeichnen(); }
    ctx.meldung('👥 Verbunden mit Raum ' + n.code + ' – Tab = Punkte');
    if (hud.uebrig && hud.uebrig.parentNode) hud.uebrig.parentNode.style.display = 'none';   // keine Computer-Gegner
    return { api: { get mitspieler() { return [...fremde.values()].map(f => ({ name: f.name, leben: f.l })); } }, update };
  });
})();
