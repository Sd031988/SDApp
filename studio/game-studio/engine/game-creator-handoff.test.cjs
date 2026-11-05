const test=require('node:test');
const assert=require('node:assert/strict');
const {compile,validate}=require('./game-creator-blueprint.js');
const {prepare}=require('./game-creator-handoff.js');
test('handoff is dry-run only and never grants apply permission',()=>{
 const plan=compile('Stadt mit Autos und Gegnern');
 const snapshot=JSON.stringify(plan);
 const handoff=prepare(plan,validate);
 assert.equal(handoff.mode,'dry-run');
 assert.equal(handoff.target,'new-scene-only');
 assert.equal(handoff.canApply,false);
 assert.equal(handoff.requiresReview,true);
 assert.equal(JSON.stringify(plan),snapshot);
 assert.equal(handoff.placeholders.length,plan.objects.length);
});
test('handoff does not expose mutable object arrays',()=>{
 const handoff=prepare(compile('wald'),validate);
 assert.ok(Object.isFrozen(handoff));
 assert.ok(Object.isFrozen(handoff.placeholders));
 assert.ok(Object.isFrozen(handoff.placeholders[0]));
});
test('rejects invalid plans and premature asset assignment',()=>{
 const plan=compile('autos');
 plan.objects[1].asset='assets/car.glb';
 assert.throws(()=>prepare(plan,validate),TypeError);
 assert.throws(()=>prepare(null,validate),TypeError);
});
