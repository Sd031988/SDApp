'use strict';
// Opt-in CPU-only lifecycle benchmark; does not measure GPU, WebGL or real GLB decode.
// Usage: node studio/game-studio/engine/sd-world-babylon-cells.bench.cjs
const assert = require('node:assert/strict');
const {performance} = require('node:perf_hooks');
const {create} = require('./sd-world-babylon-cells.js');

function percentile(sorted, fraction) {
  if (!sorted.length) return null;
  return sorted[Math.ceil(fraction * sorted.length) - 1];
}
async function run({iterations = 1000, warmup = 100, cells = 16} = {}) {
  for (const [key, value] of Object.entries({iterations, warmup, cells})) {
    if (!Number.isSafeInteger(value) || value < (key === 'warmup' ? 0 : 1))
      throw new RangeError(key + ' must be a nonnegative safe integer (positive except warmup)');
  }
  const counts = {imports: 0, disposals: 0};
  const Babylon = {SceneLoader: {async ImportMeshAsync() {
    counts.imports++;
    return {meshes: [{dispose() {counts.disposals++;}}], transformNodes: [],
      skeletons: [], animationGroups: []};
  }}};
  const adapter = create({scene: {}, Babylon, resolveCell: id => ({url: './cells/' + id + '.glb'})});
  const samples = [];
  async function cycle(measure) {
    const start = performance.now();
    const resources = [];
    for (let i = 0; i < cells; i++) resources.push([String(i), await adapter.load(String(i))]);
    for (const [id, resource] of resources) await adapter.dispose(resource, id);
    const elapsed = performance.now() - start;
    assert.equal(adapter.activeCount(), 0, 'active cell leak');
    assert.equal(adapter.pendingCount(), 0, 'pending cell leak');
    if (measure) samples.push(elapsed);
  }
  for (let i = 0; i < warmup; i++) await cycle(false);
  for (let i = 0; i < iterations; i++) await cycle(true);
  assert.equal(counts.imports, (iterations + warmup) * cells);
  assert.equal(counts.disposals, counts.imports);
  samples.sort((a, b) => a - b);
  return {
    benchmark: 'mock-babylon-cell-lifecycle-cpu',
    disclaimer: 'Mock SceneLoader; no GLB decode, GPU, browser or mobile measurement',
    iterations, warmup, cells, unit: 'ms per load+evict cycle',
    p50: percentile(samples, 0.5), p95: percentile(samples, 0.95),
    min: samples[0], max: samples[samples.length - 1],
    imports: counts.imports, disposals: counts.disposals
  };
}
if (require.main === module) {
  run().then(result => console.log(JSON.stringify(result, null, 2)))
    .catch(error => {console.error(error); process.exitCode = 1;});
}
module.exports = {run, percentile};
