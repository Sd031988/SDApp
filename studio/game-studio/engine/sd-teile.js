/* SD Teile – Modelle aus einer einfachen Bauteil-Liste (JSON). Gedacht für KI-Assistenten wie ChatGPT oder Claude:
   Die KI schreibt nur Daten (kein Programm), die SD Werkstatt und die Engine bauen daraus 3D-Modelle mit Gelenken und Bewegungen.
   SDTeile.bauen(BABYLON, szene, BK, daten) → { wurzel, knoten, fehler, update(dt) }   ·   SDTeile.pruefen(daten) → { daten, fehler }   ·   SDTeile.ANLEITUNG */
'use strict';
(function () {
  const FORMEN = ['kiste', 'zylinder', 'kugel', 'kegel', 'torus', 'rad', 'platte', 'keil', 'loft', 'schlauch', 'profil', 'reifen'];
  const MATERIALIEN = ['farbe', 'lack', 'karbon', 'metall', 'chrom', 'gummi', 'glas', 'leuchten', 'holz', 'beton', 'ziegel', 'putz', 'platten', 'asphalt', 'gras', 'fels', 'sand', 'stoff', 'kunststoff'];
  const zahl = (v, a, b, std) => { const n = Number(v); return Number.isFinite(n) ? Math.max(a, Math.min(b, n)) : std; };
  const vek = (v, g, std) => Array.isArray(v) && v.length === 3 ? v.map((x, i) => zahl(x, -g, g, std[i])) : std.slice();
  const farbe = (v, std) => typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v) ? v : std;
  const name = v => typeof v === 'string' ? v.replace(/[^\wäöüÄÖÜß -]/g, '').slice(0, 40) : '';
  /** Säubert die Daten: nur bekannte Formen, begrenzte Zahlen, höchstens 1500 Teile */
  function pruefen(d) {
    const fehler = []; if (typeof d === 'string') { try { d = JSON.parse(d.replace(/^\s*```(?:json)?|```\s*$/g, '')); } catch (e) { return { daten: null, fehler: ['Kein gültiges JSON: ' + e.message] }; } }
    if (!d || typeof d !== 'object') return { daten: null, fehler: ['Daten fehlen'] };
    const teile = [], ids = new Set(); (Array.isArray(d.teile) ? d.teile : []).slice(0, 1500).forEach((t, i) => {
      if (!t || typeof t !== 'object') return; const form = FORMEN.includes(t.form) ? t.form : (fehler.push('Teil ' + (i + 1) + ': unbekannte Form „' + t.form + '“ → kiste'), 'kiste');
      const id = name(t.id) || ('teil' + (i + 1)); if (ids.has(id)) fehler.push('Teil ' + (i + 1) + ': id „' + id + '“ doppelt'); ids.add(id);
      teile.push({ id, eltern: name(t.eltern) || null, form, groesse: vek(t.groesse, 200, [1, 1, 1]), durchmesser: zahl(t.durchmesser, 0.001, 200, 1), hoehe: zahl(t.hoehe, 0.001, 200, 1), oben: zahl(t.oben, 0, 200, 0), dicke: zahl(t.dicke, 0.001, 50, 0.2),
        pos: vek(t.pos, 500, [0, 0, 0]), dreh: vek(t.dreh, 3600, [0, 0, 0]), farbe: farbe(t.farbe, '#9aa0a8'), material: MATERIALIEN.includes(t.material) ? t.material : 'farbe', segmente: Math.round(zahl(t.segmente, 3, 48, 16)), achse: ['x', 'y', 'z'].includes(t.achse) ? t.achse : 'y', unsichtbar: t.unsichtbar === true,
        schnitte: (Array.isArray(t.schnitte) ? t.schnitte : []).slice(0, 80).map(q => ({ z: zahl(q && q.z, -200, 200, 0), x: zahl(q && q.x, -200, 200, 0), breite: zahl(q && q.breite, 0.001, 200, 1), unten: zahl(q && q.unten, -200, 200, 0), oben: zahl(q && q.oben, -200, 200, 1), rund: zahl(q && q.rund, 0, 1, 0.5) })),
        punkte: (Array.isArray(t.punkte) ? t.punkte : []).slice(0, 200).filter(Array.isArray).map(q => q.slice(0, 3).map(v => zahl(v, -200, 200, 0))), tiefe: zahl(t.tiefe, 0.001, 200, 0.1), breite: zahl(t.breite, 0.01, 5, 0.25),
        speichen: Math.round(zahl(t.speichen, 0, 24, 5)), felgenFarbe: farbe(t.felgenFarbe, '#c8ccd2') });
      const z = teile[teile.length - 1]; if (z.form === 'loft' && z.schnitte.length < 2) fehler.push('„' + z.id + '“: loft braucht mindestens 2 schnitte'); if ((z.form === 'schlauch' && z.punkte.length < 2) || (z.form === 'profil' && z.punkte.length < 3)) fehler.push('„' + z.id + '“: zu wenige punkte'); });
    for (const t of teile) if (t.eltern && !ids.has(t.eltern)) { fehler.push('„' + t.id + '“: eltern „' + t.eltern + '“ gibt es nicht'); t.eltern = null; }
    const anim = []; (Array.isArray(d.bewegungen) ? d.bewegungen : []).slice(0, 200).forEach(b => { if (!b || !ids.has(name(b.teil))) { if (b) fehler.push('Bewegung: Teil „' + b.teil + '“ unbekannt'); return; }
      anim.push({ teil: name(b.teil), art: ['drehen', 'pendeln', 'schieben'].includes(b.art) ? b.art : 'drehen', achse: ['x', 'y', 'z'].includes(b.achse) ? b.achse : 'y', tempo: zahl(b.tempo, -3600, 3600, 90), weite: zahl(b.weite, 0, 360, 30), phase: zahl(b.phase, -360, 360, 0) }); });
    if (!teile.length) fehler.push('Keine Teile – „teile“ muss eine Liste sein');
    return { daten: { name: name(d.name) || 'KI-Modell', teile, bewegungen: anim }, fehler };
  }
  function bauen(BAB, szene, BK, roh) {
    const { daten, fehler } = pruefen(roh); if (!daten) return { wurzel: null, knoten: {}, fehler, update() {} };
    const V = (x, y, z) => new BAB.Vector3(x, y, z), rad = g => g * Math.PI / 180, wurzel = new BAB.TransformNode(daten.name, szene), knoten = {}, mats = {};
    const mat = (m, f) => { const k = m + f; if (mats[k]) return mats[k];
      if (BK && ['holz', 'beton', 'ziegel', 'putz', 'platten', 'asphalt', 'gras', 'fels', 'sand'].includes(m)) return (mats[k] = BK.material(m, f));
      const p = new BAB.PBRMaterial('ki_' + m, szene); p.albedoColor = BAB.Color3.FromHexString(f); p.metallic = m === 'metall' ? 0.85 : m === 'chrom' ? 1 : m === 'lack' ? 0.35 : m === 'karbon' ? 0.3 : 0; if (m === 'lack') { p.clearCoat.isEnabled = true; p.clearCoat.intensity = 1; p.clearCoat.roughness = 0.03; p.roughness = 0.32; } if (m === 'karbon' && BK && BK.skinMaterial) return (mats[k] = BK.skinMaterial({ muster: 'karbon', farbe: f, akzent: '#0e0f11', metall: 0.4 })); p.roughness = m === 'lack' ? 0.32 : m === 'chrom' ? 0.08 : m === 'metall' ? 0.35 : m === 'gummi' ? 0.95 : m === 'stoff' ? 0.9 : m === 'kunststoff' ? 0.45 : 0.6;
      if (m === 'glas') { p.metallic = 0.9; p.roughness = 0.03; p.alpha = 0.6; p.environmentIntensity = 1.5; } if (m === 'leuchten') { p.emissiveColor = BAB.Color3.FromHexString(f); p.emissiveIntensity = 2; } return (mats[k] = p); };
    for (const t of daten.teile) {   // erst alle Knoten (Gelenk = Knoten-Position), dann Form
      const n = new BAB.TransformNode(t.id, szene); n.position = V(...t.pos); n.rotation = V(rad(t.dreh[0]), rad(t.dreh[1]), rad(t.dreh[2])); knoten[t.id] = n; n.__t = t; }
    for (const t of daten.teile) { const n = knoten[t.id]; n.parent = t.eltern ? knoten[t.eltern] : wurzel; if (t.unsichtbar) continue;
      const M = BAB.MeshBuilder; let m; const s = t.segmente;
      if (t.form === 'kiste' || t.form === 'platte') m = M.CreateBox(t.id, { width: t.groesse[0], height: t.form === 'platte' ? Math.min(t.groesse[1], 0.05) : t.groesse[1], depth: t.groesse[2] }, szene);
      else if (t.form === 'kugel') m = M.CreateSphere(t.id, { diameter: t.durchmesser, segments: Math.max(6, s / 2) }, szene);
      else if (t.form === 'zylinder' || t.form === 'rad') m = M.CreateCylinder(t.id, { diameter: t.durchmesser, height: t.form === 'rad' ? (t.dicke || 0.2) : t.hoehe, tessellation: s }, szene);
      else if (t.form === 'kegel') m = M.CreateCylinder(t.id, { diameterBottom: t.durchmesser, diameterTop: t.oben, height: t.hoehe, tessellation: s }, szene);
      else if (t.form === 'torus') m = M.CreateTorus(t.id, { diameter: t.durchmesser, thickness: t.dicke, tessellation: s }, szene);
      else if (t.form === 'keil') { m = M.CreateCylinder(t.id, { diameter: 1, height: 1, tessellation: 3 }, szene); m.scaling = V(t.groesse[0], t.groesse[1], t.groesse[2]); m.rotation.z = Math.PI / 2; }
      else if (t.form === 'loft') m = loft(BAB, szene, t);
      else if (t.form === 'schlauch') m = M.CreateTube(t.id, { path: t.punkte.map(q => V(q[0], q[1] || 0, q[2] || 0)), radius: t.durchmesser / 2, tessellation: s, cap: BAB.Mesh.CAP_ALL }, szene);
      else if (t.form === 'profil') { const form = t.punkte.map(q => V(q[0], q[1] || 0, 0)); form.push(form[0]); m = M.ExtrudeShape(t.id, { shape: form, path: [V(0, 0, -t.tiefe / 2), V(0, 0, t.tiefe / 2)], cap: BAB.Mesh.CAP_ALL, sideOrientation: BAB.Mesh.DOUBLESIDE }, szene); }
      else if (t.form === 'reifen') m = reifen(BAB, szene, t, mat);
      if ((t.form === 'zylinder' || t.form === 'kegel' || t.form === 'rad') && t.achse !== 'y') { if (t.achse === 'x') m.rotation.z = Math.PI / 2; else m.rotation.x = Math.PI / 2; }
      if (t.form === 'rad' && t.achse === 'y') m.rotation.z = Math.PI / 2;   // Räder rollen standardmäßig um x
      m.parent = n; if (!m.__eigeneMaterialien) m.material = mat(t.material, t.farbe); m.isPickable = true; if (BK && BK.weltUV && /holz|beton|ziegel|putz|platten|asphalt|gras|fels|sand/.test(t.material)) { m.bakeCurrentTransformIntoVertices(); BK.weltUV(m, 2); } }
    let zeit = 0; const basis = {}; for (const b of daten.bewegungen) { const n = knoten[b.teil]; basis[b.teil] = basis[b.teil] || { r: n.rotation.clone(), p: n.position.clone() }; }
    function update(dt) { zeit += dt; for (const b of daten.bewegungen) { const n = knoten[b.teil], g = basis[b.teil];
      if (b.art === 'drehen') n.rotation[b.achse] = g.r[b.achse] + rad(b.tempo) * zeit;
      else if (b.art === 'pendeln') n.rotation[b.achse] = g.r[b.achse] + rad(b.weite) * Math.sin(rad(b.tempo) * zeit + rad(b.phase));
      else n.position[b.achse] = g.p[b.achse] + b.weite / 100 * Math.sin(rad(b.tempo) * zeit + rad(b.phase)); } }
    return { wurzel, knoten, fehler, update, daten };
  }
  /** Karosserie aus Querschnitten entlang z (abgerundete Rechtecke = Superellipsen) – so entstehen glatte Autos, Flugzeugrümpfe, Boote */
  function loft(BAB, szene, t) {
    const S = t.schnitte.slice().sort((a, b) => a.z - b.z), N = Math.max(12, t.segmente * 2), pos = [], ind = [];
    for (const q of S) { const e = 2 / (2 + (1 - q.rund) * 8), hy = (q.oben - q.unten) / 2, my = (q.oben + q.unten) / 2, hx = q.breite / 2;
      for (let i = 0; i < N; i++) { const w = i / N * Math.PI * 2, c = Math.cos(w), sn = Math.sin(w); pos.push(q.x + hx * Math.sign(c) * Math.pow(Math.abs(c), e), my + hy * Math.sign(sn) * Math.pow(Math.abs(sn), e), q.z); } }
    for (let j = 0; j < S.length - 1; j++) for (let i = 0; i < N; i++) { const a = j * N + i, b = j * N + (i + 1) % N, c = a + N, d = b + N; ind.push(a, c, b, b, c, d); }
    for (const [j, rueck] of [[0, true], [S.length - 1, false]]) { const q = S[j], mi = pos.length / 3; pos.push(q.x, (q.oben + q.unten) / 2, q.z); for (let i = 0; i < N; i++) { const a = j * N + i, b = j * N + (i + 1) % N; if (rueck) ind.push(mi, a, b); else ind.push(mi, b, a); } }
    const nor = []; BAB.VertexData.ComputeNormals(pos, ind, nor); const vd = new BAB.VertexData(); vd.positions = pos; vd.indices = ind; vd.normals = nor; const m = new BAB.Mesh(t.id, szene); vd.applyToMesh(m); return m;
  }
  /** Reifen mit Felge und Speichen, Achse = x */
  function reifen(BAB, szene, t, mat) {
    const M = BAB.MeshBuilder, r = t.durchmesser / 2, b = t.breite, teile = [];
    const g = M.CreateCylinder('reifen', { diameter: t.durchmesser, height: b, tessellation: 28 }, szene); g.rotation.z = Math.PI / 2; g.bakeCurrentTransformIntoVertices(); g.material = mat('gummi', '#141414'); teile.push(g);
    const f = M.CreateCylinder('felge', { diameter: t.durchmesser * 0.66, height: b * 1.02, tessellation: 24 }, szene); f.rotation.z = Math.PI / 2; f.bakeCurrentTransformIntoVertices(); f.material = mat('chrom', '#3a3c40'); teile.push(f);
    for (const sx of [-1, 1]) { for (let i = 0; i < t.speichen; i++) { const sp = M.CreateBox('speiche', { width: 0.02, height: r * 0.58, depth: r * 0.13 }, szene); sp.position.y = r * 0.31; sp.bakeCurrentTransformIntoVertices(); sp.rotation.x = i / t.speichen * Math.PI * 2; sp.position.x = sx * b * 0.52; sp.bakeCurrentTransformIntoVertices(); sp.material = mat('metall', t.felgenFarbe); teile.push(sp); }
      const n = M.CreateCylinder('nabe', { diameter: r * 0.22, height: 0.03, tessellation: 12 }, szene); n.rotation.z = Math.PI / 2; n.position.x = sx * b * 0.53; n.bakeCurrentTransformIntoVertices(); n.material = mat('metall', t.felgenFarbe); teile.push(n); }
    const m = BAB.Mesh.MergeMeshes(teile, true, true, undefined, false, true); m.name = t.id; m.__eigeneMaterialien = true; return m;
  }
  const ANLEITUNG = `Du baust 3D-Modelle für das SD Game-Studio (thesdhub.com). Antworte NUR mit JSON in genau diesem Format, ohne Erklärungen:
{
  "name": "Name des Modells",
  "teile": [
    { "id": "eindeutiger_name", "eltern": "id eines anderen Teils oder weglassen", "form": "kiste|zylinder|kugel|kegel|torus|rad|platte|keil",
      "pos": [x, y, z], "dreh": [x°, y°, z°], "groesse": [breite, hoehe, tiefe], "durchmesser": 1, "hoehe": 1, "oben": 0, "dicke": 0.2, "achse": "x|y|z",
      "farbe": "#rrggbb", "material": "farbe|metall|chrom|gummi|glas|leuchten|holz|beton|ziegel|putz|platten|asphalt|gras|fels|sand|stoff|kunststoff", "unsichtbar": false }
  ],
  "bewegungen": [ { "teil": "id", "art": "drehen|pendeln|schieben", "achse": "x|y|z", "tempo": 90, "weite": 30, "phase": 0 } ]
}
Regeln:
- Einheit Meter. y ist oben, +z ist vorne. Der Boden liegt bei y = 0, das Modell steht darauf.
- "pos" ist relativ zum Eltern-Teil (ohne eltern: relativ zum Modell). Ein Teil mit "eltern" bewegt und dreht sich mit seinem Eltern-Teil mit – so baust du Gelenke (z. B. Arm → Unterarm → Hand, Turm → Kanone).
- kiste/platte/keil nutzen "groesse"; zylinder/kegel nutzen "durchmesser" und "hoehe" (kegel: "oben" = Durchmesser oben); kugel nutzt "durchmesser"; torus "durchmesser" und "dicke"; rad = flacher Zylinder mit "durchmesser" und "dicke", rollt um die x-Achse.
- "achse" legt bei zylinder/kegel fest, wohin die Länge zeigt (Standard y = senkrecht, z = nach vorne, z. B. Kanonenrohr).
- Unsichtbare Teile ("unsichtbar": true) sind reine Gelenkpunkte.
- Bewegungen: "drehen" = dauernd drehen (tempo in Grad pro Sekunde, z. B. Rotor, Rad), "pendeln" = hin und her (weite in Grad, z. B. Arm, Bein, Wischer), "schieben" = vor und zurück (weite in Zentimetern, z. B. Kolben).
- Glatte Formen (Autos, Rümpfe): "form": "loft" mit "schnitte": [ { "z": -2.2, "breite": 1.7, "unten": 0.35, "oben": 0.95, "rund": 0.6, "x": 0 }, … ] – Querschnitte entlang z (hinten → vorne), "rund" 0 = eckig, 1 = oval. 6 bis 20 Schnitte ergeben eine schöne Karosserie; mit einem zweiten loft baust du die Kabine/das Dach.
- "form": "schlauch" mit "punkte": [[x,y,z], …] und "durchmesser" = gebogenes Rohr (Stoßstange, Bügel, Kabel, Auspuff).
- "form": "profil" mit "punkte": [[x,y], …] (Umriss, gegen den Uhrzeigersinn) und "tiefe" = ausgeschnittene flache Form (Spoiler, Flosse, Seitenfenster).
- "form": "reifen" mit "durchmesser", "breite", "speichen", "felgenFarbe" = Rad mit Felge; Achse ist x.
- Materialien: "lack" (Autolack mit Glanz), "karbon", "chrom", "glas" (durchsichtig), "leuchten" (Scheinwerfer/Rücklichter).
- FAHRBARE AUTOS: Räder als "reifen" mit den ids "rad_vl", "rad_vr", "rad_hl", "rad_hr" (vorne/hinten, links = -x, rechts = +x), Radmitte auf y = Radius, vorne ist +z, echte Maße (z. B. 4,6 m lang, 1,9 m breit). Die Räder NICHT an andere Teile hängen (kein "eltern"). Dann kann man das Auto im Spiel fahren.
- Baue detailliert: lieber 40 bis 300 sinnvolle Teile als 5 grobe. Höchstens 1500 Teile.
- Kein Code, keine Kommentare im JSON.
Meine Bitte: `;
  window.SDTeile = { bauen, pruefen, ANLEITUNG, FORMEN, MATERIALIEN };
})();
