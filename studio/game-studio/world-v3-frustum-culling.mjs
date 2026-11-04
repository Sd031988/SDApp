// Opt-in CPU-side conservative AABB/frustum rejection for World-v3.
// Plane convention: ax + by + cz + d >= 0 is inside.
const finite = n => typeof n === 'number' && Number.isFinite(n);
function vec3(v, label) {
  if (!Array.isArray(v) || v.length !== 3 || !v.every(finite)) throw new TypeError(`${label} must be three finite numbers`);
  return v;
}
export function normalizeFrustumPlanes(planes) {
  if (!Array.isArray(planes) || planes.length !== 6) throw new TypeError('six planes required');
  return Object.freeze(planes.map((p) => {
    if (!Array.isArray(p) || p.length !== 4 || !p.every(finite)) throw new TypeError('invalid plane');
    const len = Math.hypot(p[0], p[1], p[2]);
    if (!(len > 1e-12)) throw new RangeError('degenerate plane');
    return Object.freeze(p.map(n => n / len));
  }));
}
export function aabbIntersectsFrustum(planes, min, max) {
  if (!Array.isArray(planes) || planes.length !== 6) throw new TypeError('six normalized planes required');
  vec3(min, 'min'); vec3(max, 'max');
  if (min.some((v, i) => v > max[i])) throw new RangeError('inverted bounds');
  for (const p of planes) {
    if (!Array.isArray(p) || p.length !== 4 || !p.every(finite)) throw new TypeError('invalid plane');
    const x = p[0] >= 0 ? max[0] : min[0];
    const y = p[1] >= 0 ? max[1] : min[1];
    const z = p[2] >= 0 ? max[2] : min[2];
    if (p[0]*x + p[1]*y + p[2]*z + p[3] < 0) return false;
  }
  return true;
}
export function filterVisibleCells(planes, cells, { maxCells = 256 } = {}) {
  if (!Number.isSafeInteger(maxCells) || maxCells < 1 || maxCells > 8192) throw new RangeError('invalid maxCells');
  if (!Array.isArray(cells) || cells.length > maxCells) throw new RangeError('cell budget exceeded');
  const visible = [];
  for (const cell of cells) {
    if (!cell || typeof cell.id !== 'string' || !/^[A-Za-z0-9_-]{1,80}$/.test(cell.id)) throw new TypeError('invalid cell id');
    if (aabbIntersectsFrustum(planes, cell.min, cell.max)) visible.push(cell.id);
  }
  return Object.freeze({ visible: Object.freeze(visible), tested: cells.length, culled: cells.length - visible.length });
}
