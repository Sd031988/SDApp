/* Visible lightweight traffic for Nordhafen Ops Freie Stadt.
 * Reuses nordhafen-ops-city.js movement rules. Not yet collidable Havok cars:
 * vehicle physics stays with the player's drivable SUV/GLB adapter.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.SDNordhafenOpsTraffic=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
function clamp(value,min,max){return Math.min(max,Math.max(min,value));}
function plan(worldSize=512,count=10,seed=1337){
 if(!Number.isFinite(worldSize)||worldSize<192)throw new RangeError('world must be at least 192 m');
 const n=clamp(Math.floor(count),0,18),lines=Math.max(2,Math.floor(worldSize/64)-1);
 let state=seed>>>0;
 const random=()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296;};
 return Array.from({length:n},(_,i)=>{
  const axis=i%2?'x':'z',direction=i%4<2?1:-1;
  const road=(1+Math.floor(random()*lines))*64+6.5+(direction>0?-1.8:1.8);
  const distance=16+random()*(worldSize-32);
  const x=axis==='x'?distance:road,z=axis==='z'?distance:road;
  const heading=axis==='z'?(direction>0?0:Math.PI):(direction>0?Math.PI/2:-Math.PI/2);
  return {id:i,x,z,road,axis,direction,heading,speed:5+random()*2.3,
   color:i%5,cruise:5.5+(i%4)*.65};
 });
}
function obstacle(car,player){
 if(!player||!Number.isFinite(player.x)||!Number.isFinite(player.z))return Infinity;
 const sameLane=Math.abs((car.axis==='x'?player.z:player.x)-car.road)<3.8;
 if(!sameLane)return Infinity;
 const ahead=((car.axis==='x'?player.x-car.x:player.z-car.z)*car.direction);
 return ahead>=0&&ahead<15?ahead:Infinity;
}
function advance(car,dt,player,worldSize=512,cityRules){
 if(!cityRules||typeof cityRules.traffic!=='function')throw new TypeError('city traffic rules required');
 const t=clamp(Number.isFinite(dt)?dt:0,0,.05);
 const current={...car,heading:car.heading};
 const next=cityRules.traffic(current,t,{obstacleDistance:obstacle(current,player),stopDistance:12,cruise:car.cruise});
 const low=12,high=worldSize-12,span=high-low;
 const lane=car.axis==='x'?'x':'z',other=lane==='x'?'z':'x';
 if(next[lane]>high)next[lane]=low+(next[lane]-high)%span;
 else if(next[lane]<low)next[lane]=high-(low-next[lane])%span;
 next[other]=car.road;
 return next;
}
function create({scene,BABYLON,cityRules,worldSize=512,count=10,mobile=false,seed=1337}={}){
 if(!scene||!BABYLON||!cityRules)throw new TypeError('traffic needs scene, Babylon, city rules');
 const objects=[],materials=[],cars=plan(worldSize,mobile?Math.min(5,count):count,seed);
 const paints=['#cf5343','#6885a2','#ddd7c5','#889377','#d7a64b'].map((hex,i)=>{
  const m=new BABYLON.StandardMaterial('traffic-paint-'+i,scene);
  m.diffuseColor=BABYLON.Color3.FromHexString(hex);materials.push(m);return m;
 });
 const glass=new BABYLON.StandardMaterial('traffic-glass',scene);
 glass.diffuseColor=BABYLON.Color3.FromHexString('#283c4d');materials.push(glass);
 const rubber=new BABYLON.StandardMaterial('traffic-tire',scene);
 rubber.diffuseColor=BABYLON.Color3.FromHexString('#181c21');materials.push(rubber);
 const carsInWorld=cars.map(car=>{
  const root=new BABYLON.TransformNode('ops-traffic-root-'+car.id,scene);
  const body=BABYLON.MeshBuilder.CreateBox('ops-traffic-body-'+car.id,{width:1.8,height:.65,depth:3.7},scene);
  body.parent=root;body.position.y=.68;body.material=paints[car.color];body.isPickable=false;
  const cabin=BABYLON.MeshBuilder.CreateBox('ops-traffic-cabin-'+car.id,{width:1.5,height:.54,depth:1.95},scene);
  cabin.parent=root;cabin.position.y=1.26;cabin.material=glass;cabin.isPickable=false;
  // Four visible rotating-side wheels; grouped under one transform for LOD.
  const wheel=BABYLON.MeshBuilder.CreateCylinder('ops-traffic-wheel-'+car.id+'-0',
   {diameter:.56,height:.23,tessellation:12},scene);
  wheel.parent=root;wheel.rotation.z=Math.PI/2;wheel.position.set(-.94,.39,-1.12);
  wheel.material=rubber;wheel.isPickable=false;
  for(const [j,x,z] of [[1,.94,-1.12],[2,-.94,1.12],[3,.94,1.12]]){
   const instance=wheel.createInstance('ops-traffic-wheel-'+car.id+'-'+j);
   instance.parent=root;instance.position.set(x,.39,z);instance.rotation.z=Math.PI/2;
   instance.isPickable=false;
  }
  root.position.set(car.x,0,car.z);root.rotation.y=car.heading;
  objects.push(root);
  return {root,state:car,visible:true};
 });
 let disposed=false,visible=0;
 function update(dt,player){
  if(disposed)return 0;
  visible=0;
  for(const item of carsInWorld){
   item.state=advance(item.state,dt,player,worldSize,cityRules);
   const v=item.state;
   const near=!!player&&Math.hypot(v.x-player.x,v.z-player.z)<(mobile?105:155);
   if(near){item.root.position.set(v.x,0,v.z);item.root.rotation.y=v.heading;visible++;}
   if(near!==item.visible){item.root.setEnabled(near);item.visible=near;}
  }
  return visible;
 }
 function dispose(){
  if(disposed)return;disposed=true;
  for(const root of objects)root.dispose(false,false);
  for(const m of materials)m.dispose();
  objects.length=0;
 }
 return Object.freeze({update,dispose,
  get visible(){return visible;},
  get count(){return carsInWorld.length;},
  get positions(){return carsInWorld.filter(x=>x.visible).map(x=>({x:x.state.x,z:x.state.z}));}
 });
}
return Object.freeze({plan,obstacle,advance,create});
});
