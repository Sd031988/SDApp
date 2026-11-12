/* Nordhafen Ops: deterministic playable Free City objectives.
 * Progress only on live player/vehicle events, never on timer-only mock wins.
 * No Babylon dependency; the rendering page owns status, markers and records.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.SDNordhafenOpsCityObjectives=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const DEFINITIONS=Object.freeze([
 {kind:'courier',title:'01 · Fahrauftrag: Funkdepot erreichen'},
 {kind:'eliminate',title:'02 · Hafen sichern: zwei Gegner besiegen'},
 {kind:'radio',title:'03 · Nachricht senden: E am zweiten Funkmast halten'},
 {kind:'pursuit',title:'04 · Verfolgung: 45 km/h für 2 Sekunden'},
 {kind:'harbor',title:'05 · Heimkehr: am Hafen anhalten und aussteigen'}
]);
function initial(){
 return {index:0,progress:0,completed:[],won:false};
}
const near=(a,b,radius)=>!!a&&!!b&&Math.hypot(a.x-b.x,a.z-b.z)<=radius;
function goal(state,sites){
 if(!sites||state.won)return null;
 const kind=DEFINITIONS[state.index]?.kind;
 return kind==='courier'?sites.towers?.[0]:
  kind==='radio'?sites.towers?.[1]:
  kind==='harbor'?sites.extraction:null;
}
function title(state){return state.won?'FREIE STADT · ALLE 5 AUFTRÄGE ERLEDIGT':DEFINITIONS[state.index]?.title||'Freie Stadt erkunden';}
function step(state,input={}){
 if(!state||state.won)return {state,event:null};
 const index=state.index,kind=DEFINITIONS[index]?.kind;
 if(!kind)return {state,event:null};
 const {pos,sites,driving=false,speedKmh=0,kills=0,holding=false,dt=0}=input;
 const seconds=Math.max(0,Math.min(.1,Number.isFinite(dt)?dt:0));
 let progress=state.progress,done=false;
 switch(kind){
  case 'courier':done=driving&&near(pos,sites?.towers?.[0],13);break;
  case 'eliminate':done=kills>=2;break;
  case 'radio':progress=near(pos,sites?.towers?.[1],5)&&!driving&&holding?progress+seconds:0;done=progress>=3;break;
  case 'pursuit':progress=driving&&Math.abs(speedKmh)>=45?progress+seconds:0;done=progress>=2;break;
  case 'harbor':done=!driving&&near(pos,sites?.extraction,13);break;
 }
 if(!done)return {state:progress===state.progress?state:{...state,progress},event:null};
 const won=index===DEFINITIONS.length-1;
 return {state:{index:index+1,progress:0,completed:[...state.completed,kind],won},
  event:{kind,title:DEFINITIONS[index].title,won}};
}
return Object.freeze({DEFINITIONS,initial,near,goal,title,step});
});
