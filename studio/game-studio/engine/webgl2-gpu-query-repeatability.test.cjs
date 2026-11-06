'use strict';
// Opt-in regression only. No renderer hooks or user-project changes.
const test = require('node:test');
const assert = require('node:assert/strict');
const { create } = require('./webgl2-gpu-timer.js');

function mockGPU() {
  const ext = { TIME_ELAPSED_EXT: 0x88BF, GPU_DISJOINT_EXT: 0x8FBB };
  const events = [];
  const state = { available: false, ns: 2500000, disjoint: false };
  const gl = {
    QUERY_RESULT_AVAILABLE: 0x8867, QUERY_RESULT: 0x8866,
    getExtension: name => name === 'EXT_disjoint_timer_query_webgl2' ? ext : null,
    createQuery: () => { const q = { id: events.filter(e => e[0] === 'create').length + 1 }; events.push(['create', q.id]); return q; },
    beginQuery: (_target, q) => events.push(['begin', q.id]),
    endQuery: () => events.push(['end']),
    deleteQuery: q => events.push(['delete', q.id]),
    getParameter: key => key === ext.GPU_DISJOINT_EXT ? state.disjoint : null,
    getQueryParameter: (_q, key) => key === gl.QUERY_RESULT_AVAILABLE ? state.available : state.ns
  };
  return { gl, state, events };
}

test('repeated valid samples reuse timer without leaking query handles', () => {
  const { gl, state, events } = mockGPU();
  const timer = create(gl);
  for (let i = 1; i <= 5; i++) {
    state.available = false;
    assert.equal(timer.begin(), true);
    assert.equal(timer.end(), true);
    assert.equal(timer.poll().status, 'pending');
    state.available = true;
    assert.deepEqual(timer.poll(), { status: 'measured', gpuMs: 2.5 });
  }
  assert.deepEqual(events.filter(e => e[0] === 'delete').map(e => e[1]), [1, 2, 3, 4, 5]);
  timer.dispose();
  assert.equal(events.filter(e => e[0] === 'delete').length, 5);
});

test('pending query disposal releases exactly once without producing a sample', () => {
  const { gl, events } = mockGPU();
  const timer = create(gl);
  assert.equal(timer.begin(), true);
  assert.equal(timer.end(), true);
  assert.equal(timer.poll().status, 'pending');
  timer.dispose();
  timer.dispose();
  assert.deepEqual(events.filter(e => e[0] === 'delete'), [['delete', 1]]);
  assert.throws(() => timer.poll(), /disposed/);
});

test('a disjoint query does not poison subsequent valid query', () => {
  const { gl, state, events } = mockGPU();
  const timer = create(gl);
  timer.begin(); timer.end();
  state.disjoint = true;
  assert.equal(timer.poll().status, 'disjoint');
  state.disjoint = false;
  state.available = true;
  timer.begin(); timer.end();
  assert.deepEqual(timer.poll(), { status: 'measured', gpuMs: 2.5 });
  assert.deepEqual(events.filter(e => e[0] === 'delete').map(e => e[1]), [1, 2]);
  timer.dispose();
});
