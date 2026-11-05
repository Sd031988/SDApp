/* SD Engine · optional Nordhafen-Taktikbewegung.
   Kein Effekt auf andere Spiele, solange sd.taktik() nicht aktiviert wird.
   Keine externen Abhängigkeiten, keine privaten Havok-Felder. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.SDTaktikBewegung = api;
    (root.SDModule = root.SDModule || []).push(api.binden);
  }
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const HOEHEN = Object.freeze({ stehen: 1.8, ducken: 1.12, liegen: 0.76 });
  const SPEED = Object.freeze({ gehen: 5.2, sprint: 8.1, zielen: 3.0, ducken: 2.65, liegen: 1.3 });
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  function zustand() {
    return { aktiv: false, liegt: false, rutsch: 0, rutschRichtung: null,
      neigung: 0, neigungZiel: 0, schulter: 1, form: 'stehen',
      capsule: 'stehen', kapselFunktioniert: null, customShapes: [],
      halbhoehe: 0.9, keyZ: false, keyX: false, keyB: false, airborne: false };
  }
  function berechnen(s, i, dt) {
    const step = clamp(Number.isFinite(dt) ? dt : 0, 0, 0.05);
    if (i.liegenToggle) s.liegt = !s.liegt;
    if (s.liegt && i.sprint && i.vor > 0.2) s.liegt = false;
    const amBoden = i.amBoden !== false;
    const rutschenStart = i.rutschenToggle && i.sprint && i.vor > 0.35 && !s.liegt && amBoden;
    if (rutschenStart) { s.rutsch = 0.83; s.rutschRichtung = [i.vor, i.seit]; }
    if (!amBoden) s.rutsch = 0;
    if (s.rutsch > 0) s.rutsch = Math.max(0, s.rutsch - step);
    const rutschend = s.rutsch > 0.001;
    const ducken = !s.liegt && (!!i.ducken || rutschend);
    s.form = s.liegt ? 'liegen' : ducken ? 'ducken' : 'stehen';
    const sprint = !!i.sprint && !ducken && !s.liegt;
    let speed = s.liegt ? SPEED.liegen : ducken ? SPEED.ducken : i.zielen ? SPEED.zielen : sprint ? SPEED.sprint : SPEED.gehen;
    if (rutschend) speed = 5.4 + 4.4 * Math.min(1, s.rutsch / 0.83);
    if (i.boost) speed *= 1.08;
    const ziel = i.zielen && !rutschend ? (i.links ? -1 : i.rechts ? 1 : 0) : 0;
    s.neigungZiel = ziel;
    s.neigung += (ziel - s.neigung) * Math.min(1, step * 13);
    return { tempo: speed, ducken, springVerbot: s.liegt || rutschend, form: s.form,
      rutschend, neigung: s.neigung, sprint };
  }
  function binden(ctx) {
    const BAB = ctx.BAB, s = zustand();
    let initialisiert = false, shapes = null;
    let letzteMeldung = -100;
    function aufnehmen() {
      if (initialisiert) return;
      initialisiert = true;
      const keys = ctx.tastenHandler;
      (keys.Z = keys.Z || []).push(() => { if (!s.keyZ && !ctx.uebernahme) { s.liegt = !s.liegt; s.keyZ = true; } });
      (keys.X = keys.X || []).push(() => { if (!s.keyX && !ctx.uebernahme) { s.rutschWunsch = true; s.keyX = true; } });
      (keys.B = keys.B || []).push(() => { if (!s.keyB && !ctx.uebernahme) { s.schulter *= -1; s.keyB = true; } });
    }
    function pruefePlatz(cc, alter, neu) {
      if (neu <= alter || !ctx.szene.pickWithRay || !BAB.Ray) return true;
      const pos = cc.getPosition(), fuss = pos.y - alter / 2, laenge = neu - alter;
      const ray = new BAB.Ray(new BAB.Vector3(pos.x, fuss + alter - 0.03, pos.z),
        new BAB.Vector3(0, 1, 0), laenge + 0.08);
      const hit = ctx.szene.pickWithRay(ray, m => {
        if (!m || !m.isPickable || !m.isEnabled || !m.isEnabled()) return false;
        return !(m.metadata && (m.metadata.figur || m.metadata.keinTreffer));
      });
      return !hit || !hit.hit;
    }
    function kapsel(sp, art) {
      if (!sp || !sp.cc || s.capsule === art) return;
      const cc = sp.cc, alt = HOEHEN[s.capsule], neu = HOEHEN[art];
      if (s.kapselFunktioniert === false) { s.capsule = art; return; }
      if (!pruefePlatz(cc, alt, neu)) {
        if (ctx.zeit - letzteMeldung > 1.4) { ctx.nachricht('Zu wenig Platz zum Aufstehen', 1.4); letzteMeldung = ctx.zeit; }
        return false;
      }
      try {
        // Babylon Lite: offiziell unterstütztes Resize. Babylon Core:
        // öffentliche shape-Eigenschaft, keine privaten Controller-Felder.
        if (typeof cc.setShapeOptions === 'function') {
          cc.setShapeOptions({ capsuleHeight: neu, capsuleRadius: 0.38 }, true);
        } else if (BAB.PhysicsShapeCapsule && 'shape' in cc) {
          if (!shapes) shapes = { stehen: cc.shape };
          if (!shapes[art]) {
            const a = Math.max(0.001, neu / 2 - 0.38);
            shapes[art] = new BAB.PhysicsShapeCapsule(
              new BAB.Vector3(0, -a, 0), new BAB.Vector3(0, a, 0), 0.38, ctx.szene);
            s.customShapes.push(shapes[art]);
          }
          const vor = cc.getPosition();
          cc.shape = shapes[art];
          cc.setPosition(vor.add(new BAB.Vector3(0, (neu - alt) / 2, 0)));
        } else { s.kapselFunktioniert = false; s.capsule = art; return true; }
        s.kapselFunktioniert = true; s.capsule = art;
        return true;
      } catch (e) {
        s.kapselFunktioniert = false;
        s.capsule = art; // visueller Fallback; keine Manipulation privater Havok-Felder
        try { console.warn('Taktik: Kapsel-Resize nicht verfügbar', e); } catch (_) { /* optional */ }
        return true;
      }
    }
    function vor(i) {
      if (!s.aktiv || !i.spieler || ctx.uebernahme) return null;
      // Zurücksetzen nach Taste-Loslassen, unabhängig von key repeat.
      if (!ctx.tasten.Z) s.keyZ = false;
      if (!ctx.tasten.X) s.keyX = false;
      if (!ctx.tasten.B) s.keyB = false;
      const r = berechnen(s, {
        vor: i.vor, seit: i.seit, sprint: i.sprint, zielen: !!i.maus.rechts,
        ducken: i.ducken, links: !!ctx.tasten.Q, rechts: !!ctx.tasten.T,
        boost: i.spieler.boost > 0, amBoden: i.spieler.zustand.luft === 0,
        rutschenToggle: !!s.rutschWunsch
      }, i.dt);
      s.rutschWunsch = false;
      if (kapsel(i.spieler, r.form) === false) {
        // Erzwungenes Ducken/Liegen, bis über dem Kopf Platz ist.
        s.liegt = s.capsule === 'liegen';
        s.rutsch = 0;
        const gezwungen = berechnen(s, Object.assign({}, i, {
          vor: i.vor, seit: i.seit, sprint: false, zielen: i.maus.rechts,
          ducken: s.capsule === 'ducken', links: false, rechts: false,
          amBoden: true
        }), i.dt);
        Object.assign(r, gezwungen);
      }
      const echt = s.kapselFunktioniert === true;
      const h = echt ? HOEHEN[s.capsule] : HOEHEN.stehen;
      i.spieler.taktikHalbhoehe = h / 2;
      const eye = { stehen: 1.58, ducken: 1.0, liegen: 0.5 }[r.form];
      i.spieler.taktikKopfOffset = eye - h / 2;
      i.spieler.taktikSichtOffset = r.form === 'liegen' ? (echt ? 0.03 : -0.35) :
        r.form === 'ducken' ? (echt ? 0.35 : -0.5) : 0;
      i.spieler.taktikForm = r.form;
      i.spieler.taktikNeigung = r.neigung;
      i.spieler.taktikSprint = r.sprint;
      i.spieler.taktikRutsch = r.rutschend;
      return r;
    }
    function nach(sp, dt) {
      if (!s.aktiv || !sp || !sp.k) return;
      const form = sp.taktikForm || 'stehen', ziel = form === 'liegen' ? 1.28 : 0;
      // Modell liegt horizontal, Pivot bleibt am Boden; sanfter Übergang.
      sp.k.rotation.x += (ziel - sp.k.rotation.x) * Math.min(1, dt * 11);
      const lean = (sp.taktikNeigung || 0) * 0.18;
      sp.k.rotation.z += (lean - sp.k.rotation.z) * Math.min(1, dt * 12);
      if (form === 'liegen') sp.k.position.y += 0.22;
      if (sp.taktikRutsch) sp.k.rotation.x += (0.32 - sp.k.rotation.x) * Math.min(1, dt * 9);
    }
    function kamera(sp, camera, dt) {
      if (!s.aktiv || !sp || !camera) return;
      const right = new BAB.Vector3(Math.cos(sp.gier), 0, -Math.sin(sp.gier));
      camera.position.addInPlace(right.scale((sp.taktikNeigung || 0) * 0.22));
      camera.rotation.z = (sp.taktikNeigung || 0) * -0.075;
      if (sp.taktikSprint) {
        const E = ctx.opt.einstellungen || {}, basis = ((E.sicht || 57.3) * Math.PI / 180);
        const ziel = basis + 0.065; camera.fov += (ziel - camera.fov) * Math.min(1, dt * 5);
      }
    }
    function aktivieren() {
      if (s.aktiv) return { aktiv: true, info: () => ({ form: s.form, neigung: s.neigung }) };
      s.aktiv = true;
      aufnehmen();
      ctx.taktikVor = vor;
      ctx.taktikNach = nach;
      ctx.taktikKamera = kamera;
      ctx.taktikStreuung = () => s.form === 'liegen' ? 0.65 : s.form === 'ducken' ? 0.8 : 1;
      ctx.taktikRuhig = () => s.form === 'liegen';
      ctx.aufraeumen.push(() => {
        for (const shape of s.customShapes) { try { shape.dispose(); } catch (_) { /* Havok bereits weg */ } }
      });
      return { aktiv: true, info: () => ({ form: s.form, neigung: s.neigung }) };
    }
    return { api: { taktik: aktivieren } };
  }
  return Object.freeze({ HOEHEN, SPEED, zustand, berechnen, binden });
});
