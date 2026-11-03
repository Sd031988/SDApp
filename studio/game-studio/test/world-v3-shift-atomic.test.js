'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const worldCore = require('../large-world-core.js');

test('v3 shift rejects a full destination without mutating either cell', () => {
  const world = worldCore.generate(31, 0);
  const source = world.cells.find(c => c.cx === 0 && c.cz === 0);
  const target = world.cells.find(c => c.cx === 1 && c.cz === 0);
  const sourceObject = worldCore.add(world, 'box', -300, -300);
  for (let i = 0; i < worldCore.MAX_PER_CELL; i++) {
    worldCore.add(world, 'tree', -260 + (i % 10) * 0.01, -300);
  }
  const before = worldCore.serialize(world);
  assert.equal(source.objects.length, 1);
  assert.equal(target.objects.length, worldCore.MAX_PER_CELL);
  assert.throws(() => worldCore.shift(world, sourceObject.id, -260, -300), /voll/);
  assert.equal(worldCore.serialize(world), before);
  assert.equal(source.objects[0], sourceObject);
});

test('v3 shift across a cell boundary preserves id and round-trip export', () => {
  const world = worldCore.generate(31, 0);
  const obj = worldCore.add(world, 'rock', -300, -300);
  const moved = worldCore.shift(world, obj.id, -260, -300);
  assert.equal(moved, obj);
  assert.equal(moved.id, obj.id);
  assert.equal(world.cells.find(c => c.cx === 0 && c.cz === 0).objects.length, 0);
  assert.equal(world.cells.find(c => c.cx === 1 && c.cz === 0).objects.length, 1);
  assert.deepEqual(worldCore.parse(worldCore.serialize(world)), worldCore.validate(world));
});
