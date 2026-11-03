'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {create}=require('../../studio/game-studio/chunk-scheduler.js');
const tick=()=>new Promise(resolve=>setTimeout(resolve,0));
test('bounded concurrent loads, cancellation, disposal and close',async()=>{
const tasks=[],disposed=[];
const scheduler=create({maxConcurrent:2,maxResident:2,
load:(key,signal)=>new Promise(resolve=>tasks.push({key,signal,resolve})),
dispose:(key,value)=>disposed.push([key,value])});
scheduler.setVisible(['0:0','0:1']);
await tick();
assert.equal(tasks.length,2);
scheduler.setVisible(['0:1','1:1']);
assert.equal(tasks[0].signal.aborted,true);
tasks[0].resolve('obsolete');
tasks[1].resolve('kept');
await tick();await tick();
assert.ok(disposed.some(([key])=>key==='0:0'));
assert.ok(tasks.some(t=>t.key==='1:1'));
tasks.find(t=>t.key==='1:1').resolve('new');
await tick();
assert.deepEqual(new Set(scheduler.snapshot().resident),new Set(['0:1','1:1']));
scheduler.close();
assert.equal(scheduler.snapshot().resident.length,0);
assert.equal(disposed.length,3);
});
test('invalid budgets and IDs do not mutate scheduler',()=>{
assert.throws(()=>create({load:()=>{},maxConcurrent:0}),RangeError);
const s=create({load:()=>Promise.resolve(1),maxResident:1});
assert.throws(()=>s.setVisible(['0:0','1:1']),RangeError);
assert.throws(()=>s.setVisible(['__proto__']),TypeError);
assert.deepEqual(s.snapshot().desired,[]);
s.close();
assert.throws(()=>s.setVisible([]),/closed/);
});
test('failed loads do not retry endlessly until a new visibility request',async()=>{
let calls=0;
const s=create({load:()=>{calls++;return Promise.reject(Error('missing'));}});
s.setVisible(['0:0']);await tick();await tick();
assert.equal(calls,1);
s.setVisible(['0:0']);await tick();await tick();
assert.equal(calls,2);
s.close();
});
test('late completions after close are disposed',async()=>{
let resolve;const disposed=[];
const s=create({load:()=>new Promise(r=>{resolve=r;}),dispose:(k,v)=>disposed.push([k,v])});
s.setVisible(['0:0']);await tick();s.close();resolve('gpu-resource');await tick();
assert.deepEqual(disposed,[['0:0','gpu-resource']]);
});

test('resident resources are accessible only while loaded and visible',async()=>{
const s=create({load:key=>Promise.resolve({key}),maxResident:1});
assert.equal(s.get('0:0'),undefined);
s.setVisible(['0:0']);await tick();await tick();
assert.deepEqual(s.get('0:0'),{key:'0:0'});
s.setVisible(['0:1']);
assert.equal(s.get('0:0'),undefined);
await tick();await tick();
assert.deepEqual(s.get('0:1'),{key:'0:1'});
s.close();
assert.equal(s.get('0:1'),undefined);
});
