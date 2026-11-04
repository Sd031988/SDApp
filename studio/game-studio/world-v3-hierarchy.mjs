/** Pure, opt-in World-v3 scene hierarchy validation. Never mutates projects. */
const ID = /^[A-Za-z0-9_-]{1,80}$/;
const MAX_NODES = 8192;
const finite = value => typeof value === 'number' && Number.isFinite(value);
function checkVector(v, count, label) {
  if (!Array.isArray(v) || v.length !== count || !v.every(finite)) throw new TypeError(`invalid ${label}`);
  return Object.freeze([...v]);
}
/** Validate a forest and return immutable parent-first nodes and stable IDs. */
export function validateSceneHierarchy(input, {maxNodes = MAX_NODES} = {}) {
  if (!Number.isSafeInteger(maxNodes) || maxNodes < 1 || maxNodes > MAX_NODES) throw new RangeError('invalid node budget');
  if (!Array.isArray(input) || input.length > maxNodes) throw new RangeError('node budget exceeded');
  const nodes = new Map();
  for (const entry of input) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) throw new TypeError('invalid node');
    const {id, parentId = null, translation = [0,0,0], rotation = [0,0,0,1], scale = [1,1,1]} = entry;
    if (typeof id !== 'string' || !ID.test(id) || nodes.has(id)) throw new TypeError('invalid or duplicate node id');
    if (parentId !== null && (typeof parentId !== 'string' || !ID.test(parentId) || parentId === id)) throw new TypeError('invalid parent');
    const t = checkVector(translation, 3, 'translation');
    const r = checkVector(rotation, 4, 'rotation');
    const s = checkVector(scale, 3, 'scale');
    if (s.some(n => n === 0)) throw new RangeError('zero scale');
    if (Math.hypot(...r) < 1e-12) throw new RangeError('zero quaternion');
    nodes.set(id, Object.freeze({id, parentId, translation:t, rotation:r, scale:s}));
  }
  const order = [], state = new Map();
  function visit(id) {
    if (state.get(id) === 1) throw new RangeError('hierarchy cycle');
    if (state.get(id) === 2) return;
    const node = nodes.get(id);
    if (!node) throw new RangeError('missing parent');
    state.set(id,1);
    if (node.parentId !== null) visit(node.parentId);
    state.set(id,2); order.push(node);
  }
  for (const id of nodes.keys()) visit(id);
  return Object.freeze({version:1, nodes:Object.freeze(order), roots:Object.freeze(order.filter(n=>n.parentId===null).map(n=>n.id))});
}
