'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const api = require('../../studio/devtools.js');

test('JSON-Formatierung und Komprimierung verändern keine Textwerte', () => {
  const original = '{"title":"a b","valid":true,"data":[1,2]}';
  assert.equal(api.run('json-pretty', original), JSON.stringify(JSON.parse(original), null, 2));
  assert.equal(api.run('json-min', api.run('json-pretty', original)), original);
  assert.throws(() => api.run('json-pretty', '{broken'), SyntaxError);
});

test('JSON-Zahlen und doppelte Schlüssel bleiben ohne Datenverlust unverändert', () => {
  const source = '{"integer":9007199254740993,"huge":1e999,"decimal":12.000,' +
    '"negative":-0,"small":1e-9999,"escaped":"\\u00e4","repeat":1,"repeat":2}';
  assert.equal(api.run('json-min', source), source);
  const pretty = api.run('json-pretty', source);
  assert.match(pretty, /9007199254740993/);
  assert.match(pretty, /1e999/);
  assert.match(pretty, /12\.000/);
  assert.match(pretty, /1e-9999/);
  assert.match(pretty, /"repeat": 1,[\s\S]*"repeat": 2/);
  assert.equal(api.run('json-min', pretty), source);
  assert.equal(api.run('json-pretty', '42'), '42');
  assert.equal(api.run('json-min', 'true'), 'true');
  assert.equal(api.run('json-min', '"Wort"'), '"Wort"');
  assert.equal(api.run('json-pretty', '[{},[],{"items":[1,2]}]'), '[\n  {},\n  [],\n  {\n    "items": [\n      1,\n      2\n    ]\n  }\n]');
});

test('UTF-8-BOM bleibt beim Base64-Roundtrip erhalten', () => {
  const input = '\uFEFFAnfang mit BOM';
  assert.equal(api.decodeBase64(api.encodeBase64(input)), input);
  assert.equal(api.decodeBase64(api.encodeBase64('\uFEFF')), '\uFEFF');
});

test('Automatische Formaterkennung berücksichtigt skalare JSON-Werte', () => {
  for (const input of ['42', 'true', 'false', 'null', '"text"', '-0.5', '1e999']) {
    assert.equal(api.detect(input), 'json-pretty', input);
  }
  assert.equal(api.detect('kein JSON'), null);
  assert.equal(api.detect('{"ungültig": }'), null);
});

test('Base64 arbeitet mit UTF-8, auch für Umlaute und Emoji', () => {
  const value = 'Grüße aus Heidelberg 👋';
  assert.equal(api.decodeBase64(api.encodeBase64(value)), value);
  assert.throws(() => api.decodeBase64('%%%'), /Base64/);
  assert.throws(() => api.decodeBase64('////'), /utf-8|UTF-8|encoded/i);
});

test('URL-Werkzeuge und Smart Detection', () => {
  const encoded = api.run('url-encode', 'Hallo Welt & Spaß');
  assert.equal(api.run('url-decode', encoded), 'Hallo Welt & Spaß');
  assert.equal(api.detect('{"a": 1}'), 'json-pretty');
  assert.equal(api.detect('%C3%BC'), 'url-decode');
  assert.equal(api.detect('Hallo Welt'), null);
  assert.throws(() => api.run('url-decode', '%ZZ'), URIError);
});

test('Textvergleich stellt Einfügungen und Löschungen korrekt dar', () => {
  const result = api.run('text-diff', 'eins\nzwei\ndrei', 'eins\nneu\ndrei');
  assert.match(result, /^  eins/m);
  assert.match(result, /^- zwei/m);
  assert.match(result, /^\+ neu/m);
  assert.match(result, /^  drei/m);
  assert.throws(() => api.run('text-diff', 'x\n'.repeat(500), 'y\n'.repeat(500)), /Zeilen/);
});

test('Ungültige Werkzeuge und übergroße Eingaben werden abgewiesen', () => {
  assert.throws(() => api.run('__proto__', 'abc'), /Unbekannt/);
  assert.throws(() => api.run('url-encode', 'x'.repeat(250001)), /zu groß/);
});

test('Neue Werkzeuge sind getrennt vom Projekt-Editor eingebunden', () => {
  const root = path.resolve(__dirname, '../../studio');
  const html = fs.readFileSync(path.join(root, 'devtools.html'), 'utf8');
  const studio = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const js = fs.readFileSync(path.join(root, 'devtools.js'), 'utf8');
  assert.match(studio, /href="\.\/devtools\.html"/);
  assert.match(html, /src="\.\/devtools\.js/);
  assert.match(html, /id="source"/);
  assert.match(html, /id="output"/);
  assert.doesNotMatch(js, /\b(?:localStorage|indexedDB|fetch|XMLHttpRequest)\b/);
});
