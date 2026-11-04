/* SD Foto – Bildwerkzeuge für die Werkstatt: Foto entzerren (4 Ecken), nahtlos machen, Normal-Map berechnen. Läuft lokal im Browser. */
'use strict';
(function () {
  const leinwand = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  /** Datei -> Bild (höchstens max Pixel an der langen Seite) */
  async function laden(datei, max) {
    max = max || 2048; const b = await createImageBitmap(datei); const f = Math.min(1, max / Math.max(b.width, b.height));
    const c = leinwand(Math.round(b.width * f), Math.round(b.height * f)); c.getContext('2d').drawImage(b, 0, 0, c.width, c.height); b.close && b.close(); return c;
  }
  /** 8×8-Gleichungssystem lösen (Gauß) */
  function loese(A, b) { const n = b.length; for (let i = 0; i < n; i++) { let m = i; for (let k = i + 1; k < n; k++) if (Math.abs(A[k][i]) > Math.abs(A[m][i])) m = k; [A[i], A[m]] = [A[m], A[i]]; [b[i], b[m]] = [b[m], b[i]];
      for (let k = i + 1; k < n; k++) { const f = A[k][i] / A[i][i]; for (let j = i; j < n; j++) A[k][j] -= f * A[i][j]; b[k] -= f * b[i]; } }
    const x = new Array(n); for (let i = n - 1; i >= 0; i--) { let s = b[i]; for (let j = i + 1; j < n; j++) s -= A[i][j] * x[j]; x[i] = s / A[i][i]; } return x; }
  /** Homographie: bildet Punkte von "von" auf "nach" ab (je 4 Punkte [x,y]) */
  function homographie(von, nach) { const A = [], b = []; for (let i = 0; i < 4; i++) { const [x, y] = von[i], [u, v] = nach[i]; A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]); b.push(u); A.push([0, 0, 0, x, y, 1, -v * x, -v * y]); b.push(v); } const h = loese(A, b); h.push(1); return h; }
  /** Foto entzerren: ecken = [oben-links, oben-rechts, unten-rechts, unten-links] in Bildpixeln */
  function entzerren(bild, ecken, breite, hoehe) {
    const W = breite || Math.round((Math.hypot(ecken[1][0] - ecken[0][0], ecken[1][1] - ecken[0][1]) + Math.hypot(ecken[2][0] - ecken[3][0], ecken[2][1] - ecken[3][1])) / 2);
    const H = hoehe || Math.round((Math.hypot(ecken[3][0] - ecken[0][0], ecken[3][1] - ecken[0][1]) + Math.hypot(ecken[2][0] - ecken[1][0], ecken[2][1] - ecken[1][1])) / 2);
    const f = Math.min(1, 1600 / Math.max(W, H)), w = Math.max(8, Math.round(W * f)), h = Math.max(8, Math.round(H * f));
    const m = homographie([[0, 0], [w, 0], [w, h], [0, h]], ecken), quelle = bild.getContext('2d').getImageData(0, 0, bild.width, bild.height), qd = quelle.data, QW = bild.width, QH = bild.height;
    const ziel = leinwand(w, h), zc = ziel.getContext('2d'), out = zc.createImageData(w, h), od = out.data;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const px = x + 0.5, py = y + 0.5, z = m[6] * px + m[7] * py + 1, sx = (m[0] * px + m[1] * py + m[2]) / z - 0.5, sy = (m[3] * px + m[4] * py + m[5]) / z - 0.5;
      const x0 = Math.max(0, Math.min(QW - 2, Math.floor(sx))), y0 = Math.max(0, Math.min(QH - 2, Math.floor(sy))), fx = Math.max(0, Math.min(1, sx - x0)), fy = Math.max(0, Math.min(1, sy - y0)), o = (y * w + x) * 4;
      for (let k = 0; k < 3; k++) { const a = qd[(y0 * QW + x0) * 4 + k], b = qd[(y0 * QW + x0 + 1) * 4 + k], c = qd[((y0 + 1) * QW + x0) * 4 + k], d = qd[((y0 + 1) * QW + x0 + 1) * 4 + k]; od[o + k] = (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy; }
      od[o + 3] = 255; }
    zc.putImageData(out, 0, 0); ziel.seitenVerhaeltnis = W / H; return ziel;
  }
  /** Quadratischen Ausschnitt nahtlos kachelbar machen (versetzte Kopie überblendet die Ränder) */
  function nahtlos(bild, groesse) {
    const n = groesse || 1024, s = Math.min(bild.width, bild.height), q = leinwand(n, n), qc = q.getContext('2d'); qc.drawImage(bild, (bild.width - s) / 2, (bild.height - s) / 2, s, s, 0, 0, n, n);
    const a = qc.getImageData(0, 0, n, n).data, z = leinwand(n, n), zc = z.getContext('2d'), out = zc.createImageData(n, n), d = out.data, h = n / 2;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const wx = Math.min(x, n - 1 - x) / h, wy = Math.min(y, n - 1 - y) / h, w = Math.pow(Math.min(1, Math.min(wx, wy) * 2.2), 1.5);
      const i = (y * n + x) * 4, j = (((y + h) % n) * n + ((x + h) % n)) * 4; for (let k = 0; k < 3; k++) d[i + k] = a[i + k] * w + a[j + k] * (1 - w); d[i + 3] = 255; }
    zc.putImageData(out, 0, 0); return z;
  }
  /** Normal-Map aus der Helligkeit (helle Stellen = erhaben) */
  function normalKarte(bild, staerke, kachelbar) {
    const w = bild.width, h = bild.height, src = bild.getContext('2d').getImageData(0, 0, w, h).data, L = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) L[i] = (src[i * 4] * 0.3 + src[i * 4 + 1] * 0.59 + src[i * 4 + 2] * 0.11) / 255;
    const g = (x, y) => { if (kachelbar) { x = (x + w) % w; y = (y + h) % h; } else { x = Math.max(0, Math.min(w - 1, x)); y = Math.max(0, Math.min(h - 1, y)); } return L[y * w + x]; };
    const c = leinwand(w, h), cc = c.getContext('2d'), out = cc.createImageData(w, h), d = out.data, s = (staerke == null ? 2 : staerke) * 2;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = (g(x - 1, y - 1) + 2 * g(x - 1, y) + g(x - 1, y + 1) - g(x + 1, y - 1) - 2 * g(x + 1, y) - g(x + 1, y + 1)) * s, dy = (g(x - 1, y - 1) + 2 * g(x, y - 1) + g(x + 1, y - 1) - g(x - 1, y + 1) - 2 * g(x, y + 1) - g(x + 1, y + 1)) * s, l = Math.hypot(dx, dy, 1), i = (y * w + x) * 4;
      d[i] = (dx / l * 0.5 + 0.5) * 255; d[i + 1] = (dy / l * 0.5 + 0.5) * 255; d[i + 2] = (1 / l * 0.5 + 0.5) * 255; d[i + 3] = 255; }
    cc.putImageData(out, 0, 0); return c;
  }
  function mittelFarbe(bild) { const c = leinwand(16, 16), x = c.getContext('2d'); x.drawImage(bild, 0, 0, 16, 16); const d = x.getImageData(0, 0, 16, 16).data; let r = 0, g = 0, b = 0; for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; } const n = d.length / 4, h = v => Math.round(v / n).toString(16).padStart(2, '0'); return '#' + h(r) + h(g) + h(b); }
  const zuBlob = (c, typ, q) => new Promise(ok => c.toBlob(ok, typ || 'image/jpeg', q || 0.9));
  async function ausBlob(blob) { const b = await createImageBitmap(blob); const c = leinwand(b.width, b.height); c.getContext('2d').drawImage(b, 0, 0); b.close && b.close(); return c; }
  window.SDFoto = { laden, entzerren, nahtlos, normalKarte, mittelFarbe, zuBlob, ausBlob, homographie };
})();
