/* Nordhafen Ops – isolated, deterministic combat rules (stage A). */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SDNordhafenOpsCombat=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const MAGAZINE=30,RESERVE=90,RELOAD_SECONDS=1.6;
 function initial(){return {ammo:MAGAZINE,reserve:RESERVE,reload:0,shots:0,hits:0};}
 function fire(state){if(state.reload>0)return {state,event:'reloading'};if(state.ammo<=0)return {state,event:'empty'};return {state:{...state,ammo:state.ammo-1,shots:state.shots+1},event:'fired'};}
 function reload(state){if(state.reload>0)return state;if(state.ammo===MAGAZINE||state.reserve<=0)return state;return {...state,reload:RELOAD_SECONDS};}
 function tick(state,dt){if(state.reload<=0)return state;const remaining=Math.max(0,state.reload-Math.max(0,dt));if(remaining>0)return {...state,reload:remaining};const amount=Math.min(MAGAZINE-state.ammo,state.reserve);return {...state,ammo:state.ammo+amount,reserve:state.reserve-amount,reload:0};}
 function hit(state,damage=25){return {state:{...state,hits:state.hits+1},damage:Math.max(0,damage)};}
 return Object.freeze({MAGAZINE,RELOAD_SECONDS,initial,fire,reload,tick,hit});
});