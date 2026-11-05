'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {create}=require('./sd-world-stream-runtime.js');
const p=desired=>({desired,acquire:desired,release:[]});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
test('overlapping reconciles serialize and release previous resources',async()=>{
 const freed=[],r=create({load:async id=>{await delay(4);return id},dispose:async value=>freed.push(value)});
 const a=r.reconcile(p(['0:0','1:0'])),b=r.reconcile(p(['2:0']));
 await Promise.all([a,b]);assert.deepEqual(r.snapshot().loaded,['2:0']);assert.deepEqual(freed,['0:0','1:0']);await r.close();assert.deepEqual(freed,['0:0','1:0','2:0']);
});
test('close waits for slow loader and disposes late result',async()=>{
 let finish;const gate=new Promise(resolve=>finish=resolve),freed=[];
 const r=create({load:async()=>{await gate;return {id:1}},dispose:async value=>freed.push(value)});
 const run=r.reconcile(p(['0:0']));await delay(0);const done=r.close();
 assert.equal(r.snapshot().closed,true);finish();await Promise.all([run,done]);assert.equal(freed.length,1);assert.deepEqual(r.snapshot().loaded,[]);
});
test('close is idempotent, rejects queued reconcile',async()=>{
 let finish;const gate=new Promise(resolve=>finish=resolve);
 const r=create({load:async()=>{await gate;return 1},dispose:async()=>{}});
 const a=r.reconcile(p(['0:0']));await delay(0);const b=r.reconcile(p(['1:0']));const c=r.close();assert.equal(c,r.close());finish();await a;await assert.rejects(b,/closed/);await c;
});
test('error callback cannot strand a pending resource',async()=>{
 const r=create({load:async()=>{throw Error('load')},dispose:async()=>{},onError:()=>{throw Error('observer')}});
 await r.reconcile(p(['0:0']));assert.deepEqual(r.snapshot().pending,[]);await r.close();
});
test('dispose failures propagate while other disposals run',async()=>{
 const freed=[];const r=create({load:async id=>id,dispose:async(v)=>{freed.push(v);if(v==='0:0')throw Error('dispose')}});
 await r.reconcile(p(['0:0','1:0']));await assert.rejects(r.close(),/dispose/);assert.deepEqual(freed,['0:0','1:0']);
});
