/* SD Mensch – Charakter-Generator mit ECHTEM Skelett (Knochen) und Animationen.
   Ein einziges verformbares Modell (1 Zeichenaufruf), Farben über Vertexfarben, Animationen als AnimationGroups
   (Stehen, Gehen, Rennen, Sterben) – genauso aufgebaut wie Figuren von Mixamo, daher auch als .glb exportierbar. */
'use strict';
(function () {
  function zufall(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  const STANDARD = { groesse: 1.8, statur: 1, haut: '#d9a77c', haare: '#3a2a1e', frisur: 'kurz', oberteil: '#3b5a7a', aermel: 'kurz', hose: '#2f3540', schuhe: '#1c1c1c', weste: false, westeFarbe: '#3d4433', helm: false, seed: 1 };
  let nr = 0;
  function bauer(BAB, szene) {
    const V = (x, y, z) => new BAB.Vector3(x, y, z), F = h => BAB.Color3.FromHexString(h);
    /**
     * mensch({ groesse, statur, haut, haare, frisur:'kurz'|'lang'|'glatze'|'kappe', oberteil, aermel:'kurz'|'lang', hose, schuhe, weste, helm })
     * -> { wurzel, mesh, skelett, gruppen:{stehen,gehen,rennen,sterben}, hand, knochen }
     */
    function mensch(o) {
      o = Object.assign({}, STANDARD, o || {}); const s = o.groesse / 1.8, b = o.statur, id = ++nr;
      const wurzel = new BAB.TransformNode('mensch', szene), skel = new BAB.Skeleton('skelett' + id, 'sk' + id, szene), kn = {}, welt = {};
      const knochen = (name, eltern, x, y, z) => { const bo = new BAB.Bone(name, skel, eltern ? kn[eltern] : null, BAB.Matrix.Translation(x * s, y * s, z * s)); kn[name] = bo; const p = V(x * s, y * s, z * s); welt[name] = eltern ? welt[eltern].add(p) : p; return bo; };
      knochen('huefte', null, 0, 0.98, 0); knochen('wirbel', 'huefte', 0, 0.12, 0); knochen('brust', 'wirbel', 0, 0.2, 0); knochen('hals', 'brust', 0, 0.22, 0); knochen('kopf', 'hals', 0, 0.09, 0);
      for (const [sx, n] of [[1, 'R'], [-1, 'L']]) {
        knochen('oberarm' + n, 'brust', sx * 0.2 * b, 0.16, 0); knochen('unterarm' + n, 'oberarm' + n, 0, -0.29, 0); knochen('hand' + n, 'unterarm' + n, 0, -0.26, 0);
        knochen('oberschenkel' + n, 'huefte', sx * 0.1 * b, -0.05, 0); knochen('unterschenkel' + n, 'oberschenkel' + n, 0, -0.44, 0); knochen('fuss' + n, 'unterschenkel' + n, 0, -0.43, 0);
      }
      const idx = Object.fromEntries(skel.bones.map((bo, i) => [bo.name, i]));
      // Teile (in der Grundhaltung), jedes fest an einen Knochen gebunden
      const teile = [];
      const teil = (mesh, kno, farbe, dx, dy, dz) => { mesh.position = welt[kno].add(V((dx || 0) * s, (dy || 0) * s, (dz || 0) * s)); mesh.bakeCurrentTransformIntoVertices();
        const n = mesh.getTotalVertices(), c = F(farbe), cols = [], mi = [], mw = []; for (let i = 0; i < n; i++) { cols.push(c.r, c.g, c.b, 1); mi.push(idx[kno], 0, 0, 0); mw.push(1, 0, 0, 0); }
        mesh.setVerticesData(BAB.VertexBuffer.ColorKind, cols); mesh.setVerticesData(BAB.VertexBuffer.MatricesIndicesKind, mi); mesh.setVerticesData(BAB.VertexBuffer.MatricesWeightsKind, mw); teile.push(mesh); return mesh; };
      const box = (w, h, d) => BAB.MeshBuilder.CreateBox('t', { width: w * s, height: h * s, depth: d * s }, szene);
      const kapsel = (r, h, sx, sz) => { const m = BAB.MeshBuilder.CreateCapsule('t', { radius: r * s, height: h * s, tessellation: 10, subdivisions: 1, capSubdivisions: 3 }, szene); if (sx || sz) { m.scaling = V(sx || 1, 1, sz || 1); m.bakeCurrentTransformIntoVertices(); } return m; };
      const kugel = (d, sx, sy, sz) => { const m = BAB.MeshBuilder.CreateSphere('t', { diameter: d * s, segments: 12 }, szene); m.scaling = V(sx || 1, sy || 1, sz || 1); m.bakeCurrentTransformIntoVertices(); return m; };
      // Rumpf
      teil(box(0.34 * b, 0.18, 0.22), 'huefte', o.hose, 0, -0.02, 0);
      teil(kapsel(0.15 * b, 0.36, 1.05, 0.72), 'wirbel', o.oberteil, 0, 0.06, 0);
      teil(kapsel(0.19 * b, 0.42, 1.12, 0.66), 'brust', o.oberteil, 0, 0.08, 0);
      if (o.weste) { teil(box(0.42 * b, 0.36, 0.3), 'brust', o.westeFarbe, 0, 0.04, 0); for (const x of [-0.09, 0.09]) teil(box(0.08, 0.1, 0.04), 'brust', '#2a2e26', x * b, -0.04, 0.16); }
      teil(kapsel(0.05, 0.14), 'hals', o.haut, 0, 0.03, 0);
      teil(kugel(0.22, 0.88, 1.08, 0.95), 'kopf', o.haut, 0, 0.1, 0.005);
      teil(box(0.03, 0.05, 0.04), 'kopf', o.haut, 0, 0.09, 0.11);                                     // Nase
      for (const x of [-0.04, 0.04]) teil(kugel(0.022), 'kopf', '#1a1a1a', x, 0.12, 0.095);            // Augen
      if (o.helm) teil(kugel(0.25, 1, 0.75, 1.05), 'kopf', o.westeFarbe || '#3d4433', 0, 0.17, 0);
      else if (o.frisur === 'kappe') { teil(kugel(0.235, 0.95, 0.6, 1), 'kopf', o.haare, 0, 0.18, 0); teil(box(0.18, 0.02, 0.1), 'kopf', o.haare, 0, 0.16, 0.12); }
      else if (o.frisur !== 'glatze') { teil(kugel(0.235, 0.94, 0.72, 1.02), 'kopf', o.haare, 0, 0.16, -0.01); if (o.frisur === 'lang') teil(box(0.2, 0.22, 0.08), 'kopf', o.haare, 0, 0.02, -0.08); }
      // Arme und Beine
      for (const n of ['R', 'L']) {
        teil(kapsel(0.055 * b, 0.32), 'oberarm' + n, o.oberteil, 0, -0.14, 0); teil(kapsel(0.045 * b, 0.28), 'unterarm' + n, o.aermel === 'lang' ? o.oberteil : o.haut, 0, -0.13, 0);
        teil(box(0.07, 0.1, 0.045), 'hand' + n, o.haut, 0, -0.05, 0);
        teil(kapsel(0.08 * b, 0.47), 'oberschenkel' + n, o.hose, 0, -0.21, 0); teil(kapsel(0.06 * b, 0.45), 'unterschenkel' + n, o.hose, 0, -0.21, 0);
        teil(box(0.11, 0.08, 0.25), 'fuss' + n, o.schuhe, 0, -0.025, 0.05);
      }
      const mesh = BAB.Mesh.MergeMeshes(teile, true, true); mesh.name = 'menschKoerper'; mesh.parent = wurzel; mesh.skeleton = skel; mesh.numBoneInfluencers = 1;
      const mat = new BAB.PBRMaterial('menschMat' + id, szene); mat.albedoColor = new BAB.Color3(1, 1, 1); mat.roughness = 0.75; mat.metallic = 0; mesh.material = mat; mesh.useVertexColors = true;
      // Waffen-Knoten an der rechten Hand
      const hand = new BAB.TransformNode('handR_waffe', szene); hand.attachToBone(kn.handR, mesh);
      return { wurzel, mesh, skelett: skel, knochen: kn, gruppen: animationen(skel, kn, s, id), hand };
    }

    /* ---------- Animationen (Schlüsselbilder auf den Knochen) ---------- */
    function animationen(skel, kn, s, id) {
      const FPS = 30, Q = (x, y, z) => BAB.Quaternion.FromEulerAngles(x, y, z);
      // Grundhaltung mit Gewehr im Anschlag (rechts = +x)
      const halt = { oberarmR: [-1.15, 0, 0.15], unterarmR: [-0.9, 0, 0], oberarmL: [-1.25, 0, 0.55], unterarmL: [-0.35, 0, 0], handR: [0, 0, 0], handL: [0, 0, 0] };
      const clip = (name, laenge, schleife, fn) => { const g = new BAB.AnimationGroup(name + '_' + id, szene), n = Math.round(laenge * FPS), spuren = {};
        for (let f = 0; f <= n; f++) { const t = f / n, pose = fn(t); for (const [k, w] of Object.entries(pose)) { if (k === 'hoehe') continue; (spuren[k] = spuren[k] || []).push({ frame: f, value: Q(w[0], w[1], w[2]) }); } if (pose.hoehe != null) (spuren.__h = spuren.__h || []).push({ frame: f, value: V(0, pose.hoehe * s, 0) }); }
        for (const [k, keys] of Object.entries(spuren)) { if (k === '__h') { const a = new BAB.Animation(name + '_h', 'position', FPS, BAB.Animation.ANIMATIONTYPE_VECTOR3, schleife ? 1 : 2); a.setKeys(keys); g.addTargetedAnimation(a, kn.huefte); continue; }
          const a = new BAB.Animation(name + '_' + k, 'rotationQuaternion', FPS, BAB.Animation.ANIMATIONTYPE_QUATERNION, schleife ? 1 : 2); a.setKeys(keys); g.addTargetedAnimation(a, kn[k]); }
        g.normalize(0, n); g.name = name; return g; };
      const mitHalt = (p, wippen) => Object.assign({}, Object.fromEntries(Object.entries(halt).map(([k, v]) => [k, v.slice()])), p, wippen ? { oberarmR: [halt.oberarmR[0] + wippen, 0, 0.15], oberarmL: [halt.oberarmL[0] + wippen, 0, 0.55] } : {});
      const beine = (t, schritt, knie, lean) => { const w = Math.sin(t * Math.PI * 2), c = Math.cos(t * Math.PI * 2);
        return { oberschenkelR: [-w * schritt, 0, 0], oberschenkelL: [w * schritt, 0, 0], unterschenkelR: [Math.max(0, -c) * knie + 0.05, 0, 0], unterschenkelL: [Math.max(0, c) * knie + 0.05, 0, 0],
          fussR: [w * 0.25 - 0.05, 0, 0], fussL: [-w * 0.25 - 0.05, 0, 0], wirbel: [lean, w * 0.08, 0], brust: [0.02, -w * 0.12, 0], hoehe: 0.98 - (1 - Math.abs(c)) * 0.0 + Math.abs(w) * 0.03 - 0.02 }; };
      const stehen = clip('Stehen', 2.4, true, t => mitHalt({ wirbel: [0.02 + Math.sin(t * Math.PI * 2) * 0.015, 0, 0], brust: [Math.sin(t * Math.PI * 2) * 0.02, 0, 0], kopf: [0, Math.sin(t * Math.PI * 2) * 0.08, 0], oberschenkelR: [0, 0, 0.03], oberschenkelL: [0, 0, -0.03], hoehe: 0.98 - Math.sin(t * Math.PI * 4) * 0.003 }));
      const gehen = clip('Gehen', 1.05, true, t => mitHalt(beine(t, 0.5, 0.95, 0.06), Math.sin(t * Math.PI * 4) * 0.03));
      const rennen = clip('Rennen', 0.66, true, t => mitHalt(Object.assign(beine(t, 0.85, 1.6, 0.22), { kopf: [-0.15, 0, 0] }), Math.sin(t * Math.PI * 4) * 0.06));
      const sterben = clip('Sterben', 1.1, false, t => { const e = Math.min(1, t * 1.25), f = e * e * (3 - 2 * e);
        return { huefte: [f * 1.45, 0, f * 0.1], wirbel: [-f * 0.2, 0, 0], kopf: [-f * 0.3, 0.3 * f, 0], oberarmR: [-1.15 * (1 - f) - f * 0.4, 0, 0.15 + f * 1.1], unterarmR: [-0.9 * (1 - f), 0, 0], oberarmL: [-1.25 * (1 - f) - f * 0.6, 0, 0.55 * (1 - f) - f * 0.8], unterarmL: [-0.35, 0, 0],
          oberschenkelR: [-f * 0.6, 0, 0.1 * f], oberschenkelL: [-f * 0.2, 0, -0.15 * f], unterschenkelR: [f * 1.1, 0, 0], unterschenkelL: [f * 0.4, 0, 0], hoehe: 0.98 - f * 0.8 }; });
      [stehen, gehen, rennen, sterben].forEach(g => g.stop());
      return { stehen, gehen, rennen, sterben };
    }
    return { mensch, STANDARD };
  }
  window.SDMensch = { bauer, STANDARD, zufall };
})();
