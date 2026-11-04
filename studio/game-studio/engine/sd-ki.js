/* SD KI – Wegfindung (Navigationsraster + A*), Deckung suchen, Gruppen-Alarm und Flankieren. Engine-Modul. */
'use strict';
(function () {
  (window.SDModule = window.SDModule || []).push(function (ctx) {
    const { BAB, V } = ctx; ctx.sperren = ctx.sperren || []; ctx.baumPunkte = ctx.baumPunkte || [];
    const Z = 1.5;                   // Zellgröße in Metern
    let gitter = null, N = 0, ursprung = 0, gebautMit = -1;
    function bauen() {
      const G = (ctx.gelaendeGroesse && ctx.gelaendeGroesse()) || 640; N = Math.ceil(G / Z); ursprung = -G / 2; gitter = new Uint8Array(N * N);
      const wasser = ctx.wasserHoehe != null ? ctx.wasserHoehe : -1e9;
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const x = ursprung + (i + 0.5) * Z, z = ursprung + (j + 0.5) * Z, h = ctx.hoehe(x, z), hx = ctx.hoehe(x + Z, z), hz = ctx.hoehe(x, z + Z);
        if (h < wasser + 0.3 || Math.abs(hx - h) / Z > 0.9 || Math.abs(hz - h) / Z > 0.9) gitter[j * N + i] = 1; }
      const sperre = (x, z, w, d) => { const i0 = Math.floor((x - w / 2 - 0.6 - ursprung) / Z), i1 = Math.floor((x + w / 2 + 0.6 - ursprung) / Z), j0 = Math.floor((z - d / 2 - 0.6 - ursprung) / Z), j1 = Math.floor((z + d / 2 + 0.6 - ursprung) / Z);
        for (let j = Math.max(0, j0); j <= Math.min(N - 1, j1); j++) for (let i = Math.max(0, i0); i <= Math.min(N - 1, i1); i++) gitter[j * N + i] = 1; };
      for (const s of ctx.sperren) { const schief = s.dreh && Math.abs(Math.sin(s.dreh * 2)) > 0.1, m = schief ? Math.max(s.w, s.d) : 0; sperre(s.x, s.z, m || s.w, m || s.d); }
      for (const [x, z] of ctx.baumPunkte) sperre(x, z, 0.6, 0.6);
      gebautMit = ctx.sperren.length + ctx.baumPunkte.length;
    }
    const zelle = (x, z) => [Math.max(0, Math.min(N - 1, Math.floor((x - ursprung) / Z))), Math.max(0, Math.min(N - 1, Math.floor((z - ursprung) / Z)))];
    const mitte = (i, j) => [ursprung + (i + 0.5) * Z, ursprung + (j + 0.5) * Z];
    const frei = (i, j) => i >= 0 && j >= 0 && i < N && j < N && !gitter[j * N + i];
    function linieFrei(a, b) { let [x0, y0] = a; const [x1, y1] = b, dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx - dy;
      for (let n = 0; n < 2000; n++) { if (!frei(x0, y0)) return false; if (x0 === x1 && y0 === y1) return true; const e2 = 2 * err; if (e2 > -dy) { err -= dy; x0 += sx; } if (e2 < dx) { err += dx; y0 += sy; } } return true; }
    function naechsteFreie(c) { if (frei(c[0], c[1])) return c; for (let r = 1; r < 8; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) if (frei(c[0] + di, c[1] + dj)) return [c[0] + di, c[1] + dj]; return c; }
    /** A* auf dem Raster (8 Nachbarn), danach geglättet */
    function pfad(von, nach) {
      if (!gitter || gebautMit !== ctx.sperren.length + ctx.baumPunkte.length) bauen();
      const s = naechsteFreie(zelle(von.x, von.z)), z = naechsteFreie(zelle(nach.x, nach.z)), ziel = z[1] * N + z[0], start = s[1] * N + s[0];
      if (linieFrei(s, z)) return [nach.clone()];
      const g = new Map([[start, 0]]), herkunft = new Map(), offen = [[0, start]], zu = new Set();
      const h = (k) => { const i = k % N, j = (k / N) | 0, dx = Math.abs(i - z[0]), dy = Math.abs(j - z[1]); return Math.max(dx, dy) + 0.414 * Math.min(dx, dy); };
      const push = (f, k) => { offen.push([f, k]); let i = offen.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (offen[p][0] <= offen[i][0]) break; [offen[p], offen[i]] = [offen[i], offen[p]]; i = p; } };
      const pop = () => { const t = offen[0], l = offen.pop(); if (offen.length) { offen[0] = l; let i = 0; for (;;) { const a = 2 * i + 1, b = a + 1; let m = i; if (a < offen.length && offen[a][0] < offen[m][0]) m = a; if (b < offen.length && offen[b][0] < offen[m][0]) m = b; if (m === i) break; [offen[m], offen[i]] = [offen[i], offen[m]]; i = m; } } return t; };
      let n = 0, gefunden = false;
      while (offen.length && n++ < 25000) { const [, k] = pop(); if (k === ziel) { gefunden = true; break; } if (zu.has(k)) continue; zu.add(k); const i = k % N, j = (k / N) | 0, gk = g.get(k);
        for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { if (!di && !dj) continue; const ni = i + di, nj = j + dj; if (!frei(ni, nj)) continue; if (di && dj && (!frei(i + di, j) || !frei(i, j + dj))) continue;
          const nk = nj * N + ni, ng = gk + (di && dj ? 1.414 : 1); if (ng < (g.get(nk) ?? 1e9)) { g.set(nk, ng); herkunft.set(nk, k); push(ng + h(nk), nk); } } }
      if (!gefunden) return null;
      const zellen = []; for (let k = ziel; k !== undefined; k = herkunft.get(k)) { zellen.push([k % N, (k / N) | 0]); if (k === start) break; } zellen.reverse();
      const glatt = [zellen[0]]; for (let i = 2; i < zellen.length; i++) if (!linieFrei(glatt[glatt.length - 1], zellen[i])) glatt.push(zellen[i - 1]); glatt.push(zellen[zellen.length - 1]);
      return glatt.slice(1).map(([i, j]) => { const [x, zz] = mitte(i, j); return V(x, 0, zz); });
    }
    /** Richtung, in die ein Bot laufen soll, um "ziel" zu erreichen – um Häuser und Bäume herum */
    function richtung(b, pos, ziel) {
      const neu = !b.pfad || !b.pfadZiel || BAB.Vector3.Distance(b.pfadZiel, ziel) > 4 || ctx.zeit - (b.pfadZeit || 0) > 3;
      if (neu) { b.pfad = pfad(pos, ziel) || [ziel.clone()]; b.pfadZiel = ziel.clone(); b.pfadZeit = ctx.zeit + Math.random() * 0.5; }
      while (b.pfad.length > 1 && Math.hypot(b.pfad[0].x - pos.x, b.pfad[0].z - pos.z) < 1.4) b.pfad.shift();
      const p = b.pfad[0], d = V(p.x - pos.x, 0, p.z - pos.z); return d.length() > 0.01 ? d.normalize() : d;
    }
    /** Deckung: freie Zelle neben einem Hindernis, von der aus der Feind keine Sicht hat */
    function deckungSuchen(b, pos, feind) {
      if (!gitter) bauen(); const c = zelle(pos.x, pos.z); let best = null, bestD = 1e9;
      for (let r = 2; r < 16; r++) for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2, i = c[0] + Math.round(Math.cos(a) * r), j = c[1] + Math.round(Math.sin(a) * r);
        if (!frei(i, j)) continue; const nebenWand = !frei(i + 1, j) || !frei(i - 1, j) || !frei(i, j + 1) || !frei(i, j - 1); if (!nebenWand) continue;
        const [x, z] = mitte(i, j), p = V(x, ctx.hoehe(x, z) + 1.2, z); const t = ctx.strahl(feind.add(V(0, 0.5, 0)), p.subtract(feind).normalize(), BAB.Vector3.Distance(feind, p), b.id);
        if (t && t.hit && t.distance < BAB.Vector3.Distance(feind, p) - 1) { const d = Math.hypot(x - pos.x, z - pos.z); if (d < bestD) { bestD = d; best = p; } } if (best && r > 6) break; }
      return best;
    }
    /** Ein Bot hat den Spieler gesehen: Kameraden in der Nähe werden alarmiert und flankieren */
    function alarm(b, ziel) { let seite = 1; for (const o of ctx.bots) { if (o === b || o.tot) continue; const p = o.cc.getPosition(); if (BAB.Vector3.Distance(p, b.cc.getPosition()) < 55) { o.alarm = Math.max(o.alarm, 9); o.zuletzt = ziel.clone(); o.flanke = (seite = -seite); } } }
    ctx.ki = { richtung, deckungSuchen, alarm, pfad, neuBauen: () => { gitter = null; }, get gitter() { return gitter && { N, Z, ursprung, daten: gitter }; } };
    return { api: { wegfinden: (von, nach) => pfad(V(von[0], 0, von[1]), V(nach[0], 0, nach[1])) } };
  });
})();
