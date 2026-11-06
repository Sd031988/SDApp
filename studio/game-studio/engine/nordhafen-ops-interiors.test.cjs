'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),interiors=require('./nordhafen-ops-interiors.js');
test('three selected building sites are distinct and close to three towers',()=>{
 const fixture={chunks:[{x:1,z:1,objects:[{id:'a',type:'building',x:10,z:10},{id:'b',type:'building',x:42,z:10}]},{x:3,z:3,objects:[{id:'c',type:'building',x:10,z:10}]}]};
 const towers=[{x:80,z:80},{x:115,z:80},{x:202,z:202}];
 const selected=interiors.selectBuildings(fixture,towers);
 assert.deepEqual(selected.map(s=>s.id),['a','b','c']);
});
test('three ramp flights respect 35 degree limit and simulated climb reaches roof',()=>{
 const plan=interiors.blueprint({x:100,z:100});
 assert.equal(plan.levels,3);assert.ok(plan.slope<=35);
 const result=interiors.climb(plan.stairs);assert.equal(result.reached,true);assert.equal(result.y,plan.roofY);
});
test('camera wall hit shortens orbit, empty view keeps desired radius',()=>{
 assert.equal(interiors.cameraRadius(7.5,null),7.5);
 assert.ok(interiors.cameraRadius(7.5,2)<2);
});
test('interiors are near-only streamed',()=>{
 assert.equal(interiors.near({x:10,z:10},{x:12,z:12}),true);
 assert.equal(interiors.near({x:10,z:10},{x:110,z:110}),false);
});

test('three masts receive three different building IDs even when one building is closest to multiple masts',()=>{
 const fixture={chunks:[{x:0,z:0,objects:[
  {id:'shared',type:'building',x:10,z:10},
  {id:'second',type:'building',x:30,z:10},
  {id:'third',type:'building',x:50,z:10}
 ]}]};
 const towers=[{x:10,z:10},{x:11,z:10},{x:12,z:10}];
 const selected=interiors.selectBuildings(fixture,towers);
 assert.equal(selected.length,3);
 assert.equal(new Set(selected.map(building=>building.id)).size,3);
 assert.deepEqual(selected.map(building=>building.id),['shared','second','third']);
});

test('twenty available buildings produce twenty unique streamed interior sites',()=>{
 const fixture={chunkSize:64,chunks:Array.from({length:5},(_,chunk)=>({x:chunk,z:0,objects:Array.from({length:5},(_,i)=>({id:'b-'+chunk+'-'+i,type:'building',x:4+i*9,z:12}))}))};
 const sites=interiors.selectSites(fixture,[{x:0,z:0},{x:128,z:0},{x:256,z:0}],20);
 assert.equal(sites.length,20);assert.equal(new Set(sites.map(s=>s.id)).size,20);
 assert.ok(sites.every(s=>Number.isFinite(s.x)&&Number.isFinite(s.z)));
});
test('when fewer than twenty buildings exist, selection does not invent geometry',()=>{
 const fixture={chunkSize:64,chunks:[{x:0,z:0,objects:[{id:'only',type:'building',x:10,z:10}]}]};
 assert.equal(interiors.selectSites(fixture,[{x:10,z:10}],20).length,1);
});
