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
