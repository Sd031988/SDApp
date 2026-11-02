/* Local scene rules. No DOM, persistent storage, network or eval. */
(function(root,factory){
const api=factory();
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root&&root.document)root.SDGameCore=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION=1,LIMIT=70,WORLD=19;
const KINDS=Object.freeze(['box','sphere','tree','column','rock','hill','pine','bush','flower','crystal']);
const NATURE_GROUPS=Object.freeze(['grove','garden']);
const GROUNDS=Object.freeze(['meadow','sand','snow']);
const LIGHTS=Object.freeze(['dawn','day','sunset','night']);
const AVATARS=Object.freeze(['explorer','sport','night']);
const GRID=17,STEP=40/(GRID-1),MAX_HEIGHT=3,TOOLS=Object.freeze(['raise','lower','smooth']);
const PALETTE=Object.freeze(['#d7a35c','#5ebbb0','#8fa4e9','#d8797d','#bca3e5','#dbcc97']);
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const numeric=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
function fresh(){return{version:VERSION,name:'Meine erste 3D-Welt',ground:'meadow',lighting:'day',avatar:'explorer',objects:[
{id:1,type:'tree',x:-6,z:-5,scale:1.2,color:'#5ebbb0'},
{id:2,type:'tree',x:6,z:-5,scale:1.05,color:'#5ebbb0'},
{id:3,type:'box',x:-3,z:2,scale:1.2,color:'#d7a35c'},
{id:4,type:'sphere',x:3,z:0,scale:1,color:'#8fa4e9'},
{id:5,type:'column',x:6,z:5,scale:1,color:'#bca3e5'},
{id:6,type:'box',x:-6,z:6,scale:1.5,color:'#d8797d'}],terrain:Array(GRID*GRID).fill(0)};}
function validObject(obj){return obj&&Object.getPrototypeOf(obj)===Object.prototype&&Number.isSafeInteger(obj.id)&&obj.id>0&&obj.id<=10000000&&KINDS.includes(obj.type)&&numeric(obj.x,-WORLD,WORLD)&&numeric(obj.z,-WORLD,WORLD)&&numeric(obj.scale,.4,3)&&PALETTE.includes(obj.color);}
function validate(data){
if(!data||Array.isArray(data)||typeof data!=='object'||data.version!==VERSION||typeof data.name!=='string'||!data.name.trim()||data.name.length>80||!Array.isArray(data.objects)||data.objects.length>LIMIT)throw Error('Ungültige oder zu große Szene.');
const ground=data.ground===undefined?'meadow':data.ground;
if(!GROUNDS.includes(ground))throw Error('Unbekannter Landschaftstyp.');
const lighting=data.lighting===undefined?'day':data.lighting;
if(!LIGHTS.includes(lighting))throw Error('Unbekannte Tageszeit.');
const avatar=data.avatar===undefined?'explorer':data.avatar;
if(!AVATARS.includes(avatar))throw Error('Unbekannte Spielfigur.');
const terrain=data.terrain===undefined?Array(GRID*GRID).fill(0):data.terrain;
if(!Array.isArray(terrain)||terrain.length!==GRID*GRID||!terrain.every(h=>numeric(h,0,MAX_HEIGHT)))throw Error('Ungültiges Höhenprofil des Geländes.');
const seen=new Set();
for(const obj of data.objects){if(!validObject(obj)||seen.has(obj.id))throw Error('Ungültiges Objekt oder doppelte ID.');seen.add(obj.id);}
return{version:VERSION,name:data.name,ground,lighting,avatar,objects:data.objects.map(({id,type,x,z,scale,color})=>({id,type,x,z,scale,color})),terrain:terrain.slice()};}
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
const obj={id,type,x:clamp(x,-WORLD,WORLD),z:clamp(z,-WORLD,WORLD),scale:1,color:(type==='tree'||type==='pine'||type==='bush'||type==='hill')?'#5ebbb0':type==='rock'?'#bca3e5':type==='flower'?'#d8797d':PALETTE[(id-1)%PALETTE.length]};
scene.objects.push(obj);return obj;}
function plantGroup(scene,group,x=0,z=0){
if(!NATURE_GROUPS.includes(group)||!numeric(x,-WORLD,WORLD)||!numeric(z,-WORLD,WORLD))throw Error('Ungültige Naturgruppe oder Position.');
const layouts={
grove:[['pine',-3,-2,1.1],['tree',1.5,-3,1],['pine',3,1,.9],['bush',-1,2,1.25]],
garden:[['flower',-2,-1,.9],['flower',0,-2,1.1],['flower',2,-1,.9],['bush',0,2,.8],['flower',-2.3,2.2,.8]]
};
const plan=layouts[group];
if(scene.objects.length+plan.length>LIMIT)throw Error('Maximal 70 Objekte erlaubt.');
const maxId=Math.max(0,...scene.objects.map(o=>o.id));
if(maxId+plan.length>10000000)throw Error('ID-Grenze erreicht.');
if(plan.some(([,dx,dz])=>Math.abs(x+dx)>WORLD||Math.abs(z+dz)>WORLD))throw Error('Naturgruppe liegt außerhalb der Welt.');
return plan.map(([type,dx,dz,scale])=>{
const object=add(scene,type,Math.round((x+dx)*10)/10,Math.round((z+dz)*10)/10);
return update(scene,object.id,{scale});
});
}
function update(scene,id,values){
const obj=scene.objects.find(o=>o.id===id);if(!obj)throw Error('Objekt nicht gefunden.');
for(const [key,value] of Object.entries(values)){
if(!['x','z','scale','color'].includes(key))throw Error('Eigenschaft nicht unterstützt.');
if(key==='color'?!PALETTE.includes(value):!numeric(value,key==='scale'?.4:-WORLD,key==='scale'?3:WORLD))throw Error('Ungültiger Wert für '+key+'.');
}
Object.assign(obj,values);return obj;}
function remove(scene,id){const before=scene.objects.length;scene.objects=scene.objects.filter(o=>o.id!==id);return before!==scene.objects.length;}
function setGround(scene,ground){if(!GROUNDS.includes(ground))throw Error('Unbekannter Landschaftstyp.');scene.ground=ground;return scene;}
function setLighting(scene,lighting){if(!LIGHTS.includes(lighting))throw Error('Unbekannte Tageszeit.');scene.lighting=lighting;return scene;}
function setAvatar(scene,avatar){if(!AVATARS.includes(avatar))throw Error('Unbekannte Spielfigur.');scene.avatar=avatar;return scene;}
function duplicate(scene,id){
const original=scene.objects.find(o=>o.id===id);
if(!original)throw Error('Objekt nicht gefunden.');
const copy=add(scene,original.type,original.x+1.5,original.z+1.5);
return update(scene,copy.id,{scale:original.scale,color:original.color});
}
function terrainHeight(terrain,x,z){
if(!terrain)return 0;
const ix=clamp((x+20)/STEP,0,GRID-1),iz=clamp((z+20)/STEP,0,GRID-1);
const col=Math.min(GRID-2,Math.floor(ix)),row=Math.min(GRID-2,Math.floor(iz));
const u=ix-col,v=iz-row,n=row*GRID+col;
return terrain[n]*(1-u)*(1-v)+terrain[n+1]*u*(1-v)+terrain[n+GRID]*(1-u)*v+terrain[n+GRID+1]*u*v;
}
function sculpt(scene,tool,x,z,radius=3.5,strength=.35){
if(!TOOLS.includes(tool)||!numeric(x,-20,20)||!numeric(z,-20,20)||!numeric(radius,2.5,7)||!numeric(strength,.05,1))throw Error('Ungültiger Geländepinsel.');
const previous=scene.terrain||Array(GRID*GRID).fill(0),next=previous.slice();
let changed=false;
for(let row=0;row<GRID;row++)for(let col=0;col<GRID;col++){
const distance=Math.hypot(-20+col*STEP-x,-20+row*STEP-z);
if(distance>=radius)continue;
const p=row*GRID+col,weight=(1-distance/radius)*strength;
let h=previous[p];
if(tool==='raise')h+=weight;
else if(tool==='lower')h-=weight;
else{
let total=0,n=0;
for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){
const r=row+dz,c=col+dx;
if(r>=0&&r<GRID&&c>=0&&c<GRID){total+=previous[r*GRID+c];n++;}
}
h+=(total/n-h)*weight;
}
const value=Math.round(clamp(h,0,MAX_HEIGHT)*100)/100;
if(value!==previous[p]){next[p]=value;changed=true;}
}
if(changed)scene.terrain=next;
return changed;
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
return objects.some(o=>{if(o.type==='flower'||o.type==='crystal')return false;const r=o.type==='tree'||o.type==='pine'?.42*o.scale:o.type==='bush'?.35*o.scale:o.type==='hill'?1.65*o.scale:o.type==='sphere'?.85*o.scale:o.type==='rock'?.76*o.scale:.72*o.scale;const dx=x-o.x,dz=z-o.z;return dx*dx+dz*dz<(r+.38)**2;});}
function collectNearby(player,objects,collected,radius=1.2){
if(!player||!numeric(player.x,-WORLD,WORLD)||!numeric(player.z,-WORLD,WORLD)||
!Array.isArray(objects)||!(collected instanceof Set)||!numeric(radius,.2,3))throw Error('Ungültige Sammelprüfung.');
return objects.filter(o=>o.type==='crystal'&&!collected.has(o.id)&&Math.hypot(player.x-o.x,player.z-o.z)<=radius*o.scale).map(o=>o.id);
}
function direction(keys,azimuth=0){
const k=keys||{},dx=(+!!k.right-+!!k.left),dz=(+!!k.back-+!!k.forward);
const len=Math.hypot(dx,dz),magnitude=len||1,ca=Math.cos(azimuth),sa=Math.sin(azimuth);
return{x:(dx*ca+dz*sa)/magnitude,z:(-dx*sa+dz*ca)/magnitude,moving:len>0};
}
function move(player,keys,dt,objects,azimuth=0){
const vector=direction(keys,azimuth),step=5*clamp(dt,0,.05);
const vx=vector.x*step,vz=vector.z*step;
const k=keys||{};
if(!collides(player.x+vx,player.z,objects))player.x+=vx;
if(!collides(player.x,player.z+vz,objects))player.z+=vz;
if(k.jump&&player.y<=.001)player.vy=6;
player.vy-=15*clamp(dt,0,.05);
player.y=Math.max(0,player.y+player.vy*clamp(dt,0,.05));
if(player.y===0)player.vy=0;return player;}
return Object.freeze({VERSION,LIMIT,WORLD,GRID,STEP,MAX_HEIGHT,KINDS,NATURE_GROUPS,GROUNDS,LIGHTS,AVATARS,TOOLS,PALETTE,fresh,validate,parse,serialize,add,plantGroup,update,remove,setGround,setLighting,setAvatar,duplicate,terrainHeight,sculpt,createHistory,collides,collectNearby,direction,move});
});
