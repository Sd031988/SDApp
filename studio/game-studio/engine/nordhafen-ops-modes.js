/* Nordhafen Ops: pure deterministic GTA-style free city and Royale rules. CC0 models are external scene assets. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SDNordhafenOpsModes=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function random(seed){let state=seed>>>0;return ()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/4294967296;};}
const LOOT=['ammo','medkit','armor','pistol','rifle'];
function loot(seed,count){const next=random(seed);return Array.from({length:count},(_,id)=>({id,type:LOOT[Math.floor(next()*LOOT.length)],x:Math.floor(next()*512),z:Math.floor(next()*512)}));}
function wanted(state,{shot=false,visible=false,dt=0}={}){let {level=0,quiet=0}=state;if(shot)return {level:clamp(level+1,0,3),quiet:0};quiet=visible?0:quiet+Math.max(0,dt);while(level>0&&quiet>=30){level--;quiet-=30;}return {level,quiet};}
const PHASES=[{radius:240,seconds:60},{radius:165,seconds:60},{radius:105,seconds:55},{radius:55,seconds:45},{radius:18,seconds:40}];
function zone(time,center={x:256,z:256}){let elapsed=Math.max(0,time),previous=256;for(let i=0;i<PHASES.length;i++){const p=PHASES[i];if(elapsed<=p.seconds){const t=elapsed/p.seconds;return {phase:i+1,radius:previous+(p.radius-previous)*t,center,secondsRemaining:Math.max(0,p.seconds-elapsed)};}elapsed-=p.seconds;previous=p.radius;}return {phase:5,radius:18,center,secondsRemaining:0};}
function zoneDamage(position,zone,dt,damagePerSecond=5){return Math.hypot(position.x-zone.center.x,position.z-zone.center.z)>zone.radius?Math.max(0,dt)*damagePerSecond:0;}
function royaleResult(players){const living=players.filter(p=>p.alive);return {remaining:living.length,winner:living.length===1?living[0].id:null,finished:living.length<=1};}
function vehicle(state,event){if(event==='enter'&&!state.driving&&state.near)return {...state,driving:true,controls:'vehicle'};if(event==='exit'&&state.driving)return {...state,driving:false,controls:'on-foot'};return state;}
function missions(){return ['courier','eliminate','radio','pursuit','harbor'].map((kind,i)=>({id:i+1,kind,done:false}));}
function nextMission(state,done){return state.map((m,i)=>i===done?{...m,done:true}:m);}
function difficulty(value){return ['easy','normal','hard'].includes(value)?value:'normal';}
return Object.freeze({random,loot,wanted,PHASES,zone,zoneDamage,royaleResult,vehicle,missions,nextMission,difficulty});
});