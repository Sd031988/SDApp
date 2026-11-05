'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {percentile, summary} = require('./sd-world-babylon-cells.bench.cjs');

test('empty percentile samples still reject invalid fractions', () => {
  for (const fraction of [0, -1, 1.01, NaN, Infinity, -Infinity, undefined]) {
    assert.throws(() => percentile([], fraction), RangeError);
  }
});

test('empty valid samples return null and empty summary has null metrics', () => {
  assert.equal(percentile([], 0.5), null);
  assert.equal(percentile([], 1), null);
  assert.deepEqual(summary([]), {p50: null, p95: null, min: null, max: null});
});

test('nearest-rank percentile boundary remains deterministic', () => {
  const samples = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  assert.equal(percentile(samples, 0.5), 5);
  assert.equal(percentile(samples, 0.95), 10);
  assert.equal(percentile(samples, 1), 10);
});
