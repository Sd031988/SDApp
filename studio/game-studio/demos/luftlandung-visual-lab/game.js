/* SD Luftlandung Visual Lab — separate, opt-in Babylon.js experiment.
 * Does not alter SD Engine, SD projects or persistent browser data.
 */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const canvas = $('game'), status = $('status'), intro = $('intro');
  const start = $('start');
  const BAB = window.BABYLON;
  if (!BAB) { status.textContent = 'Babylon.js konnte nicht geladen werden. Bitte Internetverbindung prüfen.'; start.disabled = true; return; }
  const isTouch = window.matchMedia('(pointer:coarse)').matches;
  const engine = new BAB.Engine(canvas, true, { stencil: false, preserveDrawingBuffer: false, powerPreference: 'high-performance' });
  if (isTouch) engine.setHardwareScalingLevel(Math.min(1.7, window.devicePixelRatio || 1.5));
  const scene = new BAB.Scene(engine);
  scene.clearColor = new BAB.Color4(0.48, 0.76, 0.94, 1);
  scene.fogMode = BAB.Scene.FOGMODE_EXP2; scene.fogDensity = 0.0015;
  scene.fogColor = new BAB.Color3(0.65, 0.82, 0.91);
  scene.collisionsEnabled = false;
  const camera = new BAB.FreeCamera('thirdPerson', new BAB.Vector3(0, 8, -13), scene);
  camera.minZ = 0.1; camera.maxZ = 1100; camera.fov = 0.96;
  scene.activeCamera = camera;
  const hemi = new BAB.HemisphericLight('ambientSky', new BAB.Vector3(0.2, 1, 0), scene);
  hemi.intensity = 0.91; hemi.groundColor = BAB.Color3.FromHexString('#4b6551');
  const sun = new BAB.DirectionalLight('sun', new BAB.Vector3(-0.45, -0.89, 0.35), scene);
  sun.intensity = 2.0; sun.position = new BAB.Vector3(100, 180, -80);
  const shadow = new BAB.ShadowGenerator(isTouch ? 512 : 1024, sun);
  shadow.useBlurExponentialShadowMap = true; shadow.blurKernel = 16;
  let pipe = null;
  try {
    pipe = new BAB.DefaultRenderingPipeline('cinematic', true, scene, [camera]);
    pipe.fxaaEnabled = true;
    if (!isTouch) { pipe.bloomEnabled = true; pipe.bloomWeight = 0.14; pipe.bloomThreshold = 0.83; }
    pipe.imageProcessingEnabled = true;
    pipe.imageProcessing.contrast = 1.14;
    pipe.imageProcessing.exposure = 1.07;
  } catch (err) { console.warn('Postprocessing wird übersprungen', err); }
  let seed = 53321;
  function rnd() { seed = (Math.imul(seed, 1664525) + 1013904223) | 0; return (seed >>> 0) / 4294967296; }
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  function height(x,z) {
    const ridge = 8 * Math.sin(x*0.017+0.6) * Math.cos(z*0.013-0.3);
    const hills = 5 * Math.sin(z*0.03+x*0.009) + 2.2 * Math.cos(x*0.051-z*0.024);
    const near = Math.max(0, 1-Math.hypot(x,z)/35);
    return 3 + (ridge + hills) * (1-near*0.82) + 1.2*Math.sin(x*0.12)*Math.sin(z*0.1);
  }
  function material(name, hex, rough=0.85, metal=0) {
    const mat = new BAB.PBRMaterial(name, scene);
    mat.albedoColor = BAB.Color3.FromHexString(hex); mat.roughness = rough; mat.metallic = metal;
    return mat;
  }
  const mats = {
    grass: material('grassTextureBase','#759d54'),
    grassBlade: material('grassBlade','#4e863d'),
    sand: material('sand','#d7bf85'), trunk: material('palmTrunk','#77603c'),
    palm: material('palmLeaf','#316846'), palm2: material('palmLeaf2','#3d8254'),
    rock: material('rock','#858a81'), sky: material('cloud','#ffffff'),
    red: material('redJacket','#c52420',0.78), redDark: material('redStripe','#641a1c'),
    dark: material('charcoal','#252d32'), black: material('blackMetal','#151f22',0.39,0.35),
    olive: material('opponent','#647255'), skin: material('skin','#c59472'),
    silver: material('planeMetal','#a9b3b1',0.48,0.46), canopy: material('parachute','#dd7753'),
    rope: material('rope','#cbd3c7'), yellow: material('flash','#ffe69e',0.2),
  };
  mats.grassBlade.backFaceCulling = false; mats.palm.backFaceCulling = false; mats.palm2.backFaceCulling = false;
  mats.sky.alpha = 0.85; mats.canopy.backFaceCulling = false;
  function part(kind, name, options, mat, parent, x=0,y=0,z=0) {
    const mesh = BAB.MeshBuilder[kind](name,options,scene);
    if (mat) mesh.material = mat;
    if (parent) mesh.parent = parent;
    mesh.position.set(x,y,z);
    mesh.isPickable = false;
    return mesh;
  }
  function sphere(name,r,mat,parent,x,y,z) { return part('CreateSphere',name,{diameter:r,segments:10},mat,parent,x,y,z); }
  function box(name,w,h,d,mat,parent,x,y,z) { return part('CreateBox',name,{width:w,height:h,depth:d},mat,parent,x,y,z); }
  function cylinder(name,d,h,mat,parent,x,y,z) { return part('CreateCylinder',name,{height:h,diameter:d,tessellation:9},mat,parent,x,y,z); }
  function terrain() {
    const s=340,n=124, positions=[],indices=[],uvs=[],colors=[];
    for(let j=0;j<=n;j++)for(let i=0;i<=n;i++){
      const x=(i/n-.5)*s*2,z=(j/n-.5)*s*2,y=height(x,z);
      positions.push(x,y,z); uvs.push(x/12,z/12);
      const mix = 0.08*Math.sin(x*.41+z*.37)+0.05*Math.cos(z*.7-x*.39);
      const c = new BAB.Color3(clamp(.41+mix+y*.006,.27,.62),clamp(.54+mix+y*.007,.38,.72),clamp(.25+mix*.6,.18,.39));
      colors.push(c.r,c.g,c.b,1);
    }
    for(let j=0;j<n;j++)for(let i=0;i<n;i++){
      const a=j*(n+1)+i,b=a+1,c=a+n+1,d=c+1;
      indices.push(a,c,b,b,c,d);
    }
    const normals=[];BAB.VertexData.ComputeNormals(positions,indices,normals);
    const data=new BAB.VertexData(); data.positions=positions;data.indices=indices;data.normals=normals;data.uvs=uvs;data.colors=colors;
    const mesh=new BAB.Mesh('island',scene);data.applyToMesh(mesh);mesh.material=mats.grass;
    mesh.receiveShadows=true;
    return mesh;
  }
  terrain();
  // Crossed grass clumps are GPU thin instances, not one draw call per blade.
  function grass() {
    const a=part('CreatePlane','grassBladeA',{width:.13,height:.72,sideOrientation:BAB.Mesh.DOUBLESIDE},mats.grassBlade,null,0,.36,0);
    const b=part('CreatePlane','grassBladeB',{width:.13,height:.72,sideOrientation:BAB.Mesh.DOUBLESIDE},mats.grassBlade,null,0,.36,0);
    b.rotation.y=Math.PI/2;b.bakeCurrentTransformIntoVertices();
    a.bakeCurrentTransformIntoVertices();
    const blade=BAB.Mesh.MergeMeshes([a,b],true,true,undefined,false,true);blade.name='grassThinInstances';
    const count=isTouch?2300:4200, data=new Float32Array(count*16);
    for(let i=0;i<count;i++){
      const x=(rnd()-.5)*440,z=(rnd()-.5)*440;
      const s=.6+rnd()*.85;
      const m=BAB.Matrix.Compose(new BAB.Vector3(s,s,s),BAB.Quaternion.RotationAxis(BAB.Axis.Y,rnd()*6.283),new BAB.Vector3(x,height(x,z),z));
      m.copyToArray(data,i*16);
    }
    blade.thinInstanceSetBuffer('matrix',data,16,true);
    blade.alwaysSelectAsActiveMesh=true;
  }
  grass();
  // Procedural single-polygon palm fronds (two-sided, bent along the length).
  function leaf(parent,angle,length,mat,index) {
    const p=[],ind=[]; const segs=8;
    for(let i=0;i<=segs;i++){
      const t=i/segs,rad=0.6+length*t,spread=Math.sin(t*Math.PI)*.57;
      const bend=2.7*Math.sin(t*Math.PI*.85)-2.4*t*t;
      for(const side of [-1,1]){
        const r=rad,off=side*spread;
        p.push(Math.sin(angle)*r+Math.cos(angle)*off,3.0+bend,Math.cos(angle)*r-Math.sin(angle)*off);
      }
      if(i<segs){const a=i*2;ind.push(a,a+2,a+1,a+1,a+2,a+3);}
    }
    const n=[];BAB.VertexData.ComputeNormals(p,ind,n);
    const mesh=new BAB.Mesh('frond'+index,scene),v=new BAB.VertexData();
    v.positions=p;v.indices=ind;v.normals=n;v.applyToMesh(mesh);
    mesh.parent=parent;mesh.material=mat;mesh.isPickable=false;
  }
  function palm(x,z,scale,idx) {
    const root=new BAB.TransformNode('palm'+idx,scene);root.position.set(x,height(x,z),z);root.scaling.setAll(scale);
    const stem=cylinder('trunk',.37,6.2,mats.trunk,root,0,2.7,0);
    stem.rotation.z=.08*Math.sin(idx);shadow.addShadowCaster(stem);
    for(let k=0;k<7;k++) leaf(root,k*2*Math.PI/7,4.5+(k%3)*.65,k%2?mats.palm:mats.palm2,k);
    return root;
  }
  for(let i=0;i<(isTouch?25:42);i++) {
    const x=(rnd()-.5)*380,z=(rnd()-.5)*380;
    if(Math.hypot(x,z)<19)continue;
    palm(x,z,.72+rnd()*.7,i);
  }
  const rockTemplate=part('CreateIcoSphere','rockMaster',{radius:1.15,subdivisions:1},mats.rock);
  const rocks=isTouch?58:115;
  for(let i=0;i<rocks;i++){
    const x=(rnd()-.5)*370,z=(rnd()-.5)*370;
    const r=rockTemplate.createInstance('rock'+i); const s=.45+rnd()*2;
    r.scaling.set(s,s*(.4+rnd()*.45),s*.8);r.position.set(x,height(x,z)-.05,z);r.rotation.y=rnd()*6.28;
  }
  rockTemplate.setEnabled(false);
  // Soft cloud banks in the distance, and a fully procedural sky shader.
  try {
    BAB.Effect.ShadersStore.sdLabSkyVertexShader=`precision highp float;attribute vec3 position;uniform mat4 worldViewProjection;varying vec3 direction;void main(){direction=position;gl_Position=worldViewProjection*vec4(position,1.0);}`;
    BAB.Effect.ShadersStore.sdLabSkyFragmentShader=`precision highp float;varying vec3 direction;void main(){float h=clamp(normalize(direction).y,0.,1.);vec3 horizon=vec3(.74,.88,1.);vec3 zenith=vec3(.065,.32,.72);vec3 c=mix(horizon,zenith,pow(h,.67));gl_FragColor=vec4(c,1.);}`;
    const sky=part('CreateSphere','skyDome',{diameter:900,segments:20,sideOrientation:BAB.Mesh.BACKSIDE});
    sky.infiniteDistance=true;sky.isPickable=false;sky.applyFog=false;
    sky.material=new BAB.ShaderMaterial('skyShader',scene,{vertex:'sdLabSky',fragment:'sdLabSky'},{attributes:['position'],uniforms:['worldViewProjection']});
    sky.material.backFaceCulling=false;sky.material.disableDepthWrite=true;
  }catch(e){console.warn('Sky shader fallback',e);}
  for(let i=0;i<17;i++){
    const root=new BAB.TransformNode('cloud'+i,scene);
    root.position.set((rnd()-.5)*590,70+rnd()*48,(rnd()-.5)*590);
    const s=7+rnd()*12;
    for(let k=0;k<3;k++){
      const cloud=sphere('cloudPart',1,mats.sky,root,(k-1)*s*.65,Math.sin(k*2)*2,0);
      cloud.scaling.set(s*.7,s*.18,s*.32);
    }
  }
  // Original red-jacket character. Placeholder model; a licensed animated GLB is needed for screenshot parity.
  function humanoid(name,mat,x,z,armed) {
    const root=new BAB.TransformNode(name,scene); root.position.set(x,height(x,z),z);
    const torso=box('torso',.84,1.24,.48,mat,root,0,1.52,0);
    const chest=box('vest',.58,.62,.1,mats.dark,root,0,1.54,.26);
    const head=sphere('head',.47,mats.skin,root,0,2.5,0);
    const hair=sphere('hair',.49,mats.black,root,0,2.67,0);hair.scaling.y=.45;
    const legs=[];
    for(const s of [-1,1]){
      const leg=cylinder('leg',.25,1.05,mats.dark,root,s*.23,.53,0);legs.push(leg);
      cylinder('boot',.32,.23,mats.black,root,s*.23,.11,-.12);
      const arm=cylinder('arm',.26,1.07,mat,root,s*.55,1.63,.23);
      arm.rotation.z=s*.42;arm.rotation.x=.62;
    }
    if(armed){
      const backpack=box('backpack',.75,.85,.27,mats.dark,root,0,1.63,-.36);
      box('packTrim',.6,.16,.08,mats.redDark,root,0,1.65,-.54);
      const gun=box('rifle',.14,.14,1.1,mats.black,root,.1,1.68,.86);
      cylinder('barrel',.078,.64,mats.black,root,.1,1.68,1.68).rotation.x=Math.PI/2;
      box('scope',.2,.18,.35,mats.black,root,.1,1.84,.77);
    }
    for(const m of root.getChildMeshes())shadow.addShadowCaster(m);
    return {root,legs};
  }
  const player=humanoid('player',mats.red,0,0,true);
  // Plane and parachutes are modeled in 3D and animate in the scene.
  const planeRoot=new BAB.TransformNode('transportPlane',scene);
  planeRoot.position.set(-105,82,150); planeRoot.rotation.y=-.72;
  cylinder('fuselage',3.0,17,mats.silver,planeRoot,0,0,0).rotation.x=Math.PI/2;
  box('wings',28,.38,4,mats.silver,planeRoot,0,.1,1);
  box('tailWing',10,.22,2.4,mats.silver,planeRoot,0,1,7.5);
  box('tailFin',.55,4,3,mats.silver,planeRoot,0,2.1,7.6);
  for(const x of [-9,-4,4,9])cylinder('engine',1.5,3,mats.dark,planeRoot,x,-.5,.8).rotation.x=Math.PI/2;
  const parachutes=[];
  for(let i=0;i<6;i++){
    const root=new BAB.TransformNode('parachute'+i,scene);
    root.position.set(-45+i*20,38+i*8,48+i*18);
    const canopy=part('CreateSphere','canopy',{diameter:5.5,segments:14,slice:.5},i%2?mats.canopy:mats.sand,root,0,5,0);
    canopy.scaling.y=.58;
    sphere('paraHead',.5,mats.dark,root,0,1,0);
    cylinder('paraBody',.33,.8,mats.dark,root,0,.4,0);
    for(let k=0;k<6;k++){
      const a=k*Math.PI/3;
      const p=[new BAB.Vector3(Math.sin(a)*2.2,5,Math.cos(a)*2.2),new BAB.Vector3(0,0.8,0)];
      const cord=part('CreateLines','cord',{points:p},null,root);cord.color=new BAB.Color3(.7,.7,.7);
    }
    parachutes.push({root,x:root.position.x,z:root.position.z,fall:.18+rnd()*.27});
  }
  const enemies=[];
  for(let i=0;i<5;i++){
    const x=[-24,23,-41,45,11][i],z=[35,39,64,72,95][i];
    const unit=humanoid('target'+i,mats.olive,x,z,false);
    box('targetBadge',.32,.32,.1,mats.yellow,unit.root,0,1.75,.3);
    enemies.push({unit,x,z,alive:true,phase:i*2});
  }
  const input={up:false,down:false,left:false,right:false,shift:false}, pointer={drag:false,x:0,y:0,moved:false};
  const keys={KeyW:'up',ArrowUp:'up',KeyS:'down',ArrowDown:'down',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',ShiftLeft:'shift',ShiftRight:'shift'};
  window.addEventListener('keydown',e=>{const k=keys[e.code];if(k){input[k]=true;e.preventDefault();}if(e.code==='Space')shoot();});
  window.addEventListener('keyup',e=>{const k=keys[e.code];if(k){input[k]=false;e.preventDefault();}});
  window.addEventListener('blur',()=>{Object.keys(input).forEach(k=>input[k]=false);pointer.drag=false;});
  canvas.addEventListener('pointerdown',e=>{pointer.drag=true;pointer.x=e.clientX;pointer.y=e.clientY;pointer.moved=false;canvas.setPointerCapture(e.pointerId);});
  let yaw=0,pitch=.23,health=100,score=0,lastShot=0,lastEnemyAttack=0,started=false,done=false,stepT=0,prevTime=0,fpsTime=0,fpsFrames=0;
  canvas.addEventListener('pointermove',e=>{
    if(!pointer.drag)return;
    const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;
    if(Math.abs(dx)+Math.abs(dy)>2)pointer.moved=true;
    yaw-=dx*.004; pitch=clamp(pitch+dy*.002,-.23,.69);
    pointer.x=e.clientX;pointer.y=e.clientY;
  });
  canvas.addEventListener('pointerup',()=>{if(!pointer.moved)shoot();pointer.drag=false;});
  canvas.addEventListener('pointercancel',()=>{pointer.drag=false;});
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  for(const btn of document.querySelectorAll('[data-dir]')){
    const direction=btn.dataset.dir;
    btn.addEventListener('pointerdown',e=>{e.preventDefault();input[direction]=true;btn.setPointerCapture(e.pointerId);});
    for(const type of ['pointerup','pointercancel','lostpointercapture'])btn.addEventListener(type,()=>input[direction]=false);
  }
  $('fire').addEventListener('pointerdown',e=>{e.preventDefault();shoot();});
  function notify(t){$('message').textContent=t;}
  const tracers=[];
  function shoot(){
    if(!started||done)return;
    const t=performance.now();if(t-lastShot<180)return;lastShot=t;
    const forward=new BAB.Vector3(Math.sin(yaw),0,Math.cos(yaw));
    const muzzle=player.root.position.add(new BAB.Vector3(Math.sin(yaw)*.7+Math.cos(yaw)*.14,1.68,Math.cos(yaw)*.7-Math.sin(yaw)*.14));
    let best=null,bestDist=0.13;
    const view=BAB.Matrix.Identity(),proj=scene.getTransformMatrix();
    const viewport=new BAB.Viewport(0,0,engine.getRenderWidth(),engine.getRenderHeight());
    for(const enemy of enemies){
      if(!enemy.alive)continue;
      const center=enemy.unit.root.position.add(new BAB.Vector3(0,1.6,0));
      if(BAB.Vector3.Distance(center,player.root.position)>140)continue;
      const p=BAB.Vector3.Project(center,view,proj,viewport);
      const off=Math.hypot((p.x-engine.getRenderWidth()*.5)/engine.getRenderWidth(),(p.y-engine.getRenderHeight()*.48)/engine.getRenderHeight());
      if(p.z>0&&p.z<1&&off<bestDist){bestDist=off;best=enemy;}
    }
    let target=muzzle.add(forward.scale(70));
    if(best){best.alive=false;best.unit.root.setEnabled(false);score++;$('score').textContent=score;$('enemies').textContent=5-score;
      target=new BAB.Vector3(best.x,height(best.x,best.z)+1.6,best.z);
      notify(score===5?'Mission abgeschlossen – alle fünf Ziele getroffen!':'Treffer bestätigt · '+score+' / 5');
      if(score===5){done=true;$('message').textContent='MISSION ERFÜLLT · Seite neu laden für einen Neustart';}
    }
    const line=BAB.MeshBuilder.CreateLines('shot',{points:[muzzle,target]},scene);
    line.color=new BAB.Color3(1,.78,.34);line.isPickable=false;tracers.push({line,age:.075});
    const flash=sphere('flash',.35,mats.yellow,null,muzzle.x,muzzle.y,muzzle.z);tracers.push({line:flash,age:.08});
  }
  function move(dt){
    const vx=(Number(input.right)-Number(input.left)),vz=(Number(input.up)-Number(input.down));
    const len=Math.hypot(vx,vz);
    if(len){const v=(input.shift?11:6)*dt/len;
      const sx=Math.sin(yaw),cz=Math.cos(yaw);
      player.root.position.x=clamp(player.root.position.x+(sx*vz+cz*vx)*v,-265,265);
      player.root.position.z=clamp(player.root.position.z+(cz*vz-sx*vx)*v,-265,265);
      stepT+=dt*(input.shift?15:9);
      player.legs[0].rotation.x=Math.sin(stepT)*.42;
      player.legs[1].rotation.x=-Math.sin(stepT)*.42;
    }else{player.legs[0].rotation.x=0;player.legs[1].rotation.x=0;}
    const pos=player.root.position;
    pos.y=height(pos.x,pos.z);
    player.root.rotation.y=yaw;
    const forward=new BAB.Vector3(Math.sin(yaw),0,Math.cos(yaw));
    const right=new BAB.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
    const dest=pos.subtract(forward.scale(8.8)).add(right.scale(2.7));
    dest.y=pos.y+4.2+pitch*10;
    camera.position=BAB.Vector3.Lerp(camera.position,dest,clamp(dt*9,0,1));
    camera.setTarget(pos.add(new BAB.Vector3(0,1.8,0)).add(forward.scale(8)));
  }
  function animate(dt,t){
    move(dt);
    planeRoot.position.x+=dt*5.3;
    if(planeRoot.position.x>200)planeRoot.position.x=-210;
    for(const p of parachutes){
      p.root.position.y-=dt*p.fall;
      p.root.position.x+=dt*.38;
      p.root.rotation.z=.08*Math.sin(t*.75+p.x);
      if(p.root.position.y<height(p.root.position.x,p.root.position.z)+4){p.root.position.y=63;p.root.position.x=p.x;p.root.position.z=p.z;}
    }
    for(const e of enemies){
      if(!e.alive)continue;
      const d=BAB.Vector3.Distance(e.unit.root.position,player.root.position);
      if(d<32&&d>7){const amount=dt*.8;
        e.unit.root.position.x+=(player.root.position.x-e.unit.root.position.x)/d*amount;
        e.unit.root.position.z+=(player.root.position.z-e.unit.root.position.z)/d*amount;
      }
      e.unit.root.position.y=height(e.unit.root.position.x,e.unit.root.position.z)+.05*Math.sin(t*2+e.phase);
      e.unit.root.rotation.y=Math.atan2(player.root.position.x-e.unit.root.position.x,player.root.position.z-e.unit.root.position.z);
      if(d<10&&t-lastEnemyAttack>1.8){lastEnemyAttack=t;health=Math.max(0,health-6);$('healthFill').style.width=health+'%';
        if(health===0){done=true;notify('MISSION GESCHEITERT · Seite neu laden zum Neustart');}
      }
    }
    for(let i=tracers.length-1;i>=0;i--){tracers[i].age-=dt;if(tracers[i].age<=0){tracers[i].line.dispose();tracers.splice(i,1);}}
  }
  engine.runRenderLoop(()=>{
    const t=performance.now()*.001,dt=Math.min(.05,prevTime?t-prevTime:0);prevTime=t;
    if(started&&!done)animate(dt,t);
    scene.render();
    fpsFrames++;
    if(t-fpsTime>1){$('fps').textContent=Math.round(fpsFrames/(t-fpsTime));fpsTime=t;fpsFrames=0;}
  });
  start.addEventListener('click',()=>{started=true;intro.hidden=true;canvas.focus();});
  window.addEventListener('resize',()=>engine.resize());
  window.addEventListener('pagehide',()=>{engine.stopRenderLoop();scene.dispose();engine.dispose();},{once:true});
  // UI remains usable in a CDN outage: loading error is displayed above before any scene is created.
})();
