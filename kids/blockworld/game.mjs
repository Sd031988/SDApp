import {
 SAVE_KEY,BLOCK_COLORS,CRYSTALS,PARKOUR,newSave,restoreSave,cleanName,
 claimCrystal,placeBlock,removeBlock,reachParkour,landingY,localDay
} from './core.mjs';
import {BlockWorldOnline} from './online.mjs';

const $=id=>document.getElementById(id);
const swatches={mint:0x52ddb2,blue:0x65b4ff,pink:0xff83af,yellow:0xffd761,purple:0xa68af6,orange:0xff9c61};
let state=restoreSave((()=>{try{return localStorage.getItem(SAVE_KEY)}catch{return null}})(),localDay());
let dirty=false,player=null,THREE,scene,camera,renderer,ground,blockGroup,crystalGroup;
let buildMode=false,eraseMode=false,buildLevel=0,selectedColor='mint',yaw=0.35,pitch=.62,paused=false;
let feetY=0,velocityY=0,grounded=true,jumpQueued=false,elapsed=0,lastTime=0,noticeTimer=0;
const keys={forward:false,back:false,left:false,right:false};
const blockMeshes=new Map(),crystalMeshes=new Map();
const remoteAvatars=new Map(),remoteBlocks=new Map();
let remoteAvatarLayer=null,remoteBlockLayer=null;
let remoteBlocksChecksum='';
const online=new BlockWorldOnline({
 onState:updateRemoteWorld,
 onStatus(message){$('onlineStatus').textContent=message}
});
function refreshOnlineButtons(){
 $('onlineLeave').disabled=!online.connected;
 $('onlineJoin').textContent=online.connected?'🌐 Raum wechseln':'🌐 Online beitreten';
}
function createRemoteAvatar(color){
 const group=new THREE.Group(),body=mat(swatches[color]||swatches.blue);
 cube(group,swatches[color]||swatches.blue,0,1.2,0,.84,1.05,.48);
 cube(group,0xf3c59e,0,2.12,0,.66,.66,.66);
 cube(group,0x485782,-.22,.38,0,.34,.77,.37);
 cube(group,0x485782,.22,.38,0,.34,.77,.37);
 cube(group,0x27334c,0,2.53,0,.75,.15,.7);
 group.userData.shirt=group.children[0].material;
 remoteAvatarLayer.add(group);return group;
}
function updateRemoteWorld(payload){
 if(!scene)return;
 const peers=Array.isArray(payload.players)?payload.players.slice(0,12):[];
 const found=new Set();
 for(const p of peers){
  if(!p||typeof p.id!=='string'||!/^[a-f0-9]{16}$/.test(p.id))continue;
  found.add(p.id);
  let obj=remoteAvatars.get(p.id);
  if(!obj){obj=createRemoteAvatar(p.color);remoteAvatars.set(p.id,obj)}
  obj.userData.target={x:p.x,y:p.y,z:p.z,heading:p.heading};
  obj.userData.shirt.color.setHex(swatches[p.color]||swatches.blue);
 }
 for(const [id,obj] of remoteAvatars)if(!found.has(id)){
  remoteAvatarLayer.remove(obj);
  obj.traverse(n=>{n.geometry?.dispose();n.material?.dispose()});
  remoteAvatars.delete(id);
 }
 $('onlinePlayers').textContent=String(remoteAvatars.size);
 const blocks=Array.isArray(payload.blocks)?payload.blocks.slice(0,160):[];
 const checksum=JSON.stringify(blocks);
 if(checksum!==remoteBlocksChecksum){
  remoteBlocksChecksum=checksum;
  for(const obj of remoteBlocks.values()){
   remoteBlockLayer.remove(obj);obj.geometry.dispose();obj.material.dispose();
  }
  remoteBlocks.clear();
  for(const b of blocks){
   if(!Number.isInteger(b.x)||!Number.isInteger(b.z)||!Number.isInteger(b.level)||b.level<0||b.level>3||!(b.color in swatches))continue;
   const obj=new THREE.Mesh(new THREE.BoxGeometry(1.8,1.6,1.8),
     new THREE.MeshStandardMaterial({color:swatches[b.color],transparent:true,opacity:.79,roughness:.7}));
   obj.position.set(b.x,(b.level+.5)*1.6,b.z);obj.castShadow=true;obj.receiveShadow=true;
   remoteBlockLayer.add(obj);remoteBlocks.set(keyFor(b),obj);
  }
 }
 window.__blockWorldOnlineVisible={players:remoteAvatars.size,blocks:remoteBlocks.size};
}
function updateRemoteAvatars(){
 for(const obj of remoteAvatars.values()){
  const p=obj.userData.target;if(!p)continue;
  obj.position.lerp(new THREE.Vector3(p.x,Math.max(0,p.y),p.z),.18);
  obj.rotation.y=p.heading||0;
 }
}
const PAUSE_COLOR=0x142443;
const updateHud=()=>{
 $('tokens').textContent=String(state.tokens);
 $('crystals').textContent=String(state.crystals.length);
 $('builds').textContent=String(state.buildCount);
 $('obby').textContent=String(state.parkourProgress);
 const complete=(id,flag)=>{
  const el=$(id);el.classList.toggle('done',flag);
  el.setAttribute('aria-label',(flag?'Erledigt: ':'Offen: ')+el.textContent.replace(/^✓ /,''));
 };
 complete('questCrystal',state.crystals.length>=CRYSTALS.length);
 complete('questBuild',state.buildCount>=5);
 complete('questObby',state.parkourWins>=1);
};
function notify(message){
 const element=$('notice');element.textContent=message;element.classList.add('visible');
 clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>element.classList.remove('visible'),2700);
}
function saveNow(){
 if(player){state.x=Math.round(player.position.x*100)/100;state.z=Math.round(player.position.z*100)/100}
 try{localStorage.setItem(SAVE_KEY,JSON.stringify(state));dirty=false}catch{notify('Speichern im Browser ist nicht verfügbar.')}
}
const changed=()=>{dirty=true;updateHud()};
const todayRefresh=()=>{
 const fresh=restoreSave(state,localDay());
 if(fresh.day!==state.day){state=fresh;return true}
 return false;
};
const clamp=(n,low,high)=>Math.max(low,Math.min(high,n));
const keyFor=b=>b.x+':'+b.z+':'+b.level;
const getCell=(x,z,level=buildLevel,color=selectedColor)=>({
 x:clamp(Math.round(x/2)*2,-20,20),z:clamp(Math.round(z/2)*2,-20,20),level,color
});
const reduceMotion=()=>!!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

async function start(){
 try{
  THREE=await import('https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js');
  initialiseWorld();
  bindControls();
  updateHud();
  $('nickname').value=state.nickname;
  [...document.querySelectorAll('[data-color]')].forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.color===selectedColor)));
  renderAvatarColor();
  $('fallback').hidden=true;
  window.__blockWorldReady=true;
  notify('Willkommen in deiner Blockwelt! 🌈');
  requestAnimationFrame(frame);
 }catch(error){
  console.error('BlockWorld could not start',error);
  $('fallback').innerHTML='<span>🛠️</span><strong>Die 3D-Welt konnte nicht geladen werden.</strong><p>Bitte WebGL und Internetverbindung prüfen und die Seite neu laden.</p>';
  window.__blockWorldError=String(error);
 }
}
function mat(color,roughness=.8){return new THREE.MeshStandardMaterial({color,roughness})}
function cube(parent,color,x,y,z,w,h,d){
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color));
 mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);
 return mesh;
}
function sphere(parent,color,x,y,z,size){
 const mesh=new THREE.Mesh(new THREE.SphereGeometry(size,12,10),mat(color));
 mesh.position.set(x,y,z);mesh.castShadow=true;parent.add(mesh);return mesh;
}
function label(text,x,y,z){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;
 const ctx=canvas.getContext('2d');
 if(!ctx)return;
 ctx.fillStyle='#172c57';ctx.fillRect(0,0,512,128);
 ctx.strokeStyle='#ffffff';ctx.lineWidth=7;ctx.strokeRect(4,4,504,120);
 ctx.fillStyle='#ffffff';ctx.font='bold 49px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
 ctx.fillText(text,256,65,480);
 const texture=new THREE.CanvasTexture(canvas);
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(4,1),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide,transparent:true}));
 mesh.position.set(x,y,z);scene.add(mesh);return mesh;
}
function makeTree(x,z){
 const tree=new THREE.Group();scene.add(tree);tree.position.set(x,0,z);
 cube(tree,0x9d7457,0,.85,0,.42,1.7,.42);
 for(let i=0;i<3;i++){
  const leaf=new THREE.Mesh(new THREE.ConeGeometry(1.22-i*.15,1.4,6),mat(i%2?0x42bc80:0x3ba873));
  leaf.position.y=1.9+i*.6;leaf.castShadow=true;tree.add(leaf);
 }
}
function makeHouse(x,z,bodyColor,roofColor){
 const home=new THREE.Group();scene.add(home);home.position.set(x,0,z);
 cube(home,bodyColor,0,1.25,0,3,2.5,3);
 const roof=new THREE.Mesh(new THREE.ConeGeometry(2.55,1.7,4),mat(roofColor));
 roof.rotation.y=Math.PI/4;roof.position.y=3.3;roof.castShadow=true;home.add(roof);
 cube(home,0x574a6a,0,.75,1.53,.72,1.5,.12);
 cube(home,0x95d8ed,-.9,1.7,1.54,.65,.68,.1);
 cube(home,0x95d8ed,.9,1.7,1.54,.65,.68,.1);
}
function makePerson(){
 player=new THREE.Group();scene.add(player);
 const skin=mat(0xf3c59e),shirt=mat(swatches.blue),pants=mat(0x43518a);
 const torso=new THREE.Mesh(new THREE.BoxGeometry(.86,1.08,.48),shirt);
 torso.position.y=1.23;torso.castShadow=true;player.add(torso);player.userData.shirt=shirt;
 const head=new THREE.Mesh(new THREE.BoxGeometry(.66,.66,.66),skin);
 head.position.y=2.15;head.castShadow=true;player.add(head);
 cube(player,0x352b4a,0,2.54,0,.73,.15,.7);
 for(const x of [-.15,.15])cube(player,0x26324e,x,2.19,-.342,.075,.085,.034);
 const mouth=cube(player,0xbe6668,0,1.96,-.34,.20,.04,.032);mouth.rotation.z=.03;
 for(const side of [-1,1]){
  const arm=new THREE.Group();arm.position.set(side*.62,1.67,0);player.add(arm);
  cube(arm,swatches.blue,0,-.43,0,.3,.86,.33);player.userData['arm'+side]=arm;
  const leg=new THREE.Group();leg.position.set(side*.24,.71,0);player.add(leg);
  cube(leg,0x5268a1,0,-.33,0,.33,.67,.35);
  cube(leg,0x27324e,0,-.68,-.065,.37,.17,.52);player.userData['leg'+side]=leg;
 }
 player.position.set(state.x,0,state.z);
}
function renderAvatarColor(){
 if(!player)return;
 const color=swatches[state.avatarColor]||swatches.blue;
 player.userData.shirt.color.setHex(color);
 // Change arm sleeves (the BoxGeometry material is unique for each arm).
 for(const side of [-1,1])player.userData['arm'+side].children[0].material.color.setHex(color);
 [...document.querySelectorAll('[data-outfit]')].forEach(button=>{
  button.setAttribute('aria-pressed',String(button.dataset.outfit===state.avatarColor));
 });
}
function initialiseWorld(){
 const world=$('world');
 scene=new THREE.Scene();scene.background=new THREE.Color(0x9cd7ff);
 scene.fog=new THREE.Fog(0xb4e7fa,38,95);
 camera=new THREE.PerspectiveCamera(60,1,.1,150);
 renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
 renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
 renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.domElement.id='blockCanvas';renderer.domElement.tabIndex=0;
 renderer.domElement.setAttribute('aria-label','3D-Spielwelt: Pfeiltasten oder WASD benutzen');
 world.insertBefore(renderer.domElement,world.firstChild);
 scene.add(new THREE.HemisphereLight(0xf5fbff,0x7dab7c,2.25));
 const sun=new THREE.DirectionalLight(0xfff3d6,2.2);
 sun.position.set(-13,28,10);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
 sun.shadow.camera.left=-35;sun.shadow.camera.right=35;sun.shadow.camera.top=35;sun.shadow.camera.bottom=-35;
 scene.add(sun);
 ground=cube(scene,0x73c48b,0,-.3,0,55,.6,55);
 const water=cube(scene,0x53badd,0,-.68,0,64,.12,64);water.receiveShadow=false;
 const grid=new THREE.GridHelper(54,27,0xffffff,0x428b6d);
 grid.position.y=.006;grid.material.transparent=true;grid.material.opacity=.10;scene.add(grid);
 // Original stylized village and scenery, deliberately not copied from Roblox.
 for(const [x,z] of [[-19,-18],[19,-19],[-21,17],[20,18],[3,-21],[-20,-2],[-4,21],[21,-5],
                      [17,4],[-16,10],[-19,-10],[8,20]])makeTree(x,z);
 makeHouse(6,0,0xffdb9e,0xe87c83);
 makeHouse(-3,-17,0xb2c9f5,0x846ac2);
 makeHouse(19,-12,0xffbfd8,0x7978c9);
 const plaza=cube(scene,0xffe7a2,0,-.01,5,7,.06,5);plaza.receiveShadow=false;
 for(let i=0;i<14;i++){const x=-24+i*3.7;sphere(scene,i%2?0xffb5d6:0xffe17a,x,6,-25,.37)}
 label('SD BLOCKWORLD',0,5,-2);
 label('PARKOUR',-11,4,3);
 label('KRISTALLE',11,3,17);
 label('BAUEN',18,3,11);
 // Friendly resident of the town.
 const npc=new THREE.Group();npc.position.set(3.2,0,8.2);scene.add(npc);
 cube(npc,0x81d7cc,0,1.15,0,.8,1,.55);
 cube(npc,0xf2c596,0,2.05,0,.65,.67,.65);
 cube(npc,0x4e527c,-.2,.37,0,.34,.72,.38);cube(npc,0x4e527c,.2,.37,0,.34,.72,.38);
 sphere(npc,0xffffff,-.16,2.08,-.34,.07);sphere(npc,0xffffff,.16,2.08,-.34,.07);
 makePerson();
 blockGroup=new THREE.Group();scene.add(blockGroup);
 remoteAvatarLayer=new THREE.Group();scene.add(remoteAvatarLayer);
 remoteBlockLayer=new THREE.Group();scene.add(remoteBlockLayer);
 for(const b of state.blocks)drawBlock(b);
 crystalGroup=new THREE.Group();scene.add(crystalGroup);
 for(const c of CRYSTALS)if(!state.crystals.includes(c.id))drawCrystal(c);
 const palette=[0xffce66,0xff90ac,0x8dd7ff,0xb997f5,0x80e1b2,0xf8e6aa];
 for(let i=0;i<PARKOUR.length;i++){
  const p=PARKOUR[i];
  const platform=cube(scene,palette[i],p.x,p.top-.23,p.z,p.w,.46,p.d);
  platform.material.roughness=.7;
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.45,.08,8,24),mat(i===PARKOUR.length-1?0xfbe36f:0xffffff));
  ring.position.set(p.x,p.top+.3,p.z);ring.rotation.x=-Math.PI/2;scene.add(ring);
 }
 const resize=()=>{
  const w=Math.max(1,world.clientWidth),h=Math.max(1,world.clientHeight);
  camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);
 };
 if('ResizeObserver' in window)new ResizeObserver(resize).observe(world);
 else window.addEventListener('resize',resize);
 resize();camera.position.set(player.position.x+4,7,player.position.z+9);
}
function drawBlock(b){
 const material=mat(swatches[b.color]||swatches.mint);
 const mesh=new THREE.Mesh(new THREE.BoxGeometry(1.8,1.6,1.8),material);
 mesh.position.set(b.x,(b.level+.5)*1.6,b.z);
 mesh.userData.block=b;mesh.castShadow=true;mesh.receiveShadow=true;
 blockGroup.add(mesh);blockMeshes.set(keyFor(b),mesh);return mesh;
}
function rebuildBlockMeshes(){
 for(const mesh of blockMeshes.values()){
  blockGroup.remove(mesh);mesh.geometry.dispose();mesh.material.dispose();
 }
 blockMeshes.clear();
 for(const b of state.blocks)drawBlock(b);
}
function drawCrystal(c){
 const mesh=new THREE.Mesh(new THREE.OctahedronGeometry(.53),new THREE.MeshStandardMaterial({
  color:0x60e9fb,emissive:0x1492a8,emissiveIntensity:.55,metalness:.28,roughness:.25
 }));
 mesh.position.set(c.x,1,c.z);mesh.castShadow=true;mesh.userData.crystalId=c.id;
 crystalGroup.add(mesh);crystalMeshes.set(c.id,mesh);
}
function refreshCrystals(){
 if(!todayRefresh())return;
 for(const mesh of crystalMeshes.values())crystalGroup.remove(mesh);
 crystalMeshes.clear();for(const crystal of CRYSTALS)drawCrystal(crystal);
 changed();notify('Neuer Tag, neue Kristalle! 💎');
}
function tryPlace(x,z,level=buildLevel){
 const b=getCell(x,z,level);
 if(!placeBlock(state,b)){notify('Hier kannst du keinen Block setzen (oder die Welt ist voll).');return}
 drawBlock(b);changed();
 if(online.connected)online.build('place',b);
 notify(state.buildCount===5?'⭐ Bauaufgabe erledigt! +15 Sterne':'🧱 Block gesetzt!');
}
function tryRemove(b){
 if(!removeBlock(state,b)){notify('Kein eigener Block an dieser Stelle.');return}
 const key=keyFor(b),mesh=blockMeshes.get(key);
 if(mesh){blockGroup.remove(mesh);mesh.geometry.dispose();mesh.material.dispose();blockMeshes.delete(key)}
 changed();
 if(online.connected)online.build('remove',b);
 notify('Block entfernt.');
}
function pointAhead(){
 const heading=player.rotation.y;
 return {x:player.position.x+Math.sin(heading)*3,z:player.position.z-Math.cos(heading)*3};
}
function setBuildMode(enabled){
 buildMode=enabled;eraseMode=false;$('buildControls').hidden=!enabled;
 $('builderBadge').hidden=!enabled;$('mode').setAttribute('aria-pressed',String(enabled));
 $('mode').textContent=enabled?'🔨 Baumodus beenden':'🔨 Baumodus einschalten';
 $('eraseMode').setAttribute('aria-pressed','false');
 notify(enabled?'Bauen: Farbe wählen und Boden antippen!':'Entdecker-Modus aktiv');
}
function rayFromPointer(e){
 const rect=renderer.domElement.getBoundingClientRect();
 const p=new THREE.Vector2((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);
 const ray=new THREE.Raycaster();ray.setFromCamera(p,camera);return ray;
}
function clickCanvas(e){
 if(!buildMode||paused)return;
 const ray=rayFromPointer(e);
 const blockHit=ray.intersectObjects([...blockMeshes.values()],false)[0];
 if(eraseMode){
  if(blockHit)tryRemove(blockHit.object.userData.block);
  else notify('Zum Entfernen einen eigenen Block antippen.');
  return;
 }
 if(blockHit){
  const b=blockHit.object.userData.block;
  tryPlace(b.x,b.z,Math.min(3,b.level+1));return;
 }
 const groundHit=ray.intersectObject(ground,false)[0];
 if(groundHit)tryPlace(groundHit.point.x,groundHit.point.z);
 else notify('Zum Bauen den Boden antippen.');
}
function teleport(dest){
 const locations={
  village:{x:0,z:5},crystals:{x:10,z:12},obby:{x:-12,z:4.3},build:{x:16,z:11}
 };
 const loc=locations[dest];if(!loc)return;
 player.position.x=loc.x;player.position.z=loc.z;feetY=0;velocityY=0;grounded=true;
 state.x=loc.x;state.z=loc.z;saveNow();
 notify({village:'🏡 Willkommen im Dorf!',crystals:'💎 Finde die leuchtenden Kristalle!',
  obby:'🏁 Springe nacheinander auf die Plattformen!',build:'🧱 Hier ist Platz für deine Ideen!'}[dest]);
 if(dest==='build'&&!buildMode)setBuildMode(true);
}
function toggleWorldPause(force){
 paused=typeof force==='boolean'?force:!paused;
 Object.keys(keys).forEach(k=>keys[k]=false);
 $('pauseCover').hidden=!paused;
 $('pauseWorld').textContent=paused?'▶ Weiter':'⏸️ Pause';
 $('pauseWorld').setAttribute('aria-pressed',String(paused));
 if(!paused)lastTime=0;
}
function bindControls(){
 $('pauseWorld').addEventListener('click',()=>toggleWorldPause());
 $('resumeWorld').addEventListener('click',()=>toggleWorldPause(false));
 $('fullWorld').addEventListener('click',async()=>{
  try{
   if(document.fullscreenElement)await document.exitFullscreen();
   else if($('world').requestFullscreen)await $('world').requestFullscreen();
   else notify('Vollbild wird auf diesem Gerät nicht unterstützt.');
  }catch{notify('Vollbild ist hier nicht verfügbar.')}
 });
 document.addEventListener('fullscreenchange',()=>{
  $('fullWorld').textContent=document.fullscreenElement?'⛶ Vollbild beenden':'⛶ Vollbild';
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&!paused)toggleWorldPause(true)});
 online.position=()=>({
   x:player.position.x,z:player.position.z,y:feetY,
   heading:player.rotation.y,color:state.avatarColor
 });
 $('onlineJoin').addEventListener('click',async()=>{
  $('onlineJoin').disabled=true;
  try{
   const ok=await online.join($('onlineRoom').value);
   if(ok){notify('🌐 Du spielst jetzt mit anderen in der gemeinsamen Welt!');online.poll()}
  }finally{$('onlineJoin').disabled=false;refreshOnlineButtons()}
 });
 $('onlineLeave').addEventListener('click',()=>{
  online.disconnect();refreshOnlineButtons();
  $('onlineStatus').textContent='Einzelspieler-Modus aktiv.';
  notify('Du spielst wieder offline.');
 });
 window.addEventListener('pagehide',()=>online.disconnect());
 window.addEventListener('keydown',e=>{
  if(e.target instanceof HTMLInputElement||e.target instanceof HTMLButtonElement)return;
  const k=e.code;
  if(k==='KeyP'&&!e.repeat){e.preventDefault();toggleWorldPause();return}
  if(k==='Escape'&&paused){e.preventDefault();toggleWorldPause(false);return}
  if(paused)return;
  if(['KeyW','ArrowUp','KeyS','ArrowDown','KeyA','ArrowLeft','KeyD','ArrowRight','Space'].includes(k))e.preventDefault();
  if(k==='KeyW'||k==='ArrowUp')keys.forward=true;
  if(k==='KeyS'||k==='ArrowDown')keys.back=true;
  if(k==='KeyA'||k==='ArrowLeft')keys.left=true;
  if(k==='KeyD'||k==='ArrowRight')keys.right=true;
  if(k==='Space')jumpQueued=true;
  if(e.repeat)return;
  if(k==='KeyB')setBuildMode(!buildMode);
  if(k==='Escape'&&buildMode)setBuildMode(false);
  if(k==='KeyE'&&buildMode){const p=pointAhead();tryPlace(p.x,p.z)}
  if(k==='KeyR'&&buildMode){const p=getCell(pointAhead().x,pointAhead().z);
   const found=state.blocks.find(b=>b.x===p.x&&b.z===p.z&&b.level===buildLevel);
   if(found)tryRemove(found);else notify('Hier ist kein eigener Block.')}
 });
 window.addEventListener('keyup',e=>{
  if(e.code==='KeyW'||e.code==='ArrowUp')keys.forward=false;
  if(e.code==='KeyS'||e.code==='ArrowDown')keys.back=false;
  if(e.code==='KeyA'||e.code==='ArrowLeft')keys.left=false;
  if(e.code==='KeyD'||e.code==='ArrowRight')keys.right=false;
 });
 window.addEventListener('blur',()=>Object.keys(keys).forEach(k=>keys[k]=false));
 for(const b of document.querySelectorAll('[data-key]')){
  const key=b.dataset.key;
  b.addEventListener('pointerdown',e=>{
   e.preventDefault();if(paused)return;keys[key]=true;try{b.setPointerCapture(e.pointerId)}catch{}
  });
  for(const evt of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(evt,()=>keys[key]=false);
 }
 $('jump').addEventListener('pointerdown',e=>{e.preventDefault();if(!paused)jumpQueued=true});
 $('jump').addEventListener('click',()=>{if(!paused)jumpQueued=true});
 $('mode').addEventListener('click',()=>setBuildMode(!buildMode));
 $('place').addEventListener('click',()=>{const p=pointAhead();tryPlace(p.x,p.z)});
 $('eraseMode').addEventListener('click',()=>{
  eraseMode=!eraseMode;$('eraseMode').setAttribute('aria-pressed',String(eraseMode));
  notify(eraseMode?'Zum Löschen einen eigenen Block antippen.':'Setzen ist wieder aktiv.');
 });
 $('up').addEventListener('click',()=>{$('level').textContent=String((buildLevel=Math.min(3,buildLevel+1))+1)});
 $('down').addEventListener('click',()=>{$('level').textContent=String((buildLevel=Math.max(0,buildLevel-1))+1)});
 for(const button of document.querySelectorAll('[data-color]'))button.addEventListener('click',()=>{
  selectedColor=button.dataset.color;
  document.querySelectorAll('[data-color]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 });
 for(const button of document.querySelectorAll('[data-outfit]'))button.addEventListener('click',()=>{
  state.avatarColor=button.dataset.outfit;renderAvatarColor();changed();
 });
 for(const button of document.querySelectorAll('[data-travel]'))button.addEventListener('click',()=>teleport(button.dataset.travel));
 $('exportWorld').addEventListener('click',()=>{
  const payload={kind:'sd-blockworld-map',version:1,blocks:state.blocks};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const link=document.createElement('a'),url=URL.createObjectURL(blob);
  link.href=url;link.download='meine-sd-blockworld.json';document.body.appendChild(link);
  link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
  notify('📤 Deine Welt wurde als Datei gespeichert.');
 });
 $('importWorld').addEventListener('click',()=>$('importFile').click());
 $('importFile').addEventListener('change',async event=>{
  const file=event.target.files?.[0];if(!file)return;
  event.target.value='';
  if(file.size>150000){notify('Diese Welt-Datei ist zu groß.');return}
  try{
   const data=JSON.parse(await file.text());
   if(data.kind!=='sd-blockworld-map'||!Array.isArray(data.blocks))throw Error('unknown map');
   const validated=restoreSave({blocks:data.blocks},localDay());
   state.blocks=validated.blocks;
   rebuildBlockMeshes();changed();saveNow();
   notify('📥 Deine Blockwelt ist geladen! '+state.blocks.length+' Blöcke.');
  }catch{notify('Die Datei ist keine gültige SD-BlockWorld-Welt.')}
 });
 $('nickname').addEventListener('change',()=>{
  state.nickname=cleanName($('nickname').value);$('nickname').value=state.nickname;changed();notify('Hallo, '+state.nickname+'!');
 });
 $('save').addEventListener('click',()=>{saveNow();notify('💾 Welt und Spielfigur gespeichert!')});
 $('reset').addEventListener('click',()=>{
  if(!window.confirm('Deine Bauwerke, Kristalle und Sterne wirklich zurücksetzen?'))return;
  state=newSave();player.position.set(0,0,5);feetY=0;velocityY=0;grounded=true;saveNow();window.location.reload();
 });
 window.addEventListener('pagehide',saveNow);
 let dragging=null;
 renderer.domElement.addEventListener('pointerdown',e=>{
  dragging={x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:false};
  try{renderer.domElement.setPointerCapture(e.pointerId)}catch{}
 });
 renderer.domElement.addEventListener('pointermove',e=>{
  if(!dragging)return;
  const dx=e.clientX-dragging.lastX,dy=e.clientY-dragging.lastY;
  if(Math.abs(e.clientX-dragging.x)+Math.abs(e.clientY-dragging.y)>9)dragging.moved=true;
  if(dragging.moved){yaw-=dx*.005;pitch=clamp(pitch+dy*.005,.2,1.18)}
  dragging.lastX=e.clientX;dragging.lastY=e.clientY;
 });
 renderer.domElement.addEventListener('pointerup',e=>{
  if(dragging&&!dragging.moved)clickCanvas(e);
  dragging=null;
 });
 renderer.domElement.addEventListener('pointercancel',()=>dragging=null);
 renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());
}
let lastSave=0,lastNPC=0,lastDailyCheck=0;
function frame(now){
 requestAnimationFrame(frame);
 if(paused){lastTime=now;renderer.render(scene,camera);return}
 const dt=Math.min(.045,Math.max(0,(now-lastTime)/1000||.016));lastTime=now;elapsed+=dt;
 const forward=Number(keys.forward)-Number(keys.back);
 const right=Number(keys.right)-Number(keys.left);
 const length=Math.hypot(forward,right);
 const moving=length>.01;
 if(moving){
  const mx=(Math.sin(yaw)*forward+Math.cos(yaw)*right)/length;
  const mz=(-Math.cos(yaw)*forward+Math.sin(yaw)*right)/length;
  player.position.x=clamp(player.position.x+mx*5.4*dt,-26.3,26.3);
  player.position.z=clamp(player.position.z+mz*5.4*dt,-26.3,26.3);
  player.rotation.y=Math.atan2(mx,-mz);
  dirty=true;
 }
 if(jumpQueued&&grounded){
  velocityY=8.8;grounded=false;
  notify('⬆ Sprung!');
 }
 jumpQueued=false;
 if(grounded){
  const support=landingY(feetY+.025,feetY-.09,player.position.x,player.position.z,state);
  if(support===null||Math.abs(support-feetY)>.12)grounded=false;
 }
 if(!grounded){
  const prior=feetY;velocityY-=19.5*dt;feetY+=velocityY*dt;
  if(velocityY<=0){
   const top=landingY(prior,feetY,player.position.x,player.position.z,state);
   if(top!==null){feetY=top;velocityY=0;grounded=true}
  }
 }
 if(feetY< -4||Math.abs(player.position.x)>25.5||Math.abs(player.position.z)>25.5){
  player.position.x=0;player.position.z=5;feetY=0;grounded=true;velocityY=0;
  notify('🌈 Zurück ins Dorf!');
 }
 player.position.y=feetY;
 const swing=moving?(reduceMotion()?.12:.5)*Math.sin(elapsed*11):0;
 for(const side of [-1,1]){
  player.userData['arm'+side].rotation.x=swing*side;
  player.userData['leg'+side].rotation.x=-swing*side;
 }
 for(const [id,mesh] of crystalMeshes){
  mesh.rotation.y=elapsed*1.6+id*.6;mesh.position.y=1+Math.sin(elapsed*2+id)*.17;
  const c=CRYSTALS[id];
  if(Math.hypot(player.position.x-c.x,player.position.z-c.z)<1.25&&feetY<1.2){
   if(claimCrystal(state,id)){
    crystalGroup.remove(mesh);mesh.geometry.dispose();mesh.material.dispose();crystalMeshes.delete(id);
    changed();notify(state.crystals.length===CRYSTALS.length?'🏆 Alle Kristalle gefunden!':'💎 Kristall gesammelt! +5 Sterne');
   }
  }
 }
 const next=PARKOUR[state.parkourProgress];
 if(next&&grounded&&Math.abs(feetY-next.top)<.08&&Math.abs(player.position.x-next.x)<next.w/2&&Math.abs(player.position.z-next.z)<next.d/2){
  const oldWins=state.parkourWins;
  if(reachParkour(state,PARKOUR.indexOf(next))){
   changed();notify(state.parkourWins>oldWins?'🏁 Parcours geschafft! +30 Sterne':'✅ Plattform erreicht!');
  }
 }
 if(now-lastNPC>12000&&Math.hypot(player.position.x-3.2,player.position.z-8.2)<2.6&&feetY<.5){
  lastNPC=now;notify('👋 Hallo '+state.nickname+'! Entdecke die Kristalle und baue deine Welt.');
 }
 // Third-person follow-camera, controlled by pointer gestures.
 const target=new THREE.Vector3(player.position.x,feetY+1.15,player.position.z);
 const distance=9.1;
 const cameraPos=new THREE.Vector3(
  target.x+Math.sin(yaw)*Math.cos(pitch)*distance,
  target.y+Math.sin(pitch)*distance,
  target.z+Math.cos(yaw)*Math.cos(pitch)*distance
 );
 camera.position.lerp(cameraPos,.12);camera.lookAt(target);
 if(now-lastSave>2400&&dirty){saveNow();lastSave=now}
 if(now-lastDailyCheck>60000){lastDailyCheck=now;refreshCrystals()}
 updateRemoteAvatars();
 renderer.render(scene,camera);
}
start();
