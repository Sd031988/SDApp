/* SD Fahrzeuge – Auto-Generator (Werkstatt + Engine) und Fahrphysik (Engine-Modul).
   Physik: Havok-Karosserie + 4 Strahlen-Räder mit Federung, Dämpfung, Reifenhaftung (quer/längs), Antrieb, Bremse, Handbremse. */
'use strict';
(function () {
  const TYPEN = {
    limousine: { name: 'Limousine', L: 4.6, B: 1.85, H: 1.45, rad: 0.34, kab: [0.3, 0.74], kabH: 0.5, frei: 0.17, masse: 1400, motor: 7200, vmax: 52, lenk: 0.6 },
    suv: { name: 'SUV', L: 4.75, B: 1.95, H: 1.78, rad: 0.4, kab: [0.27, 0.86], kabH: 0.68, frei: 0.24, masse: 1900, motor: 9000, vmax: 48, lenk: 0.55 },
    sport: { name: 'Sportwagen', L: 4.45, B: 1.95, H: 1.2, rad: 0.34, kab: [0.36, 0.72], kabH: 0.4, frei: 0.12, masse: 1350, motor: 11000, vmax: 72, lenk: 0.62 },
    pickup: { name: 'Pickup', L: 5.3, B: 2.0, H: 1.88, rad: 0.43, kab: [0.24, 0.55], kabH: 0.68, frei: 0.28, masse: 2100, motor: 9500, vmax: 46, lenk: 0.5, ladeflaeche: true },
    bus: { name: 'Bus', L: 11, B: 2.5, H: 3.1, rad: 0.5, kab: [0.03, 0.97], kabH: 1.7, frei: 0.32, masse: 11000, motor: 42000, vmax: 26, lenk: 0.48, bus: true },
  };

  /* ---------- 🚗 Generator ---------- */
  function bauer(BAB, szene, BK) {
    const V = (x, y, z) => new BAB.Vector3(x, y, z);
    /** konvexes Seitenprofil [[x(längs), y]] -> Körper der Breite b (z = quer) */
    function prisma(punkte, b, z0) {
      const pos = [], idx = [], n = punkte.length, zz = [z0 - b / 2, z0 + b / 2];
      for (const z of zz) for (const [x, y] of punkte) pos.push(z, y, x);   // Babylon: x = quer, z = längs
      for (let i = 1; i < n - 1; i++) { idx.push(0, i, i + 1); idx.push(n, n + i + 1, n + i); }
      for (let i = 0; i < n; i++) { const j = (i + 1) % n; idx.push(i, n + i, j); idx.push(j, n + i, n + j); }
      const m = new BAB.Mesh('prisma', szene), vd = new BAB.VertexData(); vd.positions = pos; vd.indices = idx; const nr = []; BAB.VertexData.ComputeNormals(pos, idx, nr); vd.normals = nr; vd.applyToMesh(m); m.convertToFlatShadedMesh(); BK.weltUV(m, 2);
      // nach außen zeigende Flächen sicherstellen (Fläche doppelt, wenn Wicklung falsch wäre)
      m.material = null; return m;
    }
    function auto(o) {
      o = Object.assign({ typ: 'limousine', farbe: '#b8202a', felgen: '#c8ccd2', scheiben: '#1b2833', seed: 1 }, o || {}); const T = TYPEN[o.typ] || TYPEN.limousine;
      const { L, B, H, rad, frei } = T, unterH = H - T.kabH, wurzel = new BAB.TransformNode('auto', szene), teile = [];
      const lack = BK.material('metall', o.farbe, { rau: 0.28, metall: 0.55 }), dunkel = BK.material(null, '#17191c', { rau: 0.6, metall: 0.2 }), chrom = BK.material(null, o.felgen, { rau: 0.18, metall: 1 }), glas = BK.material(null, o.scheiben, { glas: true }),
        gummi = BK.material(null, '#121212', { rau: 0.9 }), licht = BK.material(null, '#ffffff', { leuchten: '#fff3d6', leuchtStaerke: 2 }), rot = BK.material(null, '#3a0000', { leuchten: '#ff1a1a', leuchtStaerke: 2.2 }), orange = BK.material(null, '#3a2000', { leuchten: '#ff9a1a', leuchtStaerke: 1.5 });
      for (const m of [lack, glas]) { m.backFaceCulling = false; m.twoSidedLighting = true; }
      const teil = (m, mat) => { m.material = mat; m.parent = wurzel; teiles.push(m); return m; }; const teiles = teile;
      const kiste = (w, h, d, x, y, z, mat) => { const m = BAB.MeshBuilder.CreateBox('t', { width: w, height: h, depth: d }, szene); m.position = V(x, y, z); return teil(m, mat); };
      const hl = L / 2, y0 = frei + rad * 0.35;
      // Unterteil (Seitenprofil mit schräger Front, Motorhaube, Heck)
      const nase = T.bus ? 0.25 : 0.42, heck = T.bus ? 0.15 : 0.3;
      teil(prisma([[-hl, y0], [hl, y0], [hl, y0 + unterH * 0.55], [hl - nase, frei + unterH], [-hl + heck, frei + unterH], [-hl, y0 + unterH * 0.7]].map(([x, y]) => [x, y]), B, 0), lack);
      // Kabine: Glaskörper + Dach + Säulen
      const k0 = -hl + L * T.kab[0], k1 = -hl + L * T.kab[1], yU = frei + unterH, yO = H, schraegV = T.bus ? 0.1 : (k1 - k0) * 0.28, schraegH = T.bus ? 0.05 : (k1 - k0) * 0.18, bk = B * (T.bus ? 0.98 : 0.88);
      teil(prisma([[k0, yU], [k1, yU], [k1 - schraegV, yO], [k0 + schraegH, yO]], bk, 0), glas);
      kiste(bk + 0.02, 0.06, (k1 - schraegV) - (k0 + schraegH) + 0.04, 0, yO + 0.02, (k1 - schraegV + k0 + schraegH) / 2, lack);    // Dach
      for (const sx of [-1, 1]) { const mitte = (k0 + k1) / 2; if (!T.bus) kiste(0.07, yO - yU, 0.12, sx * bk / 2, (yU + yO) / 2, mitte - (k1 - k0) * 0.05, lack); }
      if (T.bus) { for (let i = 0; i < 6; i++) for (const sx of [-1, 1]) kiste(0.04, yO - yU, 0.16, sx * bk / 2, (yU + yO) / 2, -hl + 0.8 + i * (L - 1.6) / 5, lack); kiste(B * 0.6, 0.35, 0.05, 0, yO - 0.3, hl - 0.02, orange); }
      if (T.ladeflaeche) { const z0 = -hl + 0.05, z1 = k0 - 0.1, hb = 0.45; kiste(B, 0.06, z1 - z0, 0, yU + 0.02, (z0 + z1) / 2, dunkel); for (const sx of [-1, 1]) kiste(0.08, hb, z1 - z0, sx * (B / 2 - 0.04), yU + hb / 2, (z0 + z1) / 2, lack); kiste(B, hb, 0.08, 0, yU + hb / 2, z0 + 0.04, lack); }
      // Lichter, Stoßstangen, Kühlergrill, Spiegel, Kennzeichen
      for (const sx of [-1, 1]) { kiste(0.36, 0.12, 0.05, sx * (B / 2 - 0.28), y0 + unterH * 0.48, hl + 0.005, licht); kiste(0.34, 0.12, 0.05, sx * (B / 2 - 0.26), y0 + unterH * 0.6, -hl - 0.005, rot);
        if (!T.bus) kiste(0.08, 0.1, 0.2, sx * (B / 2 + 0.06), yU + 0.12, k0 + 0.3, lack); }
      kiste(B + 0.04, 0.16, 0.12, 0, y0 + 0.05, hl - 0.02, dunkel); kiste(B + 0.04, 0.16, 0.12, 0, y0 + 0.05, -hl + 0.02, dunkel);
      kiste(B * 0.45, unterH * 0.28, 0.04, 0, y0 + unterH * 0.3, hl + 0.01, dunkel); kiste(0.52, 0.12, 0.02, 0, y0 + unterH * 0.3, -hl - 0.03, BK.material(null, '#e8e8e8', { rau: 0.4 }));
      for (const sx of [-1, 1]) kiste(0.02, 0.03, L * 0.5, sx * (B / 2 + 0.004), y0 + unterH * 0.62, 0.1, dunkel);   // Zierleiste
      // Räder (Lenk-Knoten -> Dreh-Knoten -> Reifen + Felge)
      const achsV = hl - (T.bus ? 1.9 : L * 0.17), achsH = -hl + (T.bus ? 2.6 : L * 0.18), raeder = [];
      for (const [z, vorn] of [[achsV, true], [achsH, false]]) for (const sx of [-1, 1]) {
        const lenk = new BAB.TransformNode('lenk', szene); lenk.parent = wurzel; lenk.position = V(sx * (B / 2 - 0.22), rad, z); const dreh = new BAB.TransformNode('dreh', szene); dreh.parent = lenk;
        const reifen = BAB.MeshBuilder.CreateCylinder('reifen', { diameter: rad * 2, height: 0.26, tessellation: 22 }, szene); reifen.rotation.z = Math.PI / 2; reifen.parent = dreh; reifen.material = gummi;
        const felge = BAB.MeshBuilder.CreateCylinder('felge', { diameter: rad * 1.25, height: 0.27, tessellation: 10 }, szene); felge.rotation.z = Math.PI / 2; felge.parent = dreh; felge.material = chrom;
        const nabe = BAB.MeshBuilder.CreateBox('speiche', { width: 0.275, height: rad * 1.1, depth: 0.08 }, szene); nabe.parent = dreh; nabe.material = dunkel;
        raeder.push({ lenk, dreh, x: sx * (B / 2 - 0.22), z, vorn, links: sx < 0, meshes: [reifen, felge, nabe] });
      }
      // Karosserie-Teile nach Material zusammenfassen (wenige Zeichenaufrufe)
      const gruppen = new Map(); teile.forEach(t => { t.computeWorldMatrix(true); const k = t.material.uniqueId; if (!gruppen.has(k)) gruppen.set(k, []); gruppen.get(k).push(t); });
      const karosse = []; for (const g of gruppen.values()) { g.forEach(t => { t.parent = null; }); const m = g.length > 1 ? BAB.Mesh.MergeMeshes(g, true, true) : g[0]; m.parent = wurzel; m.name = 'karosse'; karosse.push(m); }
      const lackMesh = karosse.find(m => m.material === lack); if (lackMesh) lackMesh.markVerticesDataAsUpdatable(BAB.VertexBuffer.PositionKind, true);
      return { wurzel, karosse, raeder, typ: T, abm: { L, B, H }, lackMesh };
    }
    return { auto, TYPEN };
  }

  window.SDFahrzeug = { bauer, TYPEN };

  /* ---------- Engine-Modul: Fahren ---------- */
  (window.SDModule = window.SDModule || []).push(function (ctx) {
    const { BAB, V, klemme, szene, kamera } = ctx; if (!ctx.BK) return {};
    const B = bauer(BAB, szene, ctx.BK), autos = []; let zaehler = 0, fahrend = null;
    const pe = szene.getPhysicsEngine(), erg = new BAB.PhysicsRaycastResult(), MASKE = 4, ABFRAGE = { collideWith: 0xffffffff & ~MASKE };
    let tacho = ctx.hud.tacho; if (!tacho && ctx.hud.munition) { tacho = document.createElement('div'); tacho.id = 'tacho'; tacho.style.cssText = 'position:absolute;right:20px;bottom:90px;font:700 30px system-ui;text-shadow:0 1px 3px #000;text-align:right'; ctx.hud.munition.parentNode.parentNode.appendChild(tacho); tacho.hidden = true; }

    /** sd.auto({ pos:[x,y,z], drehung, typ:'limousine'|'suv'|'sport'|'pickup'|'bus', farbe }) – fahrbares Auto */
    function auto(o) {
      o = o || {}; const g = B.auto(o), T = g.typ, id = 'auto' + (zaehler++);
      const x = o.pos[0], z = o.pos[2], y = (o.pos[1] ?? ctx.hoehe(x, z)) + 0.6;
      const MOUNT = 0.35, yb = T.rad + MOUNT + 0.04, yt = Math.max(yb + 0.3, T.H * 0.85), hc = yt - yb, yc = (yb + yt) / 2;   // Kollisionskörper liegt ÜBER den Federbeinen
      const chassis = BAB.MeshBuilder.CreateBox('fahrwerk', { width: T.B, height: hc, depth: T.L * 0.98 }, szene); chassis.isVisible = false; chassis.isPickable = false;
      chassis.position = V(x, y + yc, z); chassis.rotationQuaternion = BAB.Quaternion.RotationAxis(V(0, 1, 0), (o.drehung || 0) * Math.PI / 180);
      g.wurzel.parent = chassis; g.wurzel.position = V(0, -yc, 0);
      g.karosse.concat(...g.raeder.map(r => r.meshes)).forEach(m => { ctx.schatten.addShadowCaster(m); m.receiveShadows = true; m.metadata = { fahrzeug: id }; m.isPickable = true; });
      const agg = new BAB.PhysicsAggregate(chassis, BAB.PhysicsShapeType.BOX, { mass: T.masse, friction: 0.4, restitution: 0.05 }, szene);
      agg.shape.filterMembershipMask = MASKE; const bx = T.B, by = T.H, bz = T.L * 0.98; agg.body.setMassProperties({ mass: T.masse, centerOfMass: V(0, -hc / 2 - 0.1, 0), inertia: V((by * by + bz * bz) / 12, (bx * bx + bz * bz) / 12, (bx * bx + by * by) / 12), inertiaOrientation: BAB.Quaternion.Identity() }); agg.body.setAngularDamping(0.6); agg.body.setLinearDamping(0.05);
      const k = T.masse * 9.81 / (4 * 0.11), a = { id, g, T, chassis, body: agg.body, lenkung: 0, rpm: 0, mount: MOUNT, yc, feder: k, daempfer: 2 * Math.sqrt(k * T.masse / 4) * 0.55, eingabe: { gas: 0, lenk: 0, bremse: 0, hand: false }, kopfueber: 0, kmh: 0, ki: !!o.ki, zustand: 100, vAlt: null, wrack: false };
      g.raeder.forEach(r => { r.einfed = 0; r.drehWinkel = 0; r.kontakt = false; });
      autos.push(a); return a;
    }
    const tmpV = new BAB.Vector3(), tmpW = new BAB.Vector3();
    function physik(a, dt) {
      const ch = a.chassis, T = a.T, mw = ch.computeWorldMatrix(true), q = ch.rotationQuaternion; const vorn = BAB.Vector3.TransformNormal(V(0, 0, 1), mw).normalize(), oben = BAB.Vector3.TransformNormal(V(0, 1, 0), mw).normalize(), rechts = BAB.Vector3.Cross(oben, vorn).normalize();
      a.body.getLinearVelocityToRef(tmpV); a.body.getAngularVelocityToRef(tmpW); const v = tmpV.clone(), w = tmpW.clone(), schwer = ch.getAbsolutePosition();
      const vLaengs = BAB.Vector3.Dot(v, vorn); a.kmh = vLaengs * 3.6;
      const e = a.eingabe, schnell = Math.abs(vLaengs) / T.vmax;
      a.lenkung += (e.lenk * T.lenk * (1 - schnell * 0.55) - a.lenkung) * Math.min(1, dt * 6);
      let kontakte = 0;
      for (const r of a.g.raeder) {
        const lokal = V(r.x, T.rad + a.mount - a.yc, r.z), von = BAB.Vector3.TransformCoordinates(lokal, mw), laenge = a.mount + T.rad + 0.25, bis = von.add(oben.scale(-laenge));
        erg.reset && erg.reset(); pe.raycastToRef(von, bis, erg, ABFRAGE); if (erg.hasHit && erg.body === a.body) { a.eigenTreffer = (a.eigenTreffer || 0) + 1; }
        r.kontakt = erg.hasHit; if (!erg.hasHit) { r.einfed += (0 - r.einfed) * Math.min(1, dt * 10); r.letzteKomp = undefined; continue; } kontakte++;
        const dist = BAB.Vector3.Distance(von, erg.hitPointWorld), komp = (a.mount + T.rad) - dist, kompV = (komp - (r.letzteKomp ?? komp)) / Math.max(dt, 1e-3); r.letzteKomp = komp; r.einfed = komp;
        const fz = klemme(a.feder * komp + a.daempfer * klemme(kompV, -3, 3), 0, T.masse * 9.81 * 2.5), n = erg.hitNormalWorld.clone().normalize(), punkt = erg.hitPointWorld.add(oben.scale(T.rad * 0.6));
        const rv = vorn.clone(); if (r.vorn) { const qs = BAB.Quaternion.RotationAxis(oben, a.lenkung); rv.copyFrom(rv.applyRotationQuaternion(qs)); } const rr = BAB.Vector3.Cross(oben, rv).normalize();
        const hebel = punkt.subtract(schwer), vp = v.add(BAB.Vector3.Cross(w, hebel)), vq = BAB.Vector3.Dot(vp, rr), vl = BAB.Vector3.Dot(vp, rv);
        const hand = e.hand && !r.vorn, mu = hand ? 0.45 : 1.05, maxF = fz * mu * 1.1;
        let fq = -vq * T.masse * 0.25 * 9; fq = klemme(fq, -maxF, maxF);
        let fl = 0; const antrieb = !r.vorn || T.typAllrad; if (antrieb && e.gas && !(e.gas > 0 && vLaengs > T.vmax) && !(e.gas < 0 && vLaengs < -T.vmax * 0.3)) fl += e.gas * T.motor / (T.typAllrad ? 4 : 2) * (e.gas < 0 ? 0.6 : 1);
        if (e.bremse || hand) fl -= Math.sign(vl) * Math.min(Math.abs(vl) * T.masse * 4, (hand ? 0.9 : 0.6) * fz);
        fl -= vl * 18;                                                                                 // Roll- und Luftwiderstand
        fl = klemme(fl, -maxF * 1.2, maxF * 1.2);
        const kraft = n.scale(fz).add(rr.scale(fq)).add(rv.scale(fl)); a.body.applyImpulse(kraft.scale(dt), punkt);
        r.drehWinkel += vl / T.rad * dt;
      }
      // Räder darstellen
      for (const r of a.g.raeder) { r.lenk.position.y = T.rad + klemme(r.einfed - 0.11, -0.15, 0.2); if (r.vorn) r.lenk.rotation.y = a.lenkung; r.dreh.rotation.x = r.drehWinkel; }
      a.kopfueber = oben.y < 0.35 ? a.kopfueber + dt : 0; a.kontakte = kontakte;
      // Aufprall erkennen: plötzliche Geschwindigkeitsänderung (waagerecht)
      if (a.vAlt) { const dv = V(v.x - a.vAlt.x, 0, v.z - a.vAlt.z), st = dv.length(); if (st > 4.5) { const richtung = dv.normalize().scale(-1); schaden(a, (st - 4.5) * 7, schwer.add(richtung.scale(T.L * 0.45)).add(V(0, T.H * 0.15, 0)), 'Unfall'); } }
      a.vAlt = v.clone();
    }
    /* ---------- 💥 Schaden: Beulen, Rauch, Feuer, Explosion ---------- */
    const punktTex = (() => { const t = new BAB.DynamicTexture('rauchTex', 64, szene, false), c = t.getContext(), g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); t.update(); t.hasAlpha = true; return t; })();
    function schaden(a, menge, weltPunkt, quelle) {
      if (a.wrack || !(menge > 0)) return; a.zustand = Math.max(0, a.zustand - menge);
      if (weltPunkt && a.g.lackMesh && menge > 2) beule(a, weltPunkt, Math.min(0.28, 0.03 + menge * 0.01));
      if (menge > 6 && fahrend === a) ctx.ton('schaden', 0.6);
      effekte(a); if (a.zustand <= 0) explodieren(a, quelle);
    }
    function beule(a, p, tiefe) {
      const m = a.g.lackMesh, inv = m.computeWorldMatrix(true).clone().invert(), lok = BAB.Vector3.TransformCoordinates(p, inv), pos = m.getVerticesData(BAB.VertexBuffer.PositionKind), mitte = V(0, a.T.H * 0.45, 0), R = 0.95;
      for (let i = 0; i < pos.length; i += 3) { const dx = pos[i] - lok.x, dy = pos[i + 1] - lok.y, dz = pos[i + 2] - lok.z, d = Math.sqrt(dx * dx + dy * dy + dz * dz); if (d > R) continue;
        const f = (1 - d / R) * tiefe, rx = mitte.x - pos[i], ry = mitte.y - pos[i + 1], rz = mitte.z - pos[i + 2], l = Math.hypot(rx, ry, rz) || 1; pos[i] += rx / l * f; pos[i + 1] += ry / l * f * 0.5; pos[i + 2] += rz / l * f; }
      m.updateVerticesData(BAB.VertexBuffer.PositionKind, pos); const n = []; BAB.VertexData.ComputeNormals(pos, m.getIndices(), n); m.setVerticesData(BAB.VertexBuffer.NormalKind, n);
    }
    function partikel(quelle, farbe1, farbe2, rate, groesse, auftrieb, add) {
      const ps = new BAB.ParticleSystem('rauch', 300, szene); ps.particleTexture = punktTex; ps.emitter = quelle; ps.minEmitBox = V(-0.3, 0, -0.2); ps.maxEmitBox = V(0.3, 0.1, 0.2);
      ps.color1 = farbe1; ps.color2 = farbe2; ps.colorDead = new BAB.Color4(0.1, 0.1, 0.1, 0); ps.minSize = groesse * 0.5; ps.maxSize = groesse; ps.minLifeTime = 0.6; ps.maxLifeTime = 1.6; ps.emitRate = rate;
      ps.direction1 = V(-0.4, auftrieb, -0.4); ps.direction2 = V(0.4, auftrieb * 1.5, 0.4); ps.gravity = V(0, auftrieb * 0.6, 0); ps.minEmitPower = 0.5; ps.maxEmitPower = 1.2; ps.blendMode = add ? BAB.ParticleSystem.BLENDMODE_ADD : BAB.ParticleSystem.BLENDMODE_STANDARD; ps.start(); return ps;
    }
    function effekte(a) {
      if (!a.rauchQuelle) { a.rauchQuelle = BAB.MeshBuilder.CreateBox('rauchQuelle', { size: 0.1 }, szene); a.rauchQuelle.isVisible = false; a.rauchQuelle.isPickable = false; a.rauchQuelle.parent = a.g.wurzel; a.rauchQuelle.position = V(0, a.T.H * 0.62, a.T.L * 0.36); }
      if (a.zustand < 55 && !a.rauch) a.rauch = partikel(a.rauchQuelle, new BAB.Color4(0.75, 0.75, 0.75, 0.5), new BAB.Color4(0.5, 0.5, 0.5, 0.4), 30, 1.2, 1.5, false);
      if (a.rauch) { const dunkel = a.zustand < 30; a.rauch.color1 = dunkel ? new BAB.Color4(0.15, 0.15, 0.15, 0.7) : new BAB.Color4(0.75, 0.75, 0.75, 0.5); a.rauch.emitRate = 30 + (55 - a.zustand) * 3; }
      if (a.zustand < 22 && !a.feuer) a.feuer = partikel(a.rauchQuelle, new BAB.Color4(1, 0.6, 0.1, 1), new BAB.Color4(1, 0.25, 0.05, 1), 80, 0.8, 2.2, true);
    }
    function explodieren(a, quelle) {
      a.wrack = true; const p = a.chassis.getAbsolutePosition().clone(); ctx.ton('schrot', 1, p); ctx.ton('tot', 0.8, p);
      const knall = partikel(a.rauchQuelle, new BAB.Color4(1, 0.8, 0.3, 1), new BAB.Color4(1, 0.3, 0.05, 1), 0, 3.5, 4, true); knall.manualEmitCount = 260; knall.minEmitPower = 4; knall.maxEmitPower = 11; knall.targetStopDuration = 0.5; knall.disposeOnStop = true;
      const licht = new BAB.PointLight('explosion', p.add(V(0, 1.5, 0)), szene); licht.diffuse = new BAB.Color3(1, 0.6, 0.25); licht.intensity = 30; licht.range = 30; let t = 0; const ob = szene.onBeforeRenderObservable.add(() => { t += 1 / 60; licht.intensity = Math.max(0, 30 - t * 40); if (t > 1) { szene.onBeforeRenderObservable.remove(ob); licht.dispose(); } });
      const verbrannt = ctx.BK.material(null, '#151413', { rau: 0.9 }); a.g.karosse.forEach(m => { if (m.material && m.material.name.indexOf('glas') < 0) m.material = verbrannt; });
      a.body.applyImpulse(V((Math.random() - 0.5) * 2, 9, (Math.random() - 0.5) * 2).scale(a.T.masse * 0.6), p.add(V(0.4, 0, 0.6)));
      if (fahrend === a) { aussteigen(true); ctx.schaden(ctx.spieler, 65, quelle || 'Explosion'); }
      else if (ctx.spieler) { const d = BAB.Vector3.Distance(ctx.spielerPos(), p); if (d < 8) ctx.schaden(ctx.spieler, (8 - d) * 9, 'Explosion'); }
      for (const b of ctx.bots) { if (b.tot) continue; const d = BAB.Vector3.Distance(b.cc.getPosition(), p); if (d < 8) ctx.schaden(b, (8 - d) * 18, 'Explosion'); }
      for (const o of autos) if (o !== a && !o.wrack && BAB.Vector3.Distance(o.chassis.getAbsolutePosition(), p) < 7) schaden(o, 35, null, quelle);
      setTimeout(() => { if (a.feuer) { a.feuer.stop(); } }, 14000);
    }
    ctx.fahrzeugTreffer = (id, menge, punkt) => { const a = autos.find(x => x.id === id); if (a) { schaden(a, menge, punkt, 'Spieler'); return true; } return false; };

    function aufrichten(a) { const p = a.chassis.getAbsolutePosition(), yaw = Math.atan2(BAB.Vector3.TransformNormal(V(0, 0, 1), a.chassis.getWorldMatrix()).x, BAB.Vector3.TransformNormal(V(0, 0, 1), a.chassis.getWorldMatrix()).z);
      a.body.disablePreStep = false; a.chassis.position = V(p.x, ctx.hoehe(p.x, p.z) + 2, p.z); a.chassis.rotationQuaternion = BAB.Quaternion.RotationAxis(V(0, 1, 0), yaw); a.body.setLinearVelocity(V(0, 0, 0)); a.body.setAngularVelocity(V(0, 0, 0)); setTimeout(() => { a.body.disablePreStep = true; }, 100); }

    /* ---------- Einsteigen / Aussteigen ---------- */
    let kamGier = 0, kamOffset = 0, kamNick = 0.25; let motor = null;
    function einsteigen(a) {
      const sp = ctx.spieler; if (!sp) return; fahrend = a; sp.k.setEnabled(false); kamGier = Math.atan2(BAB.Vector3.TransformNormal(V(0, 0, 1), a.chassis.getWorldMatrix()).x, BAB.Vector3.TransformNormal(V(0, 0, 1), a.chassis.getWorldMatrix()).z);
      ctx.uebernahme = { fahrzeugId: a.id, auto: a, update: fahrenUpdate, kamera: fahrKamera, pos: () => a.chassis.getAbsolutePosition() };
      const AC = ctx.audio && ctx.audio(); if (AC) { const o1 = AC.createOscillator(), o2 = AC.createOscillator(), f = AC.createBiquadFilter(), g = AC.createGain(); o1.type = 'sawtooth'; o2.type = 'square'; f.type = 'lowpass'; f.frequency.value = 600; g.gain.value = 0;
        o1.connect(f); o2.connect(f); f.connect(g); g.connect(AC.destination); o1.start(); o2.start(); motor = { o1, o2, f, g, AC }; ctx.aufraeumen.push(() => { try { o1.stop(); o2.stop(); } catch (e) { /* schon aus */ } }); } tacho && (tacho.hidden = false); ctx.ton('aufheben'); ctx.nachricht('🚗 ' + a.T.name + ' · W/S Gas/Bremse · A/D lenken · Leertaste Handbremse · F aussteigen', 4);
    }
    function aussteigen(sofort) {
      const a = fahrend, sp = ctx.spieler; if (!a || !sp) return; const mw = a.chassis.getWorldMatrix(), seite = BAB.Vector3.TransformCoordinates(V(-(a.T.B / 2 + 1.1), 0, 0.5), mw);
      if (motor) { try { motor.o1.stop(); motor.o2.stop(); } catch (e) { /* egal */ } motor = null; }
      sp.cc.setPosition(V(seite.x, Math.max(seite.y, ctx.hoehe(seite.x, seite.z)) + 1.2, seite.z)); sp.cc.setVelocity(V(0, 0, 0)); sp.k.setEnabled(true); sp.gier = kamGier; fahrend = null; ctx.uebernahme = null; tacho && (tacho.hidden = true); a.eingabe = { gas: 0, lenk: 0, bremse: 1, hand: true };
    }
    ctx.tastenHandler.F = ctx.tastenHandler.F || []; ctx.tastenHandler.F.push(() => { if (ctx.vorbei) return; if (fahrend) { if (Math.abs(fahrend.kmh) < 25 || fahrend.wrack) aussteigen(); else ctx.nachricht('Zu schnell zum Aussteigen – erst bremsen'); return; } const a = naechstes(3.8); if (a) einsteigen(a); });
    (ctx.tastenHandler.R = ctx.tastenHandler.R || []).push(() => { if (fahrend && fahrend.kopfueber > 0.5) aufrichten(fahrend); });
    function naechstes(max) { const sp = ctx.spieler; if (!sp) return null; const p = sp.cc.getPosition(); let best = null, d = max; for (const a of autos) { if (a.ki || a.wrack) continue; const dd = BAB.Vector3.Distance(p, a.chassis.getAbsolutePosition()); if (dd < d) { d = dd; best = a; } } return best; }
    function fahrenUpdate(dt) {
      const a = fahrend, t = ctx.tasten, tc = ctx.touch, sp = ctx.spieler; const vor = (t.W || t.ArrowUp ? 1 : 0) + Math.max(0, tc.bewegen[1]), zur = (t.S || t.ArrowDown ? 1 : 0) + Math.max(0, -tc.bewegen[1]);
      const vl = a.kmh / 3.6; a.eingabe.lenk = klemme((t.D || t.ArrowRight ? 1 : 0) - (t.A || t.ArrowLeft ? 1 : 0) + tc.bewegen[0], -1, 1); a.eingabe.hand = !!t.Space;
      if (vor) { a.eingabe.gas = vl < -1 ? 0 : 1; a.eingabe.bremse = vl < -1 ? 1 : 0; } else if (zur) { a.eingabe.gas = vl > 1 ? 0 : -1; a.eingabe.bremse = vl > 1 ? 1 : 0; } else { a.eingabe.gas = 0; a.eingabe.bremse = 0; }
      const p = a.chassis.getAbsolutePosition(); sp.cc.setPosition(V(p.x, p.y + 30, p.z)); sp.tempo = Math.abs(vl);   // Spielfigur aus dem Weg (sie würde das Auto sonst blockieren)
      if (a.wrack) { a.eingabe.gas = 0; a.eingabe.bremse = 1; }
      if (tacho) tacho.textContent = (a.wrack ? '🔥 Wrack – F aussteigen' : Math.abs(Math.round(a.kmh)) + ' km/h') + (a.zustand < 100 && !a.wrack ? ' · 🔧 ' + Math.round(a.zustand) + '%' : '');
      if (motor) { const drehzahl = 38 + (Math.abs(a.kmh) % 45) * 2.4 + Math.abs(a.eingabe.gas) * 18, tt = motor.AC.currentTime; motor.o1.frequency.setTargetAtTime(drehzahl, tt, 0.05); motor.o2.frequency.setTargetAtTime(drehzahl * 0.5, tt, 0.05); motor.g.gain.setTargetAtTime(0.035 + Math.abs(a.eingabe.gas) * 0.04, tt, 0.08); motor.f.frequency.setTargetAtTime(400 + Math.abs(a.eingabe.gas) * 900, tt, 0.1); }
      ctx.hinweisText = a.kopfueber > 0.5 ? 'R: Auto aufrichten' : null;
    }
    function fahrKamera(dt) {
      const a = fahrend, mw = a.chassis.getWorldMatrix(), f = BAB.Vector3.TransformNormal(V(0, 0, 1), mw), ziel = Math.atan2(f.x, f.z);
      kamOffset += ctx.maus.dx * 0.003; kamNick = klemme(kamNick + ctx.maus.dy * 0.002, -0.1, 0.9); ctx.maus.dx = ctx.maus.dy = 0; kamOffset *= Math.pow(0.15, dt);
      kamGier += ctx.winkel(kamGier, ziel) * Math.min(1, dt * 3.5); const g = kamGier + kamOffset, abst = 4.5 + a.T.L * 0.8 + Math.min(3, Math.abs(a.kmh) / 40);
      const dreh = a.chassis.getAbsolutePosition().add(V(0, a.T.H * 0.9, 0)), dir = V(Math.sin(g) * Math.cos(kamNick), -Math.sin(kamNick), Math.cos(g) * Math.cos(kamNick));
      const tr = ctx.strahl(dreh, dir.scale(-1), abst, 'spieler'); let ist = abst; if (tr && tr.hit && !(tr.pickedMesh.metadata && tr.pickedMesh.metadata.fahrzeug === a.id)) ist = Math.max(2, tr.distance - 0.3);
      kamera.position = dreh.subtract(dir.scale(ist)); kamera.setTarget(dreh.add(V(0, 0.3, 0))); kamera.fov += (1.0 + Math.min(0.25, Math.abs(a.kmh) / 400) - kamera.fov) * Math.min(1, dt * 4);
    }
    function update(dt) {
      for (const a of autos) physik(a, dt);
      if (!fahrend && ctx.spieler && !ctx.vorbei) { const a = naechstes(3.8); ctx.hinweisText = a ? 'F: Einsteigen (' + a.T.name + ')' : null; }
    }
    return { api: { autoSchaden: (a, m) => schaden(a, m, a.chassis.getAbsolutePosition().add(V(0, 0.5, a.T.L * 0.45)), 'Skript'), auto, autos, AUTO_TYPEN: TYPEN, get fahrzeug() { return fahrend; }, einsteigen, aussteigen }, update };
  });
})();
