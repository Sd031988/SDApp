/* SD Game-Studio: local WebGL 3D rendering and isolated scene editing. */
(function(){
'use strict';
const Core=window.SDGameCore,doc=document,$=id=>doc.getElementById(id),canvas=$('stage');
const names={box:'Würfel',sphere:'Kugel',tree:'Baum',column:'Säule',rock:'Felsen',hill:'Hügel',pine:'Tanne',bush:'Strauch',flower:'Blume',crystal:'Kristall'},groundNames={meadow:'Wiese',sand:'Wüste',snow:'Schnee'},clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let scene=Core.fresh(),selected=null,playing=false,dirty=false,gl,program,u,shapes={},grid;
let savedSnapshot=Core.serialize(scene),history=Core.createHistory(scene),brush='orbit',terrainMesh=null,terrainSource=null;
const collected=new Set();
const round={seconds:0,finished:false,best:null};
const audio=window.SDGameAudio?.createController(window.AudioContext||window.webkitAudioContext);
const formatTime=n=>Math.max(0,Number(n)||0).toFixed(1)+' s';
const player={x:0,y:0,z:5,vy:0};
const pose={heading:0,walk:0,phase:0,clock:0,state:'idle'};
const camera={azimuth:.55,elev:.48,distance:21,targetX:0,targetZ:0};
const keys={forward:false,back:false,left:false,right:false,jump:false,run:false};
const say=message=>$('status').textContent=message;
const id=()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
function mm(a,b){const c=Array(16).fill(0);for(let i=0;i<4;i++)for(let j=0;j<4;j++)for(let k=0;k<4;k++)c[i*4+j]+=a[k*4+j]*b[i*4+k];return c;}
function translate(x,y,z){const m=id();m[12]=x;m[13]=y;m[14]=z;return m;}
function scale(x,y,z){const m=id();m[0]=x;m[5]=y;m[10]=z;return m;}
function rotateY(a){const c=Math.cos(a),s=Math.sin(a);return[c,0,-s,0,0,1,0,0,s,0,c,0,0,0,0,1];}
function rotateX(a){const c=Math.cos(a),s=Math.sin(a);return[1,0,0,0,0,c,s,0,0,-s,c,0,0,0,0,1];}
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
function boulder(){
const t=(1+Math.sqrt(5))/2;
const raw=[[-1,t,0],[1,t,0],[-1,-t,0],[1,-t,0],[0,-1,t],[0,1,t],[0,-1,-t],[0,1,-t],[t,0,-1],[t,0,1],[-t,0,-1],[-t,0,1]];
const faces=[[0,11,5],[0,5,1],[0,1,7],[0,7,10],[0,10,11],[1,5,9],[5,11,4],[11,10,2],[10,7,6],[7,1,8],[3,9,4],[3,4,2],[3,2,6],[3,6,8],[3,8,9],[4,9,5],[2,4,11],[6,2,10],[8,6,7],[9,8,1]];
const points=raw.map((v,i)=>{const radius=.87+Math.sin((i+1)*5.17)*.11;const p=norm(v);return[p[0]*radius,p[1]*radius,p[2]*radius];});
return triangles(faces.map(face=>face.map(index=>points[index])));
}
function gem(){
const top=[0,1,0],bottom=[0,-1,0],rim=[[1,0,0],[0,0,1],[-1,0,0],[0,0,-1]],faces=[];
for(let i=0;i<4;i++){const a=rim[i],b=rim[(i+1)%4];faces.push([top,b,a],[bottom,a,b]);}
return triangles(faces);
}
function buildTerrain(){
const t=scene.terrain,vertices=[],size=Core.GRID,step=Core.STEP;
function node(col,row){
const index=row*size+col,x=-20+col*step,z=-20+row*step;
const lx=Math.max(col-1,0),rx=Math.min(col+1,size-1);
const nz=Math.max(row-1,0),pz=Math.min(row+1,size-1);
const dx=(t[row*size+rx]-t[row*size+lx])/((rx-lx)*step);
const dz=(t[pz*size+col]-t[nz*size+col])/((pz-nz)*step);
return{position:[x,t[index],z],normal:norm([-dx,1,-dz])};
}
function face(a,b,c){
for(const v of [a,b,c])vertices.push(...v.position,...v.normal);
}
for(let row=0;row<size-1;row++)for(let col=0;col<size-1;col++){
const a=node(col,row),b=node(col+1,row),c=node(col,row+1),d=node(col+1,row+1);
face(a,c,b);face(b,c,d);
}
if(terrainMesh)gl.deleteBuffer(terrainMesh.buffer);
terrainMesh=mesh(vertices);terrainSource=t;
}
function gridlines(){const a=[];for(let p=-20;p<=20;p++){a.push(-20,.012,p,0,1,0,20,.012,p,0,1,0,p,.012,-20,0,1,0,p,.012,20,0,1,0);}return mesh(a);}
function compile(type,source){const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error('3D-Shaderfehler: '+gl.getShaderInfoLog(shader));return shader;}
function setup(){
gl=canvas.getContext('webgl',{alpha:false,antialias:true,depth:true});
if(!gl)throw Error('WebGL nicht verfügbar. Bitte einen Browser mit aktivierter 3D-Grafik verwenden.');
// Simple physically-inspired directional light, hemispheric fill, distance haze and procedural terrain tint.
const vertex='attribute vec3 pos;attribute vec3 normal;uniform mat4 proj,view,model;varying vec3 worldPos;varying vec3 worldNormal;void main(){vec4 world=model*vec4(pos,1.);worldPos=world.xyz;vec3 a=model[0].xyz,b=model[1].xyz,c=model[2].xyz;worldNormal=normalize(a*normal.x/max(dot(a,a),.0001)+b*normal.y/max(dot(b,b),.0001)+c*normal.z/max(dot(c,c),.0001));gl_Position=proj*view*world;}';
const fragment='precision mediump float;uniform vec3 tint,sunColor,sunDir,ambientColor,fogColor,eyePosition;uniform float terrainKind;varying vec3 worldPos,worldNormal;void main(){vec3 n=normalize(worldNormal);vec3 base=tint;if(terrainKind>.5){float slope=1.-clamp(n.y,0.,1.);float h=clamp(worldPos.y/3.,0.,1.);float variation=sin(worldPos.x*1.37)*sin(worldPos.z*1.11)*.035;if(terrainKind<1.5){base=mix(vec3(.23,.43,.29),vec3(.43,.49,.32),h*.6);base=mix(base,vec3(.39,.36,.31),smoothstep(.13,.7,slope)*.55);}else if(terrainKind<2.5){base=mix(vec3(.69,.56,.37),vec3(.83,.73,.54),h);base=mix(base,vec3(.61,.47,.35),smoothstep(.15,.75,slope)*.35);}else{base=mix(vec3(.74,.83,.88),vec3(.92,.96,1.),h);base=mix(base,vec3(.54,.66,.72),smoothstep(.13,.7,slope)*.4);}base=clamp(base+variation,0.,1.);}float lambert=max(dot(n,sunDir),0.);vec3 light=ambientColor*(.72+.28*clamp(n.y,0.,1.))+sunColor*lambert;vec3 viewDir=normalize(eyePosition-worldPos);float gloss=pow(max(dot(reflect(-sunDir,n),viewDir),0.),24.);vec3 shaded=base*light+sunColor*gloss*(terrainKind>.5?.025:.08);float distanceToEye=length(eyePosition-worldPos);float haze=clamp(1.-exp(-distanceToEye*distanceToEye/6500.),0.,.38);gl_FragColor=vec4(mix(shaded,fogColor,haze),1.);}';
program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);
if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('3D-Programmfehler: '+gl.getProgramInfoLog(program));
gl.useProgram(program);
u={pos:gl.getAttribLocation(program,'pos'),normal:gl.getAttribLocation(program,'normal'),proj:gl.getUniformLocation(program,'proj'),view:gl.getUniformLocation(program,'view'),model:gl.getUniformLocation(program,'model'),tint:gl.getUniformLocation(program,'tint'),sunColor:gl.getUniformLocation(program,'sunColor'),sunDir:gl.getUniformLocation(program,'sunDir'),ambientColor:gl.getUniformLocation(program,'ambientColor'),fogColor:gl.getUniformLocation(program,'fogColor'),eyePosition:gl.getUniformLocation(program,'eyePosition'),terrainKind:gl.getUniformLocation(program,'terrainKind')};
gl.enableVertexAttribArray(u.pos);gl.enableVertexAttribArray(u.normal);gl.enable(gl.DEPTH_TEST);
shapes={box:cuboid(),sphere:globe(),column:cylinder(false),cone:cylinder(true),boulder:boulder(),gem:gem()};grid=gridlines();
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();say('3D-Kontext verloren. Bitte Seite neu laden.');});
}
function color(hex){return[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255);}
function draw(shape,tint,m,mode,material=0){const mesh=typeof shape==='string'?shapes[shape]:shape;gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);gl.vertexAttribPointer(u.pos,3,gl.FLOAT,false,24,0);gl.vertexAttribPointer(u.normal,3,gl.FLOAT,false,24,12);gl.uniformMatrix4fv(u.model,false,new Float32Array(m));gl.uniform3fv(u.tint,color(tint));gl.uniform1f(u.terrainKind,material);gl.drawArrays(mode||gl.TRIANGLES,0,mesh.count);}
function part(shape,tint,x,y,z,a,b,c){draw(shape,tint,mm(translate(x,y,z),scale(a,b,c)));}
function object(o){
const s=o.scale,x=o.x,z=o.z,base=Core.terrainHeight(scene.terrain,x,z);
const drawPart=(shape,tint,px,y,pz,a,b,c)=>part(shape,tint,px,y+base,pz,a,b,c);
const foliage=['#408d75','#39836e','#67b39a'];
if(o.type==='crystal'){
if(playing&&collected.has(o.id))return;
const hover=1.05*s+Math.sin(pose.clock*2+o.id)*.12;
draw('gem',o.color,mm(translate(x,base+hover,z),mm(rotateY(pose.clock*1.5),scale(.62*s,.8*s,.62*s))));
}
if(o.type==='box')drawPart('box',o.color,x,s,z,s,s,s);
if(o.type==='sphere')drawPart('sphere',o.color,x,s,z,s,s,s);
if(o.type==='column')drawPart('column',o.color,x,s*1.5,z,.75*s,1.5*s,.75*s);
if(o.type==='hill')drawPart('sphere',o.color,x,.1*s,z,2.3*s,.9*s,2.3*s);
if(o.type==='rock'){
const lean=Math.sin(o.id*2.1)*.15;
drawPart('boulder',o.color,x,.67*s,z,1.05*s,.74*s,1.18*s);
drawPart('boulder','#8299a7',x+.42*s+lean,.3*s,z-.28*s,.49*s,.33*s,.42*s);
}
if(o.type==='tree'){
drawPart('column','#735d4b',x,1.18*s,z,.25*s,1.18*s,.25*s);
for(const [dx,dy,dz,r,tint] of [
[-.66,2.35,0,.92,o.color],[.64,2.48,.02,1.01,foliage[0]],
[0,3.15,0,1.09,foliage[1]],[-.15,2.65,-.58,.87,foliage[2]],
[.15,2.75,.65,.79,o.color]
])drawPart('sphere',tint,x+dx*s,dy*s,z+dz*s,r*s,r*.83*s,r*s);
}
if(o.type==='pine'){
drawPart('column','#765c49',x,1.2*s,z,.22*s,1.2*s,.22*s);
drawPart('cone',foliage[1],x,2.04*s,z,1.18*s,1.34*s,1.18*s);
drawPart('cone',o.color,x,2.95*s,z,.93*s,1.26*s,.93*s);
drawPart('cone',foliage[2],x,3.76*s,z,.65*s,.95*s,.65*s);
}
if(o.type==='bush'){
drawPart('sphere',o.color,x,.52*s,z,.72*s,.58*s,.68*s);
drawPart('sphere',foliage[0],x-.45*s,.45*s,z-.12*s,.48*s,.44*s,.47*s);
drawPart('sphere',foliage[2],x+.40*s,.50*s,z+.08*s,.47*s,.48*s,.45*s);
drawPart('sphere',foliage[1],x,.78*s,z-.1*s,.45*s,.46*s,.44*s);
}
if(o.type==='flower'){
drawPart('column','#408d75',x,.43*s,z,.035*s,.43*s,.035*s);
drawPart('sphere','#5ebbb0',x-.12*s,.32*s,z,.16*s,.07*s,.11*s);
drawPart('sphere','#5ebbb0',x+.11*s,.49*s,z,.15*s,.06*s,.10*s);
for(let i=0;i<5;i++){
const theta=i*Math.PI*2/5;
drawPart('sphere',o.color,x+Math.cos(theta)*.15*s,.88*s+Math.sin(theta)*.15*s,z,.16*s,.15*s,.065*s);
}
drawPart('sphere','#f1c66c',x,.88*s,z+.07*s,.13*s,.13*s,.10*s);
}
if(!playing&&o.id===selected){
const radius=(o.type==='flower'?.34:o.type==='bush'?.72:1.08)*s;
drawPart('box','#f8d481',x,.05,z,radius,.05,radius);
}
}
const outfitColors={
explorer:{shirt:'#377d90',trim:'#f1c66c',pants:'#34475c',hat:'#dbb36b',skin:'#e6ba94'},
sport:{shirt:'#dc6d4e',trim:'#f6ebe4',pants:'#283a4d',hat:'#38475a',skin:'#dca57f'},
night:{shirt:'#6854a3',trim:'#83daca',pants:'#202b47',hat:'#2c3655',skin:'#e9bc9f'}
};
function character(){
const outfit=outfitColors[scene.avatar]||outfitColors.explorer;
const terrain=Core.terrainHeight(scene.terrain,player.x,player.z);
const y=player.y+terrain,breathe=Math.sin(pose.clock*2)*.015;
const airborne=playing&&player.y>.045,activity=playing?pose.walk:0;
const step=Math.sin(pose.phase)*.55*activity,hop=airborne?-.38:0;
const bounce=airborne?0:Math.abs(Math.sin(pose.phase))*.032*activity;
const root=mm(translate(player.x,y+bounce,player.z),rotateY(pose.heading));
function piece(shape,tint,x,h,z,sx,sy,sz,rotation=0){
const local=mm(translate(x,h,z),mm(rotateX(rotation),scale(sx,sy,sz)));
draw(shape,tint,mm(root,local));
}
function limb(tint,x,shoulder,length,width,angle,boot){
const pivot=mm(root,mm(translate(x,shoulder,0),rotateX(angle)));
const body=mm(translate(0,-length/2,0),scale(width,length/2,width*.9));
draw('column',tint,mm(pivot,body));
if(boot){const shoe=mm(translate(0,-length+.04,.13),scale(width*1.25,.13,width*1.55));draw('box',outfit.hat,mm(pivot,shoe));}
else{const hand=mm(translate(0,-length-.02,0),scale(width*.75,.12,width*.75));draw('sphere',outfit.skin,mm(pivot,hand));}
}
piece('sphere','#1e2836',0,.045,0,.42,.045,.28); // stylisierte Kontaktschattenfläche
limb(outfit.pants,-.21,.79,.69,.16,-step*.95+hop,true);
limb(outfit.pants,.21,.79,.69,.16,step*.95+hop,true);
piece('box',outfit.shirt,0,1.20+breathe,0,.40,.48,.28);
piece('box',outfit.trim,0,.94+breathe,.284,.27,.055,.025);
limb(outfit.shirt,-.48,1.51,.69,.145,step+(-hop*.65),false);
limb(outfit.shirt,.48,1.51,.69,.145,-step+(-hop*.65),false);
piece('sphere',outfit.skin,0,1.94+breathe,0,.32,.35,.32);
piece('sphere','#293345',-.125,1.97+breathe,.292,.045,.065,.04);
piece('sphere','#293345',.125,1.97+breathe,.292,.045,.065,.04);
piece('sphere','#ad675e',0,1.79+breathe,.306,.064,.031,.023);
piece('box',outfit.hat,0,2.24+breathe,0,.33,.11,.32);
piece('box',outfit.hat,0,2.16+breathe,.21,.36,.035,.22);
piece('box',outfit.trim,0,1.49+breathe,.282,.24,.045,.026);
}
function updatePose(dt,wasMoving){
pose.clock+=dt;
const motion=playing?Core.direction(keys,camera.azimuth):{moving:false,x:0,z:0};
const moving=playing&&motion.moving&&wasMoving;
pose.walk+=((moving?(keys.run?1.3:1):0)-pose.walk)*Math.min(1,dt*9);
if(moving){
const heading=Math.atan2(motion.x,motion.z);
const delta=Math.atan2(Math.sin(heading-pose.heading),Math.cos(heading-pose.heading));
pose.heading+=delta*Math.min(1,dt*12);
}
if(pose.walk>.01)pose.phase+=dt*(keys.run?15:10);
pose.state=playing?(player.y>.045?'jump':moving?(keys.run?'run':'walk'):'idle'):'preview';
$('characterState').textContent=({preview:'VORSCHAU',idle:'STEHEN',walk:'LAUFEN',run:'SPRINTEN',jump:'SPRINGEN'})[pose.state];
doc.body.dataset.characterState=pose.state;
}
function dimensions(){const d=Math.min(window.devicePixelRatio||1,2),w=Math.max(1,Math.round(canvas.clientWidth*d)),h=Math.max(1,Math.round(canvas.clientHeight*d));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}gl.viewport(0,0,w,h);return{w,h};}
function matrices(){const{w,h}=dimensions(),tx=playing?player.x:camera.targetX,tz=playing?player.z:camera.targetZ,d=playing?10:camera.distance,e=playing?.5:camera.elev;const eye=[tx+d*Math.sin(camera.azimuth)*Math.cos(e),d*Math.sin(e)+(playing?2:0)+(playing?Core.terrainHeight(scene.terrain,player.x,player.z):0),tz+d*Math.cos(camera.azimuth)*Math.cos(e)];const target=[tx,playing?1.1+player.y+Core.terrainHeight(scene.terrain,player.x,player.z):0,tz];return{view:look(eye,target),proj:perspective(.838,w/h,.1,120),eye,target};}
const terrains={meadow:{soil:'#365e54',grid:'#517d72',kind:1},sand:{soil:'#a48b65',grid:'#c5a879',kind:2},snow:{soil:'#bacbd3',grid:'#d5e3e6',kind:3}};
const lightingPresets={
dawn:{sky:[.40,.25,.27],sun:[1,.68,.47],ambient:[.30,.28,.36],direction:[-.8,.38,.32],fog:[.40,.30,.34]},
day:{sky:[.32,.54,.73],sun:[.89,.92,.99],ambient:[.36,.40,.43],direction:[-.5,.92,.36],fog:[.36,.52,.66]},
sunset:{sky:[.33,.20,.30],sun:[1,.52,.32],ambient:[.30,.24,.35],direction:[.8,.29,.22],fog:[.40,.28,.35]},
night:{sky:[.035,.052,.09],sun:[.36,.44,.63],ambient:[.13,.17,.26],direction:[.46,.57,-.4],fog:[.09,.13,.20]}
};
function render(){
const m=matrices(),terrain=terrains[scene.ground]||terrains.meadow,light=lightingPresets[scene.lighting]||lightingPresets.day;
gl.clearColor(...light.sky,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
gl.uniformMatrix4fv(u.view,false,new Float32Array(m.view));gl.uniformMatrix4fv(u.proj,false,new Float32Array(m.proj));
gl.uniform3fv(u.sunColor,light.sun);gl.uniform3fv(u.sunDir,norm(light.direction));gl.uniform3fv(u.ambientColor,light.ambient);
gl.uniform3fv(u.fogColor,light.fog);gl.uniform3fv(u.eyePosition,m.eye);
part('box',terrain.soil,0,-.26,0,20,.25,20);
if(terrainSource!==scene.terrain)buildTerrain();
draw(terrainMesh,terrain.soil,id(),gl.TRIANGLES,terrain.kind);
draw(grid,terrain.grid,id(),gl.LINES);scene.objects.forEach(object);character();
}
function project(x,y,z){const{view,proj}=matrices(),m=mm(proj,view),p=[x,y,z,1],out=[];for(let r=0;r<4;r++)out[r]=m[r]*p[0]+m[r+4]*p[1]+m[r+8]*p[2]+m[r+12]*p[3];if(out[3]<=0)return null;return{x:(out[0]/out[3]+1)*canvas.clientWidth/2,y:(1-out[1]/out[3])*canvas.clientHeight/2};}
function pick(cx,cy){const rect=canvas.getBoundingClientRect(),x=cx-rect.left,y=cy-rect.top;let best=null,distance=Infinity;for(const o of scene.objects){const p=project(o.x,(o.type==='tree'?2.7:o.type==='hill'?.65:o.type==='rock'?.75:o.type==='flower'?.88:o.type==='crystal'?1.1:o.type==='bush'?.55:o.type==='pine'?2.55:1)*o.scale+Core.terrainHeight(scene.terrain,o.x,o.z),o.z);if(!p)continue;const d=Math.hypot(x-p.x,y-p.y);if(d<48&&d<distance){best=o.id;distance=d;}}select(best);}
function select(id){selected=id;const o=scene.objects.find(x=>x.id===selected);$('inspectorEmpty').hidden=!!o;$('inspectorFields').hidden=!o;if(o){$('selectedTitle').textContent=names[o.type]+' #'+o.id;$('propX').value=o.x;$('propZ').value=o.z;$('propScale').value=o.scale;$('propColor').value=o.color;}
$('duplicateObject').disabled=playing||!o;
document.querySelectorAll('[data-object-id]').forEach(el=>el.classList.toggle('chosen',+el.dataset.objectId===id));}
function refreshTerrain(){document.querySelectorAll('[data-ground]').forEach(b=>{const active=b.dataset.ground===scene.ground;b.classList.toggle('chosen',active);b.setAttribute('aria-pressed',String(active));});}
function refreshLighting(){document.querySelectorAll('[data-light]').forEach(b=>{const active=b.dataset.light===scene.lighting;b.classList.toggle('chosen',active);b.setAttribute('aria-pressed',String(active));});}
function refreshAvatar(){document.querySelectorAll('[data-avatar]').forEach(b=>{const active=b.dataset.avatar===scene.avatar;b.classList.toggle('chosen',active);b.setAttribute('aria-pressed',String(active));});}
function selectBrush(tool){brush=tool;document.querySelectorAll('[data-brush]').forEach(b=>{const active=b.dataset.brush===tool;b.classList.toggle('chosen',active);b.setAttribute('aria-pressed',String(active));});canvas.classList.toggle('sculpting',tool!=='orbit');$('editHint').textContent=tool==='orbit'?'Maus oder Finger ziehen: Kamera drehen · Mausrad: Zoom · Objekt antippen: auswählen':'Pinsel aktiv: Finger oder Maus über das Gelände ziehen · Mit „Kamera“ wieder drehen';}
function list(){const h=$('sceneList');h.replaceChildren();for(const o of scene.objects){const btn=doc.createElement('button');btn.type='button';btn.className='scene-item';btn.dataset.objectId=String(o.id);btn.textContent=names[o.type]+' · '+o.id;btn.addEventListener('click',()=>select(o.id));h.appendChild(btn);}$('objectCount').textContent=String(scene.objects.length);select(selected&&scene.objects.some(x=>x.id===selected)?selected:null);refreshHistory();refreshTerrain();refreshLighting();refreshAvatar();selectBrush(brush);}
function syncDirty(){dirty=Core.serialize(scene)!==savedSnapshot;$('sceneName').textContent=scene.name+(dirty?' •':'');}
function refreshHistory(){$('undoAction').disabled=playing||!history.canUndo;$('redoAction').disabled=playing||!history.canRedo;}
function changed(msg){round.best=null;history.record(scene);syncDirty();say(msg);list();}
function travel(direction){
if(playing)return;
const next=history[direction]();if(!next)return;
scene=next;round.best=null;selected=scene.objects.some(o=>o.id===selected)?selected:null;
syncDirty();list();say(direction==='undo'?'Änderung rückgängig gemacht.':'Änderung wiederhergestellt.');
}
function duplicateSelected(){
if(playing||selected==null)return;
try{const copy=Core.duplicate(scene,selected);selected=copy.id;changed('Objekt dupliziert.');}
catch(err){say(err.message);}
}
function refreshGoal(){
const total=scene.objects.filter(o=>o.type==='crystal').length;
$('goalHud').hidden=!playing;
$('goalCount').textContent=total?collected.size+' / '+total+' Kristalle':'Noch keine Kristalle';
$('goalHint').textContent=total?(round.finished?'Geschafft! Neue Runde starten.':'Sammle alle Kristalle'):'Platziere Kristalle im Bearbeiten-Modus';
$('goalTime').textContent=formatTime(round.seconds);
$('goalBest').textContent=round.best==null?'Bestzeit: –':'Bestzeit: '+formatTime(round.best);
$('goalHud').classList.toggle('complete',playing&&round.finished);
}
function resetRound(){
collected.clear();
round.seconds=0;round.finished=false;
Object.assign(player,{x:0,y:0,z:5,vy:0});
Object.keys(keys).forEach(k=>keys[k]=false);
refreshGoal();
}
function mode(play){if(play){selectBrush('orbit');if(!playing)resetRound();}playing=play;$('modeEdit').classList.toggle('active',!play);$('modePlay').classList.toggle('active',play);$('modeEdit').setAttribute('aria-pressed',String(!play));$('modePlay').setAttribute('aria-pressed',String(play));$('editHint').hidden=play;$('playHint').hidden=!play;$('touchControls').hidden=!play;document.querySelectorAll('[data-edit-only]').forEach(el=>el.disabled=play);refreshHistory();select(selected);refreshGoal();if(!play)Object.keys(keys).forEach(k=>keys[k]=false);say(play?'Spielmodus: Sammle Kristalle mit WASD / Pfeilen oder Touch.':'Bearbeiten: Objekt wählen, hinzufügen oder Kamera drehen.');}
function add(type){if(playing)return;try{const o=Core.add(scene,type,Math.round(camera.targetX),Math.round(camera.targetZ-2));selected=o.id;changed(names[type]+' hinzugefügt.');}catch(err){say(err.message);}}
function addNatureGroup(group){
if(playing)return;
try{
const objects=Core.plantGroup(scene,group,Math.round(camera.targetX),Math.round(camera.targetZ));
selected=objects[objects.length-1].id;
changed((group==='grove'?'Waldstück':'Blumenwiese')+' angelegt ('+objects.length+' Objekte).');
}catch(err){say(err.message);}
}
function save(){const data=Core.serialize(scene),blob=new Blob([data],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=doc.createElement('a');a.href=url;a.download='sd-game-scene.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);savedSnapshot=data;syncDirty();say('Szene heruntergeladen. Andere Projekte bleiben unverändert.');}
function load(file){if(!file)return;if(file.size>60000){say('Datei zu groß.');return;}file.text().then(text=>{const next=Core.parse(text);scene=next;round.best=null;history.reset(next);savedSnapshot=Core.serialize(next);selected=null;Object.assign(player,{x:0,y:0,z:5,vy:0});syncDirty();list();say('Szene geladen.');}).catch(e=>say('Import abgebrochen: '+e.message));}
document.querySelectorAll('[data-add]').forEach(b=>b.addEventListener('click',()=>add(b.dataset.add)));
document.querySelectorAll('[data-nature-group]').forEach(b=>b.addEventListener('click',()=>addNatureGroup(b.dataset.natureGroup)));
document.querySelectorAll('[data-brush]').forEach(b=>b.addEventListener('click',()=>{if(!playing)selectBrush(b.dataset.brush);}));
document.querySelectorAll('[data-avatar]').forEach(b=>b.addEventListener('click',()=>{
if(playing)return;
try{Core.setAvatar(scene,b.dataset.avatar);changed('Spielfigur-Outfit geändert.');}
catch(err){say(err.message);}
}));
document.querySelectorAll('[data-light]').forEach(b=>b.addEventListener('click',()=>{
if(playing)return;
try{Core.setLighting(scene,b.dataset.light);changed('Lichtstimmung aktualisiert.');}
catch(err){say(err.message);}
}));
document.querySelectorAll('[data-ground]').forEach(b=>b.addEventListener('click',()=>{
if(playing)return;
try{Core.setGround(scene,b.dataset.ground);changed('Landschaft: '+groundNames[scene.ground]+'.');}
catch(err){say(err.message);}
}));
$('modeEdit').addEventListener('click',()=>mode(false));$('modePlay').addEventListener('click',()=>mode(true));
$('restartRound').addEventListener('click',()=>{if(playing){resetRound();say('Neue Runde! Sammle alle Kristalle.');}});
$('soundToggle').addEventListener('click',()=>{
const on=audio?.setEnabled(!audio.enabled)||false;
$('soundToggle').setAttribute('aria-pressed',String(on));
$('soundToggle').textContent=on?'🔊 Ton an':'🔇 Ton aus';
if(on)audio.play('toggle');
else if(!audio)say('Ton wird von diesem Browser nicht unterstützt.');
});
window.addEventListener('pagehide',()=>audio?.dispose(),{once:true});
$('saveScene').addEventListener('click',save);$('loadScene').addEventListener('click',()=>$('sceneFile').click());
$('sceneFile').addEventListener('change',e=>{load(e.target.files[0]);e.target.value='';});
$('resetScene').addEventListener('click',()=>{if(dirty&&!window.confirm('Ungespeicherte Änderungen wirklich verwerfen?'))return;scene=Core.fresh();selected=null;changed('Beispielwelt wiederhergestellt (rückgängig möglich).');});
$('deleteObject').addEventListener('click',()=>{if(selected!=null){Core.remove(scene,selected);selected=null;changed('Objekt entfernt.');}});
$('duplicateObject').addEventListener('click',duplicateSelected);
$('undoAction').addEventListener('click',()=>travel('undo'));
$('redoAction').addEventListener('click',()=>travel('redo'));
for(const name of ['X','Z','Scale','Color'])$('prop'+name).addEventListener('change',e=>{if(selected==null)return;const key=name.toLowerCase(),value=key==='color'?e.target.value:Number(e.target.value);try{Core.update(scene,selected,{[key]:value});changed('Objekt aktualisiert.');}catch(err){say(err.message);select(selected);}});
$('cameraReset').addEventListener('click',()=>{Object.assign(camera,{azimuth:.55,elev:.48,distance:21,targetX:0,targetZ:0});say('Kamera zurückgesetzt.');});
const bindings={KeyW:'forward',ArrowUp:'forward',KeyS:'back',ArrowDown:'back',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',Space:'jump',ShiftLeft:'run',ShiftRight:'run'};
function key(e,down){if(!playing||/^(INPUT|TEXTAREA|SELECT)$/.test(doc.activeElement.tagName))return;const k=bindings[e.code];if(k){e.preventDefault();if(down&&k==='jump'&&!keys.jump&&player.y<=.001)audio?.play('jump');keys[k]=down;}}
function shortcut(e){
if(playing||!(e.ctrlKey||e.metaKey)||e.altKey||e.repeat||/^(INPUT|TEXTAREA|SELECT)$/.test(doc.activeElement.tagName)||doc.activeElement.isContentEditable)return false;
const k=e.key.toLowerCase();
if(k==='z'){e.preventDefault();travel(e.shiftKey?'redo':'undo');return true;}
if(k==='y'&&!e.shiftKey){e.preventDefault();travel('redo');return true;}
if(k==='d'&&!e.shiftKey){e.preventDefault();duplicateSelected();return true;}
return false;
}
window.addEventListener('keydown',e=>{if(!shortcut(e))key(e,true);});window.addEventListener('keyup',e=>key(e,false));window.addEventListener('blur',()=>Object.keys(keys).forEach(k=>keys[k]=false));
document.querySelectorAll('[data-control]').forEach(b=>{const k=b.dataset.control;b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);if(k==='jump'&&!keys.jump&&player.y<=.001)audio?.play('jump');keys[k]=true;});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,e=>{e.preventDefault();keys[k]=false;});});
function groundPoint(clientX,clientY){
const rect=canvas.getBoundingClientRect(),m=matrices();
const forward=norm(m.target.map((v,i)=>v-m.eye[i])),right=norm(cross(forward,[0,1,0])),up=norm(cross(right,forward));
const nx=(clientX-rect.left)/rect.width*2-1,ny=1-(clientY-rect.top)/rect.height*2;
const tan=Math.tan(.838/2),aspect=rect.width/rect.height;
const direction=norm(forward.map((v,i)=>v+right[i]*nx*tan*aspect+up[i]*ny*tan));
if(direction[1]>=-.002)return null;
let distance=-m.eye[1]/direction[1];
if(distance<=0)return null;
for(let i=0;i<5;i++){
const x=m.eye[0]+distance*direction[0],z=m.eye[2]+distance*direction[2];
const surface=Core.terrainHeight(scene.terrain,x,z);
distance=(surface-m.eye[1])/direction[1];
}
const x=m.eye[0]+distance*direction[0],z=m.eye[2]+distance*direction[2];
return Math.abs(x)<=20&&Math.abs(z)<=20?{x,z}:null;
}
function paint(clientX,clientY){
const point=groundPoint(clientX,clientY);
if(!point||!pointer)return;
const radius=Number($('brushRadius').value);
if(Core.sculpt(scene,brush,point.x,point.z,radius,.35)){
pointer.sculpted=true;syncDirty();say('Gelände wird geformt …');
}
}
function endPointer(cancelled,e){
if(!pointer)return;
if(pointer.sculpted)changed('Gelände bearbeitet.');
else if(!cancelled&&!pointer.moved&&brush==='orbit'&&!playing)pick(e.clientX,e.clientY);
pointer=null;
}
let pointer=null;
canvas.addEventListener('pointerdown',e=>{
if(playing||!e.isPrimary)return;
pointer={id:e.pointerId,x:e.clientX,y:e.clientY,moved:brush!=='orbit',sculpted:false};
canvas.setPointerCapture(e.pointerId);
if(brush!=='orbit')paint(e.clientX,e.clientY);
});
canvas.addEventListener('pointermove',e=>{
if(!pointer||pointer.id!==e.pointerId||playing)return;
const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;
if(brush!=='orbit'){if(Math.abs(dx)+Math.abs(dy)>2)paint(e.clientX,e.clientY);}
else{if(Math.abs(dx)+Math.abs(dy)>2)pointer.moved=true;camera.azimuth=(camera.azimuth-dx*.007)%(2*Math.PI);camera.elev=clamp(camera.elev+dy*.006,.12,1.26);}
pointer.x=e.clientX;pointer.y=e.clientY;
});
canvas.addEventListener('pointerup',e=>{if(pointer&&pointer.id===e.pointerId)endPointer(false,e);});
canvas.addEventListener('pointercancel',e=>{if(pointer&&pointer.id===e.pointerId)endPointer(true,e);});
canvas.addEventListener('wheel',e=>{if(!playing){e.preventDefault();camera.distance=clamp(camera.distance+e.deltaY*.02,6,48);}},{passive:false});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
let before=0;function tick(now){
const dt=before?Math.min((now-before)/1000,.05):0;before=now;
if(!doc.hidden){
const previousX=player.x,previousZ=player.z;
if(playing){
Core.move(player,keys,dt,scene.objects,camera.azimuth);
const total=scene.objects.filter(o=>o.type==='crystal').length;
if(total&&!round.finished){
round.seconds+=dt;
const found=Core.collectNearby(player,scene.objects,collected);
if(found.length){
for(const crystalId of found)collected.add(crystalId);
round.finished=collected.size===total;
audio?.play(round.finished?'complete':'collect');
if(round.finished&&(round.best==null||round.seconds<round.best))round.best=round.seconds;
say(round.finished?'Geschafft! Alle Kristalle eingesammelt.':'Kristall eingesammelt!');
}
}
if($('goalTime').textContent!==formatTime(round.seconds)||round.finished)$('goalTime').textContent=formatTime(round.seconds);
if($('goalCount').textContent!==(total?collected.size+' / '+total+' Kristalle':'Noch keine Kristalle')|| (round.finished&&!$('goalHud').classList.contains('complete')))refreshGoal();
}
updatePose(dt,Math.hypot(player.x-previousX,player.z-previousZ)>.00001);
render();
}
requestAnimationFrame(tick);
}
try{setup();list();mode(false);doc.body.dataset.ready='true';requestAnimationFrame(tick);}catch(err){doc.body.dataset.ready='error';say(err.message);$('stageError').hidden=false;$('stageError').textContent=err.message;}
})();