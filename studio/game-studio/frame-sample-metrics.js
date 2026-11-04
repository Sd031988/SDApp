/* Opt-in, dependency-free frame sample statistics. No storage or telemetry. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SDFrameSampleMetrics = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const MAX_SAMPLES = 20000;
  function percentile(sorted, p) {
    const at = (sorted.length - 1) * p;
    const lo = Math.floor(at);
    return sorted[lo] + (sorted[Math.ceil(at)] - sorted[lo]) * (at - lo);
  }
  function summarizeFrames(samples, options = {}) {
    if (!Array.isArray(samples) || !samples.length || samples.length > MAX_SAMPLES) throw new RangeError('Expected 1..20000 frame samples');
    if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('Invalid options');
    const { warmup = 0 } = options;
    if (!Number.isSafeInteger(warmup) || warmup < 0 || warmup >= samples.length) throw new RangeError('Invalid warmup count');
    if (!samples.every(v => typeof v === 'number' && Number.isFinite(v) && v > 0 && v <= 60000)) throw new RangeError('Invalid frame duration');
    const measured = samples.slice(warmup).sort((a, b) => a - b);
    const total = measured.reduce((sum, value) => sum + value, 0);
    return Object.freeze({ sampleCount: measured.length, warmupDiscarded: warmup,
      p50Ms: percentile(measured, 0.5), p95Ms: percentile(measured, 0.95),
      meanMs: total / measured.length, effectiveFps: 1000 * measured.length / total,
      gpuFrameMs: null, drawCalls: null });
  }
  return Object.freeze({ summarizeFrames, MAX_SAMPLES });
});
