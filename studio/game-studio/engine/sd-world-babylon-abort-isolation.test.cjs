'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { create } = require('./sd-world-babylon-cells.js');

test('late-aborted GLB import releases only its cell and leaves a live neighbor usable', async () => {
  const releases = [];
  let finishSlow;
  const Babylon = { SceneLoader: { ImportMeshAsync(_names, _root, file) {
    if (file === 'slow.glb') return new Promise(resolve => { finishSlow = resolve; });
    return Promise.resolve({
      meshes: [{ dispose() { releases.push(file); } }],
      transformNodes: [], skeletons: [], animationGroups: []
    });
  } } };
  const adapter = create({
    scene: {}, Babylon, resolveCell: id => ({ url: './cells/' + id + '.glb' })
  });
  const stable = await adapter.load('stable');
  const controller = new AbortController();
  const inFlight = adapter.load('slow', controller.signal);
  assert.equal(adapter.pendingCount(), 1);
  controller.abort();
  finishSlow({
    meshes: [{ dispose() { releases.push('slow.glb'); } }],
    transformNodes: [], skeletons: [], animationGroups: []
  });
  await assert.rejects(inFlight, /aborted/);
  assert.deepEqual(releases, ['slow.glb']);
  assert.equal(adapter.pendingCount(), 0);
  assert.equal(adapter.activeCount(), 1);
  await adapter.dispose(stable, 'stable');
  assert.deepEqual(releases, ['slow.glb', 'stable.glb']);
  assert.equal(adapter.activeCount(), 0);
});

test('an already aborted signal never starts Babylon import', async () => {
  let imports = 0;
  const Babylon = { SceneLoader: { ImportMeshAsync() { imports++; return Promise.resolve({}); } } };
  const adapter = create({
    scene: {}, Babylon, resolveCell: () => ({ url: './cells/unused.glb' })
  });
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(adapter.load('unused', controller.signal), /aborted/);
  assert.equal(imports, 0);
  assert.equal(adapter.pendingCount(), 0);
  assert.equal(adapter.activeCount(), 0);
});
