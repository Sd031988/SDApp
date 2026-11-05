'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {create}=require('./sd-world-stream-controller.js');
const options={width:4,height:1,cellSize:10,loadRadius:0,unloadRadius:0,maxLoaded:1};
test('moves across cells, loads and disposes exactly once',async()=>{
 const loads=[],disposals=[];
 const c=create({...options,load:async id=>(loads.push(id),{id}),dispose:async(value,id)=>disposals.push(id)});
 assert.deepEqual((await c.move(1,1)).loaded,['0:0']);
 assert.deepEqual((await c.move(11,1)).loaded,['1:0']);
 assert.deepEqual((await c.move(11,1)).loaded,['1:0']);
 assert.deepEqual(loads,['0:0','1:0']);assert.deepEqual(disposals,['0:0']);
 await c.close();assert.deepEqual(disposals,['0:0','1:0']);
});
test('queued moves calculate residency after earlier move settles',async()=>{
 const loads=[];const c=create({...options,load:async id=>(loads.push(id),id),dispose:async()=>{}});
 const a=c.move(1,1),b=c.move(21,1);await Promise.all([a,b]);
 assert.deepEqual(loads,['0:0','2:0']);assert.deepEqual(c.snapshot().loaded,['2:0']);await c.close();
});
test('close is idempotent and rejects later moves',async()=>{
 const c=create({...options,load:async id=>id,dispose:async()=>{}});
 await c.move(1,1);const p=c.close();assert.equal(c.close(),p);await p;
 await assert.rejects(c.move(1,1),/closed/);
});
test('invalid player coordinate is rejected without breaking subsequent moves',async()=>{
 const c=create({...options,load:async id=>id,dispose:async()=>{}});
 await assert.rejects(c.move(NaN,0),/playerX/);
 assert.deepEqual((await c.move(1,1)).loaded,['0:0']);await c.close();
});
