#!/usr/bin/env node
/* SD Lotze – verschlüsselte Dateien verwalten (für Entwickler/KI-Helfer)
 *
 * Der Admin-Schlüssel kommt NUR über die Umgebungsvariable ADMIN_CODE, nie als Datei ins Repository.
 *   ADMIN_CODE=SDL-ADMN-... node tools/agent_zugang.cjs einrichten   <klartext.html> <pc.zip>
 *   ADMIN_CODE=SDL-ADMN-... node tools/agent_zugang.cjs entschluesseln <zielordner außerhalb des Repos>
 *   ADMIN_CODE=SDL-ADMN-... node tools/agent_zugang.cjs verschluesseln <klartext.html> [pc.zip]
 *
 * Ablauf bei Änderungen an SD Lotze: entschluesseln -> app.html bearbeiten -> verschluesseln -> committen.
 * Personen hinzufügen/entziehen: über agent/zugang.html (Verwaltungsseite).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const z = require('../agent/zugang-krypto.js');

const AGENT = path.join(__dirname, '..', 'agent');
const ZUG = path.join(AGENT, 'zugang.json');
const code = process.env.ADMIN_CODE || '';

function fehler(msg) { console.error('Fehler: ' + msg); process.exit(1); }
function lese(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function schreibe(p, o) { fs.writeFileSync(p, JSON.stringify(o)); }
function neueVersion() { return new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14); }
function alteDateienWeg(ver) {
  for (const [dir, re] of [[AGENT, /^app-.*\.enc$/], [path.join(AGENT, 'pc-agent'), /^pc-.*\.enc$/]]) {
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) if (re.test(f) && !f.includes(ver)) fs.unlinkSync(path.join(dir, f));
  }
}
async function kHolen() {
  const zug = lese(ZUG);
  const k = await z.oeffnen(zug, code);
  if (!k) fehler('ADMIN_CODE passt nicht zu agent/zugang.json');
  return { zug, k };
}

(async () => {
  const [cmd, a1, a2] = process.argv.slice(2);
  const n = z.normalisiere(code);
  if (!n || n.id !== 'ADMN') fehler('ADMIN_CODE fehlt oder ist kein Admin-Schlüssel (SDL-ADMN-...)');

  if (cmd === 'einrichten') {
    if (fs.existsSync(ZUG)) fehler('agent/zugang.json existiert schon – zum Ändern "verschluesseln" benutzen');
    if (!a1 || !a2) fehler('einrichten <klartext.html> <pc.zip>');
    const k = z.zufall(32), key = await z.aesKey(k), ver = neueVersion();
    fs.mkdirSync(path.join(AGENT, 'pc-agent'), { recursive: true });
    schreibe(path.join(AGENT, 'app-' + ver + '.enc'), await z.verschluessle(key, fs.readFileSync(a1, 'utf8')));
    schreibe(path.join(AGENT, 'pc-agent', 'pc-' + ver + '.enc'), await z.verschluessle(key, new Uint8Array(fs.readFileSync(a2))));
    const admin = await z.einpacken(k, code);
    schreibe(ZUG, { v: 1, ver, iter: z.ITER, eintraege: { [admin.id]: admin.eintrag } });
    schreibe(path.join(AGENT, 'admin.enc'), await z.registerVerschluesseln(code, { personen: [] }));
    console.log('Eingerichtet, Version ' + ver);
  } else if (cmd === 'entschluesseln') {
    if (!a1) fehler('entschluesseln <zielordner>');
    if (path.resolve(a1).startsWith(path.resolve(__dirname, '..'))) fehler('Zielordner muss AUSSERHALB des Repositories liegen');
    const { zug, k } = await kHolen(), key = await z.aesKey(k);
    fs.mkdirSync(a1, { recursive: true });
    fs.writeFileSync(path.join(a1, 'app.html'), z.text(await z.entschluessle(key, lese(path.join(AGENT, 'app-' + zug.ver + '.enc')))));
    fs.writeFileSync(path.join(a1, 'pc.zip'), await z.entschluessle(key, lese(path.join(AGENT, 'pc-agent', 'pc-' + zug.ver + '.enc'))));
    console.log('Entschlüsselt nach ' + a1 + ' (app.html, pc.zip)');
  } else if (cmd === 'verschluesseln') {
    if (!a1) fehler('verschluesseln <klartext.html> [pc.zip]');
    const { zug, k } = await kHolen(), key = await z.aesKey(k), ver = neueVersion();
    const altZip = path.join(AGENT, 'pc-agent', 'pc-' + zug.ver + '.enc');
    const zip = a2 ? new Uint8Array(fs.readFileSync(a2)) : await z.entschluessle(key, lese(altZip));
    schreibe(path.join(AGENT, 'app-' + ver + '.enc'), await z.verschluessle(key, fs.readFileSync(a1, 'utf8')));
    schreibe(path.join(AGENT, 'pc-agent', 'pc-' + ver + '.enc'), await z.verschluessle(key, zip));
    zug.ver = ver; schreibe(ZUG, zug); alteDateienWeg(ver);
    console.log('Neu verschlüsselt, Version ' + ver);
  } else {
    fehler('Befehl: einrichten | entschluesseln | verschluesseln');
  }
})().catch(e => fehler(e.message));
