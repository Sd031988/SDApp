/* SD Game-Studio / Project Vanguard: deterministic gameplay layer.
 * Independent of the DOM, WebGL, storage and external networks. */
(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root&&root.document)root.SDVanguard=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const LIMIT=318,START={x:0,z:0};
const BEACONS=Object.freeze([
  Object.freeze({id:'north',name:'Nord-Relais',x:23,z:-30}),
  Object.freeze({id:'west',name:'West-Relais',x:-47,z:7}),
  Object.freeze({id:'east',name:'Ost-Relais',x:59,z:42})
]);
const SPAWNS=Object.freeze([
  [17,-25],[27,-38],[-41,5],[-54,12],[55,37],[65,47],[-12,27]
]);
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
function makeState(){
  return{
    time:0,phase:'playing',message:'Aktiviere alle drei Relais. Die Drohnen bewachen die Sektoren.',
    hero:{x:START.x,z:START.z,y:0,vy:0,hp:100,stamina:100,heading:Math.PI,attackCooldown:0,invulnerability:0,animation:'idle'},
    beacons:BEACONS.map(b=>({...b,active:false})),
    enemies:SPAWNS.map(([x,z],i)=>({id:i,x,z,originX:x,originZ:z,hp:100,heading:0,attackCooldown:0,phase:i*.83})),
    kills:0,events:[],lastAttack:false
  };
}
function moveVector(input,heading){
 const dx=Number(!!input.right)-Number(!!input.left),dz=Number(!!input.back)-Number(!!input.forward);
 const length=Math.hypot(dx,dz)||1,ca=Math.cos(heading),sa=Math.sin(heading);
 return{x:(dx*ca+dz*sa)/length,z:(-dx*sa+dz*ca)/length,moving:dx!==0||dz!==0};
}
function isBlocked(x,z,objects){
 if(!Number.isFinite(x)||!Number.isFinite(z)||Math.abs(x)>LIMIT||Math.abs(z)>LIMIT)return true;
 return objects.some(o=>{
   if(o.type==='bush')return false;
   const radius=o.type==='rock'?1.18*o.scale:o.type==='box'?.93*o.scale:.62*o.scale;
   return Math.hypot(x-o.x,z-o.z)<radius+.48;
 });
}
function emit(state,type,text){state.events.push({type,text});state.message=text;}
function attack(state){
 const hero=state.hero;
 if(hero.attackCooldown>0||state.phase!=='playing')return;
 hero.attackCooldown=.62;
 let hit=false;
 for(const e of state.enemies){
   if(e.hp<=0||distance(hero,e)>4.6)continue;
   const toward=Math.atan2(e.x-hero.x,e.z-hero.z);
   const diff=Math.atan2(Math.sin(toward-hero.heading),Math.cos(toward-hero.heading));
   if(Math.abs(diff)>1.16)continue;
   e.hp=Math.max(0,e.hp-55);hit=true;
   if(!e.hp){state.kills++;emit(state,'kill','Drohne ausgeschaltet.');}
 }
 state.events.push({type:hit?'hit':'miss',text:hit?'Treffer':'Angriff ohne Treffer'});
}
function interact(state){
 if(state.phase!=='playing')return;
 for(const b of state.beacons){
  if(!b.active&&distance(state.hero,b)<4.0){
    b.active=true;
    emit(state,'beacon',b.name+' aktiviert · '+state.beacons.filter(x=>x.active).length+'/3');
    return;
  }
 }
 if(state.beacons.every(b=>b.active)&&distance(state.hero,START)<5){
   state.phase='won';emit(state,'win','Mission abgeschlossen! Alle Relais gesichert.');
 }
}
function step(state,input,dt,heightAt,objects=[]){
 if(!state||!state.hero||typeof heightAt!=='function')throw Error('Ungültiger Spielzustand.');
 if(!Number.isFinite(dt)||dt<0)throw Error('Ungültige Zeitdifferenz.');
 if(!Array.isArray(objects))throw Error('Objektliste fehlt.');
 state.events=[];
 if(state.phase!=='playing')return state;
 const delta=clamp(dt,0,.05),hero=state.hero;
 state.time+=delta;
 hero.attackCooldown=Math.max(0,hero.attackCooldown-delta);
 hero.invulnerability=Math.max(0,hero.invulnerability-delta);
 const move=moveVector(input,input.cameraAzimuth||0);
 const sprint=!!input.sprint&&move.moving&&hero.stamina>1;
 hero.stamina=clamp(hero.stamina+(sprint?-27:19)*delta,0,100);
 const speed=sprint?9.5:5.7;
 if(move.moving){
   const nx=hero.x+move.x*speed*delta,nz=hero.z+move.z*speed*delta;
   if(!isBlocked(nx,hero.z,objects)&&(hero.y>.01||Math.abs(heightAt(nx,hero.z)-heightAt(hero.x,hero.z))<.85))hero.x=nx;
   if(!isBlocked(hero.x,nz,objects)&&(hero.y>.01||Math.abs(heightAt(hero.x,nz)-heightAt(hero.x,hero.z))<.85))hero.z=nz;
   const desired=Math.atan2(move.x,move.z),angle=Math.atan2(Math.sin(desired-hero.heading),Math.cos(desired-hero.heading));
   hero.heading+=angle*Math.min(1,delta*13);
 }
 if(input.jump&&hero.y<=0){hero.vy=7.4;hero.y=.001;}
 hero.vy-=20*delta;
 hero.y=Math.max(0,hero.y+hero.vy*delta);
 if(hero.y===0)hero.vy=0;
 hero.animation=hero.y>.01?'jump':hero.attackCooldown>.40?'attack':sprint?'sprint':move.moving?'run':'idle';
 if(input.attack&&!state.lastAttack)attack(state);
 state.lastAttack=!!input.attack;
 if(input.interact)interact(state);
 for(const enemy of state.enemies){
   if(enemy.hp<=0)continue;
   enemy.attackCooldown=Math.max(0,enemy.attackCooldown-delta);
   const d=distance(enemy,hero),alert=d<19;
   const t=state.time*.52+enemy.phase;
   const target=alert?hero:{x:enemy.originX+Math.sin(t)*5,z:enemy.originZ+Math.cos(t)*5};
   const vx=target.x-enemy.x,vz=target.z-enemy.z,length=Math.hypot(vx,vz)||1;
   if(length>1.7){const speed=alert?3.45:1.6,dx=vx/length*speed*delta,dz=vz/length*speed*delta;
     if(!isBlocked(enemy.x+dx,enemy.z+dz,objects)){enemy.x+=dx;enemy.z+=dz;}
   }
   if(length>.01)enemy.heading=Math.atan2(vx,vz);
   if(d<2.35&&enemy.attackCooldown===0&&hero.invulnerability===0){
      hero.hp=Math.max(0,hero.hp-14);hero.invulnerability=1.05;enemy.attackCooldown=1.45;
      emit(state,'damage','Drohnenangriff! Deckung suchen.');
      if(hero.hp<=0){state.phase='lost';emit(state,'lose','Mission gescheitert. Starte einen neuen Versuch.');}
   }
 }
 return state;
}
function nearbyObjective(state){
 const active=state.beacons.filter(b=>b.active).length;
 if(active===3)return{label:'Zur Extraktion',x:0,z:0,done:3};
 const b=state.beacons.filter(b=>!b.active).sort((a,b)=>distance(a,state.hero)-distance(b,state.hero))[0];
 return{label:b.name,x:b.x,z:b.z,done:active};
}
return Object.freeze({BEACONS,START,LIMIT,makeState,moveVector,isBlocked,step,interact,attack,nearbyObjective,distance});
});
