/* SD Engine: deterministic bounded world-cell residency planner.
 * Planning only: no fetch, scene mutation, or automatic loading. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SDWorldStreamPlan = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const MAX_CELLS = 4096;
  function integer(n, min, max, name) {
    if (!Number.isSafeInteger(n) || n < min || n > max) throw new RangeError(name);
    return n;
  }
  function finite(n, name) {
    if (typeof n !== 'number' || !Number.isFinite(n)) throw new TypeError(name);
    return n;
  }
  function id(x, z) { return x + ':' + z; }
  function plan(options) {
    if (!options || typeof options !== 'object' || Array.isArray(options)) throw new TypeError('options');
    const width = integer(options.width, 1, 64, 'width');
    const height = integer(options.height, 1, 64, 'height');
    const cellSize = finite(options.cellSize, 'cellSize');
    if (cellSize <= 0 || cellSize > 100000) throw new RangeError('cellSize');
    const px = finite(options.playerX, 'playerX');
    const pz = finite(options.playerZ, 'playerZ');
    const loadRadius = integer(options.loadRadius, 0, 16, 'loadRadius');
    const unloadRadius = integer(options.unloadRadius, loadRadius, 24, 'unloadRadius');
    const maxLoaded = integer(options.maxLoaded, 1, MAX_CELLS, 'maxLoaded');
    const originX = options.originX === undefined ? 0 : finite(options.originX, 'originX');
    const originZ = options.originZ === undefined ? 0 : finite(options.originZ, 'originZ');
    const loaded = options.loaded === undefined ? [] : options.loaded;
    if (!Array.isArray(loaded) || loaded.length > MAX_CELLS) throw new RangeError('loaded');
    const current = new Set();
    for (const entry of loaded) {
      if (typeof entry !== 'string' || !/^(0|[1-9]\d*):(0|[1-9]\d*)$/.test(entry)) throw new TypeError('loaded id');
      const [x, z] = entry.split(':').map(Number);
      if (!Number.isSafeInteger(x) || !Number.isSafeInteger(z) || x >= width || z >= height || current.has(entry)) throw new RangeError('loaded id');
      current.add(entry);
    }
    const cx = Math.max(0, Math.min(width - 1, Math.floor((px - originX) / cellSize)));
    const cz = Math.max(0, Math.min(height - 1, Math.floor((pz - originZ) / cellSize)));
    const candidates = [];
    const releases = [];
    for (let z = 0; z < height; z++) for (let x = 0; x < width; x++) {
      const key = id(x, z);
      const distance = Math.max(Math.abs(x - cx), Math.abs(z - cz));
      if (current.has(key)) {
        if (distance > unloadRadius) releases.push(key);
        else candidates.push({ key, distance, resident: true });
      } else if (distance <= loadRadius) candidates.push({ key, distance, resident: false });
    }
    candidates.sort((a, b) => a.distance - b.distance || Number(b.resident) - Number(a.resident) || a.key.localeCompare(b.key, 'en'));
    const selected = candidates.slice(0, maxLoaded);
    const retained = selected.filter(c => c.resident).map(c => c.key);
    const acquire = selected.filter(c => !c.resident).map(c => c.key);
    for (const c of candidates.slice(maxLoaded)) if (c.resident) releases.push(c.key);
    releases.sort();
    return Object.freeze({ center: Object.freeze({ x: cx, z: cz }), acquire: Object.freeze(acquire), release: Object.freeze(releases), retain: Object.freeze(retained), desired: Object.freeze(selected.map(c => c.key)) });
  }
  return Object.freeze({ plan });
});
