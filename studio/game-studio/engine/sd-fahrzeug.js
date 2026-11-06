/* SD Fahrzeuge – Auto-Generator (Werkstatt + Engine) und Fahrphysik (Engine-Modul).
   Physik: Havok-Karosserie + 4 Strahlen-Räder mit Federung, Dämpfung, Reifenhaftung (quer/längs), Antrieb, Bremse, Handbremse. */
'use strict';
(function () {
  const TYPEN = {
    limousine: { name: 'Limousine', L: 4.6, B: 1.85, H: 1.45, rad: 0.34, kab: [0.3, 0.74], kabH: 0.5, frei: 0.17, masse: 1400, motor: 7200, vmax: 52, lenk: 0.6 },
    suv: { name: 'SUV', L: 4.75, B: 1.95, H: 1.78, rad: 0.4, kab: [0.27, 0.86], kabH: 0.68, frei: 0.24, masse: 1900, motor: 9000, vmax: 48, lenk: 0.55 },
    sport: { name: 'Sportwagen', L: 4.45, B: 1.95, H: 1.2, rad: 0.34, kab: [0.36, 0.72], kabH: 0.4, frei: 0.12, masse: 1350, motor: 11000, vmax: 72, lenk: 0.62 },
    pickup: { name: 'Pickup', L: 5.3, B: 2.0, H: 1.88, rad: 0.43, kab: [0.24, 0.55], kabH: 0.68, frei: 0.28, masse: 2100, motor: 9500, vmax: 46, lenk: 0.5, ladeflaeche: true },
    motorrad: { name: 'Motorrad', L: 2.1, B: 0.62, H: 1.15, rad: 0.32, kab: [0, 0], kabH: 0, frei: 0.15, masse: 230, motor: 2900, vmax: 60, lenk: 0.42, zweirad: true },
    boot: { name: 'Motorboot', art: 'boot', L: 6, B: 2.2, H: 1.7, rad: 0, masse: 900, motor: 11000, vmax: 24, lenk: 0.6 },
    flugzeug: { name: 'Propellerflugzeug', art: 'flugzeug', L: 7.6, B: 9.4, H: 2.4, rad: 0.28, masse: 1100, motor: 0, vmax: 62, lenk: 0 },
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
    function autoBauen(o) {
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
    /* gemeinsame Helfer für Motorrad, Boot, Flugzeug */
    function werkzeug(o) {
      const wurzel = new BAB.TransformNode('fahrzeug', szene), teile = [], M = {
        lack: BK.material('metall', o.farbe, { rau: 0.28, metall: 0.55 }), dunkel: BK.material(null, '#17191c', { rau: 0.6, metall: 0.2 }), chrom: BK.material(null, o.felgen || '#c8ccd2', { rau: 0.18, metall: 1 }),
        glas: BK.material(null, o.scheiben || '#1b2833', { glas: true }), gummi: BK.material(null, '#121212', { rau: 0.9 }), licht: BK.material(null, '#ffffff', { leuchten: '#fff3d6', leuchtStaerke: 2 }),
        rot: BK.material(null, '#3a0000', { leuchten: '#ff1a1a', leuchtStaerke: 2.2 }), weiss: BK.material(null, o.zweitfarbe || '#eeeeea', { rau: 0.4 }), holz: BK.material('holz', '#b08a5a') };
      for (const m of [M.lack, M.glas, M.weiss]) { m.backFaceCulling = false; m.twoSidedLighting = true; }
      const teil = (m, mat) => { m.material = mat; m.parent = wurzel; teile.push(m); return m; };
      const kiste = (w, h, d, x, y, z, mat) => { const m = BAB.MeshBuilder.CreateBox('t', { width: w, height: h, depth: d }, szene); m.position = V(x, y, z); return teil(m, mat); };
      const zyl = (d, h, x, y, z, mat, rx, rz) => { const m = BAB.MeshBuilder.CreateCylinder('z', { diameter: d, height: h, tessellation: 14 }, szene); m.position = V(x, y, z); if (rx) m.rotation.x = rx; if (rz) m.rotation.z = rz; return teil(m, mat); };
      const spitz = (m, zAb, zBis, minF) => { const p = m.getVerticesData('position'); for (let i = 0; i < p.length; i += 3) { const z = p[i + 2]; if (z > zAb) { const t = Math.min(1, (z - zAb) / (zBis - zAb)); p[i] *= 1 - t * (1 - (minF || 0.08)); } } m.setVerticesData('position', p); const n = []; BAB.VertexData.ComputeNormals(p, m.getIndices(), n); m.setVerticesData('normal', n); return m; };
      const fertig = (raeder, T, extra) => { const gruppen = new Map(); teile.forEach(t => { t.computeWorldMatrix(true); const k = t.material.uniqueId; if (!gruppen.has(k)) gruppen.set(k, []); gruppen.get(k).push(t); });
        const karosse = []; for (const g of gruppen.values()) { g.forEach(t => { t.parent = null; }); const m = g.length > 1 ? BAB.Mesh.MergeMeshes(g, true, true) : g[0]; m.parent = wurzel; m.name = 'karosse'; karosse.push(m); }
        const lackMesh = karosse.find(m => m.material === M.lack); if (lackMesh) lackMesh.markVerticesDataAsUpdatable(BAB.VertexBuffer.PositionKind, true);
        return Object.assign({ wurzel, karosse, raeder, typ: T, abm: { L: T.L, B: T.B, H: T.H }, lackMesh }, extra || {}); };
      const rad = (r, breite, x, y, z, vorn, sichtbar) => { const lenk = new BAB.TransformNode('lenk', szene); lenk.parent = wurzel; lenk.position = V(x, y, z); const dreh = new BAB.TransformNode('dreh', szene); dreh.parent = lenk; const meshes = [];
        if (sichtbar) { const re = BAB.MeshBuilder.CreateCylinder('reifen', { diameter: r * 2, height: breite, tessellation: 22 }, szene); re.rotation.z = Math.PI / 2; re.parent = dreh; re.material = M.gummi;
          const fe = BAB.MeshBuilder.CreateCylinder('felge', { diameter: r * 1.3, height: breite + 0.01, tessellation: 10 }, szene); fe.rotation.z = Math.PI / 2; fe.parent = dreh; fe.material = M.chrom; meshes.push(re, fe); }
        return { lenk, dreh, x, z, vorn, links: x < 0, meshes }; };
      return { wurzel, teile, M, teil, kiste, zyl, spitz, fertig, rad };
    }
    function motorradBauen(o) {
      o = Object.assign({ farbe: '#c81e1e' }, o || {}); const T = TYPEN.motorrad, w = werkzeug(o), { kiste, zyl, M } = w, r = T.rad;
      kiste(0.32, 0.26, 0.55, 0, 0.88, 0.12, M.lack); kiste(0.28, 0.1, 0.62, 0, 0.83, -0.38, M.dunkel); kiste(0.3, 0.32, 0.45, 0, 0.5, 0.05, M.chrom); kiste(0.24, 0.12, 0.6, 0, 0.42, -0.42, M.dunkel);
      for (const sx of [-0.09, 0.09]) zyl(0.05, 0.85, sx, 0.72, 0.62, M.chrom, -0.42); zyl(0.04, 0.7, 0, 1.05, 0.5, M.dunkel, 0, Math.PI / 2); kiste(0.2, 0.15, 0.1, 0, 0.98, 0.78, M.licht);
      kiste(0.16, 0.06, 0.4, 0, 0.75, 0.72, M.lack); kiste(0.18, 0.06, 0.45, 0, 0.72, -0.78, M.lack); kiste(0.12, 0.06, 0.04, 0, 0.82, -1.0, M.rot); zyl(0.08, 0.5, 0.16, 0.38, -0.55, M.chrom, Math.PI / 2 - 0.2);
      // Fahrer (nur sichtbar, wenn jemand fährt)
      const fahrer = new BAB.TransformNode('fahrer', szene); fahrer.parent = w.wurzel; const fm = (m, mat, x, y, z, rx) => { m.parent = fahrer; m.position = V(x, y, z); if (rx) m.rotation.x = rx; m.material = mat; return m; };
      const jacke = BK.material(null, o.fahrerFarbe || '#2a4a8a', { rau: 0.7 }); fm(BAB.MeshBuilder.CreateBox('f', { width: 0.36, height: 0.55, depth: 0.24 }, szene), jacke, 0, 1.28, -0.18, 0.45); fm(BAB.MeshBuilder.CreateSphere('f', { diameter: 0.28, segments: 10 }, szene), M.lack, 0, 1.6, 0.0);
      for (const sx of [-1, 1]) { fm(BAB.MeshBuilder.CreateBox('f', { width: 0.1, height: 0.1, depth: 0.55 }, szene), jacke, sx * 0.2, 1.22, 0.22, 0.25); fm(BAB.MeshBuilder.CreateBox('f', { width: 0.14, height: 0.14, depth: 0.5 }, szene), M.dunkel, sx * 0.17, 0.9, -0.05, 0.1); fm(BAB.MeshBuilder.CreateBox('f', { width: 0.12, height: 0.45, depth: 0.12 }, szene), M.dunkel, sx * 0.2, 0.62, 0.2, -0.25); }
      fahrer.setEnabled(false);
      const raeder = [w.rad(r, 0.12, -0.3, r, 0.72, true, false), w.rad(r, 0.12, 0.3, r, 0.72, true, false), w.rad(r, 0.14, -0.3, r, -0.72, false, false), w.rad(r, 0.14, 0.3, r, -0.72, false, false)];
      const vorne = w.rad(r, 0.12, 0, r, 0.72, true, true), hinten = w.rad(r, 0.15, 0, r, -0.72, false, true); raeder[0].sicht = vorne; raeder[2].sicht = hinten;
      return w.fertig(raeder, T, { fahrer, sichtRaeder: [vorne, hinten] });
    }
    function bootBauen(o) {
      o = Object.assign({ farbe: '#e8e8e4', zweitfarbe: '#1d5a8a' }, o || {}); const T = TYPEN.boot, w = werkzeug(o), { kiste, M } = w, hl = T.L / 2;
      const rumpf = prisma([[-hl, 0.05], [hl - 0.4, 0.05], [hl, 0.95], [hl, 1.05], [-hl, 1.0]], T.B, 0); w.spitz(rumpf, hl - 2.2, hl, 0.05); w.teil(rumpf, M.lack);
      const streifen = prisma([[-hl + 0.02, 0.6], [hl - 0.2, 0.62], [hl - 0.05, 0.85], [-hl + 0.02, 0.82]], T.B + 0.02, 0); w.spitz(streifen, hl - 2.2, hl, 0.05); w.teil(streifen, M.weiss);
      kiste(T.B - 0.2, 0.06, T.L - 2.6, 0, 1.02, -0.6, M.holz); kiste(T.B - 0.4, 0.5, 0.06, 0, 1.3, 0.9, M.glas); kiste(1.0, 0.45, 0.6, 0, 1.25, -0.6, M.dunkel); kiste(0.5, 0.8, 0.5, 0, 0.95, -hl - 0.15, M.dunkel); kiste(0.2, 0.6, 0.15, 0, 0.35, -hl - 0.2, M.chrom);
      for (const sx of [-1, 1]) kiste(0.05, 0.25, T.L - 2.4, sx * (T.B / 2 - 0.05), 1.22, -0.4, M.chrom); kiste(0.15, 0.08, 0.05, 0, 1.12, hl - 0.1, M.licht);
      return w.fertig([], T);
    }
    function flugzeugBauen(o) {
      o = Object.assign({ farbe: '#f2f2ee', zweitfarbe: '#c81e1e' }, o || {}); const T = TYPEN.flugzeug, w = werkzeug(o), { kiste, zyl, M } = w, hl = T.L / 2;
      const rumpf = prisma([[-hl, 1.35], [-hl + 1.5, 0.85], [hl - 1.2, 0.7], [hl, 1.05], [hl, 1.6], [hl - 1.6, 2.05], [-hl + 1.8, 1.8], [-hl, 1.75]], 1.25, 0); w.spitz(rumpf, -hl + 3, -hl, 0.18); w.teil(rumpf, M.lack);
      const fenster = prisma([[hl - 2.8, 1.62], [hl - 1.7, 1.62], [hl - 1.8, 2.02], [hl - 2.7, 2.05]], 1.27, 0); w.teil(fenster, M.glas);
      kiste(T.B, 0.14, 1.6, 0, 2.06, 0.35, M.lack); for (const sx of [-1, 1]) { kiste(1.2, 0.15, 1.62, sx * (T.B / 2 - 0.6), 2.07, 0.35, M.weiss); kiste(0.06, 0.9, 0.06, sx * 1.4, 1.62, 0.6, M.chrom); }
      kiste(3.2, 0.1, 0.9, 0, 1.6, -hl + 0.45, M.lack); w.teil(prisma([[-hl, 1.7], [-hl + 1.2, 1.75], [-hl + 0.4, 2.9], [-hl, 2.9]], 0.1, 0), M.weiss);
      kiste(0.5, 0.5, 0.25, 0, 1.3, hl + 0.05, M.dunkel); const propeller = new BAB.TransformNode('propeller', szene); propeller.parent = w.wurzel; propeller.position = V(0, 1.3, hl + 0.22);
      const blatt = BAB.MeshBuilder.CreateBox('blatt', { width: 2.0, height: 0.14, depth: 0.04 }, szene); blatt.parent = propeller; blatt.material = M.dunkel;
      const nabe = BAB.MeshBuilder.CreateSphere('nabe', { diameter: 0.28, segments: 8 }, szene); nabe.parent = propeller; nabe.material = M.weiss;
      for (const sx of [-1, 1]) { zyl(0.06, 0.8, sx * 0.8, 0.55, 0.5, M.chrom, 0, sx * 0.5); } zyl(0.06, 0.75, 0, 0.55, hl - 1.0, M.chrom);
      const raeder = [w.rad(0.25, 0.14, -1.1, 0.25, 0.5, false, true), w.rad(0.25, 0.14, 1.1, 0.25, 0.5, false, true), w.rad(0.18, 0.1, 0, 0.18, hl - 1.0, true, true)];
      return w.fertig(raeder, T, { propeller, extraMeshes: [blatt, nabe] });
    }
    /** Ein Fahrzeug bauen: typ 'limousine'|'suv'|'sport'|'pickup'|'bus'|'motorrad'|'boot'|'flugzeug' */
    /** Auto aus einem KI-Bauplan (sd-teile): Räder heißen rad_vl/rad_vr/rad_hl/rad_hr, vorne ist +z, Boden y = 0 */
    function bauplanAuto(o) {
      if (!window.SDTeile) throw new Error('sd-teile.js fehlt'); const r = window.SDTeile.bauen(BAB, szene, BK, o.bauplan); if (!r.wurzel) throw new Error('Bauplan: ' + r.fehler.join(', '));
      const wurzel = new BAB.TransformNode('auto', szene), modell = r.wurzel; modell.parent = wurzel; const raeder = [], namen = { rad_vl: [true, true], rad_vr: [true, false], rad_hl: [false, true], rad_hr: [false, false] };
      modell.computeWorldMatrix(true); Object.values(r.knoten).forEach(n => n.computeWorldMatrix(true));
      for (const [id, [vorn, links]] of Object.entries(namen)) { const n = r.knoten[id]; if (!n) continue; const p = n.getAbsolutePosition(), t = n.__t, rr = (t.durchmesser || 0.7) / 2;
        const lenk = new BAB.TransformNode('lenk', szene); lenk.parent = wurzel; lenk.position = V(p.x, rr, p.z); const dreh = new BAB.TransformNode('dreh', szene); dreh.parent = lenk;
        n.parent = dreh; n.position = V(0, 0, 0); raeder.push({ lenk, dreh, x: p.x, z: p.z, vorn, links, meshes: n.getChildMeshes(), r: rr }); }
      if (raeder.length < 4) throw new Error('Für ein fahrbares Auto braucht der Bauplan 4 Räder mit den ids rad_vl, rad_vr, rad_hl, rad_hr');
      const { min, max } = modell.getHierarchyBoundingVectors(true), L = max.z - min.z, B = Math.max(1.2, max.x - min.x), H = max.y, rad = raeder.reduce((a, q) => a + q.r, 0) / 4;
      const masse = o.masse || Math.round(900 + L * B * H * 60), T = Object.assign({}, TYPEN.limousine, { name: (r.daten && r.daten.name) || 'Eigenes Auto', L, B, H, rad, masse, motor: o.motor || masse * 5.2, vmax: o.vmax || 58, lenk: o.lenkung || 0.55, kabH: H * 0.4, frei: rad * 0.5 });
      const karosse = modell.getChildMeshes().filter(m => !raeder.some(q => q.meshes.includes(m)));
      return { wurzel, karosse, raeder, typ: T, abm: { L, B, H }, lackMesh: null, bauplan: r };
    }
    function auto(o) { if (o && o.bauplan) return bauplanAuto(o); const t = (o && o.typ) || 'limousine'; return t === 'motorrad' ? motorradBauen(o) : t === 'boot' ? bootBauen(o) : t === 'flugzeug' ? flugzeugBauen(o) : autoBauen(o); }
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
      o = o || {}; if (typeof o.bauplan === 'string' && !/^\s*[{[]/.test(o.bauplan)) o = Object.assign({}, o, { bauplan: ctx.eigene(o.bauplan, 'teile').json });
      const g = B.auto(o), T = g.typ, id = 'auto' + (zaehler++), art = T.art || 'auto';
      const x = o.pos[0], z = o.pos[2]; let y = (o.pos[1] ?? ctx.hoehe(x, z)) + 0.6;
      const MOUNT = 0.35; let yb = T.rad + MOUNT + 0.04, yt = Math.max(yb + 0.3, T.H * 0.85), breite = T.zweirad ? 0.7 : T.B, tiefe = T.L * 0.98;   // Kollisionskörper liegt ÜBER den Federbeinen
      if (art === 'boot') { yb = 0; yt = 1.0; if (o.pos[1] == null && ctx.wasserHoehe != null) y = Math.max(ctx.hoehe(x, z), ctx.wasserHoehe) + 0.2; }
      if (art === 'flugzeug') { yb = 0; yt = 1.95; breite = 1.5; tiefe = T.L * 0.95; y = (o.pos[1] ?? ctx.hoehe(x, z)) + 0.1; }
      const hc = yt - yb, yc = (yb + yt) / 2;
      const chassis = BAB.MeshBuilder.CreateBox('fahrwerk', { width: breite, height: hc, depth: tiefe }, szene); chassis.isVisible = false; chassis.isPickable = false;
      chassis.position = V(x, y + yc, z); chassis.rotationQuaternion = BAB.Quaternion.RotationAxis(V(0, 1, 0), (o.drehung || 0) * Math.PI / 180);
      g.wurzel.parent = chassis; g.wurzel.position = V(0, -yc, 0);
      g.karosse.concat(...g.raeder.map(r => r.meshes), ...(g.sichtRaeder || []).map(r => r.meshes), g.extraMeshes || []).forEach(m => { ctx.schatten.addShadowCaster(m); m.receiveShadows = true; m.metadata = { fahrzeug: id }; m.isPickable = true; });
      const agg = new BAB.PhysicsAggregate(chassis, BAB.PhysicsShapeType.BOX, { mass: T.masse, friction: art === 'flugzeug' ? 0.05 : art === 'boot' ? 0.3 : 0.4, restitution: 0.05 }, szene);
      agg.shape.filterMembershipMask = MASKE; const bx = breite, by = T.H, bz = T.L * 0.98; agg.body.setMassProperties({ mass: T.masse, centerOfMass: art === 'auto' ? V(0, -hc / 2 - (T.zweirad ? 0.35 : 0.1), 0) : V(0, -hc * 0.3, art === 'flugzeug' ? 0.3 : 0), inertia: V((by * by + bz * bz) / 12, (bx * bx + bz * bz) / 12, (bx * bx + by * by) / 12), inertiaOrientation: BAB.Quaternion.Identity() }); agg.body.setAngularDamping(0.6); agg.body.setLinearDamping(0.05);
      const k = T.masse * 9.81 / (4 * 0.11), a = { id, g, T, chassis, body: agg.body, lenkung: 0, rpm: 0, mount: MOUNT, yc, feder: k, daempfer: 2 * Math.sqrt(k * T.masse / 4) * 0.55, eingabe: { gas: 0, lenk: 0, bremse: 0, hand: false, schub: 0, nick: 0, roll: 0 }, kopfueber: 0, kmh: 0, ki: !!o.ki, art, schub: 0, typName: o.typ || 'limousine', farbe: o.farbe || '#b8202a', zustand: 100, vAlt: null, wrack: false };
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
      a.vAlt = v.clone(); if (T.zweirad) zweirad(a, dt, vorn, BAB.Vector3.Cross(oben, vorn).normalize(), v);
    }
    /* ---------- 🤖 Computer-Fahrer (Gelände): lenkt zum Ziel, bremst vor der Ankunft, setzt zurück wenn er feststeckt ---------- */
    function kiFahren(a, dt) {
      const z = a.kiZiel(); const e = a.eingabe; if (!z) { e.gas = 0; e.bremse = 1; return; }
      const p = a.chassis.getAbsolutePosition(), mw = a.chassis.computeWorldMatrix(true), vorn = BAB.Vector3.TransformNormal(V(0, 0, 1), mw), dx = z.x - p.x, dz = z.z - p.z, d = Math.hypot(dx, dz);
      const w = Math.atan2(dx, dz) - Math.atan2(vorn.x, vorn.z), wn = Math.atan2(Math.sin(w), Math.cos(w));
      if (a.kiRueck > 0) { a.kiRueck -= dt; e.gas = -0.7; e.lenk = a.kiSeite ? a.kiSeite : -Math.sign(wn); e.bremse = 0; if (a.kiRueck <= 0) a.kiUmfahren = 2.5; return; }
      if (a.kiUmfahren > 0) { a.kiUmfahren -= dt; e.gas = 0.6; e.bremse = 0; e.lenk = a.kiSeite ? -a.kiSeite : Math.sign(wn); return; }   // nach dem Zurücksetzen seitlich vorbei
      if (d < (a.kiHalt || 18)) { e.gas = 0; e.bremse = 1; e.lenk = 0; if (!a.kiAngekommen) { a.kiAngekommen = true; a.beiAnkunft && a.beiAnkunft(a); } return; }
      if (d > (a.kiHalt || 18) * 3) a.kiAngekommen = false;
      const vms = Math.abs(a.kmh) / 3.6; if (d < (a.kiHalt || 18) + vms * vms / 10 + 2) { e.gas = 0; e.bremse = 1; e.lenk = klemme(wn * 1.6, -1, 1); if (vms < 1.5 && d < (a.kiHalt || 18) * 1.6 && !a.kiAngekommen) { a.kiAngekommen = true; a.beiAnkunft && a.beiAnkunft(a); } return; }   // rechtzeitig bremsen
      // Hindernisse (Bäume, Häuser, Felsen): drei Fühler-Strahlen nach vorn, links und rechts – ausweichen
      let ausweichen = 0; a.kiFuehler = (a.kiFuehler || 0) - dt;
      if (a.kiFuehler <= 0) { a.kiFuehler = 0.15; const rechts = BAB.Vector3.TransformNormal(V(1, 0, 0), mw), start = p.add(V(0, 0.4, 0)).add(vorn.scale(a.T.L / 2 + 0.3)), weit = 8 + Math.abs(a.kmh) / 3.6 * 1.8; a.kiAus = 0; a.kiVorn = null;
        [[-0.45, 1], [0, 0], [0.45, -1]].forEach(([q, seite]) => { const dir = vorn.add(rechts.scale(q)).normalize(); dir.y = 0; const t = ctx.strahl(start, dir.normalize(), weit); const m = t && t.hit && t.pickedMesh;
          if (m && !(m.metadata && (m.metadata.boden || m.metadata.fahrzeug === a.id))) { const nah = 1 - t.distance / weit; a.kiAus += (seite || (a.kiSeite || (a.kiSeite = wn >= 0 ? -1 : 1))) * nah * (q ? 1 : 1.6); if (!q) a.kiVorn = t.distance; } }); if (!a.kiAus && !(a.kiUmfahren > 0) && !(a.kiRueck > 0)) a.kiSeite = 0; }
      ausweichen = a.kiAus || 0; const vorF = a.kiVorn; a.kiVorn = a.kiFuehler > 0.14 ? vorF : a.kiVorn;
      e.lenk = klemme(wn * (ausweichen ? 0.6 : 1.6) - ausweichen * 2.6, -1, 1); e.bremse = 0;
      if (vorF != null && a.kiAus) { const vms2 = Math.abs(a.kmh) / 3.6; if (vorF < vms2 * vms2 / 12 + 3) { e.gas = 0; e.bremse = 1; a.kiSteck = (a.kiSteck || 0) + dt; if (a.kiSteck > 1.5) { a.kiSteck = 0; a.kiRueck = 1.6; } return; } } e.gas = Math.abs(wn) > 1.2 && Math.abs(a.kmh) > 30 ? 0.2 : klemme(d / 40, 0.45, 1) * (Math.abs(wn) > 0.8 ? 0.6 : 1);
      if (a.kiAus) { e.gas *= 0.35; if (Math.abs(a.kmh) > 25) { e.gas = 0; e.bremse = 0.6; } }   // vor Hindernissen langsamer
      a.kiSteck = Math.abs(a.kmh) < 3 ? (a.kiSteck || 0) + dt : 0; if (a.kiSteck > 2.5) { a.kiSteck = 0; a.kiRueck = 1.6; }
    }
    function entfernen(a) { const i = autos.indexOf(a); if (i >= 0) autos.splice(i, 1); if (fahrend === a) aussteigen(); try { a.body.dispose(); } catch (e) { /* weg */ } a.chassis.dispose(false, true); }
    /** Fahrzeug mit Blaulicht und Computer-Fahrer, z. B. Polizei auf freiem Gelände */
    function einsatzwagen(o) { const a = auto(Object.assign({ typ: 'suv', farbe: '#eef0f3' }, o, { ki: true })); a.kiZiel = o.ziel; a.beiAnkunft = o.beiAnkunft; a.kiHalt = o.halt || 18;
      a.blau = [-1, 1].map(sx => { const b = BAB.MeshBuilder.CreateBox('blaulicht', { width: 0.32, height: 0.14, depth: 0.22 }, szene), m = new BAB.StandardMaterial('blau', szene); m.disableLighting = true; b.material = m; b.parent = a.g.wurzel; b.position = V(sx * 0.25, a.T.H + 0.07, -0.1); b.isPickable = false; return b; });
      a.entfernen = () => entfernen(a); return a; }
    /* ---------- 🏍 Motorrad: Gleichgewicht und Schräglage ---------- */
    function zweirad(a, dt, vorn, rechts, v) {
      const roll = Math.asin(klemme(BAB.Vector3.Dot(rechts, V(0, 1, 0)), -1, 1)), tempo = Math.abs(BAB.Vector3.Dot(v, vorn)), ziel = -a.lenkung * klemme(tempo / 10, 0, 1) * 1.15;
      a.body.getAngularVelocityToRef(tmpW); const wv = BAB.Vector3.Dot(tmpW, vorn); a.body.setAngularVelocity(tmpW.subtract(vorn.scale(wv)).add(vorn.scale((ziel - roll) * 7)));
      const [vr, hr] = a.g.sichtRaeder, rv = a.g.raeder[0], rh = a.g.raeder[2]; vr.lenk.rotation.y = a.lenkung; vr.dreh.rotation.x = rv.drehWinkel; hr.dreh.rotation.x = rh.drehWinkel;
      vr.lenk.position.y = a.T.rad + klemme(rv.einfed - 0.11, -0.15, 0.2); hr.lenk.position.y = a.T.rad + klemme(rh.einfed - 0.11, -0.15, 0.2);
    }
    function richtungen(a) { const mw = a.chassis.computeWorldMatrix(true); return { mw, vorn: BAB.Vector3.TransformNormal(V(0, 0, 1), mw).normalize(), oben: BAB.Vector3.TransformNormal(V(0, 1, 0), mw).normalize(), rechts: BAB.Vector3.TransformNormal(V(1, 0, 0), mw).normalize() }; }
    function aufprall(a, v, grenze) { if (a.vAlt) { const dv = v.subtract(a.vAlt), st = dv.length(); if (st > grenze) schaden(a, (st - grenze) * 7, a.chassis.getAbsolutePosition().add(dv.normalize().scale(-a.T.L * 0.4)), 'Unfall'); } a.vAlt = v.clone(); }
    /* ---------- 🚤 Boot: Auftrieb, Wasserwiderstand, Antrieb am Heck ---------- */
    function bootPhysik(a, dt) {
      const T = a.T, { mw, vorn, rechts } = richtungen(a), W = ctx.wasserHoehe; a.body.getLinearVelocityToRef(tmpV); a.body.getAngularVelocityToRef(tmpW); const v = tmpV.clone(), w = tmpW.clone(), mitte = a.chassis.getAbsolutePosition();
      let nass = 0; const e = a.eingabe;
      if (W != null) for (const [px, pz] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8], [0, 0], [0, 0.95], [0, -0.95]]) {
        const p = BAB.Vector3.TransformCoordinates(V(px * T.B / 2, -a.yc + 0.1, pz * T.L / 2), mw), tiefe = W - p.y; if (tiefe <= 0) continue; nass++;
        const pv = v.add(BAB.Vector3.Cross(w, p.subtract(mitte))), f = klemme(tiefe / 0.35, 0, 3) * T.masse * 9.81 / 7 - pv.y * T.masse * 0.5 / 7; a.body.applyImpulse(V(0, f * dt, 0), p); }
      a.imWasser = nass > 2;
      const vf = BAB.Vector3.Dot(v, vorn), vq = BAB.Vector3.Dot(v, rechts); a.kmh = vf * 3.6;
      if (a.imWasser) {
        a.body.setLinearDamping(0.35); a.body.setAngularDamping(2.5);
        const heck = BAB.Vector3.TransformCoordinates(V(0, -a.yc * 0.3, -T.L / 2), mw);   // Höhe des Schwerpunkts: lenken ohne Kentern
        const roll = Math.asin(klemme(BAB.Vector3.Dot(rechts, V(0, 1, 0)), -1, 1)), wr = BAB.Vector3.Dot(w, vorn), ziel = klemme(-e.lenk * Math.abs(vf) / 40, -0.2, 0.2);   // leicht in die Kurve legen, sonst aufrichten
        const nick = Math.asin(klemme(BAB.Vector3.Dot(vorn, V(0, 1, 0)), -1, 1)), wn = BAB.Vector3.Dot(w, rechts), nZiel = klemme(vf / 25, 0, 1) * 0.07;   // bei Fahrt Bug leicht anheben (Gleitfahrt)
        a.body.setAngularVelocity(w.subtract(vorn.scale(wr)).subtract(rechts.scale(wn)).add(vorn.scale(wr * 0.8 + (ziel - roll) * 2.5)).add(rechts.scale(wn * 0.8 - (nZiel - nick) * 2.5)));
        if (!(e.gas > 0 && vf > T.vmax)) a.body.applyImpulse(vorn.scale(e.gas * T.motor * (e.gas < 0 ? 0.4 : 1) * dt), heck);
        a.body.applyImpulse(rechts.scale(-e.lenk * T.motor * 0.28 * klemme(Math.abs(vf) / 5 + 0.25, 0, 1) * Math.sign(vf || 1) * dt), heck);
        a.body.applyImpulse(rechts.scale(-vq * T.masse * 1.4 * dt), mitte);   // Kiel: kein Seitwärtsrutschen
      } else { a.body.setLinearDamping(0.05); a.body.setAngularDamping(0.8); }
      aufprall(a, v, 9); a.kopfueber = BAB.Vector3.TransformNormal(V(0, 1, 0), mw).y < 0.3 ? a.kopfueber + dt : 0;
    }
    /* ---------- ✈ Flugzeug: Schub, Auftrieb, Steuern (vereinfachte Flugphysik) ---------- */
    function flugPhysik(a, dt) {
      const T = a.T, { vorn, oben, rechts } = richtungen(a), e = a.eingabe, mitte = a.chassis.getAbsolutePosition(); a.body.getLinearVelocityToRef(tmpV); a.body.getAngularVelocityToRef(tmpW); const v = tmpV.clone();
      erg.reset && erg.reset(); pe.raycastToRef(mitte, mitte.add(V(0, -1.6, 0)), erg, ABFRAGE); const amBoden = erg.hasHit; a.amBoden = amBoden; a.hoehe = mitte.y - ctx.hoehe(mitte.x, mitte.z) - a.yc;
      a.schub = klemme(a.schub + e.schub * dt * 0.45, 0, 1); const vf = BAB.Vector3.Dot(v, vorn); a.kmh = vf * 3.6;
      const auftrieb = klemme((vf - 20) / 12, 0, 1), acc = a.schub * 9 - Math.sign(vf) * vf * vf * 9 / (T.vmax * T.vmax) - (e.bremse && amBoden ? Math.sign(vf) * 6 : 0);
      let vn = v.add(vorn.scale(acc * dt)); const sp = vn.length();
      if (auftrieb > 0) { vn = BAB.Vector3.Lerp(vn, vorn.scale(Math.max(0, BAB.Vector3.Dot(vn, vorn))), Math.min(1, dt * 2.5 * auftrieb)); vn.y += 9.81 * dt * auftrieb; }   // Flügel: Flugbahn folgt der Nase, Auftrieb trägt
      if (amBoden) vn = vn.subtract(rechts.scale(BAB.Vector3.Dot(vn, rechts) * Math.min(1, dt * 8)));   // Räder: kein Seitwärtsrutschen
      if (sp > T.vmax * 1.3) vn.scaleInPlace(T.vmax * 1.3 / sp); a.body.setLinearVelocity(vn);
      const roll = Math.asin(klemme(BAB.Vector3.Dot(rechts, V(0, 1, 0)), -1, 1)), steuer = amBoden ? 0.35 : 0.15 + auftrieb * 0.85;
      const rollZiel = -e.roll * 1.0; let wz = vorn.scale(amBoden ? 0 : (rollZiel - roll) * 2.2 * steuer).add(rechts.scale(e.nick * 0.9 * steuer)).add(V(0, 1, 0).scale(-roll * 0.9 * auftrieb + (amBoden ? e.roll * 0.7 : 0)));
      if (amBoden) { const nick = Math.asin(klemme(-BAB.Vector3.Dot(vorn, V(0, 1, 0)), -1, 1)); wz = wz.add(vorn.scale(-roll * 3)); if (auftrieb < 0.6) wz = wz.add(rechts.scale(nick * 2)); }
      a.body.setAngularVelocity(BAB.Vector3.Lerp(tmpW, wz, Math.min(1, dt * 5)));
      if (a.g.propeller) a.g.propeller.rotation.z += dt * (4 + a.schub * 55);
      for (const r of a.g.raeder) r.dreh.rotation.x += (amBoden ? vf / 0.25 : 0) * dt;
      if (amBoden && a.warOben && (oben.y < 0.6 || v.y < -7)) schaden(a, 200, mitte, 'Absturz'); if (!amBoden && a.hoehe > 3) a.warOben = true; if (amBoden && Math.abs(vf) < 5) a.warOben = false;
      aufprall(a, v, 10);
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
      a.wrack = true; const p = a.chassis.getAbsolutePosition().clone(); ctx.ton('explosion', 1, p); ctx.wackeln && ctx.wackeln(1.1, p);
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
        o1.connect(f); o2.connect(f); f.connect(g); g.connect(AC.destination); o1.start(); o2.start(); motor = { o1, o2, f, g, AC }; ctx.aufraeumen.push(() => { try { o1.stop(); o2.stop(); } catch (e) { /* schon aus */ } }); } tacho && (tacho.hidden = false); ctx.ton('aufheben'); if (a.g.fahrer) a.g.fahrer.setEnabled(true);
      ctx.nachricht(a.art === 'flugzeug' ? '✈ Shift = mehr Gas · Strg/C = weniger · W/S = Nase runter/hoch · A/D = Kurve · ab ca. 110 km/h mit S abheben · F aussteigen (am Boden)' : a.art === 'boot' ? '🚤 W/S Gas/Rückwärts · A/D lenken · F aussteigen' : (a.T.zweirad ? '🏍 ' : '🚗 ') + a.T.name + ' · W/S Gas/Bremse · A/D lenken · Leertaste Handbremse · F aussteigen', 6);
    }
    function aussteigen(sofort) {
      const a = fahrend, sp = ctx.spieler; if (!a || !sp) return; const mw = a.chassis.getWorldMatrix(), seite = BAB.Vector3.TransformCoordinates(V(-(a.T.B / 2 + 1.1), 0, 0.5), mw);
      if (motor) { try { motor.o1.stop(); motor.o2.stop(); } catch (e) { /* egal */ } motor = null; } if (a.g.fahrer) a.g.fahrer.setEnabled(false);
      sp.cc.setPosition(V(seite.x, Math.max(seite.y, ctx.hoehe(seite.x, seite.z)) + 1.2, seite.z)); sp.cc.setVelocity(V(0, 0, 0)); sp.k.setEnabled(true); sp.gier = kamGier; fahrend = null; ctx.uebernahme = null; tacho && (tacho.hidden = true); a.eingabe = { gas: 0, lenk: 0, bremse: 1, hand: true };
    }
    ctx.tastenHandler.F = ctx.tastenHandler.F || []; ctx.tastenHandler.F.push(() => { if (ctx.vorbei) return; if (fahrend) { if (fahrend.art === 'flugzeug' && !fahrend.amBoden && !fahrend.wrack) { ctx.nachricht('Erst landen!'); return; } if (Math.abs(fahrend.kmh) < 25 || fahrend.wrack) aussteigen(); else ctx.nachricht('Zu schnell zum Aussteigen – erst bremsen'); return; } const a = naechstes(3.8); if (a) einsteigen(a); });
    (ctx.tastenHandler.R = ctx.tastenHandler.R || []).push(() => { if (fahrend && fahrend.kopfueber > 0.5) aufrichten(fahrend); });
    function naechstes(max) { const sp = ctx.spieler; if (!sp) return null; const p = sp.cc.getPosition(); let best = null, d = max; for (const a of autos) { if (a.ki || a.wrack) continue; const dd = BAB.Vector3.Distance(p, a.chassis.getAbsolutePosition()); if (dd < d) { d = dd; best = a; } } return best; }
    function fahrenUpdate(dt) {
      const a = fahrend, t = ctx.tasten, tc = ctx.touch, sp = ctx.spieler; const vor = (t.W || t.ArrowUp ? 1 : 0) + Math.max(0, tc.bewegen[1]), zur = (t.S || t.ArrowDown ? 1 : 0) + Math.max(0, -tc.bewegen[1]);
      if (a.art === 'flugzeug') { a.eingabe.schub = (t.ShiftLeft || t.ShiftRight || tc.sprint ? 1 : 0) - (t.ControlLeft || t.ControlRight || t.C ? 1 : 0); a.eingabe.nick = klemme((t.W || t.ArrowUp ? 1 : 0) - (t.S || t.ArrowDown ? 1 : 0) + tc.bewegen[1], -1, 1); a.eingabe.roll = klemme((t.D || t.ArrowRight ? 1 : 0) - (t.A || t.ArrowLeft ? 1 : 0) + tc.bewegen[0], -1, 1); a.eingabe.bremse = t.Space ? 1 : 0; }
      const vl = a.kmh / 3.6; a.eingabe.lenk = klemme((t.D || t.ArrowRight ? 1 : 0) - (t.A || t.ArrowLeft ? 1 : 0) + tc.bewegen[0], -1, 1); a.eingabe.hand = !!t.Space;
      if (vor) { a.eingabe.gas = vl < -1 ? 0 : 1; a.eingabe.bremse = vl < -1 ? 1 : 0; } else if (zur) { a.eingabe.gas = vl > 1 ? 0 : -1; a.eingabe.bremse = vl > 1 ? 1 : 0; } else { a.eingabe.gas = 0; a.eingabe.bremse = 0; }
      const p = a.chassis.getAbsolutePosition(); sp.cc.setPosition(V(p.x, p.y + 30, p.z)); sp.tempo = Math.abs(vl);   // Spielfigur aus dem Weg (sie würde das Auto sonst blockieren)
      if (a.art === 'boot') { a.eingabe.gas = (vor ? 1 : 0) - (zur ? 1 : 0); a.eingabe.bremse = 0; }
      if (a.wrack) { a.eingabe.gas = 0; a.eingabe.bremse = 1; a.schub = 0; }
      if (tacho) tacho.textContent = (a.wrack ? '🔥 Wrack – F aussteigen' : Math.abs(Math.round(a.kmh)) + ' km/h' + (a.art === 'flugzeug' ? ' · ↑ ' + Math.max(0, Math.round(a.hoehe || 0)) + ' m · Gas ' + Math.round(a.schub * 100) + '%' : '')) + (a.zustand < 100 && !a.wrack ? ' · 🔧 ' + Math.round(a.zustand) + '%' : '');
      if (motor) { const gasNow = a.art === 'flugzeug' ? a.schub : Math.abs(a.eingabe.gas), drehzahl = a.art === 'flugzeug' ? 55 + a.schub * 90 : (a.T.zweirad ? 70 : 38) + (Math.abs(a.kmh) % 45) * 2.4 + gasNow * 18, tt = motor.AC.currentTime; motor.o1.frequency.setTargetAtTime(drehzahl, tt, 0.05); motor.o2.frequency.setTargetAtTime(drehzahl * 0.5, tt, 0.05); motor.g.gain.setTargetAtTime(0.035 + gasNow * 0.04, tt, 0.08); motor.f.frequency.setTargetAtTime(400 + gasNow * 900, tt, 0.1); }
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
      for (const a of autos) if (a.kiZiel && !a.wrack && a !== fahrend) kiFahren(a, dt);
      for (const a of autos) if (a.blau) { const an = Math.floor(ctx.zeit * 5) % 2; a.blau[0].material.emissiveColor.set(0.1, an ? 0.2 : 0.3, an ? 2.5 : 0.2); a.blau[1].material.emissiveColor.set(an ? 0.2 : 2.2, 0.12, 0.12); }
      for (const a of autos) { if (a.wrack && a.art !== 'auto') continue; if (a.art === 'boot') bootPhysik(a, dt); else if (a.art === 'flugzeug') flugPhysik(a, dt); else physik(a, dt); }
      if (!fahrend && ctx.spieler && !ctx.vorbei) { const a = naechstes(3.8); ctx.hinweisText = a ? 'F: Einsteigen (' + a.T.name + ')' : null; }
    }
    return { api: { einsatzwagen, fahrzeugEntfernen: entfernen, motorrad: o => auto(Object.assign({}, o, { typ: 'motorrad' })), boot: o => auto(Object.assign({}, o, { typ: 'boot' })), flugzeug: o => auto(Object.assign({}, o, { typ: 'flugzeug' })), autoSchaden: (a, m) => schaden(a, m, a.chassis.getAbsolutePosition().add(V(0, 0.5, a.T.L * 0.45)), 'Skript'), auto, autos, AUTO_TYPEN: TYPEN, get fahrzeug() { return fahrend; }, einsteigen, aussteigen }, update };
  });
})();
