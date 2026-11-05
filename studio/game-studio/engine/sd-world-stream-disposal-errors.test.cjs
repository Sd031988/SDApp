'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {create}=require('./sd-world-stream-runtime.js');
const plan=ids=>({desired:ids,acquire:ids,release:[]});
const tick=()=>new Promise(resolve=>setImmediate(resolve));

test('late resource disposal failure rejects reconcile instead of being silently swallowed',async()=>{
 let finish,started;
 const gate=new Promise(resolve=>finish=resolve);
 const begun=new Promise(resolve=>started=resolve);
 const runtime=create({
  load:async()=>{started();await gate;return {gpu:'resource'};},
  dispose:async()=>{throw Error('GPU dispose failed');}
 });
 const pending=runtime.reconcile(plan(['0:0']));
 await begun;
 const closing=runtime.close();
 finish();
 await assert.rejects(pending,/GPU dispose failed/);
 await closing;
 assert.equal(runtime.snapshot().closed,true);
 assert.deepEqual(runtime.snapshot().pending,[]);
});

test('ordinary loader failure reports error without leaking pending entries',async()=>{
 const errors=[];
 const runtime=create({
  load:async()=>{throw Error('bad cell');},
  dispose:async()=>{},
  onError:(error,id)=>errors.push([error.message,id])
 });
 await runtime.reconcile(plan(['0:0']));
 assert.deepEqual(errors,[['bad cell','0:0']]);
 assert.deepEqual(runtime.snapshot().pending,[]);
 await runtime.close();
});

test('observer exception does not replace loader error or strand cleanup',async()=>{
 const runtime=create({
  load:async()=>{throw Error('network');},
  dispose:async()=>{},
  onError:()=>{throw Error('observer');}
 });
 await runtime.reconcile(plan(['0:0']));
 assert.deepEqual(runtime.snapshot().pending,[]);
 await runtime.close();
});
