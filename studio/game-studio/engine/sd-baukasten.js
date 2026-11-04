/* SD Baukasten – Generatoren für die SD Engine und die SD Werkstatt.
   Erzeugt Oberflächen (Farbe + Normal-Map, nahtlos kachelbar), Bäume, Gebäude und Roboter –
   komplett im Browser, ohne fremde Dateien. Alles ist reproduzierbar: gleicher seed = gleiches Ergebnis. */
'use strict';
(function () {
  /* ---------- Zufall und kachelbares Rauschen ---------- */
  function zufall(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  function hash2(x, y, s) { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function rauschenKachel(seed) {   // Wert-Rauschen, das sich bei Periode p wiederholt
    return (x, y, p) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
      const w = (a) => ((a % p) + p) % p; const a = hash2(w(xi), w(yi), seed), b = hash2(w(xi + 1), w(yi), seed), c = hash2(w(xi), w(yi + 1), seed), d = hash2(w(xi + 1), w(yi + 1), seed);
      return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; };
  }
  function fbm(ns, x, y, p, okt) { let s = 0, a = 0.5, f = 1, n = 0; for (let i = 0; i < (okt || 4); i++) { s += ns(x * f, y * f, p * f) * a; n += a; a *= 0.5; f *= 2; } return s / n; }

  /* ---------- Oberflächen (PBR): Farbe, Höhe -> Normal-Map ---------- */
  const OBERFLAECHEN = {
    ziegel: { groesse: 2.0, rau: 0.9, staerke: 3.2 }, putz: { groesse: 3, rau: 0.95, staerke: 1.2 }, beton: { groesse: 3, rau: 0.92, staerke: 1.6 },
    holz: { groesse: 2, rau: 0.8, staerke: 1.5 }, metall: { groesse: 2, rau: 0.45, metall: 0.85, staerke: 2.2 }, dachziegel: { groesse: 2.5, rau: 0.85, staerke: 3.5 },
    rinde: { groesse: 1.2, rau: 0.95, staerke: 3.5 }, asphalt: { groesse: 4, rau: 0.9, staerke: 1.2 }, platten: { groesse: 3, rau: 0.85, staerke: 2.5 }, gras: { groesse: 4, rau: 0.95, staerke: 1.4 },
  };
  function pixelOberflaeche(art, n, seed) {
    const ns = rauschenKachel(seed || 11), farbe = new Uint8ClampedArray(n * n * 4), hoehe = new Float32Array(n * n);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const u = x / n, v = y / n; let r = 200, g = 200, b = 200, h = 0.5;
      const N = (f, o) => fbm(ns, u * f, v * f, f, o || 4);
      if (art === 'ziegel') {
        const reihen = 8, zeile = Math.floor(v * reihen), versatz = (zeile % 2) * 0.5, spalten = 4, sp = Math.floor(u * spalten + versatz) % spalten;
        const fu = (u * spalten + versatz) % 1, fv = (v * reihen) % 1, fuge = Math.min(fu, 1 - fu) * 4 < 0.06 || Math.min(fv, 1 - fv) * 2 < 0.07;
        const j = hash2(sp, zeile, seed) * 0.35 - 0.15, k = N(32, 3);
        if (fuge) { r = g = b = 175 + k * 30; h = 0.15; } else { r = 165 + j * 120 + k * 35; g = 82 + j * 50 + k * 22; b = 60 + j * 35 + k * 15; const rand = Math.min(Math.min(fu, 1 - fu) * 4, Math.min(fv, 1 - fv) * 2); h = 0.65 + Math.min(rand * 5, 0.3) + k * 0.15; }
      } else if (art === 'putz') { const k = N(16, 5), f2 = N(64, 2); r = g = b = 200 + (k - 0.5) * 50 + (f2 - 0.5) * 25; h = k * 0.6 + f2 * 0.4; }
      else if (art === 'beton') { const k = N(8, 5), p = N(128, 1); const fuge = Math.min(v % 0.5, 0.5 - v % 0.5) < 0.006 || Math.min(u % 1, 1 - u % 1) < 0.004; r = g = b = 150 + (k - 0.5) * 60 - (p > 0.82 ? 50 : 0) - (fuge ? 40 : 0); h = k * 0.7 - (p > 0.82 ? 0.3 : 0) - (fuge ? 0.4 : 0); }
      else if (art === 'holz') { const brett = Math.floor(u * 5), fb = (u * 5) % 1, mas = Math.sin((v * 6 + N(4, 3) * 3 + brett * 1.7) * Math.PI * 4) * 0.5 + 0.5, fuge = fb < 0.03 || fb > 0.97;
        const j = hash2(brett, 3, seed) * 0.3; r = 135 + mas * 40 - j * 60; g = 95 + mas * 28 - j * 40; b = 60 + mas * 18 - j * 25; if (fuge) { r *= 0.5; g *= 0.5; b *= 0.5; } h = fuge ? 0.1 : 0.55 + mas * 0.2; }
      else if (art === 'metall') { const pu = (u * 2) % 1, pv = (v * 2) % 1, naht = Math.min(pu, 1 - pu) < 0.012 || Math.min(pv, 1 - pv) < 0.012, niete = [[0.06, 0.06], [0.94, 0.06], [0.06, 0.94], [0.94, 0.94]].some(([a, c]) => Math.hypot(pu - a, pv - c) < 0.018);
        const k = N(24, 4), krat = N(96, 2); r = g = b = 170 + (k - 0.5) * 40 + (krat > 0.75 ? 25 : 0); if (naht) { r = g = b = 90; } h = naht ? 0.1 : niete ? 0.95 : 0.55 + (k - 0.5) * 0.1; }
      else if (art === 'dachziegel') { const reihen = 10, zl = Math.floor(v * reihen), fv = (v * reihen) % 1, sp = Math.floor(u * 8 + (zl % 2) * 0.5), fu = (u * 8 + (zl % 2) * 0.5) % 1, j = hash2(sp, zl, seed) * 0.25, k = N(32, 3);
        r = 150 + j * 80 + k * 30 - fv * 40; g = 70 + j * 30 + k * 15 - fv * 20; b = 55 + j * 20 + k * 10 - fv * 15; h = 1 - fv * 0.7 - (Math.min(fu, 1 - fu) < 0.03 ? 0.3 : 0); }
      else if (art === 'rinde') { const k = fbm(ns, u * 6, v * 1.5, 6, 5), rille = Math.abs(Math.sin((u * 12 + k * 3) * Math.PI)); r = 95 + rille * 35 + k * 20; g = 75 + rille * 25 + k * 15; b = 55 + rille * 18 + k * 10; h = rille * 0.8 + k * 0.2; }
      else if (art === 'asphalt') { const k = N(64, 3), s = N(256, 1); r = g = b = 70 + k * 25 + (s > 0.8 ? 30 : 0); h = k * 0.5 + (s > 0.8 ? 0.4 : 0); }
      else if (art === 'platten') { const fu = (u * 4) % 1, fv = (v * 4) % 1, fuge = Math.min(fu, 1 - fu) < 0.025 || Math.min(fv, 1 - fv) < 0.025, j = hash2(Math.floor(u * 4), Math.floor(v * 4), seed) * 0.2, k = N(16, 4); r = g = b = 175 - j * 60 + (k - 0.5) * 30 - (fuge ? 60 : 0); h = fuge ? 0.1 : 0.6 + k * 0.2; }
      else if (art === 'gras') { const k = N(8, 5), hal = N(128, 1); r = 85 + k * 40 + hal * 20; g = 120 + k * 45 + hal * 25; b = 50 + k * 20; h = hal; }
      const i = y * n + x; hoehe[i] = h; farbe[i * 4] = r; farbe[i * 4 + 1] = g; farbe[i * 4 + 2] = b; farbe[i * 4 + 3] = 255;
    }
    return { farbe, hoehe };
  }
  function normalAusHoehe(hoehe, n, staerke) {
    const d = new Uint8ClampedArray(n * n * 4), H = (x, y) => hoehe[((y + n) % n) * n + ((x + n) % n)];
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const dx = (H(x - 1, y) - H(x + 1, y)) * staerke, dy = (H(x, y - 1) - H(x, y + 1)) * staerke, l = Math.hypot(dx, dy, 1), i = (y * n + x) * 4;
      d[i] = (dx / l * 0.5 + 0.5) * 255; d[i + 1] = (dy / l * 0.5 + 0.5) * 255; d[i + 2] = (1 / l * 0.5 + 0.5) * 255; d[i + 3] = 255; }
    return d;
  }

  /* ---------- Blatt-Texturen (mit Transparenz) ---------- */
  function blattBild(art, n, seed) {
    const c = document.createElement('canvas'); c.width = c.height = n; const x = c.getContext('2d'), r = zufall(seed || 3);
    if (art === 'nadel') {
      for (let i = 0; i < 90; i++) { const t = i / 90, px = n * 0.5, py = n * (0.05 + t * 0.9), len = n * 0.42 * (1 - Math.abs(t - 0.45) * 1.1);
        for (const s of [-1, 1]) { x.strokeStyle = `rgba(${40 + r() * 30},${80 + r() * 40},${40 + r() * 20},1)`; x.lineWidth = 2; x.beginPath(); x.moveTo(px, py); x.lineTo(px + s * len, py + len * 0.35); x.stroke(); } }
      x.strokeStyle = '#4a3a28'; x.lineWidth = 4; x.beginPath(); x.moveTo(n / 2, n * 0.03); x.lineTo(n / 2, n * 0.97); x.stroke();
    } else if (art === 'palme') {
      x.strokeStyle = '#5c6e2e'; x.lineWidth = 5; x.beginPath(); x.moveTo(n / 2, 0); x.lineTo(n / 2, n); x.stroke();
      for (let i = 0; i < 40; i++) { const py = n * (i / 40), len = n * 0.46 * Math.sin(Math.PI * (0.1 + 0.9 * i / 40)); for (const s of [-1, 1]) { x.fillStyle = `rgb(${60 + r() * 30},${110 + r() * 35},${40 + r() * 20})`; x.beginPath(); x.moveTo(n / 2, py); x.lineTo(n / 2 + s * len, py + n * 0.06); x.lineTo(n / 2 + s * len * 0.9, py + n * 0.075); x.lineTo(n / 2, py + n * 0.025); x.fill(); } }
    } else {
      for (let i = 0; i < 70; i++) { const px = n * (0.12 + r() * 0.76), py = n * (0.12 + r() * 0.76), d = Math.hypot(px - n / 2, py - n / 2) / (n / 2); if (d > 0.95) continue; const s = n * (0.05 + r() * 0.05);
        x.save(); x.translate(px, py); x.rotate(r() * 6.3); const g = 90 + r() * 70, rr = art === 'herbst' ? 170 + r() * 60 : 40 + r() * 40; x.fillStyle = `rgb(${rr},${art === 'herbst' ? 90 + r() * 50 : g},${30 + r() * 25})`;
        x.beginPath(); x.ellipse(0, 0, s, s * 0.45, 0, 0, 7); x.fill(); x.strokeStyle = 'rgba(0,0,0,.25)'; x.lineWidth = 1; x.beginPath(); x.moveTo(-s, 0); x.lineTo(s, 0); x.stroke(); x.restore(); }
    }
    return c;
  }

  /* =================================================================== */
  function erstellen(BAB, szene) {
    const V = (x, y, z) => new BAB.Vector3(x, y, z), F = h => BAB.Color3.FromHexString(h);
    const texCache = {}, matCache = {};
    const AUFL = 512;
    function oberflaeche(art) {
      if (texCache[art]) return texCache[art]; const n = AUFL, d = OBERFLAECHEN[art] || OBERFLAECHEN.putz, px = pixelOberflaeche(art, n, 7);
      const albedo = BAB.RawTexture.CreateRGBATexture(px.farbe, n, n, szene, true, false, BAB.Texture.TRILINEAR_SAMPLINGMODE);
      const normal = BAB.RawTexture.CreateRGBATexture(normalAusHoehe(px.hoehe, n, d.staerke), n, n, szene, true, false, BAB.Texture.TRILINEAR_SAMPLINGMODE);
      for (const t of [albedo, normal]) { t.wrapU = t.wrapV = BAB.Texture.WRAP_ADDRESSMODE; t.anisotropicFilteringLevel = 8; }
      return (texCache[art] = { albedo, normal, d });
    }
    /** PBR-Material mit Oberfläche, eingefärbt */
    function material(art, farbe, extra) {
      extra = extra || {}; const key = art + '|' + farbe + '|' + JSON.stringify(extra); if (matCache[key]) return matCache[key];
      const m = new BAB.PBRMaterial('bk_' + art, szene), o = OBERFLAECHEN[art] || (texCache[art] && texCache[art].d);
      if (o) { const t = oberflaeche(art); m.albedoTexture = t.albedo; m.bumpTexture = t.normal; m.bumpTexture.level = 1; m.roughness = extra.rau ?? o.rau; m.metallic = extra.metall ?? (o.metall || 0); }
      else { m.roughness = extra.rau ?? 0.6; m.metallic = extra.metall ?? 0; }
      m.albedoColor = farbe ? F(farbe) : new BAB.Color3(1, 1, 1);
      if (extra.leuchten) { m.emissiveColor = F(extra.leuchten); m.emissiveIntensity = extra.leuchtStaerke || 1.5; }
      if (extra.glas) { m.albedoColor = F(farbe || '#1a2630'); m.metallic = 0.95; m.roughness = 0.06; m.environmentIntensity = 1.4; }
      return (matCache[key] = m);
    }
    function blattMaterial(art, farbe) {
      const key = 'blatt|' + art + '|' + farbe; if (matCache[key]) return matCache[key];
      const c = blattBild(art, 256, 5), t = new BAB.DynamicTexture('blattTex', c, szene, true); t.update(); t.hasAlpha = true;
      const m = new BAB.PBRMaterial('blatt_' + art, szene); m.albedoTexture = t; m.useAlphaFromAlbedoTexture = true; m.transparencyMode = BAB.PBRMaterial.PBRMATERIAL_ALPHATEST; m.alphaCutOff = 0.4;
      m.backFaceCulling = false; m.twoSidedLighting = true; m.roughness = 0.75; m.metallic = 0; m.albedoColor = (farbe ? F(farbe) : new BAB.Color3(1, 1, 1)).scale(1.35);
      return (matCache[key] = m);
    }
    /** Würfel-Projektion: Oberflächen-Muster in echter Größe (Meter), egal wie groß das Objekt ist */
    function weltUV(mesh, kachel) {
      const p = mesh.getVerticesData('position'), n = mesh.getVerticesData('normal'), uv = []; const k = kachel || 2;
      for (let i = 0; i < p.length; i += 3) { const ax = Math.abs(n[i]), ay = Math.abs(n[i + 1]), az = Math.abs(n[i + 2]);
        if (ay >= ax && ay >= az) uv.push(p[i] / k, p[i + 2] / k); else if (ax >= az) uv.push(p[i + 2] / k, p[i + 1] / k); else uv.push(p[i] / k, p[i + 1] / k); }
      mesh.setVerticesData('uv', uv);
    }
    function backen(m) { m.bakeCurrentTransformIntoVertices(); return m; }
    /** Teile zusammenfassen – pro Material nur EIN Zeichenaufruf (wichtig für die Geschwindigkeit) */
    function zusammen(teile, name) {
      teile = teile.filter(Boolean); if (!teile.length) return null; const gruppen = new Map();
      for (const t of teile) { const k = t.material ? t.material.uniqueId : -1; if (!gruppen.has(k)) gruppen.set(k, []); gruppen.get(k).push(t); }
      const je = [...gruppen.values()].map(g => (g.length > 1 ? BAB.Mesh.MergeMeshes(g, true, true) : g[0]));
      const m = je.length > 1 ? BAB.Mesh.MergeMeshes(je, true, true, undefined, false, true) : je[0]; if (m) m.name = name; return m;
    }
    function ausrichten(mesh, von, richtung) { // Zylinder (Achse y) von Punkt "von" in "richtung" legen
      const r = richtung.clone().normalize(), ax = BAB.Vector3.Cross(V(0, 1, 0), r), w = Math.acos(Math.max(-1, Math.min(1, BAB.Vector3.Dot(V(0, 1, 0), r))));
      mesh.rotationQuaternion = ax.length() > 1e-6 ? BAB.Quaternion.RotationAxis(ax.normalize(), w) : (r.y < 0 ? BAB.Quaternion.RotationAxis(V(1, 0, 0), Math.PI) : BAB.Quaternion.Identity());
      mesh.position = von.add(r.scale(mesh.__laenge / 2));
    }

    /* =============== 🌳 BÄUME =============== */
    /**
     * baum({ art:'laub'|'nadel'|'palme'|'busch'|'herbst', hoehe, aeste, tiefe, dichte, blattFarbe, rindeFarbe, seed })
     * Gibt { mesh, stammRadius, hoehe } zurück. mesh hat Detailstufen (LOD) für große Wälder.
     */
    function baum(o) {
      o = Object.assign({ art: 'laub', hoehe: 9, aeste: 3, tiefe: 3, dichte: 1, seed: 1 }, o || {}); const r = zufall(o.seed * 7919 + 13), H = o.hoehe;
      const holz = [], blaetter = [], rinde = material('rinde', o.rindeFarbe || (o.art === 'palme' ? '#b59a7a' : '#8a7560')), blattArt = o.art === 'nadel' ? 'nadel' : o.art === 'palme' ? 'palme' : o.art === 'herbst' ? 'herbst' : 'laub';
      const bm = blattMaterial(blattArt, o.blattFarbe);
      const ast = (von, dir, laenge, radius) => { const m = BAB.MeshBuilder.CreateCylinder('ast', { height: laenge, diameterBottom: radius * 2, diameterTop: radius * 1.25, tessellation: radius > 0.15 ? 9 : 6 }, szene); m.__laenge = laenge; ausrichten(m, von, dir); holz.push(backen(m)); return von.add(dir.normalize().scale(laenge)); };
      const blatt = (pos, groesse, dreh) => { for (let i = 0; i < 4; i++) { const q = BAB.MeshBuilder.CreatePlane('blatt', { size: groesse, sideOrientation: BAB.Mesh.DOUBLESIDE }, szene); q.position = pos.add(V((r() - 0.5) * groesse * 0.4, (r() - 0.5) * groesse * 0.3, (r() - 0.5) * groesse * 0.4)); q.rotation = V(i === 3 ? Math.PI / 2 : (r() - 0.5) * 0.8, (dreh || 0) + i * 1.05 + r() * 0.4, (r() - 0.5) * 0.8); blaetter.push(backen(q)); } };
      let stammR = Math.max(0.12, H * 0.028);
      if (o.art === 'laub' || o.art === 'herbst') {
        const spitze = ast(V(0, -0.2, 0), V((r() - 0.5) * 0.1, 1, (r() - 0.5) * 0.1), H * 0.34, stammR);
        const wachse = (von, dir, laenge, radius, stufe) => { const ende = ast(von, dir, laenge, radius);
          if (stufe >= o.tiefe) { blatt(ende, (2.4 + r() * 1.0) * (H / 9) * o.dichte); blatt(von.add(ende).scale(0.5), 1.8 * (H / 9) * o.dichte); if (r() < 0.5) blatt(ende.add(V((r() - 0.5) * 1.2, 0.5, (r() - 0.5) * 1.2).scale(H / 9)), 2 * (H / 9) * o.dichte); return; }
          if (stufe >= o.tiefe - 1 && r() < 0.6) blatt(ende, 1.8 * (H / 9) * o.dichte);
          const n = o.aeste + (r() < 0.4 ? 1 : 0); for (let i = 0; i < n; i++) { const az = (i / n) * Math.PI * 2 + r() * 0.8, neig = 0.7 + r() * 0.45;
            const nd = dir.normalize().scale(Math.cos(neig)).add(V(Math.cos(az), 0.25, Math.sin(az)).normalize().scale(Math.sin(neig))).normalize(); wachse(i === 0 ? ende : von.add(ende.subtract(von).scale(0.55 + r() * 0.4)), nd, laenge * (0.68 + r() * 0.12), radius * 0.62, stufe + 1); } };
        wachse(spitze, V(0, 1, 0), H * 0.26, stammR * 0.75, 1);
      } else if (o.art === 'nadel') {
        stammR *= 0.8; ast(V(0, -0.2, 0), V(0, 1, 0), H, stammR); const kraenze = Math.round(7 * o.dichte + 3);
        for (let k = 0; k < kraenze; k++) { const t = k / kraenze, y = H * (0.22 + t * 0.76), len = H * 0.36 * (1 - t) + 0.5, zahl = 7 - Math.floor(t * 3);
          for (let i = 0; i < zahl; i++) { const az = (i / zahl) * Math.PI * 2 + k * 0.7 + r() * 0.3; const q = BAB.MeshBuilder.CreatePlane('nadel', { width: len * 0.9, height: len, sideOrientation: BAB.Mesh.DOUBLESIDE }, szene);
            q.rotation = V(Math.PI / 2 + 0.35 + r() * 0.2, 0, 0); q.position = V(0, 0, len / 2); q.bakeCurrentTransformIntoVertices(); q.rotation = V(0, az, 0); q.position = V(0, y, 0); blaetter.push(backen(q)); } }
      } else if (o.art === 'palme') {
        let p = V(0, -0.2, 0), d = V(0.12 + r() * 0.1, 1, 0).normalize(); const segs = 7;
        for (let i = 0; i < segs; i++) { p = ast(p, d, H / segs, stammR * (1 - i / segs * 0.35)); d = d.add(V(0.05, 0, 0.02)).normalize(); }
        const zahl = Math.round(10 * o.dichte); for (let i = 0; i < zahl; i++) { const az = (i / zahl) * Math.PI * 2 + r() * 0.3, L = H * 0.5, segs = 3; let pz = 0, py = 0;
          for (let sg = 0; sg < segs; sg++) { const a = -0.25 + sg * 0.45 + r() * 0.15, h = L / segs, q = BAB.MeshBuilder.CreatePlane('wedel', { width: L * 0.42 * (1 - sg * 0.18), height: h * 1.08, sideOrientation: BAB.Mesh.DOUBLESIDE }, szene);
            q.rotation = V(Math.PI / 2 + a, 0, 0); q.position = V(0, py - Math.sin(a) * h / 2, pz + Math.cos(a) * h / 2); q.bakeCurrentTransformIntoVertices(); pz += Math.cos(a) * h; py -= Math.sin(a) * h;
            q.rotation = V(0, az, 0); q.position = p.clone(); blaetter.push(backen(q)); } }
      } else { // busch
        const n = Math.round(10 * o.dichte); for (let i = 0; i < n; i++) blatt(V((r() - 0.5) * H * 0.5, H * (0.3 + r() * 0.5), (r() - 0.5) * H * 0.5), H * 0.55);
        stammR = 0;
      }
      const h = zusammen(holz, 'holz'); if (h) { weltUV(h, 1.2); h.material = rinde; }
      const b = zusammen(blaetter, 'laub'); if (b) b.material = bm;
      const mesh = zusammen([h, b], 'baum');
      // Detailstufen: weit weg nur noch eine einfache Form, ganz weit weg gar nichts
      const fern = o.art === 'nadel' ? BAB.MeshBuilder.CreateCylinder('fern', { height: H, diameterTop: 0, diameterBottom: H * 0.6, tessellation: 6 }, szene) : BAB.MeshBuilder.CreateSphere('fern', { diameter: H * 0.65, segments: 4 }, szene);
      fern.position.y = o.art === 'nadel' ? H * 0.55 : H * 0.72; backen(fern); const fm = new BAB.PBRMaterial('fern', szene); fm.albedoColor = o.blattFarbe ? F(o.blattFarbe).scale(0.55) : (o.art === 'herbst' ? F('#8a5a28') : F('#3d5a2a')); fm.roughness = 0.95; fm.metallic = 0; fern.material = fm;
      mesh.addLODLevel(o.lodNah || 110, fern); mesh.addLODLevel(o.lodFern || 450, null);
      return { mesh, fern, stammRadius: stammR, hoehe: H };
    }

    /* =============== 🏢 GEBÄUDE =============== */
    /**
     * gebaeude({ breite, tiefe, stockwerke, material:'putz'|'ziegel'|'beton'|'holz', farbe, dach:'flach'|'sattel',
     *            balkone, fensterAbstand, dachTreppe, seed })
     * Gibt { mesh, kollision:[{p:[x,y,z], g:[b,h,t], rx}] } zurück (Koordinaten relativ zum Gebäude, Boden = 0).
     */
    function gebaeude(o) {
      o = Object.assign({ breite: 10, tiefe: 8, stockwerke: 2, material: 'putz', farbe: '#e8dccb', dach: 'flach', balkone: false, fensterAbstand: 2.6, dachTreppe: false, seed: 1 }, o || {});
      const r = zufall(o.seed * 31 + 7), B = o.breite, T = o.tiefe, HS = 3.1, st = Math.max(1, Math.round(o.stockwerke)), H = HS * st, d = 0.3;
      const teile = [], koll = [], wand = material(o.material, o.farbe), sockel = material('beton', '#9a9590'), rahmen = material(null, o.rahmenFarbe || '#f2f0ea', { rau: 0.5 }), glas = material(null, '#1b2833', { glas: true }), dunkel = material('metall', '#4a4d52');
      const kiste = (px, py, pz, w, h, t, mat, kachel, fest, rx) => { const m = BAB.MeshBuilder.CreateBox('teil', { width: w, height: h, depth: t }, szene); m.position = V(px, py, pz); if (rx) m.rotation.x = rx; backen(m); weltUV(m, kachel || 2); m.material = mat; teile.push(m); if (fest) koll.push({ p: [px, py, pz], g: [w, h, t], rx: rx || 0 }); return m; };
      kiste(0, 0.15, 0, B + 0.5, 0.6, T + 0.5, sockel, 3, true);                                           // Sockel
      const tuer = 1.7, th = 2.5;
      for (let s = 0; s < st; s++) {
        const yb = 0.45 + s * HS, ym = yb + HS / 2;
        // Wände (vorne unten mit echter Türöffnung)
        if (s === 0) { const sw = (B - tuer) / 2; kiste(-(tuer / 2 + sw / 2), ym, -T / 2, sw, HS, d, wand, 2, true); kiste(tuer / 2 + sw / 2, ym, -T / 2, sw, HS, d, wand, 2, true); kiste(0, yb + th + (HS - th) / 2, -T / 2, tuer, HS - th, d, wand, 2, true);
          for (const sx of [-1, 1]) kiste(sx * (tuer / 2 + 0.06), yb + th / 2, -T / 2 - 0.08, 0.12, th, 0.12, rahmen, 1); kiste(0, yb + th + 0.06, -T / 2 - 0.08, tuer + 0.24, 0.12, 0.12, rahmen, 1);
          kiste(0, 0.5, -T / 2 - 0.9, tuer + 1.2, 0.2, 1.2, sockel, 2, true); }                      // Stufe vor der Tür
        else kiste(0, ym, -T / 2, B, HS, d, wand, 2, true);
        kiste(0, ym, T / 2, B, HS, d, wand, 2, true); kiste(-B / 2, ym, 0, d, HS, T, wand, 2, true); kiste(B / 2, ym, 0, d, HS, T, wand, 2, true);
        kiste(0, yb - 0.05, 0, B - d, 0.25, T - d, material('platten', '#c9c2b8'), 2, true);              // Boden innen
        kiste(0, yb + HS - 0.02, 0, B + 0.12, 0.16, T + 0.12, sockel, 2);                                  // Gesims zwischen den Stockwerken
        // Fenster: Rahmen, Glas, Fensterbank (vorne/hinten/seitlich)
        const fenster = (cx, cz, nx, nz) => { const fw = 1.15, fh = 1.35, fy = yb + 1.75, quer = Math.abs(nx) > 0; const w = (a, b, c, x_, y_, z_) => quer ? kiste(cx + x_ * nx, y_, cz + z_, c, b, a, rahmen, 1) : kiste(cx + z_, y_, cz + x_ * nz, a, b, c, rahmen, 1);
          const g = BAB.MeshBuilder.CreatePlane('glas', { width: fw, height: fh, sideOrientation: BAB.Mesh.DOUBLESIDE }, szene); g.position = V(cx + nx * (d / 2 + 0.01), fy, cz + nz * (d / 2 + 0.01)); g.rotation.y = Math.atan2(-nx, -nz); backen(g); g.material = glas; teile.push(g);
          const off = d / 2 + 0.05; w(fw + 0.2, 0.1, 0.1, off, fy + fh / 2 + 0.05, 0); w(fw + 0.3, 0.08, 0.3, off + 0.08, fy - fh / 2 - 0.04, 0); w(0.1, fh, 0.1, off, fy, -fw / 2 - 0.05); w(0.1, fh, 0.1, off, fy, fw / 2 + 0.05); w(0.06, fh, 0.06, off, fy, 0); };
        const nx_ = Math.max(1, Math.floor((B - 1) / o.fensterAbstand)), nz_ = Math.max(1, Math.floor((T - 1) / o.fensterAbstand));
        for (let i = 0; i < nx_; i++) { const x = -B / 2 + (i + 0.5) * (B / nx_); if (!(s === 0 && Math.abs(x) < tuer)) fenster(x, -T / 2, 0, -1); fenster(x, T / 2, 0, 1); }
        for (let i = 0; i < nz_; i++) { const z = -T / 2 + (i + 0.5) * (T / nz_); fenster(-B / 2, z, -1, 0); fenster(B / 2, z, 1, 0); }
        if (o.balkone && s > 0) { const bw = Math.min(3.2, B * 0.35); kiste(0, yb - 0.05, -T / 2 - 0.75, bw, 0.18, 1.3, sockel, 2, true); for (const sx of [-1, 1]) kiste(sx * bw / 2, yb + 0.55, -T / 2 - 0.75, 0.05, 1.0, 1.3, dunkel, 1); kiste(0, yb + 1.05, -T / 2 - 1.38, bw, 0.06, 0.06, dunkel, 1); for (let i = 0; i <= 8; i++) kiste(-bw / 2 + i * bw / 8, yb + 0.55, -T / 2 - 1.38, 0.03, 1, 0.03, dunkel, 1); }
      }
      const ob = 0.45 + H;
      if (o.dach === 'sattel') {
        const hr = Math.min(T * 0.45, 3.2), ue = 0.45, bx = B / 2 + ue, tz = T / 2 + ue;
        const pos = [-bx, 0, -tz, bx, 0, -tz, bx, hr, 0, -bx, hr, 0, -bx, 0, tz, bx, 0, tz], idx = [0, 2, 1, 0, 3, 2, 4, 5, 2, 4, 2, 3, 0, 1, 2, 0, 2, 3, 4, 2, 5, 4, 3, 2];
        const dm = new BAB.Mesh('dach', szene), vd = new BAB.VertexData(); vd.positions = pos; vd.indices = idx; const nrm = []; BAB.VertexData.ComputeNormals(pos, idx, nrm); vd.normals = nrm; vd.applyToMesh(dm); dm.position.y = ob; backen(dm); dm.convertToFlatShadedMesh();
        const p2 = dm.getVerticesData('position'), uv = []; for (let i = 0; i < p2.length; i += 3) uv.push(p2[i] / 2.5, (Math.abs(p2[i + 2]) + (p2[i + 1] - ob)) / 2.5); dm.setVerticesData('uv', uv); dm.material = material('dachziegel', o.dachFarbe || '#b8b0a8'); teile.push(dm);
        const giebel = new BAB.Mesh('giebel', szene), gv = new BAB.VertexData(); const gp = [-B / 2, 0, -T / 2, -B / 2, hr * 0.95, 0, -B / 2, 0, T / 2, B / 2, 0, -T / 2, B / 2, hr * 0.95, 0, B / 2, 0, T / 2]; gv.positions = gp; gv.indices = [0, 1, 2, 2, 1, 0, 3, 4, 5, 5, 4, 3]; const gn = []; BAB.VertexData.ComputeNormals(gp, gv.indices, gn); gv.normals = gn; gv.applyToMesh(giebel); giebel.position.y = ob; backen(giebel); giebel.convertToFlatShadedMesh(); weltUV(giebel, 2); giebel.material = wand; teile.push(giebel);
        koll.push({ p: [0, ob - 0.1, 0], g: [B, 0.2, T], rx: 0 });
        if (r() < 0.7) kiste(B * 0.25, ob + hr * 0.7, T * 0.15, 0.6, 1.6, 0.6, material('ziegel', '#a05a44'), 1.5);   // Schornstein
      } else {
        kiste(0, ob + 0.1, 0, B + 0.15, 0.3, T + 0.15, sockel, 3, true);
        for (const [px, pz, w, t] of [[0, -T / 2, B + 0.15, 0.25], [0, T / 2, B + 0.15, 0.25], [-B / 2, 0, 0.25, T], [B / 2, 0, 0.25, T]]) kiste(px, ob + 0.65, pz, w, 0.8, t, wand, 2, true);
        const n = 1 + Math.floor(r() * 3); for (let i = 0; i < n; i++) { const ax = (r() - 0.5) * (B - 3), az = (r() - 0.5) * (T - 3); kiste(ax, ob + 0.75, az, 1.2, 0.9, 0.9, dunkel, 1, true); kiste(ax, ob + 1.22, az, 0.9, 0.04, 0.6, material(null, '#2a2d31', { rau: 0.3, metall: 0.8 }), 1); }
      }
      if (o.dachTreppe && o.dach !== 'sattel') { const hoch = ob + 0.25, lang = T * 1.25, w = Math.atan2(hoch, lang), L = Math.hypot(hoch, lang), sx = B / 2 + 1.1;
        koll.push({ p: [sx, hoch / 2, 0], g: [1.6, 0.25, L], rx: w });
        const stufen = Math.ceil(hoch / 0.25); for (let i = 0; i < stufen; i++) { const t = (i + 0.5) / stufen; kiste(sx, t * hoch - 0.08, -lang / 2 + t * lang, 1.6, 0.18, lang / stufen + 0.05, sockel, 2); }
        for (const sx2 of [sx - 0.85, sx + 0.85]) kiste(sx2, hoch / 2 + 0.6, 0, 0.05, 0.05, L, dunkel, 1, false, w); }
      const mesh = zusammen(teile, 'gebaeude'); return { mesh, kollision: koll, hoehe: ob };
    }

    /* =============== 🤖 ROBOTER =============== */
    /**
     * roboter({ stil:'kampf'|'schwer'|'spaeher', farbe, akzent, augen, groesse, seed })
     * Gibt einen Knoten mit Gelenken zurück (Hüfte, Knie, Schulter, Ellbogen) und animiere(tempo, dt, inLuft).
     * Füße stehen auf y = 0, Blickrichtung +z.
     */
    function roboter(o) {
      o = Object.assign({ stil: 'kampf', farbe: '#d9dde2', akzent: '#2b2f36', augen: '#ff3b30', groesse: 1, seed: 1 }, o || {});
      const s = o.groesse * (o.stil === 'schwer' ? 1.08 : o.stil === 'spaeher' ? 0.95 : 1), breit = o.stil === 'schwer' ? 1.3 : o.stil === 'spaeher' ? 0.85 : 1;
      const panzer = material('metall', o.farbe, { rau: 0.42, metall: 0.25 }), gelenk = material('metall', o.akzent, { rau: 0.5, metall: 0.7 }), leucht = material(null, '#111111', { leuchten: o.augen, leuchtStaerke: 3 }), schwarz = material(null, '#16181c', { rau: 0.35, metall: 0.6 });
      const k = new BAB.TransformNode('roboter', szene), teile = {};
      const knoten = (name, eltern, x, y, z) => { const n = new BAB.TransformNode(name, szene); n.parent = eltern; n.position = V(x * s, y * s, z * s); teile[name] = n; return n; };
      const box = (eltern, w, h, t, x, y, z, mat, kopf) => { const m = BAB.MeshBuilder.CreateBox('rb', { width: w * s, height: h * s, depth: t * s }, szene); m.parent = eltern; m.position = V(x * s, y * s, z * s); m.material = mat; m.__kopf = !!kopf; return m; };
      const kugel = (eltern, d, x, y, z, mat) => { const m = BAB.MeshBuilder.CreateSphere('rk', { diameter: d * s, segments: 10 }, szene); m.parent = eltern; m.position = V(x * s, y * s, z * s); m.material = mat; return m; };
      const zyl = (eltern, d1, d2, h, x, y, z, mat) => { const m = BAB.MeshBuilder.CreateCylinder('rz', { diameterTop: d1 * s, diameterBottom: d2 * s, height: h * s, tessellation: 10 }, szene); m.parent = eltern; m.position = V(x * s, y * s, z * s); m.material = mat; return m; };
      const becken = knoten('becken', k, 0, 0.98, 0);
      box(becken, 0.36 * breit, 0.18, 0.24, 0, 0, 0, gelenk); box(becken, 0.3 * breit, 0.12, 0.26, 0, -0.08, 0.01, panzer);
      const rumpf = knoten('rumpf', becken, 0, 0.12, 0);
      zyl(rumpf, 0.16, 0.2, 0.16, 0, 0.08, 0, gelenk);                                                  // Bauch-Gelenk
      box(rumpf, 0.5 * breit, 0.42, 0.3, 0, 0.38, 0, panzer); box(rumpf, 0.42 * breit, 0.28, 0.08, 0, 0.42, 0.17, panzer);   // Brust + Brustplatte
      box(rumpf, 0.2, 0.06, 0.02, 0, 0.47, 0.215, leucht);                                               // Leuchtstreifen
      box(rumpf, 0.34 * breit, 0.36, 0.16, 0, 0.38, -0.21, gelenk); for (const sx of [-1, 1]) zyl(rumpf, 0.06, 0.06, 0.3, sx * 0.1, 0.4, -0.3, schwarz);  // Rucksack mit Rohren
      const hals = knoten('hals', rumpf, 0, 0.62, 0); zyl(hals, 0.1, 0.12, 0.1, 0, 0.02, 0, gelenk);
      const kopf = knoten('kopfK', hals, 0, 0.16, 0);
      box(kopf, 0.24, 0.2, 0.26, 0, 0, 0, panzer, true); box(kopf, 0.26, 0.06, 0.06, 0, 0.02, 0.12, schwarz, true); box(kopf, 0.2, 0.025, 0.02, 0, 0.02, 0.153, leucht, true);
      if (o.stil !== 'schwer') { zyl(kopf, 0.012, 0.02, 0.22, 0.09, 0.18, -0.05, gelenk).__kopf = true; kugel(kopf, 0.035, 0.09, 0.3, -0.05, leucht).__kopf = true; }
      for (const sx of [-1, 1]) {
        // Arm: Schulter -> Ellbogen -> Hand
        const sch = knoten(sx > 0 ? 'arm1' : 'arm-1', rumpf, sx * 0.33 * breit, 0.52, 0); kugel(sch, 0.15, 0, 0, 0, gelenk);
        box(sch, 0.2 * breit, 0.14, 0.24, sx * 0.03, 0.06, 0, panzer);                                    // Schulterpanzer
        box(sch, 0.1, 0.28, 0.11, 0, -0.18, 0, panzer); const ell = knoten('ellbogen' + sx, sch, 0, -0.33, 0); kugel(ell, 0.1, 0, 0, 0, gelenk);
        box(ell, 0.11 * (o.stil === 'schwer' ? 1.4 : 1), 0.26, 0.12 * (o.stil === 'schwer' ? 1.4 : 1), 0, -0.15, 0, panzer); box(ell, 0.08, 0.08, 0.1, 0, -0.32, 0, gelenk);
        // Bein: Hüfte -> Knie -> Fuß
        const huefte = knoten(sx > 0 ? 'bein1' : 'bein-1', becken, sx * 0.12 * breit, -0.06, 0); kugel(huefte, 0.13, 0, 0, 0, gelenk);
        box(huefte, 0.14, 0.38, 0.16, 0, -0.22, 0, panzer); const knie = knoten('knie' + sx, huefte, 0, -0.43, 0); kugel(knie, 0.11, 0, 0, 0, gelenk); box(knie, 0.12, 0.12, 0.06, 0, 0.02, 0.07, panzer);
        zyl(knie, 0.12, 0.09, 0.38, 0, -0.2, 0, panzer); zyl(knie, 0.03, 0.03, 0.3, 0, -0.18, -0.08, schwarz);   // Schienbein + Hydraulik
        box(knie, 0.14, 0.07, 0.26, 0, -0.43, 0.04, gelenk); box(knie, 0.12, 0.04, 0.08, 0, -0.43, 0.18, panzer);   // Fuß
      }
      // Waffe in der rechten Hand
      const hand = teile.ellbogen1; const waffe = box(hand, 0.07, 0.11, 0.7, 0, -0.32, 0.25, schwarz); box(waffe, 0.05, 0.05, 0.25, 0, 0.03, 0.42, gelenk); box(waffe, 0.03, 0.03, 0.02, 0, 0, 0.36, leucht);
      // Grundhaltung: Waffe im Anschlag
      teile.arm1.rotation.x = -1.2; teile.ellbogen1.rotation.x = -0.35; teile['arm-1'].rotation.x = -1.1; teile['arm-1'].rotation.y = 0.55; teile['ellbogen-1'].rotation.x = -0.6;
      let phase = r0(o.seed);
      function r0(sd) { return zufall(sd)() * 6; }
      k.animiere = (tempo, dt, inLuft) => {
        const f = Math.min(1, tempo / 4.5); phase += dt * (2 + tempo * 1.9); const sw = Math.sin(phase) * 0.65 * f;
        if (inLuft) { teile.bein1.rotation.x = -0.5; teile['bein-1'].rotation.x = 0.2; teile.knie1.rotation.x = 0.8; teile['knie-1'].rotation.x = 0.4; return; }
        teile.bein1.rotation.x = sw; teile['bein-1'].rotation.x = -sw; teile.knie1.rotation.x = Math.max(0, -Math.sin(phase)) * 1.1 * f + 0.05; teile['knie-1'].rotation.x = Math.max(0, Math.sin(phase)) * 1.1 * f + 0.05;
        becken.position.y = (0.98 + Math.abs(Math.cos(phase)) * 0.04 * f + Math.sin(phase * 0.5) * 0.004) * s; rumpf.rotation.y = Math.sin(phase) * 0.08 * f; teile.kopfK.rotation.y = -rumpf.rotation.y;
      };
      for (const n of [k].concat(k.getChildTransformNodes(false))) {
        const kinder = n.getChildren(c => c instanceof BAB.Mesh && c !== waffe && !c.getChildren().length, true); if (kinder.length < 2) continue;
        const kopfTeil = kinder.some(c => c.__kopf); kinder.forEach(c => { c.parent = null; });
        const m = zusammen(kinder, 'roboterTeil'); m.parent = n; m.__kopf = kopfTeil;
      }
      k.teile = teile; k.waffe = waffe; k.hoehe = 1.95 * s; return k;
    }

    /* =============== 📷 EIGENE OBERFLÄCHEN AUS FOTOS =============== */
    /** Foto-Material anmelden: danach material('foto:name') und textur: 'foto:name' benutzbar */
    function eigeneOberflaeche(art, albedo, normal, o) {
      o = o || {}; for (const t of [albedo, normal]) if (t) { t.wrapU = t.wrapV = BAB.Texture.WRAP_ADDRESSMODE; t.anisotropicFilteringLevel = 8; }
      texCache[art] = { albedo, normal, d: { groesse: o.groesse || 2, rau: o.rau ?? 0.85, metall: o.metall || 0, staerke: 1 } };
      Object.keys(matCache).forEach(k => { if (k.startsWith(art + '|')) { matCache[k].dispose(); delete matCache[k]; } });
    }
    const kachelGroesse = art => ((OBERFLAECHEN[art] || (texCache[art] && texCache[art].d) || {}).groesse) || 2;
    function fotoFlaechenMaterial(t, name) { const m = new BAB.PBRMaterial('fotoWand_' + name, szene); m.albedoTexture = t.albedo; if (t.normal) { m.bumpTexture = t.normal; m.bumpTexture.level = 0.8; } m.roughness = 0.88; m.metallic = 0; return m; }
    /**
     * Gebäude aus Fotos: def = { breite, tiefe, hoehe, dachFarbe }, tex = { vorne:{albedo,normal}, seite?, hinten?, farbe }
     * Die Fotos liegen genau auf den Außenwänden. Gibt { mesh, kollision, hoehe } zurück.
     */
    function fotoGebaeude(def, tex) {
      const B = def.breite || 10, T = def.tiefe || 8, H = def.hoehe || 8, teile = [], d = 0.25;
      const kern = BAB.MeshBuilder.CreateBox('kern', { width: B - 0.02, height: H, depth: T - 0.02 }, szene); kern.position.y = H / 2; backen(kern); weltUV(kern, 3); kern.material = material('putz', tex.farbe || '#bbbbbb'); teile.push(kern);
      const seiteMat = tex.seite ? fotoFlaechenMaterial(tex.seite, 'seite') : null, vorneMat = fotoFlaechenMaterial(tex.vorne, 'vorne'), hintenMat = tex.hinten ? fotoFlaechenMaterial(tex.hinten, 'hinten') : (tex.seite ? null : vorneMat);
      const flaeche = (w, mat, px, pz, dreh) => { if (!mat) return; const p = BAB.MeshBuilder.CreatePlane('fotoWand', { width: w, height: H }, szene); p.position = V(px, H / 2, pz); p.rotation.y = dreh; backen(p); p.material = mat; teile.push(p); };
      flaeche(B, vorneMat, 0, -T / 2 - 0.01, 0); flaeche(B, hintenMat, 0, T / 2 + 0.01, Math.PI); flaeche(T, seiteMat, -B / 2 - 0.01, 0, Math.PI / 2); flaeche(T, seiteMat, B / 2 + 0.01, 0, -Math.PI / 2);
      const dach = BAB.MeshBuilder.CreateBox('dach', { width: B + 0.2, height: 0.25, depth: T + 0.2 }, szene); dach.position.y = H + 0.12; backen(dach); weltUV(dach, 3); dach.material = material('beton', def.dachFarbe || '#8a8580'); teile.push(dach);
      const sockel = BAB.MeshBuilder.CreateBox('sockel', { width: B + 0.3, height: 0.4, depth: T + 0.3 }, szene); sockel.position.y = -0.1; backen(sockel); weltUV(sockel, 3); sockel.material = material('beton', '#7d7872'); teile.push(sockel);
      return { mesh: zusammen(teile, 'fotoGebaeude'), kollision: [{ p: [0, H / 2, 0], g: [B, H, T], rx: 0 }, { p: [0, H + 0.12, 0], g: [B + 0.2, 0.25, T + 0.2], rx: 0 }], hoehe: H + 0.25 };
    }

    return { material, oberflaeche, weltUV, baum, gebaeude, roboter, eigeneOberflaeche, fotoGebaeude, kachelGroesse, OBERFLAECHEN: Object.keys(OBERFLAECHEN) };
  }

  window.SDBaukasten = { erstellen, zufall, version: '1.0' };
})();
