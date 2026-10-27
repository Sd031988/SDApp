/* SD Hub – Zugangsschutz für den KI-Agenten (SD Lotze)
 * Echte Verschlüsselung: AES-256-GCM, Schlüssel pro Person über PBKDF2-SHA256.
 * Online liegen nur verschlüsselte Dateien. Diese Datei enthält KEINE Geheimnisse.
 * Läuft im Browser (window.sdZugang) und in Node (module.exports).
 */
(function (root) {
  'use strict';
  const C = (root.crypto && root.crypto.subtle) ? root.crypto : require('crypto').webcrypto;
  const ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';   // ohne 0/O/1/I/L – leicht abzutippen
  const ITER = 150000;
  const enc = new TextEncoder(), dec = new TextDecoder();

  function b64(buf) {
    const b = new Uint8Array(buf); let s = '';
    for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
    return (typeof btoa === 'function' ? btoa(s) : Buffer.from(s, 'binary').toString('base64'));
  }
  function unb64(s) {
    const bin = typeof atob === 'function' ? atob(s) : Buffer.from(s, 'base64').toString('binary');
    const b = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i); return b;
  }
  const zufall = n => C.getRandomValues(new Uint8Array(n));
  function zufallsText(n) {
    const out = []; const lim = 256 - (256 % ALPHA.length);
    while (out.length < n) for (const x of zufall(n * 2)) { if (x < lim && out.length < n) out.push(ALPHA[x % ALPHA.length]); }
    return out.join('');
  }
  // Schluessel-Format: SDL-XXXX-YYYY-YYYY-YYYY-YYYY  (XXXX = Kennung, Rest = Geheimnis, ~79 Bit)
  function neuerCode(id) {
    const g = zufallsText(16);
    return 'SDL-' + (id || zufallsText(4)) + '-' + g.match(/.{4}/g).join('-');
  }
  function normalisiere(code) {
    const s = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!/^SDL[A-Z0-9]{4}[A-Z0-9]{16}$/.test(s)) return null;
    return { id: s.slice(3, 7), voll: s };
  }
  async function ableiten(voll, salt, iter) {
    const basis = await C.subtle.importKey('raw', enc.encode(voll), 'PBKDF2', false, ['deriveKey']);
    return C.subtle.deriveKey({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter || ITER },
      basis, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  }
  async function aesKey(raw) { return C.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']); }
  async function verschluessle(key, daten) {
    const iv = zufall(12);
    const ct = await C.subtle.encrypt({ name: 'AES-GCM', iv }, key, typeof daten === 'string' ? enc.encode(daten) : daten);
    return { i: b64(iv), d: b64(ct) };
  }
  async function entschluessle(key, paket) {
    return new Uint8Array(await C.subtle.decrypt({ name: 'AES-GCM', iv: unb64(paket.i) }, key, unb64(paket.d)));
  }
  // Inhaltsschluessel K fuer einen Zugangscode einpacken
  async function einpacken(kRaw, code, iter) {
    const n = normalisiere(code); if (!n) throw new Error('Ungültiger Schlüssel');
    const salt = zufall(16);
    const p = await verschluessle(await ableiten(n.voll, salt, iter), kRaw);
    return { id: n.id, eintrag: { s: b64(salt), i: p.i, k: p.d } };
  }
  // Mit einem Zugangscode den Inhaltsschluessel aus zugang.json holen (null = falsch)
  async function oeffnen(zugang, code) {
    const n = normalisiere(code); if (!n) return null;
    const e = (zugang.eintraege || {})[n.id]; if (!e) return null;
    try {
      const raw = await entschluessle(await ableiten(n.voll, unb64(e.s), zugang.iter), { i: e.i, d: e.k });
      return raw;
    } catch (x) { return null; }
  }
  // Admin-Register (Namen + Codes) – nur mit dem Admin-Schluessel lesbar
  async function registerVerschluesseln(adminCode, daten, iter) {
    const n = normalisiere(adminCode); const salt = zufall(16);
    const p = await verschluessle(await ableiten(n.voll, salt, iter), JSON.stringify(daten));
    return { s: b64(salt), i: p.i, d: p.d };
  }
  async function registerEntschluesseln(adminCode, paket, iter) {
    const n = normalisiere(adminCode); if (!n) return null;
    try { return JSON.parse(dec.decode(await entschluessle(await ableiten(n.voll, unb64(paket.s), iter), paket))); }
    catch (x) { return null; }
  }
  const api = { ITER, b64, unb64, zufall, neuerCode, normalisiere, aesKey, verschluessle, entschluessle, einpacken, oeffnen,
    registerVerschluesseln, registerEntschluesseln, text: u8 => dec.decode(u8) };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.sdZugang = api;
})(typeof window !== 'undefined' ? window : globalThis);
