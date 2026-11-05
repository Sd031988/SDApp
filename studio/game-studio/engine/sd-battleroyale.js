/* SD Battle Royale – ein komplettes Spiel wie PUBG mit einer Zeile.
   sd.battleRoyale({ gegner: 20, beute: 45, zone: { radius, endRadius, warte, dauer, schaden }, absprung: true, aussehen: 'mensch' | 'roboter' })
   sd.absprung({ hoehe: 300, tempo: 55, von: [x, z], nach: [x, z] })  – Flugzeug fliegt über die Karte, F/Leertaste springt ab, freier Fall, Fallschirm (öffnet selbst bei 120 m oder mit Leertaste)
   Vorher Gelände, Häuser usw. bauen; Spieler und Gegner legt battleRoyale selbst an, wenn es sie noch nicht gibt. */
'use strict';
(window.SDModule = window.SDModule || []).push(function (ctx) {
  const { BAB, V, klemme, szene, kamera } = ctx;
  let flug = null;
  const G = () => (ctx.gelaendeGroesse && ctx.gelaendeGroesse()) || 600, W = () => ctx.wasserHoehe ?? -1e9;
  const land = (x, z) => ctx.hoehe(x, z) > W() + 1 && Math.abs(x) < G() * 0.44 && Math.abs(z) < G() * 0.44;
  function zufallsLand(r, nah, abst) { for (let i = 0; i < 80; i++) { const x = (r() - 0.5) * G() * 0.84, z = (r() - 0.5) * G() * 0.84; if (land(x, z) && (!nah || Math.hypot(x - nah[0], z - nah[1]) > abst)) return [x, z]; } return [0, 0]; }

  /** Flugzeug + Fallschirm */
  function absprung(o) {
    o = o || {}; const sp = ctx.spieler; if (!sp) throw new Error('sd.absprung braucht vorher sd.spieler(...)');
    const g2 = G() / 2, r = Math.random, w = r() * Math.PI * 2, von = o.von || [Math.cos(w) * g2 * 0.95, Math.sin(w) * g2 * 0.95], nach = o.nach || [-von[0] + (r() - 0.5) * g2 * 0.6, -von[1] + (r() - 0.5) * g2 * 0.6];
    const H = o.hoehe || 300, tempo = o.tempo || 55, dir = V(nach[0] - von[0], 0, nach[1] - von[1]), L = dir.length(); dir.normalize();
    const FB = window.SDFahrzeug && window.SDFahrzeug.bauer(BAB, szene, ctx.BK); let flieger = null;
    if (FB) { const g = FB.auto({ typ: 'flugzeug', farbe: '#8a9098' }); flieger = new BAB.TransformNode('absprungFlieger', szene); g.wurzel.parent = flieger; g.wurzel.scaling.setAll(2.6); g.wurzel.position.y = -2; flieger.rotation.y = Math.atan2(dir.x, dir.z); }
    const schirm = BAB.MeshBuilder.CreateSphere('fallschirm', { diameter: 5.5, slice: 0.45, segments: 16, sideOrientation: BAB.Mesh.DOUBLESIDE }, szene); const sm = new BAB.StandardMaterial('schirmMat', szene); sm.diffuseColor = BAB.Color3.FromHexString(o.schirmFarbe || '#d8402a'); sm.backFaceCulling = false; sm.twoSidedLighting = true; sm.emissiveColor = sm.diffuseColor.scale(0.45); schirm.material = sm; schirm.isPickable = false; schirm.setEnabled(false); schirm.scaling.y = 0.55;
    ctx.schatten.addShadowCaster(schirm);
    flug = { phase: 'flugzeug', t: 0, von, dir, L, H, tempo, flieger, schirm, pos: V(von[0], H, von[1]), v: V(0, 0, 0), gier: Math.atan2(dir.x, dir.z) };
    const tasteSprung = () => { if (!flug) return; if (flug.phase === 'flugzeug') { flug.phase = 'fall'; flug.v = dir.scale(tempo * 0.5); sp.k.setEnabled(true); ctx.ton('klick', 0.8); ctx.nachricht('🪂 Freier Fall – W/A/S/D steuern · Leertaste = Fallschirm öffnen', 4); }
      else if (flug.phase === 'fall') schirmAuf(); };
    ctx.sd.beiTaste('F', tasteSprung); ctx.sd.beiTaste('Space', tasteSprung);
    sp.k.setEnabled(false); ctx.nachricht('✈ Du sitzt im Flugzeug – F oder Leertaste: abspringen, wo du landen willst', 8);
    ctx.uebernahme = { absprung: true, pos: () => flug ? flug.pos : sp.cc.getPosition(), update: dt => absprungUpdate(dt), kamera: dt => absprungKamera(dt) };
    return flug;
  }
  function schirmAuf() { if (!flug || flug.phase !== 'fall') return; flug.phase = 'schirm'; flug.schirm.setEnabled(true); ctx.ton('tuer', 0.6); ctx.nachricht('🪂 Fallschirm offen – W/A/S/D gleiten', 3); }
  function absprungUpdate(dt) {
    const f = flug, sp = ctx.spieler, t = ctx.tasten, tc = ctx.touch; if (!f) return;
    if (f.phase === 'flugzeug') { f.t += dt * f.tempo; f.pos = V(f.von[0], f.H, f.von[1]).add(f.dir.scale(f.t)); if (f.flieger) f.flieger.position.copyFrom(f.pos);
      if (f.t > f.L) { f.phase = 'fall'; f.v = f.dir.scale(f.tempo * 0.5); sp.k.setEnabled(true); ctx.nachricht('Automatisch abgesprungen!', 2); } }
    else {
      const vor = (t.W ? 1 : 0) - (t.S ? 1 : 0) + tc.bewegen[1], seit = (t.D ? 1 : 0) - (t.A ? 1 : 0) + tc.bewegen[0], gier = sp.gier, fw = V(Math.sin(gier), 0, Math.cos(gier)), rw = V(Math.cos(gier), 0, -Math.sin(gier));
      const boden = ctx.hoehe(f.pos.x, f.pos.z), ueber = f.pos.y - Math.max(boden, W());
      if (f.phase === 'fall') { const wunsch = fw.scale(vor * 18).add(rw.scale(seit * 12)); f.v.x += (wunsch.x - f.v.x) * dt * 1.2; f.v.z += (wunsch.z - f.v.z) * dt * 1.2; f.v.y = Math.max(f.v.y - 9.81 * dt, vor > 0 ? -62 : -48); if (ueber < 120) schirmAuf(); }
      else { const wunsch = fw.scale(5 + vor * 7).add(rw.scale(seit * 6)); f.v.x += (wunsch.x - f.v.x) * dt * 1.5; f.v.z += (wunsch.z - f.v.z) * dt * 1.5; f.v.y += (-(vor > 0 ? 7 : 5) - f.v.y) * dt * 2.5; }
      f.pos.addInPlace(f.v.scale(dt)); const lim = G() * 0.47; f.pos.x = klemme(f.pos.x, -lim, lim); f.pos.z = klemme(f.pos.z, -lim, lim);
      sp.k.position = f.pos.add(V(0, -0.9, 0)); sp.k.rotation.y += ctx.winkel(sp.k.rotation.y, gier) * Math.min(1, dt * 4); if (sp.k.animiere) sp.k.animiere(0, dt, true);
      f.schirm.position = f.pos.add(V(0, 3.6, 0)); f.schirm.rotation.y = sp.k.rotation.y;
      if (f.flieger) { f.t += dt * f.tempo; f.flieger.position = V(f.von[0], f.H, f.von[1]).add(f.dir.scale(f.t)); if (f.t > f.L + 300) { f.flieger.dispose(false, true); f.flieger = null; } }
      if (ueber < 1.2) { landen(); return; }
    }
    sp.cc.setPosition(f.pos.clone()); sp.cc.setVelocity(V(0, 0, 0));
  }
  function landen() { const f = flug, sp = ctx.spieler; const y = Math.max(ctx.hoehe(f.pos.x, f.pos.z), W()) + 1.1; sp.cc.setPosition(V(f.pos.x, y, f.pos.z)); sp.cc.setVelocity(V(0, 0, 0)); f.schirm.dispose(); if (f.flieger) f.flieger.dispose(false, true);
    if (ctx.uebernahme && ctx.uebernahme.absprung) ctx.uebernahme = null; flug = null; ctx.ton('schritt', 1); ctx.wackeln && ctx.wackeln(0.3); ctx.nachricht('Gelandet – such Waffen in den Häusern!', 3); }
  function absprungKamera(dt) {
    const f = flug, sp = ctx.spieler; if (!f) return; const m = ctx.maus, E = ctx.opt.einstellungen || {}; sp.gier += (m.dx * 0.0022 * (E.maus || 1)) + ctx.touch.schauen[0] * dt * 2.2; sp.nick = klemme(sp.nick + m.dy * 0.0022 * (E.maus || 1) * (E.invertY ? -1 : 1) + ctx.touch.schauen[1] * dt * 1.6, -0.6, 1.3); m.dx = m.dy = 0;
    const fv = V(Math.sin(sp.gier) * Math.cos(sp.nick), -Math.sin(sp.nick), Math.cos(sp.gier) * Math.cos(sp.nick)), abst = f.phase === 'flugzeug' ? 28 : 7;
    kamera.position = f.pos.add(V(0, f.phase === 'flugzeug' ? 4 : 1.5, 0)).subtract(fv.scale(abst)); kamera.setTarget(kamera.position.add(fv));
    if (f.phase === 'flugzeug') ctx.setzeText && ctx.setzeText('hinweis', '✈ F / Leertaste = Abspringen');
  }

  /** Komplettes Battle Royale */
  function battleRoyale(o) {
    o = Object.assign({ gegner: 18, beute: 45, absprung: true, aussehen: 'mensch', seed: Math.floor(Math.random() * 1e6) }, o || {}); const r = ctx.zufall(o.seed), sd = ctx.sd;
    // Beute: zuerst in Häusern (Erdgeschoss hinter der Tür), dann verstreut
    const sorten = ['munition', 'munition', 'munition', 'medikit', 'medikit', 'waffe:gewehr', 'waffe:gewehr', 'waffe:schrotflinte', 'waffe:scharfschuetze', 'helm:1', 'helm:1', 'helm:2', 'helm:3', 'weste:1', 'weste:1', 'weste:2', 'weste:3', 'rucksack:1', 'rucksack:2', 'rucksack:3', 'aufsatz:visier', 'aufsatz:daempfer', 'aufsatz:magazin'];
    let n = 0; for (const h of (ctx.haeuser || [])) { if (n >= o.beute) break; const p = h.tuerInnen, q = h.mitte; const x = p.x + (q.x - p.x) * 0.6, z = p.z + (q.z - p.z) * 0.6; sd.kiste({ pos: [x, p.y + 0.15, z], inhalt: sorten[Math.floor(r() * sorten.length)] }); n++; }
    while (n < o.beute) { const [x, z] = zufallsLand(r); sd.kiste({ pos: [x, null, z], inhalt: sorten[Math.floor(r() * sorten.length)] }); n++; }
    // Zone um einen Punkt an Land
    const mitte = zufallsLand(r), Z = Object.assign({ mitte, radius: G() * 0.72, endRadius: Math.max(20, G() * 0.04), warte: o.absprung ? 70 : 40, dauer: Math.round(G() * 0.45), schaden: 5 }, o.zone || {}); sd.zone(Z);
    // Gegner überall an Land verteilt
    const neueBots = []; if (!ctx.mehrspieler) for (let i = 0; i < o.gegner; i++) { const [x, z] = zufallsLand(r); neueBots.push(sd.gegner({ pos: [x, null, z], staerke: 0.25 + r() * 0.55, aussehen: o.aussehen, waffe: ['gewehr', 'pistole', 'schrotflinte', 'gewehr'][i % 4], name: 'Gegner ' + (i + 1) })); }
    if (!ctx.spieler) { const [x, z] = zufallsLand(r); sd.spieler({ pos: [x, null, z], waffen: ['pistole'], aussehen: o.aussehen }); }
    if (o.absprung) { absprung(o.flug || {}); botsAbspringen(neueBots.filter(b => b && b.cc), r); } else ctx.nachricht('Bleib in der Zone und überlebe als Letzter!', 5);
    sd.musik && sd.musik('spannung');
    return { zone: Z };
  }
  /* Gegner springen auch aus dem Flugzeug: jeder dort, wo die Flugbahn seinem Landeplatz am nächsten ist */
  const springer = []; let botSchirm = null;
  let pfad = null;
  function botsAbspringen(liste, r) { if (!flug) return; const f = flug; pfad = { von: f.von, dir: f.dir, tempo: f.tempo, H: f.H, t: 0, L: f.L };
    if (!botSchirm) { botSchirm = f.schirm.clone('botSchirm'); botSchirm.setEnabled(true); botSchirm.isVisible = false; botSchirm.position.y = -900; }
    for (const b of liste) { const ziel = b.cc.getPosition().clone(), rel = V(ziel.x - f.von[0], 0, ziel.z - f.von[1]), t = klemme(BAB.Vector3.Dot(rel, f.dir), 0, f.L);
      b.inLuft = true; b.k.setEnabled(false); springer.push({ b, ziel, abT: t - 20 - r() * 40, phase: 'flugzeug', pos: null, v: V(0, 0, 0), schirm: null }); } }
  function springerUpdate(dt) {
    if (!springer.length || !pfad) return; pfad.t += dt * pfad.tempo; const flugzeugPos = V(pfad.von[0], pfad.H, pfad.von[1]).add(pfad.dir.scale(Math.min(pfad.t, pfad.L)));
    for (let i = springer.length - 1; i >= 0; i--) { const s = springer[i], b = s.b; if (b.tot) { springer.splice(i, 1); if (s.schirm) s.schirm.dispose(); continue; }
      if (s.phase === 'flugzeug') { if (pfad.t < s.abT && pfad.t < pfad.L) { b.cc.setPosition(flugzeugPos.add(V(0, -6, 0))); continue; } s.phase = 'fall'; s.pos = flugzeugPos.add(V(0, -4, 0)); b.k.setEnabled(true); }
      const zu = V(s.ziel.x - s.pos.x, 0, s.ziel.z - s.pos.z), d = zu.length(), ueber = s.pos.y - ctx.hoehe(s.pos.x, s.pos.z);
      if (s.phase === 'fall') { const h = d > 1 ? zu.scale(Math.min(18, d) / d) : V(0, 0, 0); s.v.x += (h.x - s.v.x) * dt; s.v.z += (h.z - s.v.z) * dt; s.v.y = Math.max(s.v.y - 9.81 * dt, -48); if (ueber < 120) { s.phase = 'schirm'; s.schirm = botSchirm.createInstance('botSchirmI'); } }
      else { const h = d > 1 ? zu.scale(Math.min(8, d) / d) : V(0, 0, 0); s.v.x += (h.x - s.v.x) * dt * 1.5; s.v.z += (h.z - s.v.z) * dt * 1.5; s.v.y += (-5 - s.v.y) * dt * 2.5; }
      s.pos.addInPlace(s.v.scale(dt)); b.k.position = s.pos.add(V(0, -0.9, 0)); if (d > 1) b.k.rotation.y = Math.atan2(zu.x, zu.z); if (s.schirm) s.schirm.position = s.pos.add(V(0, 3.6, 0)); b.cc.setPosition(s.pos.clone());
      if (ueber < 1.2) { b.cc.setPosition(V(s.pos.x, ctx.hoehe(s.pos.x, s.pos.z) + 1.2, s.pos.z)); b.cc.setVelocity(V(0, 0, 0)); b.inLuft = false; if (s.schirm) s.schirm.dispose(); springer.splice(i, 1); } } }
  return { api: { battleRoyale, absprung, get imFlug() { return flug ? flug.phase : null; }, get springerInDerLuft() { return springer.length; } }, update: springerUpdate };
});
