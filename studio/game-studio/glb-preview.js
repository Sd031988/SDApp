/* Local GLB model preview for SD Game-Studio. WebGL resources are isolated
 * from the scene editor and are released on replacement or clearing. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const canvas=$('glbPreview'),picker=$('glbFile');
if(!canvas||!picker||!window.SDGLB)return;
const info=$('glbInfo'),placeholder=$('glbPlaceholder'),wrap=$('glbPreviewWrap'),clear=$('glbClear'),place=$('glbPlace');
let importBytes=null,importName='';
let gl=null,program=null,locations=null,buffers=[],model=null,yaw=-.55,pitch=.28,zoom=1,drag=null,request=0;
function setInfo(message,isError=false){info.textContent=message;info.dataset.error=String(isError);}
function shader(type,source){
const s=gl.createShader(type);
if(!s)throw Error('Shader konnte nicht erstellt werden.');
gl.shaderSource(s,source);gl.compileShader(s);
if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){
const message=gl.getShaderInfoLog(s)||'Unbekannter Shaderfehler';gl.deleteShader(s);throw Error(message);
}
return s;
}
function prepare(){
if(gl)return;
const ctx=canvas.getContext('webgl',{alpha:false,antialias:true,depth:true,preserveDrawingBuffer:false});
if(!ctx)throw Error('Die 3D-Vorschau benötigt WebGL.');
gl=ctx;
const v=shader(gl.VERTEX_SHADER,'attribute vec3 position;attribute vec3 normal;uniform vec3 center;uniform float yaw,pitch,fit,aspect;varying vec3 lightingNormal;void main(){float c=cos(yaw),s=sin(yaw),a=cos(pitch),b=sin(pitch);vec3 p=position-center;vec3 spun=vec3(p.x*c+p.z*s,p.y,-p.x*s+p.z*c);vec3 rotated=vec3(spun.x,spun.y*a-spun.z*b,spun.y*b+spun.z*a);vec3 n=vec3(normal.x*c+normal.z*s,normal.y,-normal.x*s+normal.z*c);lightingNormal=normalize(vec3(n.x,n.y*a-n.z*b,n.y*b+n.z*a));gl_Position=vec4(rotated.x*fit*aspect,rotated.y*fit,rotated.z*fit*.3,1.);}');
const f=shader(gl.FRAGMENT_SHADER,'precision mediump float;uniform vec3 tint;varying vec3 lightingNormal;void main(){vec3 sunlight=normalize(vec3(.4,.8,.65));float d=.35+.65*max(dot(normalize(lightingNormal),sunlight),0.);gl_FragColor=vec4(tint*d,1.);}');
program=gl.createProgram();gl.attachShader(program,v);gl.attachShader(program,f);gl.linkProgram(program);
gl.deleteShader(v);gl.deleteShader(f);
if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('WebGL-Programm konnte nicht verknüpft werden.');
locations={position:gl.getAttribLocation(program,'position'),normal:gl.getAttribLocation(program,'normal'),
center:gl.getUniformLocation(program,'center'),yaw:gl.getUniformLocation(program,'yaw'),pitch:gl.getUniformLocation(program,'pitch'),
fit:gl.getUniformLocation(program,'fit'),aspect:gl.getUniformLocation(program,'aspect'),
tint:gl.getUniformLocation(program,'tint')};
gl.useProgram(program);gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);
gl.enableVertexAttribArray(locations.position);gl.enableVertexAttribArray(locations.normal);
}
function release(items=buffers){if(!gl)return;for(const item of items)gl.deleteBuffer(item.buffer);}
function paint(){
request=0;
if(!gl||!model||gl.isContextLost())return;
const rect=canvas.getBoundingClientRect();
const scale=Math.min(2,window.devicePixelRatio||1),
width=Math.min(2048,Math.max(1,Math.floor(rect.width*scale))),height=Math.min(2048,Math.max(1,Math.floor(rect.height*scale)));
if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
gl.viewport(0,0,width,height);gl.clearColor(.055,.11,.16,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
gl.useProgram(program);
gl.uniform3fv(locations.center,model.bounds.center);
gl.uniform1f(locations.yaw,yaw);gl.uniform1f(locations.pitch,pitch);
gl.uniform1f(locations.fit,zoom*.82/model.bounds.radius);
gl.uniform1f(locations.aspect,Math.min(1,height/width));
for(const part of buffers){
gl.bindBuffer(gl.ARRAY_BUFFER,part.buffer);
gl.vertexAttribPointer(locations.position,3,gl.FLOAT,false,24,0);
gl.vertexAttribPointer(locations.normal,3,gl.FLOAT,false,24,12);
gl.uniform3fv(locations.tint,part.color);
gl.drawArrays(gl.TRIANGLES,0,part.count);
}
}
function schedule(){if(!request)request=requestAnimationFrame(paint);}
function show(result,filename){
prepare();
const staged=[];
try{
for(const p of result.parts){
const b=gl.createBuffer();if(!b)throw Error('Zu wenig Grafikspeicher.');
staged.push({buffer:b,color:p.color,count:p.vertices.length/6});
gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,p.vertices,gl.STATIC_DRAW);
if(gl.getError()!==gl.NO_ERROR)throw Error('3D-Daten konnten nicht auf die Grafikkarte übertragen werden.');
}
}catch(err){release(staged);throw err;}
release();
buffers=staged;model=result;yaw=-.55;pitch=.28;zoom=1;
wrap.hidden=false;placeholder.hidden=true;clear.hidden=false;place.hidden=false;
const stats=result.stats;
setInfo(filename+' · '+stats.triangles.toLocaleString('de-DE')+' Dreiecke · '+stats.primitives+' Mesh-Teile · '+(stats.bytes/1024/1024).toFixed(2)+' MiB'+
(result.warnings.length?' · '+result.warnings.join(' '):''));
schedule();
}
let generation=0;
picker.addEventListener('change',async()=>{
const file=picker.files?.[0];picker.value='';
if(!file)return;
const requestId=++generation;
try{
if(file.size>window.SDGLB.LIMITS.fileBytes||file.size<20)throw Error('Nur gültige GLB-Dateien bis 8 MiB.');
setInfo('Prüfe '+file.name+' …');
const bytes=await file.arrayBuffer();
if(requestId!==generation)return;
const result=window.SDGLB.parse(bytes);
if(requestId!==generation)return;
show(result,file.name);
importBytes=bytes;importName=file.name;
}catch(err){if(requestId===generation)setInfo('Import nicht übernommen: '+(err?.message||'Unbekannter Fehler'),true);}
});
$('glbChoose').addEventListener('click',()=>picker.click());
place.addEventListener('click',()=>{
if(!model||!importBytes)return;
document.dispatchEvent(new CustomEvent('sd-game-model-add',{detail:{bytes:importBytes,name:importName}}));
});
clear.addEventListener('click',()=>{
generation++;release();buffers=[];model=null;importBytes=null;importName='';place.hidden=true;
wrap.hidden=true;placeholder.hidden=false;clear.hidden=true;
setInfo('Keine GLB-Datei geladen. Die ursprüngliche Szene bleibt unverändert.');
});
canvas.addEventListener('pointerdown',event=>{drag={x:event.clientX,y:event.clientY};canvas.setPointerCapture(event.pointerId);});
canvas.addEventListener('pointermove',event=>{
if(!drag||!model)return;
yaw+=(event.clientX-drag.x)*.012;
pitch=Math.max(-1.45,Math.min(1.45,pitch+(event.clientY-drag.y)*.012));
drag={x:event.clientX,y:event.clientY};schedule();
});
for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,()=>drag=null);
canvas.addEventListener('wheel',event=>{if(!model)return;event.preventDefault();zoom=Math.max(.45,Math.min(2.5,zoom*(event.deltaY>0?.92:1.08)));schedule();},{passive:false});
window.addEventListener('resize',schedule);
canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();setInfo('3D-Kontext verloren. Bitte die GLB-Vorschau neu laden.',true);buffers=[];model=null;});
})();
