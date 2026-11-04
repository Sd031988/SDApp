/* SD Engine opt-in performance telemetry. No GPU timer claims; no network/storage. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.SDEnginePerformance = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function percentile(sorted, fraction) {
    return sorted[Math.max(0, Math.ceil(sorted.length * fraction) - 1)];
  }
  function create(options) {
    options = options || {};
    const capacity = options.capacity === undefined ? 240 : options.capacity;
    if (!Number.isSafeInteger(capacity) || capacity < 2 || capacity > 3600) throw new RangeError('capacity must be 2..3600');
    const now = options.now || (() => performance.now());
    if (typeof now !== 'function') throw new TypeError('now must be a function');
    const samples = new Float64Array(capacity);
    let count = 0, cursor = 0, start = null, disposed = false;
    function add(ms) {
      if (disposed) return false;
      if (!Number.isFinite(ms) || ms < 0 || ms > 60000) throw new RangeError('invalid frame duration');
      samples[cursor] = ms; cursor = (cursor + 1) % capacity;
      count = Math.min(capacity, count + 1);
      return true;
    }
    function begin() {
      if (disposed) return false;
      if (start !== null) throw new Error('frame already started');
      const t = now(); if (!Number.isFinite(t)) throw new RangeError('invalid clock');
      start = t; return true;
    }
    function end() {
      if (disposed) return false;
      if (start === null) throw new Error('frame not started');
      const t = now(), duration = t - start; start = null;
      return add(duration);
    }
    function snapshot() {
      if (!count) return Object.freeze({count: 0, meanMs: null, p50Ms: null, p95Ms: null, overBudget: 0});
      const values = Array.from(samples.slice(0, count)).sort((a, b) => a - b);
      const sum = values.reduce((a, b) => a + b, 0);
      return Object.freeze({count, meanMs: sum / count, p50Ms: percentile(values, 0.5), p95Ms: percentile(values, 0.95), overBudget: values.filter(v => v > 1000 / 60).length});
    }
    function reset() { if (disposed) return false; count = cursor = 0; start = null; samples.fill(0); return true; }
    function dispose() { disposed = true; count = cursor = 0; start = null; samples.fill(0); }
    return Object.freeze({add, begin, end, snapshot, reset, dispose});
  }
  /* Measures JS render callback time only. Not frame latency, GPU work or simulation time. */
  function attach(scene, options) {
    if (!scene || !scene.onBeforeRenderObservable || !scene.onAfterRenderObservable ||
        typeof scene.onBeforeRenderObservable.add !== 'function' || typeof scene.onAfterRenderObservable.add !== 'function' ||
        typeof scene.onBeforeRenderObservable.remove !== 'function' || typeof scene.onAfterRenderObservable.remove !== 'function') {
      throw new TypeError('Babylon scene with render observables required');
    }
    const meter = create(options);
    let active = true;
    const before = scene.onBeforeRenderObservable.add(() => { if (active) meter.begin(); });
    try {
      const after = scene.onAfterRenderObservable.add(() => { if (active) meter.end(); });
      return Object.freeze({snapshot: meter.snapshot, reset: meter.reset, detach() {
        if (!active) return;
        active = false;
        scene.onBeforeRenderObservable.remove(before);
        scene.onAfterRenderObservable.remove(after);
        meter.dispose();
      }});
    } catch (error) {
      scene.onBeforeRenderObservable.remove(before);
      meter.dispose();
      throw error;
    }
  }
  return Object.freeze({create, attach});
});
