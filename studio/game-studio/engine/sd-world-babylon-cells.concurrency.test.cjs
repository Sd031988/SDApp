'use strict';
// Mock SceneLoader concurrency regression; NOT a real GLB/WebGL/GPU benchmark.
const {test} = require('node:test');
const assert = require('node:assert/strict');
const {create} = require('./sd-world-babylon-cells.js');

test('16 concurrent cells isolate failure, retry and stale disposal', async () => {
  const imported = new Map();
  const disposed = new Map();
  let failOnce = true;
  const Babylon = {SceneLoader: {async ImportMeshAsync(_names, root, filename) {
    const id = filename.slice(0, -4);
    assert.equal(root, './cells/');
    await Promise.resolve(); // exercise overlapping pending ownership
    if (id === '7' && failOnce) { failOnce = false; throw new Error('decode failed'); }
    const resource = {meshes: [{dispose() {
      disposed.set(id, (disposed.get(id) || 0) + 1);
    }}], transformNodes: [], skeletons: [], animationGroups: []};
    imported.set(id, resource);
    return resource;
  }}};
  const adapter = create({scene: {}, Babylon, resolveCell: id => ({url: './cells/' + id + '.glb'})});
  const ids = Array.from({length: 16}, (_, i) => String(i));
  const first = await Promise.allSettled(ids.map(id => adapter.load(id)));
  assert.equal(first.filter(x => x.status === 'rejected').length, 1);
  assert.match(first[7].reason.message, /decode failed/);
  assert.equal(adapter.pendingCount(), 0);
  assert.equal(adapter.activeCount(), 15);
  await assert.rejects(adapter.load('0'), /duplicate cell/);
  const recovered = await adapter.load('7');
  assert.equal(adapter.activeCount(), 16);
  assert.equal(recovered, imported.get('7'));
  await adapter.dispose({meshes: []}, '7'); // stale handle must not evict
  assert.equal(adapter.activeCount(), 16);
  await Promise.all(ids.map(id => adapter.dispose(imported.get(id), id)));
  assert.equal(adapter.activeCount(), 0);
  assert.equal(adapter.pendingCount(), 0);
  for (const id of ids) assert.equal(disposed.get(id), 1, 'one disposal per cell: ' + id);
});

test('duplicate pending cell does not block independent cell', async () => {
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const Babylon = {SceneLoader: {async ImportMeshAsync(_names, _root, filename) {
    if (filename === 'a.glb') await gate;
    return {meshes: [{dispose() {}}]};
  }}};
  const adapter = create({scene: {}, Babylon, resolveCell: id => ({url: './cells/' + id + '.glb'})});
  const first = adapter.load('a');
  assert.equal(adapter.pendingCount(), 1);
  await assert.rejects(adapter.load('a'), /duplicate cell/);
  const other = await adapter.load('b');
  assert.equal(adapter.activeCount(), 1);
  release();
  const original = await first;
  await adapter.dispose(other, 'b');
  await adapter.dispose(original, 'a');
  assert.equal(adapter.pendingCount(), 0);
  assert.equal(adapter.activeCount(), 0);
});
