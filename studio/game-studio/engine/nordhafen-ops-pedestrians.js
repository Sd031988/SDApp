/* Nordhafen Ops: passers-by on the sidewalks of Freie Stadt.
 * Movement uses pedestrian() from nordhafen-ops-city.js and the strips from
 * nordhafen-ops-streets.js. Walkers keep right, follow each other without
 * overlapping, turn at junctions, flee from fast cars and fall over when hit
 * (no injuries shown), then leave the scene.
 *
 * PLATZHALTER-MODELLE: the Quaternius RPG figures (CC0) are fantasy characters,
 * used only until everyday city people are supplied. See ASSET-LICENSES.md.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.SDNordhafenOpsPedestrians=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const PLACEHOLDER_MODELS=Object.freeze(['monk','cleric','wizard','ranger']);
const LIMITS=Object.freeze({desktop:30,mobile:10});
const RULES=Object.freeze({
 spawnMin:18,spawnMax:70,despawn:95,   // m around the player
 keepRight:.55,                         // m lateral offset from strip centre
 followGap:1.3,                         // m minimum distance to the walker ahead
 turnChance:.3,                         // probability to turn at a junction
 fleeDistance:14,fleeSpeedKmh:18,       // a car this fast and this close scares walkers
 hitDistance:2.4,hitSpeedKmh:12,        // car centre this close and this fast knocks over
 downSeconds:5,
 showDistance:Object.freeze({desktop:90,mobile:55}),   // m – farther walkers are hidden
 animateDistance:Object.freeze({desktop:45,mobile:28}) // m – farther walkers hold their pose
});
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
function limit(mobile){return mobile?LIMITS.mobile:LIMITS.desktop;}
function rng(seed){let s=seed>>>0||1;return ()=>{s=(Math.imul(1664525,s)+1013904223)>>>0;return s/4294967296;};}
function headingFor(axis,direction){return axis==='z'?(direction>0?0:Math.PI):(direction>0?Math.PI/2:-Math.PI/2);}
function position(p){
 // keep right: offset to the right of the walking direction
 const side=p.direction*RULES.keepRight;
 return p.axis==='z'?{x:p.line+side,z:p.along}:{x:p.along,z:p.line-side};
}
function spawn(id,strips,around,random,model){
 const near=strips.filter(s=>{
  const mid=(s.start+s.end)/2;
  const c=s.axis==='z'?{x:s.line,z:mid}:{x:mid,z:s.line};
  const d=Math.hypot(c.x-around.x,c.z-around.z);
  return d>RULES.spawnMin-30&&d<RULES.spawnMax+20;
 });
 const pool=near.length?near:strips;
 for(let tries=0;tries<12;tries++){
  const s=pool[Math.floor(random()*pool.length)];
  const along=s.start+.5+random()*(s.end-s.start-1),direction=random()<.5?1:-1;
  const p={id,axis:s.axis,line:s.line,along,direction,strip:s,speed:1+random()*.35,
   state:'walk',down:0,model,heading:headingFor(s.axis,direction)};
  const at=position(p),d=Math.hypot(at.x-around.x,at.z-around.z);
  if(d>=RULES.spawnMin&&d<=RULES.spawnMax)return Object.assign(p,at);
  if(tries===11)return Object.assign(p,at);
 }
}
// Decide what happens at the end of a strip: cross the street straight on,
// turn round the corner onto the crossing street's sidewalk, or turn back.
const CORNER=1.5;
function decide(p,strips,random){
 const ahead=p.direction>0?p.strip.end:p.strip.start;
 const same=strips.find(s=>s.axis===p.axis&&s.line===p.line&&s!==p.strip&&
  (p.direction>0?s.start>ahead-.01&&s.start-ahead<=13.5:s.end<ahead+.01&&ahead-s.end<=13.5));
 const nearLine=ahead+p.direction*CORNER,axis=p.axis==='z'?'x':'z';
 const turns=[];
 for(const s of strips){
  if(s.axis!==axis||Math.abs(s.line-nearLine)>.01)continue;
  if(Math.abs(s.end-p.line)<2.5)turns.push({strip:s,axis,line:s.line,direction:-1});
  if(Math.abs(s.start-p.line)<2.5)turns.push({strip:s,axis,line:s.line,direction:1});
 }
 if(turns.length&&(random()<RULES.turnChance||!same))return {type:'turn',...turns[Math.floor(random()*turns.length)]};
 if(same)return {type:'straight',strip:same};
 return {type:'back'};
}
function nextStrip(p,strips,random){return decide(p,strips,random);}
function threatOf(p,car){
 if(!car||!car.driving||!Number.isFinite(car.x))return null;
 const d=Math.hypot(p.x-car.x,p.z-car.z);
 return {distance:d,speedKmh:Math.abs(car.speedKmh||0),x:car.x,z:car.z};
}
function step(p,dt,{strips,cityRules,others=[],car=null,random=Math.random}={}){
 if(!cityRules||typeof cityRules.pedestrian!=='function')throw new TypeError('city pedestrian rules required');
 const t=clamp(Number.isFinite(dt)?dt:0,0,.05);
 if(p.state==='down'){return {...p,down:p.down+t};}
 const threat=threatOf(p,car);
 if(threat&&threat.distance<RULES.hitDistance&&threat.speedKmh>=RULES.hitSpeedKmh)
  return {...p,state:'down',down:0};
 let direction=p.direction,scared=false;
 if(threat&&threat.distance<RULES.fleeDistance&&threat.speedKmh>=RULES.fleeSpeedKmh){
  scared=true;
  const away=p.axis==='z'?Math.sign(p.z-threat.z)||1:Math.sign(p.x-threat.x)||1;
  direction=away;
 }
 // follow the walker ahead on the same side of the same strip
 let blocked=false;
 if(!scared)for(const o of others){
  if(o.id===p.id||o.state==='down'||o.axis!==p.axis||o.line!==p.line||o.direction!==direction)continue;
  const gap=(o.along-p.along)*direction;
  if(gap>0&&gap<RULES.followGap){blocked=true;break;}
 }
 const heading=headingFor(p.axis,direction);
 const moved=blocked?{x:0,z:0}:cityRules.pedestrian({x:0,z:0,heading},t*(scared?1:p.speed/1.1),{scared});
 let next={...p,direction,heading,state:scared?'run':blocked?'idle':'walk',
  along:p.along+(p.axis==='z'?moved.z:moved.x)};
 const end=next.direction>0?next.strip.end:next.strip.start;
 const passed=limit=>(next.along-limit)*next.direction>=0;
 if(scared){
  if(passed(end))next={...next,along:end,direction:-next.direction,pending:null,heading:headingFor(next.axis,-next.direction)};
 }else{
  if(!next.pending&&passed(end))next.pending=decide(next,strips,random);
  const plan=next.pending;
  if(plan?.type==='straight'){next={...next,strip:plan.strip,pending:null};}
  else if(plan?.type==='back'){next={...next,along:end,direction:-next.direction,pending:null,heading:headingFor(next.axis,-next.direction)};}
  else if(plan?.type==='turn'&&passed(end+next.direction*CORNER)){
   next={...next,strip:plan.strip,axis:plan.axis,line:plan.line,direction:plan.direction,
    along:p.line,pending:null,heading:headingFor(plan.axis,plan.direction)};
  }
 }
 return Object.assign(next,position(next));
}
function plan(count,strips,around,seed=4242){
 const random=rng(seed);
 return Array.from({length:count},(_,i)=>spawn(i,strips,around,random,PLACEHOLDER_MODELS[i%PLACEHOLDER_MODELS.length]));
}
function create({scene,BABYLON,cityRules,strips,mobile=false,seed=4242,around={x:256,z:256},assetPath='./assets/'}={}){
 if(!scene||!BABYLON||!cityRules||!strips?.length)throw new TypeError('pedestrians need scene, Babylon, city rules and sidewalk strips');
 const random=rng(seed),count=limit(mobile);
 let walkers=plan(count,strips,around,seed),disposed=false,visible=0,downCount=0;
 const views=new Map(),containers=new Map(),placeholders=[];
 const fallbackMat=new BABYLON.StandardMaterial('ops-pedestrian-fallback',scene);
 fallbackMat.diffuseColor=BABYLON.Color3.FromHexString('#8a7f6c');
 function placeholder(id){
  const mesh=BABYLON.MeshBuilder.CreateCapsule('ops-pedestrian-'+id,{height:1.75,radius:.28},scene);
  mesh.material=fallbackMat;mesh.isPickable=false;placeholders.push(mesh);
  return {root:mesh,anims:null,fallback:true,current:null,shown:true};
 }
 async function loadModels(){
  const loader=BABYLON.SceneLoader;
  if(!loader?.LoadAssetContainerAsync)return;
  for(const name of PLACEHOLDER_MODELS){
   if(disposed)return;
   try{
    const container=await loader.LoadAssetContainerAsync(assetPath,'nordhafen-char-'+name+'.glb',scene);
    if(disposed){container.dispose();return;}
    containers.set(name,container);
   }catch(_){/* keep capsule placeholder for this model */}
  }
  for(const w of walkers)ensureView(w,true);
 }
 function animationFor(view,state,animate){
  if(!view.anims)return;
  if(!animate){if(!view.paused){for(const g of view.anims)g.pause();view.paused=true;}return;}
  if(view.paused){for(const g of view.anims)g.restart();view.paused=false;}
  const wanted=state==='run'?'Run':state==='down'?'Death':state==='idle'?'Idle':'Walk';
  if(view.current===wanted)return;
  for(const g of view.anims)g.stop();
  const g=view.anims.find(a=>a.name===wanted||a.name.endsWith('|'+wanted));
  g?.start(wanted!=='Death',1);
  view.current=wanted;
 }
 function ensureView(w,upgrade=false){
  let view=views.get(w.id);
  const container=containers.get(w.model);
  if(view&&!(upgrade&&view.fallback&&container))return view;
  if(view){view.root.dispose();}
  if(container){
   const inst=container.instantiateModelsToScene(n=>n+'-p'+w.id,false,{doNotInstantiate:false});
   const root=new BABYLON.TransformNode('ops-pedestrian-'+w.id,scene);
   for(const node of inst.rootNodes)node.parent=root;
   root.scaling.setAll(1.8/3.8); // Quaternius RPG figures are ~3.8 units tall
   for(const m of root.getChildMeshes())m.isPickable=false;
   view={root,anims:inst.animationGroups,fallback:false,current:null,inst,shown:true,paused:false};
  }else view=placeholder(w.id);
  views.set(w.id,view);
  return view;
 }
 void loadModels();
 function update(dt,player,car){
  if(disposed||!player)return 0;
  visible=0;downCount=0;
  const snapshot=walkers;
  walkers=walkers.map(w=>{
   let n=step(w,dt,{strips,cityRules,others:snapshot,car,random});
   const far=Math.hypot(n.x-player.x,n.z-player.z)>RULES.despawn;
   if(far||(n.state==='down'&&n.down>RULES.downSeconds)){
    const fresh=spawn(w.id,strips,player,random,w.model);
    const view=views.get(w.id);if(view?.anims)view.current=null;
    n=fresh;
   }
   return n;
  });
  const show=mobile?RULES.showDistance.mobile:RULES.showDistance.desktop;
  const animateWithin=mobile?RULES.animateDistance.mobile:RULES.animateDistance.desktop;
  for(const w of walkers){
   const view=ensureView(w);
   const root=view.root,distance=Math.hypot(w.x-player.x,w.z-player.z);
   const shown=distance<=show;
   if(shown!==view.shown){root.setEnabled(shown);view.shown=shown;}
   if(!shown)continue;
   root.position.set(w.x,view.fallback?STREET_TOP+.875:STREET_TOP,w.z);
   if(view.fallback)root.rotation.y=w.heading;
   else root.rotation=new BABYLON.Vector3(0,w.heading,0);
   animationFor(view,w.state,distance<=animateWithin);
   if(view.fallback)root.rotation.x=w.state==='down'?Math.PI/2:0;
   visible++;if(w.state==='down')downCount++;
  }
  return visible;
 }
 function dispose(){
  if(disposed)return;disposed=true;
  for(const view of views.values()){for(const g of view.anims||[])g.dispose();view.root.dispose();}
  for(const c of containers.values())c.dispose();
  fallbackMat.dispose();views.clear();containers.clear();
 }
 return Object.freeze({update,dispose,
  get count(){return walkers.length;},get visible(){return visible;},get down(){return downCount;},
  get walkers(){return walkers.map(w=>({id:w.id,x:w.x,z:w.z,state:w.state,model:w.model}));},
  get modelsLoaded(){return containers.size;}});
}
const STREET_TOP=.15;
return Object.freeze({PLACEHOLDER_MODELS,LIMITS,RULES,limit,plan,step,position,decide,nextStrip,create});
});
