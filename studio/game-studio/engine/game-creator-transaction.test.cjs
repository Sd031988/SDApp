const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('../scene-core.js');
const {compile,validate}=require('./game-creator-blueprint.js');
const {prepare}=require('./game-creator-handoff.js');
const {preview}=require('./game-creator-editor-compat.js');
const {propose}=require('./game-creator-transaction.js');
function make(){
 const original=core.fresh();
 const planned=preview(prepare(compile('Stadt Wald'),validate),core);
 return {original,planned};
}
test('explicit confirm, undo and redo preserve original scene',()=>{
 const {original,planned}=make(),originalJSON=core.serialize(original);
 const tx=propose(original,planned,core);
 assert.equal(tx.state,'proposed');
 assert.equal(core.serialize(original),originalJSON);
 assert.throws(()=>tx.undo(),/Nothing to undo/);
 const created=tx.confirmNewScene();
 assert.equal(tx.state,'confirmed');
 assert.equal(core.serialize(created),core.serialize(planned.scene));
 assert.equal(core.serialize(tx.undo()),originalJSON);
 assert.equal(tx.state,'undone');
 assert.equal(core.serialize(tx.redo()),core.serialize(planned.scene));
 assert.equal(core.serialize(original),originalJSON);
 assert.throws(()=>tx.confirmNewScene(),/already handled/);
});
test('cancel does not mutate any caller-owned scene',()=>{
 const {original,planned}=make(),before=core.serialize(original);
 const tx=propose(original,planned,core);
 assert.equal(core.serialize(tx.cancel()),before);
 assert.equal(tx.state,'cancelled');
 assert.throws(()=>tx.confirmNewScene(),/already handled/);
});
test('rejects unsafe previews and prevents caller mutation through snapshots',()=>{
 const {original,planned}=make();
 assert.throws(()=>propose(original,{...planned,canApply:true},core),TypeError);
 const tx=propose(original,planned,core);
 tx.proposed.name='tampered';
 assert.notEqual(tx.proposed.name,'tampered');
});
