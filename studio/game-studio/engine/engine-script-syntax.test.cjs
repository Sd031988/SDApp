'use strict';
// Read-only syntax smoke test for the playable Inselsturm entrypoint.
// This does not execute gameplay or modify any Claude-owned module.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = __dirname;
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const sources = [...html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi)]
  .map((match) => match[1]);
const local = sources.filter((src) => !/^(?:https?:)?\/\//i.test(src));

test('entrypoint JavaScript modules parse without executing gameplay', async (t) => {
  assert.ok(local.length >= 10, 'expected the real playable engine script chain');
  for (const src of local) {
    const clean = src.split(/[?#]/, 1)[0];
    assert.match(clean, /^\.\/[a-zA-Z0-9_.-]+\.js$/, 'unexpected engine script path');
    const file = path.resolve(root, clean);
    assert.equal(path.dirname(file), root, 'script must stay inside engine directory');
    assert.ok(fs.existsSync(file), 'missing engine script: ' + clean);
    const result = spawnSync(process.execPath, ['--check', file], {
      encoding: 'utf8', timeout: 10000
    });
    await t.test('syntax ' + clean, () => {
      assert.equal(result.error, undefined, result.error?.message);
      assert.equal(result.status, 0, clean + ': ' + (result.stderr || result.stdout));
    });
  }
});
