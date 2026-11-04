const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('../large-world-core.js');
const deltas=require('../world-v3-cell-deltas.js');
function fixture(){
 const original=core.generate(31,1),changed=core.parse(core.serialize(original));
 core.shift(changed,changed.cells[0].objects[0].id,-235,-275);
 return {original,changed};
}
test('cell delta roundtrip is reversible, preserves IDs and does not mutate original',()=>{
 const {original,changed}=fixture(),before=core.serialize(original);
 const patch=deltas.decode(deltas.encode(deltas.diff(original,changed)));
 assert.deepEqual(deltas.apply(original,patch),changed);
 assert.equal(core.serialize(original),before);
 assert.deepEqual(deltas.apply(changed,deltas.diff(changed,original)),original);
});
test('stale preconditions reject atomically',()=>{
 const {original,changed}=fixture(),patch=deltas.diff(original,changed);
 const stale=core.parse(core.serialize(original));
 stale.cells[0].ground=stale.cells[0].ground==='snow'?'sand':'snow';
 const before=core.serialize(stale);
 assert.throws(()=>deltas.apply(stale,patch));
 assert.equal(core.serialize(stale),before);
});
test('reject version mismatch, duplicate cell, unknown fields and oversized JSON',()=>{
 const {original,changed}=fixture(),p=deltas.diff(original,changed),c=p.changes[0];
 for(const bad of [{...p,deltaVersion:2},{...p,changes:[c,c]},{...p,unknown:true}]){
  assert.throws(()=>deltas.apply(original,bad));
 }
 assert.throws(()=>deltas.decode('x'.repeat(deltas.MAX_BYTES+1)));
 assert.throws(()=>deltas.decode('{"deltaVersion":1,"worldVersion":3,"changes":[],"__proto__":{}}'));
});
test('global duplicate IDs cannot be introduced through a patch',()=>{
 const {original,changed}=fixture(),p=deltas.diff(original,changed);
 const c=p.changes.find(x=>x.after&&x.after.objects.length);
 c.after.objects.push({...c.after.objects[0],id:original.cells[2].objects[0].id});
 assert.throws(()=>deltas.apply(original,p));
});
