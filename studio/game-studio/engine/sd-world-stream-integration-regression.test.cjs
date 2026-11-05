'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { create } = require('./sd-world-stream-controller.js');
const world = { width: 4, height: 1, cellSize: 10, loadRadius: 0, unloadRadius: 0, maxLoaded: 1 };

test('controller close aborts in-flight cell load and disposes late resource', async () => {
  let started, finish;
  const began = new Promise(resolve => { started = resolve; });
  const gate = new Promise(resolve => { finish = resolve; });
  const disposed = [];
  const controller = create({
    ...world,
    load: async (id, signal) => {
      started(signal);
      await gate;
      return { id };
    },
    dispose: async (_resource, id) => { disposed.push(id); }
  });
  const movement = controller.move(1, 1);
  const signal = await began;
  const closing = controller.close();
  assert.equal(signal.aborted, true);
  finish();
  await Promise.allSettled([movement, closing]);
  assert.deepEqual(disposed, ['0:0']);
  assert.deepEqual(controller.snapshot().loaded, []);
  assert.equal(controller.snapshot().closed, true);
  await assert.rejects(controller.move(11, 1), /closed/);
});

test('controller surfaces failed eviction disposal and can reconcile again', async () => {
  let fail = true;
  const controller = create({
    ...world,
    load: async id => ({ id }),
    dispose: async (_resource, id) => {
      if (id === '0:0' && fail) { fail = false; throw new Error('gpu dispose failed'); }
    }
  });
  await controller.move(1, 1);
  await assert.rejects(controller.move(11, 1), /gpu dispose failed/);
  // Failed disposal is reported, never silently converted to a successful move.
  assert.deepEqual(controller.snapshot().loaded, []);
  assert.deepEqual((await controller.move(11, 1)).loaded, ['1:0']);
  await controller.close();
});

test('failed loader reports error without poisoning later traversal', async () => {
  const errors = [];
  let first = true;
  const controller = create({
    ...world,
    load: async id => {
      if (first) { first = false; throw new Error('missing GLB'); }
      return { id };
    },
    dispose: async () => {},
    onError: (error, id) => { errors.push([error.message, id]); }
  });
  assert.deepEqual((await controller.move(1, 1)).loaded, []);
  assert.deepEqual(errors, [['missing GLB', '0:0']]);
  assert.deepEqual((await controller.move(1, 1)).loaded, ['0:0']);
  await controller.close();
});
