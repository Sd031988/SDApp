/* SD Spiel – Geld, Inventar, Läden, Missionen mit Zielen, Spielstand, Granaten und Nahkampf. Engine-Modul.
   Tasten: G = Granate werfen · V = Nahkampf · H = Medikit benutzen · J = Missionen & Inventar · E = Laden/Mission betreten */
'use strict';
(function () {
  (window.SDModule = window.SDModule || []).push(function (ctx) {
    const { BAB, V, szene, kamera } = ctx, hud = ctx.hud;
    const zustand = { geld: 0, inventar: { medikit: 0, granate: 0 }, erledigt: [], aktiv: null, schritt: 0 };
    let standName = null, speicherTimer = 0, missionen = [], laeden = [], offenerLaden = null, kampagne = null;
    ctx.kartenMarker = ctx.kartenMarker || [];
    /* ---------- Anzeige ---------- */
    const box = document.createElement('div'); box.style.cssText = 'position:absolute;top:208px;left:14px;width:150px;font:600 13px system-ui;text-shadow:0 1px 3px #000;pointer-events:none';
    const zeile = (t) => { const d = document.createElement('div'); d.style.cssText = 'background:rgba(12,18,26,.72);border:1px solid rgba(255,255,255,.12);border-radius:6px;padding:5px 8px;margin-top:6px'; d.textContent = t; box.appendChild(d); return d; };
    const geldEl = zeile('💰 0'), invEl = zeile('✚ 0 · 💣 0'); geldEl.hidden = invEl.hidden = true;
    const zielEl = document.createElement('div'); zielEl.style.cssText = 'position:absolute;top:58px;left:50%;transform:translateX(-50%);background:rgba(12,18,26,.8);border:1px solid #ffb547;border-radius:8px;padding:7px 14px;font:600 14px system-ui;max-width:70vw;text-align:center;pointer-events:none'; zielEl.hidden = true;
    const fenster = document.createElement('div'); fenster.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:min(440px,92vw);max-height:80vh;overflow:auto;background:rgba(14,20,30,.96);border:1px solid rgba(255,255,255,.15);border-radius:12px;padding:16px 18px;font:14px/1.5 system-ui;color:#eef2f6;pointer-events:auto'; fenster.hidden = true;
    const ebene = hud.feed ? hud.feed.parentNode : document.body; [box, zielEl, fenster].forEach(e => ebene.appendChild(e));
    ctx.aufraeumen.push(() => { [box, zielEl, fenster].forEach(e => e.remove()); });
    function anzeigen() { geldEl.textContent = '💰 ' + zustand.geld; invEl.textContent = '✚ ' + zustand.inventar.medikit + ' (H) · 💣 ' + zustand.inventar.granate + ' (G)'; }
    function fensterZu() { fenster.hidden = true; offenerLaden = null; }
    function fensterAuf(html) { fenster.innerHTML = html; fenster.hidden = false; try { document.exitPointerLock(); } catch (e) { /* egal */ } }

    /* ---------- Geld & Inventar ---------- */
    function geld(n) { zustand.geld = Math.max(0, Math.round(zustand.geld + (n || 0))); geldEl.hidden = false; anzeigen(); if (n > 0) ctx.ton('muenze'); return zustand.geld; }
    function geben(art, anzahl) { anzahl = anzahl || 1; const sp = ctx.spieler;
      if (art === 'medikit' || art === 'granate') { zustand.inventar[art] += anzahl; invEl.hidden = false; }
      else if (art === 'munition' && sp) sp.waffen.forEach(w => { w.reserve += w.def.magazin * 2 * anzahl; });
      else if (art === 'ruestung' && sp) sp.ruestung = Math.min(100, sp.ruestung + 50 * anzahl);
      else if (art.startsWith('waffe:')) ctx.sd.waffe(art.slice(6));
      anzeigen(); }
    (ctx.tastenHandler.H = ctx.tastenHandler.H || []).push(() => { const sp = ctx.spieler; if (!sp || zustand.inventar.medikit <= 0) return; if (sp.leben >= sp.maxLeben) { ctx.nachricht('Leben ist voll'); return; } zustand.inventar.medikit--; sp.leben = Math.min(sp.maxLeben, sp.leben + 40); ctx.ton('aufheben'); ctx.nachricht('✚ +40 Leben'); anzeigen(); });

    /* ---------- 💣 Granaten ---------- */
    const granaten = []; let punktTex = null;
    function explosion(p, radius, staerke, quelle) {
      if (!punktTex) { punktTex = new BAB.DynamicTexture('explTex', 64, szene, false); const c = punktTex.getContext(), g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 64); punktTex.update(); punktTex.hasAlpha = true; }
      const ps = new BAB.ParticleSystem('explosion', 300, szene); ps.particleTexture = punktTex; ps.emitter = p.clone(); ps.color1 = new BAB.Color4(1, 0.8, 0.3, 1); ps.color2 = new BAB.Color4(1, 0.35, 0.05, 1); ps.colorDead = new BAB.Color4(0.2, 0.2, 0.2, 0);
      ps.minSize = 0.6; ps.maxSize = 2.4; ps.minLifeTime = 0.25; ps.maxLifeTime = 0.9; ps.manualEmitCount = 220; ps.minEmitPower = 3; ps.maxEmitPower = 12; ps.direction1 = V(-1, 0.3, -1); ps.direction2 = V(1, 1.5, 1); ps.blendMode = BAB.ParticleSystem.BLENDMODE_ADD; ps.targetStopDuration = 0.4; ps.disposeOnStop = true; ps.start();
      const l = new BAB.PointLight('blitz', p.add(V(0, 1, 0)), szene); l.diffuse = new BAB.Color3(1, 0.6, 0.25); l.intensity = 25; l.range = radius * 4; setTimeout(() => l.dispose(), 250);
      ctx.ton('explosion', 1, p); ctx.beiSchuss.forEach(f => f(p, quelle));
      const wirkung = d => Math.max(0, 1 - d / radius) * staerke;
      for (const b of ctx.bots) { if (b.tot) continue; const d = BAB.Vector3.Distance(b.cc.getPosition(), p); if (d < radius) ctx.schaden(b, wirkung(d) * 1.6, quelle); }
      if (ctx.spieler && ctx.spieler.leben > 0) { const d = BAB.Vector3.Distance(ctx.spielerPos(), p); if (d < radius) ctx.schaden(ctx.spieler, wirkung(d), 'eigene Granate'); }
      if (ctx.sd.autos) for (const a of ctx.sd.autos) { const d = BAB.Vector3.Distance(a.chassis.getAbsolutePosition(), p); if (d < radius && ctx.fahrzeugTreffer) ctx.fahrzeugTreffer(a.id, wirkung(d), p); }
      for (const m of szene.meshes) { if (!m.physicsBody || m.physicsBody.getMotionType() !== BAB.PhysicsMotionType.DYNAMIC || m.isDisposed()) continue; const d = BAB.Vector3.Distance(m.getAbsolutePosition(), p); if (d < radius && d > 0.01) m.physicsBody.applyImpulse(m.getAbsolutePosition().subtract(p).normalize().scale(wirkung(d) * 8), m.getAbsolutePosition()); }
    }
    (ctx.tastenHandler.G = ctx.tastenHandler.G || []).push(() => { const sp = ctx.spieler; if (!sp || sp.leben <= 0 || ctx.uebernahme || ctx.vorbei) return; if (zustand.inventar.granate <= 0) { ctx.nachricht('Keine Granaten – im Laden kaufen'); return; }
      zustand.inventar.granate--; anzeigen(); const dir = kamera.getForwardRay(1).direction, start = sp.cc.getPosition().add(V(0, 0.7, 0)).add(dir.scale(0.8));
      const g = BAB.MeshBuilder.CreateSphere('granate', { diameter: 0.16, segments: 8 }, szene); g.position = start; g.material = ctx.BK.material('metall', '#3d4433'); ctx.schatten.addShadowCaster(g);
      const agg = new BAB.PhysicsAggregate(g, BAB.PhysicsShapeType.SPHERE, { mass: 0.4, restitution: 0.35, friction: 0.8 }, szene); agg.body.applyImpulse(dir.add(V(0, 0.3, 0)).normalize().scale(4.4), start);
      granaten.push({ g, t: 2.4 }); ctx.ton('nachladen'); });
    function granatenUpdate(dt) { for (let i = granaten.length - 1; i >= 0; i--) { const x = granaten[i]; x.t -= dt; if (x.t <= 0) { const p = x.g.getAbsolutePosition().clone(); x.g.physicsBody && x.g.physicsBody.dispose(); x.g.dispose(); granaten.splice(i, 1); explosion(p, 7, 110, 'Spieler'); } } }

    /* ---------- 👊 Nahkampf ---------- */
    let schlagZeit = 0;
    (ctx.tastenHandler.V = ctx.tastenHandler.V || []).push(() => { const sp = ctx.spieler; if (!sp || sp.leben <= 0 || ctx.uebernahme || ctx.zeit - schlagZeit < 0.6) return; schlagZeit = ctx.zeit;
      const p = sp.cc.getPosition(), vorn = V(Math.sin(sp.gier), 0, Math.cos(sp.gier)); let getroffen = false;
      for (const b of ctx.bots) { if (b.tot) continue; const d = b.cc.getPosition().subtract(p); d.y = 0; const l = d.length(); if (l < 2.3 && BAB.Vector3.Dot(d.normalize(), vorn) > 0.4) { ctx.schaden(b, 34, 'Spieler'); b.cc.setVelocity(vorn.scale(6).add(V(0, 2, 0))); getroffen = true; } }
      if (sp.k.teile && sp.k.teile.arm1) { const a = sp.k.teile.arm1; a.rotation.x = -2.2; setTimeout(() => { a.rotation.x = -1.35; }, 180); }
      ctx.ton(getroffen ? 'treffer' : 'nachladen', getroffen ? 1 : 0.4); if (getroffen && hud.treffer) hud.treffer.style.opacity = 1; });

    /* ---------- 🏪 Läden ---------- */
    const NAMEN = { medikit: '✚ Medikit (+40 Leben)', granate: '💣 Granate', munition: '📦 Munition für alle Waffen', ruestung: '🛡 Schutzweste +50', 'waffe:gewehr': '🔫 Sturmgewehr', 'waffe:schrotflinte': '🔫 Schrotflinte', 'waffe:scharfschuetze': '🎯 Scharfschützengewehr', 'waffe:pistole': '🔫 Pistole' };
    /** sd.laden({ pos:[x,null,z], name, angebot:[{ art:'medikit', preis:40 }, …], drehung }) */
    function laden(o) {
      o = Object.assign({ name: 'Laden', angebot: [{ art: 'medikit', preis: 40 }, { art: 'granate', preis: 75 }, { art: 'munition', preis: 30 }, { art: 'ruestung', preis: 120 }, { art: 'waffe:gewehr', preis: 350 }, { art: 'waffe:schrotflinte', preis: 280 }, { art: 'waffe:scharfschuetze', preis: 600 }] }, o || {});
      const x = o.pos[0], z = o.pos[2], y = o.pos[1] ?? ctx.hoehe(x, z), w = new BAB.TransformNode('laden', szene); w.position = V(x, y, z); w.rotation.y = (o.drehung || 0) * Math.PI / 180;
      const teil = (mesh, mat, px, py, pz) => { mesh.parent = w; mesh.position = V(px, py, pz); mesh.material = mat; ctx.schatten.addShadowCaster(mesh); mesh.receiveShadows = true; return mesh; };
      teil(BAB.MeshBuilder.CreateBox('theke', { width: 3, height: 1.1, depth: 1 }, szene), ctx.BK.material('holz', '#a87a4a'), 0, 0.55, 0);
      teil(BAB.MeshBuilder.CreateBox('dach', { width: 3.6, height: 0.12, depth: 2 }, szene), ctx.BK.material(null, '#c83a2a'), 0, 2.6, -0.2);
      for (const sx of [-1.6, 1.6]) teil(BAB.MeshBuilder.CreateCylinder('stange', { diameter: 0.1, height: 2.6 }, szene), ctx.BK.material('metall', '#555a60'), sx, 1.3, -0.9);
      teil(BAB.MeshBuilder.CreateBox('schild', { width: 2.6, height: 0.5, depth: 0.08 }, szene), ctx.BK.material(null, '#1a1a1a', { leuchten: '#ffb547', leuchtStaerke: 1.2 }), 0, 2.95, 0.6);
      const n = new BAB.TransformNode('ladenPhysik', szene); n.position = V(x, y + 0.55, z); n.rotation.y = w.rotation.y; const body = new BAB.PhysicsBody(n, BAB.PhysicsMotionType.STATIC, false, szene); body.shape = new BAB.PhysicsShapeBox(V(0, 0, 0), BAB.Quaternion.Identity(), V(3, 1.1, 1), szene);
      const l = { o, pos: V(x, y, z) }; laeden.push(l); ctx.kartenMarker.push({ x, z, farbe: '#4ad86a' }); geldEl.hidden = false; anzeigen(); return l;
    }
    function ladenOeffnen(l) { offenerLaden = l; fensterAuf('<b style="font-size:17px">🏪 ' + l.o.name + '</b><span style="float:right">💰 ' + zustand.geld + '</span><div id="sdLadenListe" style="margin:12px 0;display:flex;flex-direction:column;gap:6px"></div><button id="sdLadenZu" style="width:100%;padding:9px;border-radius:8px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#fff;font:600 14px system-ui;cursor:pointer">Schließen (E)</button>');
      const liste = fenster.querySelector('#sdLadenListe');
      l.o.angebot.forEach((a, i) => { const b = document.createElement('button'); b.style.cssText = 'display:flex;justify-content:space-between;padding:9px 12px;border-radius:8px;border:1px solid rgba(255,255,255,.15);background:' + (zustand.geld >= a.preis ? 'rgba(255,181,71,.15)' : 'rgba(255,255,255,.04)') + ';color:#fff;font:600 14px system-ui;cursor:pointer';
        b.innerHTML = '<span>' + (i + 1) + '. ' + (NAMEN[a.art] || a.art) + '</span><span>💰 ' + a.preis + '</span>'; b.onclick = () => kaufen(l, i); liste.appendChild(b); });
      fenster.querySelector('#sdLadenZu').onclick = fensterZu; }
    function kaufen(l, i) { const a = l.o.angebot[i]; if (!a) return; if (zustand.geld < a.preis) { ctx.nachricht('Nicht genug Geld (' + a.preis + ' nötig)'); return; } zustand.geld -= a.preis; geben(a.art); ctx.ton('aufheben'); ctx.nachricht('Gekauft: ' + (NAMEN[a.art] || a.art)); speichern(); ladenOeffnen(l); }
    ['1', '2', '3', '4', '5', '6', '7', '8', '9'].forEach((t, i) => (ctx.tastenHandler[t] = ctx.tastenHandler[t] || []).push(() => { if (offenerLaden) kaufen(offenerLaden, i); }));

    /* ---------- 🎯 Missionen ---------- */
    /**
     * sd.mission({ id, titel, text, start:[x,z] (optional: Treffpunkt, dort E drücken), belohnung:{ geld, gegenstaende:[] }, zeitlimit (s),
     *   schritte: [ { art:'gehe', pos:[x,z], radius, text } | { art:'fahre', pos:[x,z], text } (im Auto) | { art:'sammle', pos:[x,z], text }
     *             | { art:'besiege', erzeugen: () => [sd.gegner(…), …], text } | { art:'warte', sekunden, text } | { art:'eigen', pruefe: () => true/false, text } ] })
     * Missionen laufen nacheinander. Erledigte Missionen werden im Spielstand gemerkt.
     */
    function mission(m) { m.id = m.id || ('m' + missionen.length); missionen.push(m); if (!zustand.aktiv && !zustand.erledigt.includes(m.id)) naechste(); return m; }
    const offen = () => missionen.find(m => !zustand.erledigt.includes(m.id));
    let strahl = null, sammelObj = null, schrittDaten = null, zeitRest = null, wartet = false;
    function strahlZeigen(x, z, farbe) { if (!strahl) { strahl = BAB.MeshBuilder.CreateCylinder('zielStrahl', { diameter: 1.6, height: 60, tessellation: 16, cap: BAB.Mesh.NO_CAP }, szene); const m = new BAB.StandardMaterial('zielMat', szene); m.emissiveColor = new BAB.Color3(1, 0.75, 0.2); m.disableLighting = true; m.alpha = 0.32; m.backFaceCulling = false; strahl.material = m; strahl.isPickable = false; strahl.applyFog = false; }
      strahl.setEnabled(true); strahl.position = V(x, ctx.hoehe(x, z) + 30, z); strahl.material.emissiveColor = BAB.Color3.FromHexString(farbe || '#ffbf33'); }
    function markerSetzen(x, z, farbe) { ctx.kartenMarker = ctx.kartenMarker.filter(k => !k.mission); if (x != null) ctx.kartenMarker.push({ x, z, farbe: farbe || '#ffd23a', mission: true }); }
    function naechste() { const m = offen(); zustand.aktiv = null; if (!m) { zielEl.hidden = true; if (strahl) strahl.setEnabled(false); markerSetzen(null); return; }
      if (m.start && !m.__angenommen) { wartet = true; zustand.aktiv = m; zielEl.hidden = false; zielEl.textContent = '❗ Neue Mission: ' + m.titel + ' – zum Treffpunkt (E)'; strahlZeigen(m.start[0], m.start[1], '#4ad8ff'); markerSetzen(m.start[0], m.start[1], '#4ad8ff'); return; }
      wartet = false; zustand.aktiv = m; zustand.schritt = 0; zeitRest = m.zeitlimit || null; ctx.nachricht('🎯 ' + m.titel + (m.text ? ' – ' + m.text : ''), 5); schrittStarten(); }
    function schrittStarten() {
      const m = zustand.aktiv, s = m.schritte[zustand.schritt]; if (sammelObj) { sammelObj.dispose(); sammelObj = null; } schrittDaten = { zeit: 0 };
      if (!s) { abschliessen(m); return; }
      if (s.art === 'besiege') { schrittDaten.gegner = (s.erzeugen ? s.erzeugen() : ctx.bots.filter(b => !b.tot)) || []; if (strahl) strahl.setEnabled(false); }
      if (s.art === 'sammle') { sammelObj = BAB.MeshBuilder.CreateBox('sammelObjekt', { size: 0.6 }, szene); sammelObj.position = V(s.pos[0], ctx.hoehe(s.pos[0], s.pos[1]) + 0.7, s.pos[1]); sammelObj.material = ctx.BK.material(null, '#ffd23a', { leuchten: '#ffb000', leuchtStaerke: 1.5 }); }
      if (s.pos) { strahlZeigen(s.pos[0], s.pos[1], s.art === 'fahre' ? '#4ad86a' : '#ffbf33'); markerSetzen(s.pos[0], s.pos[1]); } else markerSetzen(null);
    }
    function abschliessen(m) {
      zustand.erledigt.push(m.id); zustand.aktiv = null; if (strahl) strahl.setEnabled(false); markerSetzen(null); const b = m.belohnung || {};
      if (b.geld) geld(b.geld); (b.gegenstaende || []).forEach(g => geben(g));
      ctx.nachricht('✅ Mission geschafft: ' + m.titel + (b.geld ? ' · +' + b.geld + ' 💰' : ''), 5); ctx.ton('aufheben'); speichern(); m.beiErfolg && m.beiErfolg();
      setTimeout(naechste, 2500); if (!offen() && kampagne && kampagne.beiEnde) setTimeout(() => kampagne.beiEnde(), 3000);
    }
    function scheitern(grund) { const m = zustand.aktiv; if (!m) return; ctx.nachricht('✗ Mission gescheitert: ' + grund + ' – versuch es nochmal', 5); (schrittDaten && schrittDaten.gegner || []).forEach(b => { if (!b.tot && b.leben != null) { b.leben = -1; } }); m.__angenommen = false; setTimeout(naechste, 3000); zustand.aktiv = null; zielEl.hidden = true; }
    function missionUpdate(dt) {
      const m = zustand.aktiv, sp = ctx.spieler; if (!m || !sp) return; const p = ctx.spielerPos();
      if (wartet) { const d = Math.hypot(p.x - m.start[0], p.z - m.start[1]); if (d < 4) ctx.hinweisText = 'E: Mission „' + m.titel + '“ annehmen'; return; }
      const s = m.schritte[zustand.schritt]; if (!s) return; schrittDaten.zeit += dt; let fertig = false, info = '';
      if (s.art === 'gehe' || s.art === 'fahre' || s.art === 'sammle') { const d = Math.hypot(p.x - s.pos[0], p.z - s.pos[1]), r = s.radius || (s.art === 'fahre' ? 6 : 3); info = ' · ' + Math.round(d) + ' m';
        if (d < r && (s.art !== 'fahre' || ctx.uebernahme)) fertig = true; if (s.art === 'fahre' && d < r && !ctx.uebernahme) info = ' · mit einem Auto (F) hierher!'; if (sammelObj) sammelObj.rotation.y += dt * 2; }
      else if (s.art === 'besiege') { const rest = schrittDaten.gegner.filter(b => !b.tot).length; info = ' · noch ' + rest; fertig = rest === 0; }
      else if (s.art === 'warte') { const r = Math.max(0, (s.sekunden || 10) - schrittDaten.zeit); info = ' · ' + Math.ceil(r) + ' s'; fertig = r <= 0; }
      else if (s.art === 'eigen') fertig = !!(s.pruefe && s.pruefe());
      if (zeitRest != null) { zeitRest -= dt; info += ' · ⏱ ' + Math.max(0, Math.ceil(zeitRest)) + ' s'; if (zeitRest <= 0) { scheitern('Zeit abgelaufen'); return; } }
      zielEl.hidden = false; zielEl.textContent = '🎯 ' + m.titel + ' (' + (zustand.schritt + 1) + '/' + m.schritte.length + '): ' + (s.text || s.art) + info;
      if (fertig) { ctx.ton('aufheben', 0.6); if (s.art === 'sammle') geld(s.geld || 0); zustand.schritt++; schrittStarten(); }
    }
    (ctx.tastenHandler.E = ctx.tastenHandler.E || []).push(() => {
      const sp = ctx.spieler; if (!sp || ctx.uebernahme) return; if (offenerLaden) { fensterZu(); return; } const p = ctx.spielerPos();
      const l = laeden.find(l => BAB.Vector3.Distance(l.pos, p) < 3.5); if (l) { ladenOeffnen(l); return; }
      const m = zustand.aktiv; if (m && wartet && Math.hypot(p.x - m.start[0], p.z - m.start[1]) < 4) { m.__angenommen = true; naechste(); }
    });
    (ctx.tastenHandler.J = ctx.tastenHandler.J || []).push(() => { if (!fenster.hidden) { fensterZu(); return; }
      const zeilen = missionen.map(m => '<div style="padding:5px 0;border-bottom:1px solid rgba(255,255,255,.08)">' + (zustand.erledigt.includes(m.id) ? '✅' : m === zustand.aktiv ? '🎯' : '◻') + ' <b>' + m.titel + '</b>' + (m.belohnung && m.belohnung.geld ? ' <span style="opacity:.7">· ' + m.belohnung.geld + ' 💰</span>' : '') + '</div>').join('');
      fensterAuf('<b style="font-size:17px">📋 Missionen & Inventar</b><div style="margin:10px 0">' + (zeilen || 'Keine Missionen in diesem Spiel.') + '</div><div>💰 ' + zustand.geld + ' · ✚ ' + zustand.inventar.medikit + ' Medikits · 💣 ' + zustand.inventar.granate + ' Granaten</div>' + (standName ? '<button id="sdNeu" style="margin-top:12px;width:100%;padding:8px;border-radius:8px;border:1px solid rgba(255,80,60,.5);background:rgba(255,80,60,.12);color:#fff;cursor:pointer">Spielstand löschen und neu beginnen</button>' : '') + '<p style="opacity:.6;font-size:12px;margin:10px 0 0">J = schließen · H Medikit · G Granate · V Nahkampf</p>');
      const n = fenster.querySelector('#sdNeu'); if (n) n.onclick = () => { if (!confirm('Spielstand wirklich löschen?')) return; try { localStorage.removeItem('sdSpielstand.' + standName); } catch (e) { /* egal */ } location.reload(); }; });

    /* ---------- 💾 Spielstand ---------- */
    function speichern() { if (!standName) return; const sp = ctx.spieler; const d = { geld: zustand.geld, inventar: zustand.inventar, erledigt: zustand.erledigt, waffen: sp ? sp.waffen.map(w => [w.id, w.mag, w.reserve]) : [], t: Date.now() };
      try { localStorage.setItem('sdSpielstand.' + standName, JSON.stringify(d)); } catch (e) { /* voll/privat */ } }
    /** sd.spielstand('name', { startgeld, wiederbeleben:[x,z] }) – lädt den gespeicherten Stand und speichert danach automatisch */
    function spielstand(name, o) {
      o = o || {}; standName = name; kampagne = o; let d = null; try { d = JSON.parse(localStorage.getItem('sdSpielstand.' + name) || 'null'); } catch (e) { /* neu */ }
      if (d) { zustand.geld = d.geld || 0; Object.assign(zustand.inventar, d.inventar || {}); zustand.erledigt = d.erledigt || []; zustand.waffenGeladen = d.waffen; } else zustand.geld = o.startgeld || 0;
      geldEl.hidden = invEl.hidden = false; anzeigen();
      if (o.wiederbeleben && !ctx.mehrspieler) ctx.beimTod = quelle => { ctx.nachricht('🏥 ' + (quelle || 'Ausgeschaltet') + ' – du wachst im Krankenhaus auf (−' + Math.min(zustand.geld, 100) + ' 💰)', 5); zustand.geld = Math.max(0, zustand.geld - 100); anzeigen();
        if (zustand.aktiv && !wartet) scheitern('du wurdest ausgeschaltet');
        setTimeout(() => { const sp = ctx.spieler, [x, z] = o.wiederbeleben; sp.cc.setPosition(V(x, ctx.hoehe(x, z) + 1.5, z)); sp.leben = sp.maxLeben; speichern(); }, 3500); return true; };
      return { neu: !d, erledigt: zustand.erledigt.slice() };
    }
    const gezaehlt = new Set();
    function update(dt) {
      granatenUpdate(dt); missionUpdate(dt);
      if (standName) for (const b of ctx.bots) if (b.tot && !gezaehlt.has(b)) { gezaehlt.add(b); geld(kampagne.kopfgeld ?? 25); }
      if (zustand.waffenGeladen && ctx.spieler) { const sp = ctx.spieler; zustand.waffenGeladen.forEach(([id, mag, res]) => { if (!sp.waffen.find(w => w.id === id)) ctx.sd.waffe(id, true); const w = sp.waffen.find(w => w.id === id); if (w) { w.mag = mag; w.reserve = res; } }); zustand.waffenGeladen = null; }
      if (!ctx.uebernahme && ctx.spieler && !offenerLaden) { const p = ctx.spielerPos(); const l = laeden.find(l => BAB.Vector3.Distance(l.pos, p) < 3.5); if (l && !ctx.hinweisText) ctx.hinweisText = 'E: ' + l.o.name + ' öffnen'; }
      if (offenerLaden && ctx.spieler && BAB.Vector3.Distance(offenerLaden.pos, ctx.spielerPos()) > 5) fensterZu();
      speicherTimer += dt; if (speicherTimer > 20) { speicherTimer = 0; speichern(); }
    }
    return { api: { geld, geben, laden, mission, spielstand, explosion: (pos, radius, staerke) => explosion(V(pos[0], pos[1], pos[2]), radius || 6, staerke || 100, 'Skript'), get spielZustand() { return zustand; }, speichern }, update };
  });
})();
