/* SD Engine – Spiel-Engine des SD Game-Studios.
   Grundlage: Babylon.js (Grafik, PBR-Licht, Schatten, Nachbearbeitung) + Havok (Physik).
   Spiele werden als SD-Skript geschrieben: normales JavaScript mit der deutschen SD-API (Objekt "sd").
   Alles läuft lokal im Browser. Es werden keine Daten hochgeladen. */
'use strict';
(function () {
  const B = () => window.BABYLON;
  const V = (x, y, z) => new (B().Vector3)(x, y, z);
  const farbe = (f) => (f instanceof (B().Color3) ? f : B().Color3.FromHexString(f || '#888888'));
  const klemme = (x, a, b) => Math.max(a, Math.min(b, x));
  const winkel = (a, b) => { let d = (b - a) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; };

  /* ---------- Zufall & Rauschen (gleiche Welt bei gleichem seed) ---------- */
  function zufall(seed) { let s = (seed >>> 0) || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  function rauschen(seed) {
    const p = new Uint8Array(512), r = zufall(seed); for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; } for (let i = 0; i < 256; i++) p[i + 256] = p[i];
    const g = (h, x, y) => ((h & 1) ? x : -x) + ((h & 2) ? y : -y), f = t => t * t * t * (t * (t * 6 - 15) + 10);
    return (x, y) => { const X = Math.floor(x) & 255, Y = Math.floor(y) & 255; x -= Math.floor(x); y -= Math.floor(y); const u = f(x), v = f(y);
      const a = p[X] + Y, b = p[X + 1] + Y; const l1 = g(p[a], x, y) + u * (g(p[b], x - 1, y) - g(p[a], x, y)); const l2 = g(p[a + 1], x, y - 1) + u * (g(p[b + 1], x - 1, y - 1) - g(p[a + 1], x, y - 1)); return (l1 + v * (l2 - l1)) * 0.7; };
  }

  /** Höhe des Geländes – dieselbe Formel für Engine und Szenen-Editor */
  /* Geformtes Gelände (Szenen-Editor): Raster (n+1)×(n+1) über die ganze Welt, Höhen in 0,25-m-Schritten, als Base64-Text gespeichert */
  function formenGitter(f) { if (!f) return null; if (f.werte) return f; const n = f.n | 0, roh = atob(f.d || ''), werte = new Float32Array((n + 1) * (n + 1)); for (let i = 0; i < werte.length && i < roh.length; i++) { const b = roh.charCodeAt(i); werte[i] = (b > 127 ? b - 256 : b) * 0.25; } return { n, werte }; }
  function formenText(g) { let t = ''; for (let i = 0; i < g.werte.length; i++) t += String.fromCharCode(Math.round(klemme(g.werte[i] / 0.25, -127, 127)) & 255); return { n: g.n, d: btoa(t) }; }
  function hoehenFunktion(o) {
    o = o || {}; const G = o.groesse || 600, H = o.hoehe ?? 28, ns = rauschen(o.seed || 7), flach = o.flach || [], fg = formenGitter(o.formen);
    const form = (x, z) => { const n = fg.n, u = klemme((x / G + 0.5) * n, 0, n - 1e-6), v = klemme((z / G + 0.5) * n, 0, n - 1e-6), i = u | 0, j = v | 0, fu = u - i, fv = v - j, W = fg.werte, k = j * (n + 1) + i;
      return (W[k] * (1 - fu) + W[k + 1] * fu) * (1 - fv) + (W[k + n + 1] * (1 - fu) + W[k + n + 2] * fu) * fv; };
    const roh = (x, z) => { let h = 0, a = 1, f = 1 / 160; for (let i = 0; i < 5; i++) { h += ns(x * f, z * f) * a; a *= 0.48; f *= 2.05; } return h * H + (fg ? form(x, z) : 0); };
    const hoeheBei = (x, z) => { let h = roh(x, z); for (const fl of flach) { const d = Math.hypot(x - fl[0], z - fl[1]), r = fl[2], hz = fl[3] ?? 1; if (d < r * 1.6) { const t = klemme((d - r) / (r * 0.6), 0, 1), s = t * t * (3 - 2 * t); h = hz * (1 - s) + h * s; } }
      const rand = Math.max(Math.abs(x), Math.abs(z)) / (G / 2); if (rand > 0.85) h += Math.pow((rand - 0.85) / 0.15, 2) * H * 1.2; return h; };
    return hoeheBei;
  }

  /* ---------- Töne (selbst erzeugt, keine Dateien) ---------- */
  let AC = null;
  function audioKontext() { try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); } catch (e) { return null; } return AC; }
  /** Hörer = Kamera (für 3D-Ton). WebAudio ist rechtshändig, Babylon linkshändig -> z spiegeln */
  function hoererSetzen(p, f) { if (!AC) return; const l = AC.listener; if (l.positionX) { l.positionX.value = p.x; l.positionY.value = p.y; l.positionZ.value = -p.z; l.forwardX.value = f.x; l.forwardY.value = f.y; l.forwardZ.value = -f.z; l.upX.value = 0; l.upY.value = 1; l.upZ.value = 0; } else { l.setPosition(p.x, p.y, -p.z); l.setOrientation(f.x, f.y, -f.z, 0, 1, 0); } }
  /* Mischpult: Effekte und Musik laufen über einen Kompressor (kein Übersteuern), Schüsse/Explosionen bekommen Hall */
  let BUS = null;
  function bus() { if (BUS || !audioKontext()) return BUS; const komp = AC.createDynamicsCompressor(); komp.threshold.value = -14; komp.ratio.value = 4; komp.connect(AC.destination);
    const effekte = AC.createGain(), musik = AC.createGain(), hall = AC.createConvolver(), hallG = AC.createGain(); effekte.connect(komp); musik.connect(komp); hall.connect(hallG); hallG.connect(komp); hallG.gain.value = 0.32;
    const n = AC.sampleRate * 1.8, ir = AC.createBuffer(2, n, AC.sampleRate); for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3.2) * (i < 200 ? i / 200 : 1); } hall.buffer = ir;
    BUS = { komp, effekte, musik, hall }; return BUS; }
  const rauschPuffer = {}; function rauschen1(dauer, kurve) { const k = dauer + ':' + kurve; if (!rauschPuffer[k]) { const b = AC.createBuffer(1, Math.max(1, AC.sampleRate * dauer | 0), AC.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, kurve); rauschPuffer[k] = b; } return rauschPuffer[k]; }
  function ton(art, lautstaerke, pos) {
    if (!bus()) return;
    const t = AC.currentTime, L = klemme(lautstaerke == null ? 1 : lautstaerke, 0, 1) * (pos ? 1.4 : 1); if (L < 0.02) return;
    const g = AC.createGain(); let ziel = BUS.effekte;
    if (pos && AC.createPanner) { const pn = AC.createPanner(); pn.panningModel = 'HRTF'; pn.distanceModel = 'inverse'; pn.refDistance = 8; pn.maxDistance = 500; pn.rolloffFactor = 0.6;
      if (pn.positionX) { pn.positionX.value = pos.x; pn.positionY.value = pos.y; pn.positionZ.value = -pos.z; } else pn.setPosition(pos.x, pos.y, -pos.z); pn.connect(BUS.effekte); ziel = pn; }
    g.connect(ziel);
    const knall = (dauer, kurve, fq, typ, gain, an) => { const n = AC.createBufferSource(); n.buffer = rauschen1(dauer, kurve); const f = AC.createBiquadFilter(); f.type = typ || 'lowpass'; f.frequency.value = fq; n.connect(f); const gg = AC.createGain(); gg.gain.value = gain; f.connect(gg); gg.connect(g); n.start(t + (an || 0)); return gg; };
    const ton1 = (f0, f1, dauer, typ, gain, an) => { const o = AC.createOscillator(), gg = AC.createGain(), t0 = t + (an || 0); o.type = typ; o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dauer); gg.gain.setValueAtTime(gain, t0); gg.gain.exponentialRampToValueAtTime(0.0001, t0 + dauer); o.connect(gg); gg.connect(g); o.start(t0); o.stop(t0 + dauer + 0.02); };
    const halle = (st) => { const hs = AC.createGain(); hs.gain.value = st; g.connect(hs); hs.connect(BUS.hall); };
    g.gain.value = L;
    if (art === 'schuss' || art === 'schrot' || art === 'pistole') {   // Knall (hell) + Druck (tief) + Hall
      const hart = art === 'schrot' ? 0.45 : art === 'pistole' ? 0.18 : 0.25;
      knall(hart, art === 'schrot' ? 2 : 3.5, art === 'pistole' ? 2600 : 1700, 'lowpass', 0.5); knall(0.03, 1, 5000, 'highpass', 0.35); ton1(art === 'schrot' ? 110 : 150, 40, 0.16, 'sine', 0.55); halle(art === 'pistole' ? 0.35 : 0.5);
    } else if (art === 'explosion') { knall(1.6, 2.2, 900, 'lowpass', 0.5); knall(0.5, 4, 3000, 'lowpass', 0.22); ton1(70, 25, 0.9, 'sine', 0.5); halle(0.6); }
    else if (art === 'muenze') { ton1(1320, 1320, 0.09, 'square', 0.1); ton1(1760, 1760, 0.25, 'square', 0.1, 0.08); }
    else if (art === 'schritt') knall(0.06, 2, 700, 'lowpass', 0.25);
    else if (art === 'klick') ton1(2400, 1800, 0.03, 'square', 0.08);
    else if (art === 'tuer') { knall(0.35, 1.5, 400, 'lowpass', 0.5); ton1(180, 90, 0.3, 'triangle', 0.15); }
    else if (art === 'hupe') { ton1(415, 410, 0.4, 'square', 0.07); ton1(520, 515, 0.4, 'square', 0.06); }
    else if (art === 'alarm') { for (let k = 0; k < 4; k++) ton1(880, 660, 0.22, 'sawtooth', 0.08, k * 0.25); }
    else if (art === 'sieg') { [523, 659, 784, 1047].forEach((f, k) => ton1(f, f, 0.5, 'triangle', 0.14, k * 0.12)); }
    else if (art === 'treffer') { ton1(1400, 900, 0.06, 'square', 0.1); knall(0.04, 2, 3000, 'bandpass', 0.2); }
    else if (art === 'kopf') { ton1(2200, 1600, 0.09, 'square', 0.13); ton1(3300, 3000, 0.05, 'sine', 0.08, 0.03); }
    else { const def = { aufheben: [660, 990, 0.15, 'triangle', 0.2], nachladen: [320, 260, 0.07, 'square', 0.08], schaden: [140, 90, 0.2, 'sawtooth', 0.2], tot: [90, 40, 0.6, 'sawtooth', 0.25] }[art] || [440, 440, 0.1, 'sine', 0.1];
      ton1(def[0], def[1], def[2], def[3], def[4]); if (art === 'nachladen') knall(0.05, 2, 2500, 'bandpass', 0.25, 0.12); }
  }

  /* ---------- Waffen ---------- */
  const WAFFEN = {
    pistole: { name: 'Pistole', schaden: 28, kadenz: 0.2, magazin: 12, reserve: 48, streuung: 0.018, zielStreuung: 0.006, nachladen: 1.3, auto: false, kugeln: 1, rueckstoss: 0.012, ton: 'pistole', laenge: 0.35, modell: 'pistole' },
    gewehr: { modell: 'sturm', name: 'Sturmgewehr M-4', schaden: 21, kadenz: 0.1, magazin: 30, reserve: 90, streuung: 0.014, zielStreuung: 0.004, nachladen: 2.0, auto: true, kugeln: 1, rueckstoss: 0.009, ton: 'schuss', laenge: 0.8 },
    schrotflinte: { modell: 'schrot', name: 'Pumpflinte S-6', schaden: 11, kadenz: 0.85, magazin: 6, reserve: 24, streuung: 0.065, zielStreuung: 0.045, nachladen: 2.6, auto: false, kugeln: 9, rueckstoss: 0.04, ton: 'schrot', laenge: 0.9 },
    scharfschuetze: { modell: 'sniper', name: 'Repetiergewehr K-98', schaden: 85, kadenz: 1.3, magazin: 5, reserve: 15, streuung: 0.03, zielStreuung: 0.0005, nachladen: 2.8, auto: false, kugeln: 1, rueckstoss: 0.05, ton: 'schuss', laenge: 1.1, zoom: 0.25 },
  };

  // Weitere Waffen (eigene Namen, Klassen wie in großen Battle-Royale-Spielen)
  Object.assign(WAFFEN, {
    revolver: { modell: 'pistole', name: 'Revolver R-6', schaden: 55, kadenz: 0.55, magazin: 6, reserve: 24, streuung: 0.02, zielStreuung: 0.004, nachladen: 2.2, auto: false, kugeln: 1, rueckstoss: 0.03, ton: 'pistole', laenge: 0.32 },
    mp: { modell: 'mp', name: 'Maschinenpistole MP-9', schaden: 16, kadenz: 0.07, magazin: 30, reserve: 120, streuung: 0.022, zielStreuung: 0.01, nachladen: 1.8, auto: true, kugeln: 1, rueckstoss: 0.006, ton: 'pistole', laenge: 0.55 },
    vektor: { modell: 'mp', name: 'Maschinenpistole V-45', schaden: 15, kadenz: 0.055, magazin: 25, reserve: 100, streuung: 0.02, zielStreuung: 0.009, nachladen: 1.7, auto: true, kugeln: 1, rueckstoss: 0.005, ton: 'pistole', laenge: 0.5 },
    ak: { modell: 'sturm', name: 'Sturmgewehr K-47', schaden: 27, kadenz: 0.11, magazin: 30, reserve: 90, streuung: 0.018, zielStreuung: 0.005, nachladen: 2.3, auto: true, kugeln: 1, rueckstoss: 0.014, ton: 'schuss', laenge: 0.85 },
    bullpup: { modell: 'sturm', name: 'Bullpup AU-9', schaden: 22, kadenz: 0.085, magazin: 30, reserve: 90, streuung: 0.012, zielStreuung: 0.003, nachladen: 2.5, auto: true, kugeln: 1, rueckstoss: 0.008, ton: 'schuss', laenge: 0.7 },
    dmr: { modell: 'dmr', name: 'Präzisionsgewehr SK-14', schaden: 46, kadenz: 0.3, magazin: 10, reserve: 40, streuung: 0.02, zielStreuung: 0.0012, nachladen: 2.6, auto: false, kugeln: 1, rueckstoss: 0.025, ton: 'schuss', laenge: 0.95, zoom: 0.4 },
    magnum: { modell: 'sniper', name: 'Magnum-Gewehr AM-3', schaden: 120, kadenz: 1.8, magazin: 5, reserve: 10, streuung: 0.035, zielStreuung: 0.0004, nachladen: 3.5, auto: false, kugeln: 1, rueckstoss: 0.06, ton: 'schuss', laenge: 1.2, zoom: 0.18 },
    autoschrot: { modell: 'schrot', name: 'Automatikflinte S-12', schaden: 9, kadenz: 0.3, magazin: 5, reserve: 25, streuung: 0.07, zielStreuung: 0.05, nachladen: 3.0, auto: false, kugeln: 9, rueckstoss: 0.03, ton: 'schrot', laenge: 0.85 },
    mg: { modell: 'mg', name: 'Maschinengewehr M-249', schaden: 22, kadenz: 0.075, magazin: 75, reserve: 150, streuung: 0.022, zielStreuung: 0.008, nachladen: 5.0, auto: true, kugeln: 1, rueckstoss: 0.012, ton: 'schuss', laenge: 1.0 },
    armbrust: { modell: 'armbrust', name: 'Armbrust', schaden: 90, kadenz: 1.5, magazin: 1, reserve: 12, streuung: 0.01, zielStreuung: 0.001, nachladen: 3.0, auto: false, kugeln: 1, rueckstoss: 0.02, ton: 'klick', laenge: 0.8, leise: true },
  });

  /* =================================================================== */
  async function starten(canvas, code, opt) {
    opt = opt || {};
    const BAB = B(); if (!BAB) throw new Error('Babylon.js wurde nicht geladen (Internet nötig beim ersten Start).');
    const engine = new BAB.Engine(canvas, true, { stencil: true, preserveDrawingBuffer: !!opt.screenshot, powerPreference: 'high-performance' });
    const qualitaet = opt.qualitaet || 'mittel';
    engine.setHardwareScalingLevel(qualitaet === 'niedrig' ? 1.5 : 1 / Math.min(window.devicePixelRatio || 1, qualitaet === 'hoch' ? 1.5 : 1));
    const szene = new BAB.Scene(engine);
    szene.clearColor = new BAB.Color4(0.55, 0.7, 0.9, 1);
    szene.collisionsEnabled = false; szene.skipPointerMovePicking = true;
    const hk = await window.HavokPhysics({ locateFile: () => opt.havokWasm });
    const SCHWERKRAFT = V(0, -9.81, 0);
    szene.enablePhysics(SCHWERKRAFT, new BAB.HavokPlugin(true, hk));

    const kamera = new BAB.UniversalCamera('kamera', V(0, 10, -10), szene); kamera.minZ = 0.1; kamera.maxZ = 3000; kamera.fov = 1.0; kamera.inputs.clear();
    const hell = new BAB.HemisphericLight('himmelLicht', V(0.2, 1, 0.1), szene); hell.intensity = 0.55; hell.groundColor = new BAB.Color3(0.35, 0.33, 0.3);
    const sonne = new BAB.DirectionalLight('sonne', V(-0.45, -1, 0.35).normalize(), szene); sonne.intensity = 2.6; sonne.position = V(200, 400, -150);
    const SCH = { niedrig: [1024, 2], mittel: [2048, 2], hoch: [4096, 3] }[qualitaet] || [2048, 2];
    const schatten = new BAB.CascadedShadowGenerator(SCH[0], sonne); schatten.numCascades = SCH[1]; schatten.lambda = 0.85; schatten.shadowMaxZ = { niedrig: 90, mittel: 160, hoch: 260 }[qualitaet] || 160; schatten.stabilizeCascades = true;
    schatten.usePercentageCloserFiltering = true; schatten.filteringQuality = qualitaet === 'hoch' ? BAB.ShadowGenerator.QUALITY_HIGH : BAB.ShadowGenerator.QUALITY_MEDIUM; schatten.bias = 0.004; schatten.normalBias = 0.02;
    // Kleinteile (Felgen, Speichen, Lämpchen …) werfen keine Schatten – spart viele Zeichenaufrufe, sieht man kaum
    { const add = schatten.addShadowCaster.bind(schatten); schatten.addShadowCaster = (m, mitKindern) => { try { if (!mitKindern && m.getBoundingInfo && m.getTotalVertices && m.getTotalVertices() > 0) { const bi = m.getBoundingInfo(), g = bi.maximum.subtract(bi.minimum), sk = m.scaling ? Math.max(Math.abs(m.scaling.x), Math.abs(m.scaling.y), Math.abs(m.scaling.z)) : 1; if (g.length() * sk < 0.55) return schatten; } } catch (e) { /* egal */ } return add(m, mitKindern); }; }
    const BK = window.SDBaukasten ? window.SDBaukasten.erstellen(BAB, szene) : null;
    const EIGENE = {}; if (window.SDAssets) { try { (await window.SDAssets.alle()).forEach(a => { EIGENE[a.name] = a; }); } catch (e) { /* kein Speicher (privates Fenster) */ } }
    (window.SD_EIGENE_EXTRA || []).forEach(a => { EIGENE[a.name] = a; });   // veröffentlichte Spiele bringen ihre Dateien mit
    const blobUrls = []; const urlVon = b => { const u = URL.createObjectURL(b); blobUrls.push(u); return u; };
    const texVon = (blob, srgb) => { const t = new BAB.Texture(urlVon(blob), szene, false, false); return t; };
    function eigene(name, typ) { const a = EIGENE[window.SDAssets ? window.SDAssets.name(name) : name]; if (!a) throw new Error('„' + name + '“ ist nicht in „Meine Modelle“ gespeichert (Werkstatt → 📦 Meine Modelle).'); if (typ && a.typ !== typ) throw new Error('„' + name + '“ ist kein ' + typ); return a; }
    const fotoGeladen = {};
    function fotoMaterial(art) { const n = art.slice(5); if (fotoGeladen[n]) return; const a = eigene(n, 'foto-material'); BK.eigeneOberflaeche(art, texVon(a.bild), a.normal ? texVon(a.normal) : null, { groesse: a.groesse, rau: a.rau }); fotoGeladen[n] = true; }
    szene.fogMode = BAB.Scene.FOGMODE_EXP2; szene.fogDensity = 0.0022; szene.fogColor = new BAB.Color3(0.68, 0.76, 0.86);
    szene.imageProcessingConfiguration.toneMappingEnabled = true; szene.imageProcessingConfiguration.toneMappingType = BAB.ImageProcessingConfiguration.TONEMAPPING_ACES; szene.imageProcessingConfiguration.exposure = 0.95;
    if (qualitaet !== 'niedrig') {
      const pipe = new BAB.DefaultRenderingPipeline('pipeline', true, szene, [kamera]);
      pipe.fxaaEnabled = true; pipe.bloomEnabled = true; pipe.bloomThreshold = 0.85; pipe.bloomWeight = 0.25; pipe.bloomKernel = 48;
      pipe.imageProcessing.vignetteEnabled = true; pipe.imageProcessing.vignetteWeight = 1.6; pipe.imageProcessing.contrast = 1.12;
      if (qualitaet === 'hoch') { pipe.samples = 4; try { const ao = new BAB.SSAO2RenderingPipeline('ao', szene, { ssaoRatio: 0.5, blurRatio: 1 }, [kamera]); ao.radius = 1.2; ao.totalStrength = 1.1; ao.samples = 12; } catch (e) { /* ältere Grafik ohne SSAO */ } }
    }

    const punktTex = (() => { const t = new BAB.DynamicTexture('punkt', 32, szene, false), c = t.getContext(), g = c.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 32, 32); t.update(); t.hasAlpha = true; return t; })();
    /* ---------- Materialien ---------- */
    const matCache = {};
    function material(f, rauheit, metall, extra) {
      const key = f + '|' + rauheit + '|' + metall + '|' + (extra ? JSON.stringify(extra) : '');
      if (matCache[key]) return matCache[key];
      const m = new BAB.PBRMetallicRoughnessMaterial('m' + Object.keys(matCache).length, szene);
      m.baseColor = farbe(f); m.roughness = rauheit == null ? 0.8 : rauheit; m.metallic = metall || 0;
      if (extra && extra.leuchten) m.emissiveColor = farbe(extra.leuchten);
      if (extra && extra.alpha != null) { m.alpha = extra.alpha; m.transparencyMode = 2; }
      return (matCache[key] = m);
    }
    let detailTex = null;
    function detailTextur() {
      if (detailTex) return detailTex; const n = 256, t = new BAB.DynamicTexture('detail', n, szene, true), c = t.getContext(), img = c.createImageData(n, n), r = zufall(5), ns = rauschen(9);
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const v = 200 + ns(x / 16, y / 16) * 30 + ns(x / 4, y / 4) * 14 + (r() - 0.5) * 22, i = (y * n + x) * 4; img.data[i] = img.data[i + 1] = img.data[i + 2] = klemme(v, 0, 255); img.data[i + 3] = 255; }
      c.putImageData(img, 0, 0); t.update(); t.wrapU = t.wrapV = 1; return (detailTex = t);
    }

    /* ---------- Objekte ---------- */
    const objekte = [];
    function fertig(mesh, o) {
      o = o || {};
      if (o.pos) mesh.position = V(o.pos[0], o.pos[1], o.pos[2]);
      if (o.drehung) mesh.rotation = V((o.drehung[0] || 0) * Math.PI / 180, (o.drehung[1] || 0) * Math.PI / 180, (o.drehung[2] || 0) * Math.PI / 180);
      if (o.textur && BK) { if (String(o.textur).startsWith('foto:')) fotoMaterial(o.textur); mesh.material = BK.material(o.textur, o.farbe || '#ffffff', { rau: o.rauheit, metall: o.metall, leuchten: o.leuchten }); mesh.computeWorldMatrix(true); BK.weltUV(mesh, o.kachel || BK.kachelGroesse(o.textur)); }
      else mesh.material = material(o.farbe || '#9a9a9a', o.rauheit, o.metall, o.leuchten || o.alpha != null ? { leuchten: o.leuchten, alpha: o.alpha } : null);
      if (o.schatten !== false) { schatten.addShadowCaster(mesh); mesh.receiveShadows = true; }
      const art = mesh.__art;
      if (o.physik !== false) {
        const typ = { box: BAB.PhysicsShapeType.BOX, kugel: BAB.PhysicsShapeType.SPHERE, zylinder: BAB.PhysicsShapeType.CYLINDER, fels: BAB.PhysicsShapeType.CONVEX_HULL }[art] || BAB.PhysicsShapeType.BOX;
        mesh.__physik = new BAB.PhysicsAggregate(mesh, typ, { mass: o.masse || 0, friction: o.reibung == null ? 0.8 : o.reibung, restitution: o.sprung || 0.05 }, szene);
      }
      if (!o.statisch && !o.masse) { mesh.freezeWorldMatrix(); if (ctx && o.physik !== false) { const bb = mesh.getBoundingInfo().boundingBox; const ex = bb.maximumWorld.subtract(bb.minimumWorld); if (ex.x > 0.7 && ex.z > 0.7 && ex.y > 0.6) ctx.sperren.push({ x: (bb.maximumWorld.x + bb.minimumWorld.x) / 2, z: (bb.maximumWorld.z + bb.minimumWorld.z) / 2, w: ex.x, d: ex.z }); } }
      mesh.metadata = Object.assign({}, mesh.metadata, o.daten || {}, { leben: o.leben });
      objekte.push(mesh); return mesh;
    }
    const box = o => { const m = BAB.MeshBuilder.CreateBox('box', { width: (o.groesse || [1])[0], height: (o.groesse || [1, 1])[1], depth: (o.groesse || [1, 1, 1])[2] }, szene); m.__art = 'box'; return fertig(m, o); };
    const kugel = o => { const m = BAB.MeshBuilder.CreateSphere('kugel', { diameter: (o.radius || 0.5) * 2, segments: 20 }, szene); m.__art = 'kugel'; return fertig(m, o); };
    const zylinder = o => { const m = BAB.MeshBuilder.CreateCylinder('zyl', { diameter: (o.radius || 0.5) * 2, height: o.hoehe || 1, tessellation: 20 }, szene); m.__art = 'zylinder'; return fertig(m, o); };
    const fels = o => { const m = BAB.MeshBuilder.CreateIcoSphere('fels', { radius: 1, subdivisions: 2, flat: true }, szene); const r = zufall(o.seed || 1);
      const p = m.getVerticesData('position'); const key = (i) => p[i].toFixed(3) + p[i + 1].toFixed(3) + p[i + 2].toFixed(3), off = {};
      for (let i = 0; i < p.length; i += 3) { const k = key(i); if (off[k] == null) off[k] = 0.75 + r() * 0.5; const f = off[k]; p[i] *= f; p[i + 1] *= f * 0.75; p[i + 2] *= f; }
      m.setVerticesData('position', p); m.convertToFlatShadedMesh(); const s = o.groesse || 1.5; m.scaling = V(s * (0.8 + r() * 0.6), s * (0.6 + r() * 0.5), s * (0.8 + r() * 0.6)); m.bakeCurrentTransformIntoVertices(); m.__art = 'fels';
      return fertig(m, Object.assign({ farbe: '#7d7a74', rauheit: 0.95 }, o)); };

    /* ---------- Himmel ---------- */
    function himmel(o) {
      o = o || {}; const zeit = o.zeit || 'tag';
      const P = { tag: ['#3a73c4', '#cfe0ee', [-0.4, -1, 0.3], 2.1, 0.5, '#fff4e0'], morgen: ['#5b86c4', '#f3d2b0', [1, -0.45, 0.3], 2.0, 0.5, '#ffd8b0'], abend: ['#2c3d6b', '#f0a070', [-1, -0.35, 0.2], 1.8, 0.4, '#ffb070'], nacht: ['#05080f', '#1b2338', [-0.3, -1, 0.2], 0.25, 0.12, '#9fb4ff'] }[zeit] || null;
      const [oben, horizont, richt, sInt, hInt, sFarbe] = P || [o.oben || '#3a73c4', o.horizont || '#cfe0ee', [-0.4, -1, 0.3], 2.6, 0.55, '#fff4e0'];
      const kuppel = BAB.MeshBuilder.CreateSphere('himmelKuppel', { diameter: 2400, segments: 24, sideOrientation: BAB.Mesh.BACKSIDE }, szene);
      const pos = kuppel.getVerticesData('position'), c = [], co = farbe(oben), ch = farbe(horizont), cu = BAB.Color3.Lerp(ch, new BAB.Color3(0.35, 0.38, 0.42), 0.5);
      for (let i = 0; i < pos.length; i += 3) { const y = pos[i + 1] / 1200; const f = y >= 0 ? BAB.Color3.Lerp(ch, co, Math.pow(y, 0.55)) : BAB.Color3.Lerp(ch, cu, Math.min(1, -y * 4)); c.push(f.r, f.g, f.b, 1); }
      kuppel.setVerticesData('color', c); const km = new BAB.StandardMaterial('himmelMat', szene); km.disableLighting = true; km.emissiveColor = new BAB.Color3(1, 1, 1); km.diffuseColor = new BAB.Color3(0, 0, 0); km.specularColor = new BAB.Color3(0, 0, 0); km.backFaceCulling = false;
      kuppel.material = km; kuppel.infiniteDistance = true; kuppel.isPickable = false; kuppel.applyFog = false; kuppel.renderingGroupId = 0;
      sonne.direction = V(richt[0], richt[1], richt[2]).normalize(); sonne.intensity = sInt; sonne.diffuse = farbe(sFarbe); hell.intensity = hInt; hell.diffuse = BAB.Color3.Lerp(ch, co, 0.5).scale(1.2);
      const scheibe = BAB.MeshBuilder.CreatePlane('sonnenScheibe', { size: zeit === 'nacht' ? 40 : 90 }, szene); scheibe.position = sonne.direction.scale(-1100); scheibe.billboardMode = BAB.Mesh.BILLBOARDMODE_ALL; scheibe.infiniteDistance = true; scheibe.isPickable = false; scheibe.applyFog = false;
      const sm = new BAB.StandardMaterial('sonnenMat', szene); sm.disableLighting = true; sm.emissiveColor = farbe(sFarbe).scale(zeit === 'nacht' ? 0.8 : 1.6); sm.opacityTexture = punktTex; sm.diffuseTexture = punktTex; scheibe.material = sm;
      const probe = new BAB.ReflectionProbe('umgebung', 128, szene); probe.renderList.push(kuppel); probe.refreshRate = BAB.RenderTargetTexture.REFRESHRATE_RENDER_ONCE; szene.environmentTexture = probe.cubeTexture; szene.environmentIntensity = zeit === 'nacht' ? 0.25 : 0.9;
      szene.fogColor = BAB.Color3.Lerp(ch, co, 0.15); szene.clearColor = BAB.Color4.FromColor3(ch, 1);
      if (o.nebel != null) szene.fogDensity = o.nebel;
    }

    /* ---------- Gelände ---------- */
    let gel = null;
    function gelaende(o) {
      o = o || {}; const G = o.groesse || 600, N = o.aufloesung || 180, H = o.hoehe ?? 28, ns = rauschen(o.seed || 7), flach = o.flach || [];
      const hoeheBei = hoehenFunktion(o);
      if (G > 900 || o.kacheln) return grosseWelt(o, G, H, ns, hoeheBei);
      const m = BAB.MeshBuilder.CreateGround('gelaende', { width: G, height: G, subdivisions: N, updatable: true }, szene);
      const p = m.getVerticesData('position'), farben = []; for (let i = 0; i < p.length; i += 3) p[i + 1] = hoeheBei(p[i], p[i + 2]);
      m.setVerticesData('position', p); const n = []; BAB.VertexData.ComputeNormals(p, m.getIndices(), n); m.setVerticesData('normal', n);
      const gras = farbe(o.farbe || '#5d7f3a'), gras2 = farbe('#7d8f45'), fels2 = farbe('#7b746a'), sand = farbe('#c9b98a');
      for (let i = 0; i < p.length; i += 3) { const steil = 1 - n[i + 1], h = p[i + 1], w = ns(p[i] / 25, p[i + 2] / 25) * 0.5 + 0.5; let c = BAB.Color3.Lerp(gras, gras2, w);
        if (h < (o.wasser ?? -100) + 1.5) c = sand; if (steil > 0.22) c = BAB.Color3.Lerp(c, fels2, klemme((steil - 0.22) * 5, 0, 1)); farben.push(c.r, c.g, c.b, 1); }
      m.setVerticesData('color', farben);
      const mat = new BAB.PBRMaterial('gelaendeMat', szene); mat.albedoTexture = detailTextur(); mat.albedoTexture.uScale = mat.albedoTexture.vScale = G / 6; mat.metallic = 0; mat.roughness = 0.95; mat.environmentIntensity = 0.5;
      m.material = mat; m.receiveShadows = true; m.useVertexColors = true; m.hasVertexAlpha = false;
      new BAB.PhysicsAggregate(m, BAB.PhysicsShapeType.MESH, { mass: 0, friction: 0.9 }, szene); m.freezeWorldMatrix(); m.metadata = { boden: true };
      if (o.wasser != null) { const w = BAB.MeshBuilder.CreateGround('wasser', { width: G * 3, height: G * 3 }, szene); w.position.y = o.wasser; w.material = material('#2f6f8f', 0.08, 0.1, { alpha: 0.78 }); w.isPickable = false; }
      gel = { groesse: G, hoeheBei, mesh: m }; if (ctx) { ctx.wasserHoehe = o.wasser; } return gel;
    }
    /* ---------- Große Welten: Gelände aus Kacheln (160 m), 3 Detailstufen mit Schürzen gegen Lücken, Physik nur in der Nähe ---------- */
    function grosseWelt(o, G, H, ns, hoeheBei) {
      const K = 160, nK = Math.ceil(G / K), start = -nK * K / 2, gras = farbe(o.farbe || '#5d7f3a'), gras2 = farbe('#7d8f45'), fels2 = farbe('#7b746a'), sand = farbe('#c9b98a'), W = o.wasser ?? -100;
      const mat = new BAB.PBRMaterial('gelaendeMat', szene); mat.albedoTexture = detailTextur(); mat.albedoTexture.uScale = mat.albedoTexture.vScale = 1 / 6; mat.metallic = 0; mat.roughness = 0.95; mat.environmentIntensity = 0.5;
      const STUFEN = qualitaet === 'niedrig' ? [32, 12, 4] : [64, 20, 6];
      function kachelMesh(x0, z0, n, name, mitFarbe) {   // eigenes Gitter + Schürze rundherum (2 Zellen tief nach unten)
        const pos = [], ind = [], nor = [], col = [], uv = [], d = K / n, idx = (i, j) => j * (n + 1) + i;
        for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) { const x = x0 + i * d, z = z0 + j * d; pos.push(x, hoeheBei(x, z), z); uv.push(x, z); }
        for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) ind.push(idx(i, j), idx(i, j + 1), idx(i + 1, j), idx(i + 1, j), idx(i, j + 1), idx(i + 1, j + 1));
        BAB.VertexData.ComputeNormals(pos, ind, nor);
        const rand = []; for (let i = 0; i < n; i++) rand.push([idx(i, 0), idx(i + 1, 0)]); for (let j = 0; j < n; j++) rand.push([idx(n, j), idx(n, j + 1)]); for (let i = n; i > 0; i--) rand.push([idx(i, n), idx(i - 1, n)]); for (let j = n; j > 0; j--) rand.push([idx(0, j), idx(0, j - 1)]);
        const basis = pos.length / 3;
        rand.forEach(([a, b2], k) => { for (const v of [a, b2]) { pos.push(pos[v * 3], pos[v * 3 + 1] - d * 2, pos[v * 3 + 2]); nor.push(nor[v * 3], nor[v * 3 + 1], nor[v * 3 + 2]); uv.push(uv[v * 2], uv[v * 2 + 1]); } const u = basis + k * 2; ind.push(a, u, b2, b2, u, u + 1); });
        const anzahl = pos.length / 3; for (let v = 0; v < anzahl; v++) { const vv = v < basis ? v : null, x = pos[v * 3], h = pos[v * 3 + 1], z = pos[v * 3 + 2], steil = 1 - nor[v * 3 + 1], w = ns(x / 25, z / 25) * 0.5 + 0.5;
          let c = BAB.Color3.Lerp(gras, gras2, w); if (h < W + 1.5 && vv != null) c = sand; if (steil > 0.22) c = BAB.Color3.Lerp(c, fels2, klemme((steil - 0.22) * 5, 0, 1)); col.push(c.r, c.g, c.b, 1); }
        const vd = new BAB.VertexData(); vd.positions = pos; vd.indices = ind; vd.normals = nor; vd.uvs = uv; if (mitFarbe) vd.colors = col;
        const m = new BAB.Mesh(name, szene); vd.applyToMesh(m); m.material = mat; m.useVertexColors = mitFarbe; m.isPickable = name === 'gelaende'; m.freezeWorldMatrix(); m.metadata = { boden: true }; return m;
      }
      const kacheln = [];
      for (let kj = 0; kj < nK; kj++) for (let ki = 0; ki < nK; ki++) {
        const x0 = start + ki * K, z0 = start + kj * K, hoch = kachelMesh(x0, z0, STUFEN[0], 'gelaende', true), mittel = kachelMesh(x0, z0, STUFEN[1], 'gelaendeL1', true), fern = kachelMesh(x0, z0, STUFEN[2], 'gelaendeL2', true);
        hoch.receiveShadows = true; mittel.receiveShadows = true; hoch.addLODLevel(260, mittel); hoch.addLODLevel(700, fern);
        kacheln.push({ x: x0 + K / 2, z: z0 + K / 2, mesh: hoch, phys: null });
      }
      // Physik nur für Kacheln in der Nähe von Spieler, Fahrzeugen und Gegnern (spart viel Rechenzeit)
      let pruefZeit = 0;
      const pe = szene.getPhysicsEngine();
      function physikNachfuehren(dt, sofort) { pruefZeit += dt; if (!sofort && pruefZeit < 0.12) return; pruefZeit = 0;
        const punkte = [kamera.position]; if (spieler && spieler.cc) punkte.push(spieler.cc.getPosition()); for (const b of bots) if (b.cc && !b.tot) punkte.push(b.cc.getPosition());
        for (const bd of (pe && pe.getBodies ? pe.getBodies() : [])) if (bd.transformNode && bd.getMotionType && bd.getMotionType() === BAB.PhysicsMotionType.DYNAMIC) punkte.push(bd.transformNode.position);   // Autos, Kisten, Granaten …
        for (const k of kacheln) { let nah = false; for (const p of punkte) if (Math.abs(p.x - k.x) < K * 1.25 && Math.abs(p.z - k.z) < K * 1.25) { nah = true; break; }
          if (nah && !k.phys) k.phys = new BAB.PhysicsAggregate(k.mesh, BAB.PhysicsShapeType.MESH, { mass: 0, friction: 0.9 }, szene);
          else if (!nah && k.phys) { const weit = punkte.every(p => Math.abs(p.x - k.x) > K * 1.7 || Math.abs(p.z - k.z) > K * 1.7); if (weit) { k.phys.dispose(); k.phys = null; } } } }
      if (o.wasser != null) { const w = BAB.MeshBuilder.CreateGround('wasser', { width: G * 2.2, height: G * 2.2, subdivisions: 2 }, szene); w.position.y = o.wasser; w.material = material('#2f6f8f', 0.08, 0.1, { alpha: 0.78 }); w.isPickable = false; }
      gel = { groesse: G, hoeheBei, mesh: kacheln[0].mesh, kacheln, physikNachfuehren }; if (ctx) { ctx.wasserHoehe = o.wasser; }
      kachelPhysik = physikNachfuehren; physikNachfuehren(0, true); return gel;
    }
    let kachelPhysik = null;
    const hoehe = (x, z) => (gel ? gel.hoeheBei(x, z) : 0);

    /* ---------- Bäume (Instanzen: tausende möglich) ---------- */
    const baumVorlagen = {};
    function vorlagen(art, o) {
      const key = art + '|' + (o.blattFarbe || '') + '|' + (o.hoehe || ''); if (baumVorlagen[key]) return baumVorlagen[key];
      const liste = [];
      for (let v = 0; v < 3; v++) {
        let mesh, stamm, H;
        if (BK) { const b = BK.baum({ art, hoehe: (o.hoehe || (art === 'nadel' ? 13 : art === 'palme' ? 9 : art === 'busch' ? 1.6 : 9)) * (0.85 + v * 0.15), seed: (o.seed || 3) * 10 + v, blattFarbe: o.blattFarbe, dichte: o.dichte || 1, aeste: o.aeste || 3, tiefe: o.tiefe || 3 }); mesh = b.mesh; stamm = b.stammRadius; H = b.hoehe; }
        else { const st = BAB.MeshBuilder.CreateCylinder('stamm', { height: 4, diameterTop: 0.35, diameterBottom: 0.55, tessellation: 8 }, szene); st.position.y = 2; st.material = material('#5a3f2a', 0.9);
          const k1 = BAB.MeshBuilder.CreateCylinder('krone', { height: 6, diameterTop: 0, diameterBottom: 4.2, tessellation: 9 }, szene); k1.position.y = 6; k1.material = material('#2f5a2a', 0.85); mesh = BAB.Mesh.MergeMeshes([st, k1], true, true, undefined, false, true); stamm = 0.3; H = 9; }
        mesh.isVisible = false; mesh.isPickable = false; mesh.position.y = -1000; schatten.addShadowCaster(mesh); mesh.receiveShadows = true;
        liste.push({ mesh, form: stamm > 0.05 ? new BAB.PhysicsShapeCylinder(V(0, 0, 0), V(0, Math.min(H * 0.5, 5), 0), stamm, szene) : null });
      }
      return (baumVorlagen[key] = liste);
    }
    /** baeume({ anzahl, bereich, seed, art:'laub'|'nadel'|'palme'|'busch'|'herbst'|'gemischt', frei:[[x,z,r]], minHoehe, maxHoehe }) */
    function baeume(o) {
      o = o || {}; const r = zufall(o.seed || 3), anzahl = o.anzahl || 200, ber = o.bereich || 250, frei = o.frei || [], mitte = o.mitte || [0, 0];
      const arten = o.art === 'gemischt' || !o.art ? ['laub', 'nadel', 'laub', 'nadel', 'busch'] : [o.art];
      let n = 0, versuche = 0;
      while (n < anzahl && versuche++ < anzahl * 20) {
        const x = mitte[0] + (r() * 2 - 1) * ber, z = mitte[1] + (r() * 2 - 1) * ber; if (frei.some(f => Math.hypot(x - f[0], z - f[1]) < f[2])) continue; const y = hoehe(x, z);
        if (o.minHoehe != null && y < o.minHoehe) continue; if (o.maxHoehe != null && y > o.maxHoehe) continue;
        const art = arten[Math.floor(r() * arten.length)], v = vorlagen(art, o)[Math.floor(r() * 3)];
        const b = v.mesh.createInstance('baum'); const s = 0.8 + r() * 0.45; b.position = V(x, y - 0.15, z); b.scaling = V(s, s, s); b.rotation.y = r() * 6.3; b.isPickable = true; b.freezeWorldMatrix();
        if (v.form && ctx) ctx.baumPunkte.push([x, z]);
        if (v.form) { const knoten = new BAB.TransformNode('baumPhysik', szene); knoten.position = b.position.clone(); knoten.scaling = V(s, s, s); const body = new BAB.PhysicsBody(knoten, BAB.PhysicsMotionType.STATIC, false, szene); body.shape = v.form; }
        n++;
      }
      return n;
    }

    /* ---------- Häuser (begehbar, mit Tür, Fenstern, optional Dach-Aufgang) ---------- */
    function haus(o) {
      if (BK) {
        const x = o.pos[0], z = o.pos[2], y0 = (o.pos[1] ?? hoehe(x, z)) - 0.15, dreh = (o.drehung || 0) * Math.PI / 180;
        const g = BK.gebaeude({ breite: o.breite, tiefe: o.tiefe, stockwerke: o.stockwerke, material: o.material || 'putz', farbe: o.farbe, dach: o.dach || 'flach', balkone: o.balkone, dachTreppe: o.dachTreppe, seed: o.seed || Math.round(Math.abs(x * 7 + z * 13)) });
        g.mesh.position = V(x, y0, z); g.mesh.rotation.y = dreh; g.mesh.computeWorldMatrix(true); schatten.addShadowCaster(g.mesh); g.mesh.receiveShadows = true; g.mesh.freezeWorldMatrix();
        const welt = g.mesh.getWorldMatrix();
        for (const k of g.kollision) { const lokal = BAB.Matrix.Compose(V(1, 1, 1), BAB.Quaternion.RotationAxis(V(1, 0, 0), k.rx || 0), V(k.p[0], k.p[1], k.p[2])); const m = lokal.multiply(welt); const sc = new BAB.Vector3(), q = new BAB.Quaternion(), p = new BAB.Vector3(); m.decompose(sc, q, p);
          const n = new BAB.TransformNode('hausPhysik', szene); n.position = p; n.rotationQuaternion = q; const body = new BAB.PhysicsBody(n, BAB.PhysicsMotionType.STATIC, false, szene); body.shape = new BAB.PhysicsShapeBox(V(0, 0, 0), BAB.Quaternion.Identity(), V(k.g[0], k.g[1], k.g[2]), szene); }
        if (g.innenTreppen && ctx) { const tw = p => BAB.Vector3.TransformCoordinates(V(p[0], p[1], p[2]), welt); const haus = { tuerAussen: tw(g.tuer.aussen), tuerInnen: tw(g.tuer.innen), mitte: V(x, y0, z), radius: Math.hypot(o.breite || 10, o.tiefe || 8) / 2, halb: [(o.breite || 10) / 2, (o.tiefe || 8) / 2], dreh, x, z }; (ctx.haeuser = ctx.haeuser || []).push(haus); for (const t of g.innenTreppen) ctx.treppen.push({ innen: true, haus, unten: tw(t.unten), rampe: tw(t.rampe), oben: tw(t.oben), mitte: V(x, y0, z), radius: Math.hypot(o.breite || 10, o.tiefe || 8) / 2 + 1, dachY: y0 + t.boden }); }
        if (g.treppe && ctx) { const tw = p => BAB.Vector3.TransformCoordinates(V(p[0], p[1], p[2]), welt); ctx.treppen.push({ unten: tw(g.treppe.unten), rampe: tw(g.treppe.rampe), oben: tw(g.treppe.oben), mitte: V(x, y0 + g.hoehe, z), radius: Math.hypot(o.breite || 10, o.tiefe || 8) / 2 + 1, dachY: y0 + g.hoehe + 0.25 }); }
        g.mesh.name = 'haus'; if (ctx && ctx.sperren) ctx.sperren.push({ x, z, w: dreh % Math.PI ? (o.tiefe || 8) : (o.breite || 10), d: dreh % Math.PI ? (o.breite || 10) : (o.tiefe || 8), dreh }); return g.mesh;
      }
      const x = o.pos[0], z = o.pos[2], y0 = o.pos[1] ?? hoehe(x, z), B_ = o.breite || 10, T = o.tiefe || 8, HS = 3.2, st = o.stockwerke || 1, H = HS * st, d = 0.3, f = o.farbe || '#c8b8a0', dreh = (o.drehung || 0) * Math.PI / 180;
      const wurzel = new BAB.TransformNode('haus', szene); wurzel.position = V(x, y0, z); wurzel.rotation.y = dreh;
      const sammel = [];
      const koerper = (m, w, h, t) => { m.computeWorldMatrix(true); const sc = new BAB.Vector3(), q = new BAB.Quaternion(), p = new BAB.Vector3(); m.getWorldMatrix().decompose(sc, q, p);
        const n = new BAB.TransformNode('hausPhysik', szene); n.position = p; n.rotationQuaternion = q; const body = new BAB.PhysicsBody(n, BAB.PhysicsMotionType.STATIC, false, szene); body.shape = new BAB.PhysicsShapeBox(V(0, 0, 0), BAB.Quaternion.Identity(), V(w, h, t), szene); };
      const teil = (px, py, pz, w, h, t, fa, rx) => { const m = BAB.MeshBuilder.CreateBox('wand', { width: w, height: h, depth: t }, szene); m.parent = wurzel; m.position = V(px, py, pz); if (rx) m.rotation.x = rx; m.material = material(fa || f, 0.85); koerper(m, w, h, t); sammel.push(m); return m; };
      teil(0, -0.4, 0, B_ + 0.6, 1, T + 0.6, '#6b6b6b');                                   // Fundament
      const tuer = 1.6, th = 2.4;
      for (let s = 0; s < st; s++) {
        const yb = s * HS;
        // Vorderwand mit Tür (nur unten) bzw. Fensteröffnung
        const off = s === 0 ? tuer : 0; const seiteW = (B_ - off) / 2;
        if (off) { teil(-(off / 2 + seiteW / 2), yb + HS / 2, -T / 2, seiteW, HS, d); teil(off / 2 + seiteW / 2, yb + HS / 2, -T / 2, seiteW, HS, d); teil(0, yb + th + (HS - th) / 2, -T / 2, off, HS - th, d); }
        else teil(0, yb + HS / 2, -T / 2, B_, HS, d);
        teil(0, yb + HS / 2, T / 2, B_, HS, d); teil(-B_ / 2, yb + HS / 2, 0, d, HS, T); teil(B_ / 2, yb + HS / 2, 0, d, HS, T);
        // Fenster (dunkles Glas, leicht spiegelnd)
        for (const sx of [-B_ / 3, B_ / 3]) { const w = BAB.MeshBuilder.CreatePlane('fenster', { width: 1.3, height: 1.1 }, szene); w.parent = wurzel; w.position = V(sx, yb + 1.8, -T / 2 - d / 2 - 0.02); w.material = material('#1d2a33', 0.1, 0.6); sammel.push(w);
          const w2 = w.clone('fenster'); w2.position.z = T / 2 + d / 2 + 0.02; w2.rotation.y = Math.PI; sammel.push(w2); }
        teil(0, yb + HS - 0.1 + 0.15, 0, B_ + 0.2, 0.3, T + 0.2, s === st - 1 ? '#585450' : '#8a7f72');   // Decke / Dach
      }
      // Brüstung auf dem Dach
      for (const [px, pz, w, t] of [[0, -T / 2, B_ + 0.2, 0.25], [0, T / 2, B_ + 0.2, 0.25], [-B_ / 2, 0, 0.25, T], [B_ / 2, 0, 0.25, T]]) teil(px, H + 0.5, pz, w, 0.8, t, '#6f6860');
      if (o.dachTreppe) { const len = Math.hypot(H + 0.3, T * 1.25); teil(B_ / 2 + 1.2, (H + 0.3) / 2, 0, 1.8, 0.3, len, '#7c7266', Math.atan2(H + 0.3, T * 1.25)); }
      const ganz = BAB.Mesh.MergeMeshes(sammel, true, true, undefined, false, true); ganz.name = 'haus'; schatten.addShadowCaster(ganz); ganz.receiveShadows = true; ganz.freezeWorldMatrix();
      return ganz;
    }

    /* ---------- Foto-Haus aus der Werkstatt ---------- */
    function fotoHaus(name, o) {
      o = o || {}; const a = eigene(name, 'foto-gebaeude'), pos = o.pos || [0, null, 0], x = pos[0], z = pos[2], y0 = (pos[1] ?? hoehe(x, z)) - 0.15;
      const t = s => (a.bilder[s] ? { albedo: texVon(a.bilder[s]), normal: a.bilder[s + 'N'] ? texVon(a.bilder[s + 'N']) : null } : null);
      const g = BK.fotoGebaeude({ breite: a.breite, tiefe: a.tiefe, hoehe: a.hoehe, dachFarbe: a.dachFarbe }, { vorne: t('vorne'), seite: t('seite'), hinten: t('hinten'), farbe: a.farbe });
      g.mesh.position = V(x, y0, z); g.mesh.rotation.y = (o.drehung || 0) * Math.PI / 180; g.mesh.computeWorldMatrix(true); schatten.addShadowCaster(g.mesh); g.mesh.receiveShadows = true; g.mesh.freezeWorldMatrix();
      const welt = g.mesh.getWorldMatrix();
      for (const k of g.kollision) { const m = BAB.Matrix.Translation(k.p[0], k.p[1], k.p[2]).multiply(welt); const sc = new BAB.Vector3(), q = new BAB.Quaternion(), p = new BAB.Vector3(); m.decompose(sc, q, p);
        const n = new BAB.TransformNode('fotoPhysik', szene); n.position = p; n.rotationQuaternion = q; const body = new BAB.PhysicsBody(n, BAB.PhysicsMotionType.STATIC, false, szene); body.shape = new BAB.PhysicsShapeBox(V(0, 0, 0), BAB.Quaternion.Identity(), V(k.g[0], k.g[1], k.g[2]), szene); }
      return g.mesh;
    }

    /* ---------- 3D-Modelle (.glb / .gltf, z. B. aus Blender oder Mixamo) ---------- */
    function quelle(url) { const n = window.SDAssets ? window.SDAssets.name(url) : url; if (EIGENE[n] && EIGENE[n].typ === 'modell') return [urlVon(EIGENE[n].datei), '.glb']; return [url, /\.gltf$/i.test(url) ? '.gltf' : '.glb']; }
    async function modell(url, o) {
      o = o || {}; const [u, endung] = quelle(url); const erg = await BAB.SceneLoader.ImportMeshAsync('', '', u, szene, null, endung); const wurzel = erg.meshes[0];
      if (o.pos) wurzel.position = V(o.pos[0], o.pos[1], o.pos[2]); if (o.skalierung) wurzel.scaling = V(o.skalierung, o.skalierung, o.skalierung);
      erg.meshes.forEach(m => { schatten.addShadowCaster(m); m.receiveShadows = true; });
      const anim = {}; erg.animationGroups.forEach(a => { a.stop(); anim[a.name] = a; });
      return { wurzel, meshes: erg.meshes, animationen: anim, spiele: (name, schleife = true) => { Object.values(anim).forEach(a => a.stop()); anim[name] && anim[name].start(schleife); } };
    }

    /* ---------- Eigene Figuren aus .glb (z. B. Mixamo) mit Animationen ---------- */
    const figurVorlagen = {};
    async function figurLaden(url) { const [u, endung] = quelle(url); const c = await BAB.SceneLoader.LoadAssetContainerAsync(u, '', szene, null, endung); figurVorlagen[url] = c; return { animationen: c.animationGroups.map(a => a.name) }; }
    const ANIM = { stehen: /idle|stand|breath|survey|ruhe/i, gehen: /walk|geh/i, rennen: /run|sprint|renn|jog/i, springen: /jump|spring/i, sterben: /death|die|dying|dead|sterb|tot/i, schiessen: /shoot|fire|aim|schie/i };
    let figurZaehler = 0;
    function glbFigur(o) {
      const c = figurVorlagen[o.modell]; if (!c) throw new Error('Figur „' + o.modell + '“ zuerst laden: await sd.figurLaden(\'' + o.modell + '\')');
      const inst = c.instantiateModelsToScene(n => n + '_f' + figurZaehler, false, { doNotInstantiate: true }); figurZaehler++;
      const k = new BAB.TransformNode('figurGlb', szene), innen = new BAB.TransformNode('modell', szene); innen.parent = k; inst.rootNodes.forEach(n => { n.parent = innen; });
      innen.computeWorldMatrix(true); const { min, max } = innen.getHierarchyBoundingVectors(true); const H = Math.max(0.1, max.y - min.y), s = (o.hoehe || 1.8) / H;
      innen.scaling = V(s, s, s); innen.position = V(-(min.x + max.x) / 2 * s, -min.y * s, -(min.z + max.z) / 2 * s); innen.rotation.y = (o.drehung || 0) * Math.PI / 180;
      const meshes = k.getChildMeshes(); meshes.forEach(m => { m.isPickable = false; m.alwaysSelectAsActiveMesh = true; schatten.addShadowCaster(m); m.receiveShadows = true; });
      const gruppen = {}; inst.animationGroups.forEach(a => { a.stop(); for (const [rolle, re] of Object.entries(ANIM)) if (!gruppen[rolle] && re.test(a.name)) gruppen[rolle] = a; });
      if (!gruppen.stehen && inst.animationGroups.length && !gruppen.gehen) gruppen.stehen = inst.animationGroups[0];
      const hand = k.getDescendants(false, n => /right.?hand|hand.?r\b|r.?hand|hand_r|handr/i.test(n.name))[0];
      return animierteFigur(k, gruppen, inst.animationGroups, hand ? { knoten: hand, welt: true } : null, o);
    }
    /** gemeinsam für importierte und erzeugte Figuren: Trefferzonen, Waffe, weiches Überblenden der Animationen */
    function animierteFigur(k, gruppen, alle, waffenHalter, o) {
      // Trefferzonen (unsichtbar): Körper + Kopf – genauer als das verformte Modell
      const hb = (name, mesh, y, kopf) => { mesh.parent = k; mesh.position.y = y; mesh.isVisible = false; mesh.metadata = { figur: o.besitzer, kopf, trefferzone: true }; return mesh; };
      const hoehe = o.hoehe || 1.8; hb('rumpfZone', BAB.MeshBuilder.CreateBox('zone', { width: 0.55, height: hoehe * 0.78, depth: 0.4 }, szene), hoehe * 0.39, false); hb('kopfZone', BAB.MeshBuilder.CreateSphere('zone', { diameter: 0.32, segments: 6 }, szene), hoehe - 0.17, true);
      if (!gruppen.gehen && gruppen.rennen) gruppen.gehen = gruppen.rennen; if (!gruppen.rennen && gruppen.gehen) gruppen.rennen = gruppen.gehen;
      const schleifen = [...new Set(['stehen', 'gehen', 'rennen'].map(r => gruppen[r]).filter(Boolean))], gewicht = new Map(schleifen.map(g => [g, 0]));
      schleifen.forEach(g => { g.start(true); g.setWeightForAllAnimatables(0); }); let aktiv = gruppen.stehen || schleifen[0];
      const waffe = BAB.MeshBuilder.CreateBox('waffe', { width: 0.07, height: 0.12, depth: 0.7 }, szene); waffe.material = material('#1c1d20', 0.4, 0.7); schatten.addShadowCaster(waffe); waffe.metadata = { figur: o.besitzer }; waffe.isPickable = false;
      if (o.ohneWaffe) waffe.setEnabled(false);
      if (waffenHalter && waffenHalter.welt) { k.computeWorldMatrix(true); waffenHalter.knoten.computeWorldMatrix(true); waffe.position = waffenHalter.knoten.getAbsolutePosition().add(V(0, 0, 0.25)); waffe.setParent(waffenHalter.knoten); }
      else if (waffenHalter) { waffe.parent = waffenHalter.knoten; waffe.position = waffenHalter.pos || V(0, 0, 0); }
      else { waffe.parent = k; waffe.position = V(0.22, hoehe * 0.72, 0.4); }
      let tot = false;
      k.animiere = (tempo, dt, inLuft) => { if (tot || !schleifen.length) return;
        aktiv = tempo > 5.2 ? (gruppen.rennen || aktiv) : tempo > 0.6 ? (gruppen.gehen || aktiv) : (gruppen.stehen || gruppen.gehen);
        for (const g of schleifen) { const z = g === aktiv ? 1 : 0, w = gewicht.get(g) + (z - gewicht.get(g)) * Math.min(1, dt * 8); gewicht.set(g, w); g.setWeightForAllAnimatables(w); }
        if (aktiv && aktiv !== gruppen.stehen) aktiv.speedRatio = klemme(tempo / (aktiv === gruppen.rennen ? 6.5 : 3), 0.6, 1.8); };
      k.sterben = () => { tot = true; if (!gruppen.sterben) return false; schleifen.forEach(g => g.stop()); gruppen.sterben.start(false); return true; };
      k.teile = {}; k.waffe = waffe; k.glb = true; k.animationen = alle.map(a => a.name); return k;
    }

    /* ---------- Figuren (Spieler und Bots) ---------- */
    let MB = null;
    function figur(o) {
      if (o.modell) return glbFigur(o);
      if (o.aussehen === 'mensch' && window.SDMensch) { MB = MB || window.SDMensch.bauer(BAB, szene); const m = MB.mensch(Object.assign({ groesse: o.hoehe || 1.8, seed: Math.floor(Math.random() * 1e6) }, o.mensch || {}));
        m.mesh.isPickable = false; m.mesh.alwaysSelectAsActiveMesh = true; schatten.addShadowCaster(m.mesh); m.mesh.receiveShadows = true;
        const brust = new BAB.TransformNode('waffenHalter', szene); brust.attachToBone(m.knochen.brust, m.mesh);
        const k = animierteFigur(m.wurzel, Object.assign({}, m.gruppen), Object.values(m.gruppen), { knoten: brust, pos: V(0.13, 0.02, 0.38) }, Object.assign({}, o, { hoehe: o.hoehe || 1.8 })); k.mensch = m; return k; }
      if (BK && o.aussehen === 'roboter') { const k = BK.roboter(Object.assign({ seed: Math.floor(Math.random() * 1e6) }, o.roboter || {}));
        k.getChildMeshes().forEach(m => { schatten.addShadowCaster(m); m.receiveShadows = true; m.metadata = { figur: o.besitzer, kopf: !!m.__kopf }; }); return k; }
      const k = new BAB.TransformNode('figur', szene), teile = {};
      const tl = (name, mesh, f, px, py, pz, parent) => { mesh.parent = parent || k; mesh.position = V(px, py, pz); mesh.material = material(f, 0.75, name === 'waffe' ? 0.7 : 0); schatten.addShadowCaster(mesh); mesh.receiveShadows = true; mesh.metadata = { figur: o.besitzer, kopf: name === 'kopf' || name === 'helm' }; teile[name] = mesh; return mesh; };
      const uniform = o.farbe || '#4a5a3a', haut = o.haut || '#d7a77e';
      tl('becken', BAB.MeshBuilder.CreateBox('b', { width: 0.42, height: 0.22, depth: 0.25 }, szene), '#2e2e2e', 0, 0.95, 0);
      tl('rumpf', BAB.MeshBuilder.CreateBox('r', { width: 0.5, height: 0.6, depth: 0.28 }, szene), uniform, 0, 1.35, 0);
      tl('weste', BAB.MeshBuilder.CreateBox('w', { width: 0.54, height: 0.4, depth: 0.32 }, szene), o.weste || '#3b3b33', 0, 1.42, 0);
      tl('kopf', BAB.MeshBuilder.CreateSphere('k', { diameter: 0.3, segments: 12 }, szene), haut, 0, 1.83, 0);
      tl('helm', BAB.MeshBuilder.CreateSphere('h', { diameter: 0.34, segments: 12, slice: 0.55 }, szene), o.helm || '#3d4a33', 0, 1.86, 0);
      for (const s of [-1, 1]) {
        const huefte = new BAB.TransformNode('h', szene); huefte.parent = k; huefte.position = V(0.12 * s, 0.9, 0); teile['bein' + s] = huefte;
        tl('o' + s, BAB.MeshBuilder.CreateBox('bein', { width: 0.17, height: 0.85, depth: 0.2 }, szene), '#3a3f33', 0, -0.43, 0, huefte);
        tl('s' + s, BAB.MeshBuilder.CreateBox('schuh', { width: 0.18, height: 0.12, depth: 0.3 }, szene), '#1e1e1e', 0, -0.86, 0.05, huefte);
        const schulter = new BAB.TransformNode('s', szene); schulter.parent = k; schulter.position = V(0.32 * s, 1.6, 0); teile['arm' + s] = schulter;
        tl('a' + s, BAB.MeshBuilder.CreateBox('arm', { width: 0.13, height: 0.6, depth: 0.14 }, szene), uniform, 0, -0.28, 0, schulter);
      }
      // Waffe in den Händen
      const waffe = tl('waffe', BAB.MeshBuilder.CreateBox('waffe', { width: 0.07, height: 0.12, depth: 0.8 }, szene), '#222222', 0.18, 1.32, 0.45);
      teile.arm1.rotation.x = -1.35; teile['arm-1'].rotation.x = -1.3; teile['arm-1'].rotation.y = 0.5;
      let phase = 0;
      k.animiere = (tempo, dt, inLuft) => { phase += dt * tempo * 2.2; const sw = inLuft ? 0.5 : Math.sin(phase) * klemme(tempo / 5, 0, 1) * 0.7; teile.bein1.rotation.x = sw; teile['bein-1'].rotation.x = -sw; };
      k.teile = teile; k.waffe = waffe; return k;
    }

    /* ---------- Effekte ---------- */
    function funken(pos, normal, f1, anzahl) {
      const ps = new BAB.ParticleSystem('funken', anzahl || 18, szene); ps.particleTexture = punktTex; ps.emitter = pos.clone(); ps.minEmitBox = ps.maxEmitBox = BAB.Vector3.Zero();
      const n = normal || V(0, 1, 0); ps.direction1 = n.add(V(-0.6, -0.2, -0.6)); ps.direction2 = n.add(V(0.6, 0.8, 0.6)); ps.color1 = BAB.Color4.FromColor3(farbe(f1 || '#ffd27a')); ps.color2 = new BAB.Color4(1, 0.6, 0.2, 1); ps.colorDead = new BAB.Color4(0.2, 0.2, 0.2, 0);
      ps.minSize = 0.03; ps.maxSize = 0.12; ps.minLifeTime = 0.08; ps.maxLifeTime = 0.35; ps.emitRate = 2000; ps.minEmitPower = 2; ps.maxEmitPower = 6; ps.gravity = V(0, -9.8, 0); ps.manualEmitCount = anzahl || 18; ps.blendMode = BAB.ParticleSystem.BLENDMODE_ADD;
      ps.disposeOnStop = true; ps.targetStopDuration = 0.4; ps.start();
    }
    const spurMat = material('#ffe9a8', 0.5, 0, { leuchten: '#ffcf6a', alpha: 0.85 });
    const spuren = [];
    function spur(von, bis) { const l = BAB.Vector3.Distance(von, bis); if (l < 0.5) return; const m = BAB.MeshBuilder.CreateCylinder('spur', { height: l, diameter: 0.025, tessellation: 4 }, szene); m.material = spurMat; m.isPickable = false;
      m.position = von.add(bis).scale(0.5); const dir = bis.subtract(von).normalize(); const ax = BAB.Vector3.Cross(V(0, 1, 0), dir); const w = Math.acos(klemme(BAB.Vector3.Dot(V(0, 1, 0), dir), -1, 1)); if (ax.length() > 1e-5) m.rotationQuaternion = BAB.Quaternion.RotationAxis(ax.normalize(), w); spuren.push([m, 0.06]); }
    const blitz = new BAB.PointLight('muendung', V(0, -100, 0), szene); blitz.intensity = 0; blitz.range = 8; blitz.diffuse = new BAB.Color3(1, 0.8, 0.5);

    /* ---------- Treffer per Strahl ---------- */
    const kannTreffen = (m) => m.isPickable && m.isEnabled() && (m.isVisible !== false || (m.metadata && m.metadata.trefferzone)) && !(m.metadata && m.metadata.keinTreffer);
    function strahl(von, richtung, laenge, ignoriere) {
      const r = new BAB.Ray(von, richtung, laenge); return szene.pickWithRay(r, m => kannTreffen(m) && !(ignoriere && m.metadata && m.metadata.figur === ignoriere));
    }

    /* ---------- HUD ---------- */
    const hud = opt.hud || {};
    const setzeText = (id, t) => { const e = hud[id]; if (e && e.textContent !== String(t)) e.textContent = t; };
    let nachrichtTimer = null;
    function nachricht(text, sek) { const e = hud.nachricht; if (!e) return; e.textContent = text; e.hidden = false; clearTimeout(nachrichtTimer); nachrichtTimer = setTimeout(() => { e.hidden = true; }, (sek || 3) * 1000); }
    function meldung(text) { const e = hud.feed; if (!e) return; const d = document.createElement('div'); d.textContent = text; e.prepend(d); setTimeout(() => d.remove(), 5000); while (e.children.length > 5) e.lastChild.remove(); }

    /* ---------- Eingabe ---------- */
    const tasten = {}; let maus = { dx: 0, dy: 0, links: false, rechts: false }, gesperrt = false;
    const tastenNamen = e => (e.code || '').replace(/^Key/, '').replace(/^Digit/, '');
    const tastenHandler = { Space: [() => { if (spieler) spieler.sprungPuffer = 0.25; }] };
    /* Tastenbelegung: Aktion -> Taste (Einstellungen). Gedrückt wird die Taste, ausgelöst wird der Standard-Code der Aktion */
    const AKTIONEN = { vor: 'W', zurueck: 'S', links: 'A', rechts: 'D', springen: 'Space', sprinten: 'ShiftLeft', ducken: 'C', nachladen: 'R', benutzen: 'E', fahrzeug: 'F', granate: 'G', nahkampf: 'V', medikit: 'H', missionen: 'J', ansicht: 'K', karte: 'M', waffe1: '1', waffe2: '2', waffe3: '3' };
    function virtuell(k) { const b = (opt.einstellungen && opt.einstellungen.tasten) || {}; const v = []; let belegt = false;
      for (const [a, std] of Object.entries(AKTIONEN)) { const t = b[a] || std; if (t === k) v.push(std); if (std === k) belegt = true; }
      return v.length ? v : belegt ? [] : [k]; }
    const kd = e => { if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return; const roh = tastenNamen(e); for (const k of (e.sdController ? [roh] : virtuell(roh))) { tasten[k] = true; (tastenHandler[k] || []).forEach(f => f()); } const k = roh; if (['Space', 'Tab'].includes(k) && gesperrt) e.preventDefault(); };
    const ku = e => { const roh = tastenNamen(e); for (const k of (e.sdController ? [roh] : virtuell(roh))) tasten[k] = false; };
    const mm = e => { if (gesperrt) { maus.dx += e.movementX || 0; maus.dy += e.movementY || 0; } };
    const md = e => { if (e.target !== canvas) return; if (!gesperrt && !opt.keinPointerLock) { canvas.requestPointerLock && canvas.requestPointerLock(); } if (e.button === 0) { maus.links = true; maus.klick = true; } if (e.button === 2) maus.rechts = true; };
    const mu = e => { if (e.button === 0) maus.links = false; if (e.button === 2) maus.rechts = false; };
    const pl = () => { gesperrt = document.pointerLockElement === canvas; opt.beiSperre && opt.beiSperre(gesperrt); };
    const cm = e => { if (e.target === canvas) e.preventDefault(); };
    window.addEventListener('keydown', kd); window.addEventListener('keyup', ku); document.addEventListener('mousemove', mm); document.addEventListener('mousedown', md); document.addEventListener('mouseup', mu); document.addEventListener('pointerlockchange', pl); document.addEventListener('contextmenu', cm);
    const touch = { bewegen: [0, 0], schauen: [0, 0] };
    /* ---------- 🎮 Controller (Xbox/PlayStation, Standard-Belegung) ----------
       Linker Stick laufen/lenken · Rechter Stick schauen · RT schießen/Gas · LT zielen/Bremse · A springen · B ducken · X nachladen · Y einsteigen
       LB Granate · RB Waffe wechseln · L3 sprinten · R3 Nahkampf · Steuerkreuz ↑ Medikit, ↓ benutzen, ← Missionen · Start Pause · Select Punkte */
    const PAD_TASTEN = { 0: 'Space', 1: 'C', 2: 'R', 3: 'F', 4: 'G', 8: 'Tab', 9: 'Escape', 10: 'ShiftLeft', 11: 'V', 12: 'H', 13: 'E', 14: 'J' }, padAlt = {}; let padAktiv = false;
    const tasteSenden = (code, an) => { const ev = new KeyboardEvent(an ? 'keydown' : 'keyup', { code: code.length === 1 ? 'Key' + code : code, key: code === 'Escape' ? 'Escape' : code, bubbles: true }); ev.sdController = true; document.dispatchEvent(ev); };
    function controller() {
      const pads = navigator.getGamepads ? navigator.getGamepads() : []; const g = [...pads].find(x => x && x.connected); if (!g) { if (padAktiv) { padAktiv = false; touch.bewegen = [0, 0]; touch.schauen = [0, 0]; } return; }
      if (!padAktiv) { padAktiv = true; nachricht('🎮 Controller verbunden', 3); }
      const tz = v => Math.abs(v) < 0.15 ? 0 : (v - Math.sign(v) * 0.15) / 0.85, ax = g.axes, knopf = i => !!(g.buttons[i] && (g.buttons[i].pressed || g.buttons[i].value > 0.4)), wert = i => (g.buttons[i] ? g.buttons[i].value : 0);
      const faehrt = ctx && ctx.uebernahme, flug = faehrt && ctx.sd.fahrzeug && ctx.sd.fahrzeug.art === 'flugzeug', rt = wert(7), lt = wert(6);
      touch.bewegen = [tz(ax[0] || 0), faehrt && !flug ? rt - lt : -tz(ax[1] || 0)]; touch.schauen = [tz(ax[2] || 0) * 1.4, tz(ax[3] || 0) * 1.4];
      if (flug) { touch.sprint = rt > 0.2; tasten.C = lt > 0.2; }
      else if (!faehrt) { const feuer = rt > 0.4; if (feuer && !padAlt.feuer) { maus.links = true; maus.klick = true; } if (!feuer && padAlt.feuer) maus.links = false; padAlt.feuer = feuer; maus.rechts = lt > 0.4; }
      for (const [i, code] of Object.entries(PAD_TASTEN)) { const an = knopf(+i); if (an !== !!padAlt[i]) { padAlt[i] = an; if (!(flug && code === 'C')) tasteSenden(code, an); } }
      const rb = knopf(5); if (rb && !padAlt.rb && spieler && spieler.waffen.length > 1) waffeWechseln((spieler.aktiv + 1) % spieler.waffen.length); padAlt.rb = rb;
    }

    /* ---------- Spieler ---------- */
    let spieler = null, ctx = null; const bots = [], kisten = [], frameFns = [], skripte = [], modulUpdates = [];
    let zone = null, vorbei = false, zeit = 0, botsAus = false, wackel = 0;
    /** Kamerawackeln (Schüsse, Treffer, Explosionen, Landungen) – klingt schnell ab */
    function wackeln(st, pos) { if (pos) st *= klemme(1 - BAB.Vector3.Distance(pos, kamera.position) / 60, 0, 1); wackel = Math.min(1.2, wackel + st); }
    const DOWN = V(0, -1, 0);
    function bewege(cc, wunsch, sprung, dt, zustand) {
      const sup = cc.checkSupport(dt, DOWN), amBoden = sup.supportedState === BAB.CharacterSupportedState.SUPPORTED; let v = cc.getVelocity();
      zustand.sprung = Math.max(0, (zustand.sprung || 0) - dt);
      if (amBoden && zustand.sprung <= 0) { const n = sup.averageSurfaceNormal; const proj = wunsch.subtract(n.scale(BAB.Vector3.Dot(wunsch, n))); v = proj.add(sup.averageSurfaceVelocity); if (sprung) { v.y = 5.6; zustand.sprung = 0.25; } else v.y = Math.min(v.y, 0) - 0.5; zustand.luft = 0; }
      else { v.x += (wunsch.x - v.x) * Math.min(1, dt * 2.5); v.z += (wunsch.z - v.z) * Math.min(1, dt * 2.5); v.y += SCHWERKRAFT.y * dt; zustand.luft += dt; }
      cc.setVelocity(v); cc.integrate(dt, sup, SCHWERKRAFT); return amBoden;
    }
    function spielerErstellen(o) {
      o = o || {}; const start = V(o.pos[0], o.pos[1] ?? hoehe(o.pos[0], o.pos[2]) + 1.2, o.pos[2]);
      const cc = new BAB.PhysicsCharacterController(start, { capsuleHeight: 1.8, capsuleRadius: 0.38 }, szene); cc.maxSlopeCosine = Math.cos(50 * Math.PI / 180);
      const kos = opt.kosmetik || {}; const k = figur({ besitzer: 'spieler', farbe: o.farbe || '#3f5a6b', weste: '#2c2f33', helm: '#2b3940', aussehen: o.aussehen, roboter: Object.assign({}, o.roboter, kos.roboter), mensch: Object.assign({}, o.mensch, kos.mensch), modell: o.modell, hoehe: o.hoehe, drehung: o.modellDrehung });
      k.getChildMeshes().forEach(m => { m.isPickable = false; });
      spieler = { cc, k, leben: o.leben || 100, maxLeben: o.leben || 100, ruestung: o.ruestung || 0, gier: o.blick || 0, nick: 0.1, zustand: { luft: 0 }, waffen: [], aktiv: 0, letzterSchuss: 0, laden: 0, kills: 0, schaden: 0, rueckstoss: 0, tempo: 0, abstand: 4.2 };
      (o.waffen || ['pistole']).forEach(w => waffeGeben(w)); waffeWechseln(0); return spieler;
    }
    function waffeGeben(name, still) {
      const def = WAFFEN[name]; if (!def || !spieler) return false; const vorhanden = spieler.waffen.find(w => w.id === name);
      if (vorhanden) { vorhanden.reserve += def.magazin * 2; if (!still) nachricht('+ Munition ' + def.name); return true; }
      if (spieler.waffen.length >= 3) { const alt = spieler.waffen[spieler.aktiv]; spieler.waffen[spieler.aktiv] = { id: name, def, mag: def.magazin, reserve: def.reserve }; if (!still) nachricht(def.name + ' statt ' + alt.def.name); waffeWechseln(spieler.aktiv); return true; }
      spieler.waffen.push({ id: name, def, mag: def.magazin, reserve: def.reserve }); if (!still) nachricht('🔫 ' + def.name + ' aufgehoben (Taste ' + spieler.waffen.length + ')'); return true;
    }
    /** echtes Waffenmodell (mit Skin) an die Figur hängen; der alte Kasten bleibt unsichtbar als Halter */
    function waffenModell(k, id, def) { if (!k || !k.waffe || !BK || !BK.waffe) return false; const h = k.waffe; if (h.__modell) { h.__modell.dispose(); h.__modell = null; }
      const kos = opt.kosmetik || {}, skins = kos.waffenSkins || {}, skin = (k === (spieler && spieler.k)) ? (skins[id] || skins.alle) : null;
      const m = BK.waffe({ art: def.modell || 'sturm', laenge: def.laenge, skin: skin || undefined }); if (!m) return false; m.parent = h; h.isVisible = false; const tiefe = h.getBoundingInfo().boundingBox.extendSize.z * 2 / (h.scaling.z || 1);
      m.scaling = V(1 / (h.scaling.x || 1), 1 / (h.scaling.y || 1), 1 / (h.scaling.z || 1)); m.position = V(0, 0, -tiefe / 2 + 0.06); m.isPickable = false; m.metadata = h.metadata; schatten.addShadowCaster(m); h.__modell = m; return true; }
    function waffeWechseln(i) { if (!spieler || !spieler.waffen[i]) return; spieler.aktiv = i; spieler.laden = 0; const w = spieler.waffen[i]; if (!waffenModell(spieler.k, w.id, w.def) && !spieler.k.glb) { { spieler.k.waffe.scaling.z = w.def.laenge / 0.8; spieler.k.waffe.position.z = 0.1 + w.def.laenge / 2; } } }
    ['1', '2', '3'].forEach((t, i) => (tastenHandler[t] = tastenHandler[t] || []).push(() => waffeWechseln(i)));
    (tastenHandler.R = tastenHandler.R || []).push(() => nachladen());
    (tastenHandler.K = tastenHandler.K || []).push(() => { const E = opt.einstellungen; if (!E) return; E.ansicht = E.ansicht === 'fpp' ? 'tpp' : 'fpp'; nachricht(E.ansicht === 'fpp' ? '👁 Ich-Perspektive' : '🧍 Third-Person', 1.5); opt.beiEinstellung && opt.beiEinstellung(); });
    (tastenHandler.M = tastenHandler.M || []).push(() => { if (hud.karte) hud.karte.classList.toggle('gross'); });
    function nachladen() { if (!spieler) return; const w = spieler.waffen[spieler.aktiv]; if (!w || spieler.laden > 0 || w.mag >= w.def.magazin || w.reserve <= 0) return; spieler.laden = w.def.nachladen; spieler.ladeDauer = w.def.nachladen; ton('nachladen'); }
    function schaden(ziel, menge, quelle) {
      if (vorbei) return;
      if (ziel === spieler) { if (ctx && ctx.uebernahme) menge *= 0.5; menge *= 1 - [0, 0.08, 0.15, 0.22][spieler.helm || 0]; let rest = menge; if (spieler.ruestung > 0) { const a = Math.min(spieler.ruestung, menge * (spieler.westeStufe ? 0.4 + spieler.westeStufe * 0.1 : 0.6)); spieler.ruestung -= a; rest -= a; } spieler.leben -= rest; ton('schaden', 0.7); wackeln(klemme(rest / 35, 0.1, 0.6)); hud.blut && (hud.blut.style.opacity = klemme(rest / 25, 0.25, 0.8));
        if (spieler.leben <= 0) { spieler.leben = 0; if (ctx && ctx.beimTod && ctx.beimTod(quelle ? 'Ausgeschaltet von ' + quelle : null)) return; ende(false, quelle ? 'Ausgeschaltet von ' + quelle : 'Du bist ausgeschieden'); } return; }
      ziel.leben -= menge; ziel.alarm = 6; ziel.zucken = 0.22; if (ziel.leben <= 0 && !ziel.tot) botTot(ziel);
    }
    function schiessen() {
      const w = spieler.waffen[spieler.aktiv]; if (!w || spieler.laden > 0) return; if (zeit - spieler.letzterSchuss < w.def.kadenz) return;
      if (w.mag <= 0) { nachladen(); return; } w.mag--; spieler.letzterSchuss = zeit;
      const ziel = maus.rechts; const st = (ziel ? w.def.zielStreuung : w.def.streuung) * (spieler.tempo > 2 ? 1.6 : 1) * (spieler.zustand.luft > 0.15 ? 2 : 1);
      const vorn = kamera.getForwardRay(1).direction; const rechts = BAB.Vector3.Cross(V(0, 1, 0), vorn).normalize(), oben = BAB.Vector3.Cross(vorn, rechts);
      const muendung = spieler.k.waffe.getAbsolutePosition().add(vorn.scale(w.def.laenge * 0.5));
      let getroffen = false, kopf = false;
      for (let i = 0; i < w.def.kugeln; i++) {
        const dir = vorn.add(rechts.scale((Math.random() - 0.5) * 2 * st)).add(oben.scale((Math.random() - 0.5) * 2 * st)).normalize();
        const t = strahl(kamera.position.add(dir.scale(spieler.abstand * 0.9)), dir, 600, 'spieler'); const ende_ = t && t.hit ? t.pickedPoint : kamera.position.add(dir.scale(400));
        if (i < 3) spur(muendung, ende_);
        if (t && t.hit) { const m = t.pickedMesh, md_ = m.metadata || {}, bot = bots.find(b => b.id === md_.figur);
          if (bot && !bot.tot) { const k = md_.kopf; bot.trefferRichtung = dir; schaden(bot, w.def.schaden * (k ? 2.2 : 1), 'Spieler'); getroffen = true; kopf = kopf || k; funken(t.pickedPoint, null, '#ff5040', 10); }
          else if (ctx && ctx.fremdTreffer && ctx.fremdTreffer(md_.figur, w.def.schaden * (md_.kopf ? 2.2 : 1), md_.kopf, t.pickedPoint)) { getroffen = true; kopf = kopf || md_.kopf; funken(t.pickedPoint, null, '#ff5040', 10); }
          else { const n = t.getNormal(true) || V(0, 1, 0); funken(t.pickedPoint, n, null, 12); if (m.physicsBody && m.physicsBody.getMotionType && m.physicsBody.getMotionType() === BAB.PhysicsMotionType.DYNAMIC) m.physicsBody.applyImpulse(dir.scale(w.def.schaden * 0.6), t.pickedPoint);
            if (md_.fahrzeug && ctx && ctx.fahrzeugTreffer) ctx.fahrzeugTreffer(md_.fahrzeug, w.def.schaden * 0.45, t.pickedPoint);
            if (md_.leben != null) { md_.leben -= w.def.schaden; if (md_.leben <= 0) zerstoeren(m); } } }
      }
      if (getroffen) { ton(kopf ? 'kopf' : 'treffer'); if (hud.treffer) { hud.treffer.classList.toggle('kopf', kopf); hud.treffer.style.opacity = 1; } }
      ton(w.def.ton, w.def.leise ? 0.25 : 0.8); ctx && ctx.beiSchuss.forEach(f => f(muendung, 'spieler', w.def.leise)); blitz.position = muendung; blitz.intensity = w.def.leise ? 0.4 : 3; wackeln(w.def.rueckstoss * 3.5); spieler.rueckstoss += w.def.rueckstoss; spieler.nick -= w.def.rueckstoss * 0.6;
    }
    function zerstoeren(m) { funken(m.getAbsolutePosition(), V(0, 1, 0), '#ffaa44', 40); ton('schrot', 0.6); if (m.physicsBody) m.physicsBody.dispose(); m.dispose(); }

    /* ---------- Bots (Gegner mit KI) ---------- */
    function gegner(o) {
      if (ctx && ctx.mehrspieler) return { tot: true, mehrspieler: true };   // Mehrspieler: keine Computer-Gegner
      o = o || {}; const id = 'bot' + bots.length; const st = o.staerke ?? 0.5;
      const p = V(o.pos[0], (o.pos[1] ?? hoehe(o.pos[0], o.pos[2])) + 1.2, o.pos[2]);
      const cc = new BAB.PhysicsCharacterController(p, { capsuleHeight: 1.8, capsuleRadius: 0.38 }, szene); cc.maxSlopeCosine = Math.cos(50 * Math.PI / 180);
      const farbenSatz = ['#6b3a3a', '#5a4a2e', '#3a4f6b', '#4a3a5f', '#5f5f3a'];
      const stile = ['kampf', 'kampf', 'spaeher', 'schwer'], lacke = ['#d9dde2', '#c9b48a', '#9aa7b4', '#6b7a5a', '#b04a3a'];
      const k = figur({ besitzer: id, farbe: o.farbe || farbenSatz[bots.length % 5], helm: '#40332b', modell: o.modell, hoehe: o.hoehe, drehung: o.modellDrehung, aussehen: o.aussehen, roboter: Object.assign({ stil: stile[bots.length % 4], farbe: lacke[bots.length % 5], augen: '#ff3b30' }, o.roboter || {}) });
      const b = { id, cc, k, name: o.name || ('Bot ' + (bots.length + 1)), leben: o.leben || 100, staerke: st, waffe: WAFFEN[o.waffe || (bots.length % 3 === 0 ? 'schrotflinte' : 'gewehr')], ziel: null, warte: 0, letzterSchuss: 0, sieht: 0, alarm: 0, zustand: { luft: 0 }, richtung: Math.random() * 6.28, heimat: p.clone(), seitwaerts: Math.random() < 0.5 ? 1 : -1, wechsel: 0, nebenfigur: !!o.nebenfigur };
      waffenModell(k, Object.keys(WAFFEN).find(n => WAFFEN[n] === b.waffe), b.waffe); bots.push(b); return b;
    }
    /** Figur still entfernen (z. B. Polizei, die aufgibt) – zählt nicht als Abschuss */
    function botEntfernen(b) { if (b.weg) return; b.weg = true; b.tot = true; try { b.cc.dispose && b.cc.dispose(); } catch (e) { /* schon weg */ } b.k.dispose(false, true); }
    /** Ragdoll: Menschen fallen beim Tod physikalisch (Gelenke mit Grenzen), danach erstarrt die Pose */
    function ragdoll(k, richtung) {
      if (!BAB.Ragdoll || qualitaet === 'niedrig') return false;
      try { const m = k.mensch, s = (k.mensch.hoehe || 1.8) / 1.8, X = V(1, 0, 0), Z = V(0, 0, 1), J = BAB.PhysicsConstraintType;
        Object.values(m.gruppen).forEach(g => g.stop());
        const cfg = [{ bones: ['huefte'], size: 0.28 * s, boxOffset: 0.0 },
          { bones: ['brust'], width: 0.38 * s, height: 0.36 * s, depth: 0.22 * s, min: -0.6, max: 0.6, boxOffset: 0.12 * s, boneOffsetAxis: V(0, -1, 0), rotationAxis: X, joint: J.HINGE },
          { bones: ['kopf'], size: 0.22 * s, min: -0.8, max: 0.8, boxOffset: 0.08 * s, boneOffsetAxis: V(0, -1, 0), rotationAxis: X, joint: J.HINGE },
          { bones: ['oberarmL', 'oberarmR'], depth: 0.1 * s, height: 0.28 * s, width: 0.1 * s, min: -1.5, max: 1.5, boxOffset: 0.14 * s, boneOffsetAxis: V(0, 1, 0), rotationAxis: X, joint: J.BALL_AND_SOCKET },
          { bones: ['unterarmL', 'unterarmR'], depth: 0.09 * s, height: 0.26 * s, width: 0.09 * s, min: -1.6, max: 0, boxOffset: 0.13 * s, boneOffsetAxis: V(0, 1, 0), rotationAxis: X, joint: J.HINGE },
          { bones: ['oberschenkelL', 'oberschenkelR'], depth: 0.14 * s, height: 0.42 * s, width: 0.14 * s, min: -1.4, max: 0.4, boxOffset: 0.21 * s, boneOffsetAxis: V(0, 1, 0), rotationAxis: X, joint: J.BALL_AND_SOCKET },
          { bones: ['unterschenkelL', 'unterschenkelR'], depth: 0.12 * s, height: 0.42 * s, width: 0.12 * s, min: 0, max: 2.2, boxOffset: 0.21 * s, boneOffsetAxis: V(0, 1, 0), rotationAxis: X, joint: J.HINGE }];
        const rd = new BAB.Ragdoll(m.skelett, m.mesh, cfg); rd.ragdoll();
        const r0 = rd.getAggregate(1); if (r0 && r0.body) r0.body.applyImpulse((richtung || kamera.getForwardRay(1).direction).scale(60).add(V(0, 10, 0)), r0.transformNode.getAbsolutePosition());
        setTimeout(() => { try { rd.pauseSync = true; rd.dispose(); } catch (e) { /* schon weg */ } }, 7000); return true;
      } catch (e) { console.warn('Ragdoll nicht möglich', e.message); return false; }
    }
    function botTot(b) {
      b.tot = true; spieler && spieler.kills++; ton('tot', 0.5); meldung('☠ ' + b.name + ' ausgeschaltet');
      const pos = b.cc.getPosition(); b.cc.dispose && b.cc.dispose();
      b.k.getChildMeshes().forEach(m => { m.isPickable = false; });
      if (b.k.mensch && ragdoll(b.k, b.trefferRichtung)) { if (Math.random() < 0.6) kiste({ pos: [pos.x + 0.8, null, pos.z], inhalt: Math.random() < 0.5 ? 'munition' : 'medikit', klein: true }); if (bots.some(x => !x.nebenfigur) && bots.every(x => x.tot || x.nebenfigur)) ende(true, 'Alle Gegner ausgeschaltet'); return; }
      if (b.k.sterben && b.k.sterben()) { if (Math.random() < 0.6) kiste({ pos: [pos.x + 0.8, null, pos.z], inhalt: Math.random() < 0.5 ? 'munition' : 'medikit', klein: true }); if (bots.some(x => !x.nebenfigur) && bots.every(x => x.tot || x.nebenfigur)) ende(true, 'Alle Gegner ausgeschaltet'); return; }
      // umfallen mit Physik
      const huelle = BAB.MeshBuilder.CreateBox('leiche', { width: 0.6, height: 1.8, depth: 0.4 }, szene); huelle.isVisible = false; huelle.isPickable = false; huelle.position = pos.clone(); huelle.rotation.y = b.k.rotation.y;
      b.k.position = V(0, -0.9, 0); b.k.rotation.y = 0; b.k.parent = huelle; b.k.getChildMeshes().forEach(m => { m.isPickable = false; });
      const agg = new BAB.PhysicsAggregate(huelle, BAB.PhysicsShapeType.BOX, { mass: 70, friction: 0.9 }, szene); agg.body.applyImpulse(kamera.getForwardRay(1).direction.scale(120).add(V(0, 30, 0)), pos.add(V(0, 0.7, 0)));
      if (Math.random() < 0.6) kiste({ pos: [pos.x + 0.8, null, pos.z], inhalt: Math.random() < 0.5 ? 'munition' : 'medikit', klein: true });
      if (bots.some(x => !x.nebenfigur) && bots.every(x => x.tot || x.nebenfigur)) ende(true, 'Alle Gegner ausgeschaltet');
    }
    const spielerPos = () => (ctx && ctx.uebernahme && ctx.uebernahme.pos ? ctx.uebernahme.pos() : spieler.duckt ? spieler.cc.getPosition().add(V(0, -0.6, 0)) : spieler.cc.getPosition());   // geduckt: hinter niedrigen Mauern unsichtbar für Gegner
    function sichtfrei(von, zu, ignoriere) { const d = zu.subtract(von), l = d.length(); const t = strahl(von, d.normalize(), l, ignoriere); return !t || !t.hit || t.distance > l - 0.7 || !!(ctx && ctx.uebernahme && t.pickedMesh.metadata && t.pickedMesh.metadata.fahrzeug && t.pickedMesh.metadata.fahrzeug === ctx.uebernahme.fahrzeugId); }
    function botUpdate(b, dt) {
      if (b.tot || b.inLuft) return; if (b.leben <= 0) { botTot(b); return; } const pos = b.cc.getPosition(); let wunsch = V(0, 0, 0), tempo = 0;
      const sp = spieler && spieler.leben > 0 ? spielerPos() : null; const dist = sp ? BAB.Vector3.Distance(pos, sp) : 1e9;
      b.alarm = Math.max(0, b.alarm - dt); b.wechsel -= dt;
      const sichtweite = 70 + b.staerke * 40;
      if (sp && dist < sichtweite && (b.sieht > 0 || Math.random() < dt * 6)) { const frei = sichtfrei(pos.add(V(0, 0.75, 0)), sp.add(V(0, 0.5, 0)), b.id); if (frei && b.sieht <= 0) { b.reaktion = 0.9 + (1 - b.staerke) * 0.9 + Math.random() * 0.5; ctx && ctx.ki && ctx.ki.alarm(b, sp); } b.sieht = frei ? 1.5 : Math.max(0, b.sieht - dt); if (frei) b.zuletzt = sp.clone(); }
      else b.sieht = Math.max(0, b.sieht - dt);
      // in der Zone bleiben
      let zielPunkt = null;
      if (zone && Math.hypot(pos.x - zone.mitte[0], pos.z - zone.mitte[1]) > zone.radius * 0.85) zielPunkt = V(zone.mitte[0], 0, zone.mitte[1]);
      if (ctx && ctx.ki && sp && b.leben < 45 && !b.deckungFertig && (b.sieht > 0 || b.deckung)) {   // verletzt: Deckung suchen
        if (!b.deckung && !b.deckungGesucht) { b.deckungGesucht = true; b.deckung = ctx.ki.deckungSuchen(b, pos, sp); if (!b.deckung) b.deckungFertig = true; }
        if (b.deckung) { const d = Math.hypot(b.deckung.x - pos.x, b.deckung.z - pos.z); if (d > 1.2) { wunsch = ctx.ki.richtung(b, pos, b.deckung); tempo = 5.5; b.richtung = Math.atan2(wunsch.x, wunsch.z); }
          else { b.inDeckung = (b.inDeckung || 0) + dt; const zu = sp.subtract(pos); b.richtung = Math.atan2(zu.x, zu.z); if (b.inDeckung > 3.5) { b.leben = Math.min(100, b.leben + 20); b.deckungFertig = true; b.deckung = null; } } }
      } else if (b.sieht > 0 && sp) {
        const zu = sp.subtract(pos); zu.y = 0; const r = zu.normalize(); b.richtung = Math.atan2(r.x, r.z);
        if (b.wechsel <= 0) { b.seitwaerts *= -1; b.wechsel = 1 + Math.random() * 2; }
        const quer = V(r.z, 0, -r.x).scale(b.seitwaerts); const ideal = b.waffe.kugeln > 1 ? 9 : 25;
        wunsch = quer.scale(0.7).add(r.scale(dist > ideal + 5 ? 1 : dist < ideal - 6 ? -0.8 : 0)); tempo = 3.2;
        if (ctx && ctx.ki && (sp.y - pos.y > 2.2 || b.aufTreppe) && (ctx.treppen || []).length) { wunsch = ctx.ki.richtung(b, pos, sp); tempo = 4; }   // Ziel oben: über die Treppe hinterher
        b.reaktion = Math.max(0, (b.reaktion || 0) - dt);
        if (b.reaktion <= 0 && zeit - b.letzterSchuss > Math.max(0.45, b.waffe.kadenz * 1.5) + (1 - b.staerke) * 0.5 + Math.random() * 0.3 && dist < (b.waffe.kugeln > 1 ? 30 : 110)) {
          b.letzterSchuss = zeit; const bewegtSich = spieler.tempo > 2 ? 0.15 : 0; const chance = klemme(0.32 + b.staerke * 0.2 - dist / 130 - bewegtSich, 0.05, 0.5);
          const muendung = b.k.waffe.getAbsolutePosition(); const treffer = Math.random() < chance; const ziel = sp.add(V((Math.random() - 0.5) * (treffer ? 0.2 : 2.5), 0.4 + (Math.random() - 0.5) * (treffer ? 0.4 : 1.5), (Math.random() - 0.5) * (treffer ? 0.2 : 2.5)));
          spur(muendung, ziel); ton(b.waffe.ton, klemme(1 - dist / 140, 0, 0.7), muendung); ctx && ctx.beiSchuss.forEach(f => f(muendung, b.id));
          if (treffer) schaden(spieler, b.waffe.schaden * (b.waffe.kugeln > 1 ? klemme(3 - dist / 8, 0.4, 3) : 0.45), b.name);
        }
      } else if (b.zuletzt && b.alarm > 0) { let ziel = b.zuletzt; const zu = ziel.subtract(pos); zu.y = 0;
        if (b.flanke && zu.length() > 22) { const n = zu.normalize(); ziel = b.zuletzt.add(V(n.z, 0, -n.x).scale(b.flanke * 14)); }   // von der Seite kommen
        if (zu.length() > 2 || (Math.abs(ziel.y - pos.y) > 2.2 && ctx && ctx.ki)) { wunsch = ctx && ctx.ki ? ctx.ki.richtung(b, pos, ziel) : zu.normalize(); tempo = 4; b.richtung = Math.atan2(wunsch.x, wunsch.z); } }
      else if (zielPunkt) { const zu = zielPunkt.subtract(pos); zu.y = 0; wunsch = ctx && ctx.ki ? ctx.ki.richtung(b, pos, zielPunkt) : zu.normalize(); tempo = 4.5; b.richtung = Math.atan2(wunsch.x, wunsch.z); }
      else { b.warte -= dt; if (b.warte <= 0) { b.richtung += (Math.random() - 0.5) * 2.5; b.warte = 2 + Math.random() * 4; b.geht = Math.random() < 0.7; } if (b.geht) { wunsch = V(Math.sin(b.richtung), 0, Math.cos(b.richtung)); tempo = 2; } }
      if (b.alarm > 0 && b.sieht <= 0 && sp && !b.zuletzt) b.zuletzt = sp.clone();
      const v0 = wunsch.scale(tempo); bewege(b.cc, v0, false, dt, b.zustand);
      const np = b.cc.getPosition(); if (tempo > 0 && BAB.Vector3.Distance(np, pos) < tempo * dt * 0.2) { b.richtung += 1.8; b.warte = 1; }   // hängt fest -> umdrehen
      b.k.position = np.add(V(0, -0.9, 0)); b.k.rotation.y += winkel(b.k.rotation.y, b.richtung) * Math.min(1, dt * 8); b.k.animiere(tempo * (wunsch.length() > 0.1 ? 1 : 0), dt, b.zustand.luft > 0.2);
      if (np.y < -50) { b.leben = 0; botTot(b); }
    }

    /* ---------- Kisten (Beute) ---------- */
    const INHALT = { munition: ['#c2a14a', '📦 Munition'], medikit: ['#d84a4a', '✚ Medikit +40'], ruestung: ['#4a7ad8', '🛡 Schutzweste +50'], 'waffe:gewehr': ['#8a6a3a', '🔫 Sturmgewehr'], 'waffe:schrotflinte': ['#8a6a3a', '🔫 Schrotflinte'], 'waffe:scharfschuetze': ['#8a6a3a', '🎯 Scharfschützengewehr'],
      'helm:1': ['#6a7a5a', '⛑ Helm Stufe 1'], 'helm:2': ['#5a6a7a', '⛑ Helm Stufe 2'], 'helm:3': ['#3a3a4a', '⛑ Helm Stufe 3'], 'weste:1': ['#4a7ad8', '🦺 Weste Stufe 1'], 'weste:2': ['#3a5ab8', '🦺 Weste Stufe 2'], 'weste:3': ['#2a3a88', '🦺 Weste Stufe 3'],
      'rucksack:1': ['#8a7a4a', '🎒 Rucksack Stufe 1'], 'rucksack:2': ['#7a6a3a', '🎒 Rucksack Stufe 2'], 'rucksack:3': ['#5a4a2a', '🎒 Rucksack Stufe 3'], 'aufsatz:visier': ['#2a8a8a', '🔭 Zielfernrohr'], 'aufsatz:daempfer': ['#2a2a2a', '🔇 Schalldämpfer'], 'aufsatz:magazin': ['#8a4a2a', '🧰 Großes Magazin'], abwurf: ['#d83a2a', '📦 Versorgungsabwurf'], verband: ['#e8e0d0', '🩹 Verband'], energie: ['#e8c020', '🥤 Energydrink'] };
    Object.keys(WAFFEN).forEach(n => { INHALT['waffe:' + n] = INHALT['waffe:' + n] || ['#8a6a3a', '🔫 ' + WAFFEN[n].name]; });
    /* Ausrüstung: Helm/Weste/Rucksack in Stufen, Aufsätze je Waffe */
    let ausruestungEl = null;
    function ausruestungZeigen() { if (!spieler) return; if (!ausruestungEl && hud.munition && hud.munition.parentNode) { ausruestungEl = document.createElement('div'); ausruestungEl.style.cssText = 'font:600 13px system-ui;opacity:.9;margin-top:4px;text-shadow:0 1px 3px #000'; hud.munition.parentNode.appendChild(ausruestungEl); }
      if (!ausruestungEl) return; const w = spieler.waffen[spieler.aktiv], a = (w && w.aufsatz) || {}; const t = [spieler.helm ? '⛑' + spieler.helm : '', spieler.westeStufe ? '🦺' + spieler.westeStufe : '', spieler.rucksack ? '🎒' + spieler.rucksack : '', a.visier ? '🔭' : '', a.daempfer ? '🔇' : '', a.magazin ? '🧰' : ''].filter(Boolean).join(' '); if (ausruestungEl.textContent !== t) ausruestungEl.textContent = t; }
    function aufsatzAnbringen(art) { const w = spieler.waffen[spieler.aktiv]; if (!w) { nachricht('Erst eine Waffe nehmen'); return false; } w.aufsatz = w.aufsatz || {}; if (w.aufsatz[art]) { nachricht('Diese Waffe hat das schon'); return false; } w.aufsatz[art] = true;
      const d = Object.assign({}, w.def); if (art === 'visier') { d.zoom = Math.min(d.zoom || 0.55, 0.32); d.zielStreuung *= 0.6; } if (art === 'daempfer') d.leise = true; if (art === 'magazin') d.magazin = Math.round(d.magazin * 1.5); w.def = d; nachricht(INHALT['aufsatz:' + art][1] + ' an ' + d.name); return true; }
    function kiste(o) {
      const x = o.pos[0], z = o.pos[2], y = o.pos[1] ?? hoehe(x, z), s = o.klein ? 0.45 : 0.7, inh = o.inhalt || 'munition';
      const m = BAB.MeshBuilder.CreateBox('kiste', { size: s }, szene); m.position = V(x, y + s / 2, z); m.material = material((INHALT[inh] || INHALT.munition)[0], 0.6, 0.1, { leuchten: '#111111' }); schatten.addShadowCaster(m); m.receiveShadows = true;
      const agg = new BAB.PhysicsAggregate(m, BAB.PhysicsShapeType.BOX, { mass: o.klein ? 4 : 0 }, szene); if (o.klein) agg.body.applyImpulse(V(0, 10, 0), m.position);
      const k = { m, inhalt: inh }; kisten.push(k); return k;
    }
    function kisteOeffnen(k) {
      if (k.inhalt === 'abwurf') { ['helm:3', 'weste:3', Math.random() < 0.5 ? 'waffe:magnum' : 'waffe:mg', 'munition', 'medikit'].forEach(x => inhaltAnwenden(x)); nachricht('📦 Versorgungsabwurf: Helm 3, Weste 3, Spezialwaffe, Munition, Medikit', 4); }
      else if (inhaltAnwenden(k.inhalt) === false) return;
      ton('aufheben'); kisten.splice(kisten.indexOf(k), 1); if (k.m.physicsBody) k.m.physicsBody.dispose(); k.m.dispose();
    }
    function inhaltAnwenden(i) {
      if (i === 'munition') { const n = 2 + (spieler.rucksack || 0); spieler.waffen.forEach(w => { w.reserve += w.def.magazin * n; }); nachricht('📦 Munition für alle Waffen (' + n + ' Magazine)'); }
      else if (/^(helm|weste|rucksack):/.test(i)) { const [art, st] = i.split(':'), n = +st, feld = art === 'helm' ? 'helm' : art === 'weste' ? 'westeStufe' : 'rucksack'; if ((spieler[feld] || 0) >= n) { nachricht('Du hast schon ' + (art === 'helm' ? 'einen Helm' : art === 'weste' ? 'eine Weste' : 'einen Rucksack') + ' dieser Stufe'); return false; }
        spieler[feld] = n; if (art === 'weste') spieler.ruestung = Math.max(spieler.ruestung, 40 + n * 20); nachricht(INHALT[i][1] + (art === 'helm' ? ' – ' + [0, 8, 15, 22][n] + ' % weniger Schaden' : art === 'weste' ? ' – Schutz ' + (40 + n * 20) : ' – mehr Munition pro Kiste')); }
      else if (i.startsWith('aufsatz:')) { if (!aufsatzAnbringen(i.slice(8))) return false; }
      else if (i === 'medikit') { if (spieler.leben >= spieler.maxLeben) { nachricht('Leben ist schon voll'); return false; } spieler.leben = Math.min(spieler.maxLeben, spieler.leben + 40); nachricht('✚ +40 Leben'); }
      else if (i === 'verband') { if (spieler.leben >= 75) { nachricht('🩹 Verband hilft nur bis 75 Leben'); return false; } spieler.leben = Math.min(75, spieler.leben + 15); nachricht('🩹 +15 Leben'); }
      else if (i === 'energie') { spieler.boost = Math.min(100, (spieler.boost || 0) + 40); nachricht('🥤 Boost: heilt langsam und macht etwas schneller'); }
      else if (i === 'ruestung') { spieler.ruestung = Math.min(100, spieler.ruestung + 50); nachricht('🛡 +50 Schutz'); }
      else if (i.startsWith('waffe:')) waffeGeben(i.slice(6));
      return true;
    }
    (tastenHandler.E = tastenHandler.E || []).push(() => { if (!spieler || vorbei) return; const p = spieler.cc.getPosition(); const k = kisten.find(k => !k.m.isDisposed() && BAB.Vector3.Distance(k.m.position, p) < 2.6); if (k) kisteOeffnen(k); });

    /* ---------- Zone (schrumpfender Kreis) ---------- */
    function zoneErstellen(o) {
      const m = BAB.MeshBuilder.CreateCylinder('zone', { height: 400, diameter: 2, tessellation: 96, cap: BAB.Mesh.NO_CAP, sideOrientation: BAB.Mesh.DOUBLESIDE }, szene);
      const mat = new BAB.StandardMaterial('zoneMat', szene); mat.emissiveColor = new BAB.Color3(0.25, 0.5, 1); mat.alpha = 0.22; mat.disableLighting = true; mat.backFaceCulling = false; m.material = mat; m.isPickable = false; m.applyFog = false;
      zone = { mitte: o.mitte || [0, 0], start: o.radius || 280, ende: o.endRadius || 20, dauer: o.dauer || 240, warte: o.warte ?? 30, schaden: o.schaden || 4, radius: o.radius || 280, mesh: m }; return zone;
    }

    /* ---------- Ende ---------- */
    function ende(sieg, text) { if (vorbei) return; vorbei = true; document.exitPointerLock && document.exitPointerLock(); opt.beiEnde && opt.beiEnde({ sieg, text, kills: spieler ? spieler.kills : 0, zeit: Math.round(zeit) }); }

    /* ---------- Kamera (Third-Person über die Schulter) ---------- */
    function kameraUpdate(dt) {
      const E = opt.einstellungen || {}, empf = (opt.empfindlichkeit || 0.0022) * (E.maus || 1), pe = E.pad || 1, z = maus.rechts ? (spieler.waffen[spieler.aktiv]?.def.zoom || 0.55) : 1;
      const zf = maus.rechts ? (E.ziel ?? 0.8) : 1; spieler.gier += (maus.dx * empf * zf + touch.schauen[0] * dt * 2.2 * pe) * z; spieler.nick = klemme(spieler.nick + (maus.dy * empf * zf * (E.invertY ? -1 : 1) + touch.schauen[1] * dt * 1.6 * pe) * z, -1.2, 1.25); maus.dx = maus.dy = 0;
      spieler.rueckstoss *= Math.pow(0.001, dt);
      const kopf = spieler.cc.getPosition().add(V(0, 0.65 - (spieler.duckWert || 0) * 0.55, 0)); const fv = V(Math.sin(spieler.gier) * Math.cos(spieler.nick), -Math.sin(spieler.nick), Math.cos(spieler.gier) * Math.cos(spieler.nick));
      const rechts = V(Math.cos(spieler.gier), 0, -Math.sin(spieler.gier)); const zoomt = maus.rechts, ich = E.ansicht === 'fpp'; const abst = ich ? 0.05 : zoomt ? 1.8 : 4.2, schulter = ich ? 0 : zoomt ? 0.55 : 0.75;
      const drehpunkt = kopf.add(rechts.scale(schulter)); let wunsch = drehpunkt.subtract(fv.scale(abst));
      const t = strahl(drehpunkt, wunsch.subtract(drehpunkt).normalize(), abst + 0.3, 'spieler'); let ist = abst; if (t && t.hit) ist = Math.max(0.4, t.distance - 0.3);
      spieler.abstand = ist; kamera.position = drehpunkt.subtract(fv.scale(ist)); kamera.setTarget(kamera.position.add(fv));
      const basisFov = ((opt.einstellungen && opt.einstellungen.sicht) || 57.3) * Math.PI / 180, zielFov = zoomt ? basisFov * z : basisFov; kamera.fov += (zielFov - kamera.fov) * Math.min(1, dt * 12);
    }
    function spielerUpdate(dt) {
      if (spieler.leben <= 0) return;
      const vor = (tasten.W || tasten.ArrowUp ? 1 : 0) - (tasten.S || tasten.ArrowDown ? 1 : 0) + touch.bewegen[1], seit = (tasten.D || tasten.ArrowRight ? 1 : 0) - (tasten.A || tasten.ArrowLeft ? 1 : 0) + touch.bewegen[0];
      const fw = V(Math.sin(spieler.gier), 0, Math.cos(spieler.gier)), rw = V(Math.cos(spieler.gier), 0, -Math.sin(spieler.gier));
      let dir = fw.scale(vor).add(rw.scale(seit)); if (dir.length() > 1) dir.normalize();
      const sprint = (tasten.ShiftLeft || tasten.ShiftRight || touch.sprint) && vor > 0 && !maus.rechts; const tempo = (maus.rechts ? 2.6 : sprint ? 7.5 : 4.6) * (tasten.ControlLeft || tasten.C ? 0.5 : 1) * (spieler.boost > 0 ? 1.08 : 1);
      if (spieler.boost > 0) { spieler.boost = Math.max(0, spieler.boost - dt * 1.3); if (spieler.leben > 0) spieler.leben = Math.min(spieler.maxLeben, spieler.leben + dt * 0.9); }
      const vorher = spieler.cc.getPosition().clone(); if (touch.springen) { spieler.sprungPuffer = 0.25; touch.springen = false; } spieler.sprungPuffer = Math.max(0, (spieler.sprungPuffer || 0) - dt);
      const springt = (tasten.Space || spieler.sprungPuffer > 0) && spieler.zustand.luft === 0; if (springt) spieler.sprungPuffer = 0;
      if (spieler.wurf > 0) spieler.wurf = Math.max(0, spieler.wurf - dt);
      spieler.duckt = !!(tasten.ControlLeft || tasten.C) && !maus.rechts; spieler.duckWert = (spieler.duckWert || 0) + ((spieler.duckt ? 1 : 0) - (spieler.duckWert || 0)) * Math.min(1, dt * 10);
      const amBoden = bewege(spieler.cc, dir.scale(tempo), springt, dt, spieler.zustand);
      const np = spieler.cc.getPosition(); spieler.tempo = Math.hypot(np.x - vorher.x, np.z - vorher.z) / Math.max(dt, 1e-4);
      if (amBoden) { if (spieler.flugZeit > 0.55) { wackeln(klemme(spieler.flugZeit * 0.35, 0.15, 0.6)); ton('schritt', 0.8); } spieler.flugZeit = 0; spieler.schrittWeg = (spieler.schrittWeg || 0) + spieler.tempo * dt; if (spieler.schrittWeg > (sprint ? 2.1 : 1.5)) { spieler.schrittWeg = 0; ton('schritt', sprint ? 0.32 : 0.22); } }
      else spieler.flugZeit = (spieler.flugZeit || 0) + dt;
      spieler.k.position = np.add(V(0, -0.9, 0)); const blick = (maus.rechts || maus.links || dir.length() > 0.1) ? spieler.gier : spieler.k.rotation.y;
      spieler.k.rotation.y += winkel(spieler.k.rotation.y, blick) * Math.min(1, dt * 14); spieler.k.animiere(spieler.tempo, dt, !amBoden && spieler.zustand.luft > 0.2);
      if (spieler.k.teile.arm1) { spieler.k.teile.arm1.rotation.x = -1.35 - spieler.nick * 0.8; spieler.k.teile['arm-1'].rotation.x = -1.3 - spieler.nick * 0.8; spieler.k.waffe.rotation.x = spieler.nick * 0.9; }
      // nahe am Kopf: Figur durchsichtig, damit man durch die Kamera sieht
      const ichSicht = opt.einstellungen && opt.einstellungen.ansicht === 'fpp'; spieler.k.getChildMeshes().forEach(m => { m.visibility = ichSicht ? 0 : spieler.abstand < 1 ? 0.15 : 1; });
      const w = spieler.waffen[spieler.aktiv];
      if (spieler.laden > 0) { spieler.laden -= dt; if (spieler.laden <= 0) { const n = Math.min(w.def.magazin - w.mag, w.reserve); w.mag += n; w.reserve -= n; spieler.laden = 0; } }
      if ((maus.links || maus.klick || touch.feuer) && w) { schiessen(); if (!w.def.auto) { maus.links = false; touch.feuer = false; } } maus.klick = false;
      if (np.y < -50) schaden(spieler, 999, 'Absturz');
    }

    /* ---------- Minikarte ---------- */
    function karte() {
      const c = hud.karte; if (!c || !spieler) return; const x = c.getContext('2d'), W = c.width, H = c.height, p = spieler.cc.getPosition(), mass = W / 160;
      x.clearRect(0, 0, W, H); x.fillStyle = 'rgba(10,16,24,.65)'; x.beginPath(); x.arc(W / 2, H / 2, W / 2 - 1, 0, 7); x.fill(); x.save(); x.beginPath(); x.arc(W / 2, H / 2, W / 2 - 2, 0, 7); x.clip();
      x.translate(W / 2, H / 2); x.rotate(spieler.gier + Math.PI); const P = (wx, wz) => [-(wx - p.x) * mass, (wz - p.z) * mass];
      if (zone) { const [zx, zy] = P(zone.mitte[0], zone.mitte[1]); x.strokeStyle = 'rgba(90,150,255,.9)'; x.lineWidth = 2; x.beginPath(); x.arc(zx, zy, zone.radius * mass, 0, 7); x.stroke(); }
      x.fillStyle = '#ffcf4a'; kisten.forEach(k => { if (k.m.isDisposed()) return; const [kx, ky] = P(k.m.position.x, k.m.position.z); x.fillRect(kx - 2, ky - 2, 4, 4); });
      bots.forEach(b => { if (b.tot || !(b.sieht > 0 || b.alarm > 0)) return; const bp = b.cc.getPosition(); const [bx, by] = P(bp.x, bp.z); x.fillStyle = '#ff4a4a'; x.beginPath(); x.arc(bx, by, 3.5, 0, 7); x.fill(); });
      ((ctx && ctx.kartenMarker) || []).forEach(m => { let [mx, my] = P(m.x, m.z); const d = Math.hypot(mx, my), R = W / 2 - 9; if (d > R) { mx *= R / d; my *= R / d; } x.fillStyle = m.farbe || '#ffd23a'; x.beginPath(); x.moveTo(mx, my - 7); x.lineTo(mx + 6, my); x.lineTo(mx, my + 7); x.lineTo(mx - 6, my); x.fill(); });
      x.restore(); x.fillStyle = '#fff'; x.beginPath(); x.moveTo(W / 2, H / 2 - 7); x.lineTo(W / 2 - 5, H / 2 + 5); x.lineTo(W / 2 + 5, H / 2 + 5); x.fill();
    }

    /* ---------- Hauptschleife ---------- */
    let fpsZeit = 0;
    szene.onBeforeRenderObservable.add(() => { const dt = Math.min(engine.getDeltaTime() / 1000, 0.05); if (!dt || festeSchritte) return; if (opt.pause && opt.pause()) return; logik(dt); });
    let festeSchritte = false;
    function logik(dt) {
      if (kachelPhysik) kachelPhysik(dt); ausruestungZeigen();
      if (opt.einstellungen) { const E = opt.einstellungen, g = E.gesamt ?? 1; if (BUS) { BUS.effekte.gain.value = (E.effekte ?? 1) * g; BUS.musik.gain.value = (E.musik ?? 0.6) * g; }
        const sw = E.sichtweite ?? 1; kamera.maxZ = 3000 * sw; if (szene.fogDensity !== szene.__fogGesetzt) szene.__fogBasis = szene.fogDensity; szene.fogDensity = szene.__fogBasis / sw; szene.__fogGesetzt = szene.fogDensity;
        sonne.shadowEnabled = E.schatten !== false; if (hud.fps) hud.fps.style.display = E.fpsZeigen === false ? 'none' : ''; }
      zeit += dt;
      const ueb = ctx && ctx.uebernahme;
      if (spieler && !vorbei) { if (ueb) ueb.update(dt); else spielerUpdate(dt); }
      if (spieler) { if (ueb && ueb.kamera) ueb.kamera(dt); else kameraUpdate(dt); }
      if (wackel > 0.003) { const w = wackel * wackel * 0.16, t = zeit * 47; kamera.position.addInPlace(V(Math.sin(t) * w, Math.sin(t * 1.31 + 1) * w, Math.cos(t * 0.87) * w)); wackel *= Math.pow(0.015, dt); } else wackel = 0;
      if (!vorbei && !botsAus) bots.forEach(b => botUpdate(b, dt));
      for (const b of bots) { if (b.tot || !b.k) continue; if (b.zucken > 0) { b.zucken = Math.max(0, b.zucken - dt); b.k.rotation.x = -Math.sin(b.zucken / 0.22 * Math.PI) * 0.22; } else if (b.k.rotation.x) b.k.rotation.x = 0;   // zuckt bei Treffern zurück
        const bp = b.cc.getPosition(); if (b.letzterOrt) { b.schrittWeg = (b.schrittWeg || 0) + Math.hypot(bp.x - b.letzterOrt.x, bp.z - b.letzterOrt.z); if (b.schrittWeg > 1.6) { b.schrittWeg = 0; if (BAB.Vector3.DistanceSquared(bp, kamera.position) < 900) ton('schritt', 0.35, bp); } } b.letzterOrt = bp.clone(); }
      modulUpdates.forEach(f => { try { f(dt, zeit); } catch (e) { console.error(e); opt.beiFehler && opt.beiFehler(e); modulUpdates.splice(modulUpdates.indexOf(f), 1); } });
      for (let i = spuren.length - 1; i >= 0; i--) { spuren[i][1] -= dt; if (spuren[i][1] <= 0) { spuren[i][0].dispose(); spuren.splice(i, 1); } }
      blitz.intensity = Math.max(0, blitz.intensity - dt * 40);
      if (zone) { const t = klemme((zeit - zone.warte) / zone.dauer, 0, 1); zone.radius = zone.start + (zone.ende - zone.start) * t; zone.mesh.scaling = V(zone.radius, 1, zone.radius); zone.mesh.position = V(zone.mitte[0], 100, zone.mitte[1]);
        if (spieler && !vorbei) { const p = spieler.cc.getPosition(); const aussen = Math.hypot(p.x - zone.mitte[0], p.z - zone.mitte[1]) > zone.radius && !(ctx && ctx.uebernahme && ctx.uebernahme.absprung); hud.zoneWarnung && (hud.zoneWarnung.hidden = !aussen); if (aussen && spieler.leben > 0) { spieler.leben -= zone.schaden * dt; if (spieler.leben <= 0) { spieler.leben = 0; if (!(ctx && ctx.beimTod && ctx.beimTod('Außerhalb der Zone'))) ende(false, 'Außerhalb der Zone'); } } }
        bots.forEach(b => { if (b.tot) return; const p = b.cc.getPosition(); if (Math.hypot(p.x - zone.mitte[0], p.z - zone.mitte[1]) > zone.radius) { b.leben -= zone.schaden * dt; if (b.leben <= 0) botTot(b); } });
        const rest = Math.max(0, Math.ceil(zone.warte + zone.dauer - zeit)); setzeText('zone', t < 1 ? (zeit < zone.warte ? '◯ Zone in ' + Math.ceil(zone.warte - zeit) + ' s' : '◯ schrumpft · ' + rest + ' s') : '◯ Letzte Zone'); }
      skripte.forEach(s => { try { s.update && s.update.call(s.ziel, s.ziel, dt); } catch (e) { opt.beiFehler && opt.beiFehler(e); s.update = null; } });
      frameFns.forEach(f => { try { f(dt, zeit); } catch (e) { opt.beiFehler && opt.beiFehler(e); frameFns.splice(frameFns.indexOf(f), 1); } });
      if (spieler) { const w = spieler.waffen[spieler.aktiv]; setzeText('leben', Math.ceil(spieler.leben)); hud.lebenBalken && (hud.lebenBalken.style.width = (spieler.leben / spieler.maxLeben * 100) + '%'); hud.schutzBalken && (hud.schutzBalken.style.width = spieler.ruestung + '%');
        setzeText('munition', w ? (spieler.laden > 0 ? 'lädt …' : w.mag + ' / ' + w.reserve) : '–'); setzeText('waffe', w ? w.def.name : ''); setzeText('kills', spieler.kills); setzeText('uebrig', bots.filter(b => !b.tot).length);
        if (hud.blut) hud.blut.style.opacity = Math.max(0, parseFloat(hud.blut.style.opacity || 0) - dt * 1.2); if (hud.treffer) hud.treffer.style.opacity = Math.max(0, parseFloat(hud.treffer.style.opacity || 0) - dt * 5);
        const p = spieler.cc.getPosition(); const nah = kisten.find(k => !k.m.isDisposed() && BAB.Vector3.Distance(k.m.position, p) < 2.6); if (hud.hinweis) { const ht = nah ? 'E: ' + (INHALT[nah.inhalt] || ['', 'Aufheben'])[1] : (ctx && ctx.hinweisText); hud.hinweis.hidden = !ht; if (ht) hud.hinweis.textContent = ht; }
        if (hud.fadenkreuz) hud.fadenkreuz.style.setProperty('--s', (8 + ((w && (maus.rechts ? w.def.zielStreuung : w.def.streuung)) || 0) * 500 + spieler.rueckstoss * 300) + 'px');
        hud.zielfernrohr && (hud.zielfernrohr.hidden = !(maus.rechts && w && w.def.zoom));
      }
      hoererSetzen(kamera.position, kamera.getForwardRay(1).direction);
      fpsZeit += dt; if (fpsZeit > 0.5) { fpsZeit = 0; setzeText('fps', engine.getFps().toFixed(0) + ' FPS'); karte(); }
    }
    // Dynamische Auflösung: fällt die Bildrate länger unter ~28 FPS, wird intern gröber gerechnet (bis 1,8×), bei Luft wieder feiner
    const basisSkala = engine.getHardwareScalingLevel(); let dynZeit = 0, fpsSumme = 0, fpsN = 0;
    if (opt.dynamischeAufloesung !== false) szene.onAfterRenderObservable.add(() => { const ms = engine.getDeltaTime(); if (!ms || ms > 500) return; dynZeit += ms; fpsSumme += 1000 / ms; fpsN++;
      if (dynZeit > 2000) { const fps = fpsSumme / fpsN, sk = engine.getHardwareScalingLevel(); dynZeit = fpsSumme = fpsN = 0;
        if (fps < 28 && sk < basisSkala * 1.8) engine.setHardwareScalingLevel(Math.min(basisSkala * 1.8, sk * 1.15)); else if (fps > 50 && sk > basisSkala) engine.setHardwareScalingLevel(Math.max(basisSkala, sk / 1.1)); } });
    szene.onBeforeRenderObservable.add(() => { try { controller(); } catch (e) { /* kein Controller */ } });
    // Ducken: Hocke über die Knochen (Menschen) – sonst wird die Figur niedriger
    const X = V(1, 0, 0);
    szene.onAfterAnimationsObservable.add(() => { if (!spieler || !spieler.k) return; const d = spieler.duckWert || 0, k = spieler.k;
      if (k.mensch) { const kn = k.mensch.knochen, achse = (b, ax, w, st) => { if (b && b.rotationQuaternion && st > 0.001) b.rotationQuaternion = b.rotationQuaternion.multiply(BAB.Quaternion.RotationAxis(ax, w * st)); };
        // Nachladen: linker Arm holt ein neues Magazin (runter zur Hüfte und zurück)
        if (spieler.laden > 0 && spieler.ladeDauer) { const u = 1 - spieler.laden / spieler.ladeDauer, st = Math.sin(Math.min(1, u) * Math.PI); achse(kn.oberarmL, X, 0.9, st); achse(kn.unterarmL, X, 0.8, st); achse(kn.kopf, X, 0.25, st); }
        // Granate werfen: rechter Arm holt aus und schwingt nach vorn
        if (spieler.wurf > 0) { const u = 1 - spieler.wurf / 0.5, st = u < 0.45 ? u / 0.45 : 1 - (u - 0.45) / 0.55, w = u < 0.45 ? -2.2 : -2.2 + (u - 0.45) / 0.55 * 3.2; achse(kn.oberarmR, X, w, Math.max(st, 0.3)); }
        if (d < 0.01) return; const mix = (b, w) => { if (!b || !b.rotationQuaternion) return; b.rotationQuaternion = BAB.Quaternion.Slerp(b.rotationQuaternion, BAB.Quaternion.RotationAxis(X, w), d); };
        const sw = Math.sin(zeit * 9) * klemme(spieler.tempo / 3, 0, 1) * 0.25; mix(kn.oberschenkelL, -1.25 + sw); mix(kn.oberschenkelR, -1.25 - sw); mix(kn.unterschenkelL, 1.95); mix(kn.unterschenkelR, 1.95); mix(kn.fussL, -0.7); mix(kn.fussR, -0.7); mix(kn.wirbel, 0.35);
        if (kn.huefte.position) kn.huefte.position.y *= 1 - 0.42 * d; }
      else k.scaling.y = 1 - 0.3 * d; });
    engine.runRenderLoop(() => szene.render());
    const groesse = () => engine.resize(); window.addEventListener('resize', groesse);

    /* ---------- Die SD-API für Spiel-Skripte ---------- */
    const sd = {
      BABYLON: BAB, szene, engine, kamera, sonne,
      himmel, gelaende, hoehe, box, kugel, zylinder, fels, baeume, haus, modell, kiste, fotoHaus, figurLaden, eigeneDateien: () => Object.values(EIGENE).map(a => ({ name: a.name, typ: a.typ })),
      spieler: spielerErstellen, gegner, zone: zoneErstellen, waffe: waffeGeben, WAFFEN,
      jedenFrame: f => frameFns.push(f), beiTaste: (t, f) => (tastenHandler[t] = tastenHandler[t] || []).push(f),
      skript: (ziel, s) => { const e = { ziel, update: s.update }; try { s.start && s.start.call(ziel, ziel); } catch (er) { opt.beiFehler && opt.beiFehler(er); } skripte.push(e); return e; },
      nachricht, meldung, ton, zufall, rauschen, sieg: t => ende(true, t), niederlage: t => ende(false, t),
      get zeit() { return zeit; }, get bots() { return bots; }, get spielerDaten() { return spieler; },
      vektor: V, farbe,
    };
    /* ---------- Module (Fahrzeuge, Stadt, Menschen, KI, Wetter …) ---------- */
    ctx = { BAB, V, klemme, winkel, zufall, rauschen, szene, engine, kamera, sonne, hell, schatten, BK, material, hoehe, strahl, ton, bus, audioKontext: () => audioKontext(), eigene, wackeln, botEntfernen, tasten, maus, touch, hud, setzeText, nachricht, meldung, opt, sd, schaden, figur, haus, kiste, tastenHandler, bewege, SCHWERKRAFT, spielerPos, gelaendeGroesse: () => (gel ? gel.groesse : 640), audio: audioKontext, treppen: [], sperren: [], baumPunkte: [],
      get spieler() { return spieler; }, bots, kisten, get zeit() { return zeit; }, get vorbei() { return vorbei; }, uebernahme: null, beiSchuss: [], botZiel: null, navi: null, aufraeumen: [] };
    (window.SDModule || []).forEach(m => { try { const r = m(ctx) || {}; Object.defineProperties(sd, Object.getOwnPropertyDescriptors(r.api || {})); if (r.update) modulUpdates.push(r.update); } catch (e) { console.error('Modul-Fehler', e); } });
    const aufraeumen = () => {
      (ctx.aufraeumen || []).forEach(f => { try { f(); } catch (e) { /* egal */ } });
      window.removeEventListener('keydown', kd); window.removeEventListener('keyup', ku); document.removeEventListener('mousemove', mm); document.removeEventListener('mousedown', md); document.removeEventListener('mouseup', mu); document.removeEventListener('pointerlockchange', pl); document.removeEventListener('contextmenu', cm); window.removeEventListener('resize', groesse);
      try { document.exitPointerLock && document.exitPointerLock(); } catch (e) { /* egal */ } blobUrls.forEach(u => URL.revokeObjectURL(u)); engine.stopRenderLoop(); szene.dispose(); engine.dispose();
    };
    const steuerung = { sd, get ctx() { return ctx; }, aufraeumen, touch, tasten, maus, botsAnhalten: an => { botsAus = !!an; }, schritte: (n, dt) => { festeSchritte = true; const pe = szene.getPhysicsEngine(); if (pe && !pe.__orig) { pe.__orig = pe._step.bind(pe); pe._step = () => {}; } for (let i = 0; i < n; i++) { logik(dt || 1 / 30); if (pe) pe.__orig(dt || 1 / 30); } }, echtzeit: () => { festeSchritte = false; const pe = szene.getPhysicsEngine(); if (pe && pe.__orig) { pe._step = pe.__orig; delete pe.__orig; } }, info: () => ({ fps: engine.getFps(), bots: bots.length, lebend: bots.filter(b => !b.tot).length, spieler: spieler && { leben: spieler.leben, pos: spieler.cc.getPosition().asArray().map(v => +v.toFixed(2)), kills: spieler.kills, waffen: spieler.waffen.map(w => w.id + ':' + w.mag + '/' + w.reserve) }, kisten: kisten.length, objekte: szene.meshes.length, zeichnungen: engine._drawCalls ? engine._drawCalls.current : null, vorbei, zeit }) };
    try {
      const fn = new Function('sd', '"use strict";return (async()=>{\n' + code + '\n})();');
      await fn(sd);
    } catch (e) { aufraeumenNachFehler(e); }
    function aufraeumenNachFehler(e) { opt.beiFehler && opt.beiFehler(e); }
    return steuerung;
  }

  window.SDEngine = { starten, WAFFEN, hoehenFunktion, formenGitter, formenText, zufall, version: '1.1' };
})();
