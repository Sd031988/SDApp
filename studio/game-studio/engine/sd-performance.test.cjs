'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const perf = require('./sd-performance.js');
test('bounded rolling window, deterministic nearest-rank percentiles', () => {
  const p = perf.create({capacity: 4});
  for (const x of [1, 4, 9, 18, 25]) p.add(x);
  assert.deepEqual(p.snapshot(), {count: 4, meanMs: 14, p50Ms: 9, p95Ms: 25, overBudget: 2});
  assert.ok(Object.isFrozen(p.snapshot()));
});
test('empty, reset, disposal', () => {
  const p = perf.create();
  assert.equal(p.snapshot().p95Ms, null);
  p.add(1); p.reset(); assert.equal(p.snapshot().count, 0);
  p.dispose(); assert.equal(p.add(1), false);
});
test('invalid budgets and measurements fail closed', () => {
  for (const capacity of [0, 1, 3601, 2.5, NaN]) assert.throws(() => perf.create({capacity}), RangeError);
  const p = perf.create();
  for (const v of [-1, Infinity, NaN, 60001]) assert.throws(() => p.add(v), RangeError);
});
test('clock lifecycle and monotonic validation', () => {
  const values = [10, 17, 22, 20];
  const p = perf.create({now: () => values.shift()});
  assert.throws(() => p.end(), /not started/);
  p.begin(); assert.throws(() => p.begin(), /already started/); p.end();
  p.begin(); assert.throws(() => p.end(), RangeError);
  assert.equal(p.snapshot().count, 1);
});
test('Babylon scene attach/detach unsubscribes both observers', () => {
  function obs() { const entries = new Set(); return {entries, add(fn) {entries.add(fn); return fn;}, remove(fn) {entries.delete(fn);}, emit() {for(const fn of entries) fn();}}; }
  const scene = {onBeforeRenderObservable: obs(), onAfterRenderObservable: obs()};
  let clock = 0;
  const attached = perf.attach(scene, {now: () => clock});
  scene.onBeforeRenderObservable.emit(); clock += 5; scene.onAfterRenderObservable.emit();
  assert.equal(attached.snapshot().p50Ms, 5);
  attached.detach(); attached.detach();
  assert.equal(scene.onBeforeRenderObservable.entries.size, 0);
  assert.equal(scene.onAfterRenderObservable.entries.size, 0);
});
test('failed after-observer registration cleans up before-observer', () => {
  const set = new Set();
  const scene = {onBeforeRenderObservable: {add(f){set.add(f);return f;},remove(f){set.delete(f);}}, onAfterRenderObservable: {add(){throw Error('fail');},remove(){}}};
  assert.throws(() => perf.attach(scene), /fail/);
  assert.equal(set.size, 0);
});
