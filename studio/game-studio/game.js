/* SD Game-Studio: local WebGL 3D rendering and isolated scene editing. */
(function(){
'use strict';
const Core=window.SDGameCore,doc=document,$=id=>doc.getElementById(id),canvas=$('stage');
const names={box:'Würfel',sphere:'Kugel',tree:'Baum',column:'Säule',rock:'Felsen',hill:'Hügel'},groundNames={meadow:'Wiese',sand:'Wüste',snow:'Schnee'},clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let scene=Core.fresh(),selected=null,playing=false,dirty=false,gl,program,u,shapes={},grid;
let savedSnapshot=Core.serialize(scene),history=Core.createHistory(scene);
const player={x:0,y:0,z:5,vy:0};
const camera={azimuth:.55,elev:.48,distance:21,targetX:0,targetZ:0};
const keys={forward:false,back:false,left:false,right:false,jump:false};
const say=message=>$('status').textContent=message;
const id=()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
function mm(a,b){const c=Array(16).fill(0);for(let i=0;i<4;i++)for(let j=0;j<4;j++)for(let k=0;k<4;k++)c[i*4+j]+=a[k*4+j]*b[i*4+k];return c;}
function translate(x,y,z){const m=id();m[12]=x;m[13]=y;m[14]=z;return m;}
function scale(x,y,z){const m=id();m[0]=x;m[5]=y;m[10]=z;return m;}
function perspective(fov,aspect,n,f){const q=1/Math.tan(fov/2),t=1/(n-f);return[q/aspect,0,0,0,0,q,0,0,0,0,(f+n)*t,-1,0,0,2*f*n*t,0];}
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm=v=>{const d=Math.hypot(...v)||1;return v.map(t=>t/d);};
function look(eye,target){const z=norm(eye.map((v,i)=>v-target[i])),x=norm(cross([0,1,0],z)),y=cross(z,x);return[x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1];}
function mesh(vertices){const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);return{buffer:b,count:vertices.length/6};}
function triangles(list){const a=[];for(const v of list){const p=v[0],q=v[1],r=v[2],n=norm(cross(q.map((x,i)=>x-p[i]),r.map((x,i)=>x-p[i])));for(const point of v)a.push(...point,...n);}return mesh(a);}
function cuboid(){const faces=[
[[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]],
[[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1]],
[[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,1,-1]],
[[1,-1,1],[1,-1,-1],[1,1,-1],[1,1,1]],
[[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1]],
[[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1]]];
return triangles(faces.flatMap(f=>[[f[0],f[1],f[2]],[f[0],f[2],f[3]]]));}
function globe(){const list=[],lat=12,lon=20,point=(a,b)=>[Math.sin(a)*Math.cos(b),Math.cos(a),Math.sin(a)*Math.sin(b)];
for(let i=0;i<lat;i++)for(let j=0;j<lon;j++){
const t=i*Math.PI/lat,s=(i+1)*Math.PI/lat,a=j*2*Math.PI/lon,b=(j+1)*2*Math.PI/lon;
const p=point(t,a),q=point(s,a),r=point(s,b),v=point(t,b);
if(i)list.push([p,q,r]);if(i<lat-1)list.push([p,r,v]);}
return triangles(list);}
function cylinder(cone){const list=[],n=16,r=cone?0:.8;for(let i=0;i<n;i++){
const a=i*2*Math.PI/n,b=(i+1)*2*Math.PI/n;
const p=[Math.cos(a),-1,Math.sin(a)],q=[Math.cos(b),-1,Math.sin(b)];
const s=[r*Math.cos(a),1,r*Math.sin(a)],t=[r*Math.cos(b),1,r*Math.sin(b)];
list.push([p,s,q]);if(!cone){list.push([s,t,q]);list.push([[0,1,0],s,t]);}list.push([[0,-1,0],q,p]);}
return triangles(list);}
function gridlines(){const a=[];for(let p=-20;p<=20;p++){a.push(-20,.012,p,0,1,0,20,.012,p,0,1,0,p,.012,-20,0,1,0,p,.012,20,0,1,0);}return mesh(a);}
function compile(type,source){const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error('3D-Shaderfehler: '+gl.getShaderInfoLog(shader));return shader;}
function setup(){
gl=canvas.getContext('webgl',{alpha:false,antialias:true,depth:true});
if(!gl)throw Error('WebGL nicht verfügbar. Bitte einen Browser mit aktivierter 3D-Grafik verwenden.');
const vertex='attribute vec3 pos;attribute vec3 normal;uniform mat4 proj,view,model;varying float light;void main(){vec3 n=normalize(mat3(model)*normal);light=.57+.43*max(dot(n,normalize(vec3(-.5,1.,.7))),0.);gl_Position=proj*view*model*vec4(pos,1.);}';
const fragment='precision mediump float;uniform vec3 tint;varying float light;void main(){gl_FragColor=vec4(tint*light,1.);}';
program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('3D-Programmfehler: '+gl.getProgramInfoLog(program));
gl.useProgram(program);
u={pos:gl.getAttribLocation(program,'pos'),normal:gl.getAttribLocation(program,'normal'),proj:gl.getUniformLocation(program,'proj'),view:gl.getUniformLocation(program,'view'),model:gl.getUniformLocation(program,'model'),tint:gl.getUniformLocation(program,'tint')};
gl.enableVertexAttribArray(u.pos);gl.enableVertexAttribArray(u.normal);gl.enable(gl.DEPTH_TEST);
shapes={box:cuboid(),sphere:globe(),column:cylinder(false),cone:cylinder(true)};grid=gridlines();
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();say('3D-Kontext verloren. Bitte Seite neu laden.');});
}
function color(hex){return[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);}
function draw(shape,tint,m,mode){const mesh=typeof shape==='string'?shapes[shape]:shape;gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);gl.vertexAttribPointer(u.pos,3,gl.FLOAT,false,24,0);gl.vertexAttribPointer(u.normal,3,gl.FLOAT,false,24,12);gl.uniformMatrix4fv(u.model,false,new Float32Array(m));gl.uniform3fv(u.tint,color(tint));gl.drawArrays(mode||gl.TRIANGLES,0,mesh.count);}
function part(shape,tint,x,y,z,a,b,c){draw(shape,tint,mm(translate(x,y,z),scale(a,b,c)));}
function object(o){const s=o.scale,x=o.x,z=o.z;
if(o.type==='box')part('box',o.color,x,s,z,s,s,s);
if(o.type==='sphere')part('sphere',o.color,x,s,z,s,s,s);
if(o.type==='column')part('column',o.color,x,s*1.5,z,.75*s,1.5*s,.75*s);
if(o.type==='rock')part('sphere',o.color,x,.75*s,z,1.05*s,.74*s,1.2*s);
if(o.type==='hill')part('sphere',o.color,x,.1*s,z,2.3*s,.9*s,2.3*s);
if(o.type==='tree'){part('column','#735d4b',x,1.1*s,z,.27*s,1.1*s,.27*s);part('cone',o.color,x,2.8*s,z,1.28*s,1.45*s,1.28*s);part('cone','#408d75',x,3.7*s,z,.88*s,1.1*s,.88*s);}
if(!playing&&o.id===selected)part('box','#f8d481',x,.05,z,1.08*s,.05,1.08*s);
}
function character(){part('column','#416b8e',player.x,player.y+.63,player.z,.37,.6,.37);part('sphere','#e8c6a2',player.x,player.y+1.52,player.z,.43,.43,.43);part('sphere','#27394d',player.x-.14,player.y+1.59,player.z+.37,.05,.06,.05);part('sphere','#27394d',player.x+.14,player.y+1.59,player.z+.37,.05,.06,.05);}
function dimensions(){const d=Math.min(window.devicePixelRatio||1,2),w=Math.max(1,Math.round(canvas.clientWidth*d)),h=Math.max(1,Math.round(canvas.clientHeight*d));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}gl.viewport(0,0,w,h);return{w,h};}
function matrices(){const{w,h}=dimensions(),tx=playing?player.x:camera.targetX,tz=playing?player.z:camera.targetZ,d=playing?10:camera.distance,e=playing?.5:camera.elev;const eye=[tx+d*Math.sin(camera.azimuth)*Math.cos(e),d*Math.sin(e)+(playing?2:0),tz+d*Math.cos(camera.azimuth)*Math.cos(e)];return{view:look(eye,[tx,playing?1.1+player.y:0,tz]),proj:perspective(.838,w/h,.1,120)};}
const terrains={meadow:{sky:[.065,.12,.18],soil:'#365e54',grid:'#517d72'},sand:{sky:[.17,.14,.12],soil:'#a48b65',grid:'#c5a879'},snow:{sky:[.12,.17,.22],soil:'#bacbd3',grid:'#d5e3e6'}};
function render(){const m=matrices(),terrain=terrains[scene.ground]||terrains.meadow;gl.clearColor(...terrain.sky,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.uniformMatrix4fv(u.view,false,new Float32Array(m.view));gl.uniformMatrix4fv(u.proj,false,new Float32Array(m.proj));part('box',terrain.soil,0,-.26,0,20,.25,20);draw(grid,terrain.grid,id(),gl.LINES);scene.objects.forEach(object);character();}
function project(x,y,z){const{view,proj}=matrices(),m=mm(proj,view),p=[x,y,z,1],out=[];for(let r=0;r<4;r++)out[r]=m[r]*p[0]+m[r+4]*p[1]+m[r+8]*p[2]+m[r+12]*p[3];if(out[3]<=0)return null;return{x:(out[0]/out[3]+1)*canvas.clientWidth/2,y:(1-out[1]/out[3])*canvas.clientHeight/2};}
function pick(cx,cy){const rect=canvas.getBoundingClientRect(),x=cx-rect.left,y=cy-rect.top;let best=null,distance=Infinity;for(const o of scene.objects){const p=project(o.x,(o.type==='tree'?2.7:o.type==='hill'?.65:o.type==='rock'?.75:1)*o.scale,o.z);if(!p)continue;const d=Math.hypot(x-p.x,y-p.y);if(d<48&&d<distance){best=o.id;distance=d;}}select(best);}
function select(id){selected=id;const o=scene.objects.find(x=>x.id===selected);$('inspectorEmpty').hidden=!!o;$('inspectorFields').hidden=!o;if(o){$('selectedTitle').textContent=names[o.type]+' #'+o.id;$('propX').value=o.x;$('propZ').value=o.z;$('propScale').value=o.scale;$('propColor').value=o.color;}
$('duplicateObject').disabled=playing||!o;
document.querySelectorAll('[data-object-id]').forEach(el=>el.classList.toggle('chosen',+el.dataset.objectId===id));}
function refreshTerrain(){document.querySelectorAll('[data-ground]').forEach(b=>{const active=b.dataset.ground===scene.ground;b.classList.toggle('chosen',active);b.setAttribute('aria-pressed',String(active));});}
function list(){const h=$('sceneList');h.replaceChildren();for(const o of scene.objects){const btn=doc.createElement('button');btn.type='button';btn.className='scene-item';btn.dataset.objectId=String(o.id);btn.textContent=names[o.type]+' · '+o.id;btn.addEventListener('click',()=>select(o.id));h.appendChild(btn);}$('objectCount').textContent=String(scene.objects.length);select(selected&&scene.objects.some(x=>x.id===selected)?selected:null);refreshHistory();refreshTerrain();}
function syncDirty(){dirty=Core.serialize(scene)!==savedSnapshot;$('sceneName').textContent=scene.name+(dirty?' •':'');}
function refreshHistory(){$('undoAction').disabled=playing||!history.canUndo;$('redoAction').disabled=playing||!history.canRedo;}
function changed(msg){history.record(scene);syncDirty();say(msg);list();}
function travel(direction){
if(playing)return;
const next=history[direction]();if(!next)return;
scene=next;selected=scene.objects.some(o=>o.id===selected)?selected:null;
syncDirty();list();say(direction==='undo'?'Änderung rückgängig gemacht.':'Änderung wiederhergestellt.');
}
function duplicateSelected(){
if(playing||selected==null)return;
try{const copy=Core.duplicate(scene,selected);selected=copy.id;changed('Objekt dupliziert.');}
catch(err){say(err.message);}
}
function mode(play){playing=play;$('modeEdit').classList.toggle('active',!play);$('modePlay').classList.toggle('active',play);$('modeEdit').setAttribute('aria-pressed',String(!play));$('modePlay').setAttribute('aria-pressed',String(play));$('editHint').hidden=play;$('playHint').hidden=!play;$('touchControls').hidden=!play;document.querySelectorAll('[data-edit-only]').forEach(el=>el.disabled=play);refreshHistory();select(selected);if(!play)Object.keys(keys).forEach(k=>keys[k]=false);say(play?'Spielmodus: WASD / Pfeile und Leertaste oder Touch-Steuerung.':'Bearbeiten: Objekt wählen, hinzufügen oder Kamera drehen.');}
function add(type){if(playing)return;try{const o=Core.add(scene,type,Math.round(camera.targetX),Math.round(camera.targetZ-2));selected=o.id;changed(names[type]+' hinzugefügt.');}catch(err){say(err.message);}}
function save(){const data=Core.serialize(scene),blob=new Blob([data],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=doc.createElement('a');a.href=url;a.download='sd-game-scene.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);savedSnapshot=data;syncDirty();say('Szene heruntergeladen. Andere Projekte bleiben unverändert.');}
function load(file){if(!file)return;if(file.size>60000){say('Datei zu groß.');return;}file.text().then(text=>{const next=Core.parse(text);scene=next;history.reset(next);savedSnapshot=Core.serialize(next);selected=null;Object.assign(player,{x:0,y:0,z:5,vy:0});syncDirty();list();say('Szene geladen.');}).catch(e=>say('Import abgebrochen: '+e.message));}
document.querySelectorAll('[data-add]').forEach(b=>b.addEventListener('click',()=>add(b.dataset.add)));
document.querySelectorAll('[data-ground]').forEach(b=>b.addEventListener('click',()=>{
if(playing)return;
try{Core.setGround(scene,b.dataset.ground);changed('Landschaft: '+groundNames[scene.ground]+'.');}
catch(err){say(err.message);}
}));
$('modeEdit').addEventListener('click',()=>mode(false));$('modePlay').addEventListener('click',()=>mode(true));
$('saveScene').addEventListener('click',save);$('loadScene').addEventListener('click',()=>$('sceneFile').click());
$('sceneFile').addEventListener('change',e=>{load(e.target.files[0]);e.target.value='';});
$('resetScene').addEventListener('click',()=>{if(dirty&&!window.confirm('Ungespeicherte Änderungen wirklich verwerfen?'))return;scene=Core.fresh();selected=null;changed('Beispielwelt wiederhergestellt (rückgängig möglich).');});
$('deleteObject').addEventListener('click',()=>{if(selected!=null){Core.remove(scene,selected);selected=null;changed('Objekt entfernt.');}});
$('duplicateObject').addEventListener('click',duplicateSelected);
$('undoAction').addEventListener('click',()=>travel('undo'));
$('redoAction').addEventListener('click',()=>travel('redo'));
for(const name of ['X','Z','Scale','Color'])$('prop'+name).addEventListener('change',e=>{if(selected==null)return;const key=name.toLowerCase(),value=key==='color'?e.target.value:Number(e.target.value);try{Core.update(scene,selected,{[key]:value});changed('Objekt aktualisiert.');}catch(err){say(err.message);select(selected);}});
$('cameraReset').addEventListener('click',()=>{Object.assign(camera,{azimuth:.55,elev:.48,distance:21,targetX:0,targetZ:0});say('Kamera zurückgesetzt.');});
const bindings={KeyW:'forward',ArrowUp:'forward',KeyS:'back',ArrowDown:'back',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',Space:'jump'};
function key(e,down){if(!playing||/^(INPUT|TEXTAREA|SELECT)$/.test(doc.activeElement.tagName))return;const k=bindings[e.code];if(k){e.preventDefault();keys[k]=down;}}
function shortcut(e){
if(playing||!(e.ctrlKey||e.metaKey)||e.altKey||e.repeat||/^(INPUT|TEXTAREA|SELECT)$/.test(doc.activeElement.tagName)||doc.activeElement.isContentEditable)return false;
const k=e.key.toLowerCase();
if(k==='z'){e.preventDefault();travel(e.shiftKey?'redo':'undo');return true;}
if(k==='y'&&!e.shiftKey){e.preventDefault();travel('redo');return true;}
if(k==='d'&&!e.shiftKey){e.preventDefault();duplicateSelected();return true;}
return false;
}
window.addEventListener('keydown',e=>{if(!shortcut(e))key(e,true);});window.addEventListener('keyup',e=>key(e,false));window.addEventListener('blur',()=>Object.keys(keys).forEach(k=>keys[k]=false));
document.querySelectorAll('[data-control]').forEach(b=>{const k=b.dataset.control;b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys[k]=true;});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,e=>{e.preventDefault();keys[k]=false;});});
let pointer=null;
canvas.addEventListener('pointerdown',e=>{if(playing)return;pointer={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};canvas.setPointerCapture(e.pointerId);});
canvas.addEventListener('pointermove',e=>{if(!pointer||pointer.id!==e.pointerId||playing)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;if(Math.abs(dx)+Math.abs(dy)>2)pointer.moved=true;camera.azimuth=(camera.azimuth-dx*.007)%(2*Math.PI);camera.elev=clamp(camera.elev+dy*.006,.12,1.26);pointer.x=e.clientX;pointer.y=e.clientY;});
canvas.addEventListener('pointerup',e=>{if(pointer&&pointer.id===e.pointerId&&!pointer.moved&&!playing)pick(e.clientX,e.clientY);pointer=null;});
canvas.addEventListener('pointercancel',()=>pointer=null);canvas.addEventListener('wheel',e=>{if(!playing){e.preventDefault();camera.distance=clamp(camera.distance+e.deltaY*.02,6,48);}},{passive:false});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
let before=0;function tick(now){const dt=before?Math.min((now-before)/1000,.05):0;before=now;if(playing)Core.move(player,keys,dt,scene.objects,camera.azimuth);if(!doc.hidden)render();requestAnimationFrame(tick);}
try{setup();list();mode(false);doc.body.dataset.ready='true';requestAnimationFrame(tick);}catch(err){doc.body.dataset.ready='error';say(err.message);$('stageError').hidden=false;$('stageError').textContent=err.message;}
})();