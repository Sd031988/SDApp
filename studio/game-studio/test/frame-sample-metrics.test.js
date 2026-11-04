'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { summarizeFrames, MAX_SAMPLES } = require('../frame-sample-metrics.js');
test('interpolated percentiles and aggregate FPS', () => {
  const r = summarizeFrames([10, 20, 30, 40, 50]);
  assert.equal(r.p50Ms, 30);
  assert.equal(r.p95Ms, 48);
  assert.equal(r.meanMs, 30);
  assert.ok(Math.abs(r.effectiveFps - 1000 / 30) < 1e-9);
  assert.equal(r.gpuFrameMs, null);
  assert.equal(r.drawCalls, null);
});
test('warmup exclusion and nonmutation', () => {
  const input = Object.freeze([500, 16, 17, 18]);
  const r = summarizeFrames(input, { warmup: 1 });
  assert.equal(r.sampleCount, 3);
  assert.equal(r.warmupDiscarded, 1);
  assert.equal(r.p50Ms, 17);
  assert.deepEqual(input, [500, 16, 17, 18]);
  assert.ok(Object.isFrozen(r));
});
test('rejects invalid and unbounded samples', () => {
  for (const value of [[], [0], [-1], [NaN], [Infinity], ['16'], [60001], Array(MAX_SAMPLES + 1).fill(16)]) {
    assert.throws(() => summarizeFrames(value), RangeError);
  }
  assert.throws(() => summarizeFrames([16], { warmup: 1 }), RangeError);
  assert.throws(() => summarizeFrames([16], { warmup: -1 }), RangeError);
  assert.throws(() => summarizeFrames([16], { warmup: 0.5 }), RangeError);
});
test('single sample and deterministic output', () => {
  const a = summarizeFrames([16]);
  assert.equal(a.p50Ms, 16);
  assert.equal(a.p95Ms, 16);
  assert.deepEqual(a, summarizeFrames([16]));
});
