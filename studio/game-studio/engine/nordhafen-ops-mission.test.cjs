'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),mission=require('./nordhafen-ops-mission.js');
const sites=mission.locations({x:256,z:256},512);
const at=i=>({x:sites.towers[i].x,z:sites.towers[i].z});
test('three masts separated by >=60m, near street grid',()=>{
 assert.equal(sites.towers.length,3);
 for(let i=0;i<3;i++)for(let j=i+1;j<3;j++)assert.ok(mission.distance(sites.towers[i],sites.towers[j])>=60);
 assert.ok(sites.towers.every(t=>t.x%64===0&&t.z%64===0));
});
test('activation requires E hold for three seconds inside range',()=>{
 let s=mission.initial();
 s=mission.step(s,{dt:5,position:{x:0,z:0},locations:sites,holding:true});assert.equal(s.completed[0],false);
 s=mission.step(s,{dt:2.9,position:at(0),locations:sites,holding:true});assert.equal(s.completed[0],false);
 s=mission.step(s,{dt:.1,position:at(0),locations:sites,holding:true});assert.equal(s.completed[0],true);
 assert.equal(s.activated,0);
});
test('damage or release aborts activation, progress must restart',()=>{
 let s=mission.step(mission.initial(),{dt:2,position:at(0),locations:sites,holding:true});
 s=mission.step(s,{dt:.1,position:at(0),locations:sites,holding:true,damage:true});assert.equal(s.progress,0);
 s=mission.step(s,{dt:2,position:at(0),locations:sites,holding:true});assert.equal(s.completed[0],false);
 s=mission.step(s,{dt:.1,position:at(0),locations:sites,holding:false});assert.equal(s.progress,0);
});
test('activation alerts exactly two nearest living enemies',()=>{
 const enemies=[{x:sites.towers[0].x+5,z:sites.towers[0].z,health:50,state:'patrol'},
 {x:sites.towers[0].x+10,z:sites.towers[0].z,health:50,state:'patrol'},
 {x:sites.towers[0].x+12,z:sites.towers[0].z,health:0,state:'dead'},
 {x:sites.towers[0].x+100,z:sites.towers[0].z,health:50,state:'patrol'}];
 const alerted=mission.alertNearby(enemies,sites.towers[0]);
 assert.deepEqual(alerted.map(e=>e.state),['alert','alert','dead','patrol']);
});
test('victory requires three masts and ten seconds in extraction, death wins ties',()=>{
 let s=mission.initial();
 s=mission.step(s,{dt:30,position:sites.extraction,locations:sites});assert.equal(s.status,'playing');
 for(let i=0;i<3;i++){s=mission.step(s,{dt:3,position:at(i),locations:sites,holding:true});assert.equal(s.completed[i],true);}
 s=mission.step(s,{dt:9.9,position:sites.extraction,locations:sites});assert.equal(s.status,'playing');
 s=mission.step(s,{dt:.1,position:sites.extraction,locations:sites});assert.equal(s.status,'won');
 let dead={...s,status:'playing',extractProgress:9.9};
 dead=mission.step(dead,{dt:1,position:sites.extraction,locations:sites,health:0});
 assert.equal(dead.status,'lost');
});
test('leaving extraction or taking damage resets countdown',()=>{
 let s={...mission.initial(),completed:[true,true,true]};
 s=mission.step(s,{dt:7,position:sites.extraction,locations:sites});assert.equal(s.extractProgress,7);
 s=mission.step(s,{dt:1,position:sites.extraction,locations:sites,damage:true});assert.equal(s.extractProgress,0);
 s=mission.step(s,{dt:7,position:sites.extraction,locations:sites});
 s=mission.step(s,{dt:.1,position:{x:0,z:0},locations:sites});assert.equal(s.extractProgress,0);
});

test('extraction sits within ten meters of harbor water at z=512',()=>{
 assert.ok(Math.abs(512-sites.extraction.z)<10);
});
test('mast clearance removes building collision within 4m including footprint',()=>{
 const tower=sites.towers[0];
 const near={name:'city-instance-test',position:{x:tower.x+3,z:tower.z},scaling:{x:4,z:4}};
 const far={name:'city-instance-far',position:{x:tower.x+12,z:tower.z},scaling:{x:4,z:4}};
 assert.equal(mission.buildingClearance(near,tower,4),false);
 assert.deepEqual(mission.clearMastArea([near,far],sites.towers,4),[far]);
});
