'use strict';
// Opt-in CPU-only lifecycle benchmark; does not measure GPU, WebGL or real GLB decode.
// Usage: node studio/game-studio/engine/sd-world-babylon-cells.bench.cjs
const assert = require('node:assert/strict');
const {performance} = require('node:perf_hooks');
const {create} = require('./sd-world-babylon-cells.js');

function percentile(sorted, fraction) {
  if (!Number.isFinite(fraction) || fraction <= 0 || fraction > 1)
    throw new RangeError('percentile fraction must be in (0, 1]');
  if (!sorted.length) return null;
  return sorted[Math.ceil(fraction * sorted.length) - 1];
}
function summary(samples) {
  const sorted = [...samples].sort((a, b) => a - b);
  return {p50: percentile(sorted, 0.5), p95: percentile(sorted, 0.95),
    min: sorted[0] ?? null, max: sorted[sorted.length - 1] ?? null};
}
async function run({iterations = 1000, warmup = 100, cells = 16} = {}) {
  for (const [key, value] of Object.entries({iterations, warmup, cells})) {
    if (!Number.isSafeInteger(value) || value < (key === 'warmup' ? 0 : 1))
      throw new RangeError(key + ' must be a nonnegative safe integer (positive except warmup)');
  }
  // Bound allocations and async operations before creating a scene or measuring.
  // This is a synthetic microbenchmark, not an unlimited load generator.
  if (iterations > 100000 || (iterations + warmup) * cells > 1000000)
    throw new RangeError('benchmark exceeds sample or cell-operation budget');
  const counts = {imports: 0, disposals: 0};
  const Babylon = {SceneLoader: {async ImportMeshAsync() {
    counts.imports++;
    return {meshes: [{dispose() {counts.disposals++;}}], transformNodes: [],
      skeletons: [], animationGroups: []};
  }}};
  const adapter = create({scene: {}, Babylon, resolveCell: id => ({url: './cells/' + id + '.glb'})});
  const samples = {total: [], load: [], evict: []};
  async function cycle(measure) {
    const start = performance.now();
    const resources = [];
    for (let i = 0; i < cells; i++) resources.push([String(i), await adapter.load(String(i))]);
    const loaded = performance.now();
    for (const [id, resource] of resources) await adapter.dispose(resource, id);
    const evicted = performance.now();
    assert.equal(adapter.activeCount(), 0, 'active cell leak');
    assert.equal(adapter.pendingCount(), 0, 'pending cell leak');
    if (measure) {
      samples.load.push(loaded - start);
      samples.evict.push(evicted - loaded);
      samples.total.push(evicted - start);
    }
  }
  for (let i = 0; i < warmup; i++) await cycle(false);
  for (let i = 0; i < iterations; i++) await cycle(true);
  assert.equal(counts.imports, (iterations + warmup) * cells);
  assert.equal(counts.disposals, counts.imports);
  const total = summary(samples.total);
  return {
    benchmark: 'mock-babylon-cell-lifecycle-cpu',
    disclaimer: 'Mock SceneLoader; no GLB decode, GPU, browser or mobile measurement',
    iterations, warmup, cells, unit: 'ms per load+evict cycle',
    ...total, phases: {load: summary(samples.load), evict: summary(samples.evict)},
    imports: counts.imports, disposals: counts.disposals
  };
}
if (require.main === module) {
  run().then(result => console.log(JSON.stringify(result, null, 2)))
    .catch(error => {console.error(error); process.exitCode = 1;});
}
module.exports = {run, percentile, summary};
