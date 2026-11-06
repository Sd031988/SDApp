'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),m=require('./nordhafen-ops-modes.js');
test('wanted rises to max three and fades after 30s without sight',()=>{
 let w={level:0,quiet:0};for(let i=0;i<5;i++)w=m.wanted(w,{shot:true});assert.equal(w.level,3);
 w=m.wanted(w,{visible:true,dt:60});assert.equal(w.level,3);
 w=m.wanted(w,{dt:30});assert.equal(w.level,2);
 w=m.wanted(w,{dt:60});assert.equal(w.level,0);
});
test('five unique city missions progress without affecting other tasks',()=>{
 const tasks=m.missions();assert.equal(tasks.length,5);assert.equal(new Set(tasks.map(x=>x.kind)).size,5);
 const next=m.nextMission(tasks,2);assert.equal(next.filter(x=>x.done).length,1);assert.equal(tasks[2].done,false);
});
test('zone shrinks monotonically across five phases and damages outside only',()=>{
 let prev=Infinity;for(let t=0;t<=260;t+=5){const z=m.zone(t);assert.ok(z.radius<=prev);prev=z.radius;}
 assert.equal(m.zone(0).phase,1);assert.equal(m.zone(400).phase,5);
 const z=m.zone(200);assert.equal(m.zoneDamage({x:256,z:256},z,1),0);
 assert.equal(m.zoneDamage({x:500,z:500},z,2),10);
});
test('royale win requires exactly one living survivor',()=>{
 const p=[{id:1,alive:true},{id:2,alive:true},{id:3,alive:false}];
 assert.deepEqual(m.royaleResult(p),{remaining:2,winner:null,finished:false});
 assert.deepEqual(m.royaleResult([{...p[0]},{...p[1],alive:false},p[2]]),{remaining:1,winner:1,finished:true});
});
test('seeded loot is repeatable and changes with different seeds',()=>{
 const a=m.loot(123,40);assert.deepEqual(a,m.loot(123,40));assert.notDeepEqual(a,m.loot(124,40));
 assert.ok(a.every(x=>x.x>=0&&x.x<512&&x.z>=0&&x.z<512));
});
test('entering/exiting vehicle switches control mode',()=>{
 let v={near:true,driving:false,controls:'on-foot'};
 v=m.vehicle(v,'enter');assert.equal(v.controls,'vehicle');
 v=m.vehicle(v,'exit');assert.equal(v.controls,'on-foot');
 assert.equal(m.vehicle({...v,near:false},'enter').driving,false);
});
test('difficulty defaults to normal for invalid input',()=>{assert.equal(m.difficulty('hard'),'hard');assert.equal(m.difficulty('bogus'),'normal');});
