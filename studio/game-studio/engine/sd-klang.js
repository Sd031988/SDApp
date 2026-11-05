/* SD Klang – Musik und eigene Töne für die SD Engine.
   sd.musik('ruhig' | 'spannung' | 'action' | 'auto' | '<eigene Datei>', { lautstaerke })  ·  sd.musik(null) = aus
   sd.klang('<eigene Datei oder eingebauter Ton>', { pos: [x, y, z], lautstaerke, schleife })  → { stop() }
   Eingebaute Töne: schuss, pistole, schrot, explosion, treffer, kopf, aufheben, muenze, nachladen, schaden, tot, schritt, klick, tuer, alarm, sieg
   Die Musik wird live erzeugt (kein Download, keine Rechte Dritter). Eigene Dateien (.mp3/.ogg/.wav/.m4a) kommen aus der Werkstatt → 📦 Meine Modelle. */
'use strict';
(window.SDModule = window.SDModule || []).push(function (ctx) {
  const STILE = {
    ruhig: { bpm: 72, akkorde: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], bass: true, trommel: 0, melodie: 0.35, pad: 0.5 },
    spannung: { bpm: 96, akkorde: [[50, 53, 57], [50, 53, 56], [46, 50, 53], [49, 52, 56]], bass: true, trommel: 1, melodie: 0.2, pad: 0.4, puls: true },
    action: { bpm: 132, akkorde: [[52, 55, 59], [48, 52, 55], [50, 54, 57], [47, 50, 54]], bass: true, trommel: 2, melodie: 0.45, pad: 0.25, puls: true },
  };
  const EINGEBAUT = ['schuss', 'pistole', 'schrot', 'explosion', 'treffer', 'kopf', 'aufheben', 'muenze', 'nachladen', 'schaden', 'tot', 'schritt', 'klick', 'tuer', 'alarm', 'sieg'];
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  const puffer = {};
  async function pufferVon(name) { if (puffer[name]) return puffer[name]; const a = ctx.eigene(name); if (a.typ !== 'ton') throw new Error('„' + name + '“ ist keine Tondatei'); const AC = ctx.audioKontext(); if (!AC) throw new Error('Kein Ton verfügbar');
    puffer[name] = await AC.decodeAudioData(await a.datei.arrayBuffer()); return puffer[name]; }

  let musik = null, autoModus = false, letzterKampf = -99, lautMusik = 0.5;
  ctx.beiSchuss.push(() => { letzterKampf = ctx.zeit; });

  function stoppen(m, ausblenden) { if (!m) return; m.aus = true; const AC = ctx.audioKontext(); try { m.g.gain.setTargetAtTime(0, AC.currentTime, ausblenden || 0.4); } catch (e) { /* egal */ } setTimeout(() => { try { m.quelle && m.quelle.stop(); m.g.disconnect(); } catch (e) { /* egal */ } }, 2500); }

  /** Live erzeugte Musik: Akkord-Flächen, Bass, Schlagzeug, einfache Melodie – plant immer ~0,3 s voraus */
  function erzeugt(stilName) {
    const AC = ctx.audioKontext(), B = ctx.bus(); if (!AC || !B) return null; const st = STILE[stilName], g = AC.createGain(); g.gain.value = 0; g.connect(B.musik); g.gain.setTargetAtTime(lautMusik, AC.currentTime, 0.8);
    const m = { stil: stilName, g, aus: false, schlag: 0, naechste: AC.currentTime + 0.1 }; const sechz = 60 / st.bpm / 4; let zufall = ctx.zufall(stilName.length * 7);
    const note = (f, t, dauer, typ, laut, filter) => { const o = AC.createOscillator(), gg = AC.createGain(); o.type = typ; o.frequency.value = f; gg.gain.setValueAtTime(0.0001, t); gg.gain.exponentialRampToValueAtTime(laut, t + Math.min(0.04, dauer / 3)); gg.gain.exponentialRampToValueAtTime(0.0001, t + dauer);
      if (filter) { const fl = AC.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = filter; o.connect(fl); fl.connect(gg); } else o.connect(gg); gg.connect(g); o.start(t); o.stop(t + dauer + 0.05); };
    const rausch = (t, dauer, fq, typ, laut) => { const n = AC.createBufferSource(), b = AC.createBuffer(1, AC.sampleRate * dauer | 0, AC.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 4);
      n.buffer = b; const f = AC.createBiquadFilter(); f.type = typ; f.frequency.value = fq; const gg = AC.createGain(); gg.gain.value = laut; n.connect(f); f.connect(gg); gg.connect(g); n.start(t); };
    m.planen = () => { while (!m.aus && m.naechste < AC.currentTime + 0.3) { const t = m.naechste, s = m.schlag % 16, takt = Math.floor(m.schlag / 16), ak = st.akkorde[takt % st.akkorde.length];
        if (s === 0) ak.forEach(n => note(hz(n), t, sechz * 16, 'sawtooth', 0.045 * st.pad, 900));   // Fläche
        if (st.bass && (s % 4 === 0 || (st.puls && s % 2 === 0))) note(hz(ak[0] - 12), t, sechz * (st.puls ? 1.8 : 3.5), 'triangle', 0.18, 600);
        if (st.trommel) { if (s % 8 === 0 || (st.trommel > 1 && s === 10)) note(55, t, 0.25, 'sine', 0.5); if (s % 8 === 4) rausch(t, 0.18, 1800, 'bandpass', 0.35); if (st.trommel > 1 || s % 4 === 2) rausch(t, 0.04, 7000, 'highpass', 0.12); }
        if (s % 2 === 0 && zufall() < st.melodie) { const n = ak[Math.floor(zufall() * 3)] + 12 + (zufall() < 0.3 ? 2 : 0); note(hz(n), t, sechz * (zufall() < 0.5 ? 2 : 4), 'triangle', 0.07, 2400); }
        m.schlag++; m.naechste += sechz; } };
    return m;
  }
  async function datei(name, lautstaerke) { const AC = ctx.audioKontext(), B = ctx.bus(); if (!AC || !B) return null; const buf = await pufferVon(name), q = AC.createBufferSource(), g = AC.createGain(); q.buffer = buf; q.loop = true; g.gain.value = 0; q.connect(g); g.connect(B.musik); g.gain.setTargetAtTime(lautstaerke, AC.currentTime, 0.6); q.start(); return { stil: name, g, quelle: q, aus: false }; }

  async function musikStarten(was, o) {
    o = o || {}; if (o.lautstaerke != null) { lautMusik = ctx.klemme(o.lautstaerke, 0, 1); }
    if (!was) { autoModus = false; stoppen(musik); musik = null; return; }
    if (was === 'auto') { autoModus = true; was = 'ruhig'; } else if (!o.vonAuto) autoModus = false;
    if (musik && musik.stil === was && !musik.aus) { musik.g.gain.setTargetAtTime(lautMusik, ctx.audioKontext().currentTime, 0.4); return; }
    const alt = musik; musik = STILE[was] ? erzeugt(was) : await datei(was, lautMusik); stoppen(alt, 1.2);
  }
  function klang(name, o) {
    o = o || {}; const V = ctx.V, pos = o.pos ? (Array.isArray(o.pos) ? V(o.pos[0], o.pos[1], o.pos[2]) : o.pos) : null;
    if (EINGEBAUT.includes(name)) { ctx.ton(name, o.lautstaerke ?? 1, pos); return { stop() {} }; }
    const AC = ctx.audioKontext(), B = ctx.bus(); if (!AC || !B) return { stop() {} }; const h = { q: null, stop() { try { this.q && this.q.stop(); } catch (e) { /* egal */ } this.aus = true; } };
    pufferVon(name).then(buf => { if (h.aus) return; const q = AC.createBufferSource(), g = AC.createGain(); q.buffer = buf; q.loop = !!o.schleife; g.gain.value = o.lautstaerke ?? 1; q.connect(g);
      if (pos) { const pn = AC.createPanner(); pn.panningModel = 'HRTF'; pn.distanceModel = 'inverse'; pn.refDistance = 8; pn.rolloffFactor = 0.6; pn.positionX.value = pos.x; pn.positionY.value = pos.y; pn.positionZ.value = -pos.z; g.connect(pn); pn.connect(B.effekte); } else g.connect(B.effekte);
      q.start(); h.q = q; }).catch(e => ctx.nachricht('🔇 ' + e.message, 4));
    return h;
  }
  ctx.aufraeumen.push(() => { stoppen(musik, 0.05); musik = null; });
  return {
    api: { musik: musikStarten, klang, MUSIKSTILE: Object.keys(STILE), TOENE: EINGEBAUT, get musikStil() { return musik && !musik.aus ? musik.stil : null; } },
    update() { if (musik && musik.planen) musik.planen(); if (autoModus) { const kampf = ctx.zeit - letzterKampf < 10; const ziel = kampf ? 'action' : 'ruhig'; if (!musik || musik.stil !== ziel) musikStarten(ziel, { vonAuto: true }); } },
  };
});
