/* Nordhafen Ops – deterministic mission progression, no Babylon dependencies. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SDNordhafenOpsMission=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const ACTIVATE_SECONDS=3,EXTRACT_SECONDS=10,ACTIVATE_RADIUS=4,EXTRACT_RADIUS=9;
 const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
 function locations(origin,worldSize=512){
  const size=Math.max(320,worldSize),margin=12;
  const clamp=v=>Math.min(size-margin,Math.max(margin,v));
  const towers=[{x:clamp(origin.x+128),z:clamp(origin.z+64)},{x:clamp(origin.x+128),z:clamp(origin.z+192)},{x:clamp(origin.x+192),z:clamp(origin.z+192)}];
  const extraction={x:clamp(size-margin),z:clamp(origin.z+192)};
  return {towers,extraction};
 }
 function initial(){return {completed:[false,false,false],progress:0,extractProgress:0,status:'playing',activated:null};}
 function step(state,{dt=0,position,locations:sites,holding=false,damage=false,health=100}){
  if(state.status!=='playing')return state;
  if(health<=0)return {...state,status:'lost',progress:0,extractProgress:0,activated:null};
  const completed=state.completed.slice(),index=completed.indexOf(false),delta=Math.max(0,dt);
  if(index>=0){
   const within=distance(position,sites.towers[index])<=ACTIVATE_RADIUS;
   const progress=within&&holding&&!damage?state.progress+delta:0;
   if(progress>=ACTIVATE_SECONDS){completed[index]=true;return {...state,completed,progress:0,activated:index};}
   return {...state,completed,progress,extractProgress:0,activated:null};
  }
  const within=distance(position,sites.extraction)<=EXTRACT_RADIUS;
  const extractProgress=within&&!damage?state.extractProgress+delta:0;
  return {...state,extractProgress,status:extractProgress>=EXTRACT_SECONDS?'won':'playing',activated:null};
 }
 function alertNearby(enemies,point,count=2,radius=32){
  const nearest=enemies.map((enemy,i)=>({i,dist:distance(enemy,point)})).filter(x=>enemies[x.i].health>0&&x.dist<=radius).sort((a,b)=>a.dist-b.dist).slice(0,count);
  const ids=new Set(nearest.map(x=>x.i));
  return enemies.map((enemy,i)=>ids.has(i)?{...enemy,state:'alert',time:0}:enemy);
 }
 return Object.freeze({ACTIVATE_SECONDS,EXTRACT_SECONDS,ACTIVATE_RADIUS,EXTRACT_RADIUS,distance,locations,initial,step,alertNearby});
});