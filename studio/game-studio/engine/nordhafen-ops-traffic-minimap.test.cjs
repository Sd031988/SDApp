'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const traffic=require('./nordhafen-ops-traffic.js');
const city=require('./nordhafen-ops-city.js');
const minimap=require('./nordhafen-ops-minimap.js');
test('Traffic: deterministic street positions and bounded densities',()=>{
 const a=traffic.plan(512,10,1337),b=traffic.plan(512,10,1337);
 assert.deepEqual(a,b);
 assert.equal(a.length,10);
 assert.ok(a.some(c=>Math.hypot(c.x-256,c.z-256)<155),'traffic visible near spawn');
 for(const car of a){
  assert.ok(car.x>=0&&car.x<=512&&car.z>=0&&car.z<=512);
  assert.ok(Math.abs((car.axis==='x'?car.z:car.x)-car.road)<.01);
 }
 assert.equal(traffic.plan(512,999).length,18);
 assert.equal(traffic.plan(512,-3).length,0);
 assert.throws(()=>traffic.plan(100,10),RangeError);
});
test('Traffic: vehicles respond to player in lane and wrap at map boundaries',()=>{
 const car={id:0,axis:'z',road:198.7,x:198.7,z:150,direction:1,heading:0,speed:6,cruise:7,color:0};
 assert.equal(traffic.obstacle(car,{x:198,z:157}),7);
 assert.equal(traffic.obstacle(car,{x:220,z:157}),Infinity);
 const approaching=traffic.advance(car,.05,{x:198,z:157},512,city);
 const free=traffic.advance(car,.05,null,512,city);
 assert.ok(approaching.speed<free.speed,'car brakes for a player ahead');
 assert.equal(approaching.x,car.road,'traffic remains on road');
 const wrap=traffic.advance({...car,z:500,speed:10},.05,null,512,city);
 assert.ok(wrap.z>=12&&wrap.z<=500,'car wraps onto another visible road segment');
});
test('Traffic: Babylon adapter creates visible moving vehicles and releases meshes/materials',()=>{
 const nodes=[],materials=[],makeNode=()=>({
  position:{x:0,y:0,z:0,set(x,y,z){this.x=x;this.y=y;this.z=z;}},
  rotation:{},scaling:{},parent:null,isPickable:true,
  createInstance(){return makeNode();},
  setEnabled(v){this.enabled=v;},
  dispose(){this.disposed=true;}
 });
 class Root{constructor(){Object.assign(this,makeNode());nodes.push(this);}}
 class Material{constructor(){materials.push(this)}dispose(){this.disposed=true;}}
 const BABYLON={TransformNode:Root,StandardMaterial:Material,Color3:{FromHexString:v=>v},
  MeshBuilder:{CreateBox:makeNode,CreateCylinder:makeNode}};
 const sim=traffic.create({scene:{},BABYLON,cityRules:city,count:10,worldSize:512,seed:1337});
 assert.equal(sim.count,10);
 const before=sim.positions;
 assert.equal(sim.visible,0);
 const n=sim.update(.05,{x:256,z:256});
 assert.ok(n>=1&&n<=10,'traffic around player');
 assert.ok(sim.positions.some((p,i)=>i>=0&&Number.isFinite(p.x)&&Number.isFinite(p.z)));
 const pos=sim.positions[0];assert.ok(pos);
 sim.dispose();assert.ok(nodes.every(n=>n.disposed), 'traffic transform nodes disposed');
 assert.ok(materials.every(m=>m.disposed),'shared materials disposed');
 assert.equal(sim.update(.05,{x:256,z:256}),0,'safe update after dispose');
});
test('Minimap: maps city center to center of canvas and rejects bad coordinates',()=>{
 assert.deepEqual(minimap.project({x:256,z:256}),{x:88,y:88});
 assert.deepEqual(minimap.project({x:-10,z:1000}),{x:9,y:167});
 assert.equal(minimap.project({x:NaN,z:22}),null);
});
test('Minimap: draws player marker, mission waypoint and traffic without Babylon',()=>{
 const ops=[];const ctx={
  beginPath(){ops.push('begin')},arc(){ops.push('arc')},fill(){ops.push('fill')},
  fillRect(){ops.push('fillRect')},clearRect(){ops.push('clear')},
  moveTo(){},lineTo(){},stroke(){},strokeRect(){},save(){},restore(){},translate(){},rotate(){},closePath(){},fillText(t){ops.push('text:'+t)}
 };
 const canvas={width:176,height:176,getContext(type){assert.equal(type,'2d');return ctx;}};
 const map=minimap.create({canvas,worldSize:512});
 assert.equal(map.draw({player:{x:256,z:256},goal:{x:128,z:128},traffic:[{x:256,z:192}],objective:'Auftrag 1'}),true);
 assert.ok(ops.filter(x=>x==='arc').length>=3,'draw goal and traffic dots');
 assert.ok(ops.includes('text:N'),'north reference exists');
 assert.ok(ops.some(x=>x.includes('Auftrag 1')),'objective displayed');
 map.dispose();assert.equal(map.draw({player:{x:10,z:10}}),false);
});
test('Ops page: traffic and minimap run in real game loop, default Freie Stadt',()=>{
 const source=fs.readFileSync(path.join(__dirname,'nordhafen-ops.html'),'utf8');
 for(const marker of ['nordhafen-ops-traffic.js','nordhafen-ops-minimap.js',
   'id="mapPanel"','id="minimap"','id="mapToggle"',
   'cityTraffic.update(dt,pos)','miniMap.draw(','trafficRules.create','minimapRules.create',
   '<option value="city" selected>'])assert.ok(source.includes(marker),marker);
 const js=source.slice(source.lastIndexOf('<script>')+8,source.lastIndexOf('</script>'));
 assert.doesNotThrow(()=>new vm.Script(js));
});
