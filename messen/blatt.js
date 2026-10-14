/* SD Hub – Messen: helles Blatt / helle Karte im Bild finden (auch klein im Bild).
   1. Helligkeit + Sättigung auf Arbeitsgröße, Schwelle nach Otsu
   2. größte zusammenhängende helle, farbarme Fläche (nicht am Bildrand)
   3. konvexe Hülle -> 4 Ecken (weitester Punkt, Gegenpunkt, Punkte mit größtem Abstand zur Diagonale)
   4. optional verfeinern (Vision.refineQuad aus dem SD Scanner, falls geladen)
   Rückgabe: [x0,y0,x1,y1,x2,y2,x3,y3] in Bildkoordinaten oder null. */
(function (root) {
  'use strict';

  function otsu(hist, total) {
    let sum = 0;
    for (let i = 0; i < 256; i++) sum += i * hist[i];
    let sumB = 0, wB = 0, best = 0, thr = 128;
    for (let i = 0; i < 256; i++) {
      wB += hist[i];
      if (!wB) continue;
      const wF = total - wB;
      if (!wF) break;
      sumB += i * hist[i];
      const mB = sumB / wB, mF = (sum - sumB) / wF;
      const v = wB * wF * (mB - mF) * (mB - mF);
      if (v > best) { best = v; thr = i; }
    }
    return thr;
  }

  function huelle(pts) {
    pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const kreuz = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const unten = [], oben = [];
    for (const p of pts) { while (unten.length >= 2 && kreuz(unten[unten.length - 2], unten[unten.length - 1], p) <= 0) unten.pop(); unten.push(p); }
    for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (oben.length >= 2 && kreuz(oben[oben.length - 2], oben[oben.length - 1], p) <= 0) oben.pop(); oben.push(p); }
    oben.pop(); unten.pop();
    return unten.concat(oben);
  }

  function vierEcken(h) {
    if (h.length < 4) return null;
    const cx = h.reduce((s, p) => s + p[0], 0) / h.length, cy = h.reduce((s, p) => s + p[1], 0) / h.length;
    const weit = (ref) => h.reduce((b, p) => { const d = Math.hypot(p[0] - ref[0], p[1] - ref[1]); return d > b.d ? { p, d } : b; }, { p: null, d: -1 }).p;
    const a = weit([cx, cy]);
    const c = weit(a);
    // Abstand zur Diagonale a-c, getrennt nach Seite
    const nx = -(c[1] - a[1]), ny = c[0] - a[0];
    let b = null, d = null, bMax = 0, dMax = 0;
    for (const p of h) {
      const s = (p[0] - a[0]) * nx + (p[1] - a[1]) * ny;
      if (s > bMax) { bMax = s; b = p; }
      if (-s > dMax) { dMax = -s; d = p; }
    }
    if (!b || !d) return null;
    return [a, b, c, d];
  }

  function flaeche(q) {
    let s = 0;
    for (let i = 0; i < 4; i++) { const p = q[i], r = q[(i + 1) % 4]; s += p[0] * r[1] - r[0] * p[1]; }
    return Math.abs(s) / 2;
  }

  function findeBlatt(rgba, w, h, opt) {
    opt = opt || {};
    const ww = Math.min(w, opt.arbeitsBreite || 400);
    const f = ww / w, hh = Math.max(1, Math.round(h * f));
    const L = new Uint8Array(ww * hh), Sat = new Uint8Array(ww * hh);
    const hist = new Uint32Array(256);
    for (let y = 0; y < hh; y++) {
      const sy = Math.min(h - 1, Math.floor(y / f));
      for (let x = 0; x < ww; x++) {
        const sx = Math.min(w - 1, Math.floor(x / f));
        const i = (sy * w + sx) * 4;
        const r = rgba[i], g = rgba[i + 1], b = rgba[i + 2];
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
        const l = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        L[y * ww + x] = l; Sat[y * ww + x] = mx ? Math.round(255 * (mx - mn) / mx) : 0;
        hist[l]++;
      }
    }
    const thr = Math.max(110, otsu(hist, ww * hh));
    const hell = new Uint8Array(ww * hh);
    for (let i = 0; i < hell.length; i++) hell[i] = L[i] > thr && Sat[i] < 70 ? 1 : 0;
    // zusammenhaengende Flaechen (4er-Nachbarschaft)
    const marke = new Int32Array(ww * hh);
    const stapel = new Int32Array(ww * hh);
    let besteFlaeche = null, nr = 0;
    for (let s = 0; s < hell.length; s++) {
      if (!hell[s] || marke[s]) continue;
      nr++;
      let sp = 0, n = 0, rand = 0;
      const pts = [];
      stapel[sp++] = s; marke[s] = nr;
      while (sp) {
        const i = stapel[--sp];
        const x = i % ww, y = (i / ww) | 0;
        n++;
        if (x === 0 || y === 0 || x === ww - 1 || y === hh - 1) rand++;
        // nur Randpixel der Flaeche fuer die Huelle merken
        if (x === 0 || y === 0 || x === ww - 1 || y === hh - 1 || !hell[i - 1] || !hell[i + 1] || !hell[i - ww] || !hell[i + ww]) pts.push([x, y]);
        if (x > 0 && hell[i - 1] && !marke[i - 1]) { marke[i - 1] = nr; stapel[sp++] = i - 1; }
        if (x < ww - 1 && hell[i + 1] && !marke[i + 1]) { marke[i + 1] = nr; stapel[sp++] = i + 1; }
        if (y > 0 && hell[i - ww] && !marke[i - ww]) { marke[i - ww] = nr; stapel[sp++] = i - ww; }
        if (y < hh - 1 && hell[i + ww] && !marke[i + ww]) { marke[i + ww] = nr; stapel[sp++] = i + ww; }
      }
      if (n < ww * hh * 0.004 || rand > 2) continue;   // zu klein oder am Bildrand abgeschnitten
      if (!besteFlaeche || n > besteFlaeche.n) besteFlaeche = { n, pts };
    }
    if (!besteFlaeche) return null;
    const q = vierEcken(huelle(besteFlaeche.pts));
    if (!q) return null;
    // Viereck muss die Flaeche gut ausfuellen (sonst ist es kein Rechteck, z. B. ein Fleck)
    const fq = flaeche(q);
    if (fq < besteFlaeche.n * 0.85 || fq > besteFlaeche.n * 1.25) return null;
    let out = [];
    q.forEach(p => out.push((p[0] + 0.5) / f, (p[1] + 0.5) / f));
    const V = root.Vision;
    if (opt.verfeinern !== false && V && V.refineQuad) {
      try {
        const r = V.refineQuad(rgba, w, h, Float32Array.from(out), Math.max(3, Math.round(2 / f)));
        if (r && Array.from(r).every(isFinite)) out = Array.from(r);
      } catch (e) { /* unverfeinert lassen */ }
    }
    return out;
  }

  const api = { findeBlatt };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.SDBlatt = api;
})(typeof window !== 'undefined' ? window : globalThis);
