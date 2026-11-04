/* SD Wetter & Welt – Tag/Nacht-Wechsel, Laternen- und Scheinwerferlicht, Regen, bewegtes Wasser, Wind in Bäumen, Gras. Engine-Modul. */
'use strict';
(function () {
  (window.SDModule = window.SDModule || []).push(function (ctx) {
    const { BAB, V, klemme, szene, kamera, sonne, hell } = ctx;
    const WIND = { zeit: 0, staerke: 0.12 }; let windKlasse = null; const mitWind = new Set();
    /* ---------- 🌬 Wind (Shader-Erweiterung: Blätter und Gras wiegen sich) ---------- */
    if (BAB.MaterialPluginBase) windKlasse = class SDWind extends BAB.MaterialPluginBase {
      constructor(material, faktor) { super(material, 'SDWind', 200, { SDWIND: false }); this.faktor = faktor; this._enable(true); }
      prepareDefines(d) { d.SDWIND = true; } getClassName() { return 'SDWind'; }
      getUniforms() { return { ubo: [{ name: 'sdWind', size: 2, type: 'vec2' }], vertex: '#ifdef SDWIND\nuniform vec2 sdWind;\n#endif\n' }; }
      bindForSubMesh(ubo) { ubo.updateFloat2('sdWind', WIND.zeit, WIND.staerke); }
      getCustomCode(typ) { if (typ !== 'vertex') return null; const f = this.faktor.toFixed(3);
        return { CUSTOM_VERTEX_UPDATE_WORLDPOS: '#ifdef SDWIND\nfloat sdH = clamp(positionUpdated.y * ' + f + ', 0.0, 1.5);\nworldPos.x += sin(sdWind.x * 1.7 + worldPos.x * 0.35 + worldPos.z * 0.21) * sdWind.y * sdH;\nworldPos.z += cos(sdWind.x * 1.3 + worldPos.z * 0.33 + worldPos.x * 0.1) * sdWind.y * sdH * 0.7;\n#endif\n' }; }
    };
    function windAn(m, faktor) { if (!windKlasse || mitWind.has(m)) return; mitWind.add(m); try { new windKlasse(m, faktor); } catch (e) { console.warn('Wind nicht möglich', e.message); } }
    let suchZeit = 0;

    /* ---------- 🌗 Tag & Nacht ---------- */
    let tag = null; const lichter = []; let scheinwerfer = null;
    /** sd.tageszeit({ stunde: 8, minutenProTag: 12 })  – stunde 0–24; minutenProTag: 0 = Uhrzeit bleibt stehen */
    function tageszeit(o) { o = Object.assign({ stunde: 9, minutenProTag: 12 }, o || {}); tag = { stunde: o.stunde, tempo: o.minutenProTag > 0 ? 24 / (o.minutenProTag * 60) : 0, richtung: o.richtung ?? 0.6 }; tagUpdate(0); return tag; }
    const himmelMat = () => szene.getMaterialByName('himmelMat'), scheibe = () => szene.getMeshByName('sonnenScheibe');
    let nachtFaktor = 0;
    function tagUpdate(dt) {
      if (!tag) return; tag.stunde = (tag.stunde + tag.tempo * dt) % 24; const h = tag.stunde;
      const erhebung = Math.sin((h - 6) / 12 * Math.PI), az = (h / 24) * Math.PI * 2 + tag.richtung, hoch = Math.max(0.08, erhebung);
      const dir = V(-Math.cos(az) * Math.cos(Math.asin(klemme(erhebung, -1, 1))), -Math.max(0.15, erhebung), -Math.sin(az) * 0.6).normalize();
      sonne.direction = erhebung > 0 ? dir : V(0.3, -1, 0.2).normalize();
      const tagH = klemme(erhebung * 3, 0, 1), daemmer = klemme(1 - Math.abs(erhebung) * 4, 0, 1); nachtFaktor = 1 - klemme((erhebung + 0.08) * 5, 0, 1);
      sonne.intensity = 0.25 + tagH * 2.0; sonne.diffuse = BAB.Color3.Lerp(new BAB.Color3(1, 0.96, 0.9), new BAB.Color3(1, 0.55, 0.3), daemmer * tagH).scale(1).add(new BAB.Color3(0, 0, 0)); if (erhebung <= 0) sonne.diffuse = new BAB.Color3(0.45, 0.55, 0.85);
      hell.intensity = 0.12 + tagH * 0.42;
      const hm = himmelMat(); if (hm) hm.emissiveColor = BAB.Color3.Lerp(new BAB.Color3(0.07, 0.09, 0.18), new BAB.Color3(1, 1, 1), tagH).multiply(BAB.Color3.Lerp(new BAB.Color3(1, 1, 1), new BAB.Color3(1.15, 0.75, 0.6), daemmer * 0.8)).scale(1 - (regen.staerke || 0) * 0.45);
      szene.environmentIntensity = 0.15 + tagH * 0.75; const fog = BAB.Color3.Lerp(new BAB.Color3(0.05, 0.07, 0.12), new BAB.Color3(0.7, 0.78, 0.86), tagH); szene.fogColor = BAB.Color3.Lerp(fog, new BAB.Color3(0.9, 0.6, 0.45), daemmer * tagH * 0.6).scale(1 - (regen.staerke || 0) * 0.35); szene.clearColor = BAB.Color4.FromColor3(szene.fogColor, 1);
      const sc = scheibe(); if (sc) { sc.position = sonne.direction.scale(-1100); sc.setEnabled(erhebung > -0.05); }
      if (ctx.lampenMat) ctx.lampenMat.emissiveIntensity = 0.15 + nachtFaktor * 3;
      // Licht-Pool: die nächsten Laternen leuchten wirklich (nachts)
      if (ctx.laternen && ctx.laternen.length && nachtFaktor > 0.05) {
        if (!lichter.mehrLicht) { lichter.mehrLicht = true; for (const n of ['bk_asphalt', 'bk_platten']) szene.materials.filter(m => m.name === n).forEach(m => { m.maxSimultaneousLights = 8; }); }
        while (lichter.length < 6) { const l = new BAB.PointLight('laternenLicht', V(0, -100, 0), szene); l.diffuse = new BAB.Color3(1, 0.82, 0.55); l.range = 22; l.intensity = 0; lichter.push(l); }
        const c = kamera.position, naechste = ctx.laternen.map(p => [p, BAB.Vector3.DistanceSquared(p, c)]).sort((a, b) => a[1] - b[1]).slice(0, lichter.length);
        lichter.forEach((l, i) => { const n = naechste[i]; if (n) { l.position.copyFrom(n[0]); l.intensity = nachtFaktor * 2.2; } else l.intensity = 0; });
      } else lichter.forEach(l => { l.intensity = 0; });
      // Scheinwerfer am eigenen Auto
      const a = ctx.uebernahme && ctx.uebernahme.auto;
      if (a && nachtFaktor > 0.2) { if (!scheinwerfer) { scheinwerfer = new BAB.SpotLight('scheinwerfer', V(0, 0, 0), V(0, -0.15, 1), 0.9, 6, szene); scheinwerfer.diffuse = new BAB.Color3(1, 0.95, 0.85); scheinwerfer.range = 70; }
        const mw = a.chassis.computeWorldMatrix(true); scheinwerfer.position = BAB.Vector3.TransformCoordinates(V(0, 0.2, a.T.L / 2 + 0.3), mw); scheinwerfer.direction = BAB.Vector3.TransformNormal(V(0, -0.12, 1), mw).normalize(); scheinwerfer.intensity = nachtFaktor * 4; }
      else if (scheinwerfer) scheinwerfer.intensity = 0;
    }

    /* ---------- 🌧 Regen ---------- */
    const regen = { staerke: 0, ps: null, rau: new Map(), ton: null };
    function streifen() { const t = new BAB.DynamicTexture('regenTex', { width: 8, height: 64 }, szene, false), c = t.getContext(), g = c.createLinearGradient(0, 0, 0, 64); g.addColorStop(0, 'rgba(200,215,235,0)'); g.addColorStop(1, 'rgba(200,215,235,0.85)'); c.fillStyle = g; c.fillRect(3, 0, 2, 64); t.update(); t.hasAlpha = true; return t; }
    /** sd.wetter({ regen: 0..1, wind: 0..1, nebel }) */
    function wetter(o) {
      o = o || {}; if (o.wind != null) WIND.staerke = 0.05 + o.wind * 0.35; if (o.nebel != null) szene.fogDensity = o.nebel;
      if (o.regen != null) { regen.staerke = klemme(o.regen, 0, 1);
        if (regen.staerke > 0 && !regen.ps) { const ps = new BAB.ParticleSystem('regen', 6000, szene); ps.particleTexture = streifen(); ps.emitter = kamera.position.clone(); ps.minEmitBox = V(-30, 18, -30); ps.maxEmitBox = V(30, 22, 30);
          ps.direction1 = V(-1, -30, -0.5); ps.direction2 = V(1, -34, 0.5); ps.minLifeTime = ps.maxLifeTime = 0.75; ps.minSize = 0.05; ps.maxSize = 0.09; ps.minScaleY = 7; ps.maxScaleY = 11; ps.billboardMode = BAB.ParticleSystem.BILLBOARDMODE_STRETCHED;
          ps.color1 = ps.color2 = new BAB.Color4(0.8, 0.85, 0.95, 0.55); ps.colorDead = new BAB.Color4(0.8, 0.85, 0.95, 0); ps.blendMode = BAB.ParticleSystem.BLENDMODE_STANDARD; ps.gravity = V(0, -10, 0); ps.start(); regen.ps = ps; }
        if (regen.ps) regen.ps.emitRate = regen.staerke * 7000;
        // nasse Oberflächen glänzen
        for (const m of szene.materials) if (m instanceof BAB.PBRMaterial || m instanceof BAB.PBRMetallicRoughnessMaterial) { if (!regen.rau.has(m)) regen.rau.set(m, m.roughness); const r0 = regen.rau.get(m); if (r0 != null) m.roughness = r0 * (1 - regen.staerke * 0.5); }
        szene.fogDensity = Math.max(szene.fogDensity, 0.002 + regen.staerke * 0.004); regenTon(regen.staerke); }
    }
    function regenTon(st) { const AC = ctx.audio && ctx.audio(); if (!AC) return;
      if (!regen.ton) { const buf = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate), d = buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; const q = AC.createBufferSource(); q.buffer = buf; q.loop = true; const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1800; const g = AC.createGain(); g.gain.value = 0; q.connect(f); f.connect(g); g.connect(AC.destination); q.start(); regen.ton = g; ctx.aufraeumen = (ctx.aufraeumen || []).concat(() => q.stop()); }
      regen.ton.gain.value = st * 0.12; }

    /* ---------- 🌊 Wasser mit Wellen ---------- */
    let wasserTex = null;
    function wasserWellen(o) {
      o = o || {}; const w = szene.getMeshByName('wasser'); if (!w) return false; const n = 256, t = new BAB.DynamicTexture('wellen', n, szene, true), c = t.getContext(), img = c.createImageData(n, n);
      const H = (x, y) => Math.sin(x * 2 * Math.PI * 3 / n) * 0.6 + Math.sin(y * 2 * Math.PI * 5 / n + x * 2 * Math.PI / n) * 0.4 + Math.sin((x + y) * 2 * Math.PI * 7 / n) * 0.25 + Math.sin((x - 2 * y) * 2 * Math.PI * 4 / n) * 0.3;
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const dx = (H(x - 1, y) - H(x + 1, y)) * 2.2, dy = (H(x, y - 1) - H(x, y + 1)) * 2.2, l = Math.hypot(dx, dy, 1), i = (y * n + x) * 4; img.data[i] = (dx / l * 0.5 + 0.5) * 255; img.data[i + 1] = (dy / l * 0.5 + 0.5) * 255; img.data[i + 2] = (1 / l * 0.5 + 0.5) * 255; img.data[i + 3] = 255; }
      c.putImageData(img, 0, 0); t.update(); t.wrapU = t.wrapV = 1; t.uScale = t.vScale = o.wellenGroesse || 60;
      const m = new BAB.PBRMaterial('wasserMat', szene); m.albedoColor = BAB.Color3.FromHexString(o.farbe || '#1d4a5e'); m.metallic = 0.05; m.roughness = 0.05; m.bumpTexture = t; m.bumpTexture.level = 0.6; m.alpha = 0.86; m.environmentIntensity = 1.3; m.backFaceCulling = false;
      w.material = m; w.receiveShadows = true; wasserTex = t; return true;
    }

    /* ---------- 🌱 Gras (nur in der Nähe, wandert mit) ---------- */
    let gras = null;
    function grasAn(o) {
      o = Object.assign({ radius: 42, abstand: 1.25, hoehe: 0.55 }, o || {});
      const cv = document.createElement('canvas'); cv.width = 128; cv.height = 128; const x = cv.getContext('2d');
      for (let i = 0; i < 26; i++) { const bx = 6 + Math.random() * 116, h = 70 + Math.random() * 55, neig = (Math.random() - 0.5) * 30; x.fillStyle = `rgb(${60 + Math.random() * 40},${110 + Math.random() * 50},${35 + Math.random() * 20})`; x.beginPath(); x.moveTo(bx - 2.5, 128); x.quadraticCurveTo(bx + neig * 0.3, 128 - h * 0.6, bx + neig, 128 - h); x.lineTo(bx + 2.5, 128); x.fill(); }
      const tex = new BAB.DynamicTexture('grasTex', cv, szene, true); tex.update(); tex.hasAlpha = true;
      const mat = new BAB.PBRMaterial('grasMat', szene); mat.albedoTexture = tex; mat.useAlphaFromAlbedoTexture = true; mat.transparencyMode = BAB.PBRMaterial.PBRMATERIAL_ALPHATEST; mat.alphaCutOff = 0.45; mat.backFaceCulling = false; mat.twoSidedLighting = true; mat.roughness = 0.9; mat.metallic = 0; mat.albedoColor = new BAB.Color3(1.1, 1.15, 1.0);
      const teile = []; for (let i = 0; i < 3; i++) { const p = BAB.MeshBuilder.CreatePlane('gras', { width: 1.1, height: o.hoehe, sideOrientation: BAB.Mesh.DOUBLESIDE }, szene); p.position.y = o.hoehe / 2; p.rotation.y = i * Math.PI / 3; p.bakeCurrentTransformIntoVertices(); teile.push(p); }
      const m = BAB.Mesh.MergeMeshes(teile, true, true); m.material = mat; m.isPickable = false; m.receiveShadows = true; m.alwaysSelectAsActiveMesh = true; windAn(mat, 1.6);
      gras = { m, o, mitte: null }; grasVerteilen(); return true;
    }
    function grasVerteilen() {
      const c = kamera.position, o = gras.o, R = o.radius, a = o.abstand, mats = [], wasser = ctx.wasserHoehe ?? -1e9, bereiche = ctx.stadtBereiche || [];
      const hash = (i, j) => { const h = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return h - Math.floor(h); };
      const i0 = Math.floor((c.x - R) / a), i1 = Math.floor((c.x + R) / a), j0 = Math.floor((c.z - R) / a), j1 = Math.floor((c.z + R) / a);
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const x = (i + hash(i, j)) * a, z = (j + hash(j, i)) * a; if ((x - c.x) ** 2 + (z - c.z) ** 2 > R * R) continue;
        if (bereiche.some(b => Math.abs(x - b[0]) < b[2] && Math.abs(z - b[1]) < b[3])) continue;
        const y = ctx.hoehe(x, z); if (y < wasser + 0.6) continue; const yx = ctx.hoehe(x + 1, z); if (Math.abs(yx - y) > 0.6) continue;
        const s = 0.7 + hash(i * 3, j * 7) * 0.6; mats.push(BAB.Matrix.Compose(V(s, s * (0.8 + hash(i, j * 5) * 0.5), s), BAB.Quaternion.RotationAxis(V(0, 1, 0), hash(i * 5, j) * 6.3), V(x, y - 0.05, z)));
      }
      const buf = new Float32Array(mats.length * 16); mats.forEach((mm, k) => mm.copyToArray(buf, k * 16)); gras.m.thinInstanceSetBuffer('matrix', buf, 16, true); gras.mitte = c.clone(); gras.anzahl = mats.length;
    }

    function update(dt) {
      WIND.zeit += dt; tagUpdate(dt);
      if (regen.ps) { regen.ps.emitter = kamera.position.clone(); }
      if (wasserTex) { wasserTex.uOffset += dt * 0.012; wasserTex.vOffset += dt * 0.007; }
      if (gras && (!gras.mitte || Math.hypot(kamera.position.x - gras.mitte.x, kamera.position.z - gras.mitte.z) > 9)) grasVerteilen();
      suchZeit -= dt; if (suchZeit <= 0) { suchZeit = 2; for (const m of szene.materials) if (/^blatt_/.test(m.name)) windAn(m, 0.09); }
    }
    return { api: { tageszeit, wetter, wasserWellen, gras: grasAn, get uhrzeit() { return tag ? tag.stunde : null; }, get grasAnzahl() { return gras ? gras.anzahl : 0; } }, update };
  });
})();
