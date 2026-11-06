'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const World = require('../large-world-core.js');

test('World v3 rejects duplicate object IDs across separate cells without changing the source', () => {
  const world = World.generate(31, 1);
  const before = JSON.stringify(world);
  world.cells[1].objects[0].id = world.cells[0].objects[0].id;
  const invalid = JSON.stringify(world);
  assert.throws(() => World.validate(world), /Großwelt v3/);
  assert.equal(JSON.stringify(world), invalid);
  assert.notEqual(before, invalid);
});

test('World v3 rejects duplicate cell coordinates and leaves caller-owned arrays intact', () => {
  const world = World.generate(31, 0);
  world.cells[1].cx = world.cells[0].cx;
  world.cells[1].cz = world.cells[0].cz;
  const before = JSON.stringify(world);
  assert.throws(() => World.serialize(world), /Doppelte Szenenzelle/);
  assert.equal(JSON.stringify(world), before);
});

test('World v3 rejects non-finite and out-of-bounds coordinates before serialization', () => {
  for (const coordinate of [Infinity, -Infinity, NaN, World.HALF + 1]) {
    const world = World.generate(31, 1);
    world.cells[0].objects[0].x = coordinate;
    assert.throws(() => World.serialize(world), /Großwelt v3/);
  }
});

test('World v3 parse rejects oversized payloads without accepting partial scene data', () => {
  assert.throws(() => World.parse(' '.repeat(World.MAX_FILE + 1)), /Projektdatei zu groß/);
  assert.throws(() => World.parse('{"version":3'), /Ungültige JSON-Daten/);
});

test('World v3 serialization roundtrip preserves stable IDs and does not alias caller objects', () => {
  const world = World.generate(31, 2);
  const original = JSON.stringify(world);
  const restored = World.parse(World.serialize(world));
  assert.deepEqual(restored, world);
  restored.cells[0].objects[0].x += 1;
  assert.equal(JSON.stringify(world), original);
});
