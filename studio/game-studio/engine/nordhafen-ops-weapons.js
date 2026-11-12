/* Nordhafen Ops – pure five-slot weapon inventory and deterministic pellet spread. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SDNordhafenOpsWeapons=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const DEFINITIONS=Object.freeze([
 {id:'pistol',mag:12,reserve:48,damage:25,cooldown:.28,reload:1.4,pellets:1,spread:.008,range:90},
 {id:'rifle',mag:30,reserve:120,damage:18,cooldown:.105,reload:1.9,pellets:1,spread:.018,range:130},
 {id:'smg',mag:36,reserve:144,damage:12,cooldown:.075,reload:1.7,pellets:1,spread:.032,range:75},
 {id:'shotgun',mag:6,reserve:30,damage:12,cooldown:.85,reload:2.3,pellets:6,spread:.11,range:45},
 {id:'sniper',mag:5,reserve:25,damage:90,cooldown:1.2,reload:2.8,pellets:1,spread:.002,range:300}
]);
function initial(){return {selected:0,slots:DEFINITIONS.map(d=>({ammo:d.mag,reserve:d.reserve,reload:0,cooldown:0})),shots:0,hits:0};}
function select(state,slot){return Number.isInteger(slot)&&slot>=0&&slot<DEFINITIONS.length?{...state,selected:slot}:state;}
function active(state){return {...DEFINITIONS[state.selected],...state.slots[state.selected]};}
function modify(state,slot,change){return {...state,slots:state.slots.map((s,i)=>i===slot?{...s,...change}:s)};}
function fire(state){const d=DEFINITIONS[state.selected],s=state.slots[state.selected];if(s.reload>0)return {state,event:'reloading',pellets:[]};if(s.cooldown>0)return {state,event:'cooldown',pellets:[]};if(s.ammo<=0)return {state,event:'empty',pellets:[]};return {state:{...modify(state,state.selected,{ammo:s.ammo-1,cooldown:d.cooldown}),shots:state.shots+1},event:'fired',pellets:spread(d.pellets,d.spread,state.shots)};}
function spread(count,angle,shot=0){const offset=(shot*0.61803398875)%1;return Array.from({length:count},(_,i)=>{const a=2*Math.PI*((i/count+offset)%1),r=Math.sqrt((i+.5)/count)*angle;return {x:Math.cos(a)*r,y:Math.sin(a)*r};});}
function reload(state){const d=DEFINITIONS[state.selected],s=state.slots[state.selected];return s.reload>0||s.ammo===d.mag||s.reserve<=0?state:modify(state,state.selected,{reload:d.reload});}
function tick(state,dt){const step=Math.max(0,dt);return {...state,slots:state.slots.map((s,i)=>{const d=DEFINITIONS[i],remaining=Math.max(0,s.reload-step),cooldown=Math.max(0,s.cooldown-step);if(s.reload>0&&remaining===0){const amount=Math.min(d.mag-s.ammo,s.reserve);return {...s,ammo:s.ammo+amount,reserve:s.reserve-amount,reload:0,cooldown};}return {...s,reload:remaining,cooldown};})};}
function hit(state){return {...state,hits:state.hits+1};}
function fov(state,aiming){return aiming?(DEFINITIONS[state.selected].id==='sniper'?.28:.55):.8;}
function recoil(state){return DEFINITIONS[state.selected].spread*1.8;}
return Object.freeze({DEFINITIONS,initial,select,active,fire,spread,reload,tick,hit,fov,recoil});
});