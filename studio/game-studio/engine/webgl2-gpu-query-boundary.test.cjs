'use strict';
// Isolated regression tests: no production renderer or project mutation.
const test = require('node:test');
const assert = require('node:assert/strict');
const { create } = require('./webgl2-gpu-timer.js');

function fixture() {
  const ext = { TIME_ELAPSED_EXT: 0x88BF, GPU_DISJOINT_EXT: 0x8FBB };
  const calls = { created: 0, deleted: [], began: 0, ended: 0 };
  const state = { disjoint: false, available: false, result: 3000000 };
  const gl = {
    QUERY_RESULT_AVAILABLE: 0x8867, QUERY_RESULT: 0x8866,
    getExtension: name => name === 'EXT_disjoint_timer_query_webgl2' ? ext : null,
    createQuery: () => ({ id: ++calls.created }),
    beginQuery: () => { calls.began++; },
    endQuery: () => { calls.ended++; },
    deleteQuery: q => { calls.deleted.push(q.id); },
    getParameter: key => key === ext.GPU_DISJOINT_EXT ? state.disjoint : null,
    getQueryParameter: (_q, key) => key === gl.QUERY_RESULT_AVAILABLE ? state.available : state.result
  };
  return { gl, state, calls };
}

test('pending query blocks overlapping begin and is not a measurement', () => {
  const { gl, state, calls } = fixture();
  const timer = create(gl);
  assert.equal(timer.begin(), true);
  assert.equal(timer.begin(), false);
  assert.equal(timer.end(), true);
  assert.equal(timer.begin(), false);
  assert.equal(timer.poll().status, 'pending');
  assert.deepEqual(calls.deleted, []);
  state.available = true;
  assert.deepEqual(timer.poll(), { status: 'measured', gpuMs: 3 });
  assert.deepEqual(calls.deleted, [1]);
  assert.equal(timer.begin(), true);
  timer.dispose();
  assert.deepEqual(calls.deleted, [1, 2]);
});

test('disjoint result never reaches measured status and releases query', () => {
  const { gl, state, calls } = fixture();
  const timer = create(gl);
  timer.begin(); timer.end();
  state.disjoint = true; state.available = true;
  assert.deepEqual(timer.poll(), { status: 'disjoint', gpuMs: null });
  assert.deepEqual(calls.deleted, [1]);
  timer.dispose();
});

test('invalid query results are rejected and disposed', () => {
  for (const value of [NaN, -1, Infinity, '4000']) {
    const { gl, state, calls } = fixture();
    state.available = true; state.result = value;
    const timer = create(gl);
    timer.begin(); timer.end();
    assert.deepEqual(timer.poll(), { status: 'invalid', gpuMs: null });
    assert.deepEqual(calls.deleted, [1]);
    timer.dispose();
  }
});

test('dispose during active query is idempotent and prohibits reuse', () => {
  const { gl, calls } = fixture();
  const timer = create(gl);
  timer.begin(); timer.dispose(); timer.dispose();
  assert.equal(calls.ended, 1);
  assert.deepEqual(calls.deleted, [1]);
  assert.throws(() => timer.begin(), /disposed/);
  assert.throws(() => timer.poll(), /disposed/);
});
