'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const World = require('../large-world-core.js');

test('runtime visibility follows live cross-cell edits without stale objects', () => {
  const world = World.generate(31, 0);
  const runtime = World.runtime(world, 0);
  const original = World.add(world, 'box', 1, 1);
  const before = runtime.query(1, 1);
  assert.deepEqual(before.objects.map(object => object.id), [original.id]);
  assert.equal(before.entered, 1);

  World.shift(world, original.id, 41, 1);
  const oldCell = runtime.query(1, 1);
  assert.equal(oldCell.activeObjects, 0);
  assert.equal(oldCell.entered, 0);
  assert.equal(oldCell.exited, 0);

  const newCell = runtime.query(41, 1);
  assert.deepEqual(newCell.objects.map(object => object.id), [original.id]);
  assert.equal(newCell.entered, 1);
  assert.equal(newCell.exited, 1);
  assert.equal(newCell.totalObjects, 1);

  assert.equal(World.remove(world, original.id), true);
  const removed = runtime.query(41, 1);
  assert.equal(removed.activeObjects, 0);
  assert.equal(removed.entered, 0);
  assert.equal(removed.exited, 0);
  assert.equal(removed.totalObjects, 0);
  assert.deepEqual(World.parse(World.serialize(world)), world);
});

test('sparse world queries remain bounded after live edits and reset', () => {
  const world = World.generate(31, 0);
  const runtime = World.runtime(world, 1);
  const added = World.add(world, 'rock', -319, -319);
  const corner = runtime.query(-319, -319);
  assert.equal(corner.activeCells, 4);
  assert.equal(corner.activeObjects, 1);
  assert.equal(corner.totalObjects, 1);
  assert.equal(World.remove(world, added.id), true);
  runtime.reset();
  const empty = runtime.query(-319, -319);
  assert.equal(empty.activeCells, 4);
  assert.equal(empty.activeObjects, 0);
  assert.equal(empty.totalObjects, 0);
  assert.equal(empty.entered, 4);
  assert.equal(empty.exited, 0);
});
