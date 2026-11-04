/** Opt-in bounded texture resource lifecycle for World-v3. No network, decoder or GPU calls are made here. */
export function createTextureResourceCache({load, dispose, maxEntries = 12} = {}) {
  if (typeof load !== 'function' || typeof dispose !== 'function') throw new TypeError('load and dispose callbacks required');
  if (!Number.isSafeInteger(maxEntries) || maxEntries < 1 || maxEntries > 256) throw new RangeError('Invalid cache capacity');
  const entries = new Map();
  const pending = new Map();
  let generation = 0;
  let closed = false;
  function keyOf(key) {
    if (typeof key !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9_.-]{0,127}$/.test(key) || key === '.' || key === '..')
      throw new TypeError('Expected local opaque asset identifier');
    return key;
  }
  function safeDispose(resource) { dispose(resource); }
  function evict() {
    while (entries.size > maxEntries) {
      const oldest = entries.keys().next().value;
      const resource = entries.get(oldest);
      entries.delete(oldest);
      safeDispose(resource);
    }
  }
  async function acquire(rawKey) {
    const key = keyOf(rawKey);
    if (closed) throw new Error('Cache closed');
    if (entries.has(key)) {
      const resource = entries.get(key);
      entries.delete(key); entries.set(key, resource);
      return resource;
    }
    if (pending.has(key)) return pending.get(key);
    const epoch = generation;
    const task = Promise.resolve().then(() => load(key)).then(resource => {
      if (resource == null) throw new Error('Loader returned no resource');
      if (closed || epoch !== generation) {
        safeDispose(resource);
        throw new Error('Asset load invalidated');
      }
      entries.set(key, resource);
      evict();
      return resource;
    }).finally(() => { if (pending.get(key) === task) pending.delete(key); });
    pending.set(key, task);
    return task;
  }
  function clear() {
    generation++;
    const values = [...entries.values()];
    entries.clear();
    for (const resource of values) safeDispose(resource);
  }
  function close() { if (!closed) { closed = true; clear(); } }
  function stats() { return Object.freeze({resident: entries.size, loading: pending.size, capacity: maxEntries, closed}); }
  return Object.freeze({acquire, clear, close, stats});
}
