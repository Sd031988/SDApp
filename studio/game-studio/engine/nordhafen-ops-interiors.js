/* Nordhafen Ops E: procedural interior blueprint and camera collision helpers. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SDNordhafenOpsInteriors=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 function selectBuildings(fixture,towers){
  const objects=fixture.chunks.flatMap(chunk=>chunk.objects.filter(o=>o.type==='building').map(o=>({id:o.id,x:chunk.x*64+o.x,z:chunk.z*64+o.z})));
  const chosen=new Set();
  return towers.map(t=>{
   const next=objects.filter(o=>!chosen.has(o.id)).sort((a,b)=>Math.hypot(a.x-t.x,a.z-t.z)-Math.hypot(b.x-t.x,b.z-t.z))[0];
   if(next)chosen.add(next.id);
   return next;
  });
 }
 function selectSites(fixture,towers,count=20){
  const priority=selectBuildings(fixture,towers).filter(Boolean);
  const used=new Set(priority.map(x=>x.id));
  const remaining=fixture.chunks.flatMap(chunk=>chunk.objects.filter(o=>o.type==='building'&&!used.has(o.id)).map(o=>({id:o.id,x:chunk.x*fixture.chunkSize+o.x,z:chunk.z*fixture.chunkSize+o.z})))
   .sort((a,b)=>Math.min(...towers.map(t=>Math.hypot(a.x-t.x,a.z-t.z)))-Math.min(...towers.map(t=>Math.hypot(b.x-t.x,b.z-t.z))));
  for(const item of remaining){if(priority.length>=count)break;if(!used.has(item.id)){priority.push(item);used.add(item.id);}}
  return priority.slice(0,count);
 }
 function blueprint(center){const levels=3,floorHeight=3,run=7,rise=floorHeight,slope=Math.atan2(rise,run)*180/Math.PI;return {center,levels,floorHeight,run,rise,slope,roofY:levels*floorHeight,stairs:Array.from({length:levels},(_,i)=>({fromY:i*floorHeight,toY:(i+1)*floorHeight,run,rise}))};}
 function climb(stairs){let y=0;for(const stair of stairs){if(stair.rise/stair.run>Math.tan(35*Math.PI/180))return {reached:false,y};y=stair.toY;}return {reached:true,y};}
 function cameraRadius(desired,hitDistance,margin=.25){return hitDistance===null?desired:Math.max(.8,Math.min(desired,hitDistance-margin));}
 function near(player,center,radius=55){return Math.hypot(player.x-center.x,player.z-center.z)<=radius;}
 return Object.freeze({selectBuildings,selectSites,blueprint,climb,cameraRadius,near});
});