/* SD Game-Studio World v3 visual runtime.
 * Renders only nearby in-memory chunks, not the entire 2,048-object world.
 * No external fetching, telemetry, storage or editing of v1/v2 projects. */
(function(){
'use strict';
const World=window.SDLargeWorld,Stream=window.SDWorldStream,doc=document,$=id=>doc.getElementById(id),canvas=$('worldCanvas');
if(!World||!canvas)return;
let world=World.generate(31,8),runtime=World.runtime(world,1),fileLoader=null,projectEpoch=0,gl=null,program=null,locations=null;
let cube=null,cone=null,camera={x:0,z:0,azimuth:.55,elev:.55,distance:37},keys=new Set(),pointer=null;
let lastFrame=0,lastStats=0,lastDraw=0,hasChanges=false;
const tintHex=hex=>[parseInt(hex.slice(1,3),16)/255,parseInt(hex.slice(3,5),16)/255,parseInt(hex.slice(5,7),16)/255];
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm=v=>{const d=Math.hypot(...v)||1;return v.map(x=>x/d);};
function look(eye,target){const z=norm(eye.map((v,i)=>v-target[i])),x=norm(cross([0,1,0],z)),y=cross(z,x);
return[x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1];}
function perspective(fov,aspect,n,f){const q=1/Math.tan(fov/2),t=1/(n-f);return[q/aspect,0,0,0,0,q,0,0,0,0,(f+n)*t,-1,0,0,2*f*n*t,0];}
function shader(type,text){
const s=gl.createShader(type);
if(!s)throw Error('GPU-Shader konnte nicht erstellt werden.');
gl.shaderSource(s,text);gl.compileShader(s);
if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const msg=gl.getShaderInfoLog(s)||'Shaderfehler';gl.deleteShader(s);throw Error(msg);}
return s;
}
function mesh(tris){
const floats=[];
for(const tri of tris){
const n=norm(cross(tri[1].map((x,i)=>x-tri[0][i]),tri[2].map((x,i)=>x-tri[0][i])));
for(const p of tri)floats.push(...p,...n);
}
const b=gl.createBuffer();if(!b)throw Error('GPU-Puffer konnte nicht erstellt werden.');
gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(floats),gl.STATIC_DRAW);
return{buffer:b,count:floats.length/6};
}
function makeCube(){
const sides=[
[[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]],
[[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1]],
[[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,1,-1]],
[[1,-1,1],[1,-1,-1],[1,1,-1],[1,1,1]],
[[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1]],
[[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1]]
];
return mesh(sides.flatMap(s=>[[s[0],s[1],s[2]],[s[0],s[2],s[3]]]));
}
function makeCone(){
const tris=[],segments=9,top=[0,1,0];
for(let i=0;i<segments;i++){const a=i*2*Math.PI/segments,b=(i+1)*2*Math.PI/segments;
tris.push([[Math.cos(a),-1,Math.sin(a)],[Math.cos(b),-1,Math.sin(b)],top]);}
return mesh(tris);
}
function setup(){
gl=canvas.getContext('webgl',{alpha:false,antialias:true,depth:true});
if(!gl)throw Error('WebGL ist für die Großwelt nicht verfügbar.');
const vertex=shader(gl.VERTEX_SHADER,'attribute vec3 position;attribute vec3 normal;uniform mat4 proj,view;uniform vec3 translation,scale;varying vec3 lit;void main(){vec3 p=position*scale+translation;lit=normalize(normal/max(scale,.0001));gl_Position=proj*view*vec4(p,1.);}');
const fragment=shader(gl.FRAGMENT_SHADER,'precision mediump float;uniform vec3 color;varying vec3 lit;void main(){float a=.39+.61*max(dot(normalize(lit),normalize(vec3(.4,.87,.5))),0.);gl_FragColor=vec4(color*a,1.);}');
program=gl.createProgram();gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);
gl.deleteShader(vertex);gl.deleteShader(fragment);
if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('WebGL-Programm konnte nicht verknüpft werden.');
locations={pos:gl.getAttribLocation(program,'position'),normal:gl.getAttribLocation(program,'normal'),proj:gl.getUniformLocation(program,'proj'),
view:gl.getUniformLocation(program,'view'),translation:gl.getUniformLocation(program,'translation'),
scale:gl.getUniformLocation(program,'scale'),color:gl.getUniformLocation(program,'color')};
gl.useProgram(program);gl.enable(gl.DEPTH_TEST);gl.enableVertexAttribArray(locations.pos);gl.enableVertexAttribArray(locations.normal);
cube=makeCube();cone=makeCone();
doc.body.dataset.ready='true';
setStatus('Großwelt bereit · 256 Szenenzellen · 2.048 Objekte in 640 × 640 Einheiten.');
}
function draw(shape,color,x,y,z,sx,sy,sz){
gl.bindBuffer(gl.ARRAY_BUFFER,shape.buffer);
gl.vertexAttribPointer(locations.pos,3,gl.FLOAT,false,24,0);
gl.vertexAttribPointer(locations.normal,3,gl.FLOAT,false,24,12);
gl.uniform3fv(locations.translation,[x,y,z]);
gl.uniform3fv(locations.scale,[sx,sy,sz]);
gl.uniform3fv(locations.color,tintHex(color));
gl.drawArrays(gl.TRIANGLES,0,shape.count);
lastDraw++;
}
function drawObject(o,far){
const {x,z,scale:s,type}=o;
if(type==='box')draw(cube,o.color,x,s,z,s,s,s);
else if(type==='rock')draw(cube,o.color,x,.5*s,z,1.3*s,.55*s,1.1*s);
else if(type==='bush')draw(cube,o.color,x,.45*s,z,.75*s,.55*s,.72*s);
else if(type==='pine'||type==='tree'){
if(!far)draw(cube,'#8e7662',x,1.05*s,z,.23*s,1.05*s,.23*s);
draw(cone,type==='pine'?'#509e83':o.color,x,far?2*s:2.75*s,z,(far?1:1.1)*s,far?1.5*s:1.65*s,(far?1:1.1)*s);
if(!far&&type==='tree')draw(cone,'#6ebc9b',x,3.5*s,z,.7*s,1.05*s,.7*s);
}
}
function updateStats(view){
$('worldObjects').textContent=(fileLoader?fileLoader.manifest.totalObjects:World.total(world)).toLocaleString('de-DE');
$('loadedFileCells').textContent=fileLoader?String(view.loadedCells)+' / '+fileLoader.manifest.cells.length:'–';
$('activeCells').textContent=String(view.activeCells);
$('activeObjects').textContent=String(view.activeObjects);
$('drawnObjects').textContent=String(lastDraw);
$('cameraCoordinates').textContent='X '+camera.x.toFixed(0)+' / Z '+camera.z.toFixed(0);
}
function render(now){
lastFrame=now;
if(!gl||gl.isContextLost())return;
const ratio=Math.min(2,window.devicePixelRatio||1),w=Math.max(1,Math.floor(canvas.clientWidth*ratio)),h=Math.max(1,Math.floor(canvas.clientHeight*ratio));
if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
gl.viewport(0,0,w,h);gl.clearColor(.16,.32,.45,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
const {x,z,azimuth,elev,distance}=camera;
const eye=[x+distance*Math.sin(azimuth)*Math.cos(elev),distance*Math.sin(elev)+11,z+distance*Math.cos(azimuth)*Math.cos(elev)];
gl.useProgram(program);
gl.uniformMatrix4fv(locations.view,false,new Float32Array(look(eye,[x,0,z])));
gl.uniformMatrix4fv(locations.proj,false,new Float32Array(perspective(.9,w/h,.1,210)));
const selection=fileLoader?fileLoader.update(x,z,1):runtime.query(x,z);lastDraw=0;
for(const cell of selection.cells){
const centerX=-World.HALF+cell.cx*World.CHUNK+World.CHUNK/2,
centerZ=-World.HALF+cell.cz*World.CHUNK+World.CHUNK/2;
const ground=cell.ground==='sand'?'#b09a73':cell.ground==='snow'?'#cedce1':'#4f8a72';
draw(cube,ground,centerX,-.42,centerZ,World.CHUNK/2,.40,World.CHUNK/2);
}
for(const object of selection.objects){
const d=Math.hypot(object.x-x,object.z-z);
if(d>95)continue;
drawObject(object,d>47);
}
if(now-lastStats>250){updateStats(selection);lastStats=now;}
}
function movement(dt){
const forward=keys.has('w')||keys.has('arrowup')||keys.has('forward');
const back=keys.has('s')||keys.has('arrowdown')||keys.has('back');
const left=keys.has('a')||keys.has('arrowleft')||keys.has('left');
const right=keys.has('d')||keys.has('arrowright')||keys.has('right');
const dx=(+right-+left),dz=(+back-+forward),m=Math.hypot(dx,dz)||1;
if(dx||dz){
const step=Math.min(.05,dt)*31;
const ca=Math.cos(camera.azimuth),sa=Math.sin(camera.azimuth);
camera.x=clamp(camera.x+(dx*ca+dz*sa)*step/m,-World.HALF+1,World.HALF-1);
camera.z=clamp(camera.z+(-dx*sa+dz*ca)*step/m,-World.HALF+1,World.HALF-1);
}
}
let previous=0;
function tick(now){const dt=previous?(now-previous)/1000:0;previous=now;if(!doc.hidden){movement(dt);render(now);}requestAnimationFrame(tick);}
function setStatus(msg){$('worldStatus').textContent=msg;}
function newWorld(next){
const valid=World.validate(next);
projectEpoch++;
if(fileLoader){fileLoader.dispose();fileLoader=null;}
world=valid;runtime=World.runtime(world,1);camera.x=valid.spawn.x;camera.z=valid.spawn.z;
hasChanges=false;keys.clear();$('worldCells').textContent=String(world.cells.length);
$('saveWorld').disabled=false;$('addTree').disabled=false;$('addRock').disabled=false;
$('streamModeLabel').textContent='DEMO: IN-MEMORY · DATEI-STREAMING VERFÜGBAR';
doc.body.dataset.streamMode='demo';
updateStats(runtime.query(camera.x,camera.z));
}
async function importChunks(list){
const ticket=++projectEpoch;
try{
const selected=Array.from(list||[]);
if(selected.length<2||selected.length>World.GRID*World.GRID+1)
throw Error('Bitte manifest.json und alle zugehörigen Zellendateien auswählen.');
const sources=new Map();let total=0;
for(const f of selected){
if(sources.has(f.name))throw Error('Doppelter Dateiname: '+f.name);
total+=f.size;
if(total>16*1024*1024)throw Error('Dateisatz größer als 16 MiB.');
sources.set(f.name,f);
}
const manifestFile=sources.get('manifest.json');
if(!manifestFile||manifestFile.size>Stream.MAX_MANIFEST)throw Error('manifest.json fehlt oder ist zu groß.');
const manifest=Stream.parseManifest(await manifestFile.text());
if(ticket!==projectEpoch)return;
if(sources.size!==manifest.cells.length+1)throw Error('Der Ordner muss genau Manifest und referenzierte Zellen enthalten.');
const loader=Stream.createLoader(manifest,sources,{capacity:12,concurrency:3,onChange:state=>{
if(state.lastError&&loader===fileLoader)setStatus('Zellendatei abgelehnt: '+state.lastError);
}});
if(ticket!==projectEpoch){loader.dispose();return;}
if(fileLoader)fileLoader.dispose();
fileLoader=loader;world=null;runtime=null;camera.x=manifest.spawn.x;camera.z=manifest.spawn.z;
hasChanges=false;keys.clear();doc.body.dataset.streamMode='files';
$('worldCells').textContent=String(manifest.cells.length);
$('saveWorld').disabled=true;$('addTree').disabled=true;$('addRock').disabled=true;
$('streamModeLabel').textContent='LOKALES DATEI-STREAMING · SCHREIBGESCHÜTZT · MAX. 12 ZELLEN CACHE';
const current=loader.update(camera.x,camera.z,1);
updateStats(current);
setStatus('Datei-Streaming aktiv: '+manifest.cells.length+' Zellen · '+manifest.totalObjects+' Objekte. Gespeicherte Projektdateien bleiben erhalten.');
}catch(err){if(ticket===projectEpoch)setStatus('Datei-Streaming abgelehnt: '+err.message);}
}

function save(){
if(fileLoader){setStatus('Datei-Streaming ist schreibgeschützt. Zum Bearbeiten die Beispielwelt öffnen.');return;}
try{
const data=World.serialize(world),blob=new Blob([data],{type:'application/json;charset=utf-8'}),
url=URL.createObjectURL(blob),link=doc.createElement('a');
link.href=url;link.download='sd-game-large-world-v3.json';link.click();
setTimeout(()=>URL.revokeObjectURL(url),1000);
hasChanges=false;setStatus('Welt als lokale JSON-Datei gespeichert. Keine fremden Projekte verändert.');
}catch(err){setStatus('Speichern fehlgeschlagen: '+err.message);}
}
async function importWorld(file){
if(!file)return;
const ticket=++projectEpoch;
if(file.size>World.MAX_FILE){setStatus('Import abgelehnt: Weltdatei ist zu groß.');return;}
try{
const content=await file.text(),next=World.parse(content);
if(ticket!==projectEpoch)return;
newWorld(next);setStatus('Großwelt v3 geladen. Alte Projekte bleiben unverändert.');
}catch(err){if(ticket===projectEpoch)setStatus('Import abgelehnt: '+err.message);}
}
function add(type){
if(fileLoader){setStatus('Datei-Streaming ist schreibgeschützt.');return;}
try{
const x=clamp(Math.round(camera.x+2),-World.HALF+1,World.HALF-1),
z=clamp(Math.round(camera.z-2),-World.HALF+1,World.HALF-1);
const object=World.add(world,type,x,z);
hasChanges=true;setStatus((type==='tree'?'Baum':'Felsen')+' hinzugefügt · ID '+object.id+'. Export sichert Änderungen.');
updateStats(runtime.query(camera.x,camera.z));
}catch(err){setStatus('Objekt konnte nicht platziert werden: '+err.message);}
}
$('addTree').addEventListener('click',()=>add('tree'));
$('addRock').addEventListener('click',()=>add('rock'));
$('saveWorld').addEventListener('click',save);
$('openWorld').addEventListener('click',()=>$('worldFile').click());
$('openChunkFolder').addEventListener('click',()=>$('chunkFolder').click());
$('openChunkFiles').addEventListener('click',()=>$('chunkFiles').click());
for(const inputId of ['chunkFolder','chunkFiles']){
$(inputId).addEventListener('change',e=>{void importChunks(e.target.files);e.target.value='';});
}
$('worldFile').addEventListener('change',e=>{void importWorld(e.target.files?.[0]);e.target.value='';});
$('resetWorld').addEventListener('click',()=>{
if(hasChanges&&!window.confirm('Nicht exportierte Änderungen an der Großwelt verwerfen?'))return;
newWorld(World.generate(31,8));setStatus('Beispielwelt wiederhergestellt.');
});
$('fullscreenWorld').addEventListener('click',()=>{
doc.body.classList.toggle('world-focus');
$('fullscreenWorld').textContent=doc.body.classList.contains('world-focus')?'↙ Editor':'⤢ Fokus';
});
doc.addEventListener('keydown',event=>{
if(event.altKey||event.ctrlKey||event.metaKey||['INPUT','TEXTAREA','SELECT'].includes(event.target?.tagName))return;
if(event.key==='Escape'&&doc.body.classList.contains('world-focus')){$('fullscreenWorld').click();return;}
if(['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key)){
event.preventDefault();keys.add(event.key.toLowerCase());
}
});
doc.addEventListener('keyup',event=>keys.delete(event.key.toLowerCase()));
window.addEventListener('blur',()=>keys.clear());
canvas.addEventListener('pointerdown',e=>{pointer={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{
if(!pointer)return;
camera.azimuth+=(e.clientX-pointer.x)*.008;
camera.elev=clamp(camera.elev+(pointer.y-e.clientY)*.007,.12,1.36);
pointer={x:e.clientX,y:e.clientY};
});
for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>pointer=null);
canvas.addEventListener('wheel',e=>{e.preventDefault();camera.distance=clamp(camera.distance*(e.deltaY>0?1.08:.92),14,90);},{passive:false});
doc.querySelectorAll('[data-move]').forEach(btn=>{
const name=btn.dataset.move;
btn.addEventListener('pointerdown',e=>{e.preventDefault();keys.add(name);btn.setPointerCapture(e.pointerId);});
for(const evt of ['pointerup','pointercancel','lostpointercapture'])btn.addEventListener(evt,()=>keys.delete(name));
});
canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();setStatus('GPU-Kontext verloren. Seite neu laden.');});
try{setup();newWorld(world);requestAnimationFrame(tick);}
catch(err){doc.body.dataset.ready='error';$('worldError').textContent=err.message;$('worldError').hidden=false;setStatus(err.message);}
})();
