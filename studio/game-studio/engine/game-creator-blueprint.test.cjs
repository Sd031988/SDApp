const test = require('node:test');
const assert = require('node:assert/strict');
const { compile, validate } = require('./game-creator-blueprint.js');
test('creates bounded data-only blueprint without touching the engine', () => {
  const b = compile('Baue eine Stadt mit Straßen, Wald, Autos und Gegnern');
  assert.equal(b.schema, 'sd-game-creator-blueprint/v1');
  assert.equal(b.state, 'planning-only');
  assert.equal(b.world.width, 640);
  assert.ok(b.objects.length > 1 && b.objects.length <= 256);
  assert.ok(b.objects.slice(1).every(o => o.asset === null && o.position === null));
  assert.equal(validate(b), true);
});
test('deterministic and configurable world dimensions', () => {
  const a = compile('City with vehicles', { worldSize: 1024 });
  assert.deepEqual(a, compile('City with vehicles', { worldSize: 1024 }));
  assert.equal(a.world.depth, 1024);
});
test('rejects unsafe or invalid input', () => {
  assert.throws(() => compile(''), RangeError);
  assert.throws(() => compile('x'.repeat(2001)), RangeError);
  assert.throws(() => compile('forest', { worldSize: -1 }), RangeError);
  assert.throws(() => compile('forest', { worldSize: 1.5 }), RangeError);
  assert.throws(() => compile('forest', []), TypeError);
});
test('rejects traversal, remote assets, duplicate IDs and malformed positions', () => {
  const b = compile('cars');
  b.objects[1].asset = '../secret.glb';
  assert.equal(validate(b), false);
  b.objects[1].asset = 'assets/car.glb';
  assert.equal(validate(b), true);
  b.objects[1].position = [0, Infinity, 0];
  assert.equal(validate(b), false);
  b.objects[1].position = [0, 0, 0];
  b.objects[1].id = b.objects[0].id;
  assert.equal(validate(b), false);
});
