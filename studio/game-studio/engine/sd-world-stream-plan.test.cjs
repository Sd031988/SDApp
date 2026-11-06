'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { plan } = require('./sd-world-stream-plan.js');
const base = { width: 16, height: 16, cellSize: 40, playerX: 320, playerZ: 320, loadRadius: 1, unloadRadius: 2, maxLoaded: 9 };
test('center loads nearest 3x3 cells without mutation', () => {
  const input = { ...base, loaded: [] };
  const result = plan(input);
  assert.equal(result.acquire.length, 9);
  assert.equal(result.acquire[0], '8:8');
  assert.deepEqual(result.center, { x: 8, z: 8 });
  assert.deepEqual(input.loaded, []);
  assert.ok(Object.isFrozen(result.acquire));
});
test('hysteresis retains nearby resident cell outside load radius', () => {
  const result = plan({ ...base, maxLoaded: 10, loaded: ['10:8'] });
  assert.ok(result.retain.includes('10:8'));
  assert.ok(!result.release.includes('10:8'));
});
test('far cells are released', () => {
  const result = plan({ ...base, loaded: ['0:0'] });
  assert.deepEqual(result.release, ['0:0']);
});
test('resident cell wins tie at capacity', () => {
  const result = plan({ ...base, maxLoaded: 2, loaded: ['8:7'] });
  assert.deepEqual(result.desired, ['8:8', '8:7']);
});
test('outside-world position clamps to boundary', () => {
  const result = plan({ ...base, playerX: -1000, playerZ: 10000 });
  assert.deepEqual(result.center, { x: 0, z: 15 });
  assert.equal(result.desired.length, 4);
});
test('origin offsets work', () => {
  const result = plan({ ...base, originX: -320, originZ: -320, playerX: 0, playerZ: 0 });
  assert.deepEqual(result.center, { x: 8, z: 8 });
});
test('reject malformed input and budgets', () => {
  for (const patch of [ { playerX: NaN }, { cellSize: 0 }, { width: 100 }, { maxLoaded: 0 }, { unloadRadius: 0 }, { loaded: ['__proto__'] }, { loaded: ['0:0', '0:0'] }, { loaded: ['99:0'] }, { loaded: ['01:0'] } ]) {
    assert.throws(() => plan({ ...base, ...patch }));
  }
});
test('stable output and no overlap between acquire/retain/release', () => {
  const options = { ...base, loaded: ['8:8', '9:8', '0:0'] };
  const a = plan(options), b = plan(options);
  assert.deepEqual(a, b);
  assert.equal(new Set([...a.acquire, ...a.retain, ...a.release]).size, a.acquire.length + a.retain.length + a.release.length);
});
