/* Project Vanguard — original playable WebGL1 vertical slice using SD World v3.
 * No third-party models, no telemetry, no remote services, no writes to projects. */
(()=>{
'use strict';
const doc=document,$=id=>doc.getElementById(id),canvas=$('stage'),radar=$('radar');
const World=window.SDLargeWorld,Terrain=window.SDWorldTerrain,M=window.SDVanguard;
function fail(message){const b=$('failure');b.hidden=false;b.textContent='3D-Spiel konnte nicht gestartet werden: '+message;}
if(!World||!Terrain||!M||!canvas){fail('Game-Studio-Engine oder Mission-Modul fehlt.');return;}
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const world=World.generate(31,6),runtime=World.runtime(world,1);
let state=M.makeState(),selection=runtime.query(0,0),gl,program,loc,meshes={},terrainCache=new Map();
let canvasLost=false,previousTime=0,time=0,draws=0,frames=0,fps=0,lastStats=0,noticeUntil=0;
const keys=new Set(),touch=new Set(),camera={azimuth:.67,elevation:.40,distance:17},ptr={active:false,x:0,y:0};
let interactQueued=false,started=false;
const I=()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
function mult(a,b){const r=Array(16).fill(0);for(let i=0;i<4;i++)for(let j=0;j<4;j++)for(let k=0;k<4;k++)r[i*4+j]+=a[k*4+j]*b[i*4+k];return r;}
function move(x,y,z){const m=I();m[12]=x;m[13]=y;m[14]=z;return m;}
function sc(x,y,z){const m=I();m[0]=x;m[5]=y;m[10]=z;return m;}
function rotY(a){const c=Math.cos(a),s=Math.sin(a);return[c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1];}
function rotX(a){const c=Math.cos(a),s=Math.sin(a);return[1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1];}
function cameraMatrix(eye,target){const z=unit(eye.map((v,i)=>v-target[i])),x=unit(cross([0,1,0],z)),y=cross(z,x);return[x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1];}
function perspective(fov,aspect,n,f){const q=1/Math.tan(fov/2),t=1/(n-f);return[q/aspect,0,0,0,0,q,0,0,0,0,(f+n)*t,-1,0,0,2*f*n*t,0];}
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=a=>{const n=Math.hypot(...a)||1;return a.map(x=>x/n);};
const rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
function shader(type,source){const s=gl.createShader(type);if(!s)throw Error('Shader konnte nicht angelegt werden.');gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const e=gl.getShaderInfoLog(s);gl.deleteShader(s);throw Error('Shader: '+e);}return s;}
function mesh(vertices){const buffer=gl.createBuffer();if(!buffer)throw Error('GPU-Buffer nicht verfügbar.');gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,vertices instanceof Float32Array?vertices:new Float32Array(vertices),gl.STATIC_DRAW);return{buffer,count:vertices.length/6};}
function triangles(faces){const data=[];for(const face of faces){const n=unit(cross(face[1].map((v,i)=>v-face[0][i]),face[2].map((v,i)=>v-face[0][i])));for(const p of face)data.push(...p,...n);}return mesh(data);}
function cube(){const sides=[
 [[-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1]],[[1,-1,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1]],
 [[-1,-1,-1],[-1,-1,1],[-1,1,1],[-1,1,-1]],[[1,-1,1],[1,-1,-1],[1,1,-1],[1,1,1]],
 [[-1,1,1],[1,1,1],[1,1,-1],[-1,1,-1]],[[-1,-1,-1],[1,-1,-1],[1,-1,1],[-1,-1,1]]
 ];return triangles(sides.flatMap(f=>[[f[0],f[1],f[2]],[f[0],f[2],f[3]]]));}
function sphere(){const list=[],lat=10,lon=16,p=(a,b)=>[Math.sin(a)*Math.cos(b),Math.cos(a),Math.sin(a)*Math.sin(b)];for(let i=0;i<lat;i++)for(let j=0;j<lon;j++){const t=i*Math.PI/lat,s=(i+1)*Math.PI/lat,a=j*Math.PI*2/lon,b=(j+1)*Math.PI*2/lon;const p0=p(t,a),p1=p(s,a),p2=p(s,b),p3=p(t,b);if(i)list.push([p0,p1,p2]);if(i<lat-1)list.push([p0,p2,p3]);}return triangles(list);}
function cylinder(conic=false){const list=[],n=12,r=conic?0:.8;for(let i=0;i<n;i++){const a=i*Math.PI*2/n,b=(i+1)*Math.PI*2/n;const p=[Math.cos(a),-1,Math.sin(a)],q=[Math.cos(b),-1,Math.sin(b)],s=[r*Math.cos(a),1,r*Math.sin(a)],t=[r*Math.cos(b),1,r*Math.sin(b)];list.push([p,s,q]);if(!conic){list.push([s,t,q]);list.push([[0,1,0],s,t]);}list.push([[0,-1,0],q,p]);}return triangles(list);}
function setup(){
 gl=canvas.getContext('webgl',{alpha:false,depth:true,antialias:true,powerPreference:'high-performance'});
 if(!gl)throw Error('WebGL ist nicht verfügbar. Aktiviere Hardwaregrafik oder nutze einen kompatiblen Browser.');
 const vs=`attribute vec3 position;attribute vec3 normal;uniform mat4 model,view,projection;varying vec3 wPos;varying vec3 wNormal;void main(){vec4 p=model*vec4(position,1.0);wPos=p.xyz;vec3 a=model[0].xyz,b=model[1].xyz,c=model[2].xyz;wNormal=normalize(a*normal.x/max(dot(a,a),0.0001)+b*normal.y/max(dot(b,b),0.0001)+c*normal.z/max(dot(c,c),0.0001));gl_Position=projection*view*p;}`;
 const fs=`precision mediump float;uniform vec3 tint,eye;uniform float terrain;varying vec3 wPos,wNormal;void main(){vec3 n=normalize(wNormal);vec3 base=tint;if(terrain>0.5){float rocks=smoothstep(0.09,0.55,1.0-clamp(n.y,0.0,1.0));float noise=sin(wPos.x*0.7)*cos(wPos.z*0.63)*0.035;base=mix(vec3(0.13,0.27,0.29),vec3(0.31,0.42,0.36),clamp((wPos.y+7.0)/15.0,0.0,1.0));base=mix(base,vec3(0.25,0.27,0.28),rocks*0.78);base+=noise;}vec3 light=vec3(0.34,0.43,0.48)+vec3(0.83,0.80,0.67)*max(dot(n,normalize(vec3(-0.65,0.95,0.35))),0.0);float edge=pow(max(dot(reflect(-normalize(vec3(-0.65,0.95,0.35)),n),normalize(eye-wPos)),0.0),18.0);vec3 col=base*light+vec3(0.25,0.40,0.41)*edge*0.12;float dist=length(eye-wPos);float fog=clamp((dist-45.0)/108.0,0.0,0.76);gl_FragColor=vec4(mix(col,vec3(0.18,0.30,0.34),fog),1.0);}`;
 program=gl.createProgram();const a=shader(gl.VERTEX_SHADER,vs),b=shader(gl.FRAGMENT_SHADER,fs);gl.attachShader(program,a);gl.attachShader(program,b);gl.linkProgram(program);gl.deleteShader(a);gl.deleteShader(b);
 if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('WebGL-Linker: '+gl.getProgramInfoLog(program));
 gl.useProgram(program);loc={position:gl.getAttribLocation(program,'position'),normal:gl.getAttribLocation(program,'normal'),model:gl.getUniformLocation(program,'model'),view:gl.getUniformLocation(program,'view'),projection:gl.getUniformLocation(program,'projection'),tint:gl.getUniformLocation(program,'tint'),eye:gl.getUniformLocation(program,'eye'),terrain:gl.getUniformLocation(program,'terrain')};
 gl.enableVertexAttribArray(loc.position);gl.enableVertexAttribArray(loc.normal);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
 meshes={cube:cube(),sphere:sphere(),cylinder:cylinder(),cone:cylinder(true)};
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();canvasLost=true;fail('Grafikkontext verloren. Seite neu laden, um sicher weiterzuspielen.');});
 doc.body.dataset.gameReady='true';
}
function draw(shape,color,m,terrain=false){const sh=typeof shape==='string'?meshes[shape]:shape;if(!sh)return;gl.bindBuffer(gl.ARRAY_BUFFER,sh.buffer);gl.vertexAttribPointer(loc.position,3,gl.FLOAT,false,24,0);gl.vertexAttribPointer(loc.normal,3,gl.FLOAT,false,24,12);gl.uniformMatrix4fv(loc.model,false,new Float32Array(m));gl.uniform3fv(loc.tint,rgb(color));gl.uniform1f(loc.terrain,terrain?1:0);gl.drawArrays(gl.TRIANGLES,0,sh.count);draws++;}
function part(shape,color,x,y,z,sx,sy,sz){draw(shape,color,mult(move(x,y,z),sc(sx,sy,sz)));}
function local(root,shape,color,x,y,z,sx,sy,sz,ax=0){draw(shape,color,mult(root,mult(move(x,y,z),mult(rotX(ax),sc(sx,sy,sz)))));}
const height=(x,z)=>Terrain.heightAt(x,z,world.seed);
function pruneTerrain(cells){const active=new Set(cells.map(c=>c.cx+':'+c.cz));for(const [k,v] of terrainCache)if(!active.has(k)){gl.deleteBuffer(v.buffer);terrainCache.delete(k);}}
function drawTerrain(cells){pruneTerrain(cells);for(const c of cells){const key=c.cx+':'+c.cz;if(!terrainCache.has(key))terrainCache.set(key,mesh(Terrain.buildCell(c.cx,c.cz,world.seed,12).vertices));draw(terrainCache.get(key),'#476f68',I(),true);}}
function worldObject(o){
 const b=height(o.x,o.z),s=o.scale,x=o.x,z=o.z;
 if(o.type==='box'){part('cube','#577078',x,b+s,z,s,s,s);part('cube','#8ba8a7',x,b+s*2.01,z,s*1.05,.08*s,s*1.05);}
 else if(o.type==='rock'){part('sphere','#798b86',x,b+.64*s,z,1.15*s,.72*s,.92*s);part('sphere','#5e7880',x+.55*s,b+.3*s,z-.15*s,.47*s,.38*s,.4*s);}
 else if(o.type==='bush'){part('sphere','#426b60',x,b+.6*s,z,.85*s,.65*s,.72*s);part('sphere','#689b7d',x-.5*s,b+.47*s,z,.49*s,.5*s,.5*s);}
 else {part('cylinder','#5b5148',x,b+1.15*s,z,.22*s,1.14*s,.22*s);part('cone',o.type==='pine'?'#306754':'#3c7965',x,b+2.9*s,z,1.05*s,1.52*s,1.05*s);if(o.type==='tree')part('sphere','#4f9977',x,b+3.45*s,z,.95*s,.85*s,.90*s);else part('cone','#57937b',x,b+4.0*s,z,.66*s,1.1*s,.66*s);}
}
function relay(b){const h=height(b.x,b.z),t=time,active=b.active;
 part('cylinder','#1c343e',b.x,h+.24,b.z,2.15,.24,2.15);
 part('cylinder',active?'#6bc7a5':'#486973',b.x,h+.54,b.z,1.7,.10,1.7);
 for(let i=0;i<6;i++){const a=i*Math.PI/3;part('cube',active?'#a6ead0':'#778e93',b.x+Math.cos(a)*1.55,h+.53,b.z+Math.sin(a)*1.55,.19,.08,.19);}
 part('cylinder','#3a525c',b.x,h+2.12,b.z,.53,1.6,.53);
 part('sphere',active?'#9cf5d2':'#f5bd78',b.x,h+3.80+Math.sin(t*2+b.x)*.08,b.z,.53,.53,.53);
 part('cylinder',active?'#83d2bd':'#d9a568',b.x,h+3.06,b.z,.24,.11,.24);
 if(!active){const pulse=.75+Math.sin(t*3+b.x)*.15;part('cube','#9b7556',b.x,h+1.2,b.z+.61,.15*pulse,.57,.09);}else part('cube','#8cffe2',b.x,h+1.2,b.z+.61,.18,.55,.10);
}
function extraction(){const b=height(0,0),complete=state.beacons.every(x=>x.active);part('cylinder','#152f36',0,b+.06,0,3,.09,3);part('cylinder',complete?'#79dfb0':'#4c8c93',0,b+.19,0,2.7,.055,2.7);for(let i=0;i<8;i++){const a=i*Math.PI/4;part('cube',complete?'#95ffe1':'#769b9b',Math.cos(a)*2.6,b+.24,Math.sin(a)*2.6,.19,.04,.27);}}
function operative(){
 const p=state.hero,base=height(p.x,p.z)+p.y,run=p.animation==='run'||p.animation==='sprint',swing=run?Math.sin(time*(p.animation==='sprint'?15:11))*.58:0;
 const breathing=Math.sin(time*2.4)*.015,bounce=run?Math.abs(Math.sin(time*11))*.04:0;
 const root=mult(move(p.x,base+bounce,p.z),rotY(p.heading));
 const flash=p.invulnerability>0&&Math.floor(time*14)%2===0;
 const suit=flash?'#e6eded':'#284657',trim='#70dac8',pants='#243443',skin='#b58b73';
 for(const side of [-1,1]){
  const knee=mult(root,mult(move(side*.22,.92,0),rotX(-side*swing+(p.y>0?-.22:0))));
  local(knee,'cylinder',pants,0,-.36,0,.17,.39,.19);
  local(knee,'cube','#496479',0,-.7,.17,.22,.12,.31);
  local(knee,'sphere','#172c37',0,-.40,0,.19,.18,.20);
 }
 local(root,'cube',suit,0,1.42+breathing,0,.44,.52,.28);
 local(root,'cube','#304957',0,1.45+breathing,-.39,.30,.45,.17);
 local(root,'cube',trim,0,1.57+breathing,.291,.32,.04,.04);
 local(root,'cube','#728d90',0,1.13+breathing,.275,.35,.10,.04);
 for(const side of [-1,1]){
   const angle=side*swing+(p.attackCooldown>.40&&side===1?-1.25:0);
   const shoulder=mult(root,mult(move(side*.56,1.76+breathing,0),rotX(angle)));
   local(shoulder,'cylinder',suit,0,-.34,0,.15,.38,.17);
   local(shoulder,'cube','#355d64',0,-.38,.01,.18,.16,.19);
   local(shoulder,'sphere',skin,0,-.72,.03,.125,.15,.135);
   local(root,'sphere','#4c7b7f',side*.52,1.78+breathing,0,.24,.23,.28);
 }
 local(root,'cylinder','#334857',0,2.16+breathing,0,.31,.32,.31);
 local(root,'cube','#9ce5dd',0,2.20+breathing,.28,.31,.09,.09);
 local(root,'cube','#b4d6c7',0,2.47+breathing,0,.34,.1,.32);
 local(root,'cube','#6cb7ae',0,2.49+breathing,.19,.35,.045,.14);
 local(root,'cube','#7bbeb6',-.21,1.7+breathing,.26,.09,.12,.06);
 local(root,'cube','#7bbeb6',.21,1.7+breathing,.26,.09,.12,.06);
 const weapon=mult(root,mult(move(.59,.93+breathing,.08),rotX(p.attackCooldown>.40?-1.1:-.45)));
 local(weapon,'cylinder','#2b393e',0,.19,0,.07,.22,.08);
 local(weapon,'cube',p.attackCooldown>.40?'#c1fff1':'#83d9d0',0,.64,0,.075,.30,.065);
}
function drone(e){const b=height(e.x,e.z),pulse=Math.sin(time*5+e.phase)*.09,root=mult(move(e.x,b+1.10+pulse,e.z),rotY(e.heading));
 local(root,'sphere','#402f3d',0,.26,0,.66,.46,.64);
 local(root,'cube','#b75869',0,.24,.51,.43,.16,.09);
 local(root,'cube','#ed9e91',0,.27,.61,.18,.08,.04);
 local(root,'cube','#3c454c',0,-.22,0,.45,.23,.39);
 for(const side of [-1,1]){local(root,'cube','#5d4656',side*.72,.18,0,.34,.12,.42);local(root,'sphere','#ef786e',side*1.1,.16,0,.14,.15,.15);}
 local(root,'cylinder','#bd7d79',0,-.67,0,.15,.2,.15);
 if(e.hp<100){local(root,'cube','#dc7671',0,.99,0,.52,.03,.05);local(root,'cube','#83dfc5',-.52+e.hp/200,.99,.05,e.hp/200,.04,.045);}
}
function render(){
 const pixelRatio=Math.min(window.devicePixelRatio||1,1.65),w=Math.max(1,Math.floor(canvas.clientWidth*pixelRatio)),h=Math.max(1,Math.floor(canvas.clientHeight*pixelRatio));
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}gl.viewport(0,0,w,h);
 const p=state.hero,y=height(p.x,p.z)+p.y;
 const cos=Math.cos(camera.elevation),distance=camera.distance;
 const eye=[p.x+Math.sin(camera.azimuth)*distance*cos,y+3.3+distance*Math.sin(camera.elevation),p.z+Math.cos(camera.azimuth)*distance*cos];
 eye[1]=Math.max(eye[1],height(eye[0],eye[2])+2);
 gl.clearColor(.16,.30,.36,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
 gl.uniformMatrix4fv(loc.view,false,new Float32Array(cameraMatrix(eye,[p.x,y+1.35,p.z])));
 gl.uniformMatrix4fv(loc.projection,false,new Float32Array(perspective(.91,w/h,.1,195)));
 gl.uniform3fv(loc.eye,eye);draws=0;
 selection=runtime.query(p.x,p.z);
 drawTerrain(selection.cells);
 for(const obj of selection.objects)if(Math.hypot(obj.x-p.x,obj.z-p.z)<90)worldObject(obj);
 extraction();
 for(const b of state.beacons)if(M.distance(b,p)<105)relay(b);
 for(const e of state.enemies)if(e.hp>0&&M.distance(e,p)<95)drone(e);
 operative();
}
function drawRadar(){const ctx=radar.getContext('2d');if(!ctx)return;const s=180,r=83;ctx.clearRect(0,0,s,s);ctx.save();ctx.translate(90,90);ctx.strokeStyle='rgba(131,188,183,.25)';ctx.lineWidth=1;for(let k=1;k<=3;k++){ctx.beginPath();ctx.arc(0,0,r*k/3,0,Math.PI*2);ctx.stroke();}ctx.beginPath();ctx.moveTo(-r,0);ctx.lineTo(r,0);ctx.moveTo(0,-r);ctx.lineTo(0,r);ctx.stroke();const p=state.hero,ratio=r/100;
 for(const b of state.beacons){const x=(b.x-p.x)*ratio,y=(b.z-p.z)*ratio;if(Math.hypot(x,y)>r-3)continue;ctx.fillStyle=b.active?'#4a877f':'#8ff6c4';ctx.save();ctx.translate(x,y);ctx.rotate(Math.PI/4);ctx.fillRect(-4,-4,8,8);ctx.restore();}
 for(const e of state.enemies){if(e.hp<=0)continue;const x=(e.x-p.x)*ratio,y=(e.z-p.z)*ratio;if(Math.hypot(x,y)>r-3)continue;ctx.fillStyle='#ff8586';ctx.beginPath();ctx.arc(x,y,3,0,Math.PI*2);ctx.fill();}
 ctx.save();ctx.rotate(-state.hero.heading);ctx.fillStyle='#ecfff5';ctx.beginPath();ctx.moveTo(0,8);ctx.lineTo(-6,-6);ctx.lineTo(6,-6);ctx.closePath();ctx.fill();ctx.restore();ctx.restore();}
function updateHud(){const p=state.hero,obj=M.nearbyObjective(state);$('hpBar').style.width=p.hp+'%';$('staminaBar').style.width=p.stamina+'%';$('hpValue').textContent=Math.ceil(p.hp);$('staminaValue').textContent=Math.ceil(p.stamina);
 $('targetName').textContent=obj.label.toUpperCase();$('targetDistance').textContent=Math.round(M.distance(obj,p));$('killCount').textContent=String(state.kills).padStart(2,'0')+' / '+String(state.enemies.length).padStart(2,'0');
 $('heading').textContent='N '+String(Math.round((state.hero.heading*180/Math.PI+360)%360)).padStart(3,'0')+'°';
 $('objectives').replaceChildren(...state.beacons.map(b=>{const div=doc.createElement('div');div.className='objective'+(b.active?' done':'');const icon=doc.createElement('b');icon.textContent=b.active?'✓':'◇';const span=doc.createElement('span');span.textContent=b.name.toUpperCase();div.append(icon,span);return div;}));
 let hint=null;if(state.phase==='playing'){
  const b=state.beacons.find(b=>!b.active&&M.distance(b,p)<4);if(b)hint='RELAIS AKTIVIEREN';
  else if(obj.done===3&&M.distance(p,M.START)<5)hint='EXTRAKTION STARTEN';
 }
 $('interactHint').hidden=!hint;if(hint)$('interactLabel').textContent=hint;
 $('cellCount').textContent=selection.activeCells+' ZELLEN';$('drawCalls').textContent=draws+' DRAWS';$('fps').textContent=fps+' FPS';
 if(state.events.length){noticeUntil=state.time+2.5;$('message').textContent=state.message.toUpperCase();}
 else if(state.time>noticeUntil)$('message').textContent='MISSION / '+obj.label.toUpperCase();
 if(state.phase!=='playing'&&$('gameOver').hidden){$('gameOver').hidden=false;$('endTitle').textContent=state.phase==='won'?'MISSION ABGESCHLOSSEN':'MISSION GESCHEITERT';$('endText').textContent=state.phase==='won'?'Alle drei Relais aktiviert. '+state.kills+' Drohnen ausgeschaltet. Dieser Vertical Slice ist abgeschlossen.':'Deine Lebenspunkte sind auf null gesunken. Passe Angriff und Bewegung an und versuche es erneut.';}
 drawRadar();}
function getInput(){const on=(...a)=>a.some(k=>keys.has(k)||touch.has(k));return{forward:on('w','arrowup','forward'),back:on('s','arrowdown','back'),left:on('a','arrowleft','left'),right:on('d','arrowright','right'),sprint:on('shift','sprint'),jump:on(' ','jump'),attack:on('j','attack'),interact:interactQueued,cameraAzimuth:camera.azimuth};}
function reset(){state=M.makeState();interactQueued=false;keys.clear();touch.clear();doc.querySelectorAll('[data-action]').forEach(b=>b.classList.remove('pressed'));$('gameOver').hidden=true;camera.azimuth=.67;camera.elevation=.40;runtime.reset();noticeUntil=0;updateHud();canvas.focus({preventScroll:true});}
function bind(){
 const mapped=new Set(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' ','shift','j','e','r']);
 doc.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(!mapped.has(k)||e.altKey||e.metaKey||e.ctrlKey)return;if(e.target instanceof HTMLElement&&/input|textarea|select/i.test(e.target.tagName))return;e.preventDefault();if(k==='r'&&!e.repeat){reset();return;}if(k==='e'&&!e.repeat)interactQueued=true;else keys.add(k);});
 doc.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
 window.addEventListener('blur',()=>{keys.clear();touch.clear();});
 doc.addEventListener('visibilitychange',()=>{if(doc.hidden){keys.clear();touch.clear();previousTime=0;}});
 canvas.addEventListener('pointerdown',e=>{ptr.active=true;ptr.x=e.clientX;ptr.y=e.clientY;try{canvas.setPointerCapture(e.pointerId);}catch(_){}canvas.focus({preventScroll:true});});
 canvas.addEventListener('pointermove',e=>{if(!ptr.active)return;const dx=e.clientX-ptr.x,dy=e.clientY-ptr.y;camera.azimuth-=dx*.005;camera.elevation=clamp(camera.elevation+dy*.003,.18,.95);ptr.x=e.clientX;ptr.y=e.clientY;});
 const stop=()=>{ptr.active=false;};canvas.addEventListener('pointerup',stop);canvas.addEventListener('pointercancel',stop);
 canvas.addEventListener('wheel',e=>{e.preventDefault();camera.distance=clamp(camera.distance+Math.sign(e.deltaY)*1.3,9,29);},{passive:false});
 for(const b of doc.querySelectorAll('[data-action]')){
   const action=b.dataset.action;
   const release=e=>{e.preventDefault();touch.delete(action);b.classList.remove('pressed');try{b.releasePointerCapture(e.pointerId);}catch(_){}};
   b.addEventListener('pointerdown',e=>{e.preventDefault();touch.add(action);b.classList.add('pressed');if(action==='interact')interactQueued=true;try{b.setPointerCapture(e.pointerId);}catch(_){}});
   b.addEventListener('pointerup',release);b.addEventListener('pointercancel',release);b.addEventListener('lostpointercapture',()=>{touch.delete(action);b.classList.remove('pressed');});
 }
 $('restart').addEventListener('click',reset);$('replay').addEventListener('click',reset);
}
function tick(now){if(canvasLost)return;const dt=previousTime?Math.min(.05,(now-previousTime)/1000):0;previousTime=now;
 if(!doc.hidden){
  time+=dt;const input=getInput();const local=runtime.query(state.hero.x,state.hero.z);
  M.step(state,input,dt,height,local.objects);interactQueued=false;
  render();frames++;if(now-lastStats>650){fps=Math.round(frames*1000/Math.max(1,now-lastStats));frames=0;lastStats=now;updateHud();}else if(state.events.length||state.phase!=='playing')updateHud();
 }
 requestAnimationFrame(tick);
}
try{setup();bind();updateHud();started=true;requestAnimationFrame(tick);}catch(error){if(started)canvasLost=true;fail(error.message||String(error));console.error('[Project Vanguard]',error);}
})();
