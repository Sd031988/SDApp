const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('../scene-core.js');
const {compile,validate}=require('./game-creator-blueprint.js');
const {prepare}=require('./game-creator-handoff.js');
const {preview}=require('./game-creator-editor-compat.js');
test('creates valid new v1 preview without editing existing scene',()=>{
 const original=core.fresh(),before=core.serialize(original);
 const p=preview(prepare(compile('Stadt Wald Autos Gegner'),validate),core);
 assert.equal(p.mode,'dry-run');assert.equal(p.canApply,false);
 assert.equal(core.serialize(original),before);
 assert.equal(core.validate(p.scene).version,1);
 assert.ok(p.placed>0);assert.ok(p.skipped.vehicle>0);
 assert.ok(p.skipped.enemy>0);
});
test('rejects unsupported editor versions and unreviewed handoffs',()=>{
 const h=prepare(compile('Stadt'),validate);
 assert.throws(()=>preview({...h,canApply:true},core),TypeError);
 assert.throws(()=>preview(h,{...core,VERSION:2}),TypeError);
});
test('caps primitive count at 60, leaves unsupported objects explicit',()=>{
 const p=preview(prepare(compile('Stadt Wald Straßen'),validate),core);
 assert.ok(p.placed<=60);
 assert.ok(p.scene.objects.length<=core.LIMIT);
 assert.ok(p.scene.objects.every(o=>core.KINDS.includes(o.type)));
});
