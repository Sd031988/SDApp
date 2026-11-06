'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),c=require('./nordhafen-ops-campaign.js');
const advance=(s,seconds,props)=>{for(let i=0;i<seconds*10;i++)s=c.step(s,{dt:.1,...props});return s;};
test('range can be skipped but no data or extraction before towers',()=>{
 let s=c.initial();assert.equal(c.objective(s),'Schießstand (optional)');
 s=advance(s,25,{atExtraction:true,atData:true,onTopFloor:true,holding:true});assert.equal(s.phase,'range');
 s=c.step(s,{skipRange:true});assert.equal(s.phase,'towers');
 s=advance(s,25,{atExtraction:true,atData:true,onTopFloor:true,holding:true});assert.deepEqual(s.towers,[false,false,false]);
});
test('three masts require holding three seconds, damage cancels',()=>{
 let s=c.step(c.initial(),{skipRange:true});
 s=advance(s,2,{atTower:true,holding:true});assert.equal(s.towers[0],false);
 s=c.step(s,{dt:.1,atTower:true,holding:true,damage:true});assert.equal(s.towerProgress,0);
 s=advance(s,3,{atTower:true,holding:true});assert.equal(s.towers[0],true);
 s=advance(s,3,{atTower:true,holding:true});s=advance(s,3,{atTower:true,holding:true});
 assert.deepEqual(s.towers,[true,true,true]);assert.equal(s.phase,'data');
});
test('data requires top floor and three-second interaction before extraction',()=>{
 let s={...c.initial(),phase:'data',towers:[true,true,true]};
 s=advance(s,10,{atData:true,holding:true});assert.equal(s.dataCollected,false);
 s=advance(s,3,{atData:true,onTopFloor:true,holding:true});assert.equal(s.dataCollected,true);assert.equal(s.phase,'extract');
 s=advance(s,19,{atExtraction:true});assert.equal(s.status,'playing');
 s=advance(s,1,{atExtraction:true});assert.equal(s.status,'won');
});
test('leaving extraction resets countdown and death overrides victory',()=>{
 let s={...c.initial(),phase:'extract',towers:[true,true,true],dataCollected:true};
 s=advance(s,19,{atExtraction:true});s=c.step(s,{dt:.1,atExtraction:false});assert.equal(s.extractProgress,0);
 s=advance(s,19,{atExtraction:true});s=c.step(s,{dt:.1,atExtraction:true,health:0});assert.equal(s.status,'lost');
 assert.equal(c.step(s,{dt:10,atExtraction:true}).status,'lost');
});
test('objective target follows sequence',()=>{
 const sites={towers:[{x:1},{x:2},{x:3}],data:{x:4},extraction:{x:5}};
 let s={...c.initial(),phase:'towers'};assert.deepEqual(c.target(s,sites),{x:1});
 s={...s,towers:[true,true,true],phase:'data'};assert.deepEqual(c.target(s,sites),{x:4});
 s={...s,phase:'extract'};assert.deepEqual(c.target(s,sites),{x:5});
});
