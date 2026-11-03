/* SD Game-Studio: chunked world v3 (first scalable scene/runtime foundation).
 * Pure deterministic world model; not a GPU renderer or disk streaming.
 * Legacy v1/v2 project files are never modified by this module. */
(function(root,factory){
const api=factory();
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root&&root.document)root.SDLargeWorld=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const VERSION=3,CHUNK=40,GRID=16,HALF=GRID*CHUNK/2;
const MAX_OBJECTS=8192,MAX_PER_CELL=64,MAX_FILE=2500000;
const KINDS=Object.freeze(['box','tree','pine','rock','bush']);
const GROUNDS=Object.freeze(['meadow','sand','snow']);
const COLORS=Object.freeze(['#78bca0','#c8a77a','#a1aee2','#df897d','#b9a4d6']);
const validNum=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
const validInt=(v,min,max)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
function fail(message){throw Error('Großwelt v3: '+message);}
function cellAt(x,z){
if(!validNum(x,-HALF,HALF)||!validNum(z,-HALF,HALF))fail('Koordinate außerhalb der Welt.');
const cx=clamp(Math.floor((x+HALF)/CHUNK),0,GRID-1);
const cz=clamp(Math.floor((z+HALF)/CHUNK),0,GRID-1);
return{cx,cz};
}
const key=(cx,cz)=>cx+':'+cz;
const hash=(seed,cx,cz,i)=>{
let h=(seed ^ Math.imul(cx+11,0x9e3779b1) ^ Math.imul(cz+17,0x85ebca6b) ^ Math.imul(i+31,0xc2b2ae35))>>>0;
h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;h=Math.imul(h,0x846ca68b);h^=h>>>16;
return(h>>>0)/4294967296;
};
function generate(seed=31,density=8){
if(!validInt(seed,1,2147483647)||!validInt(density,0,32))fail('Ungültiger Weltgenerator.');
let nextId=1;
const cells=[];
for(let cz=0;cz<GRID;cz++)for(let cx=0;cx<GRID;cx++){
const objects=[];
for(let i=0;i<density;i++){
const rnd=hash(seed,cx,cz,i),u=(hash(seed+5,cx,cz,i)*.90+.05)*CHUNK,
v=(hash(seed+23,cx,cz,i)*.90+.05)*CHUNK;
objects.push({id:nextId++,type:KINDS[Math.floor(rnd*KINDS.length)],
x:Math.round((-HALF+cx*CHUNK+u)*100)/100,
z:Math.round((-HALF+cz*CHUNK+v)*100)/100,
scale:Math.round((.6+hash(seed+47,cx,cz,i)*.8)*100)/100,
color:COLORS[Math.floor(hash(seed+7,cx,cz,i)*COLORS.length)]});
}
cells.push({cx,cz,ground:GROUNDS[Math.floor(hash(seed+71,cx,cz,0)*GROUNDS.length)],objects});
}
return{version:VERSION,name:'Meine große Spielwelt',size:GRID*CHUNK,cellSize:CHUNK,seed,spawn:{x:0,z:0},cells};
}
function validate(source){
if(!source||typeof source!=='object'||Array.isArray(source)||
source.version!==VERSION||typeof source.name!=='string'||!source.name.trim()||source.name.length>80||
source.size!==GRID*CHUNK||source.cellSize!==CHUNK||!validInt(source.seed,1,2147483647)||
!source.spawn||!validNum(source.spawn.x,-HALF,HALF)||!validNum(source.spawn.z,-HALF,HALF)||
!Array.isArray(source.cells)||source.cells.length>GRID*GRID)fail('Ungültige Weltdefinition.');
let count=0;
const allIds=new Set(),allCells=new Set(),cells=[];
for(const cell of source.cells){
if(!cell||!validInt(cell.cx,0,GRID-1)||!validInt(cell.cz,0,GRID-1)||
!GROUNDS.includes(cell.ground)||!Array.isArray(cell.objects)||cell.objects.length>MAX_PER_CELL)fail('Ungültige Szenenzelle.');
const id=key(cell.cx,cell.cz);
if(allCells.has(id))fail('Doppelte Szenenzelle.');
allCells.add(id);
const objects=[];
for(const obj of cell.objects){
if(!obj||!validInt(obj.id,1,10000000)||allIds.has(obj.id)||
!KINDS.includes(obj.type)||!validNum(obj.x,-HALF,HALF)||!validNum(obj.z,-HALF,HALF)||
!validNum(obj.scale,.4,3)||!COLORS.includes(obj.color)||
key(cellAt(obj.x,obj.z).cx,cellAt(obj.x,obj.z).cz)!==id)fail('Ungültiges Objekt oder falsche Zelle.');
allIds.add(obj.id);
objects.push({id:obj.id,type:obj.type,x:obj.x,z:obj.z,scale:obj.scale,color:obj.color});
count++;
if(count>MAX_OBJECTS)fail('Maximal 8192 Objekte in der gesamten Welt.');
}
cells.push({cx:cell.cx,cz:cell.cz,ground:cell.ground,objects});
}
return{version:VERSION,name:source.name,size:GRID*CHUNK,cellSize:CHUNK,seed:source.seed,
spawn:{x:source.spawn.x,z:source.spawn.z},cells};
}
function serialize(world){
const out=JSON.stringify(validate(world),null,2)+'\n';
if(out.length>MAX_FILE)fail('Projektdatei größer als 2,5 MB.');
return out;
}
function parse(text){
if(typeof text!=='string'||text.length>MAX_FILE)fail('Projektdatei zu groß.');
let data;
try{data=JSON.parse(text);}catch(_){fail('Ungültige JSON-Daten.');}
return validate(data);
}
function total(world){return world.cells.reduce((n,c)=>n+c.objects.length,0);}
function nearby(world,x,z,radius=1){
if(!validInt(radius,0,3))fail('Ungültiger aktiver Zellenradius.');
const at=cellAt(x,z),active=[];
for(const c of world.cells)if(Math.abs(c.cx-at.cx)<=radius&&Math.abs(c.cz-at.cz)<=radius)
active.push(c);
active.sort((a,b)=>(a.cx-at.cx)**2+(a.cz-at.cz)**2-( (b.cx-at.cx)**2+(b.cz-at.cz)**2));
return {center:at,cells:active,objects:active.flatMap(c=>c.objects),
activeCells:active.length,activeObjects:active.reduce((n,c)=>n+c.objects.length,0),totalObjects:total(world)};
}
function add(world,type,x,z){
if(!KINDS.includes(type))fail('Objekttyp nicht unterstützt.');
const p=cellAt(x,z),cell=world.cells.find(c=>c.cx===p.cx&&c.cz===p.cz);
if(!cell)fail('Szenenzelle fehlt.');
if(cell.objects.length>=MAX_PER_CELL||total(world)>=MAX_OBJECTS)fail('Szenenzellen- oder Weltlimit erreicht.');
const id=Math.max(0,...world.cells.flatMap(c=>c.objects.map(o=>o.id)))+1;
if(id>10000000)fail('Objekt-ID-Grenze erreicht.');
const obj={id,type,x,z,scale:1,color:COLORS[(id-1)%COLORS.length]};
cell.objects.push(obj);
return obj;
}
function remove(world,id){
for(const cell of world.cells){
const index=cell.objects.findIndex(o=>o.id===id);
if(index>=0){cell.objects.splice(index,1);return true;}
}
return false;
}
function shift(world,id,x,z){
const target=cellAt(x,z);
let source=null,obj=null;
for(const cell of world.cells){obj=cell.objects.find(o=>o.id===id);if(obj){source=cell;break;}}
if(!source)fail('Objekt fehlt.');
const next=world.cells.find(c=>c.cx===target.cx&&c.cz===target.cz);
if(!next)fail('Zielzelle fehlt.');
if(source!==next&&next.objects.length>=MAX_PER_CELL)fail('Zielzelle ist voll.');
if(source!==next){source.objects=source.objects.filter(o=>o.id!==id);next.objects.push(obj);}
obj.x=x;obj.z=z;
return obj;
}
function runtime(world,radius=1){
if(!validInt(radius,0,3))fail('Ungültiger aktiver Zellenradius.');
const cellMap=new Map(world.cells.map(c=>[key(c.cx,c.cz),c]));
let prev=new Set(),entered=0,exited=0;
return Object.freeze({
query(x,z){
const at=cellAt(x,z),current=new Set(),cells=[],objects=[];
for(let dz=-radius;dz<=radius;dz++)for(let dx=-radius;dx<=radius;dx++){
const c=cellMap.get(key(at.cx+dx,at.cz+dz));
if(c){current.add(key(c.cx,c.cz));cells.push(c);objects.push(...c.objects);}
}
entered=0;exited=0;
for(const k of current)if(!prev.has(k))entered++;
for(const k of prev)if(!current.has(k))exited++;
prev=current;
return{center:at,cells,objects,activeCells:cells.length,activeObjects:objects.length,
totalObjects:total(world),entered,exited};
},
reset(){prev=new Set();entered=0;exited=0;}
});
}
return Object.freeze({VERSION,CHUNK,GRID,HALF,MAX_OBJECTS,MAX_PER_CELL,MAX_FILE,KINDS,GROUNDS,COLORS,cellAt,generate,validate,serialize,parse,total,nearby,add,remove,shift,runtime});
});
