'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const ui=require('../../studio/game-studio/workspace-layout.js');
test('Professioneller Level-Editor öffnet eine Fokusansicht, ohne Panelzustand zu verlieren',()=>{
const s=ui.createState();
assert.deepEqual(s.read(),{assets:true,inspector:true,focus:false});
s.dispatch('assets');
assert.deepEqual(s.read(),{assets:false,inspector:true,focus:false});
s.dispatch('focus');
assert.deepEqual(s.read(),{assets:false,inspector:true,focus:true});
s.dispatch('exit');
assert.deepEqual(s.read(),{assets:false,inspector:true,focus:false});
s.dispatch('inspector');
assert.deepEqual(s.read(),{assets:false,inspector:false,focus:false});
s.dispatch('restore');
assert.deepEqual(s.read(),{assets:true,inspector:true,focus:false});
});
test('Editorstatus ist nicht global und wird nicht im Projekt gespeichert',()=>{
const one=ui.createState(),two=ui.createState();
one.dispatch('focus');
assert.equal(one.read().focus,true);
assert.equal(two.read().focus,false);
assert.throws(()=>one.dispatch('unknown'),/Unbekannte/);
assert.deepEqual(two.read(),{assets:true,inspector:true,focus:false});
});
