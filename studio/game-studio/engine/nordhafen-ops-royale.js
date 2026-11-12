/* Nordhafen Ops: pure Royale inventory, parachute, bots and tank combat. No scene or network dependencies. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SDNordhafenOpsRoyale=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
function drop(x=256,z=256){return {x,z,y:150,verticalSpeed:0,parachute:false,landed:false};}
function descend(state,dt,{open=false,moveX=0,moveZ=0,ground=0}={}){if(state.landed)return state;const step=clamp(dt,0,.05),parachute=state.parachute||open,verticalSpeed=parachute?Math.min(5,state.verticalSpeed+9.8*step):Math.min(50,state.verticalSpeed+9.8*step);const y=Math.max(ground,state.y-verticalSpeed*step);return {...state,x:clamp(state.x+clamp(moveX,-1,1)*(parachute?7:3)*step,0,512),z:clamp(state.z+clamp(moveZ,-1,1)*(parachute?7:3)*step,0,512),y,verticalSpeed,parachute,landed:y<=ground};}
function inventory(){return {health:100,armor:0,ammo:30,capacity:120,weapons:['pistol'],collected:[]};}
function pickup(state,item){if(state.collected.includes(item.id))return state;let next={...state,collected:[...state.collected,item.id]};switch(item.type){case 'ammo':next.ammo=Math.min(next.capacity,next.ammo+30);break;case 'medkit':next.health=Math.min(100,next.health+60);break;case 'bandage':next.health=Math.min(100,next.health+25);break;case 'armor':next.armor=Math.min(100,next.armor+50);break;case 'backpack':next.capacity=240;break;case 'pistol':case 'rifle':case 'smg':case 'shotgun':case 'sniper':next.weapons=[...new Set([...next.weapons,item.type])];break;default:return state;}return next;}
function bot(state,dt,{enemy=null,loot=null,range=75}={}){if(!state.alive)return state;const step=clamp(dt,0,.1);if(enemy&&Math.hypot(state.x-enemy.x,state.z-enemy.z)<range)return {...state,activity:'fight',target:enemy.id};if(loot){const dx=loot.x-state.x,dz=loot.z-state.z,d=Math.hypot(dx,dz);return {...state,activity:d<2?'loot':'seek-loot',x:state.x+(d>0?dx/d:0)*Math.min(d,3*step),z:state.z+(d>0?dz/d:0)*Math.min(d,3*step)};}return {...state,activity:'patrol'};}
function tank(){return {cooldown:0,heading:0};}
function tankTick(state,dt){return {...state,cooldown:Math.max(0,state.cooldown-Math.max(0,dt))};}
function tankFire(state){return state.cooldown>0?{state,fired:false}:{state:{...state,cooldown:4},fired:true};}
function blast(distance,radius=8,maxDamage=90){return distance>=radius?0:Math.max(0,maxDamage*(1-distance/radius));}
return Object.freeze({drop,descend,inventory,pickup,bot,tank,tankTick,tankFire,blast});
});