'use strict';
// Startpaket: Prüfung vor dem Herunterladen und Startdateien (studio/startpaket.js)
const test = require('node:test');
const assert = require('node:assert/strict');
require('../../studio/startpaket.js');
const SP = globalThis.SDStartpaket;

test('Flask-Projekt: requirements.txt aus Imports, Webserver-Port, Startdateien', () => {
  const b = SP.bauen({ 'app.py': 'from flask import Flask\nimport requests\napp = Flask(__name__)\nif __name__ == "__main__":\n    app.run(port=5050)\n' }, null, 'Flask');
  assert.equal(b.analyse.art, 'python');
  assert.equal(b.analyse.fehler, 0);
  assert.match(b.dateien['requirements.txt'], /^flask$/m);
  assert.match(b.dateien['requirements.txt'], /^requests$/m);
  assert.equal(b.analyse.start.url, 'http://127.0.0.1:5050');
  assert.ok(b.dateien['START-WINDOWS.cmd'] && b.dateien['start-mac-linux.sh'] && b.dateien['SO-STARTEN.txt']);
  assert.deepEqual(b.ausfuehrbar, ['start-mac-linux.sh']);
});

test('Windows-Startdatei: nur ASCII, CRLF, alle Sprungmarken vorhanden, ZIP-Erkennung ohne findstr', () => {
  const cmd = SP.bauen({ 'main.py': 'print("hallo äöü")\n' }, null, 'Übung (1) & Test').dateien['START-WINDOWS.cmd'];
  assert.ok(!/[^\x00-\x7f]/.test(cmd), 'nur ASCII');
  assert.ok(!/[^\r]\n/.test(cmd), 'nur CRLF');
  for (const marke of ['keinpython', 'zip', 'fehler']) {
    assert.match(cmd, new RegExp('goto ' + marke + '\\b'));
    assert.match(cmd, new RegExp('^:' + marke + '\\r$', 'm'));
  }
  assert.ok(!/findstr/i.test(cmd));
  assert.ok(!/title [^\r]*[&|<>^%]/.test(cmd), 'Sonderzeichen im Titel entfernt');
});

test('FastAPI ohne uvicorn in requirements: uvicorn wird ergänzt und gestartet', () => {
  const b = SP.bauen({ 'app/main.py': 'from fastapi import FastAPI\napi = FastAPI()\n', 'requirements.txt': 'fastapi\n' }, null, 'API');
  assert.match(b.dateien['requirements.txt'], /^uvicorn$/m);
  assert.deepEqual(b.analyse.start.befehl.slice(0, 3), ['-m', 'uvicorn', 'app.main:api']);
});

test('Fehler werden vor dem Herunterladen gemeldet', () => {
  const a = SP.analysieren({ 'main.py': 'from .utils import x\nprint(os.getcwd())\ndef f(:\n    pass\n' }, null);
  const text = a.meldungen.map(m => m.join(' ')).join('\n');
  assert.ok(a.fehler >= 3, text);
  assert.match(text, /Eigene Module fehlen/);
  assert.match(text, /os ohne „import“/);
  assert.match(text, /wird nicht geschlossen/);
});

test('Unbekannte Module landen nicht in requirements.txt (sonst bricht pip ab)', () => {
  const b = SP.bauen({ 'main.py': 'import pandas\nimport meinmodul\n' }, null, 'X');
  assert.match(b.dateien['requirements.txt'], /^pandas$/m);
  assert.ok(!/meinmodul/.test(b.dateien['requirements.txt']));
  assert.ok(b.analyse.meldungen.some(m => m[0] === 'warn' && /meinmodul/.test(m[1])));
});

test('Node.js: fehlende Abhängigkeit wird in package.json ergänzt', () => {
  const b = SP.bauen({ 'package.json': '{"scripts":{"start":"node index.js"},"dependencies":{}}', 'index.js': 'const axios = require("axios");\nconst fs = require("fs");\n' }, null, 'N');
  const pkg = JSON.parse(b.dateien['package.json']);
  assert.equal(pkg.dependencies.axios, '*');
  assert.ok(!pkg.dependencies.fs);
  assert.match(b.dateien['START-WINDOWS.cmd'], /call npm start/);
});

test('ZIP: Startdatei für Mac/Linux ist ausführbar, alles liegt in einem Ordner', () => {
  const b = SP.bauen({ 'a.py': 'print(1)\n' }, null, 'Z');
  const buf = Buffer.concat(SP.zipBytes(b.dateien, b.ausfuehrbar, 'z').map(x => Buffer.from(x)));
  let p = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06])); const anzahl = buf.readUInt16LE(p + 10); let off = buf.readUInt32LE(p + 16);
  const rechte = {};
  for (let i = 0; i < anzahl; i++) {
    const nl = buf.readUInt16LE(off + 28), xl = buf.readUInt16LE(off + 30), kl = buf.readUInt16LE(off + 32);
    const name = buf.toString('utf8', off + 46, off + 46 + nl); rechte[name] = (buf.readUInt32LE(off + 38) >>> 16) & 0o777; off += 46 + nl + xl + kl;
  }
  assert.equal(rechte['z/start-mac-linux.sh'], 0o755);
  assert.equal(rechte['z/a.py'], 0o644);
  assert.ok(Object.keys(rechte).every(n => n.startsWith('z/')));
});
