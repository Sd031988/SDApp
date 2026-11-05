'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {run, percentile, summary} = require('./sd-world-babylon-cells.bench.cjs');

test('nearest-rank percentiles handle empty and small samples', () => {
  assert.equal(percentile([], 0.5), null);
  assert.equal(percentile([1, 2, 3, 4, 5], 0.5), 3);
  assert.equal(percentile([1, 2, 3, 4, 5], 0.95), 5);
  assert.throws(() => percentile([1], 0), RangeError);
  assert.throws(() => percentile([1], 1.1), RangeError);
});
test('phase summary sorts without mutating input', () => {
  const values = [9, 1, 4, 2];
  assert.deepEqual(summary(values), {p50: 2, p95: 9, min: 1, max: 9});
  assert.deepEqual(values, [9, 1, 4, 2]);
});
test('CPU benchmark exercises actual adapter load/evict and reports balanced ownership', async () => {
  const result = await run({iterations: 4, warmup: 2, cells: 3});
  assert.equal(result.imports, 18);
  assert.equal(result.disposals, 18);
  assert.equal(result.iterations, 4);
  assert.equal(result.cells, 3);
  assert.equal(result.benchmark, 'mock-babylon-cell-lifecycle-cpu');
  assert.ok(Number.isFinite(result.p50) && result.p50 >= 0);
  assert.ok(Number.isFinite(result.p95) && result.p95 >= result.p50);
  for (const phase of ['load', 'evict']) {
    const metrics = result.phases[phase];
    assert.ok(Number.isFinite(metrics.p50) && metrics.p50 >= 0);
    assert.ok(Number.isFinite(metrics.p95) && metrics.p95 >= metrics.p50);
    assert.ok(metrics.max >= metrics.min);
  }
  assert.ok(result.disclaimer.includes('no GLB decode'));
});
test('invalid benchmark configuration fails before execution', async () => {
  await assert.rejects(run({iterations: 0}), RangeError);
  await assert.rejects(run({cells: -1}), RangeError);
  await assert.rejects(run({warmup: 1.5}), RangeError);
  await assert.rejects(run({iterations: 100001}), /sample or cell-operation budget/);
  await assert.rejects(run({iterations: 100000, cells: 11}), /sample or cell-operation budget/);
  await assert.rejects(run({iterations: 1, warmup: 1000000, cells: 2}), /sample or cell-operation budget/);
});
