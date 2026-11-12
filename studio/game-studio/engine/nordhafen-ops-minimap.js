/* Nordhafen Ops: lightweight in-game city minimap.
 * Owns only its canvas pixels; never modifies Babylon game state.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.SDNordhafenOpsMinimap=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
function project(position,worldSize=512,pixels=176,padding=9){
 if(!position||!Number.isFinite(position.x)||!Number.isFinite(position.z))return null;
 const s=(pixels-2*padding)/worldSize;
 return {x:padding+clamp(position.x,0,worldSize)*s,
  y:padding+clamp(position.z,0,worldSize)*s};
}
function create({canvas,worldSize=512}={}){
 if(!canvas||!Number.isFinite(worldSize)||worldSize<192)throw new TypeError('minimap needs a canvas and city size');
 const ctx=canvas.getContext('2d');
 if(!ctx)throw new Error('minimap canvas 2D unavailable');
 const size=canvas.width||176,padding=9,inner=size-2*padding;
 let disposed=false;
 function dot(p,r,color){
  const point=project(p,worldSize,size,padding);if(!point)return;
  ctx.beginPath();ctx.arc(point.x,point.y,r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
 }
 function draw({player,goal=null,traffic=[],heading=0,objective='',zone=null}={}){
  if(disposed||!player)return false;
  ctx.clearRect(0,0,size,size);ctx.fillStyle='#153026';ctx.fillRect(0,0,size,size);
  ctx.fillStyle='#275044';ctx.fillRect(padding,padding,inner,inner);
  // Ground texture streets follow 64m cells; draw map lanes at their real positions.
  ctx.strokeStyle='#687580';ctx.lineWidth=3;
  for(let road=6.5;road<=worldSize;road+=64){
   const t=padding+road/worldSize*inner;
   ctx.beginPath();ctx.moveTo(t,padding);ctx.lineTo(t,size-padding);ctx.stroke();
   ctx.beginPath();ctx.moveTo(padding,t);ctx.lineTo(size-padding,t);ctx.stroke();
  }
  ctx.strokeStyle='#aac4c9';ctx.lineWidth=1;
  ctx.strokeRect(padding,padding,inner,inner);
  if(zone?.center&&Number.isFinite(zone.radius)){const center=project(zone.center,worldSize,size,padding),radius=Math.max(2,zone.radius/worldSize*inner);if(center){ctx.beginPath();ctx.arc(center.x,center.y,radius,0,Math.PI*2);ctx.fillStyle='rgba(238,73,64,.08)';ctx.fill();ctx.strokeStyle='#ff6258';ctx.lineWidth=2;ctx.setLineDash([5,3]);ctx.stroke();ctx.setLineDash([]);}}
  for(const car of traffic.slice(0,24))dot(car,2.1,'#77d7ef');
  if(goal){dot(goal,6,'#fee27b');dot(goal,2.5,'#202a38');}
  const current=project(player,worldSize,size,padding);
  if(current){
   ctx.save();ctx.translate(current.x,current.y);
   ctx.rotate(Number.isFinite(heading)?-heading:0);
   ctx.beginPath();ctx.moveTo(0,-7);ctx.lineTo(5,5);ctx.lineTo(-5,5);ctx.closePath();
   ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle='#112c40';ctx.lineWidth=1.3;ctx.stroke();
   ctx.restore();
  }
  ctx.fillStyle='#f0f6f9';ctx.font='bold 11px system-ui';ctx.fillText('N',size-17,14);
  // Avoid covering the map with long mission names; HUD holds the full text.
  if(objective){ctx.fillStyle='#122e3c';ctx.fillRect(4,size-19,size-8,15);
   ctx.fillStyle='#ffe39b';ctx.font='10px system-ui';ctx.fillText(String(objective).slice(0,24),8,size-8);}
  return true;
 }
 function dispose(){disposed=true;ctx.clearRect(0,0,size,size);}
 return Object.freeze({draw,dispose,get disposed(){return disposed;}});
}
return Object.freeze({project,create});
});
