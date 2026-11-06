'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const World = require('../large-world-core.js');

test('world v3 runtime reports deterministic cell transitions and reset', () => {
  const world = World.generate(31, 1);
  const runtime = World.runtime(world, 0);
  const first = runtime.query(-319, -319);
  assert.deepEqual(first.center, { cx: 0, cz: 0 });
  assert.equal(first.activeCells, 1);
  assert.equal(first.entered, 1);
  assert.equal(first.exited, 0);
  assert.equal(first.activeObjects, 1);

  const again = runtime.query(-318, -318);
  assert.equal(again.entered, 0);
  assert.equal(again.exited, 0);

  const moved = runtime.query(-279, -319);
  assert.deepEqual(moved.center, { cx: 1, cz: 0 });
  assert.equal(moved.entered, 1);
  assert.equal(moved.exited, 1);
  assert.equal(moved.activeObjects, 1);

  runtime.reset();
  const afterReset = runtime.query(-279, -319);
  assert.equal(afterReset.entered, 1);
  assert.equal(afterReset.exited, 0);
  assert.equal(afterReset.totalObjects, 256);
});

test('world v3 edge queries stay within valid cells', () => {
  const world = World.generate(31, 0);
  const runtime = World.runtime(world, 3);
  for (const [x, z] of [[-320, -320], [320, 320], [-320, 320], [320, -320]]) {
    const result = runtime.query(x, z);
    assert.equal(result.activeCells, 16);
    assert.equal(result.activeObjects, 0);
    assert.ok(result.cells.every(cell => cell.cx >= 0 && cell.cx < 16 && cell.cz >= 0 && cell.cz < 16));
  }
});
