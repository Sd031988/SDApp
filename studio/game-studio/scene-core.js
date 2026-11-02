/* Local scene rules. No DOM, persistent storage, network or eval. */
(function(root,factory){
const api=factory();
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root&&root.document)root.SDGameCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION=1,LIMIT=70,WORLD=19;
const KINDS=Object.freeze(['box','sphere','tree','column','rock','hill']);
const GROUNDS=Object.freeze(['meadow','sand','snow']);
const PALETTE=Object.freeze(['#d7a35c','#5ebbb0','#8fa4e9','#d8797d','#bca3e5','#dbcc97']);
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const numeric=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
function fresh(){return{version:VERSION,name:'Meine erste 3D-Welt',ground:'meadow',objects:[
{id:1,type:'tree',x:-6,z:-5,scale:1.2,color:'#5ebbb0'},
{id:2,type:'tree',x:6,z:-5,scale:1.05,color:'#5ebbb0'},
{id:3,type:'box',x:-3,z:2,scale:1.2,color:'#d7a35c'},
{id:4,type:'sphere',x:3,z:0,scale:1,color:'#8fa4e9'},
{id:5,type:'column',x:6,z:5,scale:1,color:'#bca3e5'},
{id:6,type:'box',x:-6,z:6,scale:1.5,color:'#d8797d'}]};}
function validObject(obj){return obj&&Object.getPrototypeOf(obj)===Object.prototype&&Number.isSafeInteger(obj.id)&&obj.id>0&&obj.id<=10000000&&KINDS.includes(obj.type)&&numeric(obj.x,-WORLD,WORLD)&&numeric(obj.z,-WORLD,WORLD)&&numeric(obj.scale,.4,3)&&PALETTE.includes(obj.color);}
function validate(data){
if(!data||Array.isArray(data)||typeof data!=='object'||data.version!==VERSION||typeof data.name!=='string'||!data.name.trim()||data.name.length>80||!Array.isArray(data.objects)||data.objects.length>LIMIT)throw Error('Ungültige oder zu große Szene.');
const ground=data.ground===undefined?'meadow':data.ground;
if(!GROUNDS.includes(ground))throw Error('Unbekannter Landschaftstyp.');
const seen=new Set();
for(const obj of data.objects){if(!validObject(obj)||seen.has(obj.id))throw Error('Ungültiges Objekt oder doppelte ID.');seen.add(obj.id);}
return{version:VERSION,name:data.name,ground,objects:data.objects.map(({id,type,x,z,scale,color})=>({id,type,x,z,scale,color}))};}
function parse(source){
if(typeof source!=='string'||source.length>60000)throw Error('Szenendatei zu groß.');
let data;try{data=JSON.parse(source)}catch(_){throw Error('Die Datei enthält kein gültiges JSON.');}
return validate(data);}
function serialize(scene){return JSON.stringify(validate(scene),null,2)+'\n';}
function add(scene,type,x=0,z=0){
if(!KINDS.includes(type))throw Error('Objekttyp nicht unterstützt.');
if(scene.objects.length>=LIMIT)throw Error('Maximal 70 Objekte erlaubt.');
const id=Math.max(0,...scene.objects.map(o=>o.id))+1;
if(id>10000000)throw Error('ID-Grenze erreicht.');
const obj={id,type,x:clamp(x,-WORLD,WORLD),z:clamp(z,-WORLD,WORLD),scale:1,color:(type==='tree'||type==='hill')?'#5ebbb0':type==='rock'?'#bca3e5':PALETTE[(id-1)%PALETTE.length]};
scene.objects.push(obj);return obj;}
function update(scene,id,values){
const obj=scene.objects.find(o=>o.id===id);if(!obj)throw Error('Objekt nicht gefunden.');
for(const [key,value] of Object.entries(values)){
if(!['x','z','scale','color'].includes(key))throw Error('Eigenschaft nicht unterstützt.');
if(key==='color'?!PALETTE.includes(value):!numeric(value,key==='scale'?.4:-WORLD,key==='scale'?3:WORLD))throw Error('Ungültiger Wert für '+key+'.');
}
Object.assign(obj,values);return obj;}
function remove(scene,id){const before=scene.objects.length;scene.objects=scene.objects.filter(o=>o.id!==id);return before!==scene.objects.length;}
function setGround(scene,ground){if(!GROUNDS.includes(ground))throw Error('Unbekannter Landschaftstyp.');scene.ground=ground;return scene;}
function duplicate(scene,id){
const original=scene.objects.find(o=>o.id===id);
if(!original)throw Error('Objekt nicht gefunden.');
const copy=add(scene,original.type,original.x+1.5,original.z+1.5);
return update(scene,copy.id,{scale:original.scale,color:original.color});
}
function createHistory(initial,capacity=40){
if(!Number.isSafeInteger(capacity)||capacity<2||capacity>100)throw Error('Ungültige Verlaufslänge.');
let snapshots=[serialize(initial)],index=0;
return Object.freeze({
record(next){
const state=serialize(next);
if(state===snapshots[index])return false;
snapshots=snapshots.slice(0,index+1);
snapshots.push(state);
if(snapshots.length>capacity)snapshots.shift();
index=snapshots.length-1;
return true;
},
undo(){if(index===0)return null;return parse(snapshots[--index]);},
redo(){if(index>=snapshots.length-1)return null;return parse(snapshots[++index]);},
reset(next){snapshots=[serialize(next)];index=0;},
get canUndo(){return index>0;},
get canRedo(){return index<snapshots.length-1;}
});
}
function collides(x,z,objects){
if(Math.abs(x)>WORLD||Math.abs(z)>WORLD)return true;
return objects.some(o=>{const r=o.type==='tree'?.42*o.scale:o.type==='hill'?1.65*o.scale:o.type==='sphere'?.85*o.scale:o.type==='rock'?.76*o.scale:.72*o.scale;const dx=x-o.x,dz=z-o.z;return dx*dx+dz*dz<(r+.38)**2;});}
function move(player,keys,dt,objects,azimuth=0){
const k=keys||{};let dx=(+!!k.right-+!!k.left),dz=(+!!k.back-+!!k.forward);
const len=Math.hypot(dx,dz)||1;dx/=len;dz/=len;
const ca=Math.cos(azimuth),sa=Math.sin(azimuth),step=5*clamp(dt,0,.05);
const vx=(dx*ca+dz*sa)*step,vz=(-dx*sa+dz*ca)*step;
if(!collides(player.x+vx,player.z,objects))player.x+=vx;
if(!collides(player.x,player.z+vz,objects))player.z+=vz;
if(k.jump&&player.y<=.001)player.vy=6;
player.vy-=15*clamp(dt,0,.05);
player.y=Math.max(0,player.y+player.vy*clamp(dt,0,.05));
if(player.y===0)player.vy=0;return player;}
return Object.freeze({VERSION,LIMIT,WORLD,KINDS,GROUNDS,PALETTE,fresh,validate,parse,serialize,add,update,remove,setGround,duplicate,createHistory,collides,move});
});
