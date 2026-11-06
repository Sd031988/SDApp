/* Nordhafen Ops: deterministic city driving, traffic, moving train and passenger logic. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.SDNordhafenOpsCity=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
function car(x=0,z=0,heading=0){return {x,z,heading,speed:0,steering:0,driving:false,controls:'on-foot',camera:'shoulder'};}
function enter(state,near){return !state.driving&&near?{...state,driving:true,controls:'vehicle',camera:'chase'}:state;}
function exit(state){return state.driving?{...state,driving:false,controls:'on-foot',camera:'shoulder'}:state;}
function drive(state,dt,{throttle=0,brake=0,steer=0,handbrake=false}={}){
 if(!state.driving)return state;
 const t=clamp(dt,0,.05),angle=clamp(steer,-1,1)*.52;
 let speed=state.speed;
 if(Math.abs(throttle)>.01)speed+=clamp(throttle,-1,1)*(throttle>=0?9:5)*t;
 else speed=Math.sign(speed)*Math.max(0,Math.abs(speed)-3*t);
 if(brake>0)speed=Math.sign(speed)*Math.max(0,Math.abs(speed)-clamp(brake,0,1)*20*t);
 if(handbrake)speed=Math.sign(speed)*Math.max(0,Math.abs(speed)-32*t);
 speed=clamp(speed,-8,23);
 const heading=state.heading+Math.tan(angle)*speed*t/2.6;
 return {...state,speed,heading,steering:angle,x:state.x+Math.sin(heading)*speed*t,z:state.z+Math.cos(heading)*speed*t};
}
function traffic(state,dt,{obstacleDistance=Infinity,stopDistance=9,cruise=7}={}){
 const target=obstacleDistance<=stopDistance?0:cruise;
 const speed=target===0?Math.max(0,state.speed-14*Math.max(0,dt)):Math.min(target,state.speed+4*Math.max(0,dt));
 return {...state,speed,x:state.x+Math.sin(state.heading)*speed*dt,z:state.z+Math.cos(state.heading)*speed*dt};
}
function train(distance,dt,length=900,speed=9){const period=Math.max(1,length);return ((distance+Math.max(0,dt)*speed)%period+period)%period;}
function trainPosition(distance,segments){if(!segments?.length)return {x:0,z:0};const total=segments.reduce((sum,s)=>sum+Math.max(0,s.length),0);let remaining=((distance%total)+total)%total;for(const s of segments){if(remaining<=s.length)return {x:s.x+s.dx*remaining,z:s.z+s.dz*remaining};remaining-=s.length;}return {x:segments[0].x,z:segments[0].z};}
function passenger(player,previousTrain,currentTrain,onBoard){return onBoard?{...player,x:player.x+currentTrain.x-previousTrain.x,z:player.z+currentTrain.z-previousTrain.z}:player;}
function pedestrian(state,dt,{scared=false}={}){const speed=scared?4:1.1;return {...state,x:state.x+Math.sin(state.heading)*speed*dt,z:state.z+Math.cos(state.heading)*speed*dt};}
return Object.freeze({car,enter,exit,drive,traffic,train,trainPosition,passenger,pedestrian});
});