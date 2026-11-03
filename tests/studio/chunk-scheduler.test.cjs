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

test('v3 world cell IDs support negative coordinates and reject out-of-range keys',async()=>{
const loaded=[];
const s=create({maxResident:3,load:key=>{loaded.push(key);return Promise.resolve(key);}});
s.setVisible(['cell:-1:0','cell:25001:-25001','0:0']);
await tick();await tick();await tick();
assert.deepEqual(new Set(loaded),new Set(['cell:-1:0','cell:25001:-25001','0:0']));
for(const bad of ['cell:25002:0','cell:-25002:0','cell:1.5:0','cell:1:Infinity','cell:01:0','cell:1:-0','cell:1:0/../x','cell:1:0\\n','cell:1:0:1']){
assert.throws(()=>s.setVisible([bad]),TypeError,bad);
}
assert.equal(s.snapshot().desired.length,3,'invalid IDs must not change visibility');
s.close();
});

test('explicit retry recovers transient failure without frame-loop retry storms',async()=>{
let calls=0;
const s=create({maxConcurrent:1,load:()=>++calls===1?Promise.reject(Error('temporary')):Promise.resolve('recovered')});
s.setVisible(['cell:-1:0']);await tick();await tick();
assert.deepEqual(s.snapshot().failed,['cell:-1:0']);
for(let i=0;i<5;i++)s.setVisible(['cell:-1:0']);
await tick();assert.equal(calls,1);
assert.equal(s.retryFailed('cell:-1:0'),true);
await tick();await tick();
assert.equal(calls,2);
assert.equal(s.get('cell:-1:0'),'recovered');
assert.equal(s.retryFailed('cell:-1:0'),false);
assert.equal(s.retryFailed('0:0'),false);
assert.throws(()=>s.retryFailed('__proto__'),TypeError);
assert.equal(s.snapshot().desired.length,1);
s.close();
assert.throws(()=>s.retryFailed('cell:-1:0'),/closed/);
});

test('permanently hung cancelled loader stays bounded and close is nonblocking',async()=>{
const started=[],disposed=[];
const scheduler=create({maxConcurrent:1,maxResident:2,
load:(key,signal)=>new Promise(()=>{started.push({key,signal});}),
dispose:(key,value)=>disposed.push([key,value])});
scheduler.setVisible(['cell:0:0']);
await tick();
assert.equal(started.length,1);
scheduler.setVisible(['cell:1:0']);
await tick();
for(let i=0;i<12;i++)scheduler.setVisible(['cell:1:0']);
await tick();
assert.equal(started.length,1,'never oversubscribe a physically hung loader');
assert.equal(started[0].signal.aborted,true);
assert.deepEqual(scheduler.snapshot().desired,['cell:1:0']);
assert.deepEqual(scheduler.snapshot().abortedPending,['cell:0:0']);
assert.equal(scheduler.snapshot().blockedSlots,1);
assert.equal(scheduler.snapshot().availableSlots,0);
scheduler.close();
assert.equal(scheduler.snapshot().closed,true);
assert.equal(scheduler.snapshot().availableSlots,0,'closing cannot reclaim a never-settled physical load');
assert.deepEqual(disposed,[],'no phantom resource may be disposed');
// Intentionally do not resolve the loader: this test documents fail-closed
// starvation until the loader cooperates; no timer or retry may bypass the cap.
});


test('reselected cell ignores stale cancelled completion and loads a fresh resource',async()=>{
const loads=[],disposed=[];
const s=create({maxConcurrent:1,load:(key,signal)=>new Promise(resolve=>loads.push({key,signal,resolve})),dispose:(key,value)=>disposed.push([key,value])});
s.setVisible(['cell:-2:3']);await tick();
s.setVisible([]);
s.setVisible(['cell:-2:3']);
assert.equal(loads[0].signal.aborted,true);
loads[0].resolve('obsolete-resource');
await tick();await tick();
assert.deepEqual(disposed,[['cell:-2:3','obsolete-resource']]);
assert.equal(loads.length,2,'reselection starts a new physical load only after stale completion');
assert.equal(s.get('cell:-2:3'),undefined);
loads[1].resolve('fresh-resource');await tick();await tick();
assert.equal(s.get('cell:-2:3'),'fresh-resource');
s.close();
assert.deepEqual(disposed,[['cell:-2:3','obsolete-resource'],['cell:-2:3','fresh-resource']]);
});
