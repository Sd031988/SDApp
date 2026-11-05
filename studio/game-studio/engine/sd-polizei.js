/* SD Polizei – Fahndungslevel wie in Open-World-Spielen. Engine-Modul.
   sd.fahndung({ an: true })  ·  sd.fahndungsstufe (0–5)  ·  sd.fahndungSetzen(n)
   Sterne gibt es für Schüsse in der Stadt (bei Passanten), Abschüsse während der Fahndung und Angriffe auf Polizisten.
   Die Polizei kommt zu Fuß aus der Umgebung (mehr Sterne = mehr und besser bewaffnet). Wer 25 s nicht gesehen wird, verliert die Sterne. */
'use strict';
(window.SDModule = window.SDModule || []).push(function (ctx) {
  const { BAB, V, klemme } = ctx;
  const F = { an: false, sterne: 0, unsichtbar: 0, polizei: [], wagen: [], wagenZeit: 0, nachschub: 0, sirene: 0, kills: 0 };
  ctx.meldeVerbrechen = (stufe, was) => { if (F.an && F.sterne < stufe) { setzen(stufe); if (was) ctx.meldung('🚨 ' + was); } };
  let anzeige = null;
  function hud() { if (anzeige) return; anzeige = document.createElement('div'); anzeige.style.cssText = 'position:absolute;top:14px;left:50%;transform:translateX(-50%);font:700 22px system-ui;letter-spacing:3px;text-shadow:0 1px 4px #000;pointer-events:none;color:#fff;transition:opacity .3s';
    (document.getElementById('hud') || document.body).appendChild(anzeige); ctx.aufraeumen.push(() => anzeige && anzeige.remove()); }
  function zeigen() { if (!anzeige) return; anzeige.textContent = F.sterne ? '★'.repeat(F.sterne) + '☆'.repeat(5 - F.sterne) : ''; anzeige.style.opacity = F.unsichtbar > 3 ? (Math.floor(ctx.zeit * 3) % 2 ? 0.35 : 1) : 1; anzeige.style.color = F.sterne >= 4 ? '#ff6b5a' : '#ffd36b'; }
  function setzen(n) { const alt = F.sterne; F.sterne = klemme(Math.round(n), 0, 5); F.unsichtbar = 0; if (F.sterne > alt) { ctx.nachricht(F.sterne === 1 ? '🚨 Die Polizei sucht dich!' : '🚨 Fahndungsstufe ' + F.sterne, 3); ctx.ton('alarm', 0.5); F.nachschub = 0; } if (F.sterne === 0 && alt > 0) aufgeben(); zeigen(); }
  function aufgeben() { for (const b of F.polizei) if (!b.tot) ctx.botEntfernen(b); F.polizei = []; F.wagen.forEach(w => w.entfernen()); F.wagen = []; ctx.nachricht('✅ Die Polizei hat die Suche aufgegeben', 3); }
  const inStadt = p => (ctx.stadtBereiche || []).some(([x, z, w, d]) => Math.abs(p.x - x) < w && Math.abs(p.z - z) < d);
  // Verbrechen erkennen
  ctx.beiSchuss.push((pos, wer, leise) => { if (!F.an || wer !== 'spieler' || !pos || leise) return; /* mit Schalldämpfer unbemerkt */ if (F.sterne === 0 && inStadt(pos)) setzen(1); if (F.sterne > 0) F.unsichtbar = Math.min(F.unsichtbar, 8); });
  function spawnPunkt(sp) { const netze = ctx.stadtNetze || []; let kand = [];
    for (const n of netze) for (const k of n.knoten) { const d = Math.hypot(k[0] - sp.x, k[1] - sp.z); if (d > 60 && d < 120) kand.push(k); }
    if (kand.length) return kand[Math.floor(Math.random() * kand.length)]; const w = Math.random() * 6.28; return [sp.x + Math.cos(w) * 85, sp.z + Math.sin(w) * 85]; }
  function polizistErzeugen(sp, bei) { const [x, z] = bei || spawnPunkt(sp);
    const b = ctx.sd.gegner({ pos: [x, null, z], name: 'Polizist', nebenfigur: true, aussehen: 'mensch', staerke: 0.35 + F.sterne * 0.1, waffe: F.sterne >= 3 ? 'gewehr' : 'pistole', leben: 80 + F.sterne * 10, mensch: { oberteil: '#1f3a7a', hose: '#151c2c', aermel: 'lang', frisur: 'kappe', weste: F.sterne >= 3 } });
    if (!b || b.mehrspieler) return; b.alarm = 30; b.polizei = true; F.polizei.push(b); }
  const sp0 = () => (ctx.uebernahme && ctx.uebernahme.pos ? ctx.uebernahme.pos() : ctx.spieler && ctx.spieler.cc.getPosition());
  return {
    api: { fahndung: o => { o = o || {}; if (ctx.mehrspieler) return false; F.an = o.an !== false; hud(); zeigen(); return true; }, fahndungSetzen: setzen, get fahndungsstufe() { return F.sterne; } },
    update(dt) {
      if (!F.an || !ctx.spieler) return; const sp = sp0(); if (!sp) return;
      if (ctx.spieler.leben <= 0 && F.sterne) { setzen(0); return; }
      // neue Abschüsse während der Fahndung → mehr Sterne (Polizisten zählen doppelt)
      const kills = ctx.spieler.kills || 0; if (kills > F.kills) { if (F.sterne > 0) { const pol = F.polizei.filter(b => b.tot && !b.gezaehlt); pol.forEach(b => { b.gezaehlt = true; }); setzen(F.sterne + (pol.length ? Math.ceil(pol.length / 2) : 1)); } F.kills = kills; }
      if (!F.sterne) { zeigen(); return; }
      F.polizei = F.polizei.filter(b => !b.weg && !(b.tot && b.gezaehlt && (b.tod = (b.tod || 0) + dt) > 0));
      // wird der Spieler gesehen? (Sichtstrahl von einem Polizisten)
      let gesehen = false; for (const b of F.polizei) { if (b.tot) continue; b.alarm = 30; const p = b.cc.getPosition(); if (BAB.Vector3.Distance(p, sp) < 70) { const kopf = p.add(V(0, 0.7, 0)), ziel = (ctx.spieler.duckt ? sp.add(V(0, -0.6, 0)) : sp), dir = ziel.subtract(kopf), dist = dir.length();
        const t = ctx.strahl(kopf, dir.normalize(), dist, b.id); if (!t || !t.hit || (t.pickedMesh && t.pickedMesh.metadata && t.pickedMesh.metadata.figur === 'spieler') || t.distance > dist - 0.6) { gesehen = true; break; } } }
      F.unsichtbar = gesehen ? 0 : F.unsichtbar + dt; if (F.unsichtbar > 25) { setzen(0); return; }
      // Nachschub: je Stern zwei Polizisten (höchstens 8 gleichzeitig)
      F.nachschub -= dt; const lebend = F.polizei.filter(b => !b.tot).length; if (F.nachschub <= 0 && F.unsichtbar < 5 && lebend < Math.min(8, F.sterne * 2)) { polizistErzeugen(sp); F.nachschub = 4; }
      // Streifenwagen ab 2 Sternen: fahren über die Straßen heran, an der Ankunft steigen zwei Polizisten aus
      F.wagenZeit -= dt; const stadt = ctx.sd.sonderwagen && (ctx.stadtNetze || []).length;
      if (F.sterne >= 2 && (stadt || ctx.sd.einsatzwagen) && F.wagenZeit <= 0 && F.wagen.length < Math.min(3, F.sterne - 1)) { F.wagenZeit = 12;
        const aussteigen = v => { if (v.ausgestiegen) return; v.ausgestiegen = true; const p = v.huelle ? v.huelle.position : v.chassis.getAbsolutePosition(), gier = v.huelle ? v.gier : Math.atan2(BAB.Vector3.TransformNormal(V(0, 0, 1), v.chassis.computeWorldMatrix(true)).x, BAB.Vector3.TransformNormal(V(0, 0, 1), v.chassis.computeWorldMatrix(true)).z);
          for (const s2 of [-1, 1]) { const q = [p.x + Math.cos(gier) * 2.6 * s2, p.z - Math.sin(gier) * 2.6 * s2]; if (F.polizei.filter(b => !b.tot).length < 10) polizistErzeugen(sp0(), q); } };
        let w; if (stadt) w = ctx.sd.sonderwagen({ farbe: '#eef0f3', ziel: sp0, beiAnkunft: aussteigen });
        else { const g = Math.random() * 6.28, x = sp.x + Math.cos(g) * 90, z = sp.z + Math.sin(g) * 90; w = ctx.sd.einsatzwagen({ pos: [x, null, z], drehung: Math.atan2(sp.x - x, sp.z - z) * 180 / Math.PI, ziel: sp0, beiAnkunft: aussteigen }); if (w) w.huelle = null; }
        if (w) { F.wagen.push(w); ctx.ton('alarm', 0.35, w.huelle ? w.huelle.position : w.chassis.getAbsolutePosition()); } }
      // Sirene in der Nähe
      F.sirene -= dt; if (F.sirene <= 0 && (lebend || F.wagen.length)) { F.sirene = 6; const n = F.wagen[0] ? (F.wagen[0].huelle ? F.wagen[0].huelle.position : F.wagen[0].chassis.getAbsolutePosition()) : (F.polizei.find(b => !b.tot) || { cc: null }).cc?.getPosition(); if (n) ctx.ton('alarm', 0.25, n); }
      zeigen();
    },
  };
});
