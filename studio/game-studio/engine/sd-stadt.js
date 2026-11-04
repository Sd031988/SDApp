/* SD Stadt – Straßen, Kreuzungen, Gehwege, Laternen, Häuserblöcke, Parks + Verkehr (KI-Autos) + Passanten. Engine-Modul. */
'use strict';
(function () {
  (window.SDModule = window.SDModule || []).push(function (ctx) {
    const { BAB, V, klemme, szene } = ctx; if (!ctx.BK) return {};
    const BK = ctx.BK; ctx.sperren = ctx.sperren || []; ctx.stadtNetze = ctx.stadtNetze || [];
    const verkehr = [], passanten = [];
    let lampenMat = null, alarm = { pos: null, zeit: -99 };
    ctx.beiSchuss.push(pos => { alarm = { pos: pos.clone(), zeit: ctx.zeit }; });

    /**
     * sd.stadt({ mitte:[x,z], bloecke:[nx,nz], block: 56, strasse: 14, seed, zentrumHoch: true, parks: 0.15, fotoHaeuser:['name', …], laternen: true })
     * Gelände dort vorher flach machen: sd.gelaende({ …, flach: [[x, z, radius, höhe]] }).
     */
    function stadt(o) {
      o = Object.assign({ mitte: [0, 0], bloecke: [4, 4], block: 56, strasse: 14, seed: 7, zentrumHoch: true, parks: 0.15, fotoHaeuser: [], laternen: true, sichtweite: 520 }, o || {});
      const r = ctx.zufall(o.seed), [nx, nz] = o.bloecke, S = o.strasse, BL = o.block, W = nx * BL + (nx + 1) * S, D = nz * BL + (nz + 1) * S;
      const x0 = o.mitte[0] - W / 2, z0 = o.mitte[1] - D / 2, y0 = ctx.hoehe(o.mitte[0], o.mitte[1]);
      const teile = { asphalt: [], gehweg: [], linie: [], rasen: [] };
      const kiste = (liste, w, h, d, x, y, z) => { const m = BAB.MeshBuilder.CreateBox('s', { width: w, height: h, depth: d }, szene); m.position = V(x, y, z); m.bakeCurrentTransformIntoVertices(); liste.push(m); return m; };
      const koerper = (w, h, d, x, y, z) => { const n = new BAB.TransformNode('stadtPhysik', szene); n.position = V(x, y, z); const b = new BAB.PhysicsBody(n, BAB.PhysicsMotionType.STATIC, false, szene); b.shape = new BAB.PhysicsShapeBox(V(0, 0, 0), BAB.Quaternion.Identity(), V(w, h, d), szene); };
      // Fahrbahn (eine große Fläche) und Gehweg-Inseln je Block
      kiste(teile.asphalt, W + 6, 0.3, D + 6, o.mitte[0], y0 - 0.1, o.mitte[1]); koerper(W + 6, 0.3, D + 6, o.mitte[0], y0 - 0.1, o.mitte[1]);
      const knoten = [], kanten = [], bloecke = [];
      for (let i = 0; i <= nx; i++) for (let j = 0; j <= nz; j++) knoten.push([x0 + i * (BL + S) + S / 2, z0 + j * (BL + S) + S / 2]);
      const kn = (i, j) => i * (nz + 1) + j;
      for (let i = 0; i <= nx; i++) for (let j = 0; j <= nz; j++) { if (i < nx) kanten.push([kn(i, j), kn(i + 1, j)]); if (j < nz) kanten.push([kn(i, j), kn(i, j + 1)]); }
      const nachbarn = knoten.map(() => []); kanten.forEach(([a, b]) => { nachbarn[a].push(b); nachbarn[b].push(a); });
      // Fahrbahnmarkierung (gestrichelt) + Zebrastreifen
      for (const [a, b] of kanten) { const A = knoten[a], B_ = knoten[b], dx = B_[0] - A[0], dz = B_[1] - A[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L;
        for (let t = S / 2 + 3; t < L - S / 2 - 3; t += 6) kiste(teile.linie, Math.abs(ux) > 0.5 ? 3 : 0.15, 0.02, Math.abs(ux) > 0.5 ? 0.15 : 3, A[0] + ux * (t + 1.5), y0 + 0.06, A[1] + uz * (t + 1.5));
        for (const ende of [S / 2 + 1.2, L - S / 2 - 1.2]) for (let k = -2; k <= 2; k++) { const px = A[0] + ux * ende - uz * k * 1.2, pz = A[1] + uz * ende + ux * k * 1.2; kiste(teile.linie, Math.abs(ux) > 0.5 ? 2 : 0.6, 0.02, Math.abs(ux) > 0.5 ? 0.6 : 2, px, y0 + 0.06, pz); } }
      // Blöcke: Gehweg + Bebauung oder Park
      const fotos = o.fotoHaeuser.slice(), mx = o.mitte[0], mz = o.mitte[1], maxD = Math.hypot(W, D) / 2;
      for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
        const bx = x0 + S + i * (BL + S) + BL / 2, bz = z0 + S + j * (BL + S) + BL / 2, park = r() < o.parks;
        kiste(teile.gehweg, BL, 0.2, BL, bx, y0 + 0.1, bz); koerper(BL, 0.2, BL, bx, y0 + 0.1, bz);
        bloecke.push({ x: bx, z: bz, groesse: BL, park });
        if (park) { kiste(teile.rasen, BL - 5, 0.05, BL - 5, bx, y0 + 0.22, bz); ctx.sd.baeume({ anzahl: 14, bereich: BL / 2 - 6, mitte: [bx, bz], seed: o.seed + i * 7 + j, art: 'laub' });
          for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2; ctx.sd.box({ pos: [bx + Math.cos(a) * 9, y0 + 0.45, bz + Math.sin(a) * 9], groesse: [Math.abs(Math.cos(a)) > 0.5 ? 0.5 : 2, 0.45, Math.abs(Math.cos(a)) > 0.5 ? 2 : 0.5], textur: 'holz', farbe: '#a07a50' }); } continue; }
        // 1–4 Gebäude je Block, Front zur nächsten Straße
        const zentrum = 1 - Math.hypot(bx - mx, bz - mz) / maxD, teilung = r() < 0.5 ? 2 : r() < 0.6 ? 1 : 3, rand = 4.5;
        const plaetze = teilung === 1 ? [[0, 0, BL - 2 * rand, BL - 2 * rand]] : teilung === 2 ? [[-BL / 4, 0, BL / 2 - rand - 1, BL - 2 * rand], [BL / 4, 0, BL / 2 - rand - 1, BL - 2 * rand]]
          : [[-BL / 4, -BL / 4, BL / 2 - rand - 1, BL / 2 - rand - 1], [BL / 4, -BL / 4, BL / 2 - rand - 1, BL / 2 - rand - 1], [0, BL / 4, BL - 2 * rand, BL / 2 - rand - 1]];
        for (const [px, pz, w, d] of plaetze) {
          const x = bx + px, z = bz + pz; const zuStrasse = Math.abs(px) > Math.abs(pz) ? (px > 0 ? 270 : 90) : (pz > 0 ? 180 : 0), quer = zuStrasse === 90 || zuStrasse === 270;
          const breite = quer ? d : w, tiefe = quer ? w : d;
          if (fotos.length && r() < 0.5) { const n = fotos.shift(); try { ctx.sd.fotoHaus(n, { pos: [x, y0 + 0.2, z], drehung: zuStrasse }); ctx.sperren.push({ x, z, w, d }); continue; } catch (e) { console.warn(e.message); } }
          const st = o.zentrumHoch ? Math.max(1, Math.round(2 + zentrum * zentrum * 11 + r() * 3)) : 1 + Math.floor(r() * 4);
          const mat = st > 6 ? ['beton', 'metall', 'putz'][Math.floor(r() * 3)] : ['putz', 'ziegel', 'putz', 'holz', 'ziegel'][Math.floor(r() * 5)];
          const farbe = mat === 'metall' ? ['#c8d0d8', '#9aa8b4'][Math.floor(r() * 2)] : ['#ffffff', '#efe4d2', '#e6d8c2', '#d9d4cc', '#f2e6d0', '#d8c8b0'][Math.floor(r() * 6)];
          const m = ctx.haus({ pos: [x, y0 + 0.2, z], breite, tiefe, stockwerke: st, material: mat, farbe, dach: st <= 3 && r() < 0.6 ? 'sattel' : 'flach', balkone: st > 1 && st < 9 && r() < 0.6, drehung: zuStrasse, seed: Math.floor(r() * 1e6) });
          if (m && m.addLODLevel) m.addLODLevel(o.sichtweite, null);
          ctx.sperren.push({ x, z, w, d });
        }
      }
      // Laternen (Instanzen)
      if (o.laternen) {
        if (!lampenMat) { lampenMat = BK.material(null, '#ffffff', { leuchten: '#ffe2a8', leuchtStaerke: 0.2 }); ctx.lampenMat = lampenMat; }
        const mast = BAB.MeshBuilder.CreateCylinder('mast', { height: 6, diameterTop: 0.1, diameterBottom: 0.18, tessellation: 8 }, szene); mast.position.y = 3; mast.material = BK.material('metall', '#3a3f45');
        const arm = BAB.MeshBuilder.CreateBox('arm', { width: 0.08, height: 0.08, depth: 1.4 }, szene); arm.position = V(0, 5.95, 0.65); arm.material = mast.material;
        const kopf = BAB.MeshBuilder.CreateBox('lampe', { width: 0.35, height: 0.12, depth: 0.6 }, szene); kopf.position = V(0, 5.85, 1.25); kopf.material = lampenMat;
        const vorlage = BAB.Mesh.MergeMeshes([mast, arm, kopf], true, true, undefined, false, true); vorlage.isVisible = false; vorlage.position.y = -500; ctx.schatten.addShadowCaster(vorlage);
        ctx.laternen = ctx.laternen || [];
        for (const b of bloecke) for (const [cx, cz, dreh] of [[-1, -1, 0], [1, -1, 0], [-1, 1, 180], [1, 1, 180]]) {
          const lx = b.x + cx * (b.groesse / 2 - 0.6), lz = b.z + cz * (b.groesse / 2 - 0.6), inst = vorlage.createInstance('laterne'); inst.position = V(lx, y0 + 0.2, lz); inst.rotation.y = Math.atan2(-cx, -cz) + Math.PI; inst.freezeWorldMatrix();
          ctx.laternen.push(V(lx - cx * 1.2, y0 + 6, lz - cz * 1.2)); koerper(0.25, 6, 0.25, lx, y0 + 3, lz); }
      }
      // Alles nach Material zusammenfassen
      const mats = { asphalt: BK.material('asphalt', '#ffffff'), gehweg: BK.material('platten', '#d8d4cc'), linie: BK.material(null, '#f2f2ee', { rau: 0.6 }), rasen: BK.material('gras', '#ffffff') };
      for (const [k, liste] of Object.entries(teile)) { if (!liste.length) continue; liste.forEach(m => BK.weltUV(m, BK.kachelGroesse(k === 'gehweg' ? 'platten' : k === 'rasen' ? 'gras' : 'asphalt'))); const m = BAB.Mesh.MergeMeshes(liste, true, true); m.material = mats[k]; m.receiveShadows = true; m.isPickable = true; m.freezeWorldMatrix(); m.metadata = { boden: true }; }
      const netz = { knoten, nachbarn, strasse: S, y: y0, bloecke, x0, z0, W, D, mitte: o.mitte }; ctx.stadtNetze.push(netz); ctx.stadtBereiche = (ctx.stadtBereiche || []).concat([[o.mitte[0], o.mitte[1], W / 2 + 4, D / 2 + 4]]);
      return netz;
    }

    /* ---------- 🚕 Verkehr: KI-Autos fahren auf den Straßen (Rechtsverkehr) ---------- */
    const FB = window.SDFahrzeug && window.SDFahrzeug.bauer(BAB, szene, BK);
    function verkehrStarten(o) {
      o = Object.assign({ anzahl: 10, seed: 3, tempo: 11 }, o || {}); const netz = ctx.stadtNetze[ctx.stadtNetze.length - 1]; if (!netz || !FB) throw new Error('sd.verkehr braucht vorher sd.stadt(...)');
      const r = ctx.zufall(o.seed), typen = ['limousine', 'limousine', 'suv', 'sport', 'pickup', 'bus'], farben = ['#b8202a', '#2a4a8a', '#e8e8e8', '#1c1c1c', '#c8b020', '#3a6a4a', '#8a8f96', '#6a2a8a'];
      for (let i = 0; i < o.anzahl; i++) {
        const typ = typen[Math.floor(r() * typen.length)], g = FB.auto({ typ, farbe: farben[Math.floor(r() * farben.length)], seed: i }), T = g.typ;
        const huelle = BAB.MeshBuilder.CreateBox('verkehrHuelle', { width: T.B, height: T.H * 0.8, depth: T.L }, szene); huelle.isVisible = false; huelle.isPickable = false; g.wurzel.parent = huelle; g.wurzel.position.y = -T.H * 0.4;
        g.karosse.concat(...g.raeder.map(x => x.meshes)).forEach(m => { ctx.schatten.addShadowCaster(m); m.receiveShadows = true; m.metadata = { fahrzeug: 'verkehr' + i }; });
        const agg = new BAB.PhysicsAggregate(huelle, BAB.PhysicsShapeType.BOX, { mass: 0 }, szene); agg.body.setMotionType(BAB.PhysicsMotionType.ANIMATED); agg.body.disablePreStep = false;
        const a = Math.floor(r() * netz.knoten.length), b = netz.nachbarn[a][Math.floor(r() * netz.nachbarn[a].length)];
        const v = { g, T, huelle, von: a, nach: b, t: r(), tempo: 0, ziel: o.tempo * (T.bus ? 0.75 : 0.9 + r() * 0.25), gier: 0, wartet: 0, netz, kurve: null };
        verkehr.push(v);
      }
      return verkehr.length;
    }
    const spur = (netz, a, b, t) => { const A = netz.knoten[a], B_ = netz.knoten[b], dx = B_[0] - A[0], dz = B_[1] - A[1], L = Math.hypot(dx, dz), ux = dx / L, uz = dz / L, rand = netz.strasse / 2 + 2, off = netz.strasse * 0.19;
      const s = rand + t * (L - 2 * rand); return { x: A[0] + ux * s + uz * off, z: A[1] + uz * s - ux * off, ux, uz, L: L - 2 * rand }; };   // rechte Fahrspur
    function verkehrUpdate(dt) {
      const spPos = ctx.spieler ? ctx.spielerPos() : null;
      for (const v of verkehr) {
        const netz = v.netz;
        if (v.kurve) { // Abbiegen: Bézier-Kurve über die Kreuzung
          const k = v.kurve; k.t += (v.tempo * dt) / k.L; const t = Math.min(1, k.t), u = 1 - t, x = u * u * k.p0[0] + 2 * u * t * k.p1[0] + t * t * k.p2[0], z = u * u * k.p0[1] + 2 * u * t * k.p1[1] + t * t * k.p2[1];
          v.pos = [x, z]; const dx = 2 * u * (k.p1[0] - k.p0[0]) + 2 * t * (k.p2[0] - k.p1[0]), dz = 2 * u * (k.p1[1] - k.p0[1]) + 2 * t * (k.p2[1] - k.p1[1]); v.richtung = Math.atan2(dx, dz);
          if (k.t >= 1) { v.kurve = null; v.von = k.von; v.nach = k.nach; v.t = 0; }
        } else {
          const s = spur(netz, v.von, v.nach, v.t); v.t += (v.tempo * dt) / Math.max(1, s.L); v.pos = [s.x, s.z]; v.richtung = Math.atan2(s.ux, s.uz);
          if (v.t >= 1) { // an der Kreuzung neue Richtung wählen (nicht umdrehen, außer Sackgasse)
            const opt = netz.nachbarn[v.nach].filter(n => n !== v.von), weiter = opt.length ? opt[Math.floor(Math.random() * opt.length)] : v.von;
            const e = spur(netz, v.von, v.nach, 1), a2 = spur(netz, v.nach, weiter, 0), mitte = netz.knoten[v.nach];
            const p1 = Math.abs(e.ux * a2.ux + e.uz * a2.uz) > 0.9 ? [(e.x + a2.x) / 2, (e.z + a2.z) / 2] : [e.x + e.ux * Math.abs((mitte[0] - e.x) * e.ux + (mitte[1] - e.z) * e.uz), e.z + e.uz * Math.abs((mitte[0] - e.x) * e.ux + (mitte[1] - e.z) * e.uz)];
            v.kurve = { p0: [e.x, e.z], p1, p2: [a2.x, a2.z], t: 0, L: Math.hypot(a2.x - e.x, a2.z - e.z) * 1.15 + 1, von: v.nach, nach: weiter };
          }
        }
        // Abstand halten: vor anderen Autos, dem Spieler und Passanten bremsen
        let frei = 1; const fx = Math.sin(v.richtung), fz = Math.cos(v.richtung);
        const pruefe = (px, pz, abst) => { const dx = px - v.pos[0], dz = pz - v.pos[1], vor = dx * fx + dz * fz, seit = Math.abs(dx * fz - dz * fx); if (vor > 0 && vor < abst && seit < 2.2) frei = Math.min(frei, (vor - v.T.L * 0.6) / abst); };
        for (const w of verkehr) if (w !== v && w.pos) pruefe(w.pos[0], w.pos[1], 9 + v.T.L);
        if (spPos) pruefe(spPos.x, spPos.z, 12); for (const p of passanten) if (p.pos) pruefe(p.pos.x, p.pos.z, 8);
        const zielTempo = v.ziel * klemme(frei, 0, 1) * (v.kurve ? 0.55 : 1); v.tempo += (zielTempo - v.tempo) * Math.min(1, dt * (zielTempo < v.tempo ? 4 : 1.2));
        v.gier += ctx.winkel(v.gier, v.richtung) * Math.min(1, dt * 10);
        v.huelle.position = V(v.pos[0], netz.y + v.T.H * 0.4 + 0.05, v.pos[1]); v.huelle.rotationQuaternion = BAB.Quaternion.RotationAxis(V(0, 1, 0), v.gier);
        for (const rad of v.g.raeder) { rad.dreh.rotation.x += v.tempo / v.T.rad * dt; if (rad.vorn) rad.lenk.rotation.y = v.kurve ? klemme(ctx.winkel(v.gier, v.richtung) * 3, -0.5, 0.5) : 0; }
      }
    }

    /* ---------- 🚶 Passanten auf den Gehwegen ---------- */
    function passantenStarten(o) {
      o = Object.assign({ anzahl: 20, seed: 5 }, o || {}); const netz = ctx.stadtNetze[ctx.stadtNetze.length - 1]; if (!netz) throw new Error('sd.passanten braucht vorher sd.stadt(...)');
      const r = ctx.zufall(o.seed), haut = ['#f1c9a5', '#d9a77c', '#b07a52', '#7a5236', '#5a3a26'], kleid = ['#3b5a7a', '#8a2a2a', '#2a6a4a', '#d8d0c0', '#4a4a4a', '#c88a2a', '#6a4a8a', '#1e2a3a'];
      for (let i = 0; i < o.anzahl; i++) {
        const b = netz.bloecke[Math.floor(r() * netz.bloecke.length)], halb = b.groesse / 2 - 1.6;
        const k = ctx.figur({ besitzer: 'passant' + i, aussehen: 'mensch', ohneWaffe: true, hoehe: 1.6 + r() * 0.3, mensch: { haut: haut[Math.floor(r() * 5)], oberteil: kleid[Math.floor(r() * 8)], hose: kleid[Math.floor(r() * 8)], haare: ['#1a1410', '#3a2a1e', '#8a6a3a', '#c8b080'][Math.floor(r() * 4)], frisur: ['kurz', 'lang', 'glatze', 'kappe'][Math.floor(r() * 4)], aermel: r() < 0.5 ? 'lang' : 'kurz', statur: 0.9 + r() * 0.25 } });
        k.getChildMeshes().forEach(m => { if (m.metadata && m.metadata.trefferzone) m.metadata.keinTreffer = true; });
        // Haltung ohne Waffe: Arme hängen lassen (Gewehrhaltung der Animation überschreiben)
        const p = { k, b, halb, u: r() * 4 * 2 * halb, richtung: r() < 0.5 ? 1 : -1, tempo: 1.2 + r() * 0.4, flucht: 0, netz }; passanten.push(p);
        if (k.mensch) armeLocker(k.mensch);
      }
      return passanten.length;
    }
    function armeLocker(m) { // eigene Schlender-Animation statt Gewehr-Haltung
      for (const g of Object.values(m.gruppen)) g.targetedAnimations.forEach(ta => { if (/oberarm|unterarm/.test(ta.target.name)) { const lr = /L$/.test(ta.target.name) ? -1 : 1, unten = /unterarm/.test(ta.target.name);
        ta.animation.getKeys().forEach((k, i, arr) => { const t = i / Math.max(1, arr.length - 1), sw = /Gehen|Rennen/.test(g.name) ? Math.sin(t * Math.PI * 2) * (/Rennen/.test(g.name) ? 0.7 : 0.35) * lr : 0; k.value = BAB.Quaternion.FromEulerAngles(unten ? -0.25 - Math.abs(sw) * 0.5 : sw, 0, unten ? 0 : -0.08 * lr); }); } }); }
    function umfang(p) { const h = p.halb, L = 8 * h; let u = ((p.u % L) + L) % L; const seite = Math.floor(u / (2 * h)), t = u % (2 * h) - h;
      const [dx, dz, fx, fz] = [[t, -h, 1, 0], [h, t, 0, 1], [-t, h, -1, 0], [-h, -t, 0, -1]][seite]; return { x: p.b.x + dx, z: p.b.z + dz, fx: fx * p.richtung, fz: fz * p.richtung }; }
    function passantenUpdate(dt) {
      const fahr = ctx.uebernahme && ctx.uebernahme.auto, fp = fahr ? fahr.chassis.getAbsolutePosition() : null;
      for (const p of passanten) {
        const pos = umfang(p); p.pos = V(pos.x, p.netz.y + 0.2, pos.z);
        if (alarm.pos && ctx.zeit - alarm.zeit < 0.1 && BAB.Vector3.Distance(alarm.pos, p.pos) < 40) { p.flucht = 8; const w = pos.fx * (alarm.pos.x - pos.x) + pos.fz * (alarm.pos.z - pos.z); if (w > 0) p.richtung *= -1; }
        p.flucht = Math.max(0, p.flucht - dt); let tempo = p.flucht > 0 ? 4.5 : p.tempo;
        if (fp && BAB.Vector3.Distance(fp, p.pos) < 7 && Math.abs(fahr.kmh) > 10) { tempo = 4.5; }
        p.u += tempo * p.richtung * dt; const n = umfang(p);
        p.k.position = V(n.x, p.netz.y + 0.2, n.z); const ziel = Math.atan2(n.fx, n.fz); p.k.rotation.y += ctx.winkel(p.k.rotation.y, ziel) * Math.min(1, dt * 8); p.k.animiere(tempo, dt, false);
      }
    }
    function update(dt) { if (verkehr.length) verkehrUpdate(dt); if (passanten.length) passantenUpdate(dt); }
    return { api: { stadt, verkehr: verkehrStarten, passanten: passantenStarten, get verkehrsAutos() { return verkehr; }, get passantenListe() { return passanten; } }, update };
  });
})();
