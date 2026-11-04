import test from 'node:test';
import assert from 'node:assert/strict';
import {validateSceneHierarchy} from '../world-v3-hierarchy.mjs';
test('parent-first ordering even with child first',()=>{
 const r=validateSceneHierarchy([{id:'child',parentId:'root'},{id:'root'}]);
 assert.deepEqual(r.nodes.map(n=>n.id),['root','child']); assert.deepEqual(r.roots,['root']);
});
test('reject cycles and missing parents',()=>{
 assert.throws(()=>validateSceneHierarchy([{id:'a',parentId:'b'},{id:'b',parentId:'a'}]),/cycle/);
 assert.throws(()=>validateSceneHierarchy([{id:'a',parentId:'missing'}]),/missing/);
});
test('reject duplicates and unsafe ids',()=>{
 assert.throws(()=>validateSceneHierarchy([{id:'a'},{id:'a'}]),TypeError);
 assert.throws(()=>validateSceneHierarchy([{id:'../x'}]),TypeError);
});
test('validate transforms and node budgets',()=>{
 assert.throws(()=>validateSceneHierarchy([{id:'a',translation:[Infinity,0,0]}]),TypeError);
 assert.throws(()=>validateSceneHierarchy([{id:'a',rotation:[0,0,0,0]}]),RangeError);
 assert.throws(()=>validateSceneHierarchy([{id:'a',scale:[1,0,1]}]),RangeError);
 assert.throws(()=>validateSceneHierarchy([{id:'a'},{id:'b'}],{maxNodes:1}),RangeError);
});
test('does not mutate inputs and freezes output',()=>{
 const a={id:'a',translation:[1,2,3]}; const result=validateSceneHierarchy([a]);
 a.translation[0]=99; assert.equal(result.nodes[0].translation[0],1);
 assert.ok(Object.isFrozen(result.nodes[0])); assert.ok(Object.isFrozen(result.nodes[0].translation));
});
test('empty forest is valid',()=>assert.deepEqual(validateSceneHierarchy([]).roots,[]));
test('8192-node reverse-ordered chain validates without call-stack overflow',()=>{
 const input=Array.from({length:8192},(_,i)=>({id:`n${8191-i}`,parentId:i===8191?null:`n${8190-i}`}));
 const result=validateSceneHierarchy(input);
 assert.equal(result.nodes.length,8192);
 assert.equal(result.nodes[0].id,'n0');
 assert.equal(result.nodes.at(-1).id,'n8191');
 assert.deepEqual(result.roots,['n0']);
});
test('deep cycle is rejected with domain error, not stack overflow',()=>{
 const input=Array.from({length:8192},(_,i)=>({id:`n${i}`,parentId:`n${(i+1)%8192}`}));
 assert.throws(()=>validateSceneHierarchy(input),error=>error instanceof RangeError && /hierarchy cycle/.test(error.message));
});
