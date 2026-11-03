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
test('failed loads do not retry on repeated identical visibility updates',async()=>{
let calls=0;
const s=create({load:()=>{calls++;return Promise.reject(Error('missing'));}});
s.setVisible(['0:0']);await tick();await tick();
assert.equal(calls,1);
for(let i=0;i<10;i++)s.setVisible(['0:0']);
await tick();await tick();
assert.equal(calls,1,'per-frame updates must not trigger repeated failed loads');
s.setVisible([]);
s.setVisible(['0:0']);await tick();await tick();
assert.equal(calls,2,'removing then re-entering a cell allows a retry');
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

test('cancelled load rejection must not poison a later visibility request',async()=>{
const tasks=[];
const s=create({maxConcurrent:1,load:(key,signal)=>new Promise((resolve,reject)=>tasks.push({key,signal,resolve,reject}))});
s.setVisible(['0:0']);await tick();
s.setVisible([]);assert.equal(tasks[0].signal.aborted,true);
s.setVisible(['0:0']);
tasks[0].reject(Error('cancelled'));
await tick();await tick();
assert.equal(tasks.length,2,'new visible request must retry after cancelled failure');
tasks[1].resolve('loaded');await tick();await tick();
assert.equal(s.get('0:0'),'loaded');
s.close();
});

test('snapshot exposes failed and aborted in-flight cells without changing scheduling',async()=>{
const tasks=[];
const s=create({maxConcurrent:2,load:(key,signal)=>new Promise((resolve,reject)=>tasks.push({key,signal,resolve,reject}))});
s.setVisible(['0:0','0:1']);await tick();
s.setVisible(['0:1','1:1']);
assert.deepEqual(s.snapshot().abortedPending,['0:0']);
assert.deepEqual(s.snapshot().failed,[]);
assert.deepEqual(s.snapshot().pending,['0:0','0:1']);
tasks.find(t=>t.key==='0:0').reject(Error('aborted'));
tasks.find(t=>t.key==='0:1').reject(Error('missing'));
await tick();await tick();
assert.deepEqual(s.snapshot().abortedPending,[]);
assert.deepEqual(s.snapshot().failed,['0:1']);
assert.equal(tasks.filter(t=>t.key==='1:1').length,1);
tasks.find(t=>t.key==='1:1').resolve('ok');await tick();await tick();
assert.equal(s.get('1:1'),'ok');
s.close();
});

test('empty loader results fail closed without caching phantom chunks or spinning',async()=>{
for(const empty of [undefined,null]){
let calls=0;
const s=create({load:()=>{calls++;return Promise.resolve(empty);}});
s.setVisible(['0:0']);
await tick();await tick();
assert.equal(s.get('0:0'),undefined);
assert.deepEqual(s.snapshot().resident,[]);
assert.deepEqual(s.snapshot().failed,['0:0']);
assert.equal(calls,1);
await tick();
assert.equal(calls,1,'empty result must not cause infinite retry');
s.setVisible(['0:0']);
await tick();await tick();
assert.equal(calls,1,'identical visibility update must not retry');
s.setVisible([]);s.setVisible(['0:0']);
await tick();await tick();
assert.equal(calls,2,'re-entering the cell may retry');
s.close();
}
});


test('same-turn cancellation never invokes stale loader or disposes a nonexistent resource',async()=>{
const loaded=[],disposed=[];
const s=create({load:key=>{loaded.push(key);return Promise.resolve({key});},dispose:(key,value)=>disposed.push([key,value])});
s.setVisible(['0:0']);
s.setVisible(['0:1']);
await tick();await tick();
assert.deepEqual(loaded,['0:1']);
assert.deepEqual(disposed,[]);
assert.deepEqual(s.get('0:1'),{key:'0:1'});
s.close();
assert.deepEqual(disposed,[['0:1',{key:'0:1'}]]);
});

test('closing before queued load starts does not invoke loader',async()=>{
let calls=0;
const s=create({load:()=>{calls++;return Promise.resolve('resource');}});
s.setVisible(['0:0']);s.close();
await tick();await tick();
assert.equal(calls,0);
assert.deepEqual(s.snapshot().resident,[]);
});

test('aborted nonsettling loader reports blocked capacity without oversubscribing',async()=>{
const calls=[];
const s=create({maxConcurrent:1,maxResident:2,load:(key,signal)=>new Promise(resolve=>calls.push({key,signal,resolve}))});
s.setVisible(['0:0']);await tick();
s.setVisible(['0:1']);await tick();
assert.equal(calls.length,1,'do not start a second physical load while the first is hung');
assert.equal(calls[0].signal.aborted,true);
assert.equal(s.snapshot().blockedSlots,1);
assert.equal(s.snapshot().availableSlots,0);
calls[0].resolve('stale');await tick();await tick();
assert.equal(s.snapshot().blockedSlots,0);
assert.equal(calls.length,2,'capacity is restored after cancelled promise settles');
calls[1].resolve('active');await tick();await tick();
assert.equal(s.get('0:1'),'active');
s.close();
});
