// Blatterkennung v2 (SD Scanner)
// 1. gerade Kanten per Hough-Transformation finden
// 2. aus je zwei fast parallelen Kantenpaaren Vierecke bilden
// 3. bewerten: Kanten belegt (mit Papier innen), Papieranteil innen, Kontrast
// 4. die besten pruefen: laeuft eine echte Kante quer hindurch (Blatt + Karton)?
//    ist eine Seite nur eine gedruckte Linie?
// Liefert null, wenn kein Blatt sicher erkannt ist (dann zieht man die Ecken selbst).
// Nutzt Helfer aus vision.js (muss vorher geladen sein).
(function (root) {
  "use strict";
  const V = root.Vision || require("./vision.js");

  // Graustufen (L) und Saettigung (S) auf Arbeitsgroesse, Mittelwert je Zelle
  function prepare(rgba, w, h, workW) {
    const sw = Math.min(workW, w);
    const sh = Math.max(1, Math.round((h / w) * sw));
    const L = new Float32Array(sw * sh), S = new Float32Array(sw * sh);
    for (let y = 0; y < sh; y++) {
      const y0 = Math.floor((y * h) / sh), y1 = Math.max(y0 + 1, Math.floor(((y + 1) * h) / sh));
      for (let x = 0; x < sw; x++) {
        const x0 = Math.floor((x * w) / sw), x1 = Math.max(x0 + 1, Math.floor(((x + 1) * w) / sw));
        let r = 0, g = 0, b = 0, c = 0;
        const stepY = Math.max(1, (y1 - y0) >> 1), stepX = Math.max(1, (x1 - x0) >> 1);
        for (let yy = y0; yy < y1; yy += stepY) {
          for (let xx = x0; xx < x1; xx += stepX) {
            const p = (yy * w + xx) * 4;
            r += rgba[p]; g += rgba[p + 1]; b += rgba[p + 2]; c++;
          }
        }
        r /= c; g /= c; b /= c;
        const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
        const i = y * sw + x;
        L[i] = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        S[i] = mx > 8 ? (mx - mn) / mx : 0;
      }
    }
    return { L, S, w: sw, h: sh };
  }

  function gradients(L, w, h) {
    const gx = new Float32Array(w * h), gy = new Float32Array(w * h), mag = new Float32Array(w * h);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        const tl = L[i - w - 1], t = L[i - w], tr = L[i - w + 1];
        const l = L[i - 1], r = L[i + 1];
        const bl = L[i + w - 1], b = L[i + w], br = L[i + w + 1];
        const X = (tr + 2 * r + br) - (tl + 2 * l + bl);
        const Y = (bl + 2 * b + br) - (tl + 2 * t + tr);
        gx[i] = X; gy[i] = Y; mag[i] = Math.sqrt(X * X + Y * Y);
      }
    }
    return { gx, gy, mag };
  }

  function percentile(arr, p) {
    const s = Float32Array.from(arr).sort();
    return s[Math.min(s.length - 1, Math.max(0, Math.floor(s.length * p)))];
  }

  // Hough-Transformation mit Gradientenrichtung -> Liste von Geraden {t (Winkel der Normalen), r}
  function houghLines(G, w, h, edgeThr, maxLines) {
    const NT = 180;
    const diag = Math.ceil(Math.hypot(w, h));
    const NR = diag * 2 + 1;
    const acc = new Float32Array(NT * NR);
    const cos = new Float32Array(NT), sin = new Float32Array(NT);
    for (let t = 0; t < NT; t++) { cos[t] = Math.cos((t * Math.PI) / NT); sin[t] = Math.sin((t * Math.PI) / NT); }
    for (let y = 2; y < h - 2; y++) {
      for (let x = 2; x < w - 2; x++) {
        const i = y * w + x;
        const m = G.mag[i];
        if (m < edgeThr) continue;
        let a = Math.atan2(G.gy[i], G.gx[i]);
        if (a < 0) a += Math.PI;
        const tc = Math.round((a / Math.PI) * NT);
        for (let dt = -3; dt <= 3; dt++) {
          const t = (tc + dt + NT) % NT;
          const r = Math.round(x * cos[t] + y * sin[t]) + diag;
          acc[t * NR + r] += m;
        }
      }
    }
    // lokale Maxima
    const peaks = [];
    let maxV = 0;
    for (let i = 0; i < acc.length; i++) if (acc[i] > maxV) maxV = acc[i];
    const minV = maxV * 0.08;
    for (let t = 0; t < NT; t++) {
      for (let r = 2; r < NR - 2; r++) {
        const v = acc[t * NR + r];
        if (v < minV) continue;
        let isMax = true;
        for (let dt = -2; dt <= 2 && isMax; dt++) {
          const tt = (t + dt + NT) % NT;
          const flip = t + dt < 0 || t + dt >= NT;
          for (let dr = -4; dr <= 4; dr++) {
            if (!dt && !dr) continue;
            let rr = r + dr;
            if (flip) rr = 2 * diag - rr;
            if (rr < 0 || rr >= NR) continue;
            const u = acc[tt * NR + rr];
            if (u > v || (u === v && (dt < 0 || (dt === 0 && dr < 0)))) { isMax = false; break; }
          }
        }
        if (isMax) peaks.push({ t: (t * Math.PI) / NT, r: r - diag, v });
      }
    }
    peaks.sort((a, b) => b.v - a.v);
    return peaks.slice(0, maxLines);
  }

  function intersect(a, b) {
    const ca = Math.cos(a.t), sa = Math.sin(a.t), cb = Math.cos(b.t), sb = Math.sin(b.t);
    const det = ca * sb - sa * cb;
    if (Math.abs(det) < 1e-6) return null;
    return [(a.r * sb - b.r * sa) / det, (ca * b.r - cb * a.r) / det];
  }

  function angDiff(a, b) {
    let d = Math.abs(a - b) % Math.PI;
    return d > Math.PI / 2 ? Math.PI - d : d;
  }

  function bil(arr, w, h, x, y) {
    if (x < 0 || y < 0 || x > w - 1 || y > h - 1) return NaN;
    const x0 = Math.floor(x), y0 = Math.floor(y);
    const x1 = Math.min(w - 1, x0 + 1), y1 = Math.min(h - 1, y0 + 1);
    const fx = x - x0, fy = y - y0;
    const a = arr[y0 * w + x0], b = arr[y0 * w + x1], c = arr[y1 * w + x0], d = arr[y1 * w + x1];
    return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
  }

  function convexOrdered(q) {
    let sign = 0;
    for (let i = 0; i < 4; i++) {
      const ax = q[((i + 1) % 4) * 2] - q[i * 2], ay = q[((i + 1) % 4) * 2 + 1] - q[i * 2 + 1];
      const bx = q[((i + 2) % 4) * 2] - q[((i + 1) % 4) * 2], by = q[((i + 2) % 4) * 2 + 1] - q[((i + 1) % 4) * 2 + 1];
      const c = ax * by - ay * bx;
      if (Math.abs(c) < 1e-9) return false;
      const s = c > 0 ? 1 : -1;
      if (!sign) sign = s; else if (s !== sign) return false;
    }
    return true;
  }

  function cornerAnglesOk(q) {
    for (let i = 0; i < 4; i++) {
      const p = i, a = (i + 3) % 4, b = (i + 1) % 4;
      const v1x = q[a * 2] - q[p * 2], v1y = q[a * 2 + 1] - q[p * 2 + 1];
      const v2x = q[b * 2] - q[p * 2], v2y = q[b * 2 + 1] - q[p * 2 + 1];
      const c = (v1x * v2x + v1y * v2y) / (Math.hypot(v1x, v1y) * Math.hypot(v2x, v2y) || 1);
      const deg = (Math.acos(Math.max(-1, Math.min(1, c))) * 180) / Math.PI;
      if (deg < 45 || deg > 135) return false;
    }
    return true;
  }

  // Bewertet ein Viereck (Arbeitskoordinaten, im Uhrzeigersinn geordnet)
  function scoreQuad(q, P, G, edgeThr, paperThr) {
    const w = P.w, h = P.h;
    const area = V.quadArea(q);
    const imgArea = w * h;
    if (area < imgArea * 0.08) return null;
    const cx = (q[0] + q[2] + q[4] + q[6]) / 4, cy = (q[1] + q[3] + q[5] + q[7]) / 4;
    const sup = [];
    let insideSum = 0, outsideSum = 0, ringN = 0;
    for (let s = 0; s < 4; s++) {
      const ax = q[s * 2], ay = q[s * 2 + 1], bx = q[((s + 1) % 4) * 2], by = q[((s + 1) % 4) * 2 + 1];
      const len = Math.hypot(bx - ax, by - ay);
      if (len < 8) return null;
      let nx = -(by - ay) / len, ny = (bx - ax) / len;
      // Normale nach aussen
      const mx = (ax + bx) / 2, my = (ay + by) / 2;
      if ((mx - cx) * nx + (my - cy) * ny < 0) { nx = -nx; ny = -ny; }
      const N = 48;
      let hits = 0, valid = 0;
      for (let k = 0; k < N; k++) {
        const t = 0.04 + (0.92 * (k + 0.5)) / N;
        const px = ax + (bx - ax) * t, py = ay + (by - ay) * t;
        if (px < 1 || py < 1 || px > w - 2 || py > h - 2) continue; // ausserhalb: zaehlt nicht
        valid++;
        let best = 0;
        for (let d = -2; d <= 2; d++) {
          const x = Math.round(px + nx * d), y = Math.round(py + ny * d);
          if (x < 1 || y < 1 || x > w - 2 || y > h - 2) continue;
          const i = y * w + x;
          const proj = Math.abs(G.gx[i] * nx + G.gy[i] * ny);
          if (proj > best) best = proj;
        }
        // nur zaehlen, wenn innen direkt daneben Papier liegt (hell, farbarm)
        const pin = bil(P.L, w, h, px - nx * 4, py - ny * 4);
        const sin = bil(P.S, w, h, px - nx * 4, py - ny * 4);
        if (best >= edgeThr * 0.7 && pin >= paperThr - 0.04 && sin < 0.32) hits++;
        const li = bil(P.L, w, h, px - nx * 3, py - ny * 3);
        const lo = bil(P.L, w, h, px + nx * 3, py + ny * 3);
        if (!isNaN(li) && !isNaN(lo)) { insideSum += li; outsideSum += lo; ringN++; }
      }
      // Kanten, die zum grossen Teil ausserhalb des Bildes liegen, sind verdaechtig
      if (valid < N * 0.5) return null;
      sup.push(hits / valid);
    }
    const minSup = Math.min.apply(null, sup);
    const meanSup = (sup[0] + sup[1] + sup[2] + sup[3]) / 4;
    // Papieranteil im Inneren
    const H = V.homography([0, 0, 1, 0, 1, 1, 0, 1], q);
    if (!H) return null;
    let paper = 0, cnt = 0;
    const G2 = 10;
    for (let j = 0; j < G2; j++) {
      for (let i = 0; i < G2; i++) {
        const p = V.applyH(H, 0.08 + (0.84 * (i + 0.5)) / G2, 0.08 + (0.84 * (j + 0.5)) / G2);
        const L = bil(P.L, w, h, p[0], p[1]);
        const Sv = bil(P.S, w, h, p[0], p[1]);
        if (isNaN(L)) continue;
        cnt++;
        if (L >= paperThr && Sv < 0.3) paper++;
      }
    }
    const paperFrac = cnt ? paper / cnt : 0;
    const contrast = ringN ? (insideSum - outsideSum) / ringN : 0;
    const aFrac = area / imgArea;
    const score =
      Math.pow(0.35 * minSup + 0.65 * meanSup, 2) *
      Math.pow(aFrac, 0.35) *
      (0.25 + paperFrac) *
      (0.35 + Math.min(1, Math.max(0, contrast) * 2.5));
    return { score, minSup, meanSup, paperFrac, contrast, aFrac };
  }

  // Laeuft eine echte Kante (mit Helligkeitssprung) quer durch das Viereck,
  // parallel zu einer Seite? Dann ist das Viereck vermutlich zu gross
  // (z. B. Blatt + weisser Karton daneben). Liefert 0..1.
  function innerEdgePenalty(q, lines, P, G, edgeThr) {
    const w = P.w, h = P.h;
    let worst = 0;
    for (let s = 0; s < 4; s++) {
      const ax = q[s * 2], ay = q[s * 2 + 1], bx = q[((s + 1) % 4) * 2], by = q[((s + 1) % 4) * 2 + 1];
      const sideAng = Math.atan2(by - ay, bx - ax);
      // Nachbarseiten (zwischen denen eine parallele Linie liegen muesste)
      const s1 = (s + 1) % 4, s3 = (s + 3) % 4;
      const n1a = [q[s1 * 2], q[s1 * 2 + 1]], n1b = [q[((s1 + 1) % 4) * 2], q[((s1 + 1) % 4) * 2 + 1]];
      const n3a = [q[s3 * 2], q[s3 * 2 + 1]], n3b = [q[((s3 + 1) % 4) * 2], q[((s3 + 1) % 4) * 2 + 1]];
      for (const ln of lines) {
        // Geradenrichtung = Normale + 90 Grad
        if (angDiff(ln.t + Math.PI / 2, sideAng) > (12 * Math.PI) / 180) continue;
        const c = Math.cos(ln.t), si = Math.sin(ln.t);
        const cut = (p0, p1) => {
          const f0 = p0[0] * c + p0[1] * si - ln.r, f1 = p1[0] * c + p1[1] * si - ln.r;
          if (f0 === f1) return null;
          const t = f0 / (f0 - f1);
          if (t < 0.06 || t > 0.94) return null;
          return [p0[0] + (p1[0] - p0[0]) * t, p0[1] + (p1[1] - p0[1]) * t];
        };
        const u = cut(n1a, n1b), v = cut(n3a, n3b);
        if (!u || !v) continue;
        const len = Math.hypot(v[0] - u[0], v[1] - u[1]);
        if (len < 10) continue;
        const nx = -(v[1] - u[1]) / len, ny = (v[0] - u[0]) / len;
        const N = 48;
        let hits = 0, valid = 0;
        const top1 = [], top2 = [], sat1 = [], sat2 = [];
        for (let k = 0; k < N; k++) {
          const t = 0.02 + (0.96 * (k + 0.5)) / N;
          const px = u[0] + (v[0] - u[0]) * t, py = u[1] + (v[1] - u[1]) * t;
          if (px < 1 || py < 1 || px > w - 2 || py > h - 2) continue;
          valid++;
          let best = 0;
          for (let d = -2; d <= 2; d++) {
            const x = Math.round(px + nx * d), y = Math.round(py + ny * d);
            if (x < 1 || y < 1 || x > w - 2 || y > h - 2) continue;
            const i = y * w + x;
            const pr = Math.abs(G.gx[i] * nx + G.gy[i] * ny);
            if (pr > best) best = pr;
          }
          if (best >= edgeThr * 0.7) hits++;
          // hellster Wert je Seite (Papierweiss, unabhaengig von Text) + Farbstich
          let m1 = -1, m2 = -1;
          for (let d = 3; d <= 10; d++) {
            const a1 = bil(P.L, w, h, px + nx * d, py + ny * d), a2 = bil(P.L, w, h, px - nx * d, py - ny * d);
            if (a1 > m1) m1 = a1;
            if (a2 > m2) m2 = a2;
          }
          if (m1 >= 0 && m2 >= 0) {
            top1.push(m1); top2.push(m2);
            sat1.push(bil(P.S, w, h, px + nx * 6, py + ny * 6) || 0);
            sat2.push(bil(P.S, w, h, px - nx * 6, py - ny * 6) || 0);
          }
        }
        if (valid < N * 0.6) continue;
        const sup = hits / valid;
        const med = (a) => { if (!a.length) return 0; const b = a.slice().sort((x, y) => x - y); return b[b.length >> 1]; };
        const jump = Math.abs(med(top1) - med(top2)) + 0.5 * Math.abs(med(sat1) - med(sat2));
        // durchgehende Kante UND anderes "Weiss" auf beiden Seiten = Grenze zwischen zwei Flaechen
        const pen = Math.max(0, Math.min(1, (sup - 0.6) / 0.25)) * Math.max(0, Math.min(1, (jump - 0.02) / 0.04));
        if (pen > worst) worst = pen;
      }
    }
    return worst;
  }

  // Ist eine Seite in Wahrheit eine gedruckte Linie? Gedruckte Linie = dunkler
  // Strich mit gleich hellem Papier auf BEIDEN Seiten (Tal); Blattkante = Stufe.
  // Gemessen in voller Aufloesung. Liefert 0..1 (schlimmste Seite).
  function printedLinePenalty(q, rgba, W, H, kx, ky) {
    const lum = (x, y) => {
      const xi = Math.round(x), yi = Math.round(y);
      if (xi < 0 || yi < 0 || xi >= W || yi >= H) return NaN;
      const p = (yi * W + xi) * 4;
      return (0.299 * rgba[p] + 0.587 * rgba[p + 1] + 0.114 * rgba[p + 2]) / 255;
    };
    const k = (kx + ky) / 2;
    const near = Math.max(4, 1.6 * k), far = Math.max(8, 3.2 * k);
    let worst = 0;
    for (let s = 0; s < 4; s++) {
      const ax = q[s * 2] * kx, ay = q[s * 2 + 1] * ky;
      const bx = q[((s + 1) % 4) * 2] * kx, by = q[((s + 1) % 4) * 2 + 1] * ky;
      const len = Math.hypot(bx - ax, by - ay);
      if (len < 10) continue;
      const nx = -(by - ay) / len, ny = (bx - ax) / len;
      const N = 40;
      let valley = 0, valid = 0;
      for (let i = 0; i < N; i++) {
        const t = 0.1 + (0.8 * (i + 0.5)) / N;
        const px = ax + (bx - ax) * t, py = ay + (by - ay) * t;
        // dunkelster Punkt quer zur Seite (Strich kann leicht daneben liegen)
        let dark = Infinity;
        for (let d = -near; d <= near; d += 1) {
          const v = lum(px + nx * d, py + ny * d);
          if (v < dark) dark = v;
        }
        let a = -1, b = -1;
        for (let d = near + 1; d <= far; d += 1) {
          const v1 = lum(px + nx * d, py + ny * d), v2 = lum(px - nx * d, py - ny * d);
          if (v1 > a) a = v1;
          if (v2 > b) b = v2;
        }
        if (!isFinite(dark) || a < 0 || b < 0) continue;
        valid++;
        if (Math.min(a, b) - dark > 0.12 && Math.abs(a - b) < 0.06 && Math.min(a, b) > 0.45) valley++;
      }
      if (valid < N * 0.5) continue;
      const f = valley / valid;
      const pen = Math.max(0, Math.min(1, (f - 0.3) / 0.3));
      if (pen > worst) worst = pen;
    }
    return worst;
  }

  // Ordnet 4 Punkte im Uhrzeigersinn, beginnend links oben
  function orderTL(q) {
    const o = V.orderCorners(q);
    let k = 0, best = Infinity;
    for (let i = 0; i < 4; i++) { const s = o[i * 2] + o[i * 2 + 1]; if (s < best) { best = s; k = i; } }
    const out = [];
    for (let i = 0; i < 4; i++) { const j = (k + i) % 4; out.push(o[j * 2], o[j * 2 + 1]); }
    return out;
  }

  function detectDocument(rgba, w, h, opt) {
    opt = opt || {};
    const P = prepare(rgba, w, h, opt.workWidth || 320);
    const Lb = V.boxBlur(P.L, P.w, P.h, 1);
    const G = gradients(Lb, P.w, P.h);
    const edgeThr = Math.max(0.12, percentile(G.mag, 0.9));
    // Papierschwelle: Otsu auf der Helligkeit, begrenzt
    const hist = new Uint32Array(256);
    for (let i = 0; i < Lb.length; i++) hist[Math.min(255, Math.round(Lb[i] * 255))]++;
    const paperThr = Math.min(0.75, Math.max(0.4, V.otsu(hist, Lb.length) / 255 - 0.05));
    const P2 = { L: Lb, S: P.S, w: P.w, h: P.h };

    const lines = houghLines(G, P.w, P.h, edgeThr, opt.maxLines || 36);
    const minSep = Math.min(P.w, P.h) * 0.18;
    const pairs = [];
    for (let i = 0; i < lines.length; i++) {
      for (let j = i + 1; j < lines.length; j++) {
        const a = lines[i], b = lines[j];
        if (angDiff(a.t, b.t) > (25 * Math.PI) / 180) continue;
        // Abstand der beiden (fast) parallelen Geraden in der Bildmitte
        const ca = Math.cos(a.t), sa = Math.sin(a.t);
        const cx = P.w / 2, cy = P.h / 2;
        const da = cx * ca + cy * sa - a.r;
        const cb = Math.cos(b.t), sb = Math.sin(b.t);
        const db = cx * cb + cy * sb - b.r;
        const sameDir = ca * cb + sa * sb > 0;
        const dist = Math.abs(sameDir ? da - db : da + db);
        if (dist < minSep) continue;
        pairs.push([a, b, (a.t + (sameDir ? b.t : b.t + Math.PI)) / 2]);
      }
    }
    let best = null;
    const consider = (quad, src) => {
      if (!quad) return;
      const q = orderTL(quad);
      for (let i = 0; i < 8; i++) if (!isFinite(q[i])) return;
      const mx = P.w * 0.04, my = P.h * 0.04;
      for (let i = 0; i < 4; i++) {
        if (q[i * 2] < -mx || q[i * 2] > P.w + mx || q[i * 2 + 1] < -my || q[i * 2 + 1] > P.h + my) return;
      }
      if (!convexOrdered(q) || !cornerAnglesOk(q)) return;
      const s = scoreQuad(q, P2, G, edgeThr, paperThr);
      if (!s) return;
      cands.push({ q, s, src });
    };
    const cands = [];
    for (let i = 0; i < pairs.length; i++) {
      for (let j = i + 1; j < pairs.length; j++) {
        const A = pairs[i], B = pairs[j];
        if (angDiff(A[2], B[2]) < (50 * Math.PI) / 180) continue;
        const p1 = intersect(A[0], B[0]), p2 = intersect(A[0], B[1]), p3 = intersect(A[1], B[1]), p4 = intersect(A[1], B[0]);
        if (!p1 || !p2 || !p3 || !p4) continue;
        consider([p1[0], p1[1], p2[0], p2[1], p3[0], p3[1], p4[0], p4[1]], "linien");
      }
    }
    // Die bisherige Kontur-Erkennung als weiterer Kandidat
    try {
      const old = V.detectQuad(P.L, P.w, P.h);
      if (old) consider(Array.from(old), "kontur");
    } catch (e) {}

    cands.sort((a, b) => b.s.score - a.s.score);
    for (let k = 0; k < Math.min(25, cands.length); k++) {
      const c = cands[k];
      c.pen = innerEdgePenalty(c.q, lines, P2, G, edgeThr);
      c.pen2 = printedLinePenalty(c.q, rgba, w, h, w / P.w, h / P.h);
      c.final = c.s.score * (1 - 0.85 * c.pen) * (1 - 0.85 * c.pen2);
      if (!best || c.final > best.final) best = c;
    }
    if (opt.debug) opt.debug.cands = cands.slice(0, 6);
    if (!best) return null;
    if (opt.debug) opt.debug.best = best;
    const s = best.s;
    // Mindestqualitaet: Kanten muessen ueberwiegend belegt sein
    if (s.meanSup < 0.5 || s.minSup < 0.22 || s.paperFrac < 0.35) return null;
    const out = new Float32Array(8);
    for (let i = 0; i < 8; i++) out[i] = best.q[i] * (i % 2 === 0 ? w / P.w : h / P.h);
    if (opt.refine === false) return out;
    return V.refineQuad(rgba, w, h, out, Math.max(3, Math.round(2.5 * (w / P.w))));
  }

  const api = { detectDocument, _intern: { prepare, gradients, houghLines, scoreQuad } };
  if (typeof module !== "undefined" && module.exports) module.exports = Object.assign({}, V, api);
  else Object.assign(root.Vision, api);
})(typeof window !== "undefined" ? window : globalThis);
