'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const streets=require('./nordhafen-ops-streets.js');
const people=require('./nordhafen-ops-pedestrians.js');
const traffic=require('./nordhafen-ops-traffic.js');
const city=require('./nordhafen-ops-city.js');
const strips=streets.layout(512);
function simulate(seconds,{count=30,car=null,seed=4242}={}){
 let w=people.plan(count,strips,{x:256,z:256},seed);
 const frames=[];
 for(let i=0;i<Math.round(seconds*60);i++){
  const prev=w;
  w=w.map(p=>people.step(p,1/60,{strips,cityRules:city,others:prev,car:typeof car==='function'?car(i):car,random:Math.random}));
  frames.push({prev,next:w});
 }
 return {walkers:w,frames};
}
test('sidewalk strips follow the painted street grid and leave the asphalt free',()=>{
 assert.equal(strips.length,256);
 for(const s of strips){
  const local=((s.line%64)+64)%64;
  assert.ok(local===1.5||local===11.5,'strip on a sidewalk band');
  assert.ok(s.end>s.start);
  assert.ok(((s.start%64)+64)%64===13,'interrupted at junctions');
 }
 assert.equal(streets.onRoad(256+6.5,256+30),true);
 assert.equal(streets.onSidewalk(256+1.5,256+30),true);
 assert.equal(streets.onRoad(256+1.5,256+30),false);
 assert.equal(streets.STREET.curbHeight,.15);
});
test('desktop and mobile pedestrian limits',()=>{
 assert.equal(people.limit(false),30);
 assert.equal(people.limit(true),10);
});
test('walkers stay on sidewalks or zebra-cross the road, never teleport, never leave the street grid',()=>{
 const {frames}=simulate(120);
 let turned=0,crossed=0;
 for(const {prev,next} of frames)next.forEach((p,i)=>{
  assert.ok(streets.onSidewalk(p.x,p.z)||streets.onRoad(p.x,p.z),'walker '+p.id+' off the streets at '+p.x.toFixed(1)+','+p.z.toFixed(1));
  assert.ok(Math.hypot(p.x-prev[i].x,p.z-prev[i].z)<1,'no jump');
  if(p.axis!==prev[i].axis)turned++;
  if(streets.onRoad(p.x,p.z))crossed++;
 });
 assert.ok(turned>0,'walkers turn at junctions');
 assert.ok(crossed>0,'walkers cross streets at junctions');
});
test('walkers in the same direction keep a gap, oncoming walkers pass on their right',()=>{
 const {frames}=simulate(60);
 for(const {next} of frames.slice(60)){
  for(const a of next)for(const b of next){
   if(a.id>=b.id||a.axis!==b.axis||a.line!==b.line)continue;
   const d=Math.hypot(a.x-b.x,a.z-b.z);
   if(a.direction===b.direction)assert.ok(d>.9,'gap '+d.toFixed(2)+' m between '+a.id+' and '+b.id);
   else assert.ok(Math.abs((a.axis==='z'?a.x-b.x:a.z-b.z))>1,'oncoming walkers use opposite sides');
  }
 }
});
test('a fast car nearby makes walkers run away, a hit knocks them over',()=>{
 const p=people.plan(1,strips,{x:256,z:256})[0];
 const close={driving:true,x:p.x+(p.axis==='x'?6:0),z:p.z+(p.axis==='z'?6:0),speedKmh:40};
 const fled=people.step(p,1/60,{strips,cityRules:city,car:close});
 assert.equal(fled.state,'run');
 const before=p.axis==='z'?p.z:p.x,after=p.axis==='z'?fled.z:fled.x,carAt=p.axis==='z'?close.z:close.x;
 assert.ok(Math.abs(after-carAt)>Math.abs(before-carAt),'moves away from the car');
 const slow=people.step(p,1/60,{strips,cityRules:city,car:{...close,speedKmh:8}});
 assert.equal(slow.state,'walk','slow car does not scare');
 const hit=people.step(p,1/60,{strips,cityRules:city,car:{driving:true,x:p.x+1,z:p.z,speedKmh:30}});
 assert.equal(hit.state,'down');
 const parked=people.step(p,1/60,{strips,cityRules:city,car:{driving:false,x:p.x+1,z:p.z,speedKmh:0}});
 assert.notEqual(parked.state,'down','parked car does nothing');
});
test('AI traffic stops for a pedestrian crossing in its lane',()=>{
 const car={x:256+4.7,z:256+20,axis:'z',direction:-1,road:256+4.7,heading:Math.PI,speed:6,cruise:6};
 const walker={x:256+4.7,z:256+11};
 assert.equal(traffic.nearestObstacle(car,null,[walker]),9);
 const next=traffic.advance(car,.05,null,512,city,[walker]);
 assert.ok(next.speed<car.speed,'brakes');
 // The page only passes walkers that are on the asphalt; sidewalk walkers never stop traffic.
 assert.equal(streets.onRoad(256+1.5+.55,256+15),false);
});
test('page wires sidewalks, pedestrians, HUD and placeholder note',()=>{
 const html=fs.readFileSync(path.join(__dirname,'nordhafen-ops.html'),'utf8');
 assert.match(html,/nordhafen-ops-streets\.js/);
 assert.match(html,/nordhafen-ops-pedestrians\.js/);
 assert.match(html,/cityPeople\.update\(dt,pos/);
 assert.match(html,/Passanten: /);
 assert.match(html,/cityPeople\?\.dispose\(\)/);
 const src=fs.readFileSync(path.join(__dirname,'nordhafen-ops-pedestrians.js'),'utf8');
 assert.match(src,/PLATZHALTER/);
 const licenses=fs.readFileSync(path.join(__dirname,'ASSET-LICENSES.md'),'utf8');
 assert.match(licenses,/Platzhalter/i);
 for(const m of people.PLACEHOLDER_MODELS)assert.ok(fs.existsSync(path.join(__dirname,'assets','nordhafen-char-'+m+'.glb')),m);
});
