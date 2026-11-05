'use strict';

// Read-only contract checks for the actual playable Inselsturm entrypoint.
// No browser mocks, game-state mutations or changes to Claude-owned modules.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script\b([^>]*)>/gi)]
  .map((match) => /\bsrc\s*=\s*["']([^"']+)["']/i.exec(match[1])?.[1])
  .filter(Boolean);
const local = scripts.filter((src) => !/^https?:\/\//i.test(src));
const clean = (src) => src.split(/[?#]/, 1)[0];

test('all locally referenced engine scripts exist inside engine directory', () => {
  assert.ok(local.length >= 10, 'expected playable engine module references');
  for (const src of local) {
    const relative = clean(src);
    assert.match(relative, /^\.\/[\w.-]+\.js$/, 'unexpected or escaping local script path');
    assert.ok(fs.statSync(path.join(root, relative)).isFile(), 'missing engine script: ' + relative);
  }
});

test('entrypoint does not load the same local script twice', () => {
  const names = local.map(clean);
  assert.equal(new Set(names).size, names.length, 'duplicate local scripts can double-register gameplay');
});

test('Babylon, glTF loader and Havok are pinned and loaded before gameplay', () => {
  const babylon = scripts.findIndex((s) => /\/babylonjs@9\.31\.3\/babylon\.js(?:\?|$)/.test(s));
  const loader = scripts.findIndex((s) => /\/babylonjs-loaders@9\.31\.3\/babylonjs\.loaders\.min\.js(?:\?|$)/.test(s));
  const havok = scripts.findIndex((s) => /\/\@babylonjs\/havok@1\.3\.14\//.test(s));
  const firstLocal = scripts.findIndex((s) => s.startsWith('./'));
  assert.ok(babylon >= 0 && loader > babylon && havok > loader, 'missing or reordered pinned 3D dependencies');
  assert.ok(firstLocal > havok, 'gameplay loaded before 3D dependencies');
});

test('existing gameplay modules load before the SD engine bootstrap', () => {
  const names = local.map(clean);
  const engine = names.indexOf('./sd-engine.js');
  assert.equal(engine, names.length - 1, 'engine bootstrap must remain the final external gameplay script');
  for (const critical of ['./sd-fahrzeug.js', './sd-mensch.js', './sd-stadt.js', './sd-ki.js', './sd-battleroyale.js', './sd-teile.js']) {
    const position = names.indexOf(critical);
    assert.ok(position >= 0 && position < engine, 'missing or late critical gameplay module: ' + critical);
  }
});
