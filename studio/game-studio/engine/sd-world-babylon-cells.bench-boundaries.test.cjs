'use strict';
// Regression coverage for mock lifecycle benchmark accounting; not a GPU/GLB test.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {run} = require('./sd-world-babylon-cells.bench.cjs');

test('zero warmup counts only measured cell lifecycle operations', async () => {
  const result = await run({iterations: 3, warmup: 0, cells: 2});
  assert.equal(result.imports, 6);
  assert.equal(result.disposals, 6);
  assert.equal(result.iterations, 3);
  assert.equal(result.phases.load.min >= 0, true);
  assert.equal(result.phases.evict.min >= 0, true);
  assert.ok(result.p95 >= result.p50);
});

test('warmup operations count toward resource ownership but not sample count', async () => {
  const result = await run({iterations: 1, warmup: 4, cells: 2});
  assert.equal(result.imports, 10);
  assert.equal(result.disposals, 10);
  assert.equal(result.p50, result.p95);
  assert.equal(result.phases.load.p50, result.phases.load.p95);
  assert.equal(result.phases.evict.p50, result.phases.evict.p95);
});

test('oversized configurations reject before importer or sample allocation', async () => {
  for (const config of [
    {iterations: Number.MAX_SAFE_INTEGER, cells: Number.MAX_SAFE_INTEGER},
    {iterations: 1, warmup: Number.MAX_SAFE_INTEGER, cells: 2},
    {iterations: 100000, warmup: 1, cells: 11},
    {iterations: 1, cells: 1000001},
    {iterations: Infinity}, {cells: NaN}, {warmup: -1}
  ]) {
    await assert.rejects(run(config), RangeError);
  }
});
